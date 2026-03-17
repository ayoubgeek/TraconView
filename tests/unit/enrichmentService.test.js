/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAircraftPhoto, fetchRouteInfo } from '../../src/services/enrichmentService';

describe('enrichmentService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('fetchAircraftPhoto', () => {
    it('returns null if no icao24 provided', async () => {
      const result = await fetchAircraftPhoto(null);
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns photo object on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          photos: [
            {
              thumbnail_large: { src: 'https://img.planespotters.net/photo.jpg' },
              photographer: 'John Doe',
              link: 'https://planespotters.net/photo/123'
            }
          ]
        })
      });

      const result = await fetchAircraftPhoto('a1b2c3');
      expect(result).toEqual({
        thumbnail: 'https://img.planespotters.net/photo.jpg',
        photographer: 'John Doe',
        link: 'https://planespotters.net/photo/123'
      });
      expect(global.fetch).toHaveBeenCalledWith('https://api.planespotters.net/pub/photos/hex/a1b2c3');
    });

    it('returns null on 404', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
      const result = await fetchAircraftPhoto('a1b2c3');
      expect(result).toBeNull();
    });

    it('returns null and catches error gracefully on network failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await fetchAircraftPhoto('a1b2c3');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('fetchRouteInfo', () => {
    it('returns null if no callsign provided', async () => {
      const result = await fetchRouteInfo('');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns route object on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          route: ['KJFK', 'LHR']
        })
      });

      const result = await fetchRouteInfo('BAW1  ');
      expect(result).toEqual({
        origin: { icao: 'KJFK' },
        destination: { icao: 'LHR' }
      });
      expect(global.fetch).toHaveBeenCalledWith('/api/opensky/routes?callsign=BAW1');
    });

    it('returns null on 404', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
      const result = await fetchRouteInfo('BAW1');
      expect(result).toBeNull();
    });

    it('catches error gracefully on network failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await fetchRouteInfo('BAW1');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});
