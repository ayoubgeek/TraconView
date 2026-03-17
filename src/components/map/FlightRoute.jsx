/**
 * @file FlightRoute.jsx
 * @description Renders a polyline path and airport markers on the map.
 */

import React, { useEffect, memo } from 'react';
import { Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAircraftEnrichment } from '../../hooks/useAircraftEnrichment';
import { useAircraftById } from '../../context/AircraftDataContext';

// Custom airport marker layout matching standard small circle pins
function createAirportIcon(icao, iata) {
  const label = iata || icao;
  return L.divIcon({
    html: `<div class="route-airport-marker"><span>${label}</span></div>`,
    className: 'airport-div-icon',
    iconSize: [8, 8],
    iconAnchor: [4, 4]
  });
}

function FlightRoute({ icao24 }) {
  const map = useMap();
  const aircraft = useAircraftById(icao24);
  const { route } = useAircraftEnrichment(aircraft);

  useEffect(() => {
    if (!route || !route.origin?.lat || !route.destination?.lat || !aircraft?.lat) return;
    
    // Fit bounds to show origin, current pos, and dest
    const bounds = L.latLngBounds([
      [route.origin.lat, route.origin.lon],
      [aircraft.lat, aircraft.lng],
      [route.destination.lat, route.destination.lon]
    ]);
    
    // Animate zoom/pan gracefully over 800ms
    map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.8 });
  }, [route, map, aircraft?.lat]);

  if (!route || !aircraft || !route.origin?.lat || !route.destination?.lat || !aircraft?.lat) {
    return null;
  }

  const { origin, destination } = route;
  
  const fromLatLng = [origin.lat, origin.lon];
  const currentLatLng = [aircraft.lat, aircraft.lng];
  const toLatLng = [destination.lat, destination.lon];

  // Geodesic/Great Circle styling
  return (
    <>
      <Polyline
        positions={[fromLatLng, currentLatLng]}
        pathOptions={{ color: '#06b6d4', weight: 3, opacity: 0.8 }}
      />
      
      <Polyline
        positions={[currentLatLng, toLatLng]}
        pathOptions={{ color: '#06b6d4', weight: 2, opacity: 0.3, dashArray: '6, 8' }}
      />

      <Marker position={fromLatLng} icon={createAirportIcon(origin.icao, origin.iata)} zIndexOffset={900}>
        <Tooltip direction="top" offset={[0, -10]} className="aircraft-tooltip">
          {origin.name || origin.icao}
        </Tooltip>
      </Marker>

      <Marker position={toLatLng} icon={createAirportIcon(destination.icao, destination.iata)} zIndexOffset={900}>
        <Tooltip direction="top" offset={[0, -10]} className="aircraft-tooltip">
          {destination.name || destination.icao}
        </Tooltip>
      </Marker>
    </>
  );
}

export default memo(FlightRoute);
