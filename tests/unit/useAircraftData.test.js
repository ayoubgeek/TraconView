import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAircraftData } from '../../src/hooks/useAircraftData';
import * as client from '../../src/core/opensky/client';

const mockSetAircraftData = vi.fn();
const mockUpdateStatus = vi.fn();

vi.mock('../../src/context/AircraftDataContext', () => ({
  useAircraftDataContext: () => ({ setAircraftData: mockSetAircraftData })
}));

vi.mock('../../src/context/ConnectionContext', () => ({
  useConnectionStatus: () => ({ status: { mode: 'live', authMode: 'authenticated' }, updateStatus: mockUpdateStatus })
}));

vi.mock('../../src/hooks/useTokenManager', () => ({
  useTokenManager: () => ({ getToken: () => 'fake-token' })
}));

vi.mock('../../src/hooks/useMapViewport', () => ({
  useMapViewport: () => ({ north: 1, south: 0, east: 1, west: 0 })
}));

vi.mock('../../src/hooks/useVisibilityPause', () => ({
  useVisibilityPause: () => false
}));

vi.mock('../../src/core/opensky/client', () => ({
  fetchStateVectors: vi.fn()
}));

describe('useAircraftData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSetAircraftData.mockClear();
    mockUpdateStatus.mockClear();
    client.fetchStateVectors.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches on interval and updates contexts on success', async () => {
    const fakeAircraft = [{ icao24: 'a1' }];
    client.fetchStateVectors.mockResolvedValue({
      ok: true, aircraft: fakeAircraft, creditsRemaining: 100, timestamp: 123
    });

    renderHook(() => useAircraftData());

    expect(client.fetchStateVectors).toHaveBeenCalled();
    
    await act(async () => { await Promise.resolve(); });

    expect(mockSetAircraftData).toHaveBeenCalled();
    expect(mockUpdateStatus).toHaveBeenCalledWith(expect.objectContaining({ mode: 'live', creditsRemaining: 100 }));
  });

  it('handles RATE_LIMITED and pauses', async () => {
    client.fetchStateVectors.mockResolvedValue({
      ok: false, error: 'RATE_LIMITED', retryAfterSeconds: 60, creditsRemaining: 0
    });

    renderHook(() => useAircraftData());
    
    await act(async () => { await Promise.resolve(); });

    expect(mockUpdateStatus).toHaveBeenCalledWith(expect.objectContaining({ mode: 'rate-limited', retryAfterMs: 60000 }));
  });

  it('handles NETWORK_ERROR and sets offline', async () => {
    client.fetchStateVectors.mockResolvedValue({
      ok: false, error: 'NETWORK_ERROR', creditsRemaining: -1
    });

    renderHook(() => useAircraftData());
    
    await act(async () => { await Promise.resolve(); });

    expect(mockUpdateStatus).toHaveBeenCalledWith(expect.objectContaining({ mode: 'offline' }));
    expect(mockSetAircraftData).not.toHaveBeenCalled();
  });
});
