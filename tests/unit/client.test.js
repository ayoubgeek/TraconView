import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchStateVectors, fetchToken } from '../../src/core/opensky/client';

describe('OpenSky Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  const bbox = { north: 10, south: 0, east: 10, west: 0 };

  describe('fetchStateVectors', () => {
    it('handles 200 response with data and headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'X-Rate-Limit-Remaining': '1500' }),
        json: async () => ({ states: [['a1b2c3', 'CALL', 'US', 0, 0, 5, 5, 0, false, 0, 0, 0, null, 0, '', false, 1]] })
      });

      const result = await fetchStateVectors(bbox, 'token123');
      expect(result.ok).toBe(true);
      expect(result.creditsRemaining).toBe(1500);
      expect(result.aircraft).toBeDefined();
      expect(result.aircraft.length).toBe(1);
    });

    it('handles 429 rate limit with retry header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'X-Rate-Limit-Retry-After-Seconds': '60' })
      });

      const result = await fetchStateVectors(bbox, null);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('RATE_LIMITED');
      expect(result.retryAfterSeconds).toBe(60);
    });

    it('handles 401 unauthorized', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers()
      });

      const result = await fetchStateVectors(bbox, 'bad-token');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('TOKEN_EXPIRED');
    });

    it('handles 500 error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers()
      });

      const result = await fetchStateVectors(bbox, null);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('API_ERROR');
      expect(result.status).toBe(500);
    });

    it('handles network throw', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network disconnected'));

      const result = await fetchStateVectors(bbox, null);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('NETWORK_ERROR');
    });
  });

  describe('fetchToken', () => {
    it('handles success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'jwt.token', expires_in: 300 })
      });

      const result = await fetchToken('user', 'pass');
      expect(result.ok).toBe(true);
      expect(result.accessToken).toBe('jwt.token');
      expect(result.expiresIn).toBe(300);
    });

    it('handles 401 invalid credentials', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const result = await fetchToken('user', 'wrong');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('INVALID_CREDENTIALS');
    });
  });
});
