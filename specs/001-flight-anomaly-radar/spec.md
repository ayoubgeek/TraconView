# Feature Specification: Live Flight Anomaly Radar

**Feature Branch**: `001-flight-anomaly-radar`
**Created**: 2026-03-11
**Status**: Draft
**Input**: User description: "TraconView — Live flight anomaly radar that tracks aircraft in real-time via OpenSky ADS-B data, highlights emergencies, rapid descents, and unusual behavior on a dark ATC-style map."

## Clarifications

### Session 2026-03-11

- Q: How should the system behave when the daily API credit limit is exhausted? → A: Switch to degraded mode with reduced polling frequency (e.g., every 60s instead of 15s).
- Q: How long after an aircraft's last reported position should it be considered stale and removed from the map? → A: 60 seconds — keeps aircraft visible through brief coverage gaps while cleaning up departed aircraft.
- Q: Should the system play an audio alert sound when a critical anomaly is detected? → A: Yes — play a short alert tone for CRITICAL severity anomalies only (7700, 7500), with a mute toggle in the header.
- Q: Should the anomaly history log and alert sidebar show anomalies from all regions or only the current region? → A: Global — log and display anomalies from all regions regardless of current selection.
- Q: Should the application display a visible disclaimer stating it is not for operational/ATC use? → A: Yes — small persistent footer text: "For informational purposes only. Not for operational use."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Live Aircraft Monitoring (Priority: P1)

As an aviation enthusiast or analyst, I want to see live aircraft positions plotted on a dark, ATC-style map so that I can monitor real-time air traffic at a glance.

**Why this priority**: The core value proposition of TraconView is visualizing live flights. Without aircraft dots on a map, no other feature (anomalies, alerts, stats) has any meaning.

**Independent Test**: Can be fully tested by opening the application and observing aircraft appearing on the map, updating their positions automatically. Delivers immediate situational awareness.

**Acceptance Scenarios**:

1. **Given** the application is loaded, **When** the map initializes, **Then** aircraft positions are displayed as dots on a dark-themed map with ATC-style styling.
2. **Given** the map is showing aircraft, **When** the auto-refresh interval elapses (every 15 seconds), **Then** aircraft positions are updated to reflect their latest reported locations.
3. **Given** the map is showing aircraft, **When** I click on an aircraft dot, **Then** a detail panel appears showing callsign, altitude (ft), speed (kts), heading, vertical rate, squawk code, and data source.
4. **Given** the map is loaded, **When** no data is available (network error or API outage), **Then** a clear status indicator shows the system is offline/degraded and last-known positions remain visible.

---

### User Story 2 - Anomaly Detection & Alerting (Priority: P1)

As a user, I want the system to automatically detect and highlight flight anomalies (emergency squawk codes, rapid descents, unusual speeds) so that I immediately see when something is wrong.

**Why this priority**: This is the differentiating feature ("FR24 tells you where planes are. TraconView tells you when something's wrong."). Without anomaly detection, this is just another flight tracker.

**Independent Test**: Can be tested by observing the map and alert sidebar when aircraft with emergency squawk codes (7700, 7500, 7600) or rapid descent profiles appear. Anomalous aircraft must be visually distinct.

**Acceptance Scenarios**:

1. **Given** an aircraft is transmitting squawk 7700 (general emergency), **When** the data refreshes, **Then** the aircraft dot pulses red and an alert appears in the live feed with severity CRITICAL.
2. **Given** an aircraft is transmitting squawk 7500 (hijack), **When** the data refreshes, **Then** the aircraft is flagged CRITICAL with distinct visual treatment.
3. **Given** a CRITICAL anomaly is detected (squawk 7700 or 7500), **When** the alert fires, **Then** a short audio alert tone plays (unless the user has muted alerts via the header toggle).
3. **Given** an aircraft is transmitting squawk 7600 (radio failure), **When** the data refreshes, **Then** the aircraft is flagged HIGH severity with orange visual treatment.
4. **Given** an aircraft is descending faster than 2,000 ft/min above 5,000 ft and is not on the ground, **When** the data refreshes, **Then** the aircraft is flagged MEDIUM severity as "RAPID DESCENT" with yellow visual treatment.
5. **Given** an aircraft at FL250+ is travelling below 150 kts, **When** the data refreshes, **Then** the aircraft is flagged LOW severity as "SLOW SPEED."
6. **Given** an aircraft has the SPI (Special Position Identification) flag active, **When** the data refreshes, **Then** the aircraft is flagged LOW severity with blue visual treatment.

---

### User Story 3 - Alert Feed Sidebar (Priority: P1)

As a user, I want a live alert sidebar that shows a chronological feed of detected anomalies with severity badges and timestamps so that I can track events without manually scanning the map.

**Why this priority**: The alert sidebar is the primary interface for consuming anomaly information. It transforms raw detection into actionable intelligence.

**Independent Test**: Can be tested by observing the sidebar as anomalies are detected — each entry must show callsign, anomaly type, severity badge, altitude, vertical rate, and UTC timestamp.

**Acceptance Scenarios**:

1. **Given** an anomaly is detected, **When** it is added to the alert feed, **Then** it appears at the top of the sidebar with the aircraft callsign, anomaly label, severity color badge, altitude, vertical rate, and timestamp in UTC.
2. **Given** the alert feed has entries, **When** I click on an alert entry, **Then** the map centers on the corresponding aircraft and opens its detail panel.
3. **Given** the alert feed has entries, **When** the list exceeds the maximum history (50 entries), **Then** the oldest entries are removed to maintain performance.

---

### User Story 4 - Region Selection (Priority: P2)

As a user, I want to quickly switch between predefined geographic regions (Morocco/MENA, Europe, North America, Germany, Global) so that I can focus on the area of interest without manual map panning.

**Why this priority**: Region selection is essential for usability — watching global traffic is overwhelming without the ability to focus on specific areas.

**Independent Test**: Can be tested by clicking region buttons and observing the map viewport change to the expected geographic area with appropriate zoom level.

**Acceptance Scenarios**:

1. **Given** the region selector is displayed, **When** I click "Europe," **Then** the map pans and zooms to center on Europe and data request is scoped to the European bounding box.
2. **Given** any region is selected, **When** I click a different region, **Then** the map transitions to the new region and data refreshes for the new bounding box.
3. **Given** the application loads for the first time, **When** no region has been selected, **Then** the default region (Europe) is pre-selected.

---

### User Story 5 - Airspace Overlay (Priority: P2)

As a user, I want to see airspace boundaries (CTR, TMA, Restricted, FIR) overlaid on the map so that I can contextualize aircraft positions relative to controlled and restricted airspace.

**Why this priority**: Airspace context enriches the monitoring experience and helps users understand why certain flight behaviors may be anomalous.

**Independent Test**: Can be tested by toggling airspace overlays and verifying polygon shapes appear on the map with correct color-coding per airspace class.

**Acceptance Scenarios**:

1. **Given** the map is loaded, **When** airspace data is available, **Then** airspace polygons are rendered on the map with distinct color fills per type (CTR=cyan, TMA=amber, Restricted=red, FIR=subtle white).
2. **Given** airspace polygons are displayed, **When** I hover on an airspace polygon, **Then** a tooltip shows the airspace name, class, and altitude bounds.

---

### User Story 6 - Statistics Dashboard (Priority: P2)

As a user, I want a stats panel showing live statistics (aircraft count, altitude distribution histogram, region breakdown) so that I can understand aggregate traffic patterns at a glance.

**Why this priority**: Stats provide macro-level situational awareness that complements the micro-level detail of individual aircraft tracking.

**Independent Test**: Can be tested by observing the stats panel update as new data arrives — aircraft count, altitude histogram bars, and region breakdown charts should reflect current data.

**Acceptance Scenarios**:

1. **Given** aircraft data is available, **When** the stats panel is displayed, **Then** it shows the total number of tracked aircraft.
2. **Given** aircraft data is available, **When** the stats panel is displayed, **Then** it shows an altitude distribution histogram.
3. **Given** aircraft data is available, **When** data refreshes, **Then** all statistics update to reflect the latest data.

---

### User Story 7 - System Health & Status (Priority: P3)

As a user, I want to see the system's connection status (live/offline/degraded), last data refresh time, and API health so that I trust the data I'm looking at.

**Why this priority**: Trust and transparency are important but secondary to the core flight monitoring and anomaly detection features.

**Independent Test**: Can be tested by observing the header status indicator under normal conditions (green/LIVE) and simulating network disconnect (red/OFFLINE).

**Acceptance Scenarios**:

1. **Given** the system is receiving data normally, **When** I look at the header, **Then** a green "LIVE" indicator is visible.
2. **Given** the data source becomes unavailable, **When** the next refresh cycle fails, **Then** the status indicator changes to red/OFFLINE.
3. **Given** the application is loaded, **When** I look at the footer, **Then** a persistent disclaimer reads "For informational purposes only. Not for operational use."

---

### User Story 8 - Mobile-Responsive Layout (Priority: P3)

As a mobile user, I want to access the application on my phone with the map full-screen and the alert sidebar in a collapsible drawer so that I can monitor flights on the go.

**Why this priority**: Mobile access extends the product's reach but is a polish feature — the primary experience is desktop.

**Independent Test**: Can be tested by accessing the application on a mobile viewport and verifying the map fills the screen and the sidebar is accessible via a drawer toggle.

**Acceptance Scenarios**:

1. **Given** I access the application on a device with a viewport narrower than 768px, **When** the page loads, **Then** the map fills the entire screen and the sidebar is hidden in a collapsible drawer.
2. **Given** I am on a mobile device, **When** I tap the sidebar toggle, **Then** the alert drawer slides in from the right.

---

### Edge Cases

- What happens when the data source returns zero aircraft for a region? → Display an empty map with a "No aircraft in range" message.
- What happens when an aircraft has no callsign? → Display the ICAO24 hex code as a fallback identifier.
- What happens when an aircraft's position data is null? → Skip rendering that aircraft on the map but still process it for anomaly detection if squawk data is available.
- What happens when the data refresh fails multiple times in a row (>3 consecutive failures)? → Show a degraded/offline status and stop polling until the user manually retries or the system recovers.
- What happens when an anomaly clears (e.g., squawk returns to normal)? → Remove the anomaly highlight from the aircraft dot but keep the alert entry in the sidebar history.
- What happens when the daily API credit limit is exhausted? → Switch to degraded mode with reduced polling frequency (every 60 seconds instead of 15), show DEGRADED status, and resume normal polling when credits reset.
- What happens when an aircraft has not reported a position for over 60 seconds? → Remove it from the map display. If the aircraft had an active anomaly, the alert entry remains in the sidebar history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display live aircraft positions on a dark-themed map, refreshing every 15 seconds.
- **FR-002**: System MUST transform raw flight data into a normalized internal model with altitude in feet, speed in knots, and vertical rate in ft/min.
- **FR-003**: System MUST detect anomalies based on a prioritized rule set: squawk 7500 (hijack) > squawk 7700 (emergency) > squawk 7600 (radio failure) > rapid descent > unusual speed > SPI active.
- **FR-004**: System MUST visually distinguish anomalous aircraft from normal aircraft using severity-coded colors (critical=red, high=orange, medium=yellow, low=blue) and pulsing animations for critical/high severity.
- **FR-005**: System MUST display a live alert feed sidebar showing detected anomalies with callsign, anomaly type, severity badge, altitude, vertical rate, and UTC timestamp.
- **FR-006**: System MUST support region presets (Morocco/MENA, Europe, North America, Germany, Global) with bounding-box-scoped data fetching.
- **FR-007**: System MUST display a click-to-inspect detail panel for individual aircraft showing all available flight data.
- **FR-008**: System MUST overlay airspace boundaries (CTR, TMA, Restricted, FIR) from static GeoJSON data with color-coded polygon fills.
- **FR-009**: System MUST show aggregate statistics including aircraft count, altitude distribution histogram, and region breakdown.
- **FR-010**: System MUST indicate connection health status (LIVE/OFFLINE/DEGRADED) in the header.
- **FR-011**: System MUST proxy all flight data API requests through a backend service that handles authentication and caching to protect credentials and manage rate limits.
- **FR-012**: System MUST log detected anomalies to persistent storage for historical review. Anomaly history MUST be global (all regions), not scoped to the currently selected region.
- **FR-013**: System MUST limit the alert feed to the 50 most recent entries to maintain UI performance.
- **FR-014**: System MUST be responsive, providing a mobile layout with a full-screen map and a collapsible sidebar drawer on viewports narrower than 768px.
- **FR-015**: System MUST include appropriate meta tags and social preview images for link sharing (e.g., LinkedIn, Twitter).
- **FR-016**: System MUST switch to degraded polling mode (60-second intervals) when the daily API credit limit is approaching or exhausted, displaying a DEGRADED status indicator, and resume normal polling (15-second intervals) when credits reset.
- **FR-017**: System MUST remove aircraft from the map display when their last reported position is older than 60 seconds, while retaining any associated anomaly entries in the alert sidebar history.
- **FR-018**: System MUST play a short audio alert tone when a CRITICAL severity anomaly is detected (squawk 7700 or 7500), and MUST provide a visible mute/unmute toggle in the header to control audio alerts.
- **FR-019**: System MUST display a persistent footer disclaimer: "For informational purposes only. Not for operational use."

### Key Entities

- **Aircraft**: A tracked flight with identity (ICAO24, callsign), position (lat, lng), flight parameters (altitude, speed, heading, vertical rate), status indicators (squawk, SPI, on-ground), and data source. Central entity around which all features revolve.
- **Anomaly**: A detected deviation from normal flight behavior, characterized by type (emergency squawk, rapid descent, slow speed, SPI), severity (critical, high, medium, low), the triggering aircraft, detection timestamp, and the region where detection occurred. Anomaly history is global across all regions.
- **Region**: A predefined geographic area defined by a bounding box (north, south, east, west boundaries), a center point, a default zoom level, and a display label. Used to scope data requests and control the map viewport.
- **Airspace**: A geographic polygon representing controlled or restricted airspace, characterized by type (CTR, TMA, Restricted, FIR), name, altitude bounds, and visual styling.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see live aircraft positions updating on the map within 20 seconds of opening the application.
- **SC-002**: Emergency squawk codes (7700, 7500, 7600) are detected and visually highlighted within one data refresh cycle (≤15 seconds) of the aircraft transmitting the code.
- **SC-003**: Users can switch between 5 predefined regions in under 2 seconds (map transition + data load).
- **SC-004**: Users can click any aircraft dot and see its full details within 1 second.
- **SC-005**: The alert sidebar accurately reflects all currently detected anomalies with no false negatives for squawk-based anomalies.
- **SC-006**: The application remains usable and responsive when tracking up to 5,000 aircraft simultaneously.
- **SC-007**: The application is usable on both desktop and mobile viewports without loss of core functionality (map view + alert feed).
- **SC-008**: The system correctly persists detected anomalies for at least 24 hours of history.
- **SC-009**: The application loads and becomes interactive within 5 seconds on a standard broadband connection.

## Assumptions

- Users are aviation enthusiasts, analysts, or students — not certified air traffic controllers. The application is informational, not operational.
- OpenSky Network REST API remains freely available with registered user credentials (4,000 credits/day).
- Airspace boundary data from OpenAIP is available under CC BY-NC 4.0 and can be served as static GeoJSON files.
- The application is read-only — no user accounts, no user-generated content, no write operations from end users.
- All times are displayed in UTC, consistent with aviation standards.
- The default region is Europe on first load.
- The alert history is limited to 50 entries in the UI for performance, but up to 24 hours in persistent storage.
