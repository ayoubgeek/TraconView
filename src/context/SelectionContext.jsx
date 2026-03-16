/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

export const SelectionContext = createContext({
  selectedAircraftId: null,
  isFocused: false,
  selectAircraft: () => {},
  clearSelection: () => {},
  toggleFocus: () => {}
});

export function SelectionProvider({ children }) {
  const [selectedAircraftId, setSelectedAircraftId] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const selectAircraft = useCallback((icao24) => {
    setSelectedAircraftId(icao24);
    setIsFocused(false);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAircraftId(null);
    setIsFocused(false);
  }, []);

  const toggleFocus = useCallback(() => {
    setIsFocused(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    selectedAircraftId,
    isFocused,
    selectAircraft,
    clearSelection,
    toggleFocus
  }), [selectedAircraftId, isFocused, selectAircraft, clearSelection, toggleFocus]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  return useContext(SelectionContext);
}
