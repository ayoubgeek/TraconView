import { describe, it, expect } from 'vitest';
import { AIRCRAFT_CATEGORY_COLORS } from '../../src/lib/constants';

describe('AIRCRAFT_CATEGORY_COLORS', () => {
  it('maps all 8 categories to the correct hex color', () => {
    expect(AIRCRAFT_CATEGORY_COLORS['commercial']).toBe('#3b82f6');
    expect(AIRCRAFT_CATEGORY_COLORS['military']).toBe('#d97706');
    expect(AIRCRAFT_CATEGORY_COLORS['emergency/anomaly']).toBe('#ef4444');
    expect(AIRCRAFT_CATEGORY_COLORS['cargo']).toBe('#6366f1');
    expect(AIRCRAFT_CATEGORY_COLORS['business_jet']).toBe('#8b5cf6');
    expect(AIRCRAFT_CATEGORY_COLORS['helicopter']).toBe('#10b981');
    expect(AIRCRAFT_CATEGORY_COLORS['general_aviation']).toBe('#14b8a6');
    expect(AIRCRAFT_CATEGORY_COLORS['unknown']).toBe('#6b7280');
  });
  
  it('contains exactly 8 keys', () => {
    expect(Object.keys(AIRCRAFT_CATEGORY_COLORS).length).toBe(8);
  });
});
