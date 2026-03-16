/**
 * @file constants.js
 * @description Constants for OpenSky client and interval timings.
 */

export const REFRESH_INTERVAL_AUTHENTICATED_MS = 15_000;
export const REFRESH_INTERVAL_ANONYMOUS_MS = 30_000;
export const TOKEN_REFRESH_THRESHOLD = 0.8;
export const CREDIT_WARNING_THRESHOLD = 0.25;
export const CREDIT_SLOW_THRESHOLD = 0.10;
export const CREDIT_PAUSE_THRESHOLD = 0.05;
export const STALE_TIMEOUT_MS = 30_000;
export const AIRCRAFT_FADE_MS = 2_000;
export const IDLE_PAUSE_MS = 300_000; // 5 min
export const VIEWPORT_DEBOUNCE_MS = 500;

export const OPENSKY_STATES_URL = '/api/opensky/states/all';
export const OPENSKY_TOKEN_URL = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
