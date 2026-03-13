import React, { useMemo } from 'react';
import { useFlightStore } from '../../store/flightStore';
import { generateSituationReport } from '../../lib/situationReport';
import { findNearestAirport } from '../../lib/formatters';
import { getAirportsForRegion } from '../../lib/airportData';
import { FileText, Download } from 'lucide-react';

export default function SituationReport() {
  const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);
  const aircraftArray = useFlightStore(state => state.aircraftArray);
  const riskScores = useFlightStore(state => state.riskScores);
  const metarData = useFlightStore(state => state.metarData);
  const selectedRegion = useFlightStore(state => state.selectedRegion);

  const aircraft = useMemo(() => aircraftArray.find(a => a.id === selectedAircraftId), [aircraftArray, selectedAircraftId]);

  const report = useMemo(() => {
    if (!aircraft) return null;
    
    // Get risk result
    const riskResult = riskScores.get(aircraft.id) || { score: 0, threshold: 'NORMAL', rules: [] };
    
    // Get nearest airport
    const airports = getAirportsForRegion(selectedRegion.key);
    const nearestAirport = findNearestAirport(aircraft.lat, aircraft.lng, airports);
    
    // Get METAR if airport found
    let metar = null;
    if (nearestAirport) {
      metar = metarData.get(nearestAirport.icao);
    }

    return generateSituationReport(aircraft, riskResult, nearestAirport, metar);
  }, [aircraft, riskScores, metarData, selectedRegion]);

  if (!aircraft || !report) return null;

  const downloadReport = () => {
    const blob = new Blob([report.formatted], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SITREP_${aircraft.callsign || aircraft.id}_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute right-[310px] top-20 w-[420px] bg-[#0A0F1A]/95 backdrop-blur-md border border-radar-grid rounded shadow-2xl flex flex-col z-[1000] overflow-hidden pointer-events-auto h-[500px] max-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="bg-[#161F2E] px-4 py-3 flex items-center justify-between border-b border-radar-grid">
        <div className="flex items-center gap-2 text-atc-green">
          <FileText className="w-5 h-5" />
          <h2 className="font-ui font-bold tracking-wider text-[11px] sm:text-xs">SITUATION REPORT</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={downloadReport}
            className="text-atc-dim hover:text-white transition-colors"
            title="Download Report as TXT"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content - Monospace Text */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/40">
        <pre className="font-data text-[11px] leading-relaxed text-[#00ffcc] whitespace-pre-wrap">
          {report.formatted}
        </pre>
      </div>
    </div>
  );
}
