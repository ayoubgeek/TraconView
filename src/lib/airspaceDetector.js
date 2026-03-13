import { classifyAircraftByAirspace } from './pointInPolygon';

export function detectZoneIncursions(aircraftArray, restrictedZones, previousIncursions) {
  if (!aircraftArray || aircraftArray.length === 0 || !restrictedZones || restrictedZones.length === 0) {
    return { newIncursions: [], currentIncursions: new Map() }; 
  }

  const incursionsMap = classifyAircraftByAirspace(aircraftArray, restrictedZones);
  const newIncursions = [];
  const currentIncursions = new Map();

  for (const [acId, features] of incursionsMap.entries()) {
    const aircraft = aircraftArray.find(a => a.id === acId);
    if (!aircraft) continue;

    const previousSet = previousIncursions.get(acId) || new Set();
    const currentSet = new Set();

    for (const feature of features) {
      if (!feature.id) continue;
      currentSet.add(feature.id);
      
      if (!previousSet.has(feature.id)) {
        // New incursion!
        newIncursions.push({
          icao24: aircraft.id,
          callsign: aircraft.callsign || aircraft.id,
          zoneName: feature.properties?.name || feature.id,
          zoneType: feature.properties?.type || 'UNKNOWN',
          timestamp: new Date().toISOString(),
          lat: aircraft.lat,
          lng: aircraft.lng,
          altitude: aircraft.altitude || 0
        });
      }
    }

    if (currentSet.size > 0) {
      currentIncursions.set(acId, currentSet);
    }
  }

  return { newIncursions, currentIncursions };
}

export function computeOccupancy(aircraftArray, preparedAirspaces) {
  const occupancyMap = new Map();
  if (!aircraftArray || !preparedAirspaces) return occupancyMap;

  const incursionsMap = classifyAircraftByAirspace(aircraftArray, preparedAirspaces);

  for (const [acId, features] of incursionsMap.entries()) {
    for (const feature of features) {
      if (feature.id) {
        occupancyMap.set(feature.id, (occupancyMap.get(feature.id) || 0) + 1);
      }
    }
  }

  return occupancyMap;
}
