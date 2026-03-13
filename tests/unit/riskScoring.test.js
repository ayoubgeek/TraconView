import { describe, it, expect } from 'vitest';
import { computeRiskScore, getThreshold, RISK_RULES } from '../../src/lib/riskScoring';

describe('riskScoring', () => {
  describe('getThreshold', () => {
    it('maps scores to correct thresholds', () => {
      expect(getThreshold(0)).toBe('NORMAL');
      expect(getThreshold(10)).toBe('NORMAL');
      expect(getThreshold(11)).toBe('WATCH');
      expect(getThreshold(25)).toBe('WATCH');
      expect(getThreshold(26)).toBe('CAUTION');
      expect(getThreshold(50)).toBe('CAUTION');
      expect(getThreshold(51)).toBe('WARNING');
      expect(getThreshold(75)).toBe('WARNING');
      expect(getThreshold(76)).toBe('CRITICAL');
      expect(getThreshold(100)).toBe('CRITICAL');
    });
  });

  describe('computeRiskScore', () => {
    const baseAircraft = {
      squawk: null,
      verticalRate: 0,
      altitude: 35000,
      speed: 450,
      onGround: false,
      spi: false,
      lastSeen: Date.now() / 1000
    };

    it('returns 0 and NORMAL for aircraft with no anomalies', () => {
      const result = computeRiskScore(baseAircraft);
      expect(result.score).toBe(0);
      expect(result.threshold).toBe('NORMAL');
      expect(result.rules.length).toBe(0);
      expect(result.isNewCritical).toBe(false);
    });

    it('evaluates single rules in isolation correctly: SQUAWK_7700', () => {
      const result = computeRiskScore({ ...baseAircraft, squawk: '7700' });
      expect(result.score).toBe(50);
      expect(result.rules).toEqual([{ id: 'SQUAWK_7700', label: 'Emergency Squawk 7700', weight: 50 }]);
    });

    it('evaluates single rules in isolation correctly: RAPID_DESCENT_HIGH', () => {
      const result = computeRiskScore({ ...baseAircraft, verticalRate: -2500, altitude: 15000 });
      expect(result.score).toBe(25);
      expect(result.rules[0].id).toBe('RAPID_DESCENT_HIGH');
    });

    it('evaluates multiple rules additively', () => {
      const result = computeRiskScore({ ...baseAircraft, squawk: '7600', spi: true });
      expect(result.score).toBe(35 + 10);
      expect(result.rules.length).toBe(2);
      expect(result.rules.some(r => r.id === 'SQUAWK_7600')).toBe(true);
      expect(result.rules.some(r => r.id === 'SPI_ACTIVE')).toBe(true);
    });

    it('caps the maximum score at 100', () => {
      // 50 (7700) + 25 (rapid desc high) + 10 (unusual speed) + 10 (spi) + 10 (data gap) = over 100
      const maxAircraft = {
        ...baseAircraft,
        squawk: '7700', // 50
        verticalRate: -2500, // 25
        altitude: 26000, 
        speed: 100, // 10
        spi: true, // 10
        lastSeen: (Date.now() / 1000) - 40 // 5
      };
      const maxResult = computeRiskScore(maxAircraft);
      expect(maxResult.score).toBe(100);
      expect(maxResult.rules.length).toBe(5);
    });

    it('detects isNewCritical correctly', () => {
      // Prev 50, current 85 -> true
      const result1 = computeRiskScore({ ...baseAircraft, squawk: '7700', verticalRate: -2500, altitude: 20000, spi: true }, 50);
      expect(result1.score).toBe(85);
      expect(result1.isNewCritical).toBe(true);

      // Prev 80, current 85 -> false
      const result2 = computeRiskScore({ ...baseAircraft, squawk: '7700', verticalRate: -2500, altitude: 20000, spi: true }, 80);
      expect(result2.isNewCritical).toBe(false);
      
      // Prev 50, current 50 -> false
      const result3 = computeRiskScore({ ...baseAircraft, squawk: '7700' }, 50);
      expect(result3.isNewCritical).toBe(false);
    });
  });
});
