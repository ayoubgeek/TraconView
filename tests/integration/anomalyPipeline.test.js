import { describe, it, expect } from 'vitest';
import { transformOpenSkyAircraft } from '../../src/lib/transformers';
import { checkAnomalies } from '../../src/lib/anomalyRules';

describe('Anomaly Pipeline Integration', () => {
  it('transforms raw OpenSky data and detects squawk 7700', () => {
    const raw = ['abc123', 'TEST123', 'TestCountry', 1234567890, 1234567890, 10.0, 50.0, 10000, false, 250, 180, -5, null, null, '7700', false, 0];
    const aircraft = transformOpenSkyAircraft(raw);
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly).not.toBeNull();
    expect(anomaly.type).toBe('SQUAWK_7700');
    expect(anomaly.severity).toBe('CRITICAL');
  });

  it('transforms raw data and detects rapid descent', () => {
    const raw = ['def456', 'FAST01', 'US', 1234567890, 1234567890, -80.0, 40.0, 3000, false, 200, 90, -12, null, null, '1200', false, 0];
    const aircraft = transformOpenSkyAircraft(raw);
    const anomaly = checkAnomalies(aircraft);
    
    // 3000m = ~9843ft (>5000), verticalRate = -12 m/s = -2362 fpm (<-2000)
    expect(anomaly).not.toBeNull();
    expect(anomaly.type).toBe('RAPID_DESCENT');
    expect(anomaly.severity).toBe('MEDIUM');
  });

  it('returns null for normal flight', () => {
    const raw = ['ghi789', 'NORM01', 'FR', 1234567890, 1234567890, 2.0, 48.0, 11000, false, 250, 270, -2, null, null, '1000', false, 0];
    const aircraft = transformOpenSkyAircraft(raw);
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly).toBeNull();
  });
});
