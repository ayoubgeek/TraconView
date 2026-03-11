import { describe, it, expect } from 'vitest';
import { transformOpenSkyAircraft } from '../../src/lib/transformers';
import { SOURCE_MAP } from '../../src/lib/constants';

describe('Transformers', () => {
  describe('transformOpenSkyAircraft', () => {
    it('correctly maps raw state array to Aircraft model', () => {
      // 0: icao24, 1: callsign, 2: origin_country, 3: time_position, 4: last_contact,
      // 5: longitude, 6: latitude, 7: baro_altitude, 8: on_ground, 9: velocity,
      // 10: true_track, 11: vertical_rate, 12: sensors, 13: geo_altitude, 14: squawk,
      // 15: spi, 16: position_source
      const rawArray = [
        "3c6444", "DLH1234 ", "Germany", 1741737600, 1741737595,
        8.5622, 50.0379, 10668, false, 232.53,
        270, -1.02, null, 11000, "1000",
        false, 0
      ];

      const aircraft = transformOpenSkyAircraft(rawArray);

      expect(aircraft.id).toBe("3c6444");
      expect(aircraft.callsign).toBe("DLH1234"); // Trimmed
      expect(aircraft.country).toBe("Germany");
      expect(aircraft.lng).toBe(8.5622);
      expect(aircraft.lat).toBe(50.0379);
      expect(aircraft.altitude).toBeCloseTo(35000, -2); // 10668m ≈ 35000ft
      expect(aircraft.onGround).toBe(false);
      expect(aircraft.speed).toBeCloseTo(452, 0); // 232.53 m/s ≈ 452 kts
      expect(aircraft.heading).toBe(270);
      expect(aircraft.verticalRate).toBeCloseTo(-200, -1); // -1.02 m/s ≈ -200 fpm
      expect(aircraft.squawk).toBe("1000");
      expect(aircraft.spi).toBe(false);
      expect(aircraft.source).toBe(SOURCE_MAP[0]); // ADSB
      expect(aircraft.lastSeen).toBe(1741737595);
    });

    it('falls back to icao24 if callsign is empty', () => {
      const rawArray = [
        "3c6444", "", "Germany", 1741737600, 1741737595,
        8.5622, 50.0379, 10668, false, 232.53,
        270, -1.02, null, 11000, "1000",
        false, 0
      ];

      const aircraft = transformOpenSkyAircraft(rawArray);
      expect(aircraft.callsign).toBe("3c6444");
    });

    it('handles null values for positional and velocity data gracefully', () => {
      const rawArray = [
        "3c6444", "TST", "Germany", 1741737600, 1741737595,
        null, null, null, false, null,
        null, null, null, null, null,
        false, 0
      ];

      const aircraft = transformOpenSkyAircraft(rawArray);
      expect(aircraft.lat).toBeNull();
      expect(aircraft.lng).toBeNull();
      expect(aircraft.altitude).toBe(0);
      expect(aircraft.speed).toBe(0);
      expect(aircraft.heading).toBe(0);
      expect(aircraft.verticalRate).toBe(0);
      expect(aircraft.squawk).toBeNull();
    });
  });
});
