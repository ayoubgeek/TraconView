import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { useFlightStore } from '../../store/flightStore';

export default function AirspaceToggle() {
  const toggles = useFlightStore(state => state.airspaceToggles);
  const toggleAirspaceLayer = useFlightStore(state => state.toggleAirspaceLayer);
  
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-radar-bg/80 backdrop-blur-md border border-radar-grid rounded-lg h-[42px] px-3 flex items-center justify-center shadow hover:bg-radar-grid transition-colors text-atc-dim hover:text-white ${isOpen ? 'bg-[#161F2E]' : ''}`}
        title="Map Layers"
      >
        <Layers className="w-5 h-5 flex-shrink-0" />
        <span className="hidden sm:inline ml-2 text-[10px] font-ui uppercase tracking-wider font-bold">Layers</span>
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-[#0A0F1A]/95 backdrop-blur-md border border-radar-grid rounded shadow-xl w-52 p-2 z-[1001] flex flex-col gap-1 font-ui">
          <span className="text-atc-dim text-[10px] uppercase tracking-wider px-2 py-1 border-b border-radar-grid mb-1">Airspace Layers</span>
          
          {[
            { id: 'CTR', label: 'Control Zones (CTR)' },
            { id: 'TMA', label: 'Terminal Areas (TMA)' },
            { id: 'RESTRICTED', label: 'Restricted/Danger' },
            { id: 'FIR', label: 'FIR Boundaries' }
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => toggleAirspaceLayer(layer.id)}
              className="flex items-center justify-between px-2 py-2 hover:bg-[#161F2E] rounded text-left transition-colors"
            >
              <span className="text-xs text-atc-text font-bold">{layer.label}</span>
              <div className={`w-8 h-4 rounded-full border border-radar-grid relative transition-colors ${toggles[layer.id] ? 'bg-atc-green/20 border-atc-green' : 'bg-transparent'}`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${toggles[layer.id] ? 'bg-atc-green left-[17px]' : 'bg-atc-dim left-[3px]'}`} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
