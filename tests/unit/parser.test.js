import { describe, it, expect } from 'vitest';
import { parseStateVectors } from '../../src/core/opensky/parser';

describe('OpenSky Parser', () => {
  const baseVector = [
    'a1b2c3', // 0: icao24
    'SWA123  ', // 1: callsign
    'United States', // 2: origin_country
    1678886400, // 3: time_position
    1678886410, // 4: last_contact
    -122.38, // 5: lng
    37.61, // 6: lat
    10000, // 7: baro_altitude (m)
    false, // 8: on_ground
    250, // 9: velocity (m/s)
    90, // 10: true_track
    10, // 11: vertical_rate (m/s)
    null, // 12: sensors
    10100, // 13: geo_altitude (m)
    '1234', // 14: squawk
    false, // 15: spi
    1 // 16: position_source (ADS-B)
  ];

  it('parses valid state vector correctly', () => {
    const result = parseStateVectors([baseVector]);
    expect(result.length).toBe(1);
    const ac = result[0];
    expect(ac.icao24).toBe('a1b2c3');
    expect(ac.callsign).toBe('SWA123');
    expect(ac.originCountry).toBe('United States');
    expect(ac.lat).toBe(37.61);
    expect(ac.lng).toBe(-122.38);
    expect(ac.onGround).toBe(false);
    expect(ac.heading).toBe(90);
    expect(ac.squawk).toBe('1234');
    expect(ac.lastContact).toBe(1678886410);
    expect(ac.positionSource).toBe('ADS-B');
    // Unit conversions
    expect(ac.altitudeFt).toBe(32808); // 10000 * 3.28084 = 32808.4 -> 32808
    expect(ac.speedKnots).toBe(486); // 250 * 1.94384 = 485.96 -> 486
    expect(ac.vertRateFpm).toBe(1969); // 10 * 196.85 = 1968.5 -> 1969
  });

  it('excludes aircraft with null lat or lng', () => {
    const noLat = [...baseVector];
    noLat[6] = null;
    expect(parseStateVectors([noLat]).length).toBe(0);

    const noLng = [...baseVector];
    noLng[5] = null;
    expect(parseStateVectors([noLng]).length).toBe(0);
  });

  it('normalizes empty callsign to null', () => {
    const emptyCallsign = [...baseVector];
    emptyCallsign[1] = '  ';
    const result = parseStateVectors([emptyCallsign]);
    expect(result[0].callsign).toBe(null);
  });

  it('uses geo_altitude if baro_altitude is null', () => {
    const noBaro = [...baseVector];
    noBaro[7] = null; // baro
    noBaro[13] = 5000; // geo
    const result = parseStateVectors([noBaro]);
    expect(result[0].altitudeFt).toBe(16404); // 5000 m to ft
  });

  it('defaults on_ground to false if null', () => {
    const nullGround = [...baseVector];
    nullGround[8] = null;
    const result = parseStateVectors([nullGround]);
    expect(result[0].onGround).toBe(false);
  });

  it('maps position_source correctly', () => {
    const tests = [
      { source: 1, expected: 'ADS-B' },
      { source: 7, expected: 'MLAT' },
      { source: 3, expected: 'FLARM' },
      { source: 0, expected: 'Other' },
      { source: 99, expected: 'Other' },
    ];
    tests.forEach(({ source, expected }) => {
      const v = [...baseVector];
      v[16] = source;
      expect(parseStateVectors([v])[0].positionSource).toBe(expected);
    });
  });
});
