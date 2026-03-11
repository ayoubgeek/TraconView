# Quickstart: TraconView — Live Flight Anomaly Radar

**Feature**: 001-flight-anomaly-radar
**Date**: 2026-03-11

## Prerequisites

- **Node.js** 18+ and **npm**
- **Supabase CLI** (`npm install -g supabase`)
- **OpenSky Network** registered account with OAuth2 client credentials
- **Vercel** account (for deployment)
- **Git**

## 1. Clone and Install

```bash
git clone https://github.com/ayoubgeek/TraconView.git
cd TraconView
npm install
```

## 2. Environment Setup

### Frontend (.env.local)

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Secrets (for Edge Function)

```bash
supabase secrets set OPENSKY_CLIENT_ID=your_opensky_client_id
supabase secrets set OPENSKY_CLIENT_SECRET=your_opensky_client_secret
```

## 3. Local Development

```bash
# Start the Vite dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## 4. Supabase Setup

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the Edge Function
supabase functions deploy opensky-proxy

# Run database migrations (anomaly_log table)
supabase db push
```

## 5. Deploy to Vercel

```bash
# Link to Vercel project
npx vercel link

# Deploy production
npx vercel --prod
```

## 6. Verify

1. Open `https://traconview.vercel.app` (or `http://localhost:5173` for local).
2. Verify dark map loads with CartoDB tiles.
3. Verify aircraft dots appear within 20 seconds.
4. Click a region button — map should pan and data reload.
5. Click an aircraft dot — detail panel opens.
6. If any aircraft has squawk 7700/7500 → verify red pulsing dot + alert in sidebar.

## Key Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest unit tests |
| `supabase functions serve` | Run Edge Functions locally |
