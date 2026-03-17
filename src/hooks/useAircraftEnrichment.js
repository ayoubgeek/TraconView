/**
 * @file useAircraftEnrichment.js
 * @description Hook to fetch and cache photo and route details for a selected aircraft.
 */

import { useState, useEffect, useRef } from 'react';
import { fetchAircraftPhoto } from '../services/enrichmentService';

/* eslint-disable react-hooks/set-state-in-effect */

export function useAircraftEnrichment(aircraft) {
  const [photo, setPhoto] = useState(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);

  const photoCache = useRef(new Map());

  useEffect(() => {
    if (!aircraft) {
      setPhoto(null);
      setIsLoadingPhoto(false);
      return;
    }

    const { icao24 } = aircraft;
    let isMounted = true;

    if (icao24) {
      if (photoCache.current.has(icao24)) {
        setPhoto(photoCache.current.get(icao24));
        setIsLoadingPhoto(false);
      } else {
        setIsLoadingPhoto(true);
        setPhoto(null);
        fetchAircraftPhoto(icao24).then(res => {
          if (!isMounted) return;
          photoCache.current.set(icao24, res);
          setPhoto(res);
          setIsLoadingPhoto(false);
        });
      }
    } else {
      setPhoto(null);
      setIsLoadingPhoto(false);
    }

    return () => {
      isMounted = false;
    };
  }, [aircraft]);

  return { photo, isLoadingPhoto };
}
