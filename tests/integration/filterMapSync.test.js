import { describe, it, expect, beforeEach } from 'vitest';
import { useFlightStore } from '../../src/store/flightStore';

// Initial dummy data
const mockAircraft = [
  { id: '1', category: 'military', altitude: 10000, speed: 400 },
  { id: '2', category: 'commercial', altitude: 35000, speed: 450 },
  { id: '3', category: 'military', altitude: 5000, speed: 200 }, // Low altitude military
  { id: '4', category: 'helicopter', altitude: 2000, speed: 100 },
  { id: '5', category: 'commercial', altitude: 25000, speed: 350 }, // Pinned aircraft
];

describe('Filter Map Sync Integration', () => {
    
  beforeEach(() => {
     // Reset store and inject mock data
     useFlightStore.setState({ 
        aircraft: new Map(),
        aircraftArray: [],
        filteredAircraft: [],
        filters: {},
        pinnedAircraftIds: new Set()
     });
     
     // Inject without debounce (the debounce from T029 was reverted, so this is synchronous again, but wait: setAircraftData sync logic is fine)
     useFlightStore.getState().setAircraftData(mockAircraft);
  });

  it('filteredAircraft selector returns correct subset when category filter is active', () => {
      // Apply filter for military
      useFlightStore.getState().setFilters({ categories: ['military'] });
      
      const state = useFlightStore.getState();
      expect(state.filteredAircraft.length).toBe(2);
      expect(state.filteredAircraft.map(ac => ac.id)).toEqual(expect.arrayContaining(['1', '3']));
  });

  it('confirms filtered-out aircraft are truly absent from the array (T045)', () => {
      // Apply filter for military
      useFlightStore.getState().setFilters({ categories: ['military'] });
      
      const state = useFlightStore.getState();
      
      // The array passed to AircraftLayer MUST contain zero aircraft of type commercial or helicopter
      const hasExcluded = state.filteredAircraft.some(ac => ac.category !== 'military');
      
      // Validating FR-034/FR-036: filtered-out aircraft are truly absent from the rendered array
      expect(hasExcluded).toBe(false);
  });

  it('verifies cross-property AND logic: military + altitude band', () => {
      // Filter military AND altitude between 8000 and 15000
      useFlightStore.getState().setFilters({ 
          categories: ['military'],
          altitudeMin: 8000,
          altitudeMax: 15000
      });
      
      const state = useFlightStore.getState();
      // Should only match aircraft '1'
      expect(state.filteredAircraft.length).toBe(1);
      expect(state.filteredAircraft[0].id).toBe('1');
  });

  it('pinned aircraft always present regardless of filters', () => {
      // Pin aircraft 5 (commercial)
      useFlightStore.getState().togglePinAircraft('5');
      
      // Filter for helicopter only
      useFlightStore.getState().setFilters({ categories: ['helicopter'] });
      
      const state = useFlightStore.getState();
      // Should match helicopter (4) AND pinned aircraft (5)
      expect(state.filteredAircraft.length).toBe(2);
      const ids = state.filteredAircraft.map(ac => ac.id);
      expect(ids).toContain('4');
      expect(ids).toContain('5');
  });
});
