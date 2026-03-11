import { describe, it, expect } from 'vitest';
import { metersToFeet, msToKnots, msToFtPerMin } from '../../src/lib/formatters';

describe('Formatters', () => {
  describe('metersToFeet', () => {
    it('converts meters to feet correctly', () => {
      expect(metersToFeet(1000)).toBeCloseTo(3281, 0);
      expect(metersToFeet(0)).toBe(0);
    });

    it('returns null for null/undefined input', () => {
      expect(metersToFeet(null)).toBeNull();
      expect(metersToFeet(undefined)).toBeNull();
    });
  });

  describe('msToKnots', () => {
    it('converts m/s to knots correctly', () => {
      expect(msToKnots(100)).toBeCloseTo(194, 0);
      expect(msToKnots(0)).toBe(0);
    });

    it('returns null for null/undefined input', () => {
      expect(msToKnots(null)).toBeNull();
    });
  });

  describe('msToFtPerMin', () => {
    it('converts m/s to ft/min correctly', () => {
      expect(msToFtPerMin(-10)).toBe(-1968.5);
      expect(msToFtPerMin(5)).toBe(984.25);
      expect(msToFtPerMin(0)).toBe(0);
    });

    it('returns null for null/undefined input', () => {
      expect(msToFtPerMin(null)).toBeNull();
    });
  });
});
