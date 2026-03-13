import { useEffect, useRef } from 'react';
import { useFlightStore } from '../store/flightStore';
import { detectHolding, hasExitedHolding } from '../lib/holdingDetector';

export function useHoldingDetection() {
  const positionHistory = useFlightStore(state => state.positionHistory);
  const setAircraftHoldingStatus = useFlightStore(state => state.setAircraftHoldingStatus);
  const addOrUpdateAlert = useFlightStore(state => state.addOrUpdateAlert);
  const lastRefresh = useFlightStore(state => state.lastRefresh);
  
  const processedTimestamps = useRef(new Set());
  const holdingSetRef = useRef(new Set());

  useEffect(() => {
    if (!lastRefresh || processedTimestamps.current.has(lastRefresh)) return;
    processedTimestamps.current.add(lastRefresh);

    const newHoldingSet = new Set(holdingSetRef.current);
    const aircraftMap = useFlightStore.getState().aircraft;

    for (const [id, positions] of positionHistory.entries()) {
      const currentlyHolding = newHoldingSet.has(id);
      
      if (!currentlyHolding) {
        const result = detectHolding(positions);
        if (result.isHolding) {
          newHoldingSet.add(id);
          setAircraftHoldingStatus(id, true);
          
          const ac = aircraftMap[id];
          if (ac) {
            addOrUpdateAlert({
              id: `${id}-holding-${Date.now()}`,
              icao24: id,
              callsign: ac.callsign,
              riskScore: 20, 
              reasons: [{ type: 'HOLDING', label: 'Holding Pattern Detected', severity: 'WATCH' }],
              lat: ac.lat,
              lng: ac.lng,
              altitude: ac.altitude,
              detectedAt: new Date().toISOString(),
              isResolved: false
            });
          }
        }
      } else {
        if (hasExitedHolding(positions)) {
          newHoldingSet.delete(id);
          setAircraftHoldingStatus(id, false);
        }
      }
    }

    holdingSetRef.current = newHoldingSet;
  }, [positionHistory, lastRefresh, setAircraftHoldingStatus, addOrUpdateAlert]);
}
