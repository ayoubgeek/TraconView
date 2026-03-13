# Tasks: TraconView Uniqueness Features & Analytics

**Input**: Design documents from `/specs/002-analytics-features/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — Constitution mandates TDD (Test-First is NON-NEGOTIABLE). Write tests first, verify they fail (Red), then implement (Green), then refactor.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend project structure and Zustand store for all new features

- [x] T001 Add risk threshold constants, METAR config, and airport data constants to src/lib/constants.js
- [x] T002 Extend Zustand store with positionHistory, metarData, alerts, airspaceZones, and riskScores state slices in src/store/flightStore.js
- [x] T003 [P] Create static airport data files: src/data/airports/europe.json, src/data/airports/morocco.json, src/data/airports/germany.json, src/data/airports/north-america.json
- [x] T004 [P] Create airport data loader utility in src/lib/airportData.js (loads per-region airport list)

**Checkpoint**: Store extended, constants defined, static data in place. Feature implementation can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core libraries that multiple user stories depend on — MUST complete before ANY story begins

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests First (TDD — Red Phase)

- [x] T005 [P] Write unit tests for risk scoring engine in tests/unit/riskScoring.test.js — cover all 9 rules individually, additive scoring, cap at 100, threshold mapping, isNewCritical detection (per contracts/risk-scoring.md test contract)
- [x] T006 [P] Write unit tests for point-in-polygon in tests/unit/pointInPolygon.test.js — cover point inside/outside, bbox rejection, polygon with holes, empty inputs (per contracts/airspace-detector.md test contract)

### Implementation (TDD — Green Phase)

- [x] T007 Implement additive risk scoring engine in src/lib/riskScoring.js — computeRiskScore(), getThreshold(), RISK_RULES export (per contracts/risk-scoring.md)
- [x] T008 [P] Implement ray-casting point-in-polygon with bbox pre-filtering in src/lib/pointInPolygon.js — computeBBox(), pointInRing(), pointInPolygon(), prepareAirspaces(), classifyAircraftByAirspace() (per contracts/airspace-detector.md)
- [x] T009 [P] Add formatting helpers to src/lib/formatters.js — formatAltitude() (FL vs ft), formatHeadingWithCardinal(), haversineDistance(), findNearestAirport()

**Checkpoint**: Foundation ready — risk scoring and point-in-polygon libraries tested and working. User story implementation can now begin.

---

## Phase 3: User Story 1 — Continuous Risk Scoring (Priority: P1) 🎯 MVP

**Goal**: Every aircraft gets a dynamic 0-100 risk score with visual dot differentiation on the map (size, color, animation by threshold).

**Independent Test**: Load any region with live traffic. Aircraft should display varying dot sizes/colors. A squawk-7700 aircraft appears as large red pulsing dot (score 50+), normal cruising aircraft as small dim teal dot (score 0-10).

### Tests for User Story 1

- [x] T010 [P] [US1] Write integration test for anomaly pipeline with new scoring model in tests/integration/anomalyPipeline.test.js — verify additive scoring replaces first-match-wins, alert generation with consolidated entries, resolved alert state
- [x] T011 [P] [US1] Write contract test for risk scoring integration in tests/contract/riskScoringContract.test.js — verify store integration, threshold crossing detection, sound trigger logic

### Implementation for User Story 1

- [x] T012 [US1] Refactor useAnomalyEngine hook in src/hooks/useAnomalyEngine.js — replace checkAnomalies() calls with computeRiskScore(), store riskScores in flightStore, implement consolidated alert entries per aircraft (one entry with badge reasons), implement resolved alert marking (dimmed/strikethrough when conditions clear)
- [x] T013 [US1] Update AircraftLayer in src/components/map/AircraftLayer.jsx — read riskScore/riskThreshold from store, implement visual dot differentiation: Normal 3px dim teal, Watch 4px yellow border, Caution 6px yellow, Warning 8px orange slow-pulse, Critical 10px red fast-pulse with glow
- [x] T014 [US1] Update AlertSidebar in src/components/panels/AlertSidebar.jsx — render consolidated alert entries with reason badges/tags, show resolved alerts as dimmed/strikethrough, implement single alert tone on Critical threshold crossing (score <76 → ≥76)
- [x] T015 [US1] Update anomaly_log Supabase insert in src/hooks/useAnomalyEngine.js — add risk_score field to Supabase logging

**Checkpoint**: Risk scoring is live. Aircraft dots vary by score. Alert feed shows consolidated entries with badges. This is the MVP — fully functional and testable.

---

## Phase 4: User Story 2 — Live Analytics Dashboard (Priority: P1)

**Goal**: Real-time charts updating every 15 seconds: altitude histogram, country donut, KPI cards, anomaly timeline sparkline, speed-vs-altitude scatter.

**Independent Test**: Open analytics panel with live traffic. Altitude histogram shows realistic distribution (most at FL300-400). Country donut reflects region. KPI cards update in sync with data refreshes.

### Implementation for User Story 2

- [x] T016 [US2] Expand StatsPanel with KPI cards row in src/components/panels/StatsPanel.jsx
- [x] T017 [US2] Replace country bar chart with Recharts PieChart donut in src/components/panels/StatsPanel.jsx
- [x] T018 [US2] Refine altitude histogram bands in src/components/panels/StatsPanel.jsx
- [x] T019 [P] [US2] Add anomaly timeline sparkline in src/components/panels/StatsPanel.jsx
- [x] T020 [P] [US2] Add speed-vs-altitude scatter plot in src/components/panels/StatsPanel.jsx
- [x] T021 [US2] Add smooth animated transitions to all charts via Recharts isAnimationActive prop and animationDuration config

**Checkpoint**: Analytics dashboard is live with 5 chart types and KPI cards. All update smoothly on 15-second refresh.

---

## Phase 5: User Story 3 — Airport Weather Overlay (Priority: P2)

**Goal**: Colored dots on major airports showing flight conditions (VFR/MVFR/IFR/LIFR) from live METAR data. Click for decoded weather popup.

**Independent Test**: Select Morocco region, verify GMMN/GMMX/etc. show colored weather dots. Click a dot to see decoded METAR popup.

### Tests for User Story 3

- [x] T022 [P] [US3] Write unit tests for METAR client in tests/unit/metarClient.test.js

### Implementation for User Story 3

- [x] T023 [US3] Create Vercel METAR proxy serverless function in api/metar-proxy.js
- [x] T024 [US3] Implement METAR client library in src/lib/metarClient.js
- [x] T025 [US3] Create useMetar hook in src/hooks/useMetar.js
- [x] T026 [US3] Create WeatherLayer map component in src/components/map/WeatherLayer.jsx
- [x] T027 [US3] Integrate WeatherLayer into TraconMap in src/components/map/TraconMap.jsx

**Checkpoint**: Airport weather dots visible on map. Click shows decoded METAR. Auto-refreshes every 5 minutes. Errors handled silently.

---

## Phase 6: User Story 4 — Airspace Intelligence with Restricted Zone Detection (Priority: P2)

**Goal**: Airspace polygon overlays with distinct styles. Auto-detect aircraft entering restricted/danger zones. Occupancy badges on zones.

**Independent Test**: Load Germany airspace, enable restricted zone overlay, verify aircraft inside restricted area triggers alert. Occupancy badges update as aircraft enter/leave.

### Tests for User Story 4

- [x] T028 [P] [US4] Write unit tests for airspace detector in tests/unit/airspaceDetector.test.js
- [x] T029 [P] [US4] Write integration test for airspace detection pipeline in tests/integration/airspaceDetection.test.js

### Implementation for User Story 4

- [x] T030 [US4] Implement airspace detector library in src/lib/airspaceDetector.js
- [x] T031 [US4] Create useAirspaceDetection hook in src/hooks/useAirspaceDetection.js
- [x] T032 [US4] Download and preprocess airspace GeoJSON data
- [x] T033 [US4] Update AirspaceLayer in src/components/map/AirspaceLayer.jsx
- [x] T034 [US4] Add independent airspace layer toggles in src/components/ui/Header.jsx or a new AirspaceToggle component
- [x] T035 [US4] Integrate zone incursion alerts into AlertSidebar in src/components/panels/AlertSidebar.jsx

**Checkpoint**: Airspace overlays render with correct styles. Restricted zone alerts fire. Occupancy badges update. Layer toggles work independently.

---

## Phase 7: User Story 5 — Template-Based Situation Reports (Priority: P2)

**Goal**: Click anomaly aircraft → see structured ATC-style briefing with identity, position, risk breakdown, nearest airport, and weather.

**Independent Test**: Click any anomaly aircraft. Report populates all available fields. Missing METAR shows graceful fallback.

### Tests for User Story 5

- [x] T036 [P] [US5] Write unit tests for situation report generator in tests/unit/situationReport.test.js

### Implementation for User Story 5

- [x] T037 [US5] Implement situation report generator in src/lib/situationReport.js
- [x] T038 [US5] Create SituationReport panel component in src/components/panels/SituationReport.jsx
- [x] T039 [US5] Integrate SituationReport into app

**Checkpoint**: Situation reports generate <500ms on click. All available data fields populated. Missing data shows graceful fallbacks.

---

## Phase 8: User Story 6 — Holding Pattern Detection (Priority: P3)

**Goal**: Detect aircraft flying circular patterns via heading change analysis. Show "HOLDING" badge and circular trail.

**Independent Test**: Observe airport with approach delays. Aircraft circling in holding pattern receive HOLDING badge within 2-3 minutes.

### Tests for User Story 6

- [x] T040 [P] [US6] Write unit tests for holding detector in tests/unit/holdingDetector.test.js

### Implementation for User Story 6

- [x] T041 [US6] Implement holding detector library in src/lib/holdingDetector.js
- [x] T042 [US6] Create usePositionHistory hook in src/hooks/usePositionHistory.js
- [x] T043 [US6] Create useHoldingDetection hook in src/hooks/useHoldingDetection.js
- [x] T044 [US6] Create HoldingTrail map component in src/components/map/HoldingTrail.jsx
- [x] T045 [US6] Add HOLDING badge to AircraftLayer in src/components/map/AircraftLayer.jsx

**Checkpoint**: Holding detection works. HOLDING badge appears on circling aircraft. Trail renders as polyline. Badge removed when heading stabilizes.

---

## Phase 9: User Story 7 — Morocco Airspace Special Features (Priority: P3)

**Goal**: Pre-loaded Morocco airport dashboard with one-click weather/traffic/anomalies. Casablanca FIR focus mode.

**Independent Test**: Select Morocco region, click any pre-loaded airport to see weather, traffic count, anomaly summary. Activate Casablanca FIR mode to highlight aircraft inside GMMM.

### Implementation for User Story 7

- [x] T046 [US7] Source and bundle Casablanca FIR (GMMM) GeoJSON boundary in public/data/airspaces/gmmm-fir.geojson
- [x] T047 [US7] Create MoroccoPanel component in src/components/panels/MoroccoPanel.jsx
- [x] T048 [US7] Implement Casablanca FIR focus mode — toggle in MoroccoPanel that highlights all aircraft inside GMMM FIR boundary

**Checkpoint**: Morocco panel shows airport summaries. Casablanca FIR mode highlights contained aircraft.

---

## Phase 10: User Story 8 — Screenshot Mode and Anomaly Export (Priority: P3)

**Goal**: Screenshot mode hides UI chrome for clean 1200x630 capture with watermark. CSV export of last 24h anomaly data.

**Independent Test**: Activate screenshot mode — UI elements hidden, watermark appears. Export CSV — file downloads with valid anomaly records.

### Implementation for User Story 8

- [x] T049 [US8] Create ScreenshotMode component in src/components/ui/ScreenshotMode.jsx 
- [x] T050 [US8] Create ExportButton component in src/components/ui/ExportButton.jsx
- [x] T051 [US8] Add screenshot mode toggle and export button to Header in src/components/ui/Header.jsx

**Checkpoint**: Screenshot mode produces clean share-ready view. CSV export downloads valid file with correct columns.
---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Integration testing, performance validation, and cleanup across all### Tests for Polish Phase

- [x] T052 [P] Write METAR pipeline integration test in tests/integration/metarPipeline.test.js

### Validation & Verification

- [x] T053 Validate performance: map rendering with 2000+ aircraft (Europe) remains smooth
- [x] T054 Update existing tests/unit/anomalyRules.test.js to reflect new additive scoring model
- [x] T055 Run full test suite (npm run test) and fix any failures
- [x] T056 Run quickstart.md validation — verify all documented commands and flows work as described

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — MVP target
- **US2 (Phase 4)**: Depends on Phase 2 — can run parallel with US1
- **US3 (Phase 5)**: Depends on Phase 2 — can run parallel with US1/US2
- **US4 (Phase 6)**: Depends on Phase 2 (pointInPolygon from T008) — can run parallel with US1/US2/US3
- **US5 (Phase 7)**: Depends on US1 (risk scoring) + benefits from US3 (METAR) — run after US1
- **US6 (Phase 8)**: Depends on Phase 2 — can run parallel with US1-US4
- **US7 (Phase 9)**: Depends on US3 (METAR) + US4 (airspace) — run after US3 and US4
- **US8 (Phase 10)**: Depends on US1 (alerts exist to export) — run after US1
- **Polish (Phase 11)**: Depends on all desired stories complete

### User Story Dependencies

```
Phase 1 (Setup)
  └→ Phase 2 (Foundational: riskScoring, pointInPolygon)
       ├→ US1 (Risk Scoring)  ──────────────────┐
       │    └→ US5 (Situation Reports) ←─────────┤
       │    └→ US8 (Screenshot/Export)            │
       ├→ US2 (Analytics Dashboard)               │
       ├→ US3 (Weather Overlay) ──────────┐       │
       │    └→ US7 (Morocco Features) ←───┤       │
       ├→ US4 (Airspace Intelligence) ────┘       │
       └→ US6 (Holding Detection)                 │
                                                   │
       Phase 11 (Polish) ←────────────────────────┘
```

### Within Each User Story

1. Tests MUST be written and FAIL before implementation (Red)
2. Libraries (src/lib/) before hooks (src/hooks/)
3. Hooks before components (src/components/)
4. Core implementation before integration with other stories
5. Story complete → checkpoint → validate independently

### Parallel Opportunities

**Phase 2 parallel**: T005 ∥ T006 (tests), then T007 ∥ T008 ∥ T009 (implementations)

**After Phase 2 completes, these can all start in parallel**:
- US1 (T010-T015) — Risk scoring UI
- US2 (T016-T021) — Analytics dashboard
- US3 (T022-T027) — Weather overlay
- US4 (T028-T035) — Airspace intelligence
- US6 (T040-T045) — Holding detection

**Within stories, parallel tasks** (marked [P]):
- US1: T010 ∥ T011 (tests)
- US2: T019 ∥ T020 (timeline ∥ scatter)
- US3: T022 (tests) before implementation
- US4: T028 ∥ T029 (tests), T033 ∥ T034 (UI)
- US5: T036 (test) before implementation
- US6: T040 (test) before implementation

---

## Parallel Example: After Phase 2

```bash
# These 5 story tracks can run simultaneously:

# Track 1: Risk Scoring (US1)
Task: T012 "Refactor useAnomalyEngine with new scoring in src/hooks/useAnomalyEngine.js"
Task: T013 "Update AircraftLayer dot visuals in src/components/map/AircraftLayer.jsx"
Task: T014 "Update AlertSidebar consolidated entries in src/components/panels/AlertSidebar.jsx"

# Track 2: Analytics (US2)
Task: T016 "Add KPI cards to StatsPanel in src/components/panels/StatsPanel.jsx"
Task: T017 "Add country donut chart in src/components/panels/StatsPanel.jsx"

# Track 3: Weather (US3)
Task: T023 "Create METAR proxy in api/metar-proxy.js"
Task: T024 "Create METAR client in src/lib/metarClient.js"
Task: T026 "Create WeatherLayer in src/components/map/WeatherLayer.jsx"

# Track 4: Airspace (US4)
Task: T030 "Create airspace detector in src/lib/airspaceDetector.js"
Task: T031 "Create useAirspaceDetection in src/hooks/useAirspaceDetection.js"

# Track 5: Holding (US6)
Task: T041 "Create holding detector in src/lib/holdingDetector.js"
Task: T042 "Create usePositionHistory in src/hooks/usePositionHistory.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T009) — CRITICAL
3. Complete Phase 3: User Story 1 (T010-T015)
4. **STOP and VALIDATE**: Aircraft dots should vary by risk score. Alert feed shows consolidated entries. Sound plays on Critical threshold crossing.
5. Deploy/demo — this alone transforms the app significantly.

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. **Add US1** (Risk Scoring) → Test → Deploy **(MVP!)**
3. **Add US2** (Analytics) → Test → Deploy (impressive dashboard)
4. **Add US3** (Weather) → Test → Deploy (unique differentiator)
5. **Add US4** (Airspace) → Test → Deploy (ATM domain expertise)
6. **Add US5** (Sit Reports) → Test → Deploy (professional output)
7. **Add US6** (Holding) → Test → Deploy (pattern recognition)
8. **Add US7** (Morocco) → Test → Deploy (niche positioning)
9. **Add US8** (Export/Screenshot) → Test → Deploy (sharing/community)
10. Polish → Final validation → Production release

---

## Notes

- [P] tasks = different files, no dependencies — can run simultaneously
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- TDD is mandatory: write tests → verify FAIL → implement → verify PASS
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total tasks: 56 (T001-T056)
