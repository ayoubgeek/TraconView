import { create } from 'zustand';
import { search } from '../lib/searchEngine';
import { useFlightStore } from './flightStore';

let searchTimeout = null;

export const useSearchStore = create((set) => ({
    query: '',
    results: [],
    isOpen: false,

    setQuery: (newQuery) => {
        set({ query: newQuery, isOpen: newQuery.trim().length >= 2 });
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        searchTimeout = setTimeout(() => {
            const aircraftMap = useFlightStore.getState().aircraft;
            const res = search(newQuery, aircraftMap);
            set({ results: res });
        }, 300);
    },

    selectResult: (result) => {
        const id = result.aircraft.id;
        useFlightStore.getState().setSelectedAircraft(id);
        
        // Emit map-center event via custom event for map components to catch
        const event = new CustomEvent('center-map-on-aircraft', { detail: { aircraft: result.aircraft } });
        window.dispatchEvent(event);
        
        set({ isOpen: false }); // keep the query but close dropdown, or clear entirely? The spec says selects usually close it.
    },

    clearSearch: () => {
        if (searchTimeout) clearTimeout(searchTimeout);
        set({ query: '', results: [], isOpen: false });
    },
    
    setIsOpen: (isOpen) => set({ isOpen })
}));
