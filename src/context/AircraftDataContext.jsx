/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from 'react';

/**
 * @typedef {import('../core/opensky/types').Aircraft} Aircraft
 */

const AircraftDataContext = createContext({
  aircraft: new Map(),
  setAircraftData: () => {}
});

export function AircraftDataProvider({ children }) {
  const [aircraft, setAircraftData] = useState(() => new Map());

  const value = useMemo(() => ({
    aircraft,
    setAircraftData
  }), [aircraft]);

  return (
    <AircraftDataContext.Provider value={value}>
      {children}
    </AircraftDataContext.Provider>
  );
}

export function useAircraftDataContext() {
  return useContext(AircraftDataContext);
}

/**
 * Returns the aircraft with the given icao24 ID from context.
 * Useful for components that only need to render a single aircraft's data.
 * @param {string|null} icao24 
 * @returns {Aircraft | null}
 */
export function useAircraftById(icao24) {
  const { aircraft } = useContext(AircraftDataContext);
  if (!icao24) return null;
  return aircraft.get(icao24) || null;
}
