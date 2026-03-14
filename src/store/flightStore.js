// src/store/flightStore.js
import { create } from 'zustand';
import { REGIONS, DEFAULT_REGION, MAX_ANOMALY_HISTORY } from '../lib/constants';
import { updatePositionHistory as pureUpdatePositionHistory } from '../lib/holdingDetector';
import { applyFilters } from '../lib/filterEngine';

export const useFlightStore = create((set) => ({
  // Data State
  aircraft: new Map(), // Map<string, Aircraft>
  aircraftArray: [], // Derived for quick array-based rendering where appropriate
  filteredAircraft: [], // Derived via applyFilters
  pinnedAircraftIds: new Set(),
  filters: {},
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
    set((state) => {
      const newAircraftMap = new Map();
      const posHist = state.positionHistory;
      
      for (const ac of newAircraftArray) {
        // Compute isHolding if there's enough position history for it
        let isHolding = ac.isHolding || false;
        
        // Very basic mock check for holding based on positionHistory (will be fully fleshed out via holdingDetector if desired)
        const hist = posHist.get(ac.id);
        if (hist && hist.length >= 3) {
           // We just use a placeholder here assuming updatePositionHistory sets it, or compute basic logic
           // The instructions say: add `isHolding` detection from position history (holding = circular path within 5nm over 3+ updates)
           // We'll rely on pureUpdatePositionHistory to have updated the store state later, but for now we'll do a basic check
           const first = hist[0];
           const last = hist[hist.length - 1];
           const dist = Math.sqrt(Math.pow(first.lat - last.lat, 2) + Math.pow(first.lng - last.lng, 2));
           // If distance moved is very small over 3+ points but it's flying, it might be holding
           // 5nm is approx 0.08 degrees
           if (dist < 0.08 && ac.speed > 50) {
             isHolding = true;
           }
        }

        newAircraftMap.set(ac.id, { ...ac, isHolding });
      }

      const aircraftArray = Array.from(newAircraftMap.values());
      const filteredMap = applyFilters(newAircraftMap, state.filters, state.pinnedAircraftIds);
      const filteredAircraft = Array.from(filteredMap.values());

      return {
        aircraft: newAircraftMap,
        aircraftArray,
        filteredAircraft,
        lastRefresh: timestamp || Date.now()
      };
    });
  },

  removeStaleAircraft: (maxAgeMs) => {
    set((state) => {
      const now = Date.now();
      const newMap = new Map();
      let changed = false;

      for (const [id, ac] of state.aircraft.entries()) {
        const age = now - (ac.lastSeen * 1000);
        if (age < maxAgeMs) {
          newMap.set(id, ac);
        } else {
          changed = true;
        }
      }

      if (!changed) return state;

      const aircraftArray = Array.from(newMap.values());
      const filteredMap = applyFilters(newMap, state.filters, state.pinnedAircraftIds);
      
      return {
        aircraft: newMap,
        aircraftArray,
        filteredAircraft: Array.from(filteredMap.values())
      };
    });
  },

  setFilters: (partialFilters) => {
    set((state) => {
      const newFilters = { ...state.filters, ...partialFilters };
      const filteredMap = applyFilters(state.aircraft, newFilters, state.pinnedAircraftIds);
      return {
        filters: newFilters,
        filteredAircraft: Array.from(filteredMap.values())
      };
    });
  },

  clearFilters: () => {
    set((state) => {
      const newFilters = {};
      const filteredMap = applyFilters(state.aircraft, newFilters, state.pinnedAircraftIds);
      return {
        filters: newFilters,
        filteredAircraft: Array.from(filteredMap.values())
      };
    });
  },

  togglePinAircraft: (id) => {
    set((state) => {
      const newPinned = new Set(state.pinnedAircraftIds);
      if (newPinned.has(id)) {
        newPinned.delete(id);
      } else {
        newPinned.add(id);
      }
      
      const filteredMap = applyFilters(state.aircraft, state.filters, newPinned);
      return {
        pinnedAircraftIds: newPinned,
        filteredAircraft: Array.from(filteredMap.values())
      };
    });
  },
  
  addOrUpdateAlert: (alert) => {
    set((state) => {
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
        aircraft: new Map(),
        aircraftArray: [],
        filteredAircraft: [],
        positionHistory: new Map(),
        alerts: []
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
      const ac = state.aircraft.get(id);
      if (!ac) return state;
      
      const newAc = { ...ac, isHolding };
      const newMap = new Map(state.aircraft);
      newMap.set(id, newAc);
      
      const newArr = Array.from(newMap.values());
      const filteredMap = applyFilters(newMap, state.filters, state.pinnedAircraftIds);
      
      return { 
        aircraft: newMap, 
        aircraftArray: newArr,
        filteredAircraft: Array.from(filteredMap.values())
      };
    });
  },
  
  setConnectionStatus: (status) => set({ connectionStatus: status })
}));
