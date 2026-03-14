/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { getQuantizedHeading, getCategorizedIcon } from '../../src/lib/iconUtils';

// Provide basic mock for leaflet since it needs window at import time
vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn((opts) => ({ _type: 'DivIcon', ...opts })),
    DomEvent: { stopPropagation: vi.fn() }
  }
}));

describe('AircraftMarker Utils', () => {
  describe('getQuantizedHeading', () => {
    it('quantizes to nearest 5 degrees', () => {
      expect(getQuantizedHeading(37)).toBe(35);
      expect(getQuantizedHeading(38)).toBe(40);
      expect(getQuantizedHeading(0)).toBe(0);
      expect(getQuantizedHeading(359)).toBe(360); // or 0 depending on implementation
      expect(getQuantizedHeading(null)).toBe(0);
    });
  });

  describe('getCategorizedIcon', () => {
    it('returns a cached icon reference for the same quantized heading, category, and selection state', () => {
      const icon1 = getCategorizedIcon('commercial', 37, false);
      const icon2 = getCategorizedIcon('commercial', 36, false); // Both quantize to 35
      
      expect(icon1).toBeDefined();
      expect(icon1).toBe(icon2); // caching should result in exact same object reference

      const iconSelected = getCategorizedIcon('commercial', 37, true);
      expect(icon1).not.toBe(iconSelected);
      
      const iconMilitary = getCategorizedIcon('military', 37, false);
      expect(icon1).not.toBe(iconMilitary);
    });
  });
});
