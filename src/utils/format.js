/**
 * @file format.js
 * @description Formatting functions for aviation data fields.
 */

/**
 * Formats altitude.
 * @param {number|null} ft 
 * @returns {string}
 */
export function formatAltitude(ft) {
  if (ft === null || ft === undefined) return '—';
  return `${ft.toLocaleString('en-US')} ft`;
}

/**
 * Formats speed.
 * @param {number|null} kts 
 * @returns {string}
 */
export function formatSpeed(kts) {
  if (kts === null || kts === undefined) return '—';
  return `${kts.toLocaleString('en-US')} kt`;
}

/**
 * Formats heading.
 * @param {number|null} deg 
 * @returns {string}
 */
export function formatHeading(deg) {
  if (deg === null || deg === undefined) return '—';
  return `${Math.round(deg)}°`;
}

/**
 * Formats vertical rate.
 * @param {number|null} fpm 
 * @returns {string}
 */
export function formatVertRate(fpm) {
  if (fpm === null || fpm === undefined) return '—';
  if (fpm > 0) return `+${fpm.toLocaleString('en-US')} fpm`;
  return `${fpm.toLocaleString('en-US')} fpm`;
}

/**
 * Formats squawk code.
 * @param {string|null} code 
 * @returns {string}
 */
export function formatSquawk(code) {
  if (!code) return '—';
  return String(code).padStart(4, '0');
}

/**
 * Formats last contact timestamp.
 * @param {number|null} timestampSec 
 * @returns {string}
 */
export function formatLastContact(timestampSec) {
  if (!timestampSec) return '—';
  const diffSec = Math.floor(Date.now() / 1000) - timestampSec;
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
}

/**
 * Formats position source.
 * @param {string|null} source 
 * @returns {string}
 */
export function formatPositionSource(source) {
  if (!source) return '—';
  return source;
}
