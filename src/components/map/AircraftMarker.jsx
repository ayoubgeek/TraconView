/**
 * @file AircraftMarker.jsx
 * @description Single animated aircraft marker on the Leaflet map.
 */

import React, { useEffect, useRef, memo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useSelection } from '../../context/SelectionContext';
import { interpolatePosition, clampProgress } from '../../core/map/interpolation';
import { REFRESH_INTERVAL_AUTHENTICATED_MS } from '../../core/opensky/constants';

const airplaneSvg = `
<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" />
</svg>
`;

function AircraftMarkerBase({ aircraft }) {
  const { selectedAircraftId, selectAircraft } = useSelection();
  const markerRef = useRef(null);
  const frameRef = useRef(null);
  
  const isSelected = selectedAircraftId === aircraft.icao24;
  
  const iconHtml = `
    <div class="aircraft-icon-container animate-fade-in" style="transform: rotate(${aircraft.heading || 0}deg);">
      <div class="aircraft-svg-wrapper ${isSelected ? 'selected' : ''}">
        ${airplaneSvg}
      </div>
    </div>
  `;
  
  const icon = L.divIcon({
    html: iconHtml,
    className: 'aircraft-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const animate = () => {
      const now = performance.now();
      const elapsed = now - aircraft.refreshedAt;
      
      const progress = clampProgress(elapsed, REFRESH_INTERVAL_AUTHENTICATED_MS);
      
      const prevLat = aircraft.prevLat ?? aircraft.lat;
      const prevLng = aircraft.prevLng ?? aircraft.lng;
      
      const newLat = interpolatePosition(prevLat, aircraft.lat, progress);
      const newLng = interpolatePosition(prevLng, aircraft.lng, progress);
      
      marker.setLatLng([newLat, newLng]);
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [aircraft.lat, aircraft.lng, aircraft.prevLat, aircraft.prevLng, aircraft.refreshedAt]);

  return (
    <Marker 
      position={[aircraft.lat, aircraft.lng]} 
      icon={icon}
      ref={markerRef}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          selectAircraft(aircraft.icao24);
        }
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} className="aircraft-tooltip">
        {aircraft.callsign || 'Unknown'}
      </Tooltip>
    </Marker>
  );
}

export default memo(AircraftMarkerBase, (prevProps, nextProps) => {
  return prevProps.aircraft === nextProps.aircraft;
});
