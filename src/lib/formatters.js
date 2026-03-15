// src/lib/formatters.js

export function metersToFeet(meters) {
  if (meters === null || meters === undefined) return null;
  return meters * 3.28084;
}

export function msToKnots(ms) {
  if (ms === null || ms === undefined) return null;
  return ms * 1.94384;
}

export function msToFtPerMin(ms) {
  if (ms === null || ms === undefined) return null;
  return ms * 196.85;
}

export function formatAltitude(altitudeFt) {
  if (altitudeFt === null || altitudeFt === undefined) return 'N/A';
  if (altitudeFt >= 18000) {
    return `FL${Math.round(altitudeFt / 100)}`;
  }
  return `${Math.round(altitudeFt).toLocaleString()} ft`;
}

export function formatSpeed(speedKts) {
  if (speedKts === null || speedKts === undefined) return 'N/A';
  return `${Math.round(speedKts)} kts`;
}

export function formatHeading(headingDeg) {
  if (headingDeg === null || headingDeg === undefined) return 'N/A';
  return `${Math.round(headingDeg).toString().padStart(3, '0')}°`;
}

export function formatHeadingWithCardinal(heading) {
  if (heading === null || heading === undefined) return 'N/A';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  const index = Math.round((heading % 360) / 45);
  const cardinal = dirs[index] || 'N';
  const padHeading = Math.round(heading).toString().padStart(3, '0');
  return `${padHeading}° (${cardinal})`;
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3440.065; // Radius of earth in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const l1 = toRad(lat1);
  const l2 = toRad(lat2);

  const y = Math.sin(dLon) * Math.cos(l2);
  const x = Math.cos(l1) * Math.sin(l2) - Math.sin(l1) * Math.cos(l2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function findNearestAirport(lat, lng, airports) {
  if (!airports || airports.length === 0) return null;
  
  let nearest = null;
  let minDistance = Infinity;
  
  for (const apt of airports) {
    const dist = haversineDistance(lat, lng, apt.lat, apt.lng);
    if (dist < minDistance) {
      minDistance = dist;
      const bearing = calculateBearing(lat, lng, apt.lat, apt.lng);
      nearest = { ...apt, distance: dist, bearing };
    }
  }
  return nearest;
}
