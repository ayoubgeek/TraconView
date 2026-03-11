// src/hooks/useOpenSky.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { useFlightStore } from '../store/flightStore';
import { transformOpenSkyAircraft } from '../lib/transformers';
import { POLL_INTERVAL_MS, DEGRADED_POLL_INTERVAL_MS, STALE_AIRCRAFT_MS } from '../lib/constants';

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
      const functionUrl = `${baseUrl}/functions/v1/opensky-proxy?region=${selectedRegion.key}`;
      
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        signal: abortControllerRef.current.signal
      });

      if (response.status === 429) {
        setConnectionStatus('DEGRADED');
        consecutiveErrors.current = 0;
        scheduleNext(DEGRADED_POLL_INTERVAL_MS);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const rawData = await response.json();
      
      // The edge function proxy payload shape is: { time, aircraft: [...raw_arrays], meta: {...} }
      // Because we passed the raw states arrays to save backend compute:
      const now = Date.now();
      const transformed = (rawData.aircraft || []).map(transformOpenSkyAircraft);
      
      // Cleanup stale aircraft: filter locally just to be sure we only store fresh ones.
      // We rely on the `lastSeen` timestamp from API.
      const timeInSecs = rawData.time || Math.floor(now / 1000);
      const staleThreshold = timeInSecs - (STALE_AIRCRAFT_MS / 1000);
      
      const freshAircraft = transformed.filter(ac => ac.lastSeen >= staleThreshold);
      
      setAircraftData(freshAircraft, now);
      
      // Handle connection status logic
      consecutiveErrors.current = 0;
      if (rawData.meta && rawData.meta.creditWarning) {
        setConnectionStatus('DEGRADED');
        scheduleNext(DEGRADED_POLL_INTERVAL_MS);
      } else {
        setConnectionStatus('LIVE');
        scheduleNext(POLL_INTERVAL_MS);
      }
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      console.error("Fetch Flight Data Error:", err);
      consecutiveErrors.current += 1;
      
      if (consecutiveErrors.current >= 3) {
        setConnectionStatus('OFFLINE');
        // Stop polling completely after 3 consecutive failures.
        // Or we could backoff. The spec says "stop polling until the user manually retries or the system recovers."
        // We will pause and wait, maybe check every 60s
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

  // Clean up stale aircraft from the store in case the API doesn't drop them completely
  useEffect(() => {
    const cleanerInterval = setInterval(() => {
      const now = Date.now() / 1000;
      const staleThreshold = now - (STALE_AIRCRAFT_MS / 1000);
      let removedAny = false;
      
      const freshAircraft = aircraftArray.filter(ac => {
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
  }, [aircraftArray, setAircraftData]);
}
