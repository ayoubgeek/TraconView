/**
 * @file FlightPanel.jsx
 * @description Slide-in detail panel for a selected aircraft, engineered to mimic premium flight trackers.
 */

import React, { useEffect, useState } from 'react';
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
  formatSquawk
} from '../../utils/format';
import { countryNameToFlag, countryCodeToFlag } from '../../utils/airports';
import { callsignToAirline } from '../../utils/airlines';
import './FlightPanel.css';
import { X, Plane, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function FlightPanel() {
  const { selectedAircraftId, clearSelection } = useSelection();
  const aircraft = useAircraftById(selectedAircraftId);

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

  const { photo, route, isLoadingPhoto } = useAircraftEnrichment(stableAircraft);

  // Swipe-to-dismiss for mobile
  useEffect(() => {
    if (!selectedAircraftId) return;

    let touchStartY = 0;
    const panel = document.getElementById('flight-panel');
    
    const handleTouchStart = (e) => {
      touchStartY = e.changedTouches[0].screenY;
    };
    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].screenY;
      if (touchEndY - touchStartY > 80) { // swipe down
        clearSelection();
      }
    };

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

  const airlineName = callsignToAirline(aircraft.callsign) || 'Unknown Operator';
  const secondsAgo = Math.max(0, Math.round(now / 1000) - aircraft.lastContact);
  
  const isEmergency = aircraft.squawk === '7700';
  const isLossOfComms = aircraft.squawk === '7600';
  const hasAnomaly = isEmergency || isLossOfComms || secondsAgo > 120;

  return (
    <div id="flight-panel" className="flight-panel animate-slide-right">
      <button
        aria-label="Close"
        className="flight-panel-close"
        onClick={clearSelection}
      >
        <X size={20} />
      </button>

      {/* SECTION A: HERO HEADER */}
      <div className="section-a-hero">
        {isLoadingPhoto ? (
          <div className="hero-loading skeleton"></div>
        ) : photo && photo.thumbnail ? (
          <div className="hero-image-wrapper">
            <img src={photo.thumbnail} alt={`Aircraft ${aircraft.icao24}`} className="hero-image" />
            <div className="hero-credit">
              <span>Photo: {photo.photographer}</span>
              <a href={photo.link} target="_blank" rel="noreferrer" title="View on Planespotters.net">
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ) : (
          <div className="hero-placeholder">
            <Plane size={48} className="hero-placeholder-icon" />
            <span className="hero-placeholder-text">{airlineName.toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="flight-panel-content">
        
        {/* SECTION B: FLIGHT HEADER */}
        <div className="section-b-header">
          <div className="header-topline">
            <h2 className="flight-callsign">{aircraft.callsign || aircraft.icao24.toUpperCase()}</h2>
            <span className="aircraft-type-badge">N/A</span>
          </div>
          <div className="header-tagline">
            <span className="airline-name">{airlineName}</span>
          </div>
        </div>

        {/* SECTION C: ROUTE BLOCK */}
        {route && route.origin?.lat && route.destination?.lat && (
          <div className="section-c-route">
            <div className="route-node text-left">
              <span className="route-flag">{countryCodeToFlag(route.origin.country)}</span>
              <span className="route-iata">{route.origin.iata || route.origin.icao}</span>
              <span className="route-city">{route.origin.city || route.origin.name}</span>
              <span className="route-tz">{route.origin.tz || 'N/A'}</span>
            </div>
            
            <div className="route-progress">
              <div className="route-line-full"></div>
              <div className="route-line-fill" style={{ width: '50%' }}></div>
              <Plane size={14} className="route-plane-marker" style={{ left: '50%' }} />
            </div>

            <div className="route-node text-right">
              <span className="route-flag">{countryCodeToFlag(route.destination.country)}</span>
              <span className="route-iata">{route.destination.iata || route.destination.icao}</span>
              <span className="route-city">{route.destination.city || route.destination.name}</span>
              <span className="route-tz">{route.destination.tz || 'N/A'}</span>
            </div>
          </div>
        )}

        {/* SECTION D: SCHEDULE BLOCK */}
        <div className="section-block">
          <div className="schedule-grid">
            <div className="schedule-col">
              <span className="sched-label"></span>
              <span className="sched-val-dim">Scheduled</span>
              <span className="sched-val-dim">Actual/Est</span>
              <span className="sched-val-dim">Status</span>
            </div>
            <div className="schedule-col">
              <span className="sched-label">Departure</span>
              <span className="sched-val">N/A</span>
              <span className="sched-val">N/A</span>
              <span className="sched-status neutral">Unknown</span>
            </div>
            <div className="schedule-col text-right">
              <span className="sched-label">Arrival</span>
              <span className="sched-val">N/A</span>
              <span className="sched-val">N/A</span>
              <span className="sched-status neutral">Unknown</span>
            </div>
          </div>
        </div>

        {/* SECTION E: LIVE FLIGHT DATA */}
        <div className="section-block">
          <div className="flight-grid-2col">
            <FlightField label="ALTITUDE" value={formatAltitude(aircraft.altitudeFt)} />
            <FlightField label="GROUND SPEED" value={formatSpeed(aircraft.speedKnots)} />
            <FlightField label="VERTICAL SPEED" value={formatVertRate(aircraft.vertRateFpm)} />
            <FlightField label="HEADING / TRACK" value={formatHeading(aircraft.heading)} />
            <FlightField label="DISTANCE FLOWN" value="N/A" />
            <FlightField label="DISTANCE REMAINING" value="N/A" />
            <FlightField label="ETA" value="N/A" />
          </div>
        </div>

        {/* SECTION F: AIRCRAFT DETAILS */}
        <div className="section-block">
          <div className="flight-grid-2col">
            <FlightField label="AIRCRAFT TYPE" value="N/A" />
            <FlightField label="REGISTRATION" value="N/A" />
            <FlightField label="COUNTRY OF REG." value={`${countryNameToFlag(aircraft.originCountry)} ${aircraft.originCountry || 'Unknown'}`} />
            <FlightField label="CATEGORY" value="Passenger" />
            <FlightField label="AIRLINE" value={airlineName} />
            <FlightField label="SQUAWK" value={formatSquawk(aircraft.squawk)} />
          </div>
        </div>

        {/* SECTION G: ANOMALY ALERT */}
        <div className="section-block">
          {hasAnomaly ? (
            <div className={`anomaly-card ${isEmergency ? 'red' : 'amber'}`}>
              <AlertTriangle size={18} />
              <div className="anomaly-text">
                <strong>{isEmergency ? 'Critical Anomaly Detected' : 'Warning Detected'}</strong>
                <span>
                  {isEmergency ? 'Squawk 7700 (General Emergency)' : 
                   isLossOfComms ? 'Squawk 7600 (Radio Failure)' : 
                   `Stale position data (${secondsAgo}s+)`}
                </span>
              </div>
            </div>
          ) : (
            <div className="anomaly-card green">
              <ShieldCheck size={18} />
              <div className="anomaly-text">
                <strong>No anomalies detected</strong>
                <span>Flight data appears nominal</span>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
