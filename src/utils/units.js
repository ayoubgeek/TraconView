/**
 * @file units.js
 * @description Utility functions for converting raw OpenSky units to standard aviation units.
 */

/**
 * Converts meters to feet.
 * @param {number|null} meters 
 * @returns {number|null}
 */
export function metersToFeet(meters) {
  if (meters === null || meters === undefined) return null;
  return Math.round(meters * 3.28084);
}

/**
 * Converts meters per second to knots.
 * @param {number|null} ms 
 * @returns {number|null}
 */
export function msToKnots(ms) {
  if (ms === null || ms === undefined) return null;
  return Math.round(ms * 1.94384);
}

/**
 * Converts meters per second to feet per minute.
 * @param {number|null} ms 
 * @returns {number|null}
 */
export function msToFeetPerMin(ms) {
  if (ms === null || ms === undefined) return null;
  return Math.round(ms * 196.85);
}
