// src/lib/formatters.js

export function metersToFeet(meters) {
  if (meters === null || meters === undefined) return null;
  return meters * 3.28084;
}

export function msToKnots(ms) {
  if (ms === null || ms === undefined) return null;
  return ms * 1.94384;
}

export function msToFtPerMin(ms) {
  if (ms === null || ms === undefined) return null;
  return ms * 196.85;
}
