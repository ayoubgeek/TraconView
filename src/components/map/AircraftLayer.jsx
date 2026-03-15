import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useFlightStore } from '../../store/flightStore';
import { CLUSTER_DISABLE_AT_ZOOM, STALE_AIRCRAFT_TTL_MS, CALLSIGN_LABEL_MIN_ZOOM, ANOMALY_SEVERITY, CLUSTER_LARGE_RADIUS_MAX_ZOOM } from '../../lib/constants';
import { getCategorizedIcon } from '../../lib/iconUtils';
import { updateMarkersImperatively } from '../../lib/aircraftDiff';

// Re-implement the anomaly icon creation so we can pass it to aircraftDiff
const createPulseIcon = (severity) => {
  let colorClass = 'bg-blue-500'; // LOW
  let ringClass = 'ring-blue-500/50';
  
  if (severity === ANOMALY_SEVERITY.CRITICAL) {
    colorClass = 'bg-red-500';
    ringClass = 'ring-red-500/50';
  } else if (severity === ANOMALY_SEVERITY.HIGH) {
    colorClass = 'bg-orange-500';
    ringClass = 'ring-orange-500/50';
  } else if (severity === ANOMALY_SEVERITY.MEDIUM) {
    colorClass = 'bg-yellow-500';
    ringClass = 'ring-yellow-500/50';
  }

  const htmlString = `
    <div class="relative flex items-center justify-center w-full h-full">
      <div class="absolute w-8 h-8 rounded-full ${colorClass} opacity-40 animate-ping"></div>
      <div class="relative w-4 h-4 rounded-full ${colorClass} ring-4 ${ringClass} shadow-[0_0_15px_rgba(0,0,0,0.5)]"></div>
    </div>
  `;

  return L.divIcon({
    html: htmlString,
    className: 'bg-transparent border-none',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const ANOMALY_ICONS = {
  [ANOMALY_SEVERITY.CRITICAL]: createPulseIcon(ANOMALY_SEVERITY.CRITICAL),
  [ANOMALY_SEVERITY.HIGH]: createPulseIcon(ANOMALY_SEVERITY.HIGH),
  [ANOMALY_SEVERITY.MEDIUM]: createPulseIcon(ANOMALY_SEVERITY.MEDIUM),
  [ANOMALY_SEVERITY.LOW]: createPulseIcon(ANOMALY_SEVERITY.LOW),
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
            
            const getAltColor = (m) => {
              const ft = m * 3.28084;
              if (ft > 30000) return '#C084FC';
              if (ft > 20000) return '#10B981';
              if (ft > 10000) return '#F59E0B';
              return '#EF4444';
            };

            const chunks = [];
            let currentChunk = [];
            let currentColor = null;

            data.path.forEach(pt => {
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
    html: `<div class="bg-[#1A2235] border-[1px] border-atc-green text-atc-green rounded-full flex items-center justify-center font-bold text-xs" style="width: 32px; height: 32px; box-shadow: 0 0 10px rgba(0,0,0,0.5);">${count}</div>`,
    className: 'custom-marker-cluster border-none bg-transparent',
    iconSize: L.point(32, 32, true)
  });
};

// Component to handle toggling global tooltips via body class based on Map zoom
function ZoomLabelController() {
  const map = useMap();
  useEffect(() => {
    const applyLabelVisibility = () => {
      if (map.getZoom() >= CALLSIGN_LABEL_MIN_ZOOM) {
        document.body.classList.remove('hide-callsign-labels');
      } else {
        document.body.classList.add('hide-callsign-labels');
      }
    };
    applyLabelVisibility();
    map.on('zoomend', applyLabelVisibility);
    return () => {
      map.off('zoomend', applyLabelVisibility);
      document.body.classList.remove('hide-callsign-labels');
    };
  }, [map]);
  return null;
}

export default function AircraftLayer() {
  const filteredAircraft = useFlightStore(state => state.filteredAircraft);
  const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);
  const setSelectedAircraft = useFlightStore(state => state.setSelectedAircraft);
  const riskScores = useFlightStore(state => state.riskScores);

  const validAircraft = useMemo(() => {
    return filteredAircraft.filter(ac => ac.lat !== null && ac.lng !== null);
  }, [filteredAircraft]);

  const clusterGroupRef = useRef(null);
  const markerMapRef = useRef(new Map());

  // Execute imperative update bounds
  useEffect(() => {
    if (!clusterGroupRef.current) return;
    
    updateMarkersImperatively(markerMapRef.current, validAircraft, clusterGroupRef.current, getCategorizedIcon, {
      selectedAircraftId,
      onClick: setSelectedAircraft,
      STALE_AIRCRAFT_TTL_MS,
      riskScores,
      anomalyIcons: ANOMALY_ICONS
    });

  }, [validAircraft, selectedAircraftId, riskScores, setSelectedAircraft]);

  return (
    <>
      <SelectedAircraftTrack icao24={selectedAircraftId} />
      <ZoomLabelController />
      
      <MarkerClusterGroup
        ref={clusterGroupRef}
        chunkedLoading={true}
        disableClusteringAtZoom={CLUSTER_DISABLE_AT_ZOOM}
        maxClusterRadius={(zoom) => zoom < CLUSTER_LARGE_RADIUS_MAX_ZOOM ? 80 : 40}
        spiderfyOnMaxZoom={true}
        iconCreateFunction={createClusterCustomIcon}
      >
        {/* No declarative JSX markers inside. Handled imperatively by aircraftDiff.js for Performance Optimization */}
      </MarkerClusterGroup>
    </>
  );
}
