import React, { useState, useEffect } from 'react';
import { useFlightStore } from '../../store/flightStore';
import { X, MapPin, FileText, Download, Navigation } from 'lucide-react';
import AnomalyExplanation from './AnomalyExplanation';
import SituationReportModal from '../ui/SituationReportModal';
import { generateSituationReport } from '../../lib/situationReport';
import { downloadCsv, formatAircraftCsv } from '../../lib/exportUtils';
import { formatAltitude, formatSpeed, formatHeading } from '../../lib/formatters';
import { STALE_AIRCRAFT_TTL_MS } from '../../lib/constants';

export default function AircraftDetailDrawer() {
  const selectedAircraftId = useFlightStore(state => state.selectedAircraftId);
  
  const aircraftMap = useFlightStore(state => state.aircraft);
  const aircraft = selectedAircraftId ? aircraftMap.get(selectedAircraftId) : null;
  
  const riskScores = useFlightStore(state => state.riskScores);
  const riskData = selectedAircraftId ? riskScores.get(selectedAircraftId) : null;
  const score = riskData ? riskData.score : 0;
  const threshold = riskData ? riskData.threshold : 'NORMAL';
  const explanation = riskData ? riskData.explanation : null;
  
  const pinnedAircraftIds = useFlightStore(state => state.pinnedAircraftIds);
  const isPinned = pinnedAircraftIds && pinnedAircraftIds.has(selectedAircraftId);
  
  const [sitRep, setSitRep] = useState(null);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!aircraft) return;
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, [aircraft]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        useFlightStore.getState().setSelectedAircraft(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!selectedAircraftId || !aircraft) return null;
  
  const clearSelection = () => useFlightStore.getState().setSelectedAircraft(null);

  const handlePin = () => {
    useFlightStore.getState().togglePinAircraft(selectedAircraftId);
  };

  const handleGenerateSitRep = () => {
    const report = generateSituationReport(aircraftMap, selectedAircraftId, riskData, []); 
    setSitRep(report);
  };

  const handleExport = () => {
    const csv = formatAircraftCsv(aircraft, score);
    downloadCsv(`tracon_flight_${aircraft.id}.csv`, csv);
  };
  
  const getThresholdColor = (t) => {
    if (t === 'CRITICAL') return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (t === 'WARNING') return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (t === 'ELEVATED') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-atc-green bg-atc-green/10 border-atc-green/30';
  };

  const isStale = (now / 1000) - aircraft.lastSeen > (STALE_AIRCRAFT_TTL_MS / 1000);
  const timeSinceSeconds = Math.max(0, Math.floor((now / 1000) - aircraft.lastSeen));
  const timeSinceMins = Math.floor(timeSinceSeconds / 60);
  const lastSeenText = timeSinceMins < 1 ? 'Just now' : `${timeSinceMins} min ago`;

  return (
    <div className="flex flex-col h-full bg-[#0A0F1A] border-l border-white/10 w-80 shadow-2xl overflow-y-auto custom-scrollbar font-ui relative">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#0A0F1A] sticky top-0 z-10 w-full">
        <h2 className="text-xl font-bold tracking-wider text-slate-100 font-data flex flex-col">
          <span>{aircraft.callsign || aircraft.id}</span>
          {isStale && <span className="text-[10px] text-slate-400 font-ui font-normal tracking-normal border border-slate-700/50 bg-[#1A2235]/50 px-1.5 py-0.5 mt-1 rounded inline-block w-max">Last seen: {lastSeenText}</span>}
        </h2>
        <button onClick={clearSelection} className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-[#1A2235]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1 h-full pb-10">
        {/* Risk Assessment */}
        <section>
          <div className={`flex justify-between items-center p-3 border rounded ${getThresholdColor(threshold)}`}>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider font-bold opacity-80 mb-1">Risk Score</span>
              <span className="text-2xl font-bold font-data">{score}</span>
            </div>
            <div className="px-3 py-1 rounded text-xs font-bold tracking-widest uppercase border bg-black/20" style={{ borderColor: 'inherit' }}>
              {threshold}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-3 gap-2">
          <button onClick={handlePin} className={`flex flex-col items-center justify-center p-2 rounded border transition-colors ${isPinned ? 'bg-atc-green/20 border-atc-green/50 text-atc-green' : 'bg-[#1A2235]/40 border-white/10 text-slate-300 hover:bg-[#1A2235] hover:text-white'}`}>
            <MapPin className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-bold uppercase">{isPinned ? 'Unpin' : 'Pin'}</span>
          </button>
          <button onClick={handleGenerateSitRep} className="flex flex-col items-center justify-center p-2 rounded border border-white/10 bg-[#1A2235]/40 text-slate-300 hover:bg-[#1A2235] hover:text-white transition-colors">
            <FileText className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-bold uppercase text-center leading-tight">Sit<br/>Rep</span>
          </button>
          <button onClick={handleExport} className="flex flex-col items-center justify-center p-2 rounded border border-white/10 bg-[#1A2235]/40 text-slate-300 hover:bg-[#1A2235] hover:text-white transition-colors">
            <Download className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-bold uppercase">Export</span>
          </button>
        </section>

        {/* Identity */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-3">Identity</h3>
          <div className="grid grid-cols-2 gap-y-3 font-data text-sm">
            <div>
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">ICAO24</div>
              <div className="text-slate-300">{aircraft.id}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">Country</div>
              <div className="text-slate-300">{aircraft.originCountry || 'Unknown'}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">Category</div>
              <div className="text-slate-300 capitalize">{aircraft.category || 'Unknown'}</div>
            </div>
          </div>
        </section>

        {/* Flight Data */}
        <section>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-3">Flight Data</h3>
          <div className="grid grid-cols-2 gap-y-3 font-data text-sm">
            <div>
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">Altitude</div>
              <div className="text-atc-green">{formatAltitude(aircraft.altitude)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">Speed</div>
              <div className="text-atc-green">{formatSpeed(aircraft.velocity)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">Heading</div>
              <div className="text-atc-green flex items-center gap-1">
                <Navigation className="w-3 h-3" style={{ transform: `rotate(${aircraft.heading}deg)` }}/> 
                {formatHeading(aircraft.heading)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">Squawk</div>
              <div className={`font-mono tracking-widest ${aircraft.squawk ? 'text-orange-400 font-bold' : 'text-slate-500'}`}>
                {aircraft.squawk || 'None'}
              </div>
            </div>
            <div className="col-span-2 flex justify-between">
              <div>
                <div className="text-[10px] uppercase text-slate-500 tracking-wider">Vert Rate</div>
                <div className="text-slate-300">
                   {aircraft.verticalRate ? `${aircraft.verticalRate > 0 ? '+' : ''}${Math.round(aircraft.verticalRate * 196.85)} ft/m` : 'Level'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-slate-500 tracking-wider">Baro Alt</div>
                <div className="text-slate-300">{aircraft.baroAltitude ? formatAltitude(aircraft.baroAltitude) : '--'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Flagged */}
        {score > 0 && explanation && explanation.factors && explanation.factors.length > 0 && (
          <AnomalyExplanation explanation={explanation} threshold={threshold} />
        )}
      </div>

      {sitRep && (
        <SituationReportModal report={sitRep} onClose={() => setSitRep(null)} />
      )}
    </div>
  );
}
