/**
 * @file viewport.js
 * @description Leaflet map viewport utilities.
 */

/**
 * Extracts a BoundingBox from a Leaflet map instance.
 * Caller must ensure map is initialized before calling.
 * @param {any} map - Leaflet map instance
 * @returns {import('../opensky/types').BoundingBox}
 */
export function extractBoundingBox(map) {
  const bounds = map.getBounds();
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest()
  };
}
