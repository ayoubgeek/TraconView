// src/lib/transformers.js
import { metersToFeet, msToKnots, msToFtPerMin } from './formatters';
import { SOURCE_MAP } from './constants';

export function transformOpenSkyAircraft(raw) {
  // raw is an array of data based on OpenSky state vector format
  // 0: icao24
  // 1: callsign
  // 2: origin_country
  // 3: time_position
  // 4: last_contact
  // 5: longitude
  // 6: latitude
  // 7: baro_altitude
  // 8: on_ground
  // 9: velocity
  // 10: true_track
  // 11: vertical_rate
  // 12: sensors
  // 13: geo_altitude
  // 14: squawk
  // 15: spi
  // 16: position_source

  const id = raw[0];
  let callsign = raw[1] ? String(raw[1]).trim() : '';
  if (!callsign) {
    callsign = id;
  }

  return {
    id,
    callsign,
    country: raw[2],
    lastSeen: raw[4],
    lng: raw[5] !== null ? raw[5] : null,
    lat: raw[6] !== null ? raw[6] : null,
    altitude: raw[7] !== null ? metersToFeet(raw[7]) : 0,
    onGround: !!raw[8],
    speed: raw[9] !== null ? msToKnots(raw[9]) : 0,
    heading: raw[10] !== null ? raw[10] : 0,
    verticalRate: raw[11] !== null ? msToFtPerMin(raw[11]) : 0,
    squawk: raw[14] !== null ? String(raw[14]) : null,
    spi: !!raw[15],
    source: SOURCE_MAP[raw[16]] || 'UNKNOWN'
  };
}
