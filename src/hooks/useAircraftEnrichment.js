/**
 * @file useAircraftEnrichment.js
 * @description Hook to fetch and cache photo and route info for a selected aircraft.
 */

import { useState, useEffect, useRef } from 'react';
import { fetchAircraftPhoto, fetchRouteInfo } from '../services/enrichmentService';

/* eslint-disable react-hooks/set-state-in-effect */

export function useAircraftEnrichment(aircraft) {
  const [photo, setPhoto] = useState(null);
  const [route, setRoute] = useState(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const photoCache = useRef(new Map());
  const routeCache = useRef(new Map());

  useEffect(() => {
    if (!aircraft) {
      setPhoto(null);
      setRoute(null);
      setIsLoadingPhoto(false);
      setIsLoadingRoute(false);
      return;
    }

    const { icao24, callsign } = aircraft;
    let isMounted = true;

    // --- Photo Fetch ---
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

    // --- Route Fetch ---
    if (callsign) {
      const cleanCallsign = callsign.trim();
      if (routeCache.current.has(cleanCallsign)) {
        setRoute(routeCache.current.get(cleanCallsign));
        setIsLoadingRoute(false);
      } else {
        setIsLoadingRoute(true);
        setRoute(null);
        fetchRouteInfo(cleanCallsign).then(res => {
          if (!isMounted) return;
          routeCache.current.set(cleanCallsign, res);
          setRoute(res);
          setIsLoadingRoute(false);
        });
      }
    } else {
      setRoute(null);
      setIsLoadingRoute(false);
    }

    return () => {
      isMounted = false;
    };
  }, [aircraft]);

  return { photo, route, isLoadingPhoto, isLoadingRoute };
}
