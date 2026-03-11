// src/components/panels/RegionSelector.jsx
import React from 'react';
import { useFlightStore } from '../../store/flightStore';
import { REGIONS } from '../../lib/constants';

export default function RegionSelector() {
  const selectedRegion = useFlightStore(state => state.selectedRegion);
  const setRegion = useFlightStore(state => state.setRegion);

  return (
    <div className="flex bg-radar-bg/80 backdrop-blur-md rounded border border-radar-grid p-1 pointer-events-auto shadow">
      {Object.values(REGIONS).map((region) => {
        const isActive = selectedRegion.key === region.key;
        return (
          <button
            key={region.key}
            onClick={() => setRegion(region.key)}
            className={`px-3 py-1 text-xs font-bold font-ui rounded tracking-widest transition-colors ${
              isActive 
                ? 'bg-atc-green/20 text-atc-green border border-atc-green/50' 
                : 'text-atc-dim hover:text-white hover:bg-[#121a2f] border border-transparent'
            }`}
          >
            {region.key.replace('_', ' ')}
          </button>
        );
      })}
    </div>
  );
}
