// src/components/panels/StatsPanel.jsx
import React, { useMemo } from 'react';
import { useFlightStore } from '../../store/flightStore';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export default function StatsPanel() {
  const aircraftArray = useFlightStore(state => state.aircraftArray);

  const { altData, countryData } = useMemo(() => {
    // Altitude Histogram (10k ft buckets)
    const buckets = {
      '< 10k': 0, '10k-20k': 0, '20k-30k': 0, '30k-40k': 0, '> 40k': 0
    };
    
    // Country Counts
    const reqData = {};

    aircraftArray.forEach(ac => {
      const alt = ac.altitude;
      if (alt < 10000) buckets['< 10k']++;
      else if (alt < 20000) buckets['10k-20k']++;
      else if (alt < 30000) buckets['20k-30k']++;
      else if (alt < 40000) buckets['30k-40k']++;
      else buckets['> 40k']++;

      const country = ac.country || 'Unknown';
      reqData[country] = (reqData[country] || 0) + 1;
    });

    const formattedAlt = Object.entries(buckets).map(([name, count]) => ({ name, count }));
    
    // Top 5 Countries
    const formattedCountry = Object.entries(reqData)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { altData: formattedAlt, countryData: formattedCountry };
  }, [aircraftArray]);

  return (
    <div className="absolute bottom-6 left-4 w-72 bg-radar-bg/90 backdrop-blur-md border border-radar-grid rounded-lg shadow-2xl z-[1000] text-atc-text font-ui overflow-hidden flex flex-col">
      <div className="p-3 border-b border-radar-grid bg-[#161F2E] flex gap-2 items-center text-atc-green font-bold text-sm">
        <Activity className="w-4 h-4" />
        RADAR STATISTICS
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Altitude Histogram */}
        <div>
          <span className="text-[10px] text-atc-dim uppercase tracking-wider mb-2 block">Altitude Distribution (ft)</span>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={altData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} interval={0} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B101E', border: '1px solid #1A2235', fontSize: 12, color: '#E5E7EB' }} 
                  cursor={{ fill: '#1A2235' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Breakdown */}
        <div>
          <span className="text-[10px] text-atc-dim uppercase tracking-wider mb-2 block">Top Origin Countries</span>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} interval={0} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B101E', border: '1px solid #1A2235', fontSize: 12, color: '#E5E7EB' }}
                  cursor={{ fill: '#1A2235' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
