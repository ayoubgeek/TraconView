# Research: Live Flight Anomaly Radar

**Feature**: 001-flight-anomaly-radar
**Date**: 2026-03-11
**Status**: Complete

## R1: OpenSky Network API Integration

**Decision**: Use OpenSky REST API `/api/states/all` with OAuth2 client credentials flow, proxied through a Supabase Edge Function.

**Rationale**: OpenSky provides free ADS-B data with 4,000 credits/day for registered users. The REST API returns aircraft state vectors (position, altitude, velocity, squawk) in a well-documented JSON format. OAuth2 client credentials flow is simpler than user-based auth for server-to-server communication. Proxying hides credentials and enables caching.

**Alternatives considered**:
- Direct client-side API calls → Rejected: exposes credentials, no caching, hits rate limits faster.
- ADS-B Exchange API → Rejected: paid API, no free tier for this scale.
- FlightAware Firehose → Rejected: enterprise-only, expensive.

**Key findings**:
- OpenSky returns data as arrays (not objects) for each aircraft — position indices are fixed.
- Rate limit: registered users get 4,000 credits/day; each `/states/all` call with bounding box costs 1 credit.
- Token endpoint: `https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token`
- Bounding box parameters: `lamin`, `lamax`, `lomin`, `lomax`

## R2: Map Rendering Strategy

**Decision**: Use Leaflet with react-leaflet for the map container and Canvas rendering for aircraft dots.

**Rationale**: Leaflet is the most widely used open-source mapping library. Canvas rendering (vs SVG markers) is essential for performance with 5,000+ dots — DOM-based markers would cause severe jank. CartoDB `dark_matter` tiles are free and match the ATC dark scope aesthetic.

**Alternatives considered**:
- Mapbox GL JS → Rejected: requires API key, free tier has usage caps.
- deck.gl → Rejected: powerful but heavier dependency; Leaflet canvas is sufficient for 5K dots.
- OpenLayers → Rejected: more complex API, smaller React ecosystem.

**Key findings**:
- `react-leaflet` v4 supports React 19.
- Canvas layer must use `L.canvas()` renderer for dots, not individual `L.marker()`.
- Tile URL: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`

## R3: State Management Pattern

**Decision**: Zustand with a single `flightStore` managing aircraft data, anomalies, UI state, and region selection.

**Rationale**: Zustand is minimal, performant, and supports selective subscriptions. A single store avoids prop drilling across the map, sidebar, stats, and header. Zustand doesn't require context providers, simplifying the component tree.

**Alternatives considered**:
- Redux Toolkit → Rejected: heavier boilerplate for this scale.
- React Context + useReducer → Rejected: causes unnecessary re-renders across the component tree.
- Jotai → Viable but less community mindshare for this use case.

## R4: Anomaly Detection Engine Design

**Decision**: Client-side rule engine running in the `useAnomalyEngine` hook, processing each aircraft against a prioritized rule array on every data refresh.

**Rationale**: Detection rules are simple predicate tests (squawk comparison, threshold checks). Running client-side avoids additional server latency. Priority ordering ensures first-match semantics (SQUAWK_7500 > SQUAWK_7700 > etc.).

**Alternatives considered**:
- Server-side detection in Edge Function → Rejected: adds complexity, increases latency, harder to iterate.
- WebWorker-based detection → Rejected: unnecessary for <5K aircraft; main thread can handle it in <2ms.

**Key findings**:
- 6 anomaly rules defined in spec (3 squawk-based, 1 rate-of-descent, 1 speed, 1 SPI).
- Rules are stateless (no temporal correlation needed for MVP).
- Audio alert via Web Audio API or pre-loaded `<audio>` element for CRITICAL anomalies.

## R5: Supabase Edge Function Architecture

**Decision**: Single Deno/TypeScript Edge Function (`opensky-proxy`) handling OAuth2 token refresh, OpenSky API proxying, response caching (15s TTL), and anomaly logging.

**Rationale**: A single function keeps deployment simple. In-memory caching (15s TTL per region key) prevents redundant OpenSky calls when multiple users are viewing the same region. OAuth2 tokens are cached until expiry.

**Alternatives considered**:
- Separate functions for proxy + logging → Rejected: over-engineering for MVP.
- Vercel Serverless Functions → Rejected: user's architecture spec explicitly uses Supabase.

**Key findings**:
- Supabase Edge Functions run Deno — use `Deno.env.get()` for secrets.
- CORS headers needed for cross-origin requests from Vercel frontend.
- Cache can be a simple global `Map<string, { data, timestamp }>` (survives across warm invocations).

## R6: Tailwind CSS 4 with Custom Theme

**Decision**: Tailwind CSS 4 via `@tailwindcss/vite` plugin with CSS custom properties for the ATC dark scope theme.

**Rationale**: Tailwind CSS 4 has simpler configuration (CSS-first), uses `@import "tailwindcss"` rather than directives. Custom properties (CSS vars) for the theme enable easy reuse across components and potential future theme switching.

**Alternatives considered**:
- Vanilla CSS only → Rejected: slower development velocity for responsive layout.
- Tailwind CSS 3 → Rejected: v4 is current (2026), simpler setup with Vite.

**Key findings**:
- Tailwind 4 uses `@import "tailwindcss"` in CSS instead of `@tailwind base/components/utilities`.
- Custom theme via `@theme` block in CSS or `tailwind.config.js`.
- JetBrains Mono (data font) and DM Sans (UI font) loaded via Google Fonts CDN.
