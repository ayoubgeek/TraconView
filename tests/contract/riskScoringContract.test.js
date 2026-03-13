import { describe, it, expect } from 'vitest';
import { computeRiskScore } from '../../src/lib/riskScoring';

describe('Risk Scoring API Contract', () => {
  it('detects new critical threshold crossings for sound trigger', () => {
    const aircraft = {
      squawk: '7700',
      verticalRate: -2500,
      altitude: 20000,
      speed: 400,
      spi: true,
      lastSeen: Date.now() / 1000
    };
    // From Normal (0) to Critical (85) -> New Critical!
    const res1 = computeRiskScore(aircraft, 0);
    expect(res1.isNewCritical).toBe(true);
    
    // Once critical, subsequent updates shouldn't trigger again
    const res2 = computeRiskScore(aircraft, 85);
    expect(res2.isNewCritical).toBe(false);
  });
});
