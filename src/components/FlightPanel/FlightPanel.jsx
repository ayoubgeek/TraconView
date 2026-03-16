/**
 * @file FlightPanel.jsx
 * @description Slide-in detail panel for a selected aircraft, enriched with photos and routes.
 */

import { useEffect, useState } from 'react';

/* eslint-disable react-hooks/set-state-in-effect */
import { useSelection } from '../../context/SelectionContext';
import { useAircraftById } from '../../context/AircraftDataContext';
import { useAircraftEnrichment } from '../../hooks/useAircraftEnrichment';
import FlightField from './FlightField';
import {
  formatAltitude,
  formatSpeed,
  formatHeading,
  formatVertRate,
  formatSquawk,
  formatPositionSource
} from '../../utils/format';
import { countryNameToFlag, airportToFlag } from '../../utils/airports';
import './FlightPanel.css';
import { X, Plane, ExternalLink, Crosshair, Eye } from 'lucide-react';

export default function FlightPanel() {
  const { selectedAircraftId, clearSelection, isFocused, toggleFocus } = useSelection();
  const aircraft = useAircraftById(selectedAircraftId);
  
  const [now, setNow] = useState(() => Date.now());
  
  // Throttle the context aircraft object to avoid re-triggering enrichment hook rapid changes on tick
  const [stableAircraft, setStableAircraft] = useState(null);
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (aircraft && aircraft.icao24 !== stableAircraft?.icao24) {
      setStableAircraft(aircraft);
    } else if (!aircraft && stableAircraft) {
      setStableAircraft(null);
    }
  }, [aircraft, stableAircraft]);

  const { photo, route, isLoadingPhoto, isLoadingRoute } = useAircraftEnrichment(stableAircraft);

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

  const derivedRoute = aircraft.route || route;
  const isRouteLoading = !aircraft.route && isLoadingRoute;

  const originFlag = derivedRoute?.origin ? airportToFlag(derivedRoute.origin) : '';
  const destFlag = derivedRoute?.destination ? airportToFlag(derivedRoute.destination) : '';
  const countryFlag = countryNameToFlag(aircraft.originCountry);

  return (
    <div id="flight-panel" className="flight-panel animate-slide-right">
      <div className="flight-panel-actions">
        <button
          aria-label={isFocused ? 'Show all aircraft' : 'Track this aircraft only'}
          className={`flight-panel-action-btn ${isFocused ? 'active' : ''}`}
          onClick={toggleFocus}
          title={isFocused ? 'Show all aircraft' : 'Track this aircraft only'}
        >
          {isFocused ? <Eye size={18} /> : <Crosshair size={18} />}
        </button>
        <button
          aria-label="Close"
          className="flight-panel-close"
          onClick={clearSelection}
        >
          <X size={24} />
        </button>
      </div>

      {/* Hero Visual Block */}
      <div className="flight-panel-hero">
        {isLoadingPhoto ? (
          <div className="hero-loading skeleton"></div>
        ) : photo && photo.thumbnail ? (
          <div className="hero-image-wrapper">
            <img src={photo.thumbnail} alt={`Aircraft ${aircraft.icao24}`} className="hero-image" />
            <div className="hero-attribution">
              <span>Photo by {photo.photographer}</span>
              <a href={photo.link} target="_blank" rel="noreferrer" title="View on Planespotters.net">
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ) : (
          <div className="hero-placeholder">
            <Plane size={48} className="hero-placeholder-icon" />
            <span className="hero-placeholder-text">NO PHOTO AVAILABLE</span>
          </div>
        )}
      </div>

      <div className="flight-panel-content">
        {/* Header Block */}
        <div className="flight-panel-header">
          <div className="fp-header-main">
            <h2>{aircraft.callsign || 'N/A'}</h2>
          </div>
          <div className="fp-header-meta">
            <span className="fp-icao24">{aircraft.icao24.toUpperCase()}</span>
            {aircraft.originCountry && (
              <span className="fp-country">{countryFlag} {aircraft.originCountry}</span>
            )}
          </div>
        </div>

        {/* Route Section */}
        <div className="flight-panel-route-section">
          {isRouteLoading ? (
            <div className="route-loading skeleton"></div>
          ) : derivedRoute && derivedRoute.origin && derivedRoute.destination ? (
            <div className="route-display">
              <div className="route-point">
                {originFlag && <span className="route-flag">{originFlag}</span>}
                <span className="route-code">{derivedRoute.origin}</span>
                <span className="route-label">Origin</span>
              </div>
              <div className="route-arrow">
                <Plane size={16} />
                <div className="route-line"></div>
              </div>
              <div className="route-point">
                {destFlag && <span className="route-flag">{destFlag}</span>}
                <span className="route-code">{derivedRoute.destination}</span>
                <span className="route-label">Destination</span>
              </div>
            </div>
          ) : (
            <div className="route-unknown">
              <span>Route Unknown</span>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="flight-panel-grid">
          <FlightField label="Altitude" value={formatAltitude(aircraft.altitudeFt)} />
          <FlightField label="Speed" value={formatSpeed(aircraft.speedKnots)} />
          <FlightField label="Heading" value={formatHeading(aircraft.heading)} />
          <FlightField label="Vert Rate" value={formatVertRate(aircraft.vertRateFpm)} />
          <FlightField label="Squawk" value={formatSquawk(aircraft.squawk)} />
          <FlightField label="Source" value={formatPositionSource(aircraft.positionSource)} />
          <FlightField label="Status" value={aircraft.onGround === null || aircraft.onGround === undefined ? '—' : (aircraft.onGround ? 'On Ground' : 'Airborne')} />
          <FlightField label="Last Contact" value={`${Math.max(0, Math.round(now / 1000) - aircraft.lastContact)}s ago`} />
        </div>
      </div>
    </div>
  );
}
