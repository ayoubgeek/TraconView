# TraconView — Complete Setup Guide (Zero to Deployed)

Every single step. Nothing skipped. Screenshots described.

---

## PHASE 1: Create Accounts (15 minutes)

You need 4 free accounts. Open each in a new tab:

### 1.1 — GitHub Account
**Skip if you already have one.**
- Go to: https://github.com
- Sign up or log in
- You'll create the repo later

### 1.2 — OpenSky Network Account
- Go to: https://opensky-network.org
- Click "Sign Up" (top right)
- Fill: username, email, password
- Verify email
- **After login:** go to https://opensky-network.org/account
- Scroll down to **"API Client"** section (bottom right)
- Click **"Create API Client"**
- A file called `credentials.json` will download
- **Open it** — you'll see:
```json
{
  "client_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "client_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```
- **SAVE THIS FILE** — you need both values later
- You cannot see the client_secret again on the website

### 1.3 — Supabase Account
- Go to: https://supabase.com
- Click "Start your project" → Sign in with GitHub
- Authorize Supabase to access your GitHub

### 1.4 — Vercel Account
- Go to: https://vercel.com
- Click "Sign Up" → Sign in with GitHub
- Authorize Vercel to access your GitHub

---

## PHASE 2: Create GitHub Repository (5 minutes)

### 2.1 — Create the repo
- Go to: https://github.com/new
- Repository name: `traconview`
- Description: `Live flight anomaly radar — real-time ADS-B tracking with emergency detection`
- Select: **Public**
- Check: **Add a README file**
- Add .gitignore: select **Node**
- License: **MIT License**
- Click **"Create repository"**

### 2.2 — Clone to your computer
Open your terminal:
```bash
git clone https://github.com/YOUR_USERNAME/traconview.git
cd traconview
```
Replace `YOUR_USERNAME` with your actual GitHub username.

---

## PHASE 3: Set Up Supabase Project (10 minutes)

### 3.1 — Create a new Supabase project
- Go to: https://supabase.com/dashboard
- Click **"New Project"**
- Organization: select your default org (or create one, name it anything)
- Project name: `traconview`
- Database password: **generate a strong one and SAVE IT** (you won't see it again)
- Region: choose **EU West (Ireland)** (closest to Morocco for low latency)
- Pricing Plan: **Free** (already selected)
- Click **"Create new project"**
- Wait 2-3 minutes for it to spin up (you'll see a loading screen)

### 3.2 — Get your Supabase credentials
Once the project is ready:
- Go to: **Settings** (gear icon in left sidebar) → **API**
- You'll see:

| Field | Where to find it | What it's for |
|---|---|---|
| **Project URL** | Under "Project URL" | `https://xxxxx.supabase.co` |
| **anon public key** | Under "Project API Keys" → `anon` `public` | Safe for frontend |
| **service_role key** | Under "Project API Keys" → `service_role` `secret` | Backend only, NEVER in frontend |

- **Copy the Project URL** — save it somewhere
- **Copy the anon public key** — save it somewhere
- You do NOT need the service_role key for this project

### 3.3 — Create the database table
- In Supabase dashboard, click **"SQL Editor"** (left sidebar, looks like a terminal icon)
- Click **"New Query"**
- Paste this exact SQL:

```sql
-- ============================================
-- TraconView Database Schema
-- ============================================

-- Table: anomaly_log
-- Stores detected flight anomalies for history
CREATE TABLE IF NOT EXISTS anomaly_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  icao24 text NOT NULL,
  callsign text,
  anomaly_type text NOT NULL,
  severity text NOT NULL,
  latitude double precision,
  longitude double precision,
  altitude_ft integer,
  vertical_rate_fpm integer,
  squawk text,
  speed_kts integer,
  heading integer,
  origin_country text,
  region text,
  detected_at timestamptz DEFAULT now()
);

-- Index for fast time-based queries
CREATE INDEX IF NOT EXISTS idx_anomaly_detected_at
  ON anomaly_log(detected_at DESC);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_anomaly_type
  ON anomaly_log(anomaly_type);

-- Enable Row Level Security
ALTER TABLE anomaly_log ENABLE ROW LEVEL SECURITY;

-- Policy: allow anonymous reads (for the frontend to show history)
CREATE POLICY "Allow public read access"
  ON anomaly_log
  FOR SELECT
  TO anon
  USING (true);

-- Policy: allow inserts from Edge Functions (service role)
CREATE POLICY "Allow service insert"
  ON anomaly_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also allow anon inserts (since we're calling from frontend via Edge Function)
CREATE POLICY "Allow anon insert"
  ON anomaly_log
  FOR INSERT
  TO anon
  WITH CHECK (true);
```

- Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
- You should see: `Success. No rows returned`
- To verify: click **"Table Editor"** in left sidebar → you should see `anomaly_log` table

### 3.4 — Set up the Edge Function for OpenSky proxy

#### 3.4.1 — Install Supabase CLI on your computer
```bash
# On macOS
brew install supabase/tap/supabase

# On Windows (PowerShell as admin)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# On Linux
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/scripts/install.sh | bash

# Verify installation
supabase --version
```

#### 3.4.2 — Log in to Supabase CLI
```bash
supabase login
```
This opens your browser → click "Authorize" → return to terminal.

#### 3.4.3 — Initialize Supabase in your project
```bash
cd traconview
supabase init
```
This creates a `supabase/` folder in your project.

#### 3.4.4 — Link to your remote project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**How to find YOUR_PROJECT_REF:**
- Go to Supabase Dashboard → Settings → General
- Under "Reference ID" — it's a string like `abcdefghijklmnop`
- Copy that string and paste it in the command above

It will ask for your database password (the one you saved in step 3.1).

#### 3.4.5 — Create the Edge Function
```bash
supabase functions new opensky-proxy
```
This creates: `supabase/functions/opensky-proxy/index.ts`

#### 3.4.6 — Write the Edge Function code

Open `supabase/functions/opensky-proxy/index.ts` and replace ALL content with:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENSKY_TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const OPENSKY_API_URL = "https://opensky-network.org/api/states/all";

const REGIONS: Record<string, { lamin: number; lamax: number; lomin: number; lomax: number }> = {
  MOROCCO: { lamin: 20, lamax: 37, lomin: -18, lomax: 5 },
  EUROPE: { lamin: 35, lamax: 60, lomin: -10, lomax: 30 },
  NORTH_AMERICA: { lamin: 25, lamax: 50, lomin: -130, lomax: -65 },
  GERMANY: { lamin: 47, lamax: 55, lomin: 5.5, lomax: 15.5 },
  GLOBAL: { lamin: -60, lamax: 70, lomin: -180, lomax: 180 },
};

// Simple in-memory cache
let cachedData: { data: unknown; timestamp: number; region: string } | null = null;
const CACHE_TTL_MS = 12000; // 12 seconds

// Token management
let accessToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt - 30000) {
    return accessToken;
  }

  const clientId = Deno.env.get("OPENSKY_CLIENT_ID");
  const clientSecret = Deno.env.get("OPENSKY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Missing OpenSky credentials");
  }

  const resp = await fetch(OPENSKY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Token request failed: ${resp.status}`);
  }

  const json = await resp.json();
  accessToken = json.access_token;
  tokenExpiresAt = Date.now() + (json.expires_in || 1800) * 1000;
  return accessToken!;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const regionKey = url.searchParams.get("region") || "EUROPE";
    const region = REGIONS[regionKey] || REGIONS.EUROPE;

    // Check cache
    if (
      cachedData &&
      cachedData.region === regionKey &&
      Date.now() - cachedData.timestamp < CACHE_TTL_MS
    ) {
      return new Response(JSON.stringify(cachedData.data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Cache": "HIT",
        },
      });
    }

    // Get OAuth2 token
    const token = await getToken();

    // Call OpenSky API
    const params = new URLSearchParams({
      lamin: region.lamin.toString(),
      lamax: region.lamax.toString(),
      lomin: region.lomin.toString(),
      lomax: region.lomax.toString(),
    });

    const openSkyResp = await fetch(`${OPENSKY_API_URL}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const rateLimitRemaining = openSkyResp.headers.get("X-Rate-Limit-Remaining");

    if (!openSkyResp.ok) {
      return new Response(
        JSON.stringify({
          error: `OpenSky returned ${openSkyResp.status}`,
          rateLimitRemaining,
        }),
        {
          status: openSkyResp.status === 429 ? 429 : 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const data = await openSkyResp.json();

    // Cache the response
    const responseBody = {
      time: data.time,
      states: data.states || [],
      region: regionKey,
      rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : null,
    };

    cachedData = {
      data: responseBody,
      timestamp: Date.now(),
      region: regionKey,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
```

#### 3.4.7 — Store OpenSky secrets
```bash
supabase secrets set OPENSKY_CLIENT_ID=paste-your-client-id-here
supabase secrets set OPENSKY_CLIENT_SECRET=paste-your-client-secret-here
```
Use the values from the `credentials.json` file you downloaded in step 1.2.

#### 3.4.8 — Deploy the Edge Function
```bash
supabase functions deploy opensky-proxy --no-verify-jwt
```

The `--no-verify-jwt` flag allows the frontend to call it without Supabase auth (simpler for MVP).

#### 3.4.9 — Test the Edge Function
```bash
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/opensky-proxy?region=MOROCCO"
```

You should see JSON with `time`, `states` (array of aircraft), and `rateLimitRemaining`.

If you see an error, check:
- Did you set the secrets correctly? `supabase secrets list`
- Is the function deployed? Check Supabase Dashboard → Edge Functions

---

## PHASE 4: Set Up Vercel + React Project (10 minutes)

### 4.1 — Scaffold the React project locally
```bash
cd traconview

# Remove the default README (we'll rewrite it later)
rm README.md

# Create Vite React project IN the current directory
npm create vite@latest . -- --template react

# When it asks "Current directory is not empty. Please choose how to proceed":
# Select: "Ignore files and continue"
```

### 4.2 — Install all dependencies
```bash
npm install

# Map + UI
npm install react-leaflet leaflet

# State management
npm install zustand

# Charts
npm install recharts

# Icons
npm install lucide-react

# Supabase client
npm install @supabase/supabase-js

# Tailwind CSS 4 (Vite plugin)
npm install -D tailwindcss @tailwindcss/vite
```

### 4.3 — Configure Tailwind CSS

Open `vite.config.js` and replace with:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

Replace the content of `src/index.css` with:
```css
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --bg-primary: #050510;
  --bg-panel: #0a0f1aee;
  --bg-card: #111827;
  --dot-normal: #1e6a7a;
  --dot-emergency: #ef4444;
  --dot-warning: #f97316;
  --dot-caution: #eab308;
  --dot-info: #3b82f6;
  --accent-green: #22c55e;
  --font-data: 'JetBrains Mono', monospace;
  --font-ui: 'DM Sans', sans-serif;
}

body {
  margin: 0;
  padding: 0;
  background: var(--bg-primary);
  color: #e2e8f0;
  font-family: var(--font-ui);
  overflow: hidden;
}
```

### 4.4 — Create environment variables file
Create a file called `.env.local` in the project root:
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Replace with your actual values from step 3.2.

**IMPORTANT:** Make sure `.env.local` is in `.gitignore` (it should be by default with the Node .gitignore).

### 4.5 — Verify the local dev server works
```bash
npm run dev
```
Open http://localhost:5173 — you should see the Vite React starter page on a dark background.

Press Ctrl+C to stop.

### 4.6 — Push to GitHub
```bash
git add .
git commit -m "Initial setup: React + Vite + Tailwind + Supabase"
git push origin main
```

### 4.7 — Deploy to Vercel

#### Option A: Via Vercel Dashboard (easiest)
- Go to: https://vercel.com/new
- Click **"Import Git Repository"**
- Find `traconview` in the list → click **"Import"**
- Framework Preset: **Vite** (should auto-detect)
- Root Directory: `./` (default)
- Build Command: `npm run build` (default)
- Output Directory: `dist` (default)
- **Environment Variables:** click "Add" and add:
  - `VITE_SUPABASE_URL` = `https://YOUR_PROJECT_REF.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `your-anon-public-key`
- Click **"Deploy"**
- Wait 1-2 minutes
- Your site is live at: `traconview.vercel.app` (or similar)

#### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
# Follow prompts:
#   Set up and deploy? → Y
#   Which scope? → your account
#   Link to existing project? → N
#   Project name? → traconview
#   Directory? → ./
#   Override settings? → N
```

### 4.8 — Verify deployment
Open your Vercel URL (e.g., `https://traconview.vercel.app`) — you should see the same dark page.

**From now on, every `git push` to `main` will auto-deploy to Vercel.**

---

## PHASE 5: Verify Everything is Connected (5 minutes)

### 5.1 — Test the full pipeline
Create a quick test file. Add this to `src/App.jsx` temporarily:

```jsx
import { useState, useEffect } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/opensky-proxy?region=MOROCCO`)
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{
      background: '#050510',
      color: '#e2e8f0',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ color: '#22c55e' }}>TraconView — Connection Test</h1>

      {loading && <p>Loading aircraft data...</p>}
      {error && <p style={{ color: '#ef4444' }}>Error: {error}</p>}
      {data && (
        <div>
          <p style={{ color: '#22c55e' }}>
            ✅ Supabase Edge Function: Connected
          </p>
          <p>
            ✅ OpenSky API: {data.states?.length || 0} aircraft found
          </p>
          <p>
            ✅ Rate limit remaining: {data.rateLimitRemaining}
          </p>
          <p>
            ✅ Region: {data.region}
          </p>
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>
            First aircraft: {data.states?.[0]?.[1] || 'N/A'} (callsign)
          </p>
        </div>
      )}
    </div>
  )
}

export default App
```

```bash
npm run dev
```

Open http://localhost:5173 — you should see:
```
✅ Supabase Edge Function: Connected
✅ OpenSky API: 247 aircraft found
✅ Rate limit remaining: 3891
✅ Region: MOROCCO
First aircraft: RAM1234 (callsign)
```

If you see all green checkmarks, **everything is connected and working**.

Push this to deploy:
```bash
git add .
git commit -m "Connection test: Supabase + OpenSky working"
git push origin main
```

---

## PHASE 6: Give Instructions to AI Agents

Now the infrastructure is ready. Here's exactly how to run each agent.

### 6.1 — Opus Session (Backend + Logic)

Open a new Opus session. Paste:

```
# Context
I'm building TraconView — a live flight anomaly radar.
The infrastructure is already set up:
- GitHub repo: github.com/MY_USERNAME/traconview
- Supabase project with Edge Function deployed (opensky-proxy)
- Vercel auto-deploys from main branch
- React + Vite + Tailwind scaffolded
- Connection test passed: OpenSky data flows through Supabase to frontend

# Spec
[PASTE THE FULL TRACONVIEW-SPEC.md HERE]

# Your Role
You are the BACKEND + LOGIC engineer.
You write: hooks, stores, data transformers, anomaly detection, utilities.
You do NOT write UI components — Gemini handles that.

# Current Sprint: Sprint 1
# Your Tasks:
- O5: Build data transformer (OpenSky raw → Aircraft model)
  File: src/lib/transformers.js
- O11: Build unit conversion utilities
  File: src/lib/formatters.js
- O4: Build anomaly detection rules
  File: src/lib/anomalyRules.js
- O9: Build Zustand store
  File: src/store/flightStore.js
- O7: Build useOpenSky hook (polling via Supabase Edge Function)
  File: src/hooks/useOpenSky.js
- O8: Build useAnomalyEngine hook
  File: src/hooks/useAnomalyEngine.js

# Constraints
- Supabase Edge Function URL: ${VITE_SUPABASE_URL}/functions/v1/opensky-proxy?region=REGION
- Poll every 15 seconds
- Follow the exact Aircraft interface from the spec
- Follow the exact anomaly rules from the spec
- Export everything so Gemini's components can import them

# Output
Give me each file complete and ready to copy-paste.
One file at a time. Start with src/lib/formatters.js
```

### 6.2 — Gemini Session (Frontend + Design)

Open a Gemini session. Paste:

```
# Context
I'm building TraconView — a live flight anomaly radar.
The infrastructure is set up: React + Vite + Tailwind + Leaflet.
The backend hooks and stores are being written by another engineer.

# Spec
[PASTE THE FULL TRACONVIEW-SPEC.md HERE]

# Your Role
You are the FRONTEND + DESIGN engineer.
You write: React components, Leaflet map, CSS, animations, layout.
You do NOT write data logic — Opus handles that.

# What You Can Assume Exists (written by Opus):
- src/store/flightStore.js — Zustand store with:
  - useFlightStore() returns: { aircraft, anomalies, region, setRegion, isLoading, error, rateLimitRemaining }
- src/lib/constants.js — REGIONS object, color constants
- src/lib/formatters.js — formatAltitude(), formatSpeed(), formatVerticalRate()

# Current Sprint: Sprint 1
# Your Tasks:
- G3: Build TraconMap.jsx — Leaflet map with CartoDB dark_matter tiles
  Must use Canvas renderer for performance
- G4: Build AircraftLayer.jsx — render aircraft as CircleMarkers
  Normal: dim teal #1e6a7a, 3px
  Anomaly: use anomaly color from aircraft.anomaly, 8px, pulsing
- G2: Build Header.jsx — logo, live/offline indicator, aircraft count, region name
- G9: Build RegionSelector.jsx — buttons for each REGIONS preset
- G7: Build AircraftDetail.jsx — click aircraft → sidebar with all details

# Design Rules
- Background: #050510
- Font for data: JetBrains Mono
- Font for UI: DM Sans
- See CSS variables in the spec
- ATC dark scope aesthetic
- Leaflet CSS must be imported: import 'leaflet/dist/leaflet.css'

# Output
Give me each component complete and ready to copy-paste.
Start with TraconMap.jsx
```

### 6.3 — After Both Agents Finish

Once you have all files from both Opus and Gemini:

1. Copy each file to the correct path in your project
2. Wire them together in `src/App.jsx`:

```jsx
// This is the main integration point — ask Opus to write this
// after all hooks and components exist
import { useEffect } from 'react'
import { useFlightStore } from './store/flightStore'
import Header from './components/ui/Header'
import TraconMap from './components/map/TraconMap'
import AlertSidebar from './components/panels/AlertSidebar'
// ... etc
```

3. Test locally: `npm run dev`
4. If it works: push and deploy
```bash
git add .
git commit -m "Sprint 1: Live aircraft dots on dark map"
git push origin main
```
5. Vercel auto-deploys → check traconview.vercel.app

### 6.4 — Run the Code Review

After deploying, use the **TRACONVIEW-REVIEW-PROMPT.md** file:
1. Open new Opus session
2. Paste the Code Reviewer prompt + the spec + all your source files
3. It outputs FIXES.md
4. Apply fixes
5. Push again

---

## QUICK REFERENCE CARD

```
┌─────────────────────────────────────────────┐
│           TraconView Quick Reference         │
├─────────────────────────────────────────────┤
│                                             │
│  GitHub:  github.com/USERNAME/traconview    │
│  Live:    traconview.vercel.app             │
│                                             │
│  Supabase Dashboard:                        │
│    supabase.com/dashboard                   │
│                                             │
│  Edge Function URL:                         │
│    https://XXXXX.supabase.co/functions/     │
│    v1/opensky-proxy?region=EUROPE           │
│                                             │
│  Deploy frontend:                           │
│    git push origin main                     │
│                                             │
│  Deploy Edge Function:                      │
│    supabase functions deploy opensky-proxy  │
│    --no-verify-jwt                          │
│                                             │
│  Set secrets:                               │
│    supabase secrets set KEY=VALUE           │
│                                             │
│  Local dev:                                 │
│    npm run dev → localhost:5173             │
│                                             │
│  Build check:                               │
│    npm run build                            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## TROUBLESHOOTING

| Problem | Fix |
|---|---|
| Edge Function returns 500 | Check secrets: `supabase secrets list` — are both OPENSKY values set? |
| CORS error in browser console | Redeploy with `--no-verify-jwt` flag |
| OpenSky returns 401 | Your token expired or credentials are wrong — recreate API client on opensky-network.org |
| OpenSky returns 429 | You hit the rate limit — wait until midnight UTC for credit reset |
| Vercel build fails | Run `npm run build` locally first to see the error |
| Map tiles don't load | Check you imported `'leaflet/dist/leaflet.css'` in your map component |
| Aircraft dots don't appear | Check browser console → Network tab → is the Edge Function returning data? |
| `.env.local` not working | Variables must start with `VITE_` for Vite to expose them to frontend |
| Supabase CLI won't link | Make sure you used the correct Project Reference ID (Settings → General) |
