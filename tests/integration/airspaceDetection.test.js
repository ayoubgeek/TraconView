import { describe, it, expect, beforeEach } from 'vitest';
import { useFlightStore } from '../../src/store/flightStore';
import { detectZoneIncursions, computeOccupancy } from '../../src/lib/airspaceDetector';
import { prepareAirspaces } from '../../src/lib/pointInPolygon';

describe('airspaceDetection pipeline integration', () => {
  beforeEach(() => {
    useFlightStore.setState({ alerts: [], airspaceZones: [], aircraftArray: [] });
  });

  const mockZones = [
    {
      type: 'Feature',
      id: 'zone1',
      properties: { name: 'Restricted 1', type: 'RESTRICTED' },
      geometry: { type: 'Polygon', coordinates: [[[0,0], [10,0], [10,10], [0,10], [0,0]]] }
    }
  ];

  it('runs full point-in-polygon and incursion alert flow', () => {
    useFlightStore.getState().setAirspaceZones(mockZones);
    const zones = useFlightStore.getState().airspaceZones;
    const preparedZones = prepareAirspaces({ type: 'FeatureCollection', features: zones });
    
    // Simulate tick 1: Aircraft enters zone
    const aircraft = [{ id: 'A1', callsign: 'FLT1', lng: 5, lat: 5, altitude: 1000 }];
    const previousIncursions = new Map();
    
    // Detect incursions
    const { newIncursions, currentIncursions } = detectZoneIncursions(aircraft, preparedZones, previousIncursions);
    
    expect(newIncursions).toHaveLength(1);
    expect(currentIncursions.get('A1').has('zone1')).toBe(true);

    // Generate alerts
    newIncursions.forEach(inc => {
      useFlightStore.getState().addOrUpdateAlert({
        id: `inc-${inc.icao24}`,
        icao24: inc.icao24,
        reasons: [{ type: 'RESTRICTED_AIRSPACE', label: 'Entered zone', severity: 'CRITICAL' }]
      });
    });

    expect(useFlightStore.getState().alerts).toHaveLength(1);

    // Compute occupancy
    const occupancyMap = computeOccupancy(aircraft, preparedZones);
    useFlightStore.getState().updateAirspaceOccupancy(occupancyMap);

    // Zone config updated
    const updatedZones = useFlightStore.getState().airspaceZones;
    expect(updatedZones[0].occupancyCount).toBe(1);

    // Simulate tick 2: Aircraft stays in zone
    const { newIncursions: newIncursions2, currentIncursions: currentIncursions2 } = detectZoneIncursions(aircraft, preparedZones, currentIncursions);
    expect(newIncursions2).toHaveLength(0); // No duplicate
    expect(currentIncursions2.get('A1').has('zone1')).toBe(true);
  });
});
