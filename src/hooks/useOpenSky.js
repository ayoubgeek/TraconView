// src/hooks/useOpenSky.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { useFlightStore } from '../store/flightStore';
import { POLL_INTERVAL_MS, DEGRADED_POLL_INTERVAL_MS, STALE_AIRCRAFT_MS } from '../lib/constants';

// Token cache (module-level so it persists across re-renders)
let cachedToken = null;
let tokenExpiresAt = 0;

export function useOpenSky() {
  const { 
    selectedRegion, 
    setAircraftData, 
    setConnectionStatus,
    aircraftArray 
  } = useFlightStore();
  
  const [errorTimer, setErrorTimer] = useState(0);
  const consecutiveErrors = useRef(0);
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchFlightData = useCallback(async () => {
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      // Step 1: Get OAuth2 token from our secure serverless backend
      const now = Date.now();
      if (!cachedToken || now >= tokenExpiresAt) {
        const tokenResponse = await fetch('/api/opensky-auth', {
          method: 'POST',
          signal: abortControllerRef.current.signal
        });

        if (!tokenResponse.ok) {
          throw new Error(`OpenSky Auth Error: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        
        cachedToken = tokenData.access_token;
        // Cache token, expiring 60s early for safety
        tokenExpiresAt = now + ((tokenData.expires_in - 60) * 1000);
      }

      // Step 2: Call OpenSky data API via our serverless proxy
      const bounds = selectedRegion.bounds;
      let openSkyUrl = '/api/opensky-proxy/states/all';
      if (selectedRegion.key !== 'GLOBAL') {
        openSkyUrl += `?lamin=${bounds.south}&lamax=${bounds.north}&lomin=${bounds.west}&lomax=${bounds.east}`;
      }

      const fetchHeaders = {};
      if (cachedToken) {
        fetchHeaders['Authorization'] = `Bearer ${cachedToken}`;
      }

      const response = await fetch(openSkyUrl, {
        headers: fetchHeaders,
        signal: abortControllerRef.current.signal
      });

      if (response.status === 429) {
        setConnectionStatus('DEGRADED');
        consecutiveErrors.current = 0;
        cachedToken = null; // Reset token in case it's the cause
        scheduleNext(DEGRADED_POLL_INTERVAL_MS);
        return;
      }

      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid, clear it and retry
        cachedToken = null;
        tokenExpiresAt = 0;
        throw new Error(`Auth error: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const rawData = await response.json();
      
      // Transform raw OpenSky state arrays into aircraft objects
      const timeInSecs = rawData.time || Math.floor(Date.now() / 1000);
      const states = rawData.states || [];
      
      const aircraft = states.map((raw) => {
        const id = raw[0];
        let callsign = raw[1] ? String(raw[1]).trim() : '';
        if (!callsign) callsign = id;
        
        return {
          id,
          callsign,
          country: raw[2],
          lastSeen: raw[4],
          lng: raw[5] !== null ? raw[5] : null,
          lat: raw[6] !== null ? raw[6] : null,
          altitude: raw[7] !== null ? raw[7] * 3.28084 : 0,
          onGround: !!raw[8],
          speed: raw[9] !== null ? raw[9] * 1.94384 : 0,
          heading: raw[10] !== null ? raw[10] : 0,
          verticalRate: raw[11] !== null ? raw[11] * 196.85 : 0,
          squawk: raw[14] !== null ? String(raw[14]) : null,
          spi: !!raw[15],
          source: ['ADSB','ASTERIX','MLAT','FLARM'][raw[16]] || 'UNKNOWN'
        };
      });

      // Filter stale aircraft
      const staleThreshold = timeInSecs - (STALE_AIRCRAFT_MS / 1000);
      const freshAircraft = aircraft.filter(ac => ac.lastSeen >= staleThreshold);
      
      setAircraftData(freshAircraft, Date.now());
      
      // Handle connection status
      consecutiveErrors.current = 0;
      setConnectionStatus('LIVE');
      scheduleNext(POLL_INTERVAL_MS);
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      console.error("Fetch Flight Data Error:", err);
      consecutiveErrors.current += 1;
      
      if (consecutiveErrors.current >= 3) {
        setConnectionStatus('OFFLINE');
        scheduleNext(60000);
      } else {
        scheduleNext(POLL_INTERVAL_MS);
      }
    }
  }, [selectedRegion, setAircraftData, setConnectionStatus]);

  const scheduleNext = (delay) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchFlightData();
    }, delay);
  };

  useEffect(() => {
    // Initial fetch
    fetchFlightData();
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchFlightData]);

  const aircraftArrayRef = useRef([]);
  aircraftArrayRef.current = aircraftArray;

  // Clean up stale aircraft periodically
  useEffect(() => {
    const cleanerInterval = setInterval(() => {
      const current = aircraftArrayRef.current;
      const now = Date.now() / 1000;
      const staleThreshold = now - (STALE_AIRCRAFT_MS / 1000);
      let removedAny = false;
      
      const freshAircraft = current.filter(ac => {
        if (ac.lastSeen < staleThreshold) {
          removedAny = true;
          return false;
        }
        return true;
      });
      
      if (removedAny) {
        setAircraftData(freshAircraft, Date.now());
      }
    }, 10000);
    
    return () => clearInterval(cleanerInterval);
  }, [setAircraftData]);
}
