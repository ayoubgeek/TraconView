/**
 * @file FlightPanel.jsx
 * @description Slide-in detail panel for a selected aircraft.
 */

import React, { useEffect } from 'react';
import { useSelection } from '../../context/SelectionContext';
import { useAircraftById } from '../../context/AircraftDataContext';
import FlightField from './FlightField';
import {
  formatAltitude,
  formatSpeed,
  formatHeading,
  formatVertRate,
  formatSquawk,
  formatPositionSource
} from '../../utils/format';
import './FlightPanel.css';
import { X } from 'lucide-react';

export default function FlightPanel() {
  const { selectedAircraftId, clearSelection } = useSelection();
  const aircraft = useAircraftById(selectedAircraftId);

  // Swipe-to-dismiss for mobile
  useEffect(() => {
    if (!selectedAircraftId) return;

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.changedTouches[0].screenY;
    };
    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].screenY;
      if (touchEndY - touchStartY > 80) { // swipe down
        clearSelection();
      }
    };

    const panel = document.getElementById('flight-panel');
    if (panel) {
      panel.addEventListener('touchstart', handleTouchStart);
      panel.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      if (panel) {
        panel.removeEventListener('touchstart', handleTouchStart);
        panel.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [selectedAircraftId, clearSelection]);

  if (!selectedAircraftId || !aircraft) return null;

  return (
    <div id="flight-panel" className="flight-panel animate-slide-right">
      <button 
        aria-label="Close"
        className="flight-panel-close" 
        onClick={clearSelection}
      >
        <X size={24} />
      </button>

      <div className="flight-panel-header">
        <h2>{aircraft.callsign || '—'}</h2>
        <div className="flight-panel-icao">{aircraft.icao24.toUpperCase()}</div>
      </div>

      <div className="flight-panel-grid">
        <FlightField label="Altitude" value={formatAltitude(aircraft.altitudeFt)} />
        <FlightField label="Speed" value={formatSpeed(aircraft.speedKnots)} />
        <FlightField label="Heading" value={formatHeading(aircraft.heading)} />
        <FlightField label="Vert Rate" value={formatVertRate(aircraft.vertRateFpm)} />
        <FlightField label="Squawk" value={formatSquawk(aircraft.squawk)} />
        <FlightField label="Source" value={formatPositionSource(aircraft.positionSource)} />
        <FlightField label="Status" value={aircraft.onGround === null || aircraft.onGround === undefined ? '—' : (aircraft.onGround ? 'On Ground' : 'Airborne')} />
        <FlightField label="Country" value={aircraft.originCountry || '—'} />
      </div>

      {aircraft.route?.origin && aircraft.route?.destination && (
        <div className="flight-panel-route">
          <h3>Route</h3>
          <div className="route-codes">
            {aircraft.route.origin} → {aircraft.route.destination}
          </div>
        </div>
      )}
    </div>
  );
}
