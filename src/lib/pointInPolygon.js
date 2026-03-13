export function computeBBox(ring) {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  
  return { minLng, minLat, maxLng, maxLat };
}

export function pointInRing(lng, lat, ring) {
  let isInside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
}

export function pointInPolygon(lng, lat, geometry, bbox) {
  if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) return false;
  if (geometry.type !== 'Polygon') return false; 
  
  if (bbox) {
    if (lng < bbox.minLng || lng > bbox.maxLng || lat < bbox.minLat || lat > bbox.maxLat) {
      return false;
    }
  }

  const rings = geometry.coordinates;
  // Point must be inside the outer ring (index 0)
  if (!pointInRing(lng, lat, rings[0])) {
    return false;
  }
  
  // Point must NOT be inside any holes (index 1 to N)
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lng, lat, rings[i])) {
      return false;
    }
  }
  
  return true;
}

export function prepareAirspaces(geojsonData) {
  if (!geojsonData || !geojsonData.features) return [];
  return geojsonData.features.map(feature => {
    let bbox = null;
    if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates.length > 0) {
      bbox = computeBBox(feature.geometry.coordinates[0]);
    }
    return { feature, bbox };
  });
}

export function classifyAircraftByAirspace(aircraftArray, preparedAirspaces) {
  const incursions = new Map();
  
  for (const ac of aircraftArray) {
    if (ac.lat === undefined || ac.lng === undefined || ac.lat === null || ac.lng === null) continue;
    
    const insideFeatures = [];
    for (const { feature, bbox } of preparedAirspaces) {
      if (feature.geometry && feature.geometry.type === 'Polygon') {
        if (pointInPolygon(ac.lng, ac.lat, feature.geometry, bbox)) {
          insideFeatures.push(feature);
        }
      } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        let inMulti = false;
        for (const polygonCoords of feature.geometry.coordinates) {
           const subPoly = { type: 'Polygon', coordinates: polygonCoords };
           const subBBox = computeBBox(polygonCoords[0]);
           if (pointInPolygon(ac.lng, ac.lat, subPoly, subBBox)) {
             inMulti = true;
             break;
           }
        }
        if (inMulti) {
          insideFeatures.push(feature);
        }
      }
    }
    
    if (insideFeatures.length > 0) {
      incursions.set(ac.id, insideFeatures);
    }
  }
  
  return incursions;
}
