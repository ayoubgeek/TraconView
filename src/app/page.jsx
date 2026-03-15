// src/app/page.jsx
import React, { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Header from '../components/ui/Header';
import TraconMap from '../components/map/TraconMap';
import StatsPanel from '../components/panels/StatsPanel';
import SavedViewPanel from '../components/panels/SavedViewPanel';
import PinnedFlightsList from '../components/panels/PinnedFlightsList';
import AircraftDetailDrawer from '../components/panels/AircraftDetailDrawer';
import { useOpenSky } from '../hooks/useOpenSky';
import { useAnomalyEngine } from '../hooks/useAnomalyEngine';
import { useFlightStore } from '../store/flightStore';

// AUDIT FINDING (T001): AlertSidebar is being removed. Note that AircraftDetailDrawer does cover anomaly details but only per-aircraft. The global alert feed will be lost.
// AUDIT FINDING (T002): AircraftDetail is being removed. Note that it contains Planespotters.net photo fetching which is currently NOT present in AircraftDetailDrawer.

export default function Page() {
  // Initialize OpenSky data fetching loop
  useOpenSky();
  // Initialize anomaly detection engine
  useAnomalyEngine();

  const aircraftCount = useFlightStore(state => state.aircraftArray.length);
  const connectionStatus = useFlightStore(state => state.connectionStatus);
  const isScreenshotMode = useFlightStore(state => state.isScreenshotMode);
  const toggleScreenshotMode = useFlightStore(state => state.toggleScreenshotMode);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && useFlightStore.getState().isScreenshotMode) {
        useFlightStore.getState().toggleScreenshotMode();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (isScreenshotMode) {
    return (
      <div className="w-full h-screen relative pb-6 bg-[#0A0F1A] flex items-center justify-center font-ui">
        <div className="relative flex w-[1200px] h-[630px] border border-radar-grid shadow-2xl overflow-hidden">
          <div className="flex-1 h-full relative radar-sweep overflow-hidden bg-radar-bg">
            <TraconMap />
            <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
              <h1 className="text-3xl font-bold text-white tracking-widest font-ui drop-shadow-md">
                TRACON<span className="text-atc-green">VIEW</span>
              </h1>
              <div className="text-atc-dim font-ui text-sm tracking-wider mt-1 drop-shadow-md">LIVE FLIGHT ANOMALY RADAR</div>
            </div>
            <button 
              onClick={toggleScreenshotMode} 
              className="absolute top-4 right-4 z-[1000] bg-radar-bg/80 backdrop-blur border border-radar-grid rounded px-3 py-1.5 text-xs text-atc-dim hover:text-white transition-colors cursor-pointer pointer-events-auto"
            >
              Exit Screenshot Mode [ESC]
            </button>
            {aircraftCount === 0 && connectionStatus === 'LIVE' && (
              <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none">
                <span className="text-atc-dim text-sm font-ui bg-radar-bg/80 px-4 py-2 rounded border border-radar-grid">
                  No aircraft in range
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      header={<Header />}
      rightDrawer={<AircraftDetailDrawer />}
      sidebar={
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          <SavedViewPanel />
          <PinnedFlightsList />
        </div>
      }
      analyticsPanel={<StatsPanel />}
    >
      <TraconMap />
      {aircraftCount === 0 && connectionStatus === 'LIVE' && (
        <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none">
          <span className="text-atc-dim text-sm font-ui bg-radar-bg/80 px-4 py-2 rounded border border-radar-grid">
            No aircraft in range
          </span>
        </div>
      )}
    </AppLayout>
  );
}
