import React, { useMemo, useState, useEffect } from 'react';
import { useFlightStore } from '../../store/flightStore';
import { useRadarSnapshot } from '../../hooks/useRadarSnapshot';
import { UI_INTERVALS } from '../../lib/constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Sector, AreaChart, Area } from 'recharts';
import { Plane, AlertTriangle, ShieldCheck, ArrowUpRight, ArrowDownRight, Minus, Activity, Wind } from 'lucide-react';

const DONUT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];
const ANIMATION_MS = 1000;

const TrendIndicator = ({ delta, inverse = false }) => {
  if (!delta || delta === 0) return <Minus className="w-3 h-3 text-atc-dim ml-1" />;
  const isGood = inverse ? delta < 0 : delta > 0;
  if (delta > 0) return <ArrowUpRight className={`w-3 h-3 ml-1 ${isGood ? 'text-atc-green' : 'text-red-400'}`} />;
  return <ArrowDownRight className={`w-3 h-3 ml-1 ${isGood ? 'text-atc-green' : 'text-red-400'}`} />;
};

export default function StatsPanel() {
  const filteredAircraft = useFlightStore(state => state.filteredAircraft);
  const aircraftArray = useFlightStore(state => state.aircraftArray);
  const alerts = useFlightStore(state => state.alerts);
  const riskScores = useFlightStore(state => state.riskScores);
  
  const { snapshot } = useRadarSnapshot();
  const [currentTime, setCurrentTime] = useState(Date.now());
  // Clock for updates
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), UI_INTERVALS.STATS_CLOCK_MS);
    return () => clearInterval(timer);
  }, []);

  const { kpis, altData, countryData, timelineData, trends } = useMemo(() => {
    // ---- Fallback Local Computation ----
    let inFlight = 0;
    let activeAnomalies = 0;
    let freshDataCount = 0;
    const now = Date.now() / 1000;

    const reqData = {};
    const altBuckets = {
       '0-5K': 0, '5-10K': 0, '10-20K': 0, 'FL20-30': 0, 'FL30-40': 0, 'FL40+': 0
    };

    aircraftArray.forEach(ac => {
      if (!ac.onGround) {
         inFlight++;
         const alt = ac.altitude || 0;
         if (alt < 5000) altBuckets['0-5K']++;
         else if (alt < 10000) altBuckets['5-10K']++;
         else if (alt < 20000) altBuckets['10-20K']++;
         else if (alt < 30000) altBuckets['FL20-30']++;
         else if (alt < 40000) altBuckets['FL30-40']++;
         else altBuckets['FL40+']++;
      }

      const risk = riskScores.get(ac.id);
      if (risk && risk.score > 25) activeAnomalies++;
      if ((now - ac.lastSeen) < 15) freshDataCount++;

      const country = ac.country || 'Unknown';
      reqData[country] = (reqData[country] || 0) + 1;
    });

    const totalAc = aircraftArray.length;
    const coverageInt = totalAc > 0 ? Math.round((freshDataCount / totalAc) * 100) : 100;

    let formattedAlt = Object.entries(altBuckets).map(([name, count]) => ({ name, count }));
    
    const sortedCountries = Object.entries(reqData).sort((a,b)=>b[1]-a[1]);
    const top5 = sortedCountries.slice(0, 5).map(([name, value]) => ({ name, value }));
    const otherCount = sortedCountries.slice(5).reduce((acc, [,val])=>acc+val, 0);
    if (otherCount > 0) top5.push({ name: 'Other', value: otherCount });

    // 12 data points for 2-hour window (10 min bins)
    const timeline = [];
    const twoHoursAgo = Date.now() - (120 * 60 * 1000);
    for(let i=0; i<12; i++) {
       const d = new Date(twoHoursAgo + (i * 10 * 60 * 1000));
       timeline.push({ time: `${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}`, count: 0 });
    }
    let hasAnomalies = false;
    alerts.forEach(alert => {
      const dt = new Date(alert.detectedAt).getTime();
      if (dt > twoHoursAgo) {
        const diffMs = dt - twoHoursAgo;
        const binIndex = Math.min(11, Math.floor(diffMs / (10 * 60 * 1000)));
        timeline[binIndex].count++;
        hasAnomalies = true;
      }
    });

    let currentKpis = { total: totalAc, inFlight, activeAnomalies, coverage: coverageInt };
    let currentTrends = { totalDelta: 0, inFlightDelta: 0, anomalyDelta: 0, coverageDelta: 0 };
    
    // ---- Use Snapshot if available ----
    if (snapshot) {
      currentKpis = {
        total: snapshot.total_aircraft !== undefined ? snapshot.total_aircraft : currentKpis.total,
        inFlight: snapshot.in_flight !== undefined ? snapshot.in_flight : currentKpis.inFlight,
        activeAnomalies: snapshot.active_anomalies !== undefined ? snapshot.active_anomalies : currentKpis.activeAnomalies,
        coverage: snapshot.coverage_percent !== undefined ? snapshot.coverage_percent : currentKpis.coverage
      };
      if (snapshot.statistics) {
        if (snapshot.statistics.altitudeBands) {
           formattedAlt = Object.entries(snapshot.statistics.altitudeBands).map(([name, count]) => ({ name, count }));
        }
        if (snapshot.statistics.countryBreakdown) {
           const cb = Object.entries(snapshot.statistics.countryBreakdown).map(([name, value]) => ({ name, value }));
           top5.length = 0;
           top5.push(...cb);
        }
      }
      if (snapshot.trends) {
         currentTrends = {
            totalDelta: snapshot.trends.totalDelta || 0,
            inFlightDelta: snapshot.trends.inFlightDelta || 0,
            anomalyDelta: snapshot.trends.anomalyDelta || 0,
            coverageDelta: snapshot.trends.coverageDelta || 0
         };
      }
    }

    return { 
       kpis: currentKpis,
       altData: formattedAlt,
       countryData: top5,
       timelineData: hasAnomalies || snapshot ? timeline : timeline, // Always show timeline base shape
       trends: currentTrends
    };

  }, [aircraftArray, alerts, riskScores, snapshot]);

  const CustomTooltipContent = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalCount = payload[0]?.chartType === 'pie' 
        ? countryData.reduce((acc, curr) => acc + curr.value, 0)
        : altData.reduce((acc, curr) => acc + curr.count, 0);
        
      const val = payload[0].value;
      const percent = totalCount > 0 ? Math.round((val / totalCount) * 100) : 0;

      return (
        <div className="bg-[#0B101E]/95 backdrop-blur border border-[#1A2235] p-2 text-xs text-gray-200 shadow-md">
          <p className="font-bold mb-1 text-atc-green">{label || data.name}</p>
          <div className="flex justify-between gap-4">
             <span className="text-slate-400">Count:</span>
             <span className="font-mono">{val}</span>
          </div>
          {payload[0]?.chartType !== 'area' && (
             <div className="flex justify-between gap-4">
               <span className="text-slate-400">Share:</span>
               <span className="font-mono">{percent}%</span>
             </div>
          )}
        </div>
      );
    }
    return null;
  };

  const getRelativeTimeStr = (isoString) => {
    if (!isoString) return 'No complete snapshot';
    const ms = currentTime - new Date(isoString).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    return `${mins} min ago`;
  };

  return (
    <div className="flex flex-col h-full font-ui bg-[#0A0F1A]">
      <div className="px-4 py-3 bg-[#050A15]/50 border-b border-[#1A2235] flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-atc-green font-bold text-sm">
           <Activity className="w-4 h-4" /> DASHBOARD
        </div>
        <div className="text-xs text-slate-400 font-data">
          Showing <strong className="text-white">{filteredAircraft.length}</strong> of {aircraftArray.length}
        </div>
      </div>

      <div className="p-4 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
        
        {/* KPI Cards (2x2) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#121a2f] border border-[#1A2235] rounded p-3 flex flex-col hover:border-atc-dim transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><Plane className="w-8 h-8" /></div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10">Total Tracked</span>
            <div className="flex items-baseline justify-between transition-all relative z-10">
               <span className="text-2xl font-data font-bold text-white">{kpis.total}</span>
               <span className="flex items-center text-xs font-bold font-mono">
                  {Math.abs(trends.totalDelta)}
                  <TrendIndicator delta={trends.totalDelta} />
               </span>
            </div>
          </div>

          <div className="bg-[#121a2f] border border-[#1A2235] rounded p-3 flex flex-col hover:border-atc-dim transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><Wind className="w-8 h-8" /></div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10">In Flight</span>
            <div className="flex items-baseline justify-between transition-all relative z-10">
               <span className="text-2xl font-data font-bold text-blue-400">{kpis.inFlight}</span>
               <span className="flex items-center text-xs font-bold font-mono">
                  {Math.abs(trends.inFlightDelta)}
                  <TrendIndicator delta={trends.inFlightDelta} />
               </span>
            </div>
          </div>
          
          <div className="bg-[#121a2f] border border-[#1A2235] rounded p-3 flex flex-col hover:border-atc-dim transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-orange-400"><AlertTriangle className="w-8 h-8"/></div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10">Active Risks</span>
            <div className="flex items-baseline justify-between transition-all relative z-10">
               <span className="text-2xl font-data font-bold text-orange-400">{kpis.activeAnomalies}</span>
               <span className="flex items-center text-xs font-bold font-mono">
                  {Math.abs(trends.anomalyDelta)}
                  <TrendIndicator delta={trends.anomalyDelta} inverse={true} />
               </span>
            </div>
          </div>

          <div className="bg-[#121a2f] border border-[#1A2235] rounded p-3 flex flex-col hover:border-atc-dim transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 text-atc-green"><ShieldCheck className="w-8 h-8"/></div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10">Sys Coverage</span>
            <div className="flex items-baseline justify-between transition-all relative z-10">
               <span className={`text-2xl font-data font-bold ${kpis.coverage > 90 ? 'text-atc-green' : 'text-yellow-400'}`}>{kpis.coverage}%</span>
               <span className="flex items-center text-xs font-bold font-mono">
                  {Math.abs(trends.coverageDelta)}
                  <TrendIndicator delta={trends.coverageDelta} />
               </span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono text-center -mt-2">
           LAST UPDATED: {snapshot ? getRelativeTimeStr(snapshot.snapshot_time).toUpperCase() : 'LIVE'}
        </div>

        {/* Altitude Horizontal BarChart */}
        <div className="bg-[#121a2f] border border-[#1A2235] rounded p-3">
          <span className="text-xs text-slate-300 font-bold tracking-wide mb-3 block">Altitude Distribution</span>
          <div className="h-40 w-full transition-all">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={altData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipContent />} cursor={{ fill: '#1A2235' }}/>
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={ANIMATION_MS} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Breakdown Donut */}
        <div className="bg-[#121a2f] border border-[#1A2235] rounded p-3">
          <span className="text-xs text-slate-300 font-bold tracking-wide mb-3 block">Top Registrations</span>
          <div className="h-40 w-full flex items-center justify-center transition-all">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={countryData}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={ANIMATION_MS}
                  stroke="none"
                >
                  {countryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} payload={{ chartType: 'pie', ...entry }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom Legend */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
            {countryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1 text-[9px] text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly Timeline Sparkline */}
        <div className="bg-[#121a2f] border border-[#1A2235] rounded p-3">
          <span className="text-xs text-slate-300 font-bold tracking-wide mb-3 block">Anomaly Activity (2 Hrs)</span>
          <div className="h-24 w-full relative transition-all -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748B' }} minTickGap={15} axisLine={false} tickLine={false}/>
                <YAxis hide />
                <Tooltip 
                  content={({active, payload, label}) => active && payload ? (
                    <div className="bg-[#0B101E]/95 backdrop-blur border border-[#1A2235] p-2 text-xs text-gray-200 shadow-md">
                      <p className="font-bold mb-1 text-atc-green">{label}</p>
                      <div className="flex justify-between gap-4">
                         <span className="text-slate-400">Anomalies:</span>
                         <span className="font-mono">{payload[0].value}</span>
                      </div>
                    </div>
                  ) : null} 
                  cursor={{ stroke: '#1A2235', strokeWidth: 2 }} 
                />
                <Area type="monotone" dataKey="count" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" isAnimationActive={true} animationDuration={ANIMATION_MS} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
