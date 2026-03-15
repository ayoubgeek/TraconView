import React, { useState, useEffect } from 'react';
import { UI_INTERVALS } from '../../lib/constants';

const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Unknown';
    const ms = Date.now() - new Date(isoString).getTime();
    const mins = Math.max(0, Math.floor(ms / 60000));
    if (mins < 1) return 'Just now';
    return `${mins} min ago`;
};

const formatTimeLabel = (ts) => {
    if (!ts) return '';
    try {
        const d = new Date(ts);
        return d.toISOString().split('T')[1].substring(0, 5) + 'Z';
    } catch {
        return String(ts);
    }
};

const getThresholdColor = (t) => {
    if (t === 'CRITICAL') return 'text-red-500 font-bold bg-red-500/10 border-red-500/30';
    if (t === 'WARNING') return 'text-red-400 bg-red-400/10 border-red-400/30';
    if (t === 'CAUTION') return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
    if (t === 'WATCH') return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    return 'text-slate-400 bg-slate-800 border-slate-700';
};

export default function AnomalyExplanation({ explanation, threshold }) {
  // Force re-render periodically to update relative times
  const [, setTick] = useState(0);
  useEffect(() => {
     const timer = setInterval(() => setTick(t => t + 1), UI_INTERVALS.EXPLANATION_TICK_MS);
     return () => clearInterval(timer);
  }, []);

  if (!explanation) return null;
  
  const { factors = [], firstDetectedAt = null, resolvedAt = null, resolutionReason = null } = explanation;

  if (resolvedAt) {
    return (
      <div className="bg-[#14532D]/30 border border-[#166534] rounded-lg p-3 my-2 font-ui">
        <h4 className="text-[#4ADE80] font-bold mb-1 flex items-center justify-start gap-2 text-sm">
          <span>✓</span> Resolved at {formatTimeLabel(resolvedAt)}
        </h4>
        <p className="text-[#BBF7D0] text-sm mt-1">{resolutionReason || 'Anomaly cleared'}</p>
      </div>
    );
  }

  if (!factors || factors.length === 0) return null;

  return (
    <div className="space-y-3 my-2 font-ui">
      <div className="flex justify-between items-center mb-1">
         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Why Flagged</h3>
         {threshold && (
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getThresholdColor(threshold)}`}>
              {threshold}
            </span>
         )}
      </div>
      
      {firstDetectedAt && (
         <div className="text-xs text-slate-400 mb-2 font-data">
            Detected: {formatRelativeTime(firstDetectedAt)}
         </div>
      )}

      {factors.map((f, i) => (
        <div key={f.id || i} className="bg-[#1A2235]/60 border border-slate-700/80 rounded p-3">
          <div className="flex justify-between items-start mb-1.5">
            <span className="font-semibold text-slate-200 text-sm leading-tight">{f.label || f.description}</span>
            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded ml-3 whitespace-nowrap border border-red-500/30">
              +{f.weight}
            </span>
          </div>
          {f.details && (
             <div className="text-xs text-slate-400 italic mt-2 border-t border-slate-700/50 pt-2 leading-relaxed">
               {f.details}
             </div>
          )}
        </div>
      ))}
    </div>
  );
}
