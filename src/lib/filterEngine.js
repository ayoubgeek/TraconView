// @ts-check
/** @import { Aircraft, FilterConfiguration } from '../types/index.js' */

/**
 * Filter aircraft map based on provided configuration
 * @param {Map<string, Aircraft>} aircraftMap
 * @param {any} filters  // Using any because filter object can have arbitrarily named fields like speedMin which are not in FilterConfiguration
 * @param {Set<string>} pinnedIds
 * @returns {Map<string, Aircraft>}
 */
export function applyFilters(aircraftMap, filters, pinnedIds = new Set()) {
  const result = new Map();

  const hasCategoryFilter = filters?.categories && filters.categories.length > 0;
  const hasSearch = filters?.searchTerm && filters.searchTerm.trim() !== '';
  const searchLower = hasSearch ? filters.searchTerm.toLowerCase() : '';
  
  for (const [id, ac] of aircraftMap.entries()) {
    // 1. Pinned aircraft are ALWAYS included overrides filters
    if (pinnedIds.has(id)) {
      result.set(id, ac);
      continue;
    }

    if (!filters) {
      result.set(id, ac);
      continue;
    }

    // 2. OR Logic within Category Chips
    if (hasCategoryFilter) {
      if (!ac.category || !filters.categories.includes(ac.category)) {
        continue;
      }
    }

    // 3. AND Logic across other properties
    
    // Altitude
    if (filters.altitudeMin !== undefined && filters.altitudeMin !== null) {
      if (ac.altitude != null && ac.altitude < filters.altitudeMin) continue;
    }
    if (filters.altitudeMax !== undefined && filters.altitudeMax !== null) {
      if (ac.altitude != null && ac.altitude > filters.altitudeMax) continue;
    }

    // Speed
    if (filters.speedMin !== undefined && filters.speedMin !== null) {
      if (ac.speed != null && ac.speed < filters.speedMin) continue;
    }
    if (filters.speedMax !== undefined && filters.speedMax !== null) {
      if (ac.speed != null && ac.speed > filters.speedMax) continue;
    }

    // Ground Exclude
    if (filters.excludeGround && ac.onGround) {
      continue;
    }

    // Squawk Codes
    if (filters.squawkCodes && filters.squawkCodes.length > 0) {
      if (!ac.squawk || !filters.squawkCodes.includes(ac.squawk)) {
        continue;
      }
    }

    // Search Term (ID or Callsign)
    if (hasSearch) {
      let matched = false;
      if (ac.id && ac.id.toLowerCase().includes(searchLower)) matched = true;
      if (ac.callsign && ac.callsign.toLowerCase().includes(searchLower)) matched = true;
      if (!matched) {
        continue;
      }
    }

    result.set(id, ac);
  }

  return result;
}
