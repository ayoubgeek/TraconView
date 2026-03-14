import { describe, it, expect } from 'vitest';
import { formatAircraftCsv } from '../../src/lib/exportUtils';

describe('exportUtils', () => {
    it('returns a valid CSV string with correct headers and data row', () => {
        const mockAircraft = {
            callsign: 'UAL123',
            id: 'A1B2C3',
            lat: 34.0522,
            lng: -118.2437,
            altitude: 35000,
            velocity: 450,
            heading: 270,
            squawk: '1234',
            lastSeen: 1678791600
        };

        const csv = formatAircraftCsv(mockAircraft, 15); // mock risk score 15
        
        const rows = csv.split('\n');
        expect(rows.length).toBeGreaterThanOrEqual(2);
        
        // Assert headers
        expect(rows[0]).toBe('Callsign,ICAO24,Latitude,Longitude,Altitude,Speed,Heading,Squawk,RiskScore,Timestamp');
        
        // Assert data
        expect(rows[1]).toBe('UAL123,A1B2C3,34.0522,-118.2437,35000,450,270,1234,15,1678791600');
    });

    it('handles null or missing values gracefully', () => {
        const mockAircraft = { id: 'A1B2C3', lastSeen: 1678791600 };
        const csv = formatAircraftCsv(mockAircraft, 0);
        const rows = csv.split('\n');
        expect(rows[1]).toBe(',A1B2C3,,,,,,,0,1678791600'); // squawk is 8th item, empty if null
    });
});
