import React from 'react';
import { AIRCRAFT_CATEGORY_COLORS } from '../../lib/constants';

const MapLegend = () => {
  const categories = [
    { key: 'commercial', label: 'Commercial' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'business_jet', label: 'Business Jet' },
    { key: 'military', label: 'Military' },
    { key: 'helicopter', label: 'Helicopter' },
    { key: 'general_aviation', label: 'General Aviation' },
    { key: 'emergency/anomaly', label: 'Emergency/Anomaly' },
    { key: 'unknown', label: 'Unknown' }
  ];

  return (
    <div className="leaflet-bottom leaflet-left" style={{ zIndex: 900 }}>
      {/* 
        This div acts as a Custom Leaflet Control conceptually 
        but lives in the React tree within MapContainer for positioning 
      */}
      <div className="leaflet-control bg-radar-panel border border-radar-grid rounded ml-4 mb-6 shadow-lg p-3 text-sm text-atc-dim font-ui">
        <h4 className="font-data font-bold text-atc-value mb-2 uppercase text-xs tracking-wider border-b border-radar-grid pb-1">Aircraft Legend</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {categories.map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: AIRCRAFT_CATEGORY_COLORS[key] || '#6b7280' }}
              />
              <span className="whitespace-nowrap text-xs text-atc-value">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
