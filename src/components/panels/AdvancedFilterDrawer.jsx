import React, { useState, useEffect } from 'react';
import { useFlightStore } from '../../store/flightStore';
import { FILTER_DEBOUNCE_MS } from '../../lib/constants';
import { X, SlidersHorizontal, RefreshCcw } from 'lucide-react';

export default function AdvancedFilterDrawer({ isOpen, onClose }) {
  const storeFilters = useFlightStore(state => state.filters);
  const setFilters = useFlightStore(state => state.setFilters);
  
  // Local state for debouncing
  const [localAltMin, setLocalAltMin] = useState(storeFilters.altitudeMin ?? '');
  const [localAltMax, setLocalAltMax] = useState(storeFilters.altitudeMax ?? '');
  const [localSpeedMin, setLocalSpeedMin] = useState(storeFilters.speedMin ?? '');
  const [localSpeedMax, setLocalSpeedMax] = useState(storeFilters.speedMax ?? '');
  const [localSquawks, setLocalSquawks] = useState(storeFilters.squawkCodes ? storeFilters.squawkCodes.join(',') : '');
  
  // Sync local state when store filters change (e.g. from Clear All)
  useEffect(() => {
    setLocalAltMin(storeFilters.altitudeMin ?? '');
    setLocalAltMax(storeFilters.altitudeMax ?? '');
    setLocalSpeedMin(storeFilters.speedMin ?? '');
    setLocalSpeedMax(storeFilters.speedMax ?? '');
    setLocalSquawks(storeFilters.squawkCodes ? storeFilters.squawkCodes.join(',') : '');
  }, [storeFilters]);
  
  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const squawkArray = localSquawks.split(',').map(s => s.trim()).filter(Boolean);
      
      setFilters({
        altitudeMin: localAltMin !== '' ? Number(localAltMin) : null,
        altitudeMax: localAltMax !== '' ? Number(localAltMax) : null,
        speedMin: localSpeedMin !== '' ? Number(localSpeedMin) : null,
        speedMax: localSpeedMax !== '' ? Number(localSpeedMax) : null,
        squawkCodes: squawkArray.length > 0 ? squawkArray : null
      });
    }, FILTER_DEBOUNCE_MS);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAltMin, localAltMax, localSpeedMin, localSpeedMax, localSquawks]); 

  const handleReset = () => {
    setLocalAltMin('');
    setLocalAltMax('');
    setLocalSpeedMin('');
    setLocalSpeedMax('');
    setLocalSquawks('');
  };

  return (
    <div className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-80 bg-[#0A0F1A]/95 backdrop-blur-md border-r border-slate-700 shadow-2xl z-40 transform transition-transform duration-300 font-ui text-slate-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2 text-sm"><SlidersHorizontal className="w-4 h-4 text-atc-green"/> Advanced Filters</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
      </div>
      
      <div className="p-4 flex flex-col gap-6 overflow-y-auto h-full pb-20 [&::-webkit-scrollbar]:hidden">
        
        {/* Altitude Band */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-atc-dim uppercase tracking-wider font-bold">Altitude (FT)</label>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="Min" value={localAltMin} onChange={e => setLocalAltMin(e.target.value)} className="w-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-atc-green outline-none font-data transition-colors" />
            <span className="text-slate-500">-</span>
            <input type="number" placeholder="Max" value={localAltMax} onChange={e => setLocalAltMax(e.target.value)} className="w-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-atc-green outline-none font-data transition-colors" />
          </div>
        </div>

        {/* Speed Band */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-atc-dim uppercase tracking-wider font-bold">Speed (KTS)</label>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="Min" value={localSpeedMin} onChange={e => setLocalSpeedMin(e.target.value)} className="w-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-atc-green outline-none font-data transition-colors" />
            <span className="text-slate-500">-</span>
            <input type="number" placeholder="Max" value={localSpeedMax} onChange={e => setLocalSpeedMax(e.target.value)} className="w-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:border-atc-green outline-none font-data transition-colors" />
          </div>
        </div>
        
        {/* Squawk Codes */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-atc-dim uppercase tracking-wider font-bold">Squawk Codes (CSV)</label>
          <input type="text" placeholder="e.g. 7700, 7600" value={localSquawks} onChange={e => setLocalSquawks(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm focus:border-atc-green outline-none font-data transition-colors" />
          <span className="text-[10px] text-slate-500">Comma-separated list of 4-digit codes</span>
        </div>
        
        {/* Reset Button */}
        <button onClick={handleReset} className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-sm transition-colors text-slate-300">
           <RefreshCcw className="w-4 h-4" /> Reset Advanced
        </button>
      </div>
    </div>
  );
}
