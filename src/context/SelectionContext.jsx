/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

export const SelectionContext = createContext({
  selectedAircraftId: null,
  selectAircraft: () => {},
  clearSelection: () => {}
});

export function SelectionProvider({ children }) {
  const [selectedAircraftId, setSelectedAircraftId] = useState(null);

  const selectAircraft = useCallback((icao24) => {
    setSelectedAircraftId(icao24);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAircraftId(null);
  }, []);

  const value = useMemo(() => ({
    selectedAircraftId,
    selectAircraft,
    clearSelection
  }), [selectedAircraftId, selectAircraft, clearSelection]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  return useContext(SelectionContext);
}
