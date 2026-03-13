# Contract: METAR Client

**Module**: `src/lib/metarClient.js`
**Type**: Async function library (network I/O via fetch)
**Proxy**: `api/metar-proxy.js` (Vercel serverless function)

## Public API

### `fetchMetarData(stations)`

Fetches METAR data for a list of ICAO station IDs via the Vercel proxy.

**Input**:
```
stations: string[]          // Array of ICAO codes, e.g., ["GMMN", "GMME", "GMMX"]
```

**Output**:
```
Array<{
  icao: string              // ICAO station ID
  name: string              // Station name
  lat: number
  lng: number
  obsTime: number           // Unix timestamp (seconds)
  rawOb: string             // Raw METAR text
  fltCat: string            // "VFR" | "MVFR" | "IFR" | "LIFR"
  temp: number              // Celsius
  dewp: number              // Celsius
  wdir: number | string     // Degrees or "VRB"
  wspd: number              // Knots
  wgst: number | null       // Knots (gust)
  visib: string | number    // Statute miles
  altim: number             // Millibars
  clouds: Array<{ cover: string, base: number }>
  cover: string             // Highest cover
}>
```

**Error handling**:
- Network failure: returns empty array, logs warning to console
- Partial response (some stations missing): returns available stations only
- Rate limit (429): returns empty array, logs warning

**Constraints**:
- Maximum 50 stations per request (API limit ~400 entries)
- Caller should batch all region airports into a single request

### `getFlightCategoryColor(fltCat)`

Maps flight category to the display color.

**Input**: `fltCat: string`
**Output**: `string` (hex color)

| Flight Category | Color | Hex |
|----------------|-------|-----|
| VFR | Green | `#22c55e` |
| MVFR | Blue | `#3b82f6` |
| IFR | Red | `#ef4444` |
| LIFR | Magenta | `#d946ef` |

### `isMetarStale(obsTime)`

Checks if a METAR observation is stale.

**Input**: `obsTime: number` (Unix timestamp seconds)
**Output**: `{ stale: boolean, age: number }` — stale if >30 minutes; age in minutes

## Proxy Contract (`api/metar-proxy.js`)

**Route**: `GET /api/metar-proxy?ids=KJFK,KLAX&format=json`
**Upstream**: `https://aviationweather.gov/api/data/metar?ids=...&format=json`
**Headers**: `Cache-Control: public, max-age=300`, `Access-Control-Allow-Origin: *`
**Error**: Returns `{ error: string }` with appropriate HTTP status

## Test Contract

Tests MUST cover:
- Successful fetch with mocked response (verify field mapping)
- Empty stations array returns empty array
- Network error returns empty array (no throw)
- `getFlightCategoryColor` for all 4 categories
- `isMetarStale` at 29 min (not stale), 31 min (stale), 61 min (stale)
