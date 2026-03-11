# Implementation Plan: Live Flight Anomaly Radar

**Branch**: `001-flight-anomaly-radar` | **Date**: 2026-03-11 | **Spec**: [spec.md](file:///Users/pc/Desktop/projects/TraconView/specs/001-flight-anomaly-radar/spec.md)
**Input**: Feature specification from `/specs/001-flight-anomaly-radar/spec.md`

## Summary

TraconView is a live flight anomaly radar that tracks aircraft in real-time via OpenSky ADS-B data, highlights emergencies, rapid descents, and unusual behavior on a dark ATC-style map. The frontend is a React 19 + Vite SPA using Leaflet for mapping, Zustand for state management, Recharts for statistics, and Tailwind CSS 4 for styling. A Supabase Edge Function (Deno/TS) serves as a proxy for the OpenSky REST API, handling OAuth2 authentication, response caching (15s TTL), and rate limit management. Supabase PostgreSQL stores anomaly history. The application is deployed on Vercel (frontend) with Supabase (backend).

## Technical Context

**Language/Version**: JavaScript (ES2022+) for frontend, TypeScript (Deno) for Edge Functions
**Primary Dependencies**: React 19, Vite, Tailwind CSS 4, Leaflet/react-leaflet, Zustand, Recharts, Lucide React, Supabase JS Client
**Storage**: Supabase PostgreSQL (anomaly_log table) + static GeoJSON (airspace data)
**Testing**: Vitest (unit tests), Browser-based manual testing (UI/integration)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge), desktop + mobile
**Project Type**: Web application (SPA frontend + serverless backend)
**Performance Goals**: <5s initial load, 15s data refresh cycle, smooth canvas rendering for up to 5,000 aircraft dots
**Constraints**: 100% free tier (Vercel 100GB bandwidth, Supabase 500K invocations/month + 500MB DB, OpenSky 4,000 credits/day)
**Scale/Scope**: Single-page application, ~15 components, ~5 hooks, ~3 utility modules, 1 edge function, 1 DB table

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Library-First | ✅ PASS | Core logic modules (`anomalyRules.js`, `formatters.js`, `constants.js`) are standalone, independently testable libraries with no UI dependencies. |
| II. CLI / API Interface | ✅ PASS | Edge function exposes a clean REST API (`GET /functions/v1/opensky-proxy?region=EUROPE`) returning JSON. Frontend libs export pure functions. |
| III. Test-First | ✅ PASS | Unit tests will be written for anomaly rules, formatters, and data transformers before implementation. |
| IV. Integration Testing | ✅ PASS | Integration tests will cover the OpenSky proxy → transformer → anomaly engine pipeline. |
| V. Observability & Versioning | ✅ PASS | Status indicator (LIVE/OFFLINE/DEGRADED) in header. Structured console logging for data pipeline. Semantic versioning for releases. |

## Project Structure

### Documentation (this feature)

```text
specs/001-flight-anomaly-radar/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── opensky-proxy-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
public/
└── data/
    ├── airspaces-eu.geojson          # OpenAIP Europe airspaces
    ├── airspaces-mena.geojson        # OpenAIP MENA airspaces
    └── airports.json                 # OurAirports filtered

src/
├── app/
│   ├── layout.jsx                    # Root layout with fonts + meta
│   └── page.jsx                      # Main page assembling all panels
├── components/
│   ├── map/
│   │   ├── TraconMap.jsx             # Main Leaflet map container
│   │   ├── AircraftLayer.jsx         # Canvas-rendered aircraft dots
│   │   ├── AirspaceLayer.jsx         # GeoJSON airspace polygon overlays
│   │   └── AnomalyMarker.jsx         # Pulsing anomaly dot component
│   ├── panels/
│   │   ├── AlertSidebar.jsx          # Live anomaly feed sidebar
│   │   ├── AircraftDetail.jsx        # Click-to-inspect aircraft detail
│   │   ├── StatsPanel.jsx            # Charts + counters
│   │   └── RegionSelector.jsx        # Preset region buttons
│   └── ui/
│       ├── Header.jsx                # Top bar: logo + status + mute toggle
│       ├── StatusIndicator.jsx       # API health dot
│       └── RadarSweep.jsx            # CSS radar animation
├── hooks/
│   ├── useOpenSky.js                 # Fetch + poll OpenSky via proxy
│   ├── useAnomalyEngine.js           # Anomaly detection on aircraft data
│   └── useAirspaceData.js            # Load GeoJSON airspace files
├── lib/
│   ├── anomalyRules.js               # Detection rule definitions
│   ├── constants.js                  # Regions, colors, thresholds
│   ├── formatters.js                 # Unit conversions (m→ft, m/s→kts)
│   └── transformers.js               # OpenSky raw → Aircraft model
├── store/
│   └── flightStore.js                # Zustand global state
└── styles/
    └── globals.css                   # Tailwind + ATC dark scope theme

supabase/
└── functions/
    └── opensky-proxy/
        └── index.ts                  # Edge function: proxy + cache + OAuth2

tests/
├── unit/
│   ├── anomalyRules.test.js
│   ├── formatters.test.js
│   └── transformers.test.js
└── integration/
    └── anomalyPipeline.test.js
```

**Structure Decision**: Web application (SPA frontend + serverless backend). The frontend is a single Vite+React project. The backend is a single Supabase Edge Function. This is the simplest viable structure — no monorepo, no separate backend project.

## Complexity Tracking

> No violations to justify — project structure is minimal (1 frontend project + 1 edge function).
