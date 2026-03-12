import React, { useMemo } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
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
            
            <CircleMarker
              center={[ac.lat, ac.lng]}
              radius={isSelected ? 6 : 3}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: isSelected ? 1 : 0.8,
                weight: isSelected ? 2 : 1
              }}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  setSelectedAircraft(ac.id);
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -5]} className="bg-radar-bg text-atc-green border-radar-grid font-data text-xs" opacity={0.9}>
                <div className="flex flex-col">
                  <span className="font-bold">{ac.callsign}</span>
                  <span>{Math.round(ac.altitude).toLocaleString()} ft | {Math.round(ac.speed)} kts</span>
                  {anomaly && <span className={`font-bold mt-1`} style={{color: COLORS[anomaly.severity]}}>{anomaly.type.replace('_', ' ')}</span>}
                </div>
              </Tooltip>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </>
  );
}
