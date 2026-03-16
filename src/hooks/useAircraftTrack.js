/**
 * @file useAircraftTrack.js
 * @description Hook to fetch and cache historical track points for a selected aircraft.
 */

import { useState, useEffect, useRef } from 'react';

export function useAircraftTrack(icao24) {
  const [track, setTrack] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const cache = useRef(new Map());

  useEffect(() => {
    if (!icao24) {
      setTrack([]);
      setIsLoading(false);
      return;
    }

    // Check cache first
    if (cache.current.has(icao24)) {
      setTrack(cache.current.get(icao24));
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setTrack([]); // clear immediately on new selection

    async function fetchTrack() {
      try {
        const response = await fetch(`https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=0`);
        if (!response.ok) {
          throw new Error('Track fetch failed');
        }
        const data = await response.json();
        
        if (isMounted) {
          let coordinates = [];
          if (data && data.path && Array.isArray(data.path)) {
            // OpenSky path structure consists of [time, lat, lon, baro_alt, true_track, on_ground]
            coordinates = data.path
              .filter(p => p[1] !== null && p[2] !== null)
              .map(p => [p[1], p[2]]);
          }

          cache.current.set(icao24, coordinates);
          setTrack(coordinates);
        }
      } catch {
        if (isMounted) {
          // Failure sets an empty track and moves on gracefully
          cache.current.set(icao24, []);
          setTrack([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTrack();

    return () => {
      isMounted = false;
    };
  }, [icao24]);

  return { track, isLoading };
}
