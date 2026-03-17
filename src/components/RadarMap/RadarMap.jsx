/**
 * @file RadarMap.jsx
 * @description Leaflet Map component with CartoDB Dark layer and Aircraft markers.
 */

import React from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AircraftMarker from '../map/AircraftMarker';
import { useAircraftDataContext } from '../../context/AircraftDataContext';
import { useAircraftData } from '../../hooks/useAircraftData';
import { useSelection } from '../../context/SelectionContext';
import FlightTrack from '../map/FlightTrack';
import './RadarMap.css';

function SelectedAircraftTracker() {
  const map = useMap();
  const { selectedAircraftId } = useSelection();
  const { aircraft } = useAircraftDataContext();

  React.useEffect(() => {
    if (selectedAircraftId && aircraft.has(selectedAircraftId)) {
      const ac = aircraft.get(selectedAircraftId);
      // panInside only moves the map if the target is outside the padded bounds
      map.panInside([ac.lat, ac.lng], { 
        paddingTopLeft: [50, 50],
        paddingBottomRight: [400, 50], // Account for the right sliding panel
        animate: true, 
        duration: 0.8 
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAircraftId, map]); // Only trigger when ID changes, not on every data tick

  return null;
}

function MapController() {
  const map = useMap();
  useAircraftData(map);
  return null;
}

function MapEventsHandler() {
  const { clearSelection } = useSelection();
  useMapEvents({
    click() {
      clearSelection();
    }
  });
  return null;
}

export default function RadarMap() {
  const { aircraft } = useAircraftDataContext();
  const { selectedAircraftId, isFocused } = useSelection();

  const visibleAircraft = isFocused && selectedAircraftId
    ? Array.from(aircraft.values()).filter(ac => ac.icao24 === selectedAircraftId)
    : Array.from(aircraft.values());

  return (
    <MapContainer
      center={[51.1657, 10.4515]}
      zoom={6}
      zoomControl={false}
      className="radar-map-container"
      minZoom={3}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapController />
      <MapEventsHandler />

      {aircraft.size === 0 && (
        <div className="radar-map-loading">
          <div className="spinner"></div>
          <span>Acquiring Signals...</span>
        </div>
      )}

      <SelectedAircraftTracker />
      {selectedAircraftId && <FlightTrack icao24={selectedAircraftId} />}

      {visibleAircraft.map(ac => (
        <AircraftMarker key={ac.icao24} aircraft={ac} />
      ))}
    </MapContainer>
  );
}
