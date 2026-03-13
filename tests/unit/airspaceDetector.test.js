import { describe, it, expect } from 'vitest';
import { detectZoneIncursions, computeOccupancy } from '../../src/lib/airspaceDetector';

describe('airspaceDetector', () => {
  const mockPreparedZones = [
    {
      feature: {
        id: 'zone1',
        properties: { name: 'Restricted 1', type: 'RESTRICTED' },
        geometry: { type: 'Polygon', coordinates: [[[0,0], [10,0], [10,10], [0,10], [0,0]]] }
      },
      bbox: { minLng: 0, minLat: 0, maxLng: 10, maxLat: 10 }
    },
    {
      feature: {
        id: 'zone2',
        properties: { name: 'Danger 2', type: 'DANGER' },
        geometry: { type: 'Polygon', coordinates: [[[20,20], [30,20], [30,30], [20,30], [20,20]]] }
      },
      bbox: { minLng: 20, minLat: 20, maxLng: 30, maxLat: 30 }
    }
  ];

  describe('detectZoneIncursions', () => {
    it('generates new incursion for aircraft entering restricted zone', () => {
      const aircraft = [{ id: 'A1', callsign: 'FLT1', lng: 5, lat: 5, altitude: 1000 }];
      const previous = new Map();

      const { newIncursions, currentIncursions } = detectZoneIncursions(aircraft, mockPreparedZones, previous);
      
      expect(newIncursions).toHaveLength(1);
      expect(newIncursions[0].icao24).toBe('A1');
      expect(newIncursions[0].zoneName).toBe('Restricted 1');
      expect(currentIncursions.get('A1').has('zone1')).toBe(true);
    });

    it('does not generate duplicate alert for aircraft already in zone', () => {
      const aircraft = [{ id: 'A1', callsign: 'FLT1', lng: 5, lat: 5, altitude: 1000 }];
      const previous = new Map([['A1', new Set(['zone1'])]]);

      const { newIncursions, currentIncursions } = detectZoneIncursions(aircraft, mockPreparedZones, previous);
      
      expect(newIncursions).toHaveLength(0);
      expect(currentIncursions.get('A1').has('zone1')).toBe(true);
    });

    it('removes aircraft leaving zone from currentIncursions', () => {
      const aircraft = [{ id: 'A1', callsign: 'FLT1', lng: 15, lat: 15, altitude: 1000 }];
      const previous = new Map([['A1', new Set(['zone1', 'zone2'])], ['A2', new Set(['zone1'])]]);

      const { newIncursions, currentIncursions } = detectZoneIncursions(aircraft, mockPreparedZones, previous);
      
      expect(newIncursions).toHaveLength(0);
      expect(currentIncursions.has('A1')).toBe(false); 
    });

    it('returns empty results for empty arrays', () => {
      expect(detectZoneIncursions([], mockPreparedZones, new Map()).newIncursions).toHaveLength(0);
      expect(detectZoneIncursions([{ id: 'A1', lng: 5, lat: 5 }], [], new Map()).newIncursions).toHaveLength(0);
    });
  });

  describe('computeOccupancy', () => {
    it('counts aircraft inside each airspace zone', () => {
      const aircraft = [
        { id: 'A1', lng: 5, lat: 5 }, // zone1
        { id: 'A2', lng: 6, lat: 6 }, // zone1
        { id: 'A3', lng: 25, lat: 25 }, // zone2
        { id: 'A4', lng: 50, lat: 50 } // outside
      ];

      const occupancy = computeOccupancy(aircraft, mockPreparedZones);
      expect(occupancy.get('zone1')).toBe(2);
      expect(occupancy.get('zone2')).toBe(1);
    });

    it('returns empty map for empty aircraft', () => {
      const occupancy = computeOccupancy([], mockPreparedZones);
      expect(occupancy.size).toBe(0);
    });
  });
});
