// src/store/flightStore.js
import { create } from 'zustand';
import { REGIONS, DEFAULT_REGION, MAX_ANOMALY_HISTORY } from '../lib/constants';

export const useFlightStore = create((set, get) => ({
  // Data State
  aircraft: {},
  aircraftArray: [],
  anomalies: [],
  lastRefresh: null,
  
  // UI State
  selectedRegion: DEFAULT_REGION,
  selectedAircraftId: null,
  isMuted: false,
  isSidebarOpen: false,
  showAirspace: true,
  connectionStatus: 'LIVE',
  
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
      const recentDuplicate = state.anomalies.find(
        (a) => a.icao24 === anomaly.icao24 && 
               a.type === anomaly.type && 
               Date.now() - new Date(a.detectedAt).getTime() < 60000
      );
      if (recentDuplicate) return state;
      const newAnomalies = [anomaly, ...state.anomalies].slice(0, MAX_ANOMALY_HISTORY);
      return { anomalies: newAnomalies };
    });
  },
  
  setRegion: (regionKey) => {
    if (REGIONS[regionKey]) {
      set({ 
        selectedRegion: REGIONS[regionKey],
        aircraft: {},
        aircraftArray: []
      });
    }
  },
  
  setSelectedAircraft: (id) => set({ selectedAircraftId: id }),
  clearSelectedAircraft: () => set({ selectedAircraftId: null }),
  
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleAirspace: () => set((state) => ({ showAirspace: !state.showAirspace })),
  
  setConnectionStatus: (status) => set({ connectionStatus: status })
}));
