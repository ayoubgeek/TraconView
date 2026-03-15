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
  // Professional aviation marker aesthetic
  const stroke = isSelected ? '#ffffff' : 'rgba(10, 15, 26, 0.8)';
  const strokeWidth = isSelected ? 1.5 : 1;
  const filter = isSelected ? `drop-shadow(0px 0px 6px ${color})` : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))';

  const svg = `
    <div style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; opacity: ${opacity}; will-change: transform; contain: layout style paint;">
      <div style="transform: rotate(${qHeading}deg); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" style="filter: ${filter};">
          <path fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"
            d="M 14.5 11 L 21 15 L 21 16 L 14 14 L 13 19 L 15 21 L 15 22 L 12 21 L 9 22 L 9 21 L 11 19 L 10 14 L 3 16 L 3 15 L 9.5 11 L 9.5 5 C 9.5 3 10.5 2 12 2 C 13.5 2 14.5 3 14.5 5 Z" />
        </svg>
      </div>
    </div>
  `;

  const icon = L.divIcon({
    html: svg,
    className: 'custom-aircraft-icon border-none bg-transparent',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    tooltipAnchor: [0, -14]
  });

  iconCache.set(cacheKey, icon);
  return icon;
}
