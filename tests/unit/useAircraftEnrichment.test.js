/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAircraftEnrichment } from '../../src/hooks/useAircraftEnrichment';
import * as enrichmentService from '../../src/services/enrichmentService';

vi.mock('../../src/services/enrichmentService', () => ({
  fetchAircraftPhoto: vi.fn(),
  fetchRouteInfo: vi.fn()
}));

describe('useAircraftEnrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes to null correctly', () => {
    const { result } = renderHook(() => useAircraftEnrichment(null));
    expect(result.current.photo).toBeNull();
    expect(result.current.route).toBeNull();
    expect(result.current.isLoadingPhoto).toBe(false);
    expect(result.current.isLoadingRoute).toBe(false);
    expect(enrichmentService.fetchAircraftPhoto).not.toHaveBeenCalled();
    expect(enrichmentService.fetchRouteInfo).not.toHaveBeenCalled();
  });

  it('fetches photo and route successfully', async () => {
    enrichmentService.fetchAircraftPhoto.mockResolvedValueOnce({ thumbnail: 'http://test.com/img.jpg' });
    enrichmentService.fetchRouteInfo.mockResolvedValueOnce({ origin: 'JFK', destination: 'LHR' });

    const aircraft = { icao24: 'a1b2c3', callsign: 'ABC1234' };
    const { result } = renderHook(() => useAircraftEnrichment(aircraft));

    expect(result.current.isLoadingPhoto).toBe(true);
    expect(result.current.isLoadingRoute).toBe(true);
    expect(result.current.photo).toBeNull();
    expect(result.current.route).toBeNull();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoadingPhoto).toBe(false);
    expect(result.current.isLoadingRoute).toBe(false);
    expect(result.current.photo).toEqual({ thumbnail: 'http://test.com/img.jpg' });
    expect(result.current.route).toEqual({ origin: 'JFK', destination: 'LHR' });

    expect(enrichmentService.fetchAircraftPhoto).toHaveBeenCalledWith('a1b2c3');
    expect(enrichmentService.fetchRouteInfo).toHaveBeenCalledWith('ABC1234');
  });

  it('caches the results', async () => {
    enrichmentService.fetchAircraftPhoto.mockResolvedValue({ thumbnail: 'http://test.com/cache.jpg' });
    enrichmentService.fetchRouteInfo.mockResolvedValue({ origin: 'JFK', destination: 'LHR' });

    const aircraft = { icao24: 'cached1', callsign: 'CACHED1' };
    const { result, rerender } = renderHook(({ ac }) => useAircraftEnrichment(ac), {
      initialProps: { ac: aircraft }
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(enrichmentService.fetchAircraftPhoto).toHaveBeenCalledTimes(1);

    rerender({ ac: null });
    rerender({ ac: aircraft }); // Should hit cache

    expect(result.current.photo).toEqual({ thumbnail: 'http://test.com/cache.jpg' });
    expect(enrichmentService.fetchAircraftPhoto).toHaveBeenCalledTimes(1); // Still 1
  });
});
