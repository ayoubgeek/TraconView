/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisibilityPause } from '../../src/hooks/useVisibilityPause';
import { IDLE_PAUSE_MS } from '../../src/core/opensky/constants';

describe('useVisibilityPause', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset visibilityState mock
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'visible'
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const triggerVisibilityChange = (state) => {
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: state
    });
    document.dispatchEvent(new Event('visibilitychange'));
  };

  it('initializes to false when visible', () => {
    const { result } = renderHook(() => useVisibilityPause());
    expect(result.current).toBe(false);
  });

  it('pauses after IDLE_PAUSE_MS when hidden', () => {
    const { result } = renderHook(() => useVisibilityPause());
    
    act(() => {
      triggerVisibilityChange('hidden');
    });
    
    expect(result.current).toBe(false); // Not paused immediately
    
    act(() => {
      vi.advanceTimersByTime(IDLE_PAUSE_MS);
    });
    
    expect(result.current).toBe(true);
  });

  it('resumes immediately when visible again', () => {
    const { result } = renderHook(() => useVisibilityPause());
    
    act(() => {
      triggerVisibilityChange('hidden');
      vi.advanceTimersByTime(IDLE_PAUSE_MS);
    });
    
    expect(result.current).toBe(true);
    
    act(() => {
      triggerVisibilityChange('visible');
    });
    
    expect(result.current).toBe(false);
  });

  it('cancels pause if visibility returns before timeout', () => {
    const { result } = renderHook(() => useVisibilityPause());
    
    act(() => {
      triggerVisibilityChange('hidden');
      vi.advanceTimersByTime(IDLE_PAUSE_MS - 100);
      triggerVisibilityChange('visible');
      vi.advanceTimersByTime(200);
    });
    
    expect(result.current).toBe(false);
  });
});
