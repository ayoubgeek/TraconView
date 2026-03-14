import { describe, it, expect } from 'vitest';
import { search } from '../../src/lib/searchEngine';

describe('searchEngine', () => {
    it('returns empty array if query < 2 chars', () => {
        const aircraftMap = new Map();
        aircraftMap.set('1', { id: '1', callsign: 'RAM123', icao24: 'aaaaaa' });
        expect(search('R', aircraftMap)).toEqual([]);
        expect(search('', aircraftMap)).toEqual([]);
    });

    it('enforces result limit of 10', () => {
        const aircraftMap = new Map();
        for (let i = 0; i < 15; i++) {
            aircraftMap.set(`id${i}`, { id: `id${i}`, callsign: `RAM${i}`, icao24: `aaaa${i}` });
        }
        const results = search('RAM', aircraftMap);
        expect(results.length).toBe(10);
    });

    it('ranks exact callsign match above partial ICAO24 and limits results', () => {
        const aircraftMap = new Map();
        aircraftMap.set('1', { id: '1', callsign: 'OTHER', icao24: 'RAM123' }); // Partial Match (weight 3)
        aircraftMap.set('2', { id: '2', callsign: 'RAM123', icao24: 'bbbbbb' }); // Exact Match (weight 4)
        aircraftMap.set('3', { id: '3', callsign: 'RAM1234', icao24: 'cccccc' }); // Partial Match (weight 4 for partial)

        const results = search('RAM123', aircraftMap);
        
        expect(results.length).toBe(3);
        // Result 1 should be the exact callsign
        expect(results[0].aircraft.id).toBe('2');
        expect(results[0].matchedField).toBe('callsign');
        expect(results[0].relevanceScore).toBeGreaterThan(results[1].relevanceScore);
    });

    it('returns empty results if aircraft map is empty', () => {
        expect(search('RAM', new Map())).toEqual([]);
    });
});
