/**
 * @file FlightPanel.jsx
 * @description Slide-in detail panel for a selected aircraft, engineered to mimic premium flight trackers.
 */

import React, { useEffect, useState } from 'react';
/* eslint-disable react-hooks/set-state-in-effect */
import { useSelection } from '../../context/SelectionContext';
import { useAircraftById } from '../../context/AircraftDataContext';
import { useAircraftEnrichment } from '../../hooks/useAircraftEnrichment';
import { useAircraftTrack } from '../../hooks/useAircraftTrack';
import FlightField from './FlightField';
import {
  formatAltitude,
  formatSpeed,
  formatHeading,
  formatVertRate,
  formatSquawk,
  formatPositionSource
} from '../../utils/format';
import { countryNameToFlag } from '../../utils/airports';
import { callsignToAirline } from '../../utils/airlines';
import './FlightPanel.css';
import { X, Plane, ExternalLink, Crosshair, Eye, Navigation, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function FlightPanel() {
  const { selectedAircraftId, clearSelection, isFocused, toggleFocus } = useSelection();
  const aircraft = useAircraftById(selectedAircraftId);
  const { track } = useAircraftTrack(selectedAircraftId);

  const [now, setNow] = useState(() => Date.now());
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

  const countryFlag = countryNameToFlag(aircraft.originCountry);
  const airlineName = callsignToAirline(aircraft.callsign);
  const secondsAgo = Math.max(0, Math.round(now / 1000) - aircraft.lastContact);
  
  const isEmergency = aircraft.squawk === '7700';
  const isLossOfComms = aircraft.squawk === '7600';

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

      {/* SECTION A: HERO HEADER */}
      <div className="flight-panel-hero">
        {isLoadingPhoto ? (
          <div className="hero-loading skeleton"></div>
        ) : photo && photo.thumbnail ? (
          <div className="hero-image-wrapper">
            <img src={photo.thumbnail} alt={`Aircraft ${aircraft.icao24}`} className="hero-image" />
            <div className="hero-attribution">
              <span>Photo: {photo.photographer}</span>
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
        
        {/* IDENTIFICATION BLOCK */}
        <div className="section-header">
          <div className="header-primary">
            <h2 className="header-callsign">{aircraft.callsign || aircraft.icao24.toUpperCase()}</h2>
            <div className="header-tags">
              {airlineName && <span className="tag-airline">{airlineName}</span>}
              <span className="tag-icao24">{aircraft.icao24.toUpperCase()}</span>
            </div>
          </div>
          <div className="header-secondary">
            <span className="header-operator">{airlineName || 'Operator Unknown'}</span>
            <span className="header-country">{countryFlag} {aircraft.originCountry || 'Unknown'}</span>
          </div>
        </div>

        {/* SECTION B: ROUTE BLOCK */}
        <div className="section-route">
          {isLoadingRoute ? (
             <div className="route-loading skeleton"></div>
          ) : route ? (
             <div className="route-display">
                <div className="route-node">
                   <span className="route-iata">{route.origin}</span>
                   <span className="route-label">ORIGIN</span>
                </div>
                <div className="route-progress">
                   <div className="route-line-bar">
                     <Plane size={16} className="route-plane-icon" style={{ left: '50%' }} />
                   </div>
                </div>
                <div className="route-node">
                   <span className="route-iata">{route.destination}</span>
                   <span className="route-label">DEST</span>
                </div>
             </div>
          ) : (
             <div className="route-unavailable">
                <span>Route data unavailable</span>
             </div>
          )}
        </div>

        {/* SECTION C: LIVE FLIGHT STATUS GRID */}
        <div className="section-block section-live-metrics">
          <div className="section-title">
             <Navigation size={14} /> LIVE FLIGHT DATA
          </div>
          <div className="metrics-grid">
            <div className="metric-box highlight">
              <span className="metric-label">ALTITUDE</span>
              <span className="metric-value">{formatAltitude(aircraft.altitudeFt)}</span>
            </div>
            <div className="metric-box highlight">
              <span className="metric-label">GROUND SPEED</span>
              <span className="metric-value">{formatSpeed(aircraft.speedKnots)}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">HEADING</span>
              <span className="metric-value">{formatHeading(aircraft.heading)}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">VERT SPEED</span>
              <span className="metric-value">{formatVertRate(aircraft.vertRateFpm)}</span>
            </div>
          </div>
        </div>

        {/* SECTION D: AIRCRAFT INFO & GEOMETRY */}
        <div className="section-block">
          <div className="info-grid">
            <FlightField label="Squawk" value={formatSquawk(aircraft.squawk)} />
            <FlightField label="Status" value={aircraft.onGround === null ? '—' : (aircraft.onGround ? 'On Ground' : 'Airborne')} />
            <FlightField label="Latitude" value={aircraft.lat != null ? aircraft.lat.toFixed(4) : '—'} />
            <FlightField label="Longitude" value={aircraft.lng != null ? aircraft.lng.toFixed(4) : '—'} />
            <FlightField label="Source" value={formatPositionSource(aircraft.positionSource)} />
            <FlightField label="Last Contact" value={`${secondsAgo}s ago`} />
          </div>
        </div>

        {/* SECTION E: CONTEXT / ALERTS */}
        {(isEmergency || isLossOfComms || secondsAgo > 60 || (track && track.length > 5)) && (
          <div className="section-block section-context">
            {isEmergency && (
              <div className="alert-box critical">
                <ShieldAlert size={16} />
                <span><strong>7700 SQUAWK</strong> General Emergency Declared</span>
              </div>
            )}
            {isLossOfComms && (
              <div className="alert-box warning">
                <AlertTriangle size={16} />
                <span><strong>7600 SQUAWK</strong> Radio Failure / Loss of Comms</span>
              </div>
            )}
            {secondsAgo > 60 && !isEmergency && !isLossOfComms && (
              <div className="alert-box muted">
                <AlertTriangle size={16} />
                <span>Stale Data: Position hasn't updated in {secondsAgo}s</span>
              </div>
            )}
            {track && track.length > 5 && secondsAgo <= 60 && !isEmergency && !isLossOfComms && (
              <div className="alert-box success">
                <Navigation size={16} />
                <span>Live tracking active • {track.length} positions recorded</span>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
