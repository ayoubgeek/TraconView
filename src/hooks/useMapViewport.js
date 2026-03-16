/**
 * @file useMapViewport.js
 * @description Listens to map events to provide a debounced BoundingBox.
 */

import { useState, useEffect, useRef } from 'react';
import { VIEWPORT_DEBOUNCE_MS } from '../core/opensky/constants';
import { extractBoundingBox } from '../core/map/viewport';

export function useMapViewport(map) {
  const [bbox, setBbox] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const updateBbox = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setBbox(extractBoundingBox(map));
      }, VIEWPORT_DEBOUNCE_MS);
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBbox(extractBoundingBox(map));

    map.on('moveend', updateBbox);
    map.on('zoomend', updateBbox);

    return () => {
      map.off('moveend', updateBbox);
      map.off('zoomend', updateBbox);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [map]);

  return bbox;
}
