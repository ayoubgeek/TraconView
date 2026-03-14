import React, { useMemo, useState, useEffect } from 'react';
import { Polyline } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useFlightStore } from '../../store/flightStore';
import { pointInPolygon, computeBBox } from '../../lib/pointInPolygon';
import { CLUSTER_DISABLE_AT_ZOOM, STALE_AIRCRAFT_TTL_MS } from '../../lib/constants';

import AircraftMarker from './AircraftMarker';
import AnomalyMarker from './AnomalyMarker';

// ... Keep existing SelectedAircraftTrack ...
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

// Custom cluster icon factory
const createClusterCustomIcon = function (cluster) {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div class="bg-radar-panel border-[1px] border-atc-green text-atc-green rounded-full flex items-center justify-center font-bold text-xs" style="width: 32px; height: 32px; box-shadow: 0 0 10px rgba(0,0,0,0.5);">${count}</div>`,
    className: 'custom-marker-cluster border-none bg-transparent',
    iconSize: L.point(32, 32, true)
  });
};

export default function AircraftLayer() {
  const filteredAircraft = useFlightStore(state => state.filteredAircraft);
  const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);
  const setSelectedAircraft = useFlightStore(state => state.setSelectedAircraft);
  const riskScores = useFlightStore(state => state.riskScores);
  
  const casablancaFirFocus = useFlightStore(state => state.casablancaFirFocus);
  const airspaceZones = useFlightStore(state => state.airspaceZones);

  const firFeature = useMemo(() => airspaceZones.find(z => z.properties?.name?.includes('Casablanca FIR') || z.properties?.type === 'FIR'), [airspaceZones]);
  const firBbox = useMemo(() => firFeature?.geometry?.coordinates?.[0] ? computeBBox(firFeature.geometry.coordinates[0]) : null, [firFeature]);

  const validAircraft = useMemo(() => {
    return filteredAircraft.filter(ac => ac.lat !== null && ac.lng !== null);
  }, [filteredAircraft]);

  return (
    <>
      <SelectedAircraftTrack icao24={selectedAircraftId} />
      
      <MarkerClusterGroup
        chunkedLoading
        disableClusteringAtZoom={CLUSTER_DISABLE_AT_ZOOM}
        maxClusterRadius={(zoom) => zoom < 6 ? 80 : 40}
        spiderfyOnMaxZoom={true}
        iconCreateFunction={createClusterCustomIcon}
      >
        {validAircraft.map(ac => {
          const isSelected = ac.id === selectedAircraftId;
          const riskResult = riskScores.get(ac.id);
          const threshold = riskResult ? riskResult.threshold : 'NORMAL';
          const isCriticalOrWarning = threshold === 'CRITICAL' || threshold === 'WARNING';
          
          // eslint-disable-next-line react-hooks/purity
          const isStale = (Date.now() - Math.floor(ac.lastSeen * 1000)) > STALE_AIRCRAFT_TTL_MS;

          // FIR Highlight logic from before (will refine visually later if needed, 
          // but mainly we just dim the rendering if not in FIR)
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
              
              <AircraftMarker 
                aircraft={ac} 
                isSelected={isSelected} 
                isStale={isStale || isDimmed}
                onClick={setSelectedAircraft}
              />
            </React.Fragment>
          );
        })}
      </MarkerClusterGroup>
    </>
  );
}
