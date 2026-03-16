/**
 * @file enrichmentService.js
 * @description Provides non-blocking data enrichment for selected aircraft.
 */

/**
 * Fetches an aircraft photo from the Planespotters.net API.
 * @param {string} icao24 - The 6-character ICAO24 hex code.
 * @returns {Promise<Object|null>} The photo photo object or null if not found.
 */
export async function fetchAircraftPhoto(icao24) {
  if (!icao24) return null;
  try {
    const response = await fetch(`https://api.planespotters.net/pub/photos/hex/${icao24}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Planespotters API error: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.photos && data.photos.length > 0) {
      const photo = data.photos[0];
      return {
        thumbnail: photo.thumbnail_large?.src || photo.thumbnail?.src,
        photographer: photo.photographer,
        link: photo.link
      };
    }
    return null;
  } catch (error) {
    console.warn(`Failed to fetch photo for ${icao24}:`, error);
    return null;
  }
}

/**
 * Fetches route information from the OpenSky Network API.
 * @param {string} callsign - The flight callsign.
 * @returns {Promise<Object|null>} The route origin/destination or null if not found.
 */
export async function fetchRouteInfo(callsign) {
  if (!callsign) return null;
  
  // Callsigns from OpenSky are often padded with spaces
  const cleanCallsign = callsign.trim();
  if (!cleanCallsign) return null;

  try {
    const response = await fetch(`/api/opensky/routes?callsign=${cleanCallsign}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`OpenSky Routes API error: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.route && data.route.length >= 2) {
      // route usually looks like: ["EDDF", "EGLL"]
      return {
        origin: data.route[0],
        destination: data.route[data.route.length - 1]
      };
    }
    // Alternatively the response format might be different, handle standard OpenSky route format:
    // Some routes endpoints return object: { callsign: "...", route: ["...", "..."] }
    // Or it might be the deprecated /api/routes?callsign=
    return null;
  } catch (error) {
    console.warn(`Failed to fetch route for ${cleanCallsign}:`, error);
    return null;
  }
}
