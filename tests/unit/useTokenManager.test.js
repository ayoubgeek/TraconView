import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTokenManager } from '../../src/hooks/useTokenManager';
import * as client from '../../src/core/opensky/client';

// Mock contexts
const mockUpdateStatus = vi.fn();
vi.mock('../../src/context/ConnectionContext', () => ({
  useConnectionStatus: () => ({ updateStatus: mockUpdateStatus })
}));

vi.mock('../../src/hooks/useCredentials', () => ({
  useCredentials: vi.fn()
}));

vi.mock('../../src/core/opensky/client', () => ({
  fetchToken: vi.fn()
}));

import { useCredentials } from '../../src/hooks/useCredentials';

describe('useTokenManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUpdateStatus.mockClear();
    client.fetchToken.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing if no credentials exist', () => {
    useCredentials.mockReturnValue({ credentials: null });
    const { result } = renderHook(() => useTokenManager());
    
    expect(client.fetchToken).not.toHaveBeenCalled();
    expect(result.current.getToken()).toBeNull();
  });

  it('fetches token on mount if credentials exist', async () => {
    useCredentials.mockReturnValue({ credentials: { clientId: 'a', clientSecret: 'b' } });
    client.fetchToken.mockResolvedValue({
      ok: true, accessToken: 'token123', expiresIn: 100
    });

    const { result } = renderHook(() => useTokenManager());
    
    await act(async () => {
      await Promise.resolve();
    });

    expect(client.fetchToken).toHaveBeenCalledWith('a', 'b');
    expect(result.current.getToken()).toBe('token123');
    expect(mockUpdateStatus).toHaveBeenCalledWith({ authMode: 'authenticated' });
  });

  it('schedules refresh and requests new token', async () => {
    useCredentials.mockReturnValue({ credentials: { clientId: 'a', clientSecret: 'b' } });
    client.fetchToken.mockResolvedValueOnce({
      ok: true, accessToken: 'token1', expiresIn: 100
    }).mockResolvedValueOnce({
      ok: true, accessToken: 'token2', expiresIn: 100
    });

    const { result } = renderHook(() => useTokenManager());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.getToken()).toBe('token1');

    await act(async () => {
      vi.advanceTimersByTime(80000); // 80% of 100s
      await Promise.resolve(); 
    });

    expect(client.fetchToken).toHaveBeenCalledTimes(2);
    expect(result.current.getToken()).toBe('token2');
  });

  it('falls back to anonymous on INVALID_CREDENTIALS', async () => {
    useCredentials.mockReturnValue({ credentials: { clientId: 'a', clientSecret: 'b' } });
    client.fetchToken.mockResolvedValue({
      ok: false, error: 'INVALID_CREDENTIALS'
    });

    const { result } = renderHook(() => useTokenManager());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.getToken()).toBeNull();
    expect(mockUpdateStatus).toHaveBeenCalledWith({ authMode: 'anonymous' });
  });
});
