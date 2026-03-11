// src/app/page.jsx
import React from 'react';
import Header from '../components/ui/Header';
import TraconMap from '../components/map/TraconMap';
import AircraftDetail from '../components/panels/AircraftDetail';
import AlertSidebar from '../components/panels/AlertSidebar';
import StatsPanel from '../components/panels/StatsPanel';
import { useOpenSky } from '../hooks/useOpenSky';
import { useAnomalyEngine } from '../hooks/useAnomalyEngine';

export default function Page() {
  // Initialize OpenSky data fetching loop
  useOpenSky();
  // Initialize anomaly detection engine
  useAnomalyEngine();

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
        </div>
        <AlertSidebar />
      </div>
    </div>
  );
}
