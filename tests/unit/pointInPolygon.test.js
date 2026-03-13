import { describe, it, expect } from 'vitest';
import { computeBBox, pointInRing, pointInPolygon } from '../../src/lib/pointInPolygon';

describe('pointInPolygon', () => {
  const squareRing = [
    [0, 0], [10, 0], [10, 10], [0, 10], [0, 0]
  ];

  describe('computeBBox', () => {
    it('computes correct bounding box for a ring', () => {
      const bbox = computeBBox(squareRing);
      expect(bbox).toEqual({ minLng: 0, minLat: 0, maxLng: 10, maxLat: 10 });
    });
  });

  describe('pointInRing', () => {
    it('returns true for point clearly inside', () => {
      expect(pointInRing(5, 5, squareRing)).toBe(true);
    });

    it('returns false for point clearly outside', () => {
      expect(pointInRing(15, 15, squareRing)).toBe(false);
      expect(pointInRing(-5, 5, squareRing)).toBe(false);
    });
  });

  describe('pointInPolygon', () => {
    const geometry = {
      type: 'Polygon',
      coordinates: [
        squareRing, // outer ring
        [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]] // hole
      ]
    };

    it('returns true for point inside polygon but outside hole', () => {
      expect(pointInPolygon(1, 1, geometry)).toBe(true);
      expect(pointInPolygon(9, 9, geometry)).toBe(true);
      expect(pointInPolygon(5, 1, geometry)).toBe(true);
    });

    it('returns false for point inside hole', () => {
      expect(pointInPolygon(5, 5, geometry)).toBe(false);
    });

    it('returns false quickly if point is outside provided bbox', () => {
      const bbox = { minLng: 0, minLat: 0, maxLng: 10, maxLat: 10 };
      expect(pointInPolygon(15, 15, geometry, bbox)).toBe(false);
    });

    it('handles empty inputs gracefully', () => {
      expect(pointInPolygon(5, 5, null)).toBe(false);
      expect(pointInPolygon(5, 5, { type: 'Polygon', coordinates: [] })).toBe(false);
    });
  });
});
