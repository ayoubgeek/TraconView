import { describe, it, expect } from 'vitest';
import { sortAircraft, filterByBounds } from '../../src/lib/tableUtils';

describe('AircraftTable Utilities', () => {

    describe('sortAircraft', () => {
        const aircraftList = [
            { id: '1', callsign: 'UAL123', altitude: 35000, speed: 450, riskScore: 10 },
            { id: '2', callsign: 'AAL456', altitude: 20000, speed: 300, riskScore: 50 },
            { id: '3', callsign: 'DAL789', altitude: 10000, speed: 250, riskScore: 0 }
        ];

        it('sorts correctly by string column (callsign) ascending', () => {
            const result = sortAircraft(aircraftList, 'callsign', 'asc');
            expect(result[0].id).toBe('2'); // AAL
            expect(result[1].id).toBe('3'); // DAL
            expect(result[2].id).toBe('1'); // UAL
        });

        it('sorts correctly by string column (callsign) descending', () => {
            const result = sortAircraft(aircraftList, 'callsign', 'desc');
            expect(result[0].id).toBe('1'); // UAL
            expect(result[1].id).toBe('3'); // DAL
            expect(result[2].id).toBe('2'); // AAL
        });

        it('sorts correctly by numeric column (altitude) descending', () => {
            const result = sortAircraft(aircraftList, 'altitude', 'desc');
            expect(result[0].id).toBe('1'); // 35000
            expect(result[1].id).toBe('2'); // 20000
            expect(result[2].id).toBe('3'); // 10000
        });

        it('sorts correctly by numeric column (riskScore) ascending', () => {
            const result = sortAircraft(aircraftList, 'riskScore', 'asc');
            expect(result[0].id).toBe('3'); // 0
            expect(result[1].id).toBe('1'); // 10
            expect(result[2].id).toBe('2'); // 50
        });

        it('handles null or missing values by putting them at the end', () => {
            const listWithNull = [
                { id: '1', altitude: 35000 },
                { id: '2', altitude: null },
                { id: '3', altitude: 10000 }
            ];
            const resultAsc = sortAircraft(listWithNull, 'altitude', 'asc');
            expect(resultAsc[0].id).toBe('3');
            expect(resultAsc[1].id).toBe('1');
            expect(resultAsc[2].id).toBe('2'); // null at end
        });
    });

    describe('filterByBounds', () => {
        const aircraftList = [
            { id: '1', lat: 40, lng: -70 }, // Inside
            { id: '2', lat: 45, lng: -75 }, // Outside
            { id: '3', lat: 39, lng: -69 }  // Inside
        ];

        // Mock Leaflet Bounds object
        const mockBounds = {
            contains: (latLng) => {
                const [lat, lng] = latLng;
                return lat >= 35 && lat <= 42 && lng >= -72 && lng <= -65;
            }
        };

        it('excludes aircraft outside the given Leaflet bounds', () => {
            const result = filterByBounds(aircraftList, mockBounds);
            expect(result.length).toBe(2);
            expect(result.map(ac => ac.id)).toEqual(['1', '3']);
        });

        it('returns all if bounds is null', () => {
            const result = filterByBounds(aircraftList, null);
            expect(result.length).toBe(3);
        });
    });

});
