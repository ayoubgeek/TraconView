# 📡 TraconView

<div align="center">
  <p><strong>Real-time flight tracking radar with anomaly detection, built for aviation enthusiasts and developers.</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  
  <h3>
    <a href="https://traconview.vercel.app">Live Demo</a>
    <span> | </span>
    <a href="#installation">Installation</a>
    <span> | </span>
    <a href="#architecture">Architecture</a>
  </h3>
</div>

<br />

<div align="center">
  <img src="docs/screenshot.png" alt="TraconView Screenshot" width="100%" style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.5);" />
</div>

<br />

TraconView renders live global air traffic on a professional ATC dark-themed map, powered by [OpenSky Network](https://opensky-network.org) data. Designed with performance in mind, it provides real-time aircraft tracking, trajectory mapping, and automated anomaly detection.

---

## ✨ Features

- **Live Global Flight Map** — Thousands of aircraft rendered on an interactive Leaflet map with smooth position interpolation.
- **Click-to-Inspect Flight Panel** — Slide-out detail panel showing full telemetry, airline, flag, and real aircraft photos (via Planespotters.net).
- **Live Track Visualization** — Visualizes an aircraft's trajectory dynamically on the map.
- **Anomaly Detection Engine** — Automatic flagging of emergency squawks (7700/7600/7500), rapid descents, and unusual flight profiles.
- **Smart Resource Management** — Adaptive polling with automatic fallback, and tab visibility pausing to conserve API quotas.
- **Regional Presets** — Instantly snap the camera to Europe, MENA, North America, or Global views.

---

## 🏗 Architecture

At its core, TraconView uses imperative marker rendering to achieve 60 FPS while tracking thousands of rapid state vectors.

```text
Browser (React) ◄──► AircraftDataContext ──► RadarMap ──► Leaflet Markers (Canvas)
                             ▲
                             │ (Polls 15-30s)
                             ▼
                    Vercel Edge Proxy
                             ▲
                             │
                  OpenSky Network API
```

### Performance Decisions
- **Imperative DOM Management:** Diffs and updates markers directly via Leaflet rather than React reconciliation to prevent frame drops in the DOM tree.
- **Icon Quantization:** Aircraft SVGs are pre-rotated into 5° buckets and cached, avoiding continuous SVG path recalculations.
- **Linear Interpolation:** Predicts aircraft movement between 15-second polling intervals for fluid on-screen motion.

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm or pnpm
- (Optional) OpenSky Network credentials for enhanced rate limits

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/TraconView.git
cd TraconView

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the application in your browser.

---

## 🛠 Configuration

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | No | Supabase backend URL (used for anomaly logging) |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous public key |

*Note: OpenSky network credentials can be securely configured at runtime within the application settings.*

---

## 🔌 Integrations

1. **OpenSky Network (Primary):** Supplies real-time state vectors. Proxied through Vercel Edge (`/api/opensky-proxy`) to resolve CORS constraints and manage caching logic.
2. **Planespotters.net:** Fetches real-world aircraft photography based on ICAO24 hex codes dynamically.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

<div align="center">
  <p>Copyright © 2026 TraconView. Released under the <a href="LICENSE">MIT License</a>.</p>
</div>
