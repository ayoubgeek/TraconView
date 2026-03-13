import { useEffect, useRef } from 'react';
import { useFlightStore } from '../store/flightStore';
import { detectZoneIncursions, computeOccupancy } from '../lib/airspaceDetector';
import { prepareAirspaces } from '../lib/pointInPolygon';

export function useAirspaceDetection() {
  const aircraftArray = useFlightStore(state => state.aircraftArray);
  const airspaceZones = useFlightStore(state => state.airspaceZones);
  const updateAirspaceOccupancy = useFlightStore(state => state.updateAirspaceOccupancy);
  const addOrUpdateAlert = useFlightStore(state => state.addOrUpdateAlert);
  const lastRefresh = useFlightStore(state => state.lastRefresh);
  
  const previousIncursions = useRef(new Map());
  const processedTimestamps = useRef(new Set());
  const preparedZonesRef = useRef([]);

  useEffect(() => {
    preparedZonesRef.current = prepareAirspaces({ type: 'FeatureCollection', features: airspaceZones });
  }, [airspaceZones]);

  useEffect(() => {
    if (!lastRefresh || processedTimestamps.current.has(lastRefresh) || airspaceZones.length === 0) return;
    
    processedTimestamps.current.add(lastRefresh);
    if (processedTimestamps.current.size > 10) {
      const arr = Array.from(processedTimestamps.current);
      processedTimestamps.current = new Set(arr.slice(arr.length - 5));
    }

    const restrictedZones = preparedZonesRef.current.filter(zp => {
      const type = zp.feature.properties?.type?.toUpperCase() || '';
      return ['RESTRICTED', 'DANGER', 'PROHIBITED'].includes(type);
    });

    const { newIncursions, currentIncursions } = detectZoneIncursions(
      aircraftArray, 
      restrictedZones, 
      previousIncursions.current
    );

    previousIncursions.current = currentIncursions;

    for (const inc of newIncursions) {
      addOrUpdateAlert({
        id: `${inc.icao24}-incursion-${inc.timestamp}`,
        icao24: inc.icao24,
        callsign: inc.callsign,
        riskScore: 60, 
        reasons: [{ type: 'RESTRICTED_AIRSPACE', label: `Entered ${inc.zoneName}`, severity: 'CRITICAL' }],
        lat: inc.lat,
        lng: inc.lng,
        altitude: inc.altitude,
        speed: 0,
        squawk: null,
        detectedAt: inc.timestamp,
        isResolved: false
      });
    }

    const occupancyMap = computeOccupancy(aircraftArray, preparedZonesRef.current);
    updateAirspaceOccupancy(occupancyMap);

  }, [aircraftArray, airspaceZones, lastRefresh, updateAirspaceOccupancy, addOrUpdateAlert]);
}
