import React, { useMemo } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { useFlightStore } from '../../store/flightStore';
import { getFlightCategoryColor, isMetarStale } from '../../lib/metarClient';
import { getAirportsForRegion } from '../../lib/airportData';

export default function WeatherLayer() {
  const selectedRegion = useFlightStore(state => state.selectedRegion);
  const metarData = useFlightStore(state => state.metarData);

  const airports = useMemo(() => {
    return getAirportsForRegion(selectedRegion.key);
  }, [selectedRegion]);

  return (
    <>
      {airports.map(apt => {
        const metar = metarData.get(apt.icao);
        if (!metar) return null; 

        const { stale } = isMetarStale(metar.obsTime);
        const color = getFlightCategoryColor(metar.fltCat);
        
        return (
          <CircleMarker
            key={apt.icao}
            center={[apt.lat, apt.lng]}
            radius={8}
            pathOptions={{ 
              color: '#000', 
              weight: 1, 
              fillColor: color, 
              fillOpacity: stale ? 0.3 : 0.8 
            }}
          >
            <Popup className="metar-popup p-0 border-0 bg-transparent rounded shadow-2xl">
              <div className="flex flex-col gap-1 p-3 bg-[#0A0F1A] text-white font-data text-xs border border-radar-grid rounded min-w-[200px]">
                <div className="border-b border-radar-grid pb-1 mb-1 font-bold flex justify-between items-center text-sm">
                  <span>{apt.icao}</span>
                  <span style={{ color }} className="border border-current px-1 rounded">{metar.fltCat}</span>
                </div>
                {stale && <div className="text-red-400 text-[10px] uppercase font-bold mb-1">Warning: Data is stale</div>}
                
                <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-xs">
                  <span className="text-atc-dim">Wind</span>
                  <span>{metar.wdir}° @ {metar.wspd}KT {metar.wgst ? `G${metar.wgst}` : ''}</span>
                  
                  <span className="text-atc-dim">Vis</span>
                  <span>{metar.visib} SM</span>
                  
                  <span className="text-atc-dim">Clouds</span>
                  <span>{metar.clouds.map(c => `${c.cover}${String(c.base/100).padStart(3, '0')}`).join(', ') || 'CLR'}</span>
                  
                  <span className="text-atc-dim">Temp/Dew</span>
                  <span>{metar.temp}°C / {metar.dewp}°C</span>
                  
                  <span className="text-atc-dim">QNH</span>
                  <span>{metar.altim} mb</span>
                </div>
                
                <div className="mt-2 border-t border-radar-grid pt-2">
                  <span className="text-atc-dim text-[10px] block mb-1 uppercase tracking-wider">Raw Report</span>
                  <p className="text-[10px] leading-tight break-words text-yellow-100 font-mono">{metar.rawOb}</p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
