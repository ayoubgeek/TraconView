/**
 * @file types.js
 * @description JSDoc definitions for TraconView Data Models.
 */

/**
 * @typedef {Object} Aircraft
 * @property {string} icao24 - ICAO 24-bit transponder address (unique key, hex)
 * @property {string|null} callsign - Flight callsign, null if not broadcasting
 * @property {number|null} lat - Decimal degrees, null if position unknown
 * @property {number|null} lng - Decimal degrees, null if position unknown
 * @property {number|null} heading - True track heading, 0–360 degrees, null if unknown
 * @property {number|null} altitudeFt - Barometric altitude in feet (null = unknown)
 * @property {number|null} speedKnots - Ground speed in knots (null = unknown)
 * @property {number|null} vertRateFpm - Vertical rate in ft/min, + = climbing, - = descending
 * @property {boolean} onGround - true when aircraft is taxiing or parked
 * @property {string|null} squawk - 4-digit Mode A code, null if not squawking
 * @property {'ADS-B' | 'MLAT' | 'FLARM' | 'Other'} positionSource
 * @property {string} originCountry - Country of registration
 * @property {number} lastContact - Unix timestamp (seconds) of last position update
 * @property {number|null} prevLat - Previous known latitude (before last refresh)
 * @property {number|null} prevLng - Previous known longitude (before last refresh)
 * @property {number} refreshedAt - Performance.now() timestamp of last data update
 * @property {{origin: string, destination: string}} [route] - route data
 */

/**
 * @typedef {Object} BoundingBox
 * @property {number} south - lamin — minimum latitude
 * @property {number} west - lomin — minimum longitude
 * @property {number} north - lamax — maximum latitude
 * @property {number} east - lomax — maximum longitude
 */

/**
 * @typedef {Object} FetchResultSuccess
 * @property {true} ok
 * @property {Aircraft[]} aircraft
 * @property {number} timestamp
 * @property {number} creditsRemaining
 *
 * @typedef {Object} FetchResultRateLimited
 * @property {false} ok
 * @property {'RATE_LIMITED'} error
 * @property {number} retryAfterSeconds
 * @property {number} creditsRemaining
 *
 * @typedef {Object} FetchResultTokenExpired
 * @property {false} ok
 * @property {'TOKEN_EXPIRED'} error
 * @property {number} creditsRemaining
 *
 * @typedef {Object} FetchResultApiError
 * @property {false} ok
 * @property {'API_ERROR'} error
 * @property {number} status
 * @property {number} creditsRemaining
 *
 * @typedef {Object} FetchResultNetworkError
 * @property {false} ok
 * @property {'NETWORK_ERROR'} error
 * @property {string} message
 * @property {-1} creditsRemaining
 *
 * @typedef {FetchResultSuccess | FetchResultRateLimited | FetchResultTokenExpired | FetchResultApiError | FetchResultNetworkError} FetchResult
 */

/**
 * @typedef {Object} TokenResultSuccess
 * @property {true} ok
 * @property {string} accessToken
 * @property {number} expiresIn
 *
 * @typedef {Object} TokenResultError
 * @property {false} ok
 * @property {'INVALID_CREDENTIALS'} error
 *
 * @typedef {TokenResultSuccess | TokenResultError} TokenResult
 */

/**
 * @typedef {Object} ConnectionStatus
 * @property {'live' | 'stale' | 'offline' | 'rate-limited'} mode
 * @property {'authenticated' | 'anonymous'} authMode
 * @property {number} creditsRemaining - -1 = unknown
 * @property {number|null} lastRefreshAt - Unix timestamp (ms) of last successful fetch
 * @property {number|null} retryAfterMs - Set when rate-limited; ms until retry is allowed
 */

export {};
