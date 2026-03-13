// src/components/map/AirspaceLayer.jsx
import React, { useMemo } from 'react';
import { GeoJSON, Marker } from 'react-leaflet';
import L from 'leaflet';
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

const getStyleConfig = (type) => {
  const t = type ? type.toUpperCase() : '';
  const color = getColorForAirspace(type);
  if (t.includes('CTR')) return { color, weight: 2, dashArray: '5, 5', opacity: 0.8, fillColor: color, fillOpacity: 0.05 };
  if (t.includes('TMA')) return { color, weight: 1.5, dashArray: null, opacity: 0.8, fillColor: color, fillOpacity: 0.05 };
  if (t.includes('RESTRICTED') || t.includes('PROHIBITED') || t.includes('DANGER')) return { color, weight: 1.5, dashArray: null, opacity: 0.8, fillColor: color, fillOpacity: 0.15 }; 
  if (t.includes('FIR')) return { color, weight: 1, dashArray: '10, 10', opacity: 0.4, fillColor: color, fillOpacity: 0 };
  return { color, weight: 1, opacity: 0.5, fillOpacity: 0.05 };
};

export default function AirspaceLayer() {
  const { geojsonData } = useAirspaceData();
  const toggles = useFlightStore(state => state.airspaceToggles);
  const airspaceZones = useFlightStore(state => state.airspaceZones);

  const filteredData = useMemo(() => {
    if (!geojsonData) return null;
    return {
      ...geojsonData,
      features: geojsonData.features.filter(f => {
        const t = f.properties.type ? f.properties.type.toUpperCase() : '';
        if (t.includes('CTR') && toggles.CTR) return true;
        if (t.includes('TMA') && toggles.TMA) return true;
        if ((t.includes('RESTRICTED') || t.includes('PROHIBITED') || t.includes('DANGER')) && toggles.RESTRICTED) return true;
        if (t.includes('FIR') && toggles.FIR) return true;
        return false;
      })
    };
  }, [geojsonData, toggles]);

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

  const createBadgeIcon = (count, color) => {
    // Generate inner styling string explicitly to avoid templating issues in tailwind if not safelisted
    // However, tailwind arbitrary values work well inline 
    return L.divIcon({
      html: `<div style="background-color: rgba(10, 15, 26, 0.9); border-color: ${color}; color: ${color}; box-shadow: 0 0 10px ${color}40;" class="border font-data font-bold rounded-full w-6 h-6 flex items-center justify-center text-xs">${count}</div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  if (!filteredData) return null;

  return (
    <>
      <GeoJSON 
        key={JSON.stringify(toggles) + (geojsonData ? 'loaded' : '')} 
        data={filteredData} 
        style={(feature) => getStyleConfig(feature.properties.type)}
        onEachFeature={onEachFeature}
      />
      {airspaceZones.filter(z => z.occupancyCount > 0 && filteredData.features.find(f => f.id === z.id)).map(zone => {
        if (!zone.geometry || zone.geometry.type !== 'Polygon') return null;
        let sumLat = 0, sumLng = 0, pts = 0;
        zone.geometry.coordinates[0].forEach(([lng, lat]) => {
          sumLng += lng; sumLat += lat; pts++;
        });
        const center = [sumLat / pts, sumLng / pts];
        const color = getColorForAirspace(zone.properties.type);
        
        return (
          <Marker 
            key={`badge-${zone.id}`}
            position={center}
            icon={createBadgeIcon(zone.occupancyCount, color)}
            interactive={false}
          />
        );
      })}
    </>
  );
}
