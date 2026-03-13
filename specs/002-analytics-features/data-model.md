# Data Model: TraconView Uniqueness Features & Analytics

**Branch**: `002-analytics-features` | **Date**: 2026-03-13

## Entities

### Aircraft (modified — extends existing)

The core entity. Already exists in `flightStore.js` as a plain object. New fields added for risk scoring and position tracking.

```
Aircraft {
  // Existing fields (from OpenSky transform)
  id: string                    // ICAO24 hex identifier (primary key)
  callsign: string              // Flight callsign or fallback to id
  country: string               // Country of registration
  lastSeen: number              // Unix timestamp (seconds)
  lat: number | null            // WGS84 latitude
  lng: number | null            // WGS84 longitude
  altitude: number              // Feet (converted from meters)
  onGround: boolean
  speed: number                 // Knots (converted from m/s)
  heading: number               // Degrees true (0-360)
  verticalRate: number          // Feet/min (converted from m/s)
  squawk: string | null         // 4-digit transponder code
  spi: boolean                  // Special Position Identification
  source: string                // ADSB | ASTERIX | MLAT | FLARM | UNKNOWN

  // New fields (computed per refresh cycle)
  riskScore: number             // 0-100, additive from matched rules
  riskThreshold: string         // NORMAL | WATCH | CAUTION | WARNING | CRITICAL
  activeRules: string[]         // Array of matched rule IDs
  isHolding: boolean            // True if holding pattern detected
  nearestAirport: string | null // ICAO code of nearest airport in region
}
```

**Identity/uniqueness**: `id` (ICAO24 hex) is globally unique per aircraft transponder.

**Lifecycle**: Aircraft appear when OpenSky reports them, update every 15s poll, and are evicted after 2 missed polls (~30s) per stale aircraft cleanup.

---

### PositionHistory (new)

Per-aircraft ring buffer of recent positions for holding pattern detection and trail rendering.

```
PositionHistory {
  // Keyed by aircraft id (ICAO24)
  // Stored as Map<string, PositionEntry[]> in Zustand store

  PositionEntry {
    lat: number
    lng: number
    heading: number             // Degrees true
    altitude: number            // Feet
    timestamp: number           // Unix timestamp (seconds)
  }
}
```

**Constraints**:
- Maximum 10 entries per aircraft (ring buffer — oldest evicted when full)
- Entire history evicted when aircraft not seen for 2 polling cycles (~30s)
- Cleared on region change

---

### RiskResult (new — computed, not stored)

Output of the risk scoring engine. Computed per aircraft per refresh cycle.

```
RiskResult {
  score: number                 // 0-100 (capped)
  threshold: string             // NORMAL | WATCH | CAUTION | WARNING | CRITICAL
  rules: MatchedRule[]          // All rules that fired
  isNewCritical: boolean        // True if score just crossed 76 from below
}

MatchedRule {
  id: string                    // Rule identifier (e.g., "SQUAWK_7700")
  label: string                 // Human-readable (e.g., "Emergency Squawk 7700")
  weight: number                // Points contributed (e.g., 50)
}
```

**Thresholds**:
| Threshold | Score Range | Visual |
|-----------|------------|--------|
| NORMAL    | 0-10       | 3px dim teal dot |
| WATCH     | 11-25      | 4px yellow border |
| CAUTION   | 26-50      | 6px yellow |
| WARNING   | 51-75      | 8px orange, slow pulse |
| CRITICAL  | 76-100     | 10px red, fast pulse, glow |

---

### Alert (modified — extends existing anomaly records)

Replaces the current anomaly record model. Now supports multiple reasons per aircraft, resolved state, and persistence.

```
Alert {
  id: string                    // Unique: `${icao24}-${timestamp}`
  icao24: string                // Aircraft ICAO24
  callsign: string              // Flight callsign
  riskScore: number             // Score at time of alert
  reasons: AlertReason[]        // All active alert reasons (badges)
  lat: number
  lng: number
  altitude: number              // Feet
  speed: number                 // Knots
  squawk: string | null
  region: string                // Region key
  detectedAt: string            // ISO 8601 timestamp
  resolvedAt: string | null     // ISO 8601 timestamp when resolved, or null if active
  isResolved: boolean           // True when triggering conditions clear
}

AlertReason {
  type: string                  // SQUAWK_7700 | RAPID_DESCENT | RESTRICTED_ZONE | HOLDING | etc.
  label: string                 // Human-readable description
  severity: string              // CRITICAL | HIGH | MEDIUM | LOW
}
```

**Lifecycle**:
1. Created when aircraft score exceeds threshold or enters restricted zone
2. Updated with new reasons when additional triggers fire (consolidated per aircraft)
3. Marked as `isResolved: true` + `resolvedAt` timestamp when all triggering conditions clear
4. Resolved alerts remain visible (dimmed/strikethrough) in the feed
5. Evicted from feed after 50 entries (existing MAX_ANOMALY_HISTORY cap)

---

### AirspaceZone (new — loaded from GeoJSON)

Represents a prepared airspace polygon for point-in-polygon testing.

```
AirspaceZone {
  id: string                    // Feature ID from GeoJSON
  name: string                  // Zone name (e.g., "GM-P01", "CASABLANCA FIR")
  type: string                  // CTR | TMA | RESTRICTED | DANGER | PROHIBITED | FIR | ATZ
  lowerLimit: string            // "SFC" | "FL050" | "2500ft AGL"
  upperLimit: string            // "FL195" | "UNL" | "FL999"
  geometry: GeoJSON.Polygon     // Raw polygon geometry for rendering
  bbox: {                       // Pre-computed bounding box for fast rejection
    minLng: number
    minLat: number
    maxLng: number
    maxLat: number
  }
  occupancyCount: number        // Live count of aircraft inside (computed)
}
```

**Source**: OpenAIP (CTR/restricted) + FlightMapEuropeSimple (FIR/UIR). Properties normalized at load time.

---

### MetarObservation (new — fetched from aviationweather.gov)

Decoded METAR data for an airport.

```
MetarObservation {
  icao: string                  // ICAO station ID (e.g., "GMMN")
  name: string                  // Station name (e.g., "Mohammed V Intl")
  lat: number
  lng: number
  obsTime: number               // Unix timestamp (seconds)
  rawOb: string                 // Raw METAR text
  fltCat: string                // VFR | MVFR | IFR | LIFR
  temp: number                  // Celsius
  dewp: number                  // Celsius
  wdir: number | string         // Degrees or "VRB"
  wspd: number                  // Knots
  wgst: number | null           // Knots (gust)
  visib: string | number        // Statute miles (e.g., "10+", 5)
  altim: number                 // Millibars (QNH)
  clouds: CloudLayer[]          // Cloud layers
  cover: string                 // Highest cover: CLR | FEW | SCT | BKN | OVC
}

CloudLayer {
  cover: string                 // FEW | SCT | BKN | OVC
  base: number                  // Feet AGL
}
```

**Refresh**: Every 5 minutes via Vercel proxy. Cached in Zustand store keyed by ICAO.

**Staleness**: If `obsTime` is >30 minutes old, display dimmed dot. If >60 minutes, show warning in popup.

---

### AirportInfo (new — static bundled data)

Static airport metadata used for METAR queries and nearest-airport calculations.

```
AirportInfo {
  icao: string                  // ICAO code (e.g., "GMMN")
  name: string                  // Airport name
  lat: number                   // WGS84 latitude
  lng: number                   // WGS84 longitude
}
```

**Source**: Static JSON files in `src/data/airports/` (~50 per region). Loaded per selected region.

---

### SituationReport (new — computed, not stored)

Template-based ATC briefing generated client-side.

```
SituationReport {
  aircraft: {
    callsign: string
    icao24: string
    country: string
    type: string                // Aircraft type (if available from callsign lookup)
  }
  status: string                // "IN FLIGHT" | "ON GROUND" | "HOLDING"
  position: {
    lat: number
    lng: number
    altitude: string            // Formatted (e.g., "FL350" or "3,200 ft")
    speed: string               // Formatted (e.g., "432 kts")
    heading: string             // Formatted (e.g., "180° (S)")
    verticalRate: string        // Formatted (e.g., "+1,200 ft/min")
  }
  nearestAirport: {
    icao: string
    name: string
    distance: string            // Formatted (e.g., "23 nm")
    bearing: string             // Formatted (e.g., "045° (NE)")
  } | null
  risk: {
    score: number
    threshold: string
    rules: { label: string, weight: number }[]
  }
  weather: {
    fltCat: string
    wind: string                // Formatted (e.g., "270° at 15 kts, gusting 25 kts")
    visibility: string
    ceiling: string
    rawMetar: string
  } | null                      // null if METAR unavailable
  generatedAt: string           // ISO 8601 timestamp
}
```

---

## Zustand Store Extensions

The existing `flightStore.js` store shape will be extended with these new slices:

```
// New state fields
positionHistory: Map<string, PositionEntry[]>  // Aircraft ID → last 10 positions
metarData: Map<string, MetarObservation>       // ICAO code → latest METAR
alerts: Alert[]                                 // Replaces existing anomalies[]
airspaceZones: AirspaceZone[]                  // Prepared zones with bboxes
riskScores: Map<string, RiskResult>            // Aircraft ID → latest risk result

// New actions
updatePositionHistory(aircraftArray): void     // Append positions, evict stale
setMetarData(metars: MetarObservation[]): void
addOrUpdateAlert(alert: Alert): void
resolveAlert(icao24: string): void
setAirspaceZones(zones: AirspaceZone[]): void
updateAirspaceOccupancy(map: Map<string, string[]>): void
```

**Migration note**: The existing `anomalies[]` array and `addAnomaly()` action will be replaced by `alerts[]` and `addOrUpdateAlert()`. The existing `MAX_ANOMALY_HISTORY = 50` cap is preserved.

## Relationships

```
Aircraft --1:N--> PositionHistory entries (ring buffer, max 10)
Aircraft --1:1--> RiskResult (computed per cycle)
Aircraft --1:0..1--> Alert (consolidated entry in feed)
Aircraft --N:M--> AirspaceZone (aircraft can be in multiple zones)
AirportInfo --1:0..1--> MetarObservation (may have no METAR data)
Alert --1:N--> AlertReason (multiple badges per alert)
SituationReport references: Aircraft + RiskResult + AirportInfo + MetarObservation
```
