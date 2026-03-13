// src/components/panels/AlertSidebar.jsx
import { useFlightStore } from '../../store/flightStore';
import { ANOMALY_SEVERITY } from '../../lib/constants';

const SEVERITY_COLORS = {
  [ANOMALY_SEVERITY.CRITICAL]: 'bg-red-500 text-white border-red-500',
  [ANOMALY_SEVERITY.HIGH]: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  [ANOMALY_SEVERITY.MEDIUM]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  [ANOMALY_SEVERITY.LOW]: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

export default function AlertSidebar() {
  const alerts = useFlightStore(state => state.alerts);
  const setSelectedAircraft = useFlightStore(state => state.setSelectedAircraft);
  const isSidebarOpen = useFlightStore(state => state.isSidebarOpen);
  const toggleSidebar = useFlightStore(state => state.toggleSidebar);

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[400] md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <div className={`
        fixed inset-y-0 right-0 w-80 bg-[#0A0F1A]/95 border-l border-radar-grid flex flex-col z-[500] pointer-events-auto shadow-2xl
        transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-4 border-b border-radar-grid shrink-0 bg-[#0c1322]">
          <h2 className="text-white font-ui tracking-widest text-sm uppercase font-bold flex items-center justify-between">
            Alert Feed
            <span className="bg-radar-grid text-atc-dim px-2 py-0.5 rounded text-[10px]">{alerts.length}</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 relative">
          {alerts.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-atc-dim text-xs font-ui">
              No active alerts
            </div>
          ) : (
            alerts.map((alert) => {
              const date = new Date(alert.detectedAt);
              const hh = date.getUTCHours().toString().padStart(2, '0');
              const mm = date.getUTCMinutes().toString().padStart(2, '0');
              const ss = date.getUTCSeconds().toString().padStart(2, '0');
              const timeStr = `${hh}:${mm}:${ss}Z`;
              
              return (
                <div 
                  key={alert.id}
                  onClick={() => {
                    setSelectedAircraft(alert.icao24);
                    // On mobile, close sidebar after tap
                    if (window.innerWidth < 768) {
                      toggleSidebar();
                    }
                  }}
                  className={`border border-radar-grid p-3 flex flex-col gap-2 cursor-pointer transition-colors ${alert.isResolved ? 'bg-[#0A0F1A] opacity-50 grayscale line-through hover:opacity-80 hover:bg-[#121a2f]' : 'bg-radar-bg hover:border-atc-dim hover:bg-[#121a2f]'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-white font-bold font-ui">{alert.callsign || alert.icao24}</span>
                    <span className="text-atc-dim text-[10px] font-data">{timeStr}</span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex flex-wrap gap-1">
                        {alert.reasons?.map((r, i) => (
                           <span key={i} className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[r.severity] || SEVERITY_COLORS.MEDIUM}`}>
                             {r.label.substring(0, 20)}
                           </span>
                        ))}
                      </div>
                      <span className="text-atc-dim text-xs font-data">
                        Score: {alert.riskScore} | {Math.round(alert.altitude)} ft | {Math.round(alert.speed)} kts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
