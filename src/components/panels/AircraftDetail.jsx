// src/components/panels/AircraftDetail.jsx
import React from 'react';
import { useFlightStore } from '../../store/flightStore';
import { X, Plane } from 'lucide-react';

export default function AircraftDetail() {
  const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);
  const aircraft = useFlightStore(state => state.aircraft);
  const clearSelectedAircraft = useFlightStore(state => state.clearSelectedAircraft);

  if (!selectedAircraftId) return null;

  const ac = aircraft[selectedAircraftId];
  if (!ac) return null; // Edge case: selected aircraft went offline

  const timeAgoSecs = Math.floor((Date.now() / 1000) - ac.lastSeen);

  return (
    <div className="absolute right-4 top-20 w-80 bg-radar-bg/95 backdrop-blur-md border border-radar-grid rounded-lg shadow-2xl z-[1000] text-atc-text font-ui overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-radar-grid bg-[#161F2E]">
        <div className="flex items-center gap-2 text-atc-green font-bold">
          <Plane className="w-5 h-5" />
          <span className="text-lg tracking-wider">{ac.callsign}</span>
        </div>
        <button 
          onClick={clearSelectedAircraft}
          className="text-atc-dim hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
        
        <div className="col-span-1 flex flex-col">
          <span className="text-atc-dim text-[10px] uppercase tracking-wider">Altitude</span>
          <span className="font-data text-white text-base">{Math.round(ac.altitude).toLocaleString()} ft</span>
        </div>

        <div className="col-span-1 flex flex-col">
          <span className="text-atc-dim text-[10px] uppercase tracking-wider">Speed</span>
          <span className="font-data text-white text-base">{Math.round(ac.speed)} kts</span>
        </div>

        <div className="col-span-1 flex flex-col">
          <span className="text-atc-dim text-[10px] uppercase tracking-wider">Vertical</span>
          <span className={`font-data text-base ${ac.verticalRate > 0 ? 'text-blue-400' : ac.verticalRate < 0 ? 'text-orange-400' : 'text-white'}`}>
            {ac.verticalRate > 0 ? '+' : ''}{Math.round(ac.verticalRate)} fpm
          </span>
        </div>

        <div className="col-span-1 flex flex-col">
          <span className="text-atc-dim text-[10px] uppercase tracking-wider">Heading</span>
          <span className="font-data text-white text-base">{Math.round(ac.heading)}°</span>
        </div>

      </div>

      <div className="h-px w-full bg-radar-grid my-1" />

      {/* Metadata */}
      <div className="p-4 bg-[#0a0f18] text-xs grid grid-cols-2 gap-y-3 font-data">
        <div className="col-span-1 text-atc-dim flex justify-between pr-2">
          <span>ICAO</span>
          <span className="text-white">{ac.id.toUpperCase()}</span>
        </div>
        <div className="col-span-1 text-atc-dim flex justify-between pr-2">
          <span>SQUAWK</span>
          <span className="text-white">{ac.squawk || 'N/A'}</span>
        </div>
        <div className="col-span-2 text-atc-dim flex justify-between pr-2">
          <span>COUNTRY</span>
          <span className="text-white font-ui">{ac.country || 'Unknown'}</span>
        </div>
        <div className="col-span-2 text-atc-dim flex justify-between pr-2">
          <span>SOURCE</span>
          <span className="text-white">{ac.source}</span>
        </div>
        <div className="col-span-2 text-atc-dim flex justify-between pr-2">
          <span>LAST SEEN</span>
          <span className={`text-white ${timeAgoSecs > 15 ? 'text-orange-400' : ''}`}>
            {timeAgoSecs}s ago
          </span>
        </div>
      </div>

    </div>
  );
}
