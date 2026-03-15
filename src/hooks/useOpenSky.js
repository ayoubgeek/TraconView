// src/hooks/useOpenSky.js
// Calls OpenSky API directly from the browser.
// OpenSky sends "Access-Control-Allow-Origin: *" — no proxy needed.
import { useEffect, useRef, useCallback } from 'react';
import { useFlightStore } from '../store/flightStore';
import { POLL_INTERVAL_MS, DEGRADED_POLL_INTERVAL_MS, STALE_AIRCRAFT_MS } from '../lib/constants';

const OPENSKY_API = 'https://opensky-network.org/api/states/all';

export function useOpenSky() {
  const {
    selectedRegion,
    setAircraftData,
    setConnectionStatus,
    removeStaleAircraft,
    aircraftArray
  } = useFlightStore();

  const consecutiveErrors = useRef(0);
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchFlightData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const bounds = selectedRegion.bounds;
      const regionKey = selectedRegion.key || 'EUROPE';

      // Build bounding box query params
      const qs = regionKey !== 'GLOBAL'
        ? `?lamin=${bounds.south}&lamax=${bounds.north}&lomin=${bounds.west}&lomax=${bounds.east}`
        : '';

      // Call OpenSky directly — they send Access-Control-Allow-Origin: *
      const response = await fetch(`${OPENSKY_API}${qs}`, {
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 429) {
        setConnectionStatus('DEGRADED');
        consecutiveErrors.current = 0;
        scheduleNext(DEGRADED_POLL_INTERVAL_MS);
        return;
      }

      if (!response.ok) {
        throw new Error(`OpenSky API: ${response.status}`);
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
          source: ['ADSB', 'ASTERIX', 'MLAT', 'FLARM'][raw[16]] || 'UNKNOWN'
        };
      });

      // Filter out aircraft with no position or stale data
      const staleThreshold = timeInSecs - (STALE_AIRCRAFT_MS / 1000);
      const freshAircraft = aircraft.filter(
        ac => ac.lat !== null && ac.lng !== null && ac.lastSeen >= staleThreshold
      );

      setAircraftData(freshAircraft, Date.now());
      removeStaleAircraft(2 * STALE_AIRCRAFT_MS);

      consecutiveErrors.current = 0;
      setConnectionStatus('LIVE');
      scheduleNext(POLL_INTERVAL_MS);

    } catch (err) {
      if (err.name === 'AbortError') return;

      console.error('Fetch Flight Data Error:', err);
      consecutiveErrors.current += 1;

      if (consecutiveErrors.current >= 3) {
        setConnectionStatus('OFFLINE');
        scheduleNext(60000);
      } else {
        scheduleNext(POLL_INTERVAL_MS);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, setAircraftData, setConnectionStatus]);

  const scheduleNext = (delay) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchFlightData();
    }, delay);
  };

  useEffect(() => {
    fetchFlightData();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchFlightData]);

  // Clean up stale aircraft periodically
  const aircraftArrayRef = useRef([]);
  aircraftArrayRef.current = aircraftArray;

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
