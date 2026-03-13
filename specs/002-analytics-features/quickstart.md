# Quickstart: TraconView Uniqueness Features & Analytics

**Branch**: `002-analytics-features` | **Date**: 2026-03-13

## Prerequisites

- Node.js 18+
- npm 9+
- Vercel CLI (`npm i -g vercel`) — for testing METAR proxy locally

## Setup

```bash
# Clone and checkout feature branch
git checkout 002-analytics-features
npm install

# Start dev server
npm run dev
```

## Architecture Overview

All new features follow the same pattern:

```
src/lib/<feature>.js       → Pure functions (testable, no React)
src/hooks/use<Feature>.js  → React hook (connects lib to store)
src/components/<Feature>.jsx → UI component (renders from store)
tests/unit/<feature>.test.js → Unit tests (TDD — write first)
```

### Data Flow

```
OpenSky API (15s poll)
  → useOpenSky hook
    → flightStore.setAircraftData()
      → usePositionHistory hook (tracks last 10 positions)
      → Risk scoring (computeRiskScore per aircraft)
      → useAirspaceDetection hook (point-in-polygon tests)
      → useHoldingDetection hook (heading change analysis)
      → useAnomalyEngine hook (generates alerts)
      → Components re-render from store

aviationweather.gov (5min poll, via /api/metar-proxy)
  → useMetar hook
    → flightStore.setMetarData()
      → WeatherLayer renders airport dots
      → SituationReport includes weather
```

## Feature Implementation Order

Follow this order — each feature builds on the previous:

### Phase A: Core Engine (F1 — Risk Scoring)
1. `src/lib/riskScoring.js` — Additive scoring rules
2. `tests/unit/riskScoring.test.js` — TDD: write tests first
3. Refactor `src/hooks/useAnomalyEngine.js` to use new scoring
4. Update `src/store/flightStore.js` with riskScores state
5. Update `src/components/map/AircraftLayer.jsx` for visual dot differentiation

### Phase B: Analytics Dashboard (F2)
1. Expand `src/components/panels/StatsPanel.jsx`:
   - Add KPI cards row (total, in-flight, anomalies, coverage, last update)
   - Replace country bar chart with donut chart (Recharts PieChart)
   - Refine altitude histogram bands to match spec
   - Add anomaly timeline sparkline (Recharts AreaChart)
   - Add speed-vs-altitude scatter (Recharts ScatterChart)

### Phase C: Weather Integration (F4)
1. `api/metar-proxy.js` — Vercel serverless proxy
2. `src/data/airports/` — Static airport JSON files per region
3. `src/lib/metarClient.js` — Fetch + transform METAR data
4. `tests/unit/metarClient.test.js` — TDD
5. `src/hooks/useMetar.js` — 5-minute polling hook
6. `src/components/map/WeatherLayer.jsx` — Airport dots + popup

### Phase D: Airspace Intelligence (F3)
1. `src/lib/pointInPolygon.js` — Ray-casting algorithm
2. `tests/unit/pointInPolygon.test.js` — TDD
3. `src/lib/airspaceDetector.js` — Zone incursion + occupancy
4. `tests/unit/airspaceDetector.test.js` — TDD
5. `src/hooks/useAirspaceDetection.js` — Detection hook
6. Update `src/components/map/AirspaceLayer.jsx` — Occupancy badges, restricted styling
7. Update `src/components/panels/AlertSidebar.jsx` — Zone incursion alerts

### Phase E: Situation Reports (F5)
1. `src/lib/situationReport.js` — Template generator
2. `tests/unit/situationReport.test.js` — TDD
3. `src/components/panels/SituationReport.jsx` — Report panel UI

### Phase F: Holding Detection (F6)
1. `src/lib/holdingDetector.js` — Heading change analysis
2. `tests/unit/holdingDetector.test.js` — TDD
3. `src/hooks/usePositionHistory.js` — Position tracking hook
4. `src/hooks/useHoldingDetection.js` — Detection hook
5. `src/components/map/HoldingTrail.jsx` — Polyline trail

### Phase G: Morocco Features (F7)
1. `src/data/airports/morocco.json` — Morocco airport list with ICAO codes
2. `public/data/airspace/gmmm-fir.geojson` — Casablanca FIR boundary
3. `src/components/panels/MoroccoPanel.jsx` — Airport quick-access panel

### Phase H: Export & Screenshot (F8)
1. `src/components/ui/ScreenshotMode.jsx` — Screenshot overlay
2. `src/components/ui/ExportButton.jsx` — CSV export
3. Update `src/components/ui/Header.jsx` — New toolbar buttons

## Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npx vitest run tests/unit/riskScoring.test.js

# Run tests in watch mode
npx vitest watch

# Run with coverage
npx vitest run --coverage
```

## Testing the METAR Proxy Locally

```bash
# Start Vercel dev server (serves both app and API routes)
vercel dev

# Test proxy directly
curl "http://localhost:3000/api/metar-proxy?ids=GMMN,GMME,GMMX&format=json"
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/riskScoring.js` | Risk score computation (0-100) |
| `src/lib/pointInPolygon.js` | Ray-casting point-in-polygon |
| `src/lib/airspaceDetector.js` | Zone incursion detection |
| `src/lib/holdingDetector.js` | Holding pattern detection |
| `src/lib/metarClient.js` | METAR fetch + decode |
| `src/lib/situationReport.js` | ATC report template |
| `src/lib/airportData.js` | Static airport loader |
| `src/store/flightStore.js` | Zustand global state |
| `src/hooks/useAnomalyEngine.js` | Alert generation pipeline |
| `api/metar-proxy.js` | Vercel METAR proxy |

## External Data Dependencies

| Source | URL | Refresh | Auth |
|--------|-----|---------|------|
| OpenSky Network | `https://opensky-network.org/api/states/all` | 15s | None (CORS allowed) |
| aviationweather.gov | `https://aviationweather.gov/api/data/metar` | 5min | None (via proxy) |
| OpenAIP airspace | Pre-downloaded GeoJSON in `public/data/` | Static | CC BY-NC 4.0 |
| FlightMapEuropeSimple | Pre-downloaded FIR GeoJSON in `public/data/` | Static | MIT |

## Constitution Compliance Notes

- **Library-First**: All features start as pure functions in `src/lib/`
- **Test-First (TDD)**: Write tests BEFORE implementation. Red → Green → Refactor.
- **YAGNI**: No unnecessary abstractions. Flat loops > spatial indices at current scale.
- **Observability**: Console warnings for fetch failures. Supabase logging for anomalies.
