/**
 * @file interpolation.js
 * @description Linear position interpolation pure functions.
 */

/**
 * Linearly interpolates between two values based on progress.
 * @param {number} prev 
 * @param {number} curr 
 * @param {number} progress - fraction between 0 and 1
 * @returns {number}
 */
export function interpolatePosition(prev, curr, progress) {
  return prev + (curr - prev) * progress;
}

/**
 * Calculates current interpolation progress fraction safely clamped between 0 and 1.
 * @param {number} elapsedMs 
 * @param {number} intervalMs 
 * @returns {number}
 */
export function clampProgress(elapsedMs, intervalMs) {
  if (intervalMs <= 0) return 1;
  const progress = elapsedMs / intervalMs;
  return Math.max(0, Math.min(1, progress));
}
