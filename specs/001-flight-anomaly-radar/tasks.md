# Tasks: Live Flight Anomaly Radar

**Input**: Design documents from `/specs/001-flight-anomaly-radar/`
**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

**Tests**: Test tasks included — constitution mandates Test-First (TDD).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding and core configuration

- [x] T001 Scaffold React + Vite project with `npx create-vite@latest ./ -- --template react` in project root
- [x] T002 Install core dependencies: `react-leaflet leaflet zustand recharts lucide-react @supabase/supabase-js`
- [x] T003 Install dev dependencies: `tailwindcss @tailwindcss/vite vitest`
- [x] T004 [P] Configure Vite with Tailwind CSS 4 plugin in `vite.config.js`
- [x] T005 [P] Create ATC dark scope theme with CSS custom properties in `src/styles/globals.css`
- [x] T006 [P] Add Google Fonts (JetBrains Mono + DM Sans) to `index.html`
- [x] T007 [P] Create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` placeholders
- [x] T008 [P] Create `src/app/layout.jsx` root layout component with font classes and meta tags
- [x] T009 Initialize Supabase Edge Function directory structure at `supabase/functions/opensky-proxy/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core logic modules and state store that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational Phase

- [x] T010 [P] Write unit tests for formatters (m→ft, m/s→kts, m/s→ft/min) in `tests/unit/formatters.test.js`
- [x] T011 [P] Write unit tests for anomaly rules (all 6 rules with edge cases) in `tests/unit/anomalyRules.test.js`
- [x] T012 [P] Write unit tests for data transformer (OpenSky array → Aircraft model) in `tests/unit/transformers.test.js`

### Implementation for Foundational Phase

- [x] T013 [P] Implement unit conversion utilities (metersToFeet, msToKnots, msToFtPerMin) in `src/lib/formatters.js`
- [x] T014 [P] Implement region presets and constants (REGIONS, DEFAULT_REGION, POLL_INTERVAL_MS, MAX_ANOMALY_HISTORY) in `src/lib/constants.js`
- [x] T015 [P] Implement anomaly detection rules array with priority order in `src/lib/anomalyRules.js`
- [x] T016 Implement OpenSky data transformer (raw state array → Aircraft model) in `src/lib/transformers.js`
- [x] T017 Implement Zustand store (aircraft, anomalies, selectedRegion, selectedAircraft, connectionStatus, isMuted) in `src/store/flightStore.js`
- [x] T018 Build OpenSky proxy Edge Function with OAuth2, caching (15s TTL), CORS, and region-based bounding box in `supabase/functions/opensky-proxy/index.ts`
- [x] T019 Run Vitest to verify all unit tests pass: `npm run test`

**Checkpoint**: Foundation ready — core logic, state store, and proxy function complete. User story implementation can begin.

---

## Phase 3: User Story 1 — Live Aircraft Monitoring (Priority: P1) 🎯 MVP

**Goal**: Display live aircraft positions on a dark ATC-style map, auto-refreshing every 15s, with click-to-inspect.

**Independent Test**: Open the app → see aircraft dots on dark map → dots refresh every 15s → click a dot → detail panel shows callsign, altitude, speed, heading, squawk.

### Implementation for User Story 1

- [x] T020 [US1] Implement `useOpenSky` hook with polling, region-scoped fetching, error handling, degraded mode (60s on rate limit), and 60s staleness cleanup in `src/hooks/useOpenSky.js`
- [x] T021 [US1] Build `TraconMap` component with dark CartoDB tiles, canvas renderer, and region-controlled viewport in `src/components/map/TraconMap.jsx`
- [x] T022 [US1] Build `AircraftLayer` component rendering aircraft as canvas dots colored by state (normal=teal, hover=cyan) in `src/components/map/AircraftLayer.jsx`
- [x] T023 [US1] Build `AircraftDetail` panel showing callsign, ICAO24, country, altitude, speed, heading, vertical rate, squawk, source, and last seen in `src/components/panels/AircraftDetail.jsx`
- [x] T024 [US1] Build `Header` component with logo, live/offline/degraded `StatusIndicator`, aircraft count, and mute toggle in `src/components/ui/Header.jsx` and `src/components/ui/StatusIndicator.jsx`
- [x] T025 [US1] Assemble the main page layout (Header + Map + AircraftDetail) in `src/app/page.jsx`
- [x] T026 [US1] Wire `useOpenSky` hook → Zustand store → `AircraftLayer` data flow in `src/app/page.jsx`
- [x] T027 [US1] Add footer disclaimer "For informational purposes only. Not for operational use." in `src/app/layout.jsx`
- [x] T028 [US1] Handle edge cases: no-callsign fallback (ICAO24), null position (skip render), zero aircraft ("No aircraft in range"), connection failures (>3 → OFFLINE status)

**Checkpoint**: User Story 1 complete — live aircraft on dark map with click-to-inspect. This is the MVP.

---

## Phase 4: User Story 2 — Anomaly Detection & Alerting (Priority: P1)

**Goal**: Automatically detect squawk emergencies, rapid descents, unusual speeds, and SPI — highlight anomalous aircraft with severity-coded colors and pulsing animations.

**Independent Test**: Observe map when aircraft with squawk 7700/7500/7600 or rapid descent appear → anomalous aircraft dots change color and pulse → audio alert plays for CRITICAL.

### Implementation for User Story 2

- [x] T029 [US2] Implement `useAnomalyEngine` hook that processes aircraft array through prioritized rules on each refresh in `src/hooks/useAnomalyEngine.js`
- [x] T030 [US2] Build `AnomalyMarker` component with pulsing red/orange dot and glow animation for anomalous aircraft in `src/components/map/AnomalyMarker.jsx`
- [x] T031 [US2] Update `AircraftLayer` to render anomalous aircraft with severity-coded colors (critical=red, high=orange, medium=yellow, low=blue) in `src/components/map/AircraftLayer.jsx`
- [x] T032 [US2] Implement audio alert system for CRITICAL anomalies with mute toggle integration in `src/hooks/useAnomalyEngine.js`
- [x] T033 [US2] Wire anomaly engine into data pipeline: useOpenSky → useAnomalyEngine → flightStore → AircraftLayer/AnomalyMarker

**Checkpoint**: User Story 2 complete — anomalies detected and visually highlighted on map with audio for critical.

---

## Phase 5: User Story 3 — Alert Feed Sidebar (Priority: P1)

**Goal**: Live sidebar showing chronological anomaly feed with severity badges, callsign, altitude, vertical rate, and UTC timestamps.

**Independent Test**: When anomalies are detected → sidebar shows entries with color badges → click entry → map centers on aircraft → max 50 entries.

### Implementation for User Story 3

- [x] T034 [US3] Build `AlertSidebar` component with scrollable feed, severity color badges, callsign, anomaly label, altitude, vertical rate, UTC timestamp in `src/components/panels/AlertSidebar.jsx`
- [x] T035 [US3] Implement click-on-alert: center map on aircraft and open detail panel, connected via Zustand store
- [x] T036 [US3] Implement 50-entry cap with oldest-first eviction in Zustand anomaly history slice in `src/store/flightStore.js`
- [x] T037 [US3] Update main page layout to include AlertSidebar in right panel in `src/app/page.jsx`
- [x] T038 [US3] Implement anomaly logging to Supabase `anomaly_log` table (global scope, all regions) via Supabase JS client

**Checkpoint**: User Story 3 complete — live alert feed sidebar with click-to-locate and persistent anomaly logging.

---

## Phase 6: User Story 4 — Region Selection (Priority: P2)

**Goal**: Preset region buttons (Morocco/MENA, Europe, North America, Germany, Global) that pan/zoom the map and re-scope data fetching.

**Independent Test**: Click "Germany" → map pans to Germany, zoom 6, aircraft reload for Germany bounding box. Default=Europe on load.

### Implementation for User Story 4

- [x] T039 [US4] Build `RegionSelector` component with styled buttons for each preset region from constants in `src/components/panels/RegionSelector.jsx`
- [x] T040 [US4] Wire region selection to Zustand store → useOpenSky (re-fetch) + TraconMap (pan/zoom) in `src/store/flightStore.js`
- [x] T041 [US4] Add RegionSelector to header or sub-header area in `src/app/page.jsx`

**Checkpoint**: User Story 4 complete — region presets work, map re-centers, data re-scopes.

---

## Phase 7: User Story 5 — Airspace Overlay (Priority: P2)

**Goal**: Render airspace boundary polygons (CTR, TMA, Restricted, FIR) from static GeoJSON with type-coded colors.

**Independent Test**: Load map → airspace polygons visible with correct colors → hover shows name, class, altitude bounds.

### Implementation for User Story 5

- [x] T042 [P] [US5] Prepare and add airspace GeoJSON files for Europe and MENA to `public/data/airspaces-eu.geojson` and `public/data/airspaces-mena.geojson`
- [x] T043 [US5] Implement `useAirspaceData` hook to load GeoJSON files based on selected region in `src/hooks/useAirspaceData.js`
- [x] T044 [US5] Build `AirspaceLayer` component rendering GeoJSON polygons with type-coded fills (CTR=cyan, TMA=amber, Restricted=red, FIR=white) and hover tooltips in `src/components/map/AirspaceLayer.jsx`
- [x] T045 [US5] Integrate AirspaceLayer into TraconMap in `src/components/map/TraconMap.jsx`

**Checkpoint**: User Story 5 complete — airspace polygons visible on map with color-coded fills and tooltips.

---

## Phase 8: User Story 6 — Statistics Dashboard (Priority: P2)

**Goal**: Stats panel showing aircraft count, altitude distribution histogram, and region breakdown — all updating live.

**Independent Test**: Load map with data → stats panel shows aircraft count, altitude histogram updates on refresh.

### Implementation for User Story 6

- [x] T046 [US6] Build `StatsPanel` component with aircraft count display and Recharts altitude histogram in `src/components/panels/StatsPanel.jsx`
- [x] T047 [US6] Add region breakdown chart (bar chart by country or origin) in `src/components/panels/StatsPanel.jsx`
- [x] T048 [US6] Wire StatsPanel to Zustand store aircraft data and integrate into main page layout in `src/app/page.jsx`

**Checkpoint**: User Story 6 complete — live stats panel with charts updating on each data refresh.

---

## Phase 9: User Story 7 — System Health & Status (Priority: P3)

**Goal**: Header shows LIVE/OFFLINE/DEGRADED status, last refresh time. Footer shows disclaimer.

**Independent Test**: Normal data → green LIVE indicator. Disconnect network → red OFFLINE. Footer shows disclaimer text.

### Implementation for User Story 7

- [x] T049 [US7] Enhance `StatusIndicator` to show last refresh timestamp and transition between LIVE/OFFLINE/DEGRADED states based on connection errors and rate limit status in `src/components/ui/StatusIndicator.jsx`
- [x] T050 [US7] Implement connection failure tracking (>3 consecutive failures → OFFLINE, rate limit → DEGRADED) in `src/hooks/useOpenSky.js`

**Checkpoint**: User Story 7 complete — system health fully visible in header.

---

## Phase 10: User Story 8 — Mobile-Responsive Layout (Priority: P3)

**Goal**: Mobile layout with full-screen map and collapsible sidebar drawer on viewports <768px.

**Independent Test**: Access on mobile viewport → map fills screen → tap toggle → sidebar drawer slides in from right.

### Implementation for User Story 8

- [x] T051 [US8] Add responsive CSS breakpoints (<768px) for full-screen map layout in `src/styles/globals.css`
- [x] T052 [US8] Convert AlertSidebar to a collapsible drawer with slide-in animation on mobile in `src/components/panels/AlertSidebar.jsx`
- [x] T053 [US8] Add sidebar toggle button visible only on mobile viewports in `src/components/ui/Header.jsx`
- [x] T054 [US8] Test responsive layout at 375px, 414px, and 768px breakpoints

**Checkpoint**: User Story 8 complete — application is fully usable on mobile.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Visual polish, performance, and deployment readiness

- [x] T055 [P] Build CSS radar sweep animation component in `src/components/ui/RadarSweep.jsx`
- [x] T056 [P] Create favicon and OG social preview image for LinkedIn/Twitter sharing in `public/`
- [x] T057 [P] Add meta tags (title, description, OG image, Twitter card) in `index.html`
- [x] T058 [P] Prepare filtered airports JSON data file in `public/data/airports.json`
- [x] T059 Performance optimization: verify canvas rendering handles 5,000 aircraft dots smoothly
- [x] T060 Add Supabase database migration SQL for `anomaly_log` table in `supabase/migrations/`
- [x] T061 [P] Update README.md with project description, screenshots, setup instructions, and tech stack
- [x] T062 Configure Vercel deployment and environment variables
- [x] T063 Final build verification: `npm run build` and `npm run preview`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP target
- **US2 (Phase 4)**: Depends on US1 (needs aircraft data pipeline)
- **US3 (Phase 5)**: Depends on US2 (needs anomaly detection)
- **US4 (Phase 6)**: Depends on US1 only (region scoping)
- **US5 (Phase 7)**: Depends on US1 only (map layer)
- **US6 (Phase 8)**: Depends on US1 only (aircraft data)
- **US7 (Phase 9)**: Depends on US1 (status indicator enhancement)
- **US8 (Phase 10)**: Depends on US1 + US3 (responsive sidebar)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1: Map + Aircraft)
                                              │
                                              ├── Phase 4 (US2: Anomaly Detection)
                                              │       │
                                              │       └── Phase 5 (US3: Alert Sidebar)
                                              │                │
                                              │                └── Phase 10 (US8: Mobile)
                                              ├── Phase 6 (US4: Regions) ──────┐
                                              ├── Phase 7 (US5: Airspace) ─────┤
                                              ├── Phase 8 (US6: Stats) ────────┤
                                              └── Phase 9 (US7: Health) ───────┤
                                                                               │
                                                                    Phase 11 (Polish)
```

### Parallel Opportunities

- **Phase 1**: T004, T005, T006, T007, T008 can all run in parallel
- **Phase 2**: T010, T011, T012 (tests) in parallel; T013, T014, T015 (libs) in parallel
- **After US1**: US4, US5, US6, US7 can run in parallel (all depend only on US1)
- **Phase 11**: T055, T056, T057, T058 can all run in parallel

---

## Parallel Example: After Phase 3 completion

```bash
# These user stories can run in parallel after US1 is complete:
Phase 6 (US4: Region Selection)     # Independent — only needs map + store
Phase 7 (US5: Airspace Overlay)     # Independent — only needs map
Phase 8 (US6: Statistics)           # Independent — only needs aircraft data
Phase 9 (US7: System Health)        # Independent — only needs status indicator
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Live Aircraft Monitoring)
4. **STOP and VALIDATE**: Open app → see live dots on dark map → click → detail panel
5. Deploy to Vercel if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1: Live Aircraft Monitoring → Test → Deploy (MVP!)
3. US2: Anomaly Detection → Test → Deploy
4. US3: Alert Feed Sidebar → Test → Deploy
5. US4–US7: Region, Airspace, Stats, Health → Test → Deploy
6. US8: Mobile Layout → Test → Deploy
7. Polish → Final Deploy

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD per constitution)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Implementation Log (2026-03-11)
**What we did**: 
- Scaffolded project with Vite, React, Tailwind v4, Zustand, and React-Leaflet.
- Built foundational logic (formatters, data transformers, anomaly engine, tests).
- Created the Supabase Edge Function proxy for OpenSky data with caching and bounding box filtering.
- Implemented User Stories 1 through 8 covering: Live map monitoring, anomaly alerts with audio, collapsible Alert Sidebar, region selection, airspace GeoJSON overlays, statistics dashboard, and mobile responsiveness.
- Added visual polish, including a CSS radar sweep animation, ATC-dark theme, and Vercel configuration.
- Successfully verified the production build.
- Connected the GitHub repository to Vercel for continuous deployment.
- Provided real `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` to the production Supabase vault.
- Ran the Supabase SQL migration against the production Supabase database to stand up the `anomaly_log` table.
- Applied code review fixes to optimize `React-Leaflet` rendering loops.
- Updated `public/data/airspaces-eu.geojson` and `airspaces-mena.geojson` with real complex geometries representing FIRs, TMAs, CTRs, and Restricted areas.

**Status**: All deployment setup and codebase refinements are complete. App is fully live in production.

---

## Phase 12: User Story 9 — Realistic Aircraft Icons & Photos (Priority: P2)

**Goal**: Make the map visually richer by using directional airplane icons, and provide a detailed aircraft card featuring a real photograph of the plane.

**Independent Test**: Load map → see airplane silhouettes pointing in direction of travel. Click plane → sidebar opens showing photo from `planespotters.net`, formatted data grid mimicking professional flight trackers.

### Implementation for User Story 9

- [x] T064 [US9] Replace `CircleMarker` with `Marker` and a customized `L.divIcon` (SVG airplane) that rotates dynamically based on `heading` in `src/components/map/AircraftLayer.jsx`
- [x] T065 [US9] Implement fetch logic to `api.planespotters.net/pub/photos/hex/{hex}` to retrieve aircraft images when an aircraft is selected in `src/components/panels/AircraftDetail.jsx`
- [x] T066 [US9] Restructure `AircraftDetail.jsx` layout to exactly match the target UI screenshot (Image pane, Metadata, Spatial, Signal, etc.) using available OpenSky datastream parameters.

---

## Phase 13: User Story 10 — Flight Trails & UI Polish (Priority: P2)

**Goal**: Show a trailing history path behind the selected aircraft, colored by altitude or a solid color, and resolve click-handling bugs in the UI.

**Independent Test**: Click an aircraft → sidebar opens, map draws a polyline showing past path. Click close (`X`) in sidebar → sidebar closes and selected plane resets.

### Implementation for User Story 10

- [x] T067 [US10] Fix `z-index` and pointer-events overlaps in `AircraftDetail.jsx` preventing the close button from working.
- [x] T068 [US10] Implement `/api/tracks/all?icao24={hex}` fetch logic to retrieve historical path coordinates automatically when an aircraft is selected.
- [x] T069 [US10] Render `Polyline` inside `AircraftLayer` dynamically displaying the fetched track for the currently selected aircraft.
