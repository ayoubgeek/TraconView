# Research: TraconView Uniqueness Features & Analytics

**Branch**: `002-analytics-features` | **Date**: 2026-03-13

## R1: METAR API Integration

### Decision: Vercel serverless proxy for aviationweather.gov API

### Rationale
The aviationweather.gov METAR API (`https://aviationweather.gov/api/data/metar`) does NOT send `Access-Control-Allow-Origin` headers — direct browser calls are blocked by CORS. A lightweight Vercel proxy function (`api/metar-proxy.js`) is required, following the same pattern as the existing `api/opensky-proxy.js`.

### Key Findings
- **Endpoint**: `https://aviationweather.gov/api/data/metar?ids=KJFK,KLAX,...&format=json`
- **Multiple stations**: Supported — comma-separated ICAO IDs (tested with 50 stations in single request)
- **Rate limit**: 100 requests/minute. One request with 50 stations every 5 minutes = 0.2 req/min — well within limits.
- **JSON response** provides pre-decoded fields including `fltCat` (VFR/MVFR/IFR/LIFR), `temp`, `dewp`, `wdir`, `wspd`, `wgst`, `visib`, `altim`, `clouds[]`, `rawOb`, `lat`, `lon`, `name`
- **No custom METAR decoder needed** — the API's `format=json` returns all fields already decoded
- **Cache-Control**: API returns `max-age=120`. Proxy should forward this or set `Cache-Control: public, max-age=300` for 5-minute caching.

### Alternatives Considered
- **Direct browser call**: Not possible (no CORS headers)
- **Supabase Edge Function proxy**: Previously caused 504 timeouts for OpenSky; Vercel proxy is proven to work for this project
- **Third-party METAR APIs (CheckWX, AVWX)**: Require API keys and have lower free-tier limits. aviationweather.gov is free, authoritative, and sufficient.

---

## R2: Point-in-Polygon Algorithm

### Decision: Hand-rolled ray-casting with bounding box pre-filtering (zero dependencies)

### Rationale
At the scale of 2,000 aircraft × 50 polygons = 100,000 tests per 15-second cycle, a simple ray-casting implementation with bbox pre-check completes in <15ms. No library needed — the computation is trivial for 4-5 vertex airspace polygons.

### Key Findings
- **Ray-casting on 4-5 vertex polygons**: ~1-2 microseconds per test in V8
- **Bounding box pre-filtering**: Rejects 95%+ of tests in O(1) for small restricted zones
- **Total estimated time**: <15ms for worst-case 100K tests (0.1% of 15s budget)
- **No Web Worker needed**: Computation too fast to justify serialization overhead
- **No spatial indexing (R-tree) needed**: Only 20-50 polygons; flat loop is optimal

### Implementation
Pure function `pointInPolygon(lng, lat, geometry, bbox)` in `src/lib/pointInPolygon.js`. Pre-compute bounding boxes once when GeoJSON loads via `prepareAirspaces(geojsonData)`. Batch test via `classifyAircraftByAirspace(aircraft, preparedAirspaces)`.

### Alternatives Considered
- **@turf/boolean-point-in-polygon**: Adds ~5-8 KB + 4 transitive deps for 20 lines of math. GeoJSON wrapping overhead on hot path. Unnecessary.
- **point-in-polygon (npm)**: Coordinate order mismatch (`[x,y]` vs `.lat/.lng`). Adds dependency for trivial function.
- **Leaflet plugins**: Requires constructing Leaflet layer objects for pure math operations. Couples rendering to computation.

---

## R3: Airspace GeoJSON Data Sources

### Decision: OpenAIP for CTR/restricted zones + FlightMapEuropeSimple for FIR/UIR boundaries

### Rationale
No single source covers all airspace types. OpenAIP has excellent CTR, ATZ, restricted/danger/prohibited zone data but lacks FIR/UIR boundaries for Morocco. FlightMapEuropeSimple provides world FIR/UIR polygons including GMMM Casablanca (sourced from EUROCONTROL Atlas).

### Key Findings

**OpenAIP** (`https://storage.googleapis.com/29f98e10-a489-4c82-ae5e-489dbcd4912f/{cc}_asp.geojson`):
- Morocco (`ma_asp.geojson`): 89 features, 514 KB — CTR (18), Restricted (6), Danger (26), Prohibited (14), ATZ (11), Other (14). No FIR/TMA.
- Germany (`de_asp.geojson`): 2.7 MB — dense airspace
- License: CC BY-NC 4.0
- Properties: `name`, `type` (numeric enum), `icaoClass`, `upperLimit`, `lowerLimit` (with unit/referenceDatum)
- Needs property normalization to match app schema (`type` is numeric, limits have nested structure)

**FlightMapEuropeSimple** (`flightmap_europe_fir_uir.json`):
- 427 KB, 110 world FIR/UIR features
- GMMM Casablanca FIR: 80 coordinate points, FL000-FL195
- Properties: `AV_NAME`, `AV_AIRSPAC`, `MIN_FLIGHT`, `MAX_FLIGHT`
- Needs property renaming to match app schema

**File size estimates after preprocessing** (strip unnecessary properties, normalize types):
- Morocco CTR/restricted: ~50-80 KB
- Morocco FIR: ~10 KB (extracted from world file)
- Germany: ~500 KB-1 MB (stripped)
- World FIR/UIR: ~200 KB (stripped)

### Bundling Strategy
Continue existing pattern: place GeoJSON in `public/data/` and fetch at runtime via `useAirspaceData.js`. Files stay out of JS bundle, get lazy-loaded per region, and benefit from HTTP caching. Create a build-time preprocessing script to download, strip, normalize, and merge data from both sources.

### Alternatives Considered
- **EUROCONTROL Atlas raw shapefiles**: Requires ogr2ogr conversion; FlightMapEuropeSimple already provides converted GeoJSON
- **ICAO GIS Server**: No direct GeoJSON download; requires manual extraction
- **FAA Open Data**: US-only; not useful for Morocco/Europe focus

---

## R4: Holding Pattern Detection Algorithm

### Decision: Cumulative heading change analysis over last 10 position samples

### Rationale
The simplest reliable heuristic for detecting circular flight patterns. No external dependencies or complex math required. Track cumulative absolute heading change; if it exceeds 300° over 10 samples (~2.5 minutes at 15s polling), the aircraft is likely holding.

### Key Findings
- **10 positions × 15s polling = 2.5 minutes** of track history
- **300° threshold** catches standard holding patterns (typically 360° racetrack) with margin for entry procedures
- **Heading change calculation**: Must handle 360°→0° wraparound (`deltaH = ((h2 - h1 + 540) % 360) - 180`, then sum absolute values)
- **Exit detection**: 5 consecutive polls with <30° total heading change = holding pattern cleared
- **Memory**: 10 positions × ~80 bytes × 2000 aircraft = ~1.6 MB max. Evict after 2 missed polls (~30s).
- **False positive mitigation**: Only flag aircraft above 1000ft (exclude ground movements and VFR circuits)

### Implementation
Pure function `detectHolding(positions)` in `src/lib/holdingDetector.js`. Position history tracked in `src/hooks/usePositionHistory.js` as a `Map<icao24, Array<{lat, lng, heading, timestamp}>>`.

---

## R5: Risk Scoring Model Design

### Decision: Additive weighted rules replacing existing first-match-wins binary detection

### Rationale
The current `anomalyRules.js` uses first-match-wins (a squawk-7700 aircraft with rapid descent only reports the squawk). The spec requires additive scoring where all matching rules contribute to a composite score (squawk-7700 + rapid descent = 75 points). This requires restructuring the rule engine.

### Key Findings
- **Existing rules** map cleanly to the new weighted model:
  - Squawk 7700/7500: +50 (was CRITICAL)
  - Squawk 7600: +35 (was HIGH)
  - Rapid descent >2000 fpm above FL100: +25 (was MEDIUM, threshold raised from 5000ft)
  - Rapid descent >1500 fpm above FL050: +15 (new rule)
  - Speed <150 kts above FL250: +10 (was LOW)
  - SPI active: +10 (was LOW)
  - Data gap >30s: +5 (new rule)
  - Altitude <1000ft not on ground: +5 (new rule)
- **Score capped at 100**
- **Thresholds**: Normal (0-10), Watch (11-25), Caution (26-50), Warning (51-75), Critical (76-100)
- **Sound trigger**: Single tone when score first crosses 76 (Critical threshold)
- **Backward compatibility**: The new `computeRiskScore(aircraft)` returns `{ score, rules[] }` — the rules array provides the anomaly type info the existing UI expects

### Implementation
New `src/lib/riskScoring.js` with `computeRiskScore(aircraft, prevScore?) → { score, threshold, rules[], isNewCritical }`. The existing `anomalyRules.js` will be deprecated and replaced. `useAnomalyEngine.js` will be refactored to use the new scoring model.

---

## R6: Airport Static Data

### Decision: Bundled JSON files with ~50 airports per region (ICAO, coordinates, name)

### Rationale
The spec requires a static bundled airport list for METAR queries (FR-019a). No dynamic discovery needed. The data is small (~5 KB per region) and can be imported directly into the JS bundle.

### Key Findings
- **Morocco airports** (from spec FR-027): GMMN (Mohammed V), GMME (Rabat-Salé), GMFF (Fès-Saïss), GMMX (Marrakech Menara), GMTT (Tangier), GMAD (Agadir Al Massira), plus ~15 smaller airports
- **Europe**: ~50 major airports (EGLL, LFPG, EDDF, EHAM, LEMD, LIRF, etc.)
- **Germany**: ~30 airports (EDDF, EDDM, EDDB, EDDL, EDDK, EDDS, etc.)
- **North America**: ~50 major airports (KJFK, KLAX, KORD, KATL, KDFW, etc.)
- **Format**: `{ icao: string, name: string, lat: number, lng: number }`
- **Size**: ~2-5 KB per region as JSON

### Implementation
Static files in `src/data/airports/` (europe.json, morocco.json, germany.json, north-america.json). Imported directly via ES module import (small enough for JS bundle). Each file exports an array of `{ icao, name, lat, lng }` objects.

---

## R7: Situation Report Template Design

### Decision: Client-side string template with field substitution (no AI dependency)

### Rationale
The spec (FR-023) explicitly requires client-side template generation with no external AI dependency. A simple template function receives aircraft data, risk score breakdown, nearest airport, and METAR data, and produces a formatted ATC-style briefing.

### Key Findings
- **Template structure**: Identity → Status → Position → Nearest Airport → Risk Assessment → Weather (if available)
- **Nearest airport calculation**: Haversine distance to all airports in current region, pick closest. Pre-computed distances when aircraft data updates.
- **ATC briefing style**: Use aviation terminology (FL for flight levels, kts for speed, UTC for time, standard phraseology)
- **Missing data handling**: Each section has a fallback string (e.g., "Weather data unavailable")

### Implementation
Pure function `generateSituationReport(aircraft, riskResult, nearestAirport, metar?) → string` in `src/lib/situationReport.js`. Returns a formatted multi-line string. React component `SituationReport.jsx` renders it in a monospace panel.
