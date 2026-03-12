// src/components/map/AirspaceLayer.jsx
import React from 'react';
import { GeoJSON } from 'react-leaflet';
import { useAirspaceData } from '../../hooks/useAirspaceData';
import { useFlightStore } from '../../store/flightStore';

// CTR=cyan, TMA=amber, Restricted=red, FIR=white
const getColorForAirspace = (type) => {
  const t = type ? type.toUpperCase() : '';
  if (t.includes('CTR')) return '#22d3ee'; // cyan
  if (t.includes('TMA')) return '#fbbf24'; // amber
  if (t.includes('RESTRICTED') || t.includes('PROHIBITED') || t.includes('DANGER')) return '#ef4444'; // red
  return '#ffffff'; // FIR or other
};

const styleFeature = (feature) => {
  const color = getColorForAirspace(feature.properties.type);
  return {
    color: color,
    weight: 1.5,
    opacity: 0.6,
    fillColor: color,
    fillOpacity: 0.05,
    dashArray: feature.properties.type?.includes('FIR') ? '5, 5' : null
  };
};

const onEachFeature = (feature, layer) => {
  if (feature.properties && feature.properties.name) {
    const tooltipContent = `
      <div class="font-ui text-xs text-white">
        <strong>${feature.properties.name}</strong><br/>
        <span class="text-atc-dim">${feature.properties.type || 'Sector'}</span><br/>
        <span class="text-atc-dim font-data">${feature.properties.lower || 'SFC'} - ${feature.properties.upper || 'UNL'}</span>
      </div>
    `;
    layer.bindTooltip(tooltipContent, {
      className: 'bg-radar-bg border-radar-grid',
      sticky: true
    });
  }
};

export default function AirspaceLayer() {
  const { geojsonData } = useAirspaceData();

  const showAirspace = useFlightStore(state => state.showAirspace);

  if (!geojsonData || !showAirspace) return null;

  return (
    <GeoJSON 
      key={JSON.stringify(geojsonData)} // Force total re-render when data changes
      data={geojsonData} 
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
}
