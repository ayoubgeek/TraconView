import React, { useMemo, useState, useEffect } from 'react';
import { Marker, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useFlightStore } from '../../store/flightStore';
import { pointInPolygon, computeBBox } from '../../lib/pointInPolygon';

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

const THRESHOLD_STYLES = {
  NORMAL: { color: '#1e6a7a', className: '' },
  WATCH: { color: '#EAB308', className: 'border-yellow-500 border-2 rounded-full' },
  CAUTION: { color: '#EAB308', className: '' },
  WARNING: { color: '#F97316', className: 'animate-[pulse_1.5s_ease-in-out_infinite]' },
  CRITICAL: { color: '#EF4444', className: 'animate-[ping_0.8s_ease-in-out_infinite] shadow-[0_0_10px_#ef4444] rounded-full' }
};

const createPlaneIcon = (color, heading, isSelected, size = 20, extraClass = '', isHolding = false, dimmed = false) => {
  const rotation = heading || 0;
  
  const holdingBadge = isHolding ? `
    <div style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); background: rgba(167,139,250,0.2); border: 1px solid #a78bfa; color: #a78bfa; font-size: 8px; font-weight: bold; padding: 2px 4px; border-radius: 4px; box-shadow: 0 0 5px rgba(167,139,250,0.4); white-space: nowrap;">
      HOLDING
    </div>
  ` : '';

  const svgContent = `
    <div class="relative ${extraClass}" style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; ${dimmed ? 'opacity: 0.2;' : ''}">
      ${holdingBadge}
      <div style="transform: rotate(${rotation}deg); transform-origin: center center; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
          <path fill="${color}" fill-opacity="${dimmed ? 0.3 : (isSelected ? 1 : 0.8)}" stroke="${isSelected ? '#fff' : '#000'}" stroke-width="${isSelected ? 1 : 0.5}"
            d="M12,2 L14,7 L20,11 L20,13 L14,12 L14,18 L17,20 L17,22 L12,21 L7,22 L7,20 L10,18 L10,12 L4,13 L4,11 L10,7 L12,2 Z" />
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html: svgContent,
    className: 'aircraft-icon ' + extraClass,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    tooltipAnchor: [0, -12]
  });
};

function SelectedAircraftTrack({ icao24 }) {
  const [trackChunks, setTrackChunks] = useState([]);

  useEffect(() => {
    let isMounted = true;
    // eslint-disable-next-line
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
  const riskScores = useFlightStore(state => state.riskScores);
  
  const casablancaFirFocus = useFlightStore(state => state.casablancaFirFocus);
  const airspaceZones = useFlightStore(state => state.airspaceZones);

  const firFeature = useMemo(() => airspaceZones.find(z => z.properties?.name?.includes('Casablanca FIR') || z.properties?.type === 'FIR'), [airspaceZones]);
  const firBbox = useMemo(() => firFeature?.geometry?.coordinates?.[0] ? computeBBox(firFeature.geometry.coordinates[0]) : null, [firFeature]);

  const validAircraft = useMemo(() => {
    return aircraftArray.filter(ac => ac.lat !== null && ac.lng !== null);
  }, [aircraftArray]);

  return (
    <>
      <SelectedAircraftTrack icao24={selectedAircraftId} />
      
      {validAircraft.map(ac => {
        const isSelected = ac.id === selectedAircraftId;
        const riskResult = riskScores.get(ac.id);
        const threshold = riskResult ? riskResult.threshold : 'NORMAL';
        const isCriticalOrWarning = threshold === 'CRITICAL' || threshold === 'WARNING';
        
        let color = isSelected ? COLORS.SELECTED : (THRESHOLD_STYLES[threshold]?.color || COLORS.NORMAL);
        let size = 20;
        if (threshold === 'WATCH') size = 22;
        if (threshold === 'CAUTION') size = 24;
        if (threshold === 'WARNING') size = 28;
        if (threshold === 'CRITICAL') size = 32;
        if (isSelected) size = Math.max(size, 24);

        const extraClass = THRESHOLD_STYLES[threshold]?.className || '';

        // FIR Highlight Dimming
        let isDimmed = false;
        if (casablancaFirFocus && firFeature && firBbox && !isSelected) {
           const inside = pointInPolygon(ac.lng, ac.lat, firFeature.geometry, firBbox);
           if (!inside) {
             isDimmed = true;
           }
        }

        return (
          <React.Fragment key={ac.id}>
            {isCriticalOrWarning && !isSelected && !isDimmed && (
               <AnomalyMarker position={[ac.lat, ac.lng]} severity={threshold} />
            )}
            
            <Marker
              position={[ac.lat, ac.lng]}
              icon={createPlaneIcon(color, ac.heading, isSelected, size, extraClass, ac.isHolding, isDimmed)}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  setSelectedAircraft(ac.id);
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} className="bg-radar-bg text-atc-green border-radar-grid font-data text-xs" opacity={0.9}>
                <div className="flex flex-col">
                  <span className="font-bold">{ac.callsign || ac.id}</span>
                  <span>{Math.round(ac.altitude).toLocaleString()} ft | {Math.round(ac.speed)} kts</span>
                  {riskResult && riskResult.score > 0 && (
                    <span className="font-bold mt-1" style={{color}}>Score: {riskResult.score} ({threshold})</span>
                  )}
                </div>
              </Tooltip>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
}
