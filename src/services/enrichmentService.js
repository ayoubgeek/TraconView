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

// OpenSky routes API is deprecated (returns 404). Route info is not available.
