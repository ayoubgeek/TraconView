import React, { useMemo, useState, useEffect } from 'react';
import { useFlightStore } from '../../store/flightStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Activity, Clock, AlertTriangle, Plane, Globe, ShieldCheck } from 'lucide-react';

const DONUT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];
const SCORE_COLORS = {
  NORMAL: '#1e6a7a',
  WATCH: '#EAB308',
  CAUTION: '#EAB308',
  WARNING: '#F97316',
  CRITICAL: '#EF4444'
};
const ANIMATION_MS = 1000;

export default function StatsPanel() {
  const aircraftArray = useFlightStore(state => state.aircraftArray);
  const alerts = useFlightStore(state => state.alerts);
  const lastRefresh = useFlightStore(state => state.lastRefresh);
  const riskScores = useFlightStore(state => state.riskScores);

  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const staleMs = lastRefresh ? (currentTime - lastRefresh) : 0;
  const isStale = staleMs > 30000;
  
  const { kpis, altData, countryData, timelineData, scatterData } = useMemo(() => {
    let inFlight = 0;
    let activeAnomalies = 0;
    let freshDataCount = 0;
    const now = Date.now() / 1000;

    const reqData = {};
    const scatter = [];

    const altBuckets = {
       'Ground': 0, '0-5K': 0, '5-10K': 0, '10-20K': 0, 'FL200-300': 0, 'FL300-400': 0, 'FL400+': 0
    };

    aircraftArray.forEach(ac => {
      if (ac.onGround) {
         altBuckets['Ground']++;
      } else {
         inFlight++;
         const alt = ac.altitude || 0;
         if (alt < 5000) altBuckets['0-5K']++;
         else if (alt < 10000) altBuckets['5-10K']++;
         else if (alt < 20000) altBuckets['10-20K']++;
         else if (alt < 30000) altBuckets['FL200-300']++;
         else if (alt < 40000) altBuckets['FL300-400']++;
         else altBuckets['FL400+']++;
      }

      const risk = riskScores.get(ac.id);
      if (risk && risk.score > 25) {
        activeAnomalies++;
      }

      if ((now - ac.lastSeen) < 15) {
        freshDataCount++;
      }

      const country = ac.country || 'Unknown';
      reqData[country] = (reqData[country] || 0) + 1;

      scatter.push({
        x: Math.round(ac.speed || 0),
        y: Math.round(ac.altitude || 0),
        z: 1,
        fill: risk ? SCORE_COLORS[risk.threshold] : SCORE_COLORS.NORMAL,
        callsign: ac.callsign || ac.id
      });
    });

    const totalAc = aircraftArray.length;
    const coverageInt = totalAc > 0 ? Math.round((freshDataCount / totalAc) * 100) : 100;

    const formattedAlt = Object.entries(altBuckets).map(([name, count]) => ({ name, count }));
    
    // Top 10 Countries logic
    const sortedCountries = Object.entries(reqData).sort((a,b)=>b[1]-a[1]);
    const top10 = sortedCountries.slice(0, 10).map(([name, value]) => ({ name, value }));
    const otherCount = sortedCountries.slice(10).reduce((acc, [_,val])=>acc+val, 0);
    if (otherCount > 0) {
      top10.push({ name: 'Other', value: otherCount });
    }

    // Timeline logic
    const timeline = [];
    const twoHoursAgo = Date.now() - (120 * 60 * 1000);
    for(let i=0; i<24; i++) {
       const d = new Date(twoHoursAgo + (i * 5 * 60 * 1000));
       timeline.push({ time: `${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}`, count: 0 });
    }
    
    let hasAnomalies = false;
    alerts.forEach(alert => {
      const dt = new Date(alert.detectedAt).getTime();
      if (dt > twoHoursAgo) {
        const diffMs = dt - twoHoursAgo;
        const binIndex = Math.min(23, Math.floor(diffMs / (5 * 60 * 1000)));
        timeline[binIndex].count++;
        hasAnomalies = true;
      }
    });

    return { 
       kpis: { total: totalAc, inFlight, activeAnomalies, coverage: coverageInt },
       altData: formattedAlt,
       countryData: top10,
       timelineData: hasAnomalies ? timeline : [],
       scatterData: scatter
    };

  }, [aircraftArray, alerts, riskScores]);

  const CustomTooltipContent = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B101E] border border-[#1A2235] p-2 text-xs text-gray-200 shadow-md">
          <p className="font-bold mb-1">{label || payload[0].payload.name || payload[0].payload.callsign}</p>
          {payload.map((p, i) => (
             <p key={i}><span style={{color: p.color || p.fill}}>{p.name === 'z' ? '' : p.name}:</span> {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="absolute bottom-6 left-4 w-96 max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden bg-[#0A0F1A]/95 backdrop-blur-md border border-radar-grid rounded-lg shadow-2xl z-[1000] text-atc-text font-ui flex flex-col">
      <div className="p-3 border-b border-radar-grid bg-[#161F2E] flex gap-2 items-center justify-between text-atc-green font-bold text-sm shrink-0 top-0 sticky z-10">
        <div className="flex items-center gap-2">
           <Activity className="w-4 h-4" /> RADAR STATISTICS
        </div>
        <div className={`flex items-center gap-1 text-[10px] ${isStale ? 'text-red-400' : 'text-atc-dim'}`}>
           <Clock className="w-3 h-3" />
           {lastRefresh ? Math.floor(staleMs / 1000) + 's ago' : 'No signal'}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#121a2f] border border-radar-grid rounded p-2 flex flex-col">
            <span className="text-atc-dim text-[10px] uppercase flex items-center gap-1"><Plane className="w-3 h-3"/> Total Objects</span>
            <span className="text-xl font-data text-white">{kpis.total} <span className="text-xs text-atc-dim ml-1">({kpis.inFlight} IN-FLT)</span></span>
          </div>
          <div className="bg-[#121a2f] border border-radar-grid rounded p-2 flex flex-col">
            <span className="text-atc-dim text-[10px] uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Active Risks</span>
            <span className="text-xl font-data text-orange-400">{kpis.activeAnomalies}</span>
          </div>
          <div className="col-span-2 bg-[#121a2f] border border-radar-grid rounded p-2 flex justify-between items-center">
             <span className="text-atc-dim text-[10px] uppercase flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Integrity (Fresh &lt;15s)</span>
             <span className={`text-sm font-bold font-data ${kpis.coverage > 90 ? 'text-atc-green' : 'text-yellow-400'}`}>{kpis.coverage}%</span>
          </div>
        </div>

        {/* Altitude Histogram */}
        <div>
          <span className="text-[10px] text-atc-dim uppercase tracking-wider mb-2 block">Altitude Distribution</span>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={altData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} interval={0} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipContent />} cursor={{ fill: '#1A2235' }}/>
                <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} isAnimationActive={true} animationDuration={ANIMATION_MS} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed vs Altitude Scatter */}
        <div>
          <span className="text-[10px] text-atc-dim uppercase tracking-wider mb-2 block">Speed vs Altitude Profile</span>
          <div className="h-40 w-full pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <XAxis type="number" dataKey="x" name="Speed (kts)" unit="" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" name="Altitude (ft)" unit="" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <ZAxis type="number" dataKey="z" range={[15, 15]} />
                <Tooltip content={<CustomTooltipContent />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Aircraft Profile" data={scatterData} isAnimationActive={true} animationDuration={ANIMATION_MS}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Breakdown Donut */}
        <div className="flex flex-col">
          <span className="text-[10px] text-atc-dim uppercase tracking-wider block">Top Registrations</span>
          <div className="h-40 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={countryData}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={ANIMATION_MS}
                >
                  {countryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anomaly Timeline Sparkline */}
        <div>
          <span className="text-[10px] text-atc-dim uppercase tracking-wider mb-2 block">Anomaly Count (Last 2 Hrs)</span>
          <div className="h-24 w-full relative">
            {timelineData.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center text-atc-dim text-[10px] uppercase bg-[#121a2f] rounded">
                 No anomalies recorded
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6B7280' }} minTickGap={15} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltipContent />} />
                  <Area type="monotone" dataKey="count" stroke="#F97316" fillOpacity={1} fill="url(#colorCount)" isAnimationActive={true} animationDuration={ANIMATION_MS} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
