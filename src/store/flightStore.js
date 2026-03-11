// src/store/flightStore.js
import { create } from 'zustand';
import { REGIONS, DEFAULT_REGION, MAX_ANOMALY_HISTORY } from '../lib/constants';

export const useFlightStore = create((set, get) => ({
  // Data State
  aircraft: {}, // Dictionary of aircraft by ID for fast lookup
  aircraftArray: [], // Array for easier iteration/rendering
  anomalies: [], // Array of historical anomalies, up to MAX_ANOMALY_HISTORY
  lastRefresh: null,
  
  // UI State
  selectedRegion: DEFAULT_REGION,
  selectedAircraftId: null,
  isMuted: false,
  connectionStatus: 'LIVE', // LIVE, DEGRADED, OFFLINE
  
  // Actions
  setAircraftData: (newAircraftArray, timestamp) => {
    const aircraftDict = {};
    for (const ac of newAircraftArray) {
      aircraftDict[ac.id] = ac;
    }
    set({
      aircraft: aircraftDict,
      aircraftArray: Object.values(aircraftDict),
      lastRefresh: timestamp || Date.now()
    });
  },
  
  addAnomaly: (anomaly) => {
    set((state) => {
      // Check if this exact aircraft has recently triggered this exact anomaly
      const recentDuplicate = state.anomalies.find(
        (a) => a.icao24 === anomaly.icao24 && 
               a.type === anomaly.type && 
               Date.now() - new Date(a.detectedAt).getTime() < 60000 // 1 min debounce
      );
      
      if (recentDuplicate) return state; // Don't add duplicate
      
      const newAnomalies = [anomaly, ...state.anomalies].slice(0, MAX_ANOMALY_HISTORY);
      return { anomalies: newAnomalies };
    });
  },
  
  setRegion: (regionKey) => {
    if (REGIONS[regionKey]) {
      set({ 
        selectedRegion: REGIONS[regionKey],
        aircraft: {}, // Clear aircraft when swapping region to avoid lingering items out of bounds
        aircraftArray: []
      });
    }
  },
  
  setSelectedAircraft: (id) => set({ selectedAircraftId: id }),
  clearSelectedAircraft: () => set({ selectedAircraftId: null }),
  
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  
  setConnectionStatus: (status) => set({ connectionStatus: status })
}));
