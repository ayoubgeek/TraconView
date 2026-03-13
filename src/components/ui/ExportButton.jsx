import React from 'react';
import { Download } from 'lucide-react';
import { useFlightStore } from '../../store/flightStore';

export default function ExportButton() {
  const alerts = useFlightStore(state => state.alerts);

  const exportCSV = () => {
    let csv = "timestamp,icao24,callsign,anomaly_type,severity,lat,lng,altitude_ft,speed_kts,squawk\n";
    
    alerts.forEach(al => {
      const type = al.reasons?.[0]?.type || 'UNKNOWN';
      const severity = al.reasons?.[0]?.severity || 'UNKNOWN';
      const row = [
        al.detectedAt,
        al.icao24,
        al.callsign,
        type,
        severity,
        al.lat,
        al.lng,
        al.altitude,
        al.speed || 0,
        al.squawk || ''
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traconview-anomalies-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={exportCSV}
      className="bg-radar-bg/80 backdrop-blur-md border border-radar-grid rounded-lg h-[42px] px-3 flex items-center justify-center shadow hover:bg-radar-grid transition-colors text-atc-dim hover:text-white"
      title="Export Anomalies (CSV)"
    >
      <Download className="w-5 h-5 flex-shrink-0" />
      <span className="hidden sm:inline ml-2 text-[10px] font-ui uppercase tracking-wider font-bold">Export</span>
    </button>
  );
}
