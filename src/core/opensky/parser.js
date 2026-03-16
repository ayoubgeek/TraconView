/**
 * @file parser.js
 * @description State vector parser for OpenSky data.
 */

import { metersToFeet, msToKnots, msToFeetPerMin } from '../../utils/units';

const SOURCE_MAP = {
  1: 'ADS-B',
  2: 'MLAT', // IMPRECISE_MLAT
  3: 'FLARM',
  4: 'Other', // ModeS
  5: 'Other', // JAERO
  6: 'Other', // PFLAU
  7: 'MLAT'
};

/**
 * Parses raw state vector arrays from OpenSky into Aircraft objects.
 * Filters out aircraft with missing lat/lng.
 * @param {Array<Array<any>>} rawStates
 * @returns {import('./types').Aircraft[]}
 */
export function parseStateVectors(rawStates) {
  if (!rawStates || !Array.isArray(rawStates)) return [];

  const parsed = [];
  const now = performance.now();

  for (let i = 0; i < rawStates.length; i++) {
    const v = rawStates[i];
    
    const lat = v[6];
    const lng = v[5];
    
    // Filter out if position is completely unknown
    if (lat === null || lng === null) {
      continue;
    }

    const rawCallsign = v[1];
    const callsign = (typeof rawCallsign === 'string' && rawCallsign.trim() !== '') ? rawCallsign.trim() : null;

    let altitudeMeters = v[7];
    if (altitudeMeters === null) {
      altitudeMeters = v[13]; // fallback to geo_altitude
    }

    let posSource = SOURCE_MAP[v[16]];
    if (!posSource) {
      posSource = 'Other';
    }

    parsed.push({
      icao24: v[0],
      callsign,
      originCountry: v[2] || '',
      lastContact: v[4] || 0,
      lng,
      lat,
      altitudeFt: metersToFeet(altitudeMeters),
      onGround: v[8] === true,
      speedKnots: msToKnots(v[9]),
      heading: v[10],
      vertRateFpm: msToFeetPerMin(v[11]),
      squawk: String(v[14] || ''),
      positionSource: posSource,
      
      // Init interpolation refs
      prevLat: null,
      prevLng: null,
      refreshedAt: now
    });
  }

  return parsed;
}
