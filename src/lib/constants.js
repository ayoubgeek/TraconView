// src/lib/constants.js

export const REGIONS = {
  EUROPE: {
    key: 'EUROPE',
    label: 'Europe',
    bounds: { south: 35.0, north: 72.0, west: -15.0, east: 40.0 },
    center: [51.5, 10.0],
    zoom: 5
  },
  MOROCCO: {
    key: 'MOROCCO',
    label: 'Morocco / MENA',
    bounds: { south: 20.0, north: 37.0, west: -18.0, east: 5.0 },
    center: [31.79, -7.09],
    zoom: 6
  },
  NORTH_AMERICA: {
    key: 'NORTH_AMERICA',
    label: 'North America',
    bounds: { south: 24.0, north: 71.0, west: -125.0, east: -66.0 },
    center: [40.0, -95.0],
    zoom: 4
  },
  GERMANY: {
    key: 'GERMANY',
    label: 'Germany',
    bounds: { south: 47.0, north: 55.0, west: 5.0, east: 15.0 },
    center: [51.16, 10.45],
    zoom: 7
  },
  GLOBAL: {
    key: 'GLOBAL',
    label: 'Global',
    bounds: { south: -90.0, north: 90.0, west: -180.0, east: 180.0 },
    center: [20.0, 0.0],
    zoom: 3
  }
};

export const DEFAULT_REGION = REGIONS.EUROPE;

export const POLL_INTERVAL_MS = 15000;
export const DEGRADED_POLL_INTERVAL_MS = 60000;
export const MAX_ANOMALY_HISTORY = 50;
export const STALE_AIRCRAFT_MS = 60000;

export const ANOMALY_SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

export const BUILT_IN_PRESETS = [
  {
    id: 'preset-military-watch',
    name: 'Military Watch',
    isReadOnly: true,
    state: {
      filters: { category: ['military'] }
    }
  },
  {
    id: 'preset-emergency-only',
    name: 'Emergency Only',
    isReadOnly: true,
    state: {
      filters: { squawkCodes: ['7700', '7600', '7500'] }
    }
  },
  {
    id: 'preset-low-altitude',
    name: 'Low-Altitude Activity',
    isReadOnly: true,
    state: {
      filters: { altitudeBand: { min: 0, max: 5000 } }
    }
  }
];

export const ANOMALY_TYPES = {
  SQUAWK_7700: 'SQUAWK_7700',
  SQUAWK_7500: 'SQUAWK_7500',
  SQUAWK_7600: 'SQUAWK_7600',
  RAPID_DESCENT: 'RAPID_DESCENT',
  UNUSUAL_SPEED: 'UNUSUAL_SPEED',
  SPI_ACTIVE: 'SPI_ACTIVE'
};

export const SOURCE_MAP = {
  0: 'ADSB',
  1: 'ASTERIX',
  2: 'MLAT',
  3: 'FLARM'
};

export const RISK_THRESHOLDS = {
  NORMAL: 'NORMAL',
  WATCH: 'WATCH',
  CAUTION: 'CAUTION',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL'
};

export const METAR_CONFIG = {
  POLL_INTERVAL_MS: 300000, // 5 minutes
  STALE_MS: 1800000, // 30 minutes
  WARNING_MS: 3600000 // 60 minutes
};

export const AIRCRAFT_CATEGORY_COLORS = {
  commercial: '#3b82f6',
  military: '#d97706',
  'emergency/anomaly': '#ef4444',
  cargo: '#6366f1',
  business_jet: '#8b5cf6',
  helicopter: '#10b981',
  general_aviation: '#14b8a6',
  unknown: '#6b7280'
};

export const SNAPSHOT_POLL_INTERVAL_MS = 60000;
export const SNAPSHOT_RETENTION_HOURS = 24;
export const CLUSTER_DISABLE_AT_ZOOM = 9;
export const CLUSTER_LARGE_RADIUS_MAX_ZOOM = 6;
export const HEADING_QUANTIZE_STEP = 5;
export const STALE_AIRCRAFT_TTL_MS = 60000;
export const CALLSIGN_LABEL_MIN_ZOOM = 9;
export const FILTER_DEBOUNCE_MS = 150;

export const UI_INTERVALS = {
  LIVE_CLOCK_MS: 1000,
  STATS_CLOCK_MS: 1000,
  EXPLANATION_TICK_MS: 60000,
  COPIED_TIMEOUT_MS: 2000
};

export const RISK_SCORE_BOUNDS = {
  CRITICAL: 76,
  WARNING: 51,
  CAUTION: 26,
  WATCH: 11
};
