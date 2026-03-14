import L from 'leaflet';
import { AIRCRAFT_CATEGORY_COLORS, HEADING_QUANTIZE_STEP } from './constants';

const iconCache = new Map();

/**
 * Quantize heading to the nearest step (e.g. 5 degrees) 
 * to limit the number of cached DOM SVG nodes.
 */
export function getQuantizedHeading(heading) {
  if (heading === null || heading === undefined) return 0;
  let q = Math.round(heading / HEADING_QUANTIZE_STEP) * HEADING_QUANTIZE_STEP;
  if (q === 0 && heading > 0) return 0; 
  if (q >= 360) q = q % 360; 
  if (q === 0 && heading === 359) return 360; 
  return q === 0 && heading === 359 ? 360 : q;
}

/**
 * Caches Leaflet DivIcon instances to avoid re-creating identical SVGs.
 */
export function getCategorizedIcon(category, heading, isSelected, isStale = false) {
  const cat = AIRCRAFT_CATEGORY_COLORS[category] ? category : 'unknown';
  const color = isSelected ? '#ffffff' : AIRCRAFT_CATEGORY_COLORS[cat];
  const qHeading = getQuantizedHeading(heading);
  const cacheKey = `${cat}-${qHeading}-${isSelected ? 'sel' : 'def'}-${isStale ? 'stale' : 'fresh'}`;

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  const opacity = isStale ? 0.5 : 1.0;
  const stroke = isSelected ? '#22d3ee' : '#000000';
  const strokeWidth = isSelected ? 2 : 1;

  const svg = `
    <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; opacity: ${opacity}; will-change: transform; contain: layout style paint;">
      <div style="transform: rotate(${qHeading}deg); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <path fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"
            d="M12,2 L14,7 L20,11 L20,13 L14,12 L14,18 L17,20 L17,22 L12,21 L7,22 L7,20 L10,18 L10,12 L4,13 L4,11 L10,7 L12,2 Z" />
        </svg>
      </div>
    </div>
  `;

  const icon = L.divIcon({
    html: svg,
    className: 'custom-aircraft-icon border-none bg-transparent',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    tooltipAnchor: [0, -12]
  });

  iconCache.set(cacheKey, icon);
  return icon;
}
