/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAircraftTrack } from '../../src/hooks/useAircraftTrack';

describe('useAircraftTrack', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('returns empty track if no icao24 provided', () => {
    const { result } = renderHook(() => useAircraftTrack(null));
    expect(result.current.track).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches track and parses coordinates correctly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        path: [
          [100, 48.0, 11.0, 5000, 90, false],
          [200, 48.1, 11.1, 5000, 90, false] // [time, lat, lon, ...]
        ]
      })
    });

    const { result } = renderHook(() => useAircraftTrack('a1b2c3'));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.track).toEqual([]);

    await act(async () => {
      // Allow promises to resolve
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.track).toEqual([
      [48.0, 11.0],
      [48.1, 11.1]
    ]);
    expect(global.fetch).toHaveBeenCalledWith('/api/opensky/tracks/all?icao24=a1b2c3&time=0');
  });

  it('handles network errors gracefully returning empty track', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const { result } = renderHook(() => useAircraftTrack('error1'));
    
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.track).toEqual([]);
  });

  it('caches the results to avoid duplicate fetches', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ path: [[1, 40, -70]] })
    });

    const { result, rerender } = renderHook(({ icao }) => useAircraftTrack(icao), {
      initialProps: { icao: 'cached' }
    });

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // switch away
    rerender({ icao: null });
    // switch back
    rerender({ icao: 'cached' });

    expect(result.current.track).toEqual([[40, -70]]);
    // Should NOT have called fetch again
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
