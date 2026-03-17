/**
 * @file FlightTrack.jsx
 * @description Renders a live trajectory polyline built from accumulated real-time positions.
 */

import React, { useEffect, useRef, memo } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { useAircraftById } from '../../context/AircraftDataContext';

function FlightTrack({ icao24 }) {
  const aircraft = useAircraftById(icao24);
  const map = useMap();
  const trackRef = useRef([]);
  const lastPosRef = useRef(null);

  useEffect(() => {
    // Reset track when aircraft changes
    trackRef.current = [];
    lastPosRef.current = null;
  }, [icao24]);

  // Accumulate positions as aircraft updates
  if (aircraft?.lat != null && aircraft?.lng != null) {
    const pos = [aircraft.lat, aircraft.lng];
    const last = lastPosRef.current;

    // Only add if position actually changed (> ~100m)
    if (!last || Math.abs(pos[0] - last[0]) > 0.001 || Math.abs(pos[1] - last[1]) > 0.001) {
      trackRef.current.push(pos);
      lastPosRef.current = pos;

      // Cap at 500 points to avoid memory issues
      if (trackRef.current.length > 500) {
        trackRef.current = trackRef.current.slice(-500);
      }
    }
  }

  const track = trackRef.current;

  if (track.length < 2) return null;

  return (
    <Polyline
      positions={track}
      pathOptions={{
        color: '#00D4FF',
        weight: 2.5,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round'
      }}
    />
  );
}

export default memo(FlightTrack);
