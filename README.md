# TraconView 📡

**Real-time flight tracking radar with anomaly detection, built for aviation enthusiasts and developers.**

TraconView renders live global air traffic on a professional ATC dark-themed map, powered by [OpenSky Network](https://opensky-network.org) data. Click any aircraft to inspect its flight details, view its trajectory, and see real aircraft photos — all updating in real time.

**[▸ Live Demo](https://traconview.vercel.app)** · [License](LICENSE)

![TraconView Screenshot](docs/screenshot.png)

---

## Key Features

- **Live Global Flight Map** — Thousands of aircraft rendered on an interactive Leaflet map with smooth position interpolation between updates
- **Click-to-Inspect Flight Panel** — Slide-out detail panel showing altitude, speed, heading, vertical rate, squawk, airline, country flag, and real aircraft photos (via Planespotters.net)
- **Live Track Polyline** — See an aircraft's trajectory drawn on the map as it moves (up to 500 data points)
- **Anomaly Detection Engine** — Automatic flagging of emergency squawks (7700/7600/7500), rapid descents, unusual altitudes, and high-speed low-altitude flights
- **Regional Presets** — Quick-switch views for Europe, Morocco/MENA, North America, Germany, or Global coverage
- **Smart Rate Limiting** — Adaptive polling with automatic fallback between authenticated and anonymous API access
- **Tab Visibility Pausing** — Stops API polling when the browser tab is hidden to conserve bandwidth and API quota
- **Credential Management** — In-app settings drawer to configure OpenSky Network credentials for higher rate limits

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | React | 19.2 |
| **Build Tool** | Vite | 7.3 |
| **Map** | Leaflet + react-leaflet | 1.9 / 5.0 |
| **Styling** | Tailwind CSS | 4.2 |
| **Icons** | Lucide React | 0.577 |
| **Testing** | Vitest + Testing Library | 4.0 / 16.3 |
| **Linting** | ESLint | 9.39 |
| **Backend Proxy** | Vercel Edge Functions | — |
| **Database** | Supabase (PostgreSQL) | — |
| **Deployment** | Vercel | — |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  useAircraftData (polling loop)                              │
│       │                                                      │
│       ▼                                                      │
│  AircraftDataContext ──► RadarMap ──► AircraftMarker (×N)     │
│       │                     │                                │
│       │                     ├──► FlightTrack (live polyline)  │
│       │                     └──► MapEventsHandler             │
│       │                                                      │
│  SelectionContext ──► FlightPanel (detail slide-out)          │
│  ConnectionContext ──► StatusBadge (live/stale/offline)       │
└───────────────────────────┬──────────────────────────────────┘
                            │ fetch
                            ▼
                ┌───────────────────────┐
                │ /api/opensky-proxy    │  Vercel Edge Function
                │ /api/opensky-auth     │  OAuth2 token endpoint
                │ /api/metar-proxy      │  METAR passthrough
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ OpenSky Network API   │  Live state vectors
                │ Planespotters.net     │  Aircraft photos
                │ Aviation Weather API  │  METAR data
                └───────────────────────┘
```

**Data flow:** The frontend polls the OpenSky API (via Vercel Edge proxy to handle CORS and auth) at 15–30s intervals depending on authentication status. Raw state vector arrays are parsed into typed Aircraft objects, diffed against the previous frame, and rendered imperatively on Leaflet markers for performance. Position interpolation smooths movement between updates.

**State management:** Three React Contexts handle aircraft data (Map of icao24 → Aircraft), selection state (clicked aircraft + focus mode), and connection status (live/stale/offline/rate-limited). Hooks encapsulate all data-fetching logic.

---

## Folder Structure

```
TraconView/
├── src/
│   ├── App.jsx                        # Root component, context providers
│   ├── main.jsx                       # React DOM entry point
│   ├── components/
│   │   ├── RadarMap/RadarMap.jsx       # Main Leaflet map container
│   │   ├── map/
│   │   │   ├── AircraftLayer.jsx      # Imperative marker management (perf)
│   │   │   ├── AircraftMarker.jsx     # Single aircraft marker + tooltip
│   │   │   ├── FlightTrack.jsx        # Live trajectory polyline
│   │   │   ├── FlightRoute.jsx        # Planned route (experimental)
│   │   │   └── SelectedAircraftTrail.jsx
│   │   ├── FlightPanel/               # Right slide-out detail panel
│   │   ├── SettingsDrawer/            # OpenSky credentials UI
│   │   └── StatusBadge/               # Connection status indicator
│   ├── context/                       # React Contexts
│   │   ├── AircraftDataContext.jsx     # Aircraft state storage
│   │   ├── ConnectionContext.jsx       # API connection status
│   │   └── SelectionContext.jsx        # Selected aircraft state
│   ├── hooks/                         # Custom React hooks
│   │   ├── useAircraftData.js         # Main polling loop + rate limiting
│   │   ├── useAircraftTrack.js        # Track point accumulation
│   │   ├── useAircraftEnrichment.js   # Photo fetching + caching
│   │   ├── useCredentials.js          # LocalStorage credential persistence
│   │   ├── useTokenManager.js         # OAuth2 token lifecycle
│   │   ├── useMapViewport.js          # Bounding box on map move
│   │   └── useVisibilityPause.js      # Pause when tab hidden
│   ├── core/
│   │   ├── opensky/                   # OpenSky API client + parser
│   │   └── map/                       # Interpolation + viewport utils
│   ├── lib/                           # Shared utilities
│   │   ├── aircraftDiff.js            # Efficient marker add/remove/move
│   │   ├── iconUtils.js               # Heading-quantized icon cache
│   │   ├── constants.js               # App-wide constants
│   │   └── formatters.js              # Unit conversion helpers
│   ├── services/
│   │   └── enrichmentService.js       # Planespotters.net API client
│   └── utils/                         # Pure utility functions
│       ├── airlines.js                # ICAO prefix → airline name
│       ├── airports.js                # Airport/country lookups
│       ├── format.js, units.js        # Display formatting
│       └── storage.js                 # LocalStorage wrapper
├── api/                               # Vercel Edge Functions
│   ├── opensky-proxy.js               # Proxies OpenSky with caching
│   ├── opensky-auth.js                # OAuth2 client credentials flow
│   └── metar-proxy.js                 # Aviation weather passthrough
├── supabase/
│   ├── migrations/                    # SQL schema (anomaly_log, snapshots)
│   ├── functions/                     # Supabase Edge Functions (Deno)
│   └── config.toml
├── tests/unit/                        # Vitest test suites
├── public/data/                       # Static datasets (airports, airspaces)
├── package.json
├── vite.config.js
├── vercel.json
└── eslint.config.js
```

---

## Installation

### Prerequisites

- **Node.js** 18+ and npm
- **OpenSky Network account** (optional, for higher API rate limits)
- **Supabase project** (optional, for anomaly logging and snapshots)

### Steps

```bash
# Clone the repository
git clone https://github.com/your-username/TraconView.git
cd TraconView

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials (see [Configuration](#configuration)).

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Usage

### Basic Operation

1. Open the app — the map loads centered on Germany with live aircraft data
2. **Pan and zoom** to explore different regions, or use the region presets
3. **Click any aircraft marker** to open the Flight Panel with detailed information
4. The **StatusBadge** (bottom-left) shows connection status: `LIVE`, `STALE`, `OFFLINE`, or `RATE LIMITED`

### Authenticated Mode

1. Click the gear icon on the StatusBadge to open Settings
2. Enter your OpenSky Network username and password
3. The app switches to authenticated mode with faster polling (15s vs 30s)
4. Credentials are stored in your browser's localStorage — never sent to third parties

### Regional Presets

Switch between predefined map views to focus on specific areas:

| Region | Coverage |
|--------|----------|
| Europe | Continental Europe |
| Morocco / MENA | North Africa & Middle East |
| North America | USA & Canada |
| Germany | Default view |
| Global | Worldwide |

---

## API Integrations

### OpenSky Network (Primary Data Source)

- **Endpoint:** `/states/all` — returns state vectors for all tracked aircraft
- **Anonymous:** ~400 requests/hour, 30s polling interval
- **Authenticated:** Higher quota, 15s polling interval
- **Proxy:** Requests are routed through `/api/opensky-proxy` (Vercel Edge Function) to handle CORS and caching

### Planespotters.net (Aircraft Photos)

- Fetches real aircraft photos by ICAO24 hex identifier
- In-memory cache prevents duplicate requests per session

### Aviation Weather (METAR)

- METAR weather data proxied through `/api/metar-proxy`
- Infrastructure exists; full UI integration is in progress

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | No | Supabase project URL (for anomaly logging) |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key |

OpenSky credentials are configured through the in-app Settings drawer and stored in browser localStorage.

### Supabase Setup (Optional)

If you want anomaly logging and radar snapshots:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy opensky-proxy
supabase functions deploy compute-snapshot
```

### Vercel Deployment

The project is configured for Vercel with `vercel.json`. Edge Functions in `/api` are automatically deployed as serverless functions.

```bash
# Deploy to Vercel
npx vercel
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR (`localhost:5173`) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest test suites |
| `npm run lint` | Run ESLint across the project |

---

## Performance Design Decisions

These choices were made to handle rendering thousands of aircraft markers without frame drops:

- **Imperative marker management** — `aircraftDiff.js` calculates add/remove/move diffs instead of re-rendering all markers declaratively. This avoids destroying and recreating 5000+ DOM elements per update cycle.
- **Icon caching by heading** — Aircraft icons are quantized to 5° increments and cached, preventing SVG regeneration on every frame.
- **Linear position interpolation** — Aircraft smoothly glide between API updates instead of jumping, creating a fluid visual experience.
- **Stale aircraft cleanup** — Aircraft without position updates for 60 seconds are automatically removed (cleanup runs every 10s) to prevent memory leaks.
- **Debounced viewport queries** — Map pan/zoom events are debounced at 500ms to avoid excessive API calls during user interaction.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and ensure tests pass: `npm test && npm run lint`
4. Commit with a descriptive message
5. Open a Pull Request against `main`

### Code Conventions

- JavaScript ES2022+ with JSX (no TypeScript requirement, but JSDoc types encouraged)
- Tailwind CSS for styling — no custom CSS unless necessary
- Custom hooks for all data-fetching and side-effect logic
- React Context for cross-component state (no Redux/Zustand currently in use)

---

## Roadmap

- [ ] Full METAR weather integration in the UI
- [ ] Anomaly alert feed sidebar with real-time notifications
- [ ] Statistics dashboard with altitude/speed distribution charts
- [ ] Airspace overlay rendering (GeoJSON CTR/TMA boundaries)
- [ ] Zustand store migration for centralized state management
- [ ] Incremental TypeScript adoption on critical paths
- [ ] Flight route visualization (pending reliable route data source)
- [ ] Marker clustering at low zoom levels

---

## License

[MIT](LICENSE) — Copyright (c) 2026 TraconView
