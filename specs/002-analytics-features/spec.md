# Feature Specification: TraconView Uniqueness Features & Analytics

**Feature Branch**: `002-analytics-features`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Anomaly scoring system, live analytics dashboard, airspace intelligence, weather integration, AI situation reports, holding pattern detection, Morocco-specific features, and exportable intelligence — transforming TraconView from a basic flight tracker into a professional anomaly-focused airspace monitoring tool."

## Clarifications

### Session 2026-03-13

- Q: How should alerts behave when the triggering condition clears (aircraft leaves restricted zone, risk score drops)? → A: Alerts persist in the feed but are visually marked as "resolved" (dimmed/strikethrough) when the triggering condition clears. This preserves the audit trail for the anomaly timeline and CSV export.
- Q: How does the system know which airports to query for METAR data in a given region? → A: Use a static bundled list of major airports per region (~50 per region, each with ICAO code and coordinates). The Morocco airports (F7) are part of this list. The list can grow over time without architectural changes.
- Q: When an aircraft triggers multiple alert types simultaneously (e.g., squawk 7700 + restricted zone + holding), how should the alert feed display them? → A: One consolidated entry per aircraft showing all active alert reasons as badges/tags. This avoids feed clutter and aligns with the situation report (F5) which already aggregates all data per aircraft.
- Q: When should sound notifications play for critical alerts? → A: A single alert tone plays once when an aircraft first crosses into Critical threshold (score goes from <76 to >=76). No repeating sound. User can mute via the existing toggle. This avoids alarm fatigue while drawing attention to new emergencies.
- Q: What happens to position history when an aircraft disappears from the data feed? → A: Evict position history for any aircraft not seen in the last 2 polling cycles (~30 seconds). This aligns with the existing stale aircraft cleanup and keeps memory bounded.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Continuous Risk Scoring (Priority: P1)

A user viewing the map sees every aircraft assigned a dynamic risk score from 0 to 100, computed from weighted rules (squawk codes, descent rate, abnormal speed, SPI flag, data gaps, low approach). Aircraft dots vary in size, color, and animation intensity based on their score threshold (Normal 0-10, Watch 11-25, Caution 26-50, Warning 51-75, Critical 76-100). The user can instantly identify "hot spots" without reading individual callsigns.

**Why this priority**: This is the single most differentiating feature. It transforms the map from binary anomaly/normal into a gradient heatmap of concern. Every other feature builds on this scoring system.

**Independent Test**: Can be fully tested by loading any region with live traffic. Aircraft should display with varying dot sizes and colors based on their computed risk score. A user can verify that a squawk-7700 aircraft appears as a large red pulsing dot (score 50+) while a normal cruising aircraft appears as a small dim teal dot (score 0-10).

**Acceptance Scenarios**:

1. **Given** live aircraft data is loaded, **When** an aircraft squawks 7700, **Then** its risk score increases by 50 points, its dot becomes 10px red with a fast pulse animation, and it enters the alert feed.
2. **Given** an aircraft at FL350, **When** it descends at >2000 ft/min, **Then** its risk score increases by 25 points and the dot transitions to yellow/orange with a slow pulse.
3. **Given** an aircraft with no anomalies, **When** the map renders, **Then** it appears as a 3px dim teal dot with a score of 0.
4. **Given** an aircraft with multiple simultaneous anomalies (e.g., squawk 7700 + rapid descent), **When** the score is computed, **Then** the individual rule scores are summed (additive, capped at 100).

---

### User Story 2 - Live Analytics Dashboard (Priority: P1)

A user opens the analytics panel and sees real-time charts updating every 15 seconds: an altitude distribution histogram, a country-of-origin donut chart, and a row of live KPI cards (total aircraft, in-flight count, active anomalies, coverage quality, last update time). The charts animate smoothly between updates. This gives the user a professional operational overview at a glance.

**Why this priority**: Analytics visualizations are the primary "LinkedIn magnet" — they show data engineering sophistication and make screenshots compelling. The KPI cards also serve as essential operational status indicators.

**Independent Test**: Can be tested by viewing the analytics panel with live traffic. The altitude histogram should show a realistic distribution with most aircraft at FL300-400. The country donut should reflect the selected region's traffic composition. KPI cards should update in sync with data refreshes.

**Acceptance Scenarios**:

1. **Given** the analytics panel is visible, **When** new aircraft data arrives, **Then** the altitude histogram updates with smooth bar transitions within 1 second.
2. **Given** the Europe region is selected with live traffic, **When** the country donut renders, **Then** it shows the top 10 origin countries by aircraft count with correct percentages.
3. **Given** the KPI cards are displayed, **When** 15 seconds pass without a successful data fetch, **Then** the "Last Update" card shows the elapsed time and changes appearance to indicate staleness.
4. **Given** no aircraft are in the current view, **When** the analytics panel renders, **Then** it shows empty-state placeholders (e.g., "No data" for charts, "0" for KPI counts).

---

### User Story 3 - Airport Weather Overlay (Priority: P2)

A user sees colored dots on major airports indicating current flight conditions (VFR green, MVFR blue, IFR red, LIFR magenta) based on live METAR data. Clicking an airport dot opens a popup showing decoded weather: wind, visibility, cloud layers, temperature, and QNH. This lets the user correlate flight behavior with weather conditions.

**Why this priority**: Weather integration is the feature that no free flight tracker offers. It connects weather data to traffic behavior and signals deep aviation domain knowledge. It depends on a free external data source (aviationweather.gov) with generous rate limits.

**Independent Test**: Can be tested by selecting the Morocco region and verifying that GMMN, GMMX, and other Moroccan airports show colored weather dots. Clicking a dot should show a decoded METAR popup with valid data.

**Acceptance Scenarios**:

1. **Given** METAR data is loaded for airports in the current view, **When** the map renders, **Then** each airport with available METAR shows a colored dot matching its flight category (VFR=green, MVFR=blue, IFR=red, LIFR=magenta).
2. **Given** an airport weather dot is visible, **When** the user clicks it, **Then** a popup displays the decoded METAR: raw text, wind direction/speed, visibility, cloud ceiling, temperature/dewpoint, and QNH.
3. **Given** METAR data cannot be fetched (network error), **When** the map renders, **Then** airport dots are hidden and the user is not disrupted by error messages.

---

### User Story 4 - Airspace Intelligence with Restricted Zone Detection (Priority: P2)

A user toggles airspace overlays to see CTR, TMA, restricted, and danger zones rendered on the map with distinct colors and styles. When an aircraft enters a restricted or danger zone, the system auto-flags it in the alert feed with a message like "RAM1204 entered Restricted Zone R-123 at 12:34 UTC." Airspace polygons show occupancy badges with live aircraft counts.

**Why this priority**: Airspace overlay with occupancy detection is core ATM functionality — it directly demonstrates skills valued by DFS and air navigation service providers. It builds on existing GeoJSON data already partially integrated.

**Independent Test**: Can be tested by loading airspace data for Germany, enabling the restricted zone overlay, and verifying that an aircraft inside a restricted area triggers an alert. Occupancy badges should update as aircraft enter and leave zones.

**Acceptance Scenarios**:

1. **Given** airspace data is loaded, **When** the user enables the CTR overlay, **Then** CTR zones appear as cyan-filled polygons with dashed borders.
2. **Given** an aircraft is inside a restricted zone, **When** the system detects this, **Then** an alert appears in the feed: "[CALLSIGN] entered [ZONE NAME] at [TIME] UTC."
3. **Given** airspace occupancy is enabled, **When** the map renders, **Then** each airspace polygon shows a badge with the current count of aircraft inside it.
4. **Given** the user toggles an airspace layer off, **When** the toggle is deactivated, **Then** the corresponding polygons and badges disappear without affecting other layers.

---

### User Story 5 - Template-Based Situation Reports (Priority: P2)

A user clicks on an anomaly aircraft in the alert feed and sees a structured situation report: aircraft identity, current status, position details, nearest airport, risk score breakdown, and weather at the nearest airport. The report is generated client-side using templates (no external AI dependency) and formatted in a professional ATC briefing style.

**Why this priority**: Situation reports are the "wow" feature for portfolio demonstrations. They transform raw data into actionable intelligence briefs that look like real ATC operational output. Template-based generation means zero cost and instant response.

**Independent Test**: Can be tested by clicking any anomaly aircraft. The report should populate all available fields with formatted data. Missing fields (e.g., no METAR available) should show graceful fallbacks rather than errors.

**Acceptance Scenarios**:

1. **Given** an aircraft has an active anomaly, **When** the user clicks it in the alert feed, **Then** a situation report is displayed with: callsign, ICAO24, country, status line, position (lat/lng/altitude/speed/heading/vertical rate), nearest airport, risk score, and active anomaly rules.
2. **Given** METAR data is available for the nearest airport, **When** the report generates, **Then** it includes a weather summary (flight category, wind, visibility).
3. **Given** METAR data is not available, **When** the report generates, **Then** the weather section shows "Weather data unavailable" instead of an error.

---

### User Story 6 - Holding Pattern Detection (Priority: P3)

A user sees a "HOLDING" badge appear on aircraft that are flying in circular patterns. The system tracks the last 10 positions for each aircraft and detects heading changes exceeding 300 degrees. Holding aircraft display a circular trail on the map. This alerts the user to potential operational issues (e.g., runway closure, weather delays).

**Why this priority**: Holding pattern detection is technically the most impressive feature and demonstrates radar pattern recognition. It requires position history tracking which adds complexity but no additional API calls.

**Independent Test**: Can be tested by observing an airport with known approach delays. Aircraft circling in a holding pattern should receive the HOLDING badge within 2-3 minutes of starting the hold.

**Acceptance Scenarios**:

1. **Given** an aircraft has been tracked for at least 8 polling cycles (~2 minutes), **When** its cumulative heading change exceeds 300 degrees, **Then** it receives a "HOLDING" badge on the map.
2. **Given** an aircraft is in a holding pattern, **When** the map renders, **Then** a trail showing the last 10 positions is drawn as a polyline.
3. **Given** an aircraft exits a holding pattern (heading stabilizes), **When** 5 subsequent polls show less than 30 degrees total heading change, **Then** the HOLDING badge is removed.

---

### User Story 7 - Morocco Airspace Special Features (Priority: P3)

A user selects "Morocco / MENA" region and sees a pre-loaded dashboard of major Moroccan airports (GMMN, GMME, GMFF, GMMX, GMTT, GMAD) with one-click access to weather, traffic count, and nearby anomalies. A "Casablanca FIR" focus mode highlights all aircraft inside the GMMM FIR boundary with airspace structure and flow direction indicators.

**Why this priority**: Morocco-specific features serve the niche positioning strategy and demonstrate domain knowledge of ONDA-managed airspace. This is lower priority because it builds on features from P1 and P2 (weather, airspace, analytics).

**Independent Test**: Can be tested by selecting Morocco region and clicking any pre-loaded airport to see its weather, traffic count, and anomaly summary. The Casablanca FIR mode should visually highlight aircraft inside the FIR boundary.

**Acceptance Scenarios**:

1. **Given** the Morocco region is selected, **When** the user clicks a Moroccan airport (e.g., GMMN), **Then** a panel shows current METAR, aircraft count within 50nm, and any active anomalies nearby.
2. **Given** the Casablanca FIR mode is activated, **When** the map renders, **Then** all aircraft inside the GMMM FIR boundary are highlighted and a count is displayed.

---

### User Story 8 - Screenshot Mode and Anomaly Export (Priority: P3)

A user activates screenshot mode which hides UI chrome and optimizes the view for a 1200x630px capture with a "TraconView" watermark. Separately, a user can export the last 24 hours of anomaly data as a CSV file for research or analysis purposes.

**Why this priority**: Export features support community engagement (GitHub stars, data sharing) and LinkedIn sharing (screenshot mode). They are polish features that build on all other functionality.

**Independent Test**: Can be tested by activating screenshot mode and verifying that UI elements are hidden and a watermark appears. CSV export can be tested by downloading the file and verifying it contains valid anomaly records with correct column headers.

**Acceptance Scenarios**:

1. **Given** the user activates screenshot mode, **When** the mode is active, **Then** all panels, sidebars, and controls are hidden; only the map, aircraft dots, and key stats remain visible; and a "TraconView | Live Flight Anomaly Radar" watermark appears.
2. **Given** anomaly history exists in the database, **When** the user clicks "Export CSV," **Then** a CSV file downloads containing all anomalies from the last 24 hours with columns: timestamp, icao24, callsign, anomaly_type, severity, lat, lng, altitude_ft, speed_kts, squawk, region.

---

### Edge Cases

- What happens when the risk score computation produces a value above 100? Score MUST be capped at 100.
- What happens when METAR data is stale (>30 minutes old)? The airport dot should show a dimmed appearance and the popup should indicate "METAR age: Xm" with a warning if >60 minutes.
- What happens when no airports have METAR data for the current region? The weather layer should be empty with no error shown.
- What happens when the airspace GeoJSON is too large for the current view (e.g., Global region)? Airspace rendering should be disabled or limited to the visible viewport only.
- What happens when multiple aircraft enter a restricted zone simultaneously? Each aircraft should generate its own individual alert entry (one consolidated entry per aircraft with all alert reasons as badges).
- What happens when an aircraft's position history is lost after a region change? Position history should be cleared when the region changes, and holding detection should restart from zero.
- What happens to position history when an aircraft disappears from the data feed? Position history is evicted after 2 polling cycles (~30s) of no data, matching the stale aircraft cleanup. This keeps memory bounded.
- What happens when the anomaly timeline has no data for the 2-hour window? The sparkline should show a flat zero line with a "No anomalies recorded" label.
- What happens when an alert's triggering condition clears (e.g., aircraft leaves restricted zone, risk score drops)? The alert persists in the feed but is visually marked as "resolved" (dimmed/strikethrough). It remains available for the anomaly timeline and CSV export.

## Requirements *(mandatory)*

### Functional Requirements

**Risk Scoring System (F1)**
- **FR-001**: System MUST compute a risk score from 0 to 100 for every tracked aircraft using additive weighted rules.
- **FR-002**: System MUST apply these rule weights: squawk 7700/7500 (+50), squawk 7600 (+35), descent >2000 ft/min above FL100 (+25), descent >1500 ft/min above FL050 (+15), speed <150 kts above FL250 (+10), SPI active (+10), data gap >30s (+5), altitude <1000ft not on ground (+5).
- **FR-003**: System MUST cap the risk score at 100.
- **FR-004**: System MUST visually distinguish aircraft by score threshold: Normal (0-10) 3px dim teal, Watch (11-25) 4px yellow border, Caution (26-50) 6px yellow, Warning (51-75) 8px orange pulsing, Critical (76-100) 10px red fast-pulse with glow.
- **FR-005**: System MUST update risk scores every time new aircraft data arrives (~15 seconds).
- **FR-005a**: System MUST keep alerts in the feed when the triggering condition clears, marking them visually as "resolved" (dimmed or strikethrough) rather than removing them.
- **FR-005b**: System MUST display one consolidated alert entry per aircraft in the feed, showing all active alert reasons (risk score, restricted zone, holding) as badges/tags on the same entry.
- **FR-005c**: System MUST play a single alert tone when an aircraft first crosses into Critical threshold (risk score transitions from <76 to >=76). The tone MUST NOT repeat. The user MUST be able to mute all sound via the existing mute toggle.

**Live Analytics Dashboard (F2)**
- **FR-006**: System MUST display a real-time altitude distribution histogram with bands: Ground, 0-5K, 5-10K, 10-20K, FL200-300, FL300-400, FL400+.
- **FR-007**: System MUST display a country-of-origin donut chart showing the top 10 countries by aircraft count.
- **FR-008**: System MUST display live KPI cards: total aircraft, in-flight count, active anomalies (score >25), coverage quality (% of aircraft with fresh data), and last update time.
- **FR-009**: Charts MUST update with smooth animated transitions when new data arrives.
- **FR-010**: System SHOULD display an anomaly timeline sparkline showing anomaly count over the last 2 hours.
- **FR-011**: System SHOULD display a speed-vs-altitude scatter plot colored by risk score.

**Airspace Intelligence (F3)**
- **FR-012**: System MUST render airspace polygons from GeoJSON data with distinct styles: CTR (cyan, dashed), TMA (amber, solid), Restricted/Danger (red, hatched), FIR (white dashed, thin).
- **FR-013**: System MUST allow independent toggling of each airspace layer type.
- **FR-014**: System MUST detect when an aircraft enters a restricted or danger zone using point-in-polygon testing.
- **FR-015**: System MUST generate an alert when an aircraft enters a restricted zone, including callsign, zone name, and time.
- **FR-016**: System SHOULD display occupancy badges on airspace polygons showing live aircraft count inside.

**Weather Integration (F4)**
- **FR-017**: System MUST display airport weather dots colored by flight category: VFR (green), MVFR (blue), IFR (red), LIFR (magenta).
- **FR-018**: System MUST show a decoded METAR popup when a user clicks an airport weather dot, including: wind, visibility, cloud layers, temperature/dewpoint, and QNH.
- **FR-019**: System MUST refresh METAR data at a reasonable interval (every 5-10 minutes).
- **FR-019a**: System MUST use a static bundled list of major airports per region (~50 per region, each with ICAO code and coordinates) as the source for METAR queries.
- **FR-020**: System SHOULD correlate weather conditions with nearby aircraft behavior (e.g., multiple aircraft holding near an IFR airport).

**Situation Reports (F5)**
- **FR-021**: System MUST generate a structured situation report when a user clicks an anomaly aircraft, including: identity, status, position, nearest airport, risk score, and active rules.
- **FR-022**: System MUST include weather data for the nearest airport in the situation report when available.
- **FR-023**: Situation reports MUST be generated client-side using templates with no external AI dependency.

**Holding Pattern Detection (F6)**
- **FR-024**: System MUST store the last 10 positions for each tracked aircraft.
- **FR-024a**: System MUST evict position history for any aircraft not seen in the last 2 polling cycles (~30 seconds), matching the existing stale aircraft cleanup interval.
- **FR-025**: System MUST detect a holding pattern when cumulative heading change exceeds 300 degrees over the stored positions.
- **FR-026**: System MUST display a "HOLDING" badge and a position trail for detected holding aircraft.

**Morocco Airspace Features (F7)**
- **FR-027**: System MUST provide pre-loaded data for major Moroccan airports (GMMN, GMME, GMFF, GMMX, GMTT, GMAD) with one-click weather and traffic summary.
- **FR-028**: System MUST provide a Casablanca FIR focus mode that highlights all aircraft inside the GMMM boundary.

**Exportable Intelligence (F8)**
- **FR-029**: System MUST provide a screenshot mode that hides UI chrome, optimizes for 1200x630px, and adds a watermark.
- **FR-030**: System MUST allow export of anomaly history as a CSV file covering the last 24 hours.

### Key Entities

- **Aircraft**: A tracked airborne or ground vehicle with identity (icao24, callsign), position (lat, lng, altitude, heading), performance (speed, vertical rate), status (squawk, on_ground, spi), and computed attributes (risk score, anomaly flags, position history).
- **Anomaly Alert**: A recorded event when an aircraft triggers one or more risk rules, including the aircraft identity, anomaly type, severity, risk score, position, and detection timestamp.
- **Airspace Zone**: A geographic polygon representing controlled airspace (CTR, TMA, restricted, danger, FIR) with a name, type, altitude bounds, and computed occupancy count.
- **Airport Weather (METAR)**: Decoded weather observation for an airport, including flight category, wind, visibility, cloud layers, temperature, dewpoint, QNH, and observation time.
- **Situation Report**: A structured briefing document combining aircraft data, risk score breakdown, nearest airport, and weather into a professional ATC-style summary.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the highest-risk aircraft in the current view within 3 seconds of looking at the map, based on visual dot differentiation alone.
- **SC-002**: All analytics charts (histogram, donut, KPIs) update within 2 seconds of new data arriving, with no visible flicker or jump.
- **SC-003**: Airport weather dots display accurate flight categories for at least 90% of airports with METAR coverage in the current view.
- **SC-004**: Restricted zone incursion alerts appear within one polling cycle (15 seconds) of an aircraft entering a restricted zone.
- **SC-005**: Situation reports generate and display within 500 milliseconds of user click, with all available fields populated.
- **SC-006**: Holding pattern detection correctly identifies aircraft circling for more than 2 minutes with a false-positive rate below 10%.
- **SC-007**: Screenshot mode produces a clean, share-ready view within 1 second of activation.
- **SC-008**: CSV export completes within 5 seconds and contains all anomaly records from the last 24 hours with correct formatting.
- **SC-009**: The analytics dashboard, weather overlay, and airspace intelligence together load without degrading map rendering performance (map must maintain smooth rendering with 2000+ aircraft).

## Assumptions

- The aviationweather.gov METAR API is free, requires no authentication, and allows up to 100 requests per minute. METAR data is refreshed every 5-10 minutes.
- OpenAIP GeoJSON airspace data is pre-downloaded and bundled with the application (not fetched at runtime) for the regions that need it. It is available under CC BY-NC 4.0 license.
- Holding pattern detection uses a simple heading-change heuristic and is not expected to match the accuracy of professional radar tracking systems.
- The risk scoring weights are initial values that may be tuned based on real-world observation. The additive model is intentionally simple and can be replaced later with more sophisticated approaches.
- Airport data for METAR queries is a static bundled list of ~50 major airports per region (ICAO code, coordinates, name). Morocco airports (F7) are a subset of this list. No dynamic airport discovery is needed.
- The situation report feature is template-based in this iteration. Future integration with an LLM API (e.g., Claude) is planned but out of scope for this specification.
- Screenshot mode uses the browser's native rendering and does not require a server-side image generation service.
