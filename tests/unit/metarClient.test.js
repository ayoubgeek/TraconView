import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchMetarData, getFlightCategoryColor, isMetarStale } from '../../src/lib/metarClient';

global.fetch = vi.fn();

describe('metarClient', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchMetarData', () => {
    it('returns empty array if no stations provided', async () => {
      const data = await fetchMetarData([]);
      expect(data).toEqual([]);
    });

    it('returns empty array on network error without throwing', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      const data = await fetchMetarData(['KJFK']);
      expect(data).toEqual([]);
    });

    it('fetches and maps fields correctly on success', async () => {
      const mockResponse = [{
        icaoId: 'KJFK',
        name: 'Kennedy Intl',
        lat: 40.64,
        lon: -73.78,
        obsTime: 1672531200,
        rawOb: 'KJFK 010000Z 27015KT 10SM BKN050 15/10 A2992',
        fltcat: 'VFR',
        temp: 15,
        dewp: 10,
        wdir: 270,
        wspd: 15,
        wgst: null,
        visib: '10+',
        altim: 1013.25,
        clouds: [{ cover: 'BKN', base: 5000 }]
      }];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const data = await fetchMetarData(['KJFK']);
      expect(data).toHaveLength(1);
      
      const metar = data[0];
      expect(metar.icao).toBe('KJFK');
      expect(metar.fltCat).toBe('VFR');
      expect(metar.rawOb).toBeDefined();
      expect(metar.lng).toBe(-73.78);
    });
  });

  describe('getFlightCategoryColor', () => {
    it('returns correct colors', () => {
      expect(getFlightCategoryColor('VFR')).toBe('#22c55e');
      expect(getFlightCategoryColor('MVFR')).toBe('#3b82f6');
      expect(getFlightCategoryColor('IFR')).toBe('#ef4444');
      expect(getFlightCategoryColor('LIFR')).toBe('#d946ef');
      expect(getFlightCategoryColor('UNKNOWN')).toBe('#6b7280'); // fallback
    });
  });

  describe('isMetarStale', () => {
    it('checks 29 min (not stale), 31 min (stale), 61 min (stale)', () => {
      const now = Date.now() / 1000;
      
      const res29 = isMetarStale(now - 29 * 60);
      expect(res29.stale).toBe(false);
      expect(res29.age).toBeCloseTo(29, 0);

      const res31 = isMetarStale(now - 31 * 60);
      expect(res31.stale).toBe(true);
      expect(res31.age).toBeCloseTo(31, 0);

      const res61 = isMetarStale(now - 61 * 60);
      expect(res61.stale).toBe(true);
      expect(res61.age).toBeCloseTo(61, 0);
    });
  });
});
