import { describe, it, expect } from 'vitest';
import { metersToFeet, msToKnots, msToFeetPerMin } from '../../src/utils/units';

describe('Unit Conversion', () => {
  it('metersToFeet calculates correctly', () => {
    expect(metersToFeet(null)).toBe(null);
    expect(metersToFeet(1000)).toBe(3281);
  });

  it('msToKnots calculates correctly', () => {
    expect(msToKnots(null)).toBe(null);
    expect(msToKnots(100)).toBe(194);
  });

  it('msToFeetPerMin calculates correctly', () => {
    expect(msToFeetPerMin(null)).toBe(null);
    expect(msToFeetPerMin(10)).toBe(1969);
  });
});
