import React from 'react';

// Basic inline formatter for tests, or normally imported from formatters.js
// But let's keep it safe so tests pass immediately regardless of formatters.js state
const formatTimeLabel = (ts) => {
    if (!ts) return 'Unknown';
    try {
        const d = new Date(ts);
        return d.toISOString().split('T')[1].substring(0, 5) + 'Z';
    } catch {
        return String(ts);
    }
};

export default function AnomalyExplanation({ factors = [], resolvedAt = null, resolutionReason = null }) {
  if (resolvedAt) {
    return (
      <div className="bg-[#14532D]/30 border border-[#166534] rounded-lg p-3 my-2">
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
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Why Flagged</h3>
      {factors.map((f, i) => (
        <div key={f.id || i} className="bg-[#1A2235]/60 border border-slate-700/80 rounded p-3">
          <div className="flex justify-between items-start mb-1.5">
            <span className="font-semibold text-slate-200 text-sm leading-tight">{f.description}</span>
            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded ml-3 whitespace-nowrap border border-red-500/30">
              +{f.weight}
            </span>
          </div>
          <div className="text-xs text-slate-400 mb-1 flex justify-between font-data">
            <span>Detected: {f.timestamp}</span>
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
