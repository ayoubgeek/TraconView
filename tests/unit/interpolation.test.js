import { describe, it, expect } from 'vitest';
import { interpolatePosition, clampProgress } from '../../src/core/map/interpolation';

describe('Interpolation', () => {
  describe('interpolatePosition', () => {
    it('returns prev at progress 0', () => {
      expect(interpolatePosition(10, 20, 0)).toBe(10);
    });
    it('returns curr at progress 1', () => {
      expect(interpolatePosition(10, 20, 1)).toBe(20);
    });
    it('interpolates linearly', () => {
      expect(interpolatePosition(0, 10, 0.5)).toBe(5);
      expect(interpolatePosition(50, 100, 0.1)).toBe(55);
    });
  });

  describe('clampProgress', () => {
    it('clamps to 0 for negative elapsed', () => {
      expect(clampProgress(-100, 1000)).toBe(0);
    });
    it('clamps to 1 for elapsed > interval', () => {
      expect(clampProgress(1500, 1000)).toBe(1);
    });
    it('returns proportional fraction', () => {
      expect(clampProgress(500, 1000)).toBe(0.5);
    });
  });
});
