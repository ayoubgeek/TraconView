# Implementation Plan: TraconView Uniqueness Features & Analytics

**Branch**: `002-analytics-features` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-analytics-features/spec.md`

## Summary

Transform TraconView from a basic flight tracker into a professional anomaly-focused airspace monitoring tool by adding: (1) additive risk scoring system (0-100) with visual dot differentiation, (2) live analytics dashboard with altitude histogram, country donut, KPI cards, anomaly timeline, and scatter plot, (3) airspace intelligence with restricted zone detection via point-in-polygon testing, (4) airport weather overlay using aviationweather.gov METAR data, (5) template-based ATC-style situation reports, (6) holding pattern detection via cumulative heading change analysis, (7) Morocco/GMMM FIR focus features, and (8) screenshot mode with CSV anomaly export.

The existing anomaly engine (first-match-wins binary detection) will be replaced with an additive scoring model that evaluates all rules per aircraft and sums weights. All new features are client-side with one new backend dependency: a Vercel proxy for aviationweather.gov METAR API (which does NOT support CORS — proxy required).

## Technical Context

**Language/Version**: JavaScript (ES2022+), JSX — React 19.2 on Vite 7.3
**Primary Dependencies**: React 19, Zustand 5, Recharts 3.8, Leaflet 1.9 / react-leaflet 5, Lucide icons, @supabase/supabase-js 2.99, Tailwind CSS 4
**Storage**: Supabase PostgreSQL (anomaly_log table for persistent logging); browser memory for all real-time state
**Testing**: Vitest 4.0 (unit + integration tests in `/tests/`)
**Target Platform**: Modern browsers (Chrome/Firefox/Safari/Edge); deployed on Vercel (SPA + serverless)
**Project Type**: Single-page web application (React SPA)
**Performance Goals**: Smooth map rendering with 2000+ aircraft; chart updates within 2 seconds; situation report generation <500ms; no visible flicker on 15-second poll cycles
**Constraints**: All computation client-side; no paid external APIs; METAR refresh every 5-10 minutes to respect rate limits; position history capped at 10 entries per aircraft; anomaly history eviction after 2 missed polls
**Scale/Scope**: ~2000 concurrent aircraft per region; ~50 airports per region for METAR; 8 feature modules (F1-F8) across ~15 new/modified files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Library-First** | PASS | Each feature module (risk scoring, METAR client, airspace detector, holding detector, situation report generator, airport data) will be implemented as standalone libraries in `src/lib/` with pure functions and no React dependencies. UI components consume these libraries. |
| **II. CLI / API Interface** | PASS (with justification) | This is a browser SPA — no CLI needed. Each library exposes a clear function-based API (e.g., `computeRiskScore(aircraft) → number`, `decodeMETAR(raw) → object`, `detectHolding(positions) → boolean`). All libraries accept plain objects and return plain objects (JSON-serializable). |
| **III. Test-First (NON-NEGOTIABLE)** | PASS | TDD will be followed: write Vitest tests first for each library function (risk scoring rules, METAR decoder, point-in-polygon, holding detector, situation report template), get user approval, verify red, then implement to green. |
| **IV. Integration Testing** | PASS | Integration tests for: anomaly pipeline with new scoring model, METAR fetch + decode chain, airspace detection + alert generation pipeline, holding detection with simulated position history. |
| **V. Observability & Versioning** | PASS | Existing Supabase anomaly logging will be extended with risk_score field. Console logging for METAR fetch failures and airspace detection events. YAGNI followed — no new infrastructure. |

**Gate result: PASS — no violations. Proceeding to Phase 0.**

### Post-Phase 1 Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Library-First** | PASS | 7 new libraries defined in contracts: riskScoring, metarClient, airspaceDetector, pointInPolygon, holdingDetector, situationReport, airportData. All are pure functions with no React deps. |
| **II. CLI / API Interface** | PASS | Each library has a documented public API (see contracts/). All accept and return plain JSON-serializable objects. Vercel proxy (metar-proxy.js) follows REST convention. |
| **III. Test-First** | PASS | Every contract includes a "Test Contract" section specifying what tests MUST cover. Test files mapped 1:1 with library modules. |
| **IV. Integration Testing** | PASS | Integration tests planned for: anomaly pipeline (scoring→alerts), METAR pipeline (fetch→decode→display), airspace detection (polygon→incursion→alert). |
| **V. Observability & Versioning** | PASS | Supabase anomaly_log extended with risk_score. Console warnings for METAR/airspace failures. No new infrastructure. YAGNI maintained. |

**Post-Phase 1 gate result: PASS — design is constitution-compliant. No complexity violations.**

## Project Structure

### Documentation (this feature)

```text
specs/002-analytics-features/
├── plan.md              # This file
├── research.md          # Phase 0: research findings
├── data-model.md        # Phase 1: entity models
├── quickstart.md        # Phase 1: dev quickstart guide
├── contracts/           # Phase 1: component contracts
│   ├── risk-scoring.md
│   ├── metar-client.md
│   ├── airspace-detector.md
│   ├── holding-detector.md
│   └── situation-report.md
└── tasks.md             # Phase 2: task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── anomalyRules.js          # MODIFY: replace first-match-wins with additive scoring
│   ├── riskScoring.js            # NEW: additive risk score computation (0-100)
│   ├── metarClient.js            # NEW: METAR fetch + decode logic
│   ├── metarDecoder.js           # NEW: raw METAR string parser
│   ├── airspaceDetector.js       # NEW: point-in-polygon + zone incursion detection
│   ├── holdingDetector.js        # NEW: cumulative heading change analysis
│   ├── situationReport.js        # NEW: template-based ATC report generator
│   ├── airportData.js            # NEW: static bundled airport list per region
│   ├── pointInPolygon.js         # NEW: ray-casting point-in-polygon test
│   ├── constants.js              # MODIFY: add risk thresholds, METAR config
│   ├── formatters.js             # MODIFY: add METAR formatting helpers
│   └── supabase.js               # EXISTING: no changes needed
├── hooks/
│   ├── useOpenSky.js             # EXISTING: no changes needed
│   ├── useAnomalyEngine.js       # MODIFY: use riskScoring instead of first-match
│   ├── useMetar.js               # NEW: METAR polling hook
│   ├── useAirspaceDetection.js   # NEW: zone incursion detection hook
│   ├── useHoldingDetection.js    # NEW: holding pattern tracking hook
│   └── usePositionHistory.js     # NEW: track last 10 positions per aircraft
├── store/
│   └── flightStore.js            # MODIFY: add positionHistory, riskScores, metarData, alerts state
├── components/
│   ├── map/
│   │   ├── TraconMap.jsx          # EXISTING: minor changes for new layers
│   │   ├── AircraftLayer.jsx      # MODIFY: use risk score for dot size/color/animation
│   │   ├── AirspaceLayer.jsx      # MODIFY: add occupancy badges, restricted zone styling
│   │   ├── WeatherLayer.jsx       # NEW: airport METAR dots + popup
│   │   ├── HoldingTrail.jsx       # NEW: polyline trail for holding aircraft
│   │   └── AnomalyMarker.jsx      # EXISTING: minor styling updates
│   ├── panels/
│   │   ├── StatsPanel.jsx         # MODIFY: expand with KPIs, donut, timeline, scatter
│   │   ├── AlertSidebar.jsx       # MODIFY: consolidated entries, resolved state, badges
│   │   ├── SituationReport.jsx    # NEW: ATC-style report panel
│   │   ├── MoroccoPanel.jsx       # NEW: Morocco airport quick-access panel
│   │   ├── AircraftDetail.jsx     # EXISTING: minor changes
│   │   └── RegionSelector.jsx     # EXISTING: no changes
│   └── ui/
│       ├── ScreenshotMode.jsx     # NEW: screenshot overlay with watermark
│       ├── ExportButton.jsx       # NEW: CSV export trigger
│       └── Header.jsx             # MODIFY: add screenshot/export buttons
└── data/
    ├── airports/                  # NEW: static JSON files per region
    │   ├── europe.json
    │   ├── morocco.json
    │   ├── north-america.json
    │   └── germany.json
    └── airspace/                  # NEW: GeoJSON airspace boundary files
        └── gmmm-fir.geojson

tests/
├── unit/
│   ├── riskScoring.test.js        # NEW
│   ├── metarDecoder.test.js       # NEW
│   ├── airspaceDetector.test.js   # NEW
│   ├── holdingDetector.test.js    # NEW
│   ├── situationReport.test.js    # NEW
│   ├── pointInPolygon.test.js     # NEW
│   ├── anomalyRules.test.js       # MODIFY: update for additive model
│   ├── transformers.test.js       # EXISTING
│   └── formatters.test.js         # EXISTING
├── integration/
│   ├── anomalyPipeline.test.js    # MODIFY: test new scoring flow
│   ├── metarPipeline.test.js      # NEW
│   └── airspaceDetection.test.js  # NEW
└── contract/
    └── riskScoringContract.test.js # NEW
```

**Structure Decision**: Single project structure (existing pattern). All new code follows the established `src/lib/` for pure logic, `src/hooks/` for React integration, `src/components/` for UI. Static data files added under `src/data/`. Tests mirror source structure under `tests/`.

## Complexity Tracking

> No violations found. All features follow Library-First + Test-First patterns using existing project structure.
