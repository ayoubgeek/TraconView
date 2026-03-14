// src/components/ui/StatusIndicator.jsx
import React from 'react';
import { useFlightStore } from '../../store/flightStore';
import LiveClock from './LiveClock';
export default function StatusIndicator() {
  const connectionStatus = useFlightStore(state => state.connectionStatus);
  const lastRefresh = useFlightStore(state => state.lastRefresh);

  let statusColor = 'bg-green-500';
  let textColor = 'text-green-500';
  let pulse = 'animate-pulse';

  if (connectionStatus === 'DEGRADED') {
    statusColor = 'bg-yellow-500';
    textColor = 'text-yellow-500';
    pulse = '';
  } else if (connectionStatus === 'OFFLINE') {
    statusColor = 'bg-red-500';
    textColor = 'text-red-500';
    pulse = '';
  }

  return (
    <div className="flex items-center gap-2 font-data text-xs">
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${statusColor} ${pulse}`} />
        <span className={textColor}>{connectionStatus}</span>
      </div>
      {lastRefresh && (
        <span className="text-atc-dim">
          | <LiveClock lastRefresh={lastRefresh} label="REF" />
        </span>
      )}
    </div>
  );
}
