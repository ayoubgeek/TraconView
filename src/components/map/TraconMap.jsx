// src/components/map/TraconMap.jsx
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useFlightStore } from '../../store/flightStore';
import AircraftLayer from './AircraftLayer';
import AirspaceLayer from './AirspaceLayer';
import { useMetar } from '../../hooks/useMetar';
import { useAirspaceDetection } from '../../hooks/useAirspaceDetection';
import { usePositionHistory } from '../../hooks/usePositionHistory';
import { useHoldingDetection } from '../../hooks/useHoldingDetection';
import HoldingTrails from './HoldingTrails';
import WeatherLayer from './WeatherLayer';
import MapLegend from './MapLegend';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Component to handle map panning when region changes
function MapViewHandler() {
  const map = useMap();
  const selectedRegion = useFlightStore(state => state.selectedRegion);

  useEffect(() => {
    if (selectedRegion) {
      if (selectedRegion.key === 'GLOBAL') {
        map.setView([20, 0], 3, { animate: true, duration: 1.5 });
      } else {
        const { south, west, north, east } = selectedRegion.bounds;
        const bounds = L.latLngBounds(L.latLng(south, west), L.latLng(north, east));
        map.flyToBounds(bounds, { animate: true, duration: 1.5 });
      }
    }
  }, [selectedRegion, map]);

  return null;
}

export default function TraconMap() {
  const selectedRegion = useFlightStore(state => state.selectedRegion);
  const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);
  const aircraft = useFlightStore(state => state.aircraft);
  const clearSelectedAircraft = useFlightStore(state => state.clearSelectedAircraft);
  const mapRef = useRef(null);

  // Start polling METAR data for the selected region
  useMetar();
  
  // Start tracking airspace incursions
  useAirspaceDetection();
  
  // Track holding patterns
  usePositionHistory();
  useHoldingDetection();

  // Center on selected aircraft if requested (e.g., from sidebar)
  useEffect(() => {
    if (selectedAircraftId && mapRef.current) {
      const ac = aircraft[selectedAircraftId];
      if (ac && ac.lat && ac.lng) {
        mapRef.current.flyTo([ac.lat, ac.lng], 9, { animate: true, duration: 1.0 });
      }
    }
  }, [selectedAircraftId, aircraft]);

  return (
    <div className="w-full h-full relative bg-radar-bg z-0 border border-radar-grid rounded-lg overflow-hidden flex-1">
      <MapContainer
        ref={mapRef}
        center={selectedRegion.center}
        zoom={selectedRegion.zoom}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
        preferCanvas={true}
        onClick={() => clearSelectedAircraft()} // Clear selection on map click
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        
        <AirspaceLayer />
        
        <WeatherLayer />
        <HoldingTrails />
        <AircraftLayer />
        <MapLegend />
        
        <MapViewHandler />
      </MapContainer>
    </div>
  );
}
