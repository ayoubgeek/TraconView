# TraconView 📡 Live Flight Anomaly Radar

TraconView is a high-performance React/Vite application that proxies OpenSky Network data through Supabase Edge Functions to render live air traffic in a professional Air Traffic Control (ATC) dark theme. It features a real-time anomaly detection engine designed to identify unusual patterns like rapid descents, 7700 squawks, and unusual altitudes.

## Features
- **Live Canvas Map:** High-performance `<canvas>` rendering mapping thousands of aircraft natively on Leaflet without stuttering.
- **Real-Time Anomaly Engine:** Scans streams for 7700/7600/7500 squawks, rapid descents, unusual altitudes, and high-speed low-altitude flights.
- **Alert Feed Sidebar:** Collapsible drawer logging anomaly history.
- **Statistics Dashboard:** Auto-updating Recharts histograms of altitude distribution.
- **Airspace Overlay:** Dynamic loading of GeoJSON CTRs/TMAs.

## Getting Started

1. Clone and install dependencies:
```bash
npm install
```

2. Copy `.env.local.example` to `.env.local` and add your Supabase keys.
```
VITE_SUPABASE_URL="YOUR_URL"
VITE_SUPABASE_ANON_KEY="YOUR_KEY"
```

3. Deploy Edge functions:
```bash
supabase functions deploy opensky-proxy
```

4. Run locally:
```bash
npm run dev
```

## Running Tests
Tests use Vitest to validate formatters, OpenSky serializers, and the Anomaly Rules Engine.
```bash
npm run test
```
