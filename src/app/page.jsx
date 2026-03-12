// src/app/page.jsx
import React from 'react';
import Header from '../components/ui/Header';
import TraconMap from '../components/map/TraconMap';
import AircraftDetail from '../components/panels/AircraftDetail';
import AlertSidebar from '../components/panels/AlertSidebar';
import StatsPanel from '../components/panels/StatsPanel';
import { useOpenSky } from '../hooks/useOpenSky';
import { useAnomalyEngine } from '../hooks/useAnomalyEngine';

import { useFlightStore } from '../store/flightStore';

export default function Page() {
  // Initialize OpenSky data fetching loop
  useOpenSky();
  // Initialize anomaly detection engine
  useAnomalyEngine();

  const aircraftCount = useFlightStore(state => state.aircraftArray.length);
  const connectionStatus = useFlightStore(state => state.connectionStatus);

  return (
    <div className="w-full h-[calc(100vh-25px)] relative pb-6">
      <Header />
      
      {/* 
        Container for the map and overlay panels.
        It leaves bottom space for the layout footer.
      */}
      <div className="w-full h-full relative flex">
        <div className="flex-1 h-full relative radar-sweep overflow-hidden">
          <TraconMap />
          <AircraftDetail />
          <StatsPanel />
          {aircraftCount === 0 && connectionStatus === 'LIVE' && (
            <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none">
              <span className="text-atc-dim text-sm font-ui bg-radar-bg/80 px-4 py-2 rounded border border-radar-grid">
                No aircraft in range
              </span>
            </div>
          )}
        </div>
        <AlertSidebar />
      </div>
    </div>
  );
}
