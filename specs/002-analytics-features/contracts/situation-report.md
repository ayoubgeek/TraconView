# Contract: Situation Report Generator

**Module**: `src/lib/situationReport.js`
**Type**: Pure function library (no React, no side effects, no network I/O)

## Public API

### `generateSituationReport(aircraft, riskResult, nearestAirport, metar?)`

Generates a structured ATC-style situation report from available data.

**Input**:
```
aircraft: {
  id: string                // ICAO24
  callsign: string
  country: string
  lat: number
  lng: number
  altitude: number          // Feet
  speed: number             // Knots
  heading: number           // Degrees
  verticalRate: number      // ft/min
  onGround: boolean
  squawk: string | null
  isHolding: boolean
}

riskResult: {
  score: number
  threshold: string
  rules: Array<{ id: string, label: string, weight: number }>
}

nearestAirport: {
  icao: string
  name: string
  distance: number          // Nautical miles
  bearing: number           // Degrees
} | null

metar?: {                   // Optional — may not be available
  fltCat: string
  rawOb: string
  wdir: number | string
  wspd: number
  wgst: number | null
  visib: string | number
  clouds: Array<{ cover: string, base: number }>
  altim: number
} | null
```

**Output**:
```
{
  sections: {
    identity: {
      callsign: string
      icao24: string
      country: string
    }
    status: string              // "IN FLIGHT" | "ON GROUND" | "HOLDING PATTERN"
    position: {
      coordinates: string       // "51.4706°N, 0.4613°W"
      altitude: string          // "FL350" or "3,200 ft"
      speed: string             // "432 kts GS"
      heading: string           // "180° (S)"
      verticalRate: string      // "↓ 2,100 ft/min" or "Level"
    }
    nearestAirport: {
      icao: string
      name: string
      distance: string          // "23 nm"
      bearing: string           // "045° (NE)"
    } | null
    riskAssessment: {
      score: string             // "72/100"
      threshold: string         // "WARNING"
      breakdown: string[]       // ["Emergency Squawk 7700 (+50)", "SPI Active (+10)", ...]
    }
    weather: {
      category: string          // "VFR" | "IFR" | etc.
      wind: string              // "270° at 15 kts, gusting 25 kts"
      visibility: string        // "10+ SM"
      ceiling: string           // "OVC at 2,500 ft"
      rawMetar: string
    } | null                    // null if METAR unavailable
  }
  formatted: string             // Full pre-formatted text report
  generatedAt: string           // ISO 8601
}
```

**Formatted output example**:
```
═══════════════════════════════════════
  SITUATION REPORT — RAM1204
  Generated: 2026-03-13 14:32:07 UTC
═══════════════════════════════════════

▶ IDENTITY
  Callsign:  RAM1204
  ICAO24:    c060b2
  Registry:  Morocco

▶ STATUS: IN FLIGHT

▶ POSITION
  Coordinates: 33.5731°N, 7.5898°W
  Altitude:    FL350
  Speed:       432 kts GS
  Heading:     180° (S)
  Vert. Rate:  Level

▶ NEAREST AIRPORT
  GMMN — Mohammed V International
  Distance: 23 nm | Bearing: 045° (NE)

▶ RISK ASSESSMENT [72/100 — WARNING]
  • Emergency Squawk 7700 (+50)
  • SPI Active (+10)
  • Data Gap >30s (+5)

▶ WEATHER AT GMMN [VFR]
  Wind:       270° at 15 kts
  Visibility: 10+ SM
  Ceiling:    SCT at 3,500 ft
  Raw METAR:  GMMN 131430Z 27015KT ...

═══════════════════════════════════════
```

### `formatAltitude(feet)`

Formats altitude as FL or feet.

**Input**: `feet: number`
**Output**: `string` — "FL350" for ≥18000ft (transition altitude), "3,200 ft" below

### `formatHeadingWithCardinal(degrees)`

Formats heading with cardinal direction.

**Input**: `degrees: number`
**Output**: `string` — "180° (S)", "045° (NE)", etc.

### `findNearestAirport(lat, lng, airports)`

Finds the closest airport using Haversine distance.

**Input**: `lat: number`, `lng: number`, `airports: AirportInfo[]`
**Output**: `{ icao, name, distance, bearing } | null`

## Test Contract

Tests MUST cover:
- Full report with all fields populated
- Report with null METAR → weather section is null, formatted shows "Weather data unavailable"
- Report with null nearest airport → airport section is null
- `formatAltitude`: 35000 → "FL350", 3200 → "3,200 ft", 0 → "0 ft"
- `formatHeadingWithCardinal`: 0 → "360° (N)", 90 → "090° (E)", 225 → "225° (SW)"
- `findNearestAirport` with known positions → correct airport and distance
- Aircraft on ground → status "ON GROUND"
- Aircraft holding → status "HOLDING PATTERN"
- Risk score 0 with empty rules → clean risk section
