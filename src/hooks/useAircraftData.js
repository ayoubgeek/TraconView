/**
 * @file useAircraftData.js
 * @description Main data loop: interval fetching, rate limits, status propagation.
 */

import { useEffect, useRef } from 'react';
import { useTokenManager } from './useTokenManager';
import { useMapViewport } from './useMapViewport';
import { useVisibilityPause } from './useVisibilityPause';
import { useAircraftDataContext } from '../context/AircraftDataContext';
import { useConnectionStatus } from '../context/ConnectionContext';
import { fetchStateVectors } from '../core/opensky/client';
import {
  REFRESH_INTERVAL_AUTHENTICATED_MS,
  REFRESH_INTERVAL_ANONYMOUS_MS,
  STALE_TIMEOUT_MS
} from '../core/opensky/constants';

function getRefreshInterval(authMode) {
  if (authMode === 'authenticated') {
    return REFRESH_INTERVAL_AUTHENTICATED_MS;
  }
  return REFRESH_INTERVAL_ANONYMOUS_MS;
}

export function useAircraftData(map) {
  const bbox = useMapViewport(map);
  const isPaused = useVisibilityPause();
  const { getToken } = useTokenManager();
  const { setAircraftData } = useAircraftDataContext();
  const { status, updateStatus } = useConnectionStatus();
  
  const timerRef = useRef(null);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    if (!bbox || isPaused || status.mode === 'rate-limited') {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let isCancelled = false;

    const doFetch = async () => {
      const token = getToken();
      const res = await fetchStateVectors(bbox, token);
      if (isCancelled) return;

      if (res.ok) {
        const newMap = new Map();
        res.aircraft.forEach(ac => {
          newMap.set(ac.icao24, ac);
        });
        
        setAircraftData(prev => {
          const updated = new Map();
          for (const [id, ac] of newMap.entries()) {
            const existing = prev.get(id);
            if (existing) {
              ac.prevLat = existing.lat;
              ac.prevLng = existing.lng;
            } else {
              ac.prevLat = ac.lat;
              ac.prevLng = ac.lng;
            }
            updated.set(id, ac);
          }
          return updated;
        });

        updateStatus({
          mode: 'live',
          lastRefreshAt: res.timestamp,
          creditsRemaining: res.creditsRemaining,
          retryAfterMs: null
        });
        lastFetchRef.current = res.timestamp;
      } else {
        if (res.error === 'RATE_LIMITED') {
          updateStatus({
            mode: 'rate-limited',
            retryAfterMs: res.retryAfterSeconds * 1000,
            creditsRemaining: res.creditsRemaining
          });
          setTimeout(() => {
            updateStatus({ mode: 'live', retryAfterMs: null });
          }, res.retryAfterSeconds * 1000);
        } else if (res.error === 'NETWORK_ERROR') {
          updateStatus({ mode: 'offline', creditsRemaining: res.creditsRemaining });
        } else if (res.error === 'API_ERROR' || res.error === 'TOKEN_EXPIRED') {
          const now = Date.now();
          if (now - lastFetchRef.current > STALE_TIMEOUT_MS) {
            updateStatus({ mode: 'stale', creditsRemaining: res.creditsRemaining });
          }
        }
      }

      if (!isCancelled && status.mode !== 'rate-limited') {
        const interval = getRefreshInterval(status.authMode);
        timerRef.current = setTimeout(doFetch, interval);
      }
    };

    doFetch();

    return () => {
      isCancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bbox, isPaused, status.mode, status.authMode]); 

}
