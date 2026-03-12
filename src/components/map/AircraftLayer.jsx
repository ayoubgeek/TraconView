import React, { useMemo, useState, useEffect } from 'react';
import { Marker, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useFlightStore } from '../../store/flightStore';

import AnomalyMarker from './AnomalyMarker';

// For US1 normal flights: teal, selected: cyan
const COLORS = {
  NORMAL: '#1e6a7a', // dim teal per spec
  SELECTED: '#22D3EE', // cyan-400
  CRITICAL: '#EF4444', 
  HIGH: '#F97316', 
  MEDIUM: '#EAB308', 
  LOW: '#3B82F6', 
};

const createPlaneIcon = (color, heading, isSelected) => {
  const rotation = heading || 0;
  // A clean, modern airplane silhouette pointing true North (0 degrees)
  const svgContent = `
    <div style="transform: rotate(${rotation}deg); transform-origin: center center; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${isSelected ? 24 : 20}" height="${isSelected ? 24 : 20}">
        <path fill="${color}" fill-opacity="${isSelected ? 1 : 0.8}" stroke="${isSelected ? '#fff' : '#000'}" stroke-width="${isSelected ? 1 : 0.5}"
          d="M12,2 L14,7 L20,11 L20,13 L14,12 L14,18 L17,20 L17,22 L12,21 L7,22 L7,20 L10,18 L10,12 L4,13 L4,11 L10,7 L12,2 Z" />
      </svg>
    </div>
  `;
  return L.divIcon({
    html: svgContent,
    className: 'aircraft-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    tooltipAnchor: [0, -12]
  });
};

function SelectedAircraftTrack({ icao24 }) {
  const [trackChunks, setTrackChunks] = useState([]);

  useEffect(() => {
    let isMounted = true;
    setTrackChunks([]); // reset on new aircraft

    if (!icao24) return;

    const fetchTrack = async () => {
      try {
        const res = await fetch(`https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=0`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.path && data.path.length > 0) {
            
            // Generate altitude-colored segments
            const getAltColor = (m) => {
              const ft = m * 3.28084;
              if (ft > 30000) return '#C084FC'; // purple
              if (ft > 20000) return '#10B981'; // green
              if (ft > 10000) return '#F59E0B'; // yellow
              return '#EF4444'; // red
            };

            const chunks = [];
            let currentChunk = [];
            let currentColor = null;

            data.path.forEach(pt => {
              // pt[1]=lat, pt[2]=lng, pt[3]=baro_alt
              const c = getAltColor(pt[3] || 0);
              const ll = [pt[1], pt[2]];
              
              if (c !== currentColor) {
                if (currentChunk.length > 0) {
                  // End previous chunk, start new one overlapping to connect
                  currentChunk.push(ll);
                  chunks.push({ color: currentColor, positions: currentChunk });
                }
                currentChunk = [ll];
                currentColor = c;
              } else {
                currentChunk.push(ll);
              }
            });
            if (currentChunk.length > 0) {
              chunks.push({ color: currentColor, positions: currentChunk });
            }
            
            setTrackChunks(chunks);
          }
        }
      } catch (err) {
        console.error("Failed to fetch aircraft track:", err);
      }
    };
    fetchTrack();
    return () => { isMounted = false; };
  }, [icao24]);

  if (trackChunks.length === 0) return null;

  return (
    <>
      {trackChunks.map((chunk, i) => (
        <Polyline 
          key={i}
          positions={chunk.positions}
          color={chunk.color}
          weight={4}
          opacity={0.8}
        />
      ))}
    </>
  );
}

export default function AircraftLayer() {
  const aircraftArray = useFlightStore(state => state.aircraftArray);
  const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);
  const setSelectedAircraft = useFlightStore(state => state.setSelectedAircraft);

  // We should only render aircraft with valid coordinates
  const validAircraft = useMemo(() => {
    return aircraftArray.filter(ac => ac.lat !== null && ac.lng !== null);
  }, [aircraftArray]);

  return (
    <>
      {/* Draw the track for the selected aircraft ONLY */}
      <SelectedAircraftTrack icao24={selectedAircraftId} />
      
      {validAircraft.map(ac => {
        const isSelected = ac.id === selectedAircraftId;
        const anomaly = ac.anomaly ? { type: ac.anomaly, severity: ac.anomalySeverity } : null;
        
        // Base color or severity color if anomalous (and not selected)
        let color = isSelected ? COLORS.SELECTED : COLORS.NORMAL;
        if (anomaly && !isSelected) {
          color = COLORS[anomaly.severity] || COLORS.LOW;
        }

        return (
          <React.Fragment key={ac.id}>
            {/* If there is an anomaly, render the pulsing ring behind the dot */}
            {anomaly && (
              <AnomalyMarker position={[ac.lat, ac.lng]} severity={anomaly.severity} />
            )}
            
            <Marker
              position={[ac.lat, ac.lng]}
              icon={createPlaneIcon(color, ac.heading, isSelected)}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e); // Block map click from firing and immediately clearing
                  setSelectedAircraft(ac.id);
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} className="bg-radar-bg text-atc-green border-radar-grid font-data text-xs" opacity={0.9}>
                <div className="flex flex-col">
                  <span className="font-bold">{ac.callsign}</span>
                  <span>{Math.round(ac.altitude).toLocaleString()} ft | {Math.round(ac.speed)} kts</span>
                  {anomaly && <span className="font-bold mt-1" style={{color: COLORS[anomaly.severity]}}>{anomaly.type.replace('_', ' ')}</span>}
                </div>
              </Tooltip>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
}
