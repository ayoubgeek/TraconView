import { describe, it, expect } from 'vitest';
import { detectHolding, hasExitedHolding, updatePositionHistory, getHeadingDelta } from '../../src/lib/holdingDetector';

describe('holdingDetector', () => {
  describe('detectHolding', () => {
    it('returns false for straight-line flight', () => {
      const positions = Array(10).fill({ heading: 90, altitude: 5000 });
      expect(detectHolding(positions).isHolding).toBe(false);
    });

    it('returns true for standard holding pattern (>300°)', () => {
      const positions = [
        { heading: 0, altitude: 5000 },
        { heading: 45, altitude: 5000 },
        { heading: 90, altitude: 5000 },
        { heading: 135, altitude: 5000 },
        { heading: 180, altitude: 5000 },
        { heading: 225, altitude: 5000 },
        { heading: 270, altitude: 5000 },
        { heading: 315, altitude: 5000 },
        { heading: 350, altitude: 5000 }
      ];
      expect(detectHolding(positions).isHolding).toBe(true);
    });

    it('returns false for partial turn (<300°)', () => {
      const positions = [
        { heading: 0, altitude: 5000 },
        { heading: 45, altitude: 5000 },
        { heading: 90, altitude: 5000 },
        { heading: 135, altitude: 5000 },
        { heading: 180, altitude: 5000 },
        { heading: 200, altitude: 5000 },
        { heading: 200, altitude: 5000 },
        { heading: 200, altitude: 5000 }
      ];
      expect(detectHolding(positions).isHolding).toBe(false);
    });

    it('handles heading wraparound correctly', () => {
      const delta = getHeadingDelta(350, 10);
      expect(delta).toBe(20);
      const delta2 = getHeadingDelta(10, 350);
      expect(delta2).toBe(-20);
    });

    it('returns false if fewer than 8 positions', () => {
      const positions = Array(7).fill({ heading: 90, altitude: 5000 });
      expect(detectHolding(positions).isHolding).toBe(false);
    });

    it('returns false if low altitude', () => {
      const positions = Array(10).fill({ heading: 90, altitude: 500 });
      expect(detectHolding(positions).isHolding).toBe(false);
    });
  });

  describe('hasExitedHolding', () => {
    it('returns true if 5 stable headings', () => {
      const positions = Array(5).fill({ heading: 90, altitude: 5000 });
      expect(hasExitedHolding(positions)).toBe(true);
    });

    it('returns false if still turning', () => {
      const positions = [
        { heading: 0, altitude: 5000 },
        { heading: 45, altitude: 5000 },
        { heading: 90, altitude: 5000 },
        { heading: 135, altitude: 5000 },
        { heading: 180, altitude: 5000 }
      ];
      expect(hasExitedHolding(positions)).toBe(false);
    });
  });

  describe('updatePositionHistory', () => {
    it('appends and applies ring buffer', () => {
      const history = new Map();
      const aircraft = [{ id: 'A1', lat: 1, lng: 1, heading: 90, altitude: 5000, lastSeen: 100 }];
      
      let newHistory = history;
      for (let i = 0; i < 15; i++) {
        newHistory = updatePositionHistory(newHistory, aircraft, 100);
      }
      
      expect(newHistory.get('A1')).toHaveLength(10);
    });

    it('evicts stale entries', () => {
      const history = new Map([
        ['A1', [{ lat: 1, lng: 1, heading: 90, altitude: 5000, timestamp: 100 }]]
      ]);
      const newHistory = updatePositionHistory(history, [], 135);
      expect(newHistory.has('A1')).toBe(false);
    });
  });
});
