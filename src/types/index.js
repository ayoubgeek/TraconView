/**
 * Core type definitions for the TraconView application.
 * Used for JSDoc type checking and auto-completion.
 */

/**
 * @typedef {Object} Aircraft
 * @property {string} id Unique identifier string (ICAO24)
 * @property {string} [callsign] Flight number / callsign
 * @property {number} lat Latitude
 * @property {number} lng Longitude
 * @property {number} [altitude] Altitude in feet
 * @property {number} [velocity] Speed in knots
 * @property {number} [speed] Alias for velocity
 * @property {number} [heading] Heading in degrees
 * @property {number} [verticalRate] Vertical rate in m/s
 * @property {boolean} [onGround] True if on the ground
 * @property {string} [squawk] 4-digit squawk code
 * @property {boolean} [spi] Special Position Identification flag
 * @property {string} [country] Origin country
 * @property {string} [originCountry] Alias for origin country
 * @property {string} [category] Aircraft category string
 * @property {number} lastSeen Unix timestamp (seconds) of last position update
 * @property {boolean} [isHolding] True if currently in holding pattern
 * @property {number} [baroAltitude] Barometric altitude
 * @property {string} [aircraftType]
 * @property {string} [operator]
 * @property {string} [registration]
 * @property {string} [icao24]
 */

/**
 * @typedef {Object} RiskFactor
 * @property {string} id
 * @property {string} label
 * @property {string} [description]
 * @property {number} weight
 * @property {string} [timestamp]
 * @property {string} [details]
 */

/**
 * @typedef {Object} AnomalyExplanation
 * @property {RiskFactor[]} factors Array of active risk factors
 * @property {string|null} firstDetectedAt ISO8601 timestamp
 * @property {string|null} resolvedAt ISO8601 timestamp when resolved
 * @property {string|null} resolutionReason Why it was resolved
 */

/**
 * @typedef {Object} RiskScoreResult
 * @property {number} score 0-100 risk score
 * @property {string} threshold e.g., 'NORMAL', 'WATCH', 'CAUTION', 'WARNING', 'CRITICAL'
 * @property {RiskFactor[]} rules Rules that triggered
 * @property {boolean} isNewCritical Did it just become critical?
 * @property {AnomalyExplanation} explanation Extended explanation details
 */

/**
 * @typedef {Object} RadarSnapshot
 * @property {string} id Unique snapshot ID
 * @property {string} snapshot_time ISO8601 time
 * @property {number} total_aircraft Count
 * @property {number} in_flight Count
 * @property {number} active_anomalies Count
 * @property {number} coverage_percent Percentage
 * @property {SnapshotStatistics} [statistics] Detailed distributions
 * @property {TrendDeltas} [trends] Changes since last snapshot
 */

/**
 * @typedef {Object} SnapshotStatistics
 * @property {Object.<string, number>} altitudeBands Key is band name, val is count
 * @property {Object.<string, number>} countryBreakdown Key is country, val is count
 */

/**
 * @typedef {Object} TrendDeltas
 * @property {number} totalDelta
 * @property {number} inFlightDelta
 * @property {number} anomalyDelta
 * @property {number} coverageDelta
 */

/**
 * @typedef {Object} SavedView
 * @property {string} id View ID
 * @property {string} name View Name
 * @property {boolean} [isReadOnly] If built-in preset
 * @property {Object} state
 * @property {FilterConfiguration} [state.filters]
 * @property {Object} [state.region]
 * @property {string[]} [state.airspaceToggles]
 */

/**
 * @typedef {Object} FilterConfiguration
 * @property {string[]} [categories] Array of categories
 * @property {string[]} [squawkCodes] Array of exact squawk codes
 * @property {Object} [altitudeBand] e.g. {min: 0, max: 5000}
 */

/**
 * @typedef {Object} SearchResult
 * @property {Aircraft} aircraft
 * @property {string} matchedField 
 * @property {string} matchedValue
 * @property {number} relevanceScore
 */

export {};
