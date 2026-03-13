import React from 'react';
import { useFlightStore } from '../../store/flightStore';
import { haversineDistance } from '../../lib/formatters';
import { getAirportsForRegion } from '../../lib/airportData';
import { MapPin, Wind, AlertTriangle, Crosshair } from 'lucide-react';

export default function MoroccoPanel() {
  const selectedRegion = useFlightStore(state => state.selectedRegion);
  const aircraftArray = useFlightStore(state => state.aircraftArray);
  const metarData = useFlightStore(state => state.metarData);
  const alerts = useFlightStore(state => state.alerts);
  
  const casablancaFirFocus = useFlightStore(state => state.casablancaFirFocus);
  const toggleCasablancaFirFocus = useFlightStore(state => state.toggleCasablancaFirFocus);

  if (selectedRegion.key !== 'MOROCCO') return null;

  const moroccoAirports = getAirportsForRegion('MOROCCO').filter(a => 
    ['GMMN', 'GMME', 'GMFF', 'GMMX', 'GMTT', 'GMAD'].includes(a.icao)
  );

  return (
    <div className="absolute left-4 bottom-8 w-80 bg-[#0A0F1A]/95 backdrop-blur-md border border-radar-grid rounded shadow-2xl flex flex-col z-[1000] overflow-hidden pointer-events-auto max-h-[50vh]">
      <div className="bg-[#161F2E] px-4 py-2 flex items-center justify-between border-b border-radar-grid">
        <h2 className="font-ui font-bold tracking-wider text-[11px] text-atc-green">MOROCCO OP CENTER</h2>
        <button
          onClick={toggleCasablancaFirFocus}
          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${casablancaFirFocus ? 'bg-atc-green/20 border-atc-green text-atc-green' : 'border-radar-grid text-atc-dim hover:text-white'}`}
          title="Highlight flights in Casablanca FIR"
        >
          <Crosshair className="w-3 h-3 inline mr-1" /> FIR FOCUS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col gap-2">
        {moroccoAirports.map(apt => {
          const metar = metarData.get(apt.icao);
          
          // Count planes within 50nm
          const nearbyPlanes = aircraftArray.filter(ac => haversineDistance(ac.lat, ac.lng, apt.lat, apt.lng) <= 50);
          
          // Count active alerts for nearby planes
          const nearbyAlerts = alerts.filter(al => !al.isResolved && nearbyPlanes.some(ac => ac.id === al.icao24));

          return (
            <div key={apt.icao} className="bg-[#161F2E] rounded border border-radar-grid p-2">
              <div className="flex justify-between items-center border-b border-gray-700/50 pb-1 mb-1">
                <span className="font-data font-bold text-white text-[11px]">{apt.icao} — {apt.name}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-[10px] font-ui">
                <div className="flex flex-col">
                  <span className="text-atc-dim flex items-center gap-1"><Wind className="w-3 h-3" /> WX</span>
                  <span className={`font-bold ${metar ? (metar.fltCat === 'VFR' ? 'text-green-400' : metar.fltCat === 'IFR' ? 'text-red-400' : 'text-yellow-400') : 'text-gray-500'}`}>
                    {metar ? `${metar.fltCat} | ${metar.wspd}kt` : 'N/A'}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-atc-dim flex items-center gap-1"><MapPin className="w-3 h-3" /> TFC (50nm)</span>
                  <span className="font-bold text-white">{nearbyPlanes.length}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-atc-dim flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /> ALERTS</span>
                  <span className={`font-bold ${nearbyAlerts.length > 0 ? 'text-orange-400' : 'text-gray-500'}`}>{nearbyAlerts.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
