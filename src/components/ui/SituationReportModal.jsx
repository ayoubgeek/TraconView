import React, { useState } from 'react';
import { X, Copy, Check, Download, ExternalLink } from 'lucide-react';
import { UI_INTERVALS } from '../../lib/constants';

export default function SituationReportModal({ report, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), UI_INTERVALS.COPIED_TIMEOUT_MS);
  };

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:p-6 font-ui">
      <div 
        className="w-full max-w-2xl bg-[#0A0F1A] border border-[#1A2235] rounded-lg shadow-2xl flex flex-col max-h-full overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2235] bg-[#050A15]/50">
          <h2 id="modal-title" className="text-lg font-bold text-slate-200">Situation Report</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1A2235] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-[#050A15]/20">
          <pre className="whitespace-pre-wrap font-data text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0A0F1A] border border-[#1A2235] p-4 rounded selection:bg-atc-green/30">
            {report}
          </pre>
        </div>

        <div className="px-4 py-3 border-t border-[#1A2235] flex justify-end gap-3 bg-[#0A0F1A]">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-[#1A2235] rounded text-slate-300 hover:text-white hover:bg-[#1A2235] transition-colors font-medium text-sm"
          >
            Close
          </button>
          <button 
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-atc-green/10 text-atc-green border border-atc-green/30 rounded hover:bg-atc-green/20 transition-colors font-medium text-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
