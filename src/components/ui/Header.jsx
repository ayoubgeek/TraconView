// src/components/ui/Header.jsx
import React, { useState } from 'react';
import { useFlightStore } from '../../store/flightStore';
import StatusIndicator from './StatusIndicator';
import RegionSelector from '../panels/RegionSelector';
import AirspaceToggle from './AirspaceToggle';
import ExportButton from './ExportButton';
import SearchBar from './SearchBar';
import FilterChips from './FilterChips';
import AdvancedFilterDrawer from '../panels/AdvancedFilterDrawer';
import { Volume2, VolumeX, Radar, Bell, Camera, Map as MapIcon, List } from 'lucide-react';
import { ViewModeContext } from '../../context/ViewModeContext';
import { useContext } from 'react';

export default function Header() {
  const { viewMode, setViewMode } = useContext(ViewModeContext);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const aircraftArray = useFlightStore(state => state.aircraftArray);
  const isMuted = useFlightStore(state => state.isMuted);
  const toggleMute = useFlightStore(state => state.toggleMute);
  const toggleSidebar = useFlightStore(state => state.toggleSidebar);
  const toggleScreenshotMode = useFlightStore(state => state.toggleScreenshotMode);

  return (
    <>
      <header className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
      
      {/* Left side: Logo and Status */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Radar className="w-6 h-6 text-atc-green" />
            <h1 className="text-xl font-bold text-white tracking-widest font-ui">
              TRACON<span className="text-atc-green">VIEW</span>
            </h1>
          </div>
          <RegionSelector />
        </div>
        
        <div className="bg-radar-bg/80 backdrop-blur-md border border-radar-grid rounded px-3 py-1.5 flex items-center shadow w-fit">
          <StatusIndicator />
        </div>
        
        <div className="mt-1 max-w-full sm:max-w-xl">
          <FilterChips 
            onToggleAdvanced={() => setIsAdvancedOpen(!isAdvancedOpen)} 
            isAdvancedOpen={isAdvancedOpen} 
          />
        </div>
      </div>

      {/* Center: Search */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-auto mt-2">
        <SearchBar />
      </div>

      {/* Right side: Global Stats and Controls */}
      <div className="flex gap-2 pointer-events-auto">
        <div className="bg-radar-bg/80 backdrop-blur-md border border-radar-grid rounded px-4 py-2 hidden sm:flex flex-col items-center justify-center shadow min-w-[100px]">
          <span className="text-[10px] text-atc-dim uppercase tracking-wider">Tracking</span>
          <span className="text-lg font-data font-bold text-atc-text">{aircraftArray.length}</span>
        </div>

        <div className="flex bg-radar-bg/80 backdrop-blur-md rounded border border-radar-grid p-1 shadow">
          <button 
            onClick={() => setViewMode('map')}
            className={`p-2 rounded transition-colors ${viewMode === 'map' ? 'bg-atc-green/20 text-atc-green' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A2235]'}`}
            title="Map View"
          >
            <MapIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-atc-green/20 text-atc-green' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A2235]'}`}
            title="List View"
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        <ExportButton />

        <button 
          onClick={toggleScreenshotMode}
          className="bg-radar-bg/80 backdrop-blur-md border border-radar-grid rounded-lg w-[42px] h-[42px] flex items-center justify-center shadow hover:bg-radar-grid transition-colors text-atc-dim hover:text-white"
          title="Screenshot Mode"
        >
          <Camera className="w-5 h-5 flex-shrink-0" />
        </button>

        <AirspaceToggle />

        <button 
          onClick={toggleMute}
          className="bg-radar-bg/80 backdrop-blur-md border border-radar-grid rounded-lg w-[42px] h-[42px] flex items-center justify-center shadow hover:bg-radar-grid transition-colors text-atc-dim hover:text-white"
          title={isMuted ? "Unmute alerts" : "Mute alerts"}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <button 
          onClick={toggleSidebar}
          className="md:hidden bg-radar-bg/80 backdrop-blur-md border border-radar-grid rounded w-12 flex items-center justify-center shadow hover:bg-radar-grid transition-colors text-atc-dim hover:text-white"
          title="Toggle Alerts"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>

    </header>

    <AdvancedFilterDrawer 
      isOpen={isAdvancedOpen} 
      onClose={() => setIsAdvancedOpen(false)} 
    />
    </>
  );
}
