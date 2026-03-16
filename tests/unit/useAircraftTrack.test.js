/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAircraftTrack } from '../../src/hooks/useAircraftTrack';
import * as AircraftDataContext from '../../src/context/AircraftDataContext';

vi.mock('../../src/context/AircraftDataContext', () => ({
  useAircraftById: vi.fn()
}));

describe('useAircraftTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty track if no icao24 provided', () => {
    AircraftDataContext.useAircraftById.mockReturnValue(null);
    const { result } = renderHook(() => useAircraftTrack(null));
    expect(result.current.track).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('accumulates track points as aircraft position updates', () => {
    let mockAircraft = { icao24: 'a1', lat: 40.0, lng: -70.0 };
    AircraftDataContext.useAircraftById.mockImplementation(() => mockAircraft);
    
    const { result, rerender } = renderHook(() => useAircraftTrack('a1'));
    
    expect(result.current.track).toEqual([[40.0, -70.0]]);
    
    // Simulate position update (must be outside of the 0.0001 threshold)
    mockAircraft = { icao24: 'a1', lat: 40.1, lng: -70.1 };
    rerender();
    
    expect(result.current.track).toEqual([
      [40.0, -70.0],
      [40.1, -70.1]
    ]);
  });

  it('resets track when aircraft ID changes', () => {
    let mockAircraft = { icao24: 'a1', lat: 40.0, lng: -70.0 };
    AircraftDataContext.useAircraftById.mockImplementation(() => mockAircraft);
    
    const { result, rerender } = renderHook(({ id }) => useAircraftTrack(id), {
      initialProps: { id: 'a1' }
    });
    
    expect(result.current.track).toEqual([[40.0, -70.0]]);
    
    // Change selected aircraft
    mockAircraft = { icao24: 'b2', lat: 50.0, lng: -80.0 };
    rerender({ id: 'b2' });
    
    expect(result.current.track).toEqual([[50.0, -80.0]]);
  });

  it('ignores duplicate proximity coordinate ticks', () => {
    let mockAircraft = { icao24: 'a1', lat: 40.0, lng: -70.0 };
    AircraftDataContext.useAircraftById.mockImplementation(() => mockAircraft);
    
    const { result, rerender } = renderHook(() => useAircraftTrack('a1'));
    
    expect(result.current.track).toEqual([[40.0, -70.0]]);
    
    // Simulate position update that is too close
    mockAircraft = { icao24: 'a1', lat: 40.00001, lng: -70.00001 };
    rerender();
    
    // Track should not have accumulated a new point
    expect(result.current.track.length).toBe(1);
  });
});
