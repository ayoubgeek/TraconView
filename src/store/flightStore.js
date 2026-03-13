// src/store/flightStore.js
import { create } from 'zustand';
import { REGIONS, DEFAULT_REGION, MAX_ANOMALY_HISTORY } from '../lib/constants';
import { updatePositionHistory as pureUpdatePositionHistory } from '../lib/holdingDetector';

export const useFlightStore = create((set, get) => ({
  // Data State
  aircraft: {},
  aircraftArray: [],
  alerts: [],
  positionHistory: new Map(),
  metarData: new Map(),
  airspaceZones: [],
  riskScores: new Map(),
  lastRefresh: null,
  
  // UI State
  selectedRegion: DEFAULT_REGION,
  selectedAircraftId: null,
  isMuted: false,
  isSidebarOpen: false,
  airspaceToggles: {
    CTR: true,
    TMA: true,
    RESTRICTED: true,
    FIR: false
  },
  casablancaFirFocus: false,
  isScreenshotMode: false,
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
  
  addOrUpdateAlert: (alert) => {
    set((state) => {
      // Find if alert for this aircraft already exists and is active (not resolved)
      const existingIdx = state.alerts.findIndex(a => a.icao24 === alert.icao24 && !a.isResolved);
      
      let newAlerts = [...state.alerts];
      if (existingIdx >= 0) {
        newAlerts[existingIdx] = { ...newAlerts[existingIdx], ...alert };
      } else {
        newAlerts = [alert, ...newAlerts].slice(0, MAX_ANOMALY_HISTORY);
      }
      
      return { alerts: newAlerts };
    });
  },
  
  resolveAlert: (icao24) => {
    set((state) => {
      const newAlerts = state.alerts.map(a => {
        if (a.icao24 === icao24 && !a.isResolved) {
          return { ...a, isResolved: true, resolvedAt: new Date().toISOString() };
        }
        return a;
      });
      return { alerts: newAlerts };
    });
  },
  
  updatePositionHistory: (aircraftArray) => {
    set((state) => {
      const currentTimeSecs = Date.now() / 1000;
      const newHistory = pureUpdatePositionHistory(state.positionHistory, aircraftArray, currentTimeSecs);
      return { positionHistory: newHistory };
    });
  },
  
  setMetarData: (metarArray) => {
    set((state) => {
      const newMetarData = new Map(state.metarData);
      for (const m of metarArray) {
        newMetarData.set(m.icao, m);
      }
      return { metarData: newMetarData };
    });
  },
  
  setAirspaceZones: (zones) => set({ airspaceZones: zones }),
  
  updateAirspaceOccupancy: (occupancyMap) => {
    set((state) => {
      const newZones = state.airspaceZones.map(zone => ({
        ...zone,
        occupancyCount: occupancyMap.get(zone.id) || 0
      }));
      return { airspaceZones: newZones };
    });
  },
  
  setRegion: (regionKey) => {
    if (REGIONS[regionKey]) {
      set({ 
        selectedRegion: REGIONS[regionKey],
        aircraft: {},
        aircraftArray: [],
        positionHistory: new Map(), // clear on region change
        alerts: [] // optional: clear on region change
      });
    }
  },
  
  setSelectedAircraft: (id) => set({ selectedAircraftId: id }),
  clearSelectedAircraft: () => set({ selectedAircraftId: null }),
  
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  toggleAirspaceLayer: (layer) => set((state) => ({
    airspaceToggles: {
      ...state.airspaceToggles,
      [layer]: !state.airspaceToggles[layer]
    }
  })),
  
  toggleScreenshotMode: () => set((state) => ({ isScreenshotMode: !state.isScreenshotMode })),
  
  toggleCasablancaFirFocus: () => set((state) => ({ casablancaFirFocus: !state.casablancaFirFocus })),
  
  setAircraftHoldingStatus: (id, isHolding) => {
    set((state) => {
      const ac = state.aircraft[id];
      if (!ac) return state;
      
      const newAc = { ...ac, isHolding };
      const newDict = { ...state.aircraft, [id]: newAc };
      const newArr = state.aircraftArray.map(a => a.id === id ? newAc : a);
      
      return { aircraft: newDict, aircraftArray: newArr };
    });
  },
  
  setConnectionStatus: (status) => set({ connectionStatus: status })
}));
