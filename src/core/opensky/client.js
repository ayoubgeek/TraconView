/**
 * @file client.js
 * @description API Client for OpenSky Network.
 */

import { OPENSKY_STATES_URL, OPENSKY_TOKEN_URL } from './constants';
import { parseStateVectors } from './parser';

/**
 * Parses numeric header safely
 * @param {Headers} headers 
 * @param {string} name 
 * @param {number} fallback 
 * @returns {number}
 */
function parseHeaderNum(headers, name, fallback = -1) {
  const val = headers.get(name) || headers.get(name.toLowerCase());
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Fetches state vectors for a given bounding box.
 * @param {import('./types').BoundingBox} bbox 
 * @param {string|null} accessToken 
 * @returns {Promise<import('./types').FetchResult>}
 */
export async function fetchStateVectors(bbox, accessToken = null) {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(OPENSKY_STATES_URL, baseUrl);
    url.searchParams.append('lamin', String(bbox.south));
    url.searchParams.append('lomin', String(bbox.west));
    url.searchParams.append('lamax', String(bbox.north));
    url.searchParams.append('lomax', String(bbox.east));

    const headers = new Headers();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const res = await fetch(url.toString(), { headers });
    
    const creditsRemaining = parseHeaderNum(res.headers, 'X-Rate-Limit-Remaining', -1);

    if (!res.ok) {
      if (res.status === 429) {
        const retry = parseHeaderNum(res.headers, 'X-Rate-Limit-Retry-After-Seconds', 60);
        return { ok: false, error: 'RATE_LIMITED', retryAfterSeconds: retry, creditsRemaining };
      }
      if (res.status === 401) {
        return { ok: false, error: 'TOKEN_EXPIRED', creditsRemaining };
      }
      return { ok: false, error: 'API_ERROR', status: res.status, creditsRemaining };
    }

    const data = await res.json();
    const aircraft = parseStateVectors(data.states);
    
    return {
      ok: true,
      aircraft,
      timestamp: Date.now(),
      creditsRemaining
    };
  } catch (err) {
    return { ok: false, error: 'NETWORK_ERROR', message: err.message, creditsRemaining: -1 };
  }
}

/**
 * Fetches an OAuth2 access token.
 * @param {string} clientId 
 * @param {string} clientSecret 
 * @returns {Promise<import('./types').TokenResult>}
 */
export async function fetchToken(clientId, clientSecret) {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const res = await fetch(OPENSKY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 400) {
        return { ok: false, error: 'INVALID_CREDENTIALS' };
      }
      throw new Error(`Token fetch failed with status ${res.status}`);
    }

    const data = await res.json();
    return {
      ok: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in
    };
  } catch {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }
}
