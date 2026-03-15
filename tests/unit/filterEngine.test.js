import { describe, it, expect } from 'vitest';
import { applyFilters } from '../../src/lib/filterEngine';

describe('filterEngine', () => {
  const mockAircraftMap = new Map([
    ['1', { id: '1', callsign: 'DAL1', category: 'commercial', altitude: 35000, speed: 400, onGround: false }],
    ['2', { id: '2', callsign: 'RCH2', category: 'military', altitude: 15000, speed: 250, onGround: false }],
    ['3', { id: '3', callsign: 'N123', category: 'general_aviation', altitude: 0, speed: 0, onGround: true }],
    ['4', { id: '4', callsign: 'UPS4', category: 'cargo', altitude: 5000, speed: 200, onGround: false }],
  ]);

  it('returns all when empty filters', () => {
    const filters = {};
    const res = applyFilters(mockAircraftMap, filters, new Set());
    // Should return a Map of size 4
    expect(res.size).toBe(4);
  });

  it('applies OR logic within categories', () => {
    const filters = {
      categories: ['commercial', 'military']
    };
    const res = applyFilters(mockAircraftMap, filters, new Set());
    expect(res.size).toBe(2);
    expect(res.has('1')).toBe(true);
    expect(res.has('2')).toBe(true);
  });

  it('applies AND logic across properties (category + altitude)', () => {
    const filters = {
      categories: ['commercial', 'military'],
      altitudeMin: 20000
    };
    const res = applyFilters(mockAircraftMap, filters, new Set());
    expect(res.size).toBe(1);
    expect(res.has('1')).toBe(true);
  });

  it('always includes pinned aircraft regardless of filters', () => {
    const filters = {
      categories: ['military'] 
    };
    const pinned = new Set(['1']); // 1 is commercial, normally excluded
    const res = applyFilters(mockAircraftMap, filters, pinned);
    expect(res.size).toBe(2);
    expect(res.has('1')).toBe(true);
    expect(res.has('2')).toBe(true);
  });

  it('filters by excludeGround', () => {
    const filters = { excludeGround: true };
    const res = applyFilters(mockAircraftMap, filters, new Set());
    expect(res.size).toBe(3);
    expect(res.has('3')).toBe(false);
  });

  it('filters by searchTerm (callsign or id)', () => {
    const filtersDAL = { searchTerm: 'DAL' };
    const res1 = applyFilters(mockAircraftMap, filtersDAL, new Set());
    expect(res1.size).toBe(1);
    expect(res1.has('1')).toBe(true);
    
    // Test case insensitive
    const filtersUps = { searchTerm: 'ups' };
    const res2 = applyFilters(mockAircraftMap, filtersUps, new Set());
    expect(res2.size).toBe(1);
    expect(res2.has('4')).toBe(true);
  });

  it('handles 0 and null values correctly for numeric filters', () => {
    const testMap = new Map([
      ['a', { id: 'a', speed: 0, altitude: 0 }],
      ['b', { id: 'b', speed: null, altitude: null }],
      ['c', { id: 'c', speed: 100, altitude: 5000 }]
    ]);

    // 1. Min speed = 0 should include speed = 0 but not null (wait, if speed is null it skips the filter, but speed 0 is >= 0)
    // Actually our logic says: `if (speed != null && speed < min) continue;` 
    // So 'a' (0 < 10?) yes -> filtered. 'b' (null!=null?) no -> not filtered. 'c' (100 < 10) no -> not filtered.
    const f1 = { speedMin: 10 };
    const r1 = applyFilters(testMap, f1, new Set());
    expect(r1.has('a')).toBe(false); // 0 < 10 -> excluded
    expect(r1.has('b')).toBe(true);  // null -> included (bypasses filter)
    expect(r1.has('c')).toBe(true);  // 100 >= 10 -> included
  });
});
