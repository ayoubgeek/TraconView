/**
 * @file useAircraftTrack.js
 * @description Builds a live track from real-time aircraft position updates.
 * Records each new position as data refreshes — no external API needed.
 */

import { useState, useEffect, useRef } from 'react';
/* eslint-disable react-hooks/set-state-in-effect */
import { useAircraftById } from '../context/AircraftDataContext';

const MAX_TRACK_POINTS = 500;

export function useAircraftTrack(icao24) {
  const aircraft = useAircraftById(icao24);
  const [track, setTrack] = useState([]);
  const trackRef = useRef([]);
  const lastPosRef = useRef(null);

  // Reset track when aircraft changes
  useEffect(() => {
    trackRef.current = [];
    lastPosRef.current = null;
    setTrack([]);
  }, [icao24]);

  // Accumulate positions as aircraft data updates
  useEffect(() => {
    if (!aircraft || !aircraft.lat || !aircraft.lng) return;

    const pos = [aircraft.lat, aircraft.lng];
    const last = lastPosRef.current;

    // Skip if position hasn't changed (avoid duplicate points)
    if (last && Math.abs(last[0] - pos[0]) < 0.0001 && Math.abs(last[1] - pos[1]) < 0.0001) {
      return;
    }

    lastPosRef.current = pos;
    trackRef.current = [...trackRef.current.slice(-MAX_TRACK_POINTS + 1), pos];
    setTrack([...trackRef.current]);
  }, [aircraft?.lat, aircraft?.lng]);

  return { track, isLoading: false };
}
