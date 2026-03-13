import { describe, it, expect } from 'vitest';
import { transformOpenSkyAircraft } from '../../src/lib/transformers';
import { computeRiskScore } from '../../src/lib/riskScoring';

describe('Anomaly Pipeline Integration', () => {
  it('transforms raw OpenSky data and scores squawk 7700 as WARNING+', () => {
    const raw = ['abc123', 'TEST123', 'TestCountry', 1234567890, 1234567890, 10.0, 50.0, 10000, false, 250, 180, -5, null, null, '7700', false, 0];
    const aircraft = transformOpenSkyAircraft(raw);
    const result = computeRiskScore(aircraft);

    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.rules.some(r => r.id === 'SQUAWK_7700')).toBe(true);
    expect(['WARNING', 'CRITICAL']).toContain(result.threshold);
  });

  it('transforms raw data and scores rapid descent additively', () => {
    const raw = ['def456', 'FAST01', 'US', 1234567890, 1234567890, -80.0, 40.0, 3000, false, 200, 90, -12, null, null, '1200', false, 0];
    const aircraft = transformOpenSkyAircraft(raw);
    const result = computeRiskScore(aircraft);

    // 3000m = ~9843ft (below 10000), verticalRate = -12 m/s = ~-2362 fpm
    // altitude 9843ft > 5000 and <= 10000, verticalRate < -1500 → RAPID_DESCENT_LOW (+15)
    expect(result.score).toBeGreaterThan(0);
    expect(result.rules.some(r => r.id === 'RAPID_DESCENT_LOW')).toBe(true);
  });

  it('returns score 0 for normal flight', () => {
    const raw = ['ghi789', 'NORM01', 'FR', 1234567890, Date.now() / 1000, 2.0, 48.0, 11000, false, 250, 270, -2, null, null, '1000', false, 0];
    const aircraft = transformOpenSkyAircraft(raw);
    const result = computeRiskScore(aircraft);

    expect(result.score).toBe(0);
    expect(result.threshold).toBe('NORMAL');
    expect(result.rules).toHaveLength(0);
  });
});
