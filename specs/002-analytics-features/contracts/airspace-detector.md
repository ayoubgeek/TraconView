# Contract: Airspace Detector

**Module**: `src/lib/airspaceDetector.js` + `src/lib/pointInPolygon.js`
**Type**: Pure function library (no React, no side effects)

## Public API

### `pointInPolygon.js`

#### `computeBBox(ring)`

Pre-computes bounding box for a GeoJSON polygon ring.

**Input**: `ring: number[][]` — Array of [lng, lat] coordinate pairs
**Output**: `{ minLng, minLat, maxLng, maxLat }`

#### `pointInRing(lng, lat, ring)`

Ray-casting point-in-polygon test.

**Input**: `lng: number`, `lat: number`, `ring: number[][]`
**Output**: `boolean`

#### `pointInPolygon(lng, lat, geometry, bbox?)`

Full point-in-polygon test with optional bbox pre-filtering. Handles polygon holes.

**Input**: `lng: number`, `lat: number`, `geometry: GeoJSON.Polygon`, `bbox?: BBox`
**Output**: `boolean`

#### `prepareAirspaces(geojsonData)`

Prepares airspace features for efficient batch testing. Pre-computes bounding boxes.

**Input**: `geojsonData: GeoJSON.FeatureCollection`
**Output**: `Array<{ feature: GeoJSON.Feature, bbox: BBox }>`

#### `classifyAircraftByAirspace(aircraft, preparedAirspaces)`

Batch test: for each aircraft, find which airspaces it is inside.

**Input**: `aircraft: Array<{ id, lng, lat }>`, `preparedAirspaces: PreparedAirspace[]`
**Output**: `Map<string, GeoJSON.Feature[]>` — aircraft ID → containing airspace features

### `airspaceDetector.js`

#### `detectZoneIncursions(aircraftArray, restrictedZones, previousIncursions)`

Detects new restricted zone entries and generates alerts.

**Input**:
```
aircraftArray: Aircraft[]                    // Current aircraft state
restrictedZones: PreparedAirspace[]          // Only restricted/danger/prohibited zones
previousIncursions: Map<string, Set<string>> // Aircraft ID → set of zone IDs already alerted
```

**Output**:
```
{
  newIncursions: Array<{
    icao24: string
    callsign: string
    zoneName: string
    zoneType: string
    timestamp: string           // ISO 8601
    lat: number
    lng: number
    altitude: number
  }>
  currentIncursions: Map<string, Set<string>>  // Updated map for next cycle
}
```

**Invariants**:
- Only generates alerts for NEW incursions (aircraft not previously flagged for that zone)
- Tracks per-aircraft per-zone state to avoid duplicate alerts
- Aircraft leaving a zone are removed from currentIncursions

#### `computeOccupancy(aircraftArray, preparedAirspaces)`

Counts aircraft inside each airspace zone.

**Input**: `aircraftArray: Aircraft[]`, `preparedAirspaces: PreparedAirspace[]`
**Output**: `Map<string, number>` — zone feature ID → aircraft count

## Test Contract

Tests MUST cover:
- Point clearly inside a simple polygon → true
- Point clearly outside → false
- Point outside bbox → false (fast rejection)
- Polygon with hole: point in hole → false
- Aircraft entering restricted zone → new incursion generated
- Aircraft already in zone → no duplicate alert
- Aircraft leaving zone → removed from currentIncursions
- Occupancy count matches actual aircraft inside
- Empty aircraft array → empty results
- Empty airspace array → empty results
