import React from 'react';
import { useFlightStore } from '../../store/flightStore';
import { MapPin, X } from 'lucide-react';
import { AIRCRAFT_CATEGORY_COLORS } from '../../lib/constants';

export default function PinnedFlightsList() {
  const pinnedAircraftIds = useFlightStore(state => state.pinnedAircraftIds);
  const aircraftMap = useFlightStore(state => state.aircraft);
  const setSelectedAircraft = useFlightStore(state => state.setSelectedAircraft);
  const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);
  const togglePinAircraft = useFlightStore(state => state.togglePinAircraft);

  const pinnedList = Array.from(pinnedAircraftIds)
    .map(id => aircraftMap.get(id))
    .filter(Boolean);

  if (pinnedList.length === 0) return null;

  return (
    <div className="font-ui border-b border-[#1A2235]">
      <div className="px-4 py-2 bg-[#050A15]/50 border-b border-[#1A2235] flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-atc-green" />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pinned Flights</h3>
      </div>
      <div className="max-h-48 overflow-y-auto custom-scrollbar bg-[#0A0F1A]">
        {pinnedList.map(ac => {
          const isSelected = selectedAircraftId === ac.id;
          return (
            <button
              key={ac.id}
              onClick={() => setSelectedAircraft(ac.id)}
              className={`group w-full text-left px-4 py-2 flex items-center justify-between border-b border-[#1A2235]/50 transition-colors relative ${isSelected ? 'bg-atc-green/10 text-atc-green' : 'text-slate-300 hover:bg-[#1A2235]/40 hover:text-white'}`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: AIRCRAFT_CATEGORY_COLORS[ac.category] || AIRCRAFT_CATEGORY_COLORS.unknown }}
                />
                <div className="font-data font-bold text-sm tracking-wide">
                  {ac.callsign || ac.id}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider group-hover:opacity-0 transition-opacity">
                  {ac.altitude ? `${Math.round(ac.altitude * 3.28084)}FT` : '--'}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinAircraft(ac.id);
                  }}
                  className="absolute right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700/80 rounded text-slate-400 hover:text-white transition-all z-10"
                  title="Unpin"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
