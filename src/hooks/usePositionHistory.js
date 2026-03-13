import { useEffect, useRef } from 'react';
import { useFlightStore } from '../store/flightStore';

export function usePositionHistory() {
  const aircraftArray = useFlightStore(state => state.aircraftArray);
  const updatePositionHistory = useFlightStore(state => state.updatePositionHistory);
  const lastRefresh = useFlightStore(state => state.lastRefresh);
  const processedTimestamps = useRef(new Set());

  useEffect(() => {
    if (!lastRefresh || processedTimestamps.current.has(lastRefresh)) return;
    
    processedTimestamps.current.add(lastRefresh);
    if (processedTimestamps.current.size > 10) {
      const arr = Array.from(processedTimestamps.current);
      processedTimestamps.current = new Set(arr.slice(arr.length - 5));
    }

    updatePositionHistory(aircraftArray);
  }, [aircraftArray, lastRefresh, updatePositionHistory]);
}
