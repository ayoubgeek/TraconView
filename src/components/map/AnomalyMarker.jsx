// src/components/map/AnomalyMarker.jsx
import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { ANOMALY_SEVERITY } from '../../lib/constants';

// Create HTML-based pulsing icons using Tailwind classes
const createPulseIcon = (severity) => {
  let colorClass = 'bg-blue-500'; // LOW
  let ringClass = 'ring-blue-500/50';
  
  if (severity === ANOMALY_SEVERITY.CRITICAL) {
    colorClass = 'bg-red-500';
    ringClass = 'ring-red-500/50';
  } else if (severity === ANOMALY_SEVERITY.HIGH) {
    colorClass = 'bg-orange-500';
    ringClass = 'ring-orange-500/50';
  } else if (severity === ANOMALY_SEVERITY.MEDIUM) {
    colorClass = 'bg-yellow-500';
    ringClass = 'ring-yellow-500/50';
  }

  const htmlString = `
    <div class="relative flex items-center justify-center w-full h-full">
      <div class="absolute w-8 h-8 rounded-full ${colorClass} opacity-40 animate-ping"></div>
      <div class="relative w-4 h-4 rounded-full ${colorClass} ring-4 ${ringClass} shadow-[0_0_15px_rgba(0,0,0,0.5)]"></div>
    </div>
  `;

  return L.divIcon({
    html: htmlString,
    className: 'bg-transparent border-none',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Pre-cache icons to avoid recreating on every render
const ICONS = {
  [ANOMALY_SEVERITY.CRITICAL]: createPulseIcon(ANOMALY_SEVERITY.CRITICAL),
  [ANOMALY_SEVERITY.HIGH]: createPulseIcon(ANOMALY_SEVERITY.HIGH),
  [ANOMALY_SEVERITY.MEDIUM]: createPulseIcon(ANOMALY_SEVERITY.MEDIUM),
  [ANOMALY_SEVERITY.LOW]: createPulseIcon(ANOMALY_SEVERITY.LOW),
};

export default function AnomalyMarker({ position, severity }) {
  if (!position || position.length !== 2 || !position[0] || !position[1]) return null;

  return (
    <Marker 
      position={position} 
      icon={ICONS[severity] || ICONS[ANOMALY_SEVERITY.MEDIUM]} 
      interactive={false} // Let the underlying CircleMarker handle clicks
      zIndexOffset={1000} // Keep on top of regular dots
    />
  );
}
