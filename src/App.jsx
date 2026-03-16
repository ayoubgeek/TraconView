/**
 * @file App.jsx
 * @description Root component connecting Contexts and the RadarMap.
 */

import React, { useState } from 'react';
import { AircraftDataProvider } from './context/AircraftDataContext';
import { ConnectionProvider } from './context/ConnectionContext';
import { SelectionProvider } from './context/SelectionContext';
import RadarMap from './components/RadarMap/RadarMap';
import FlightPanel from './components/FlightPanel/FlightPanel';
import StatusBadge from './components/StatusBadge/StatusBadge';
import SettingsDrawer from './components/SettingsDrawer/SettingsDrawer';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <AircraftDataProvider>
      <ConnectionProvider>
        <SelectionProvider>
          <RadarMap />
          <FlightPanel />
          <StatusBadge onSettingsClick={() => setIsSettingsOpen(true)} />
          <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </SelectionProvider>
      </ConnectionProvider>
    </AircraftDataProvider>
  );
}
