# FIXES.md — TraconView Code Review (2026-03-12)

## Summary
- Total issues found: **19**
- Critical (blocks functionality): **3**
- Major (wrong behavior): **8**
- Minor (cosmetic/polish): **8**

---

## Critical Fixes

### FIX-001: Zustand store missing `isSidebarOpen` and `toggleSidebar` — runtime crash on mobile
**File:** `src/store/flightStore.js`
**Line:** ~12–62
**Category:** Spec Compliance
**Problem:** `AlertSidebar.jsx` (line 16-17) and `Header.jsx` (line 12, 50) both read `state.isSidebarOpen` and call `state.toggleSidebar()`. These properties do **not** exist in the Zustand store, causing `undefined` on read and a runtime crash on mobile when the Bell button is tapped.
**Expected:** The store must contain `isSidebarOpen: false` and a `toggleSidebar` action per the US8 responsive layout feature.
**Fix:**
```javascript
// In src/store/flightStore.js — Replace entire file content with:
// src/store/flightStore.js
import { create } from 'zustand';
import { REGIONS, DEFAULT_REGION, MAX_ANOMALY_HISTORY } from '../lib/constants';

export const useFlightStore = create((set, get) => ({
  // Data State
  aircraft: {},
  aircraftArray: [],
  anomalies: [],
  lastRefresh: null,
  
  // UI State
  selectedRegion: DEFAULT_REGION,
  selectedAircraftId: null,
  isMuted: false,
  isSidebarOpen: false,
  connectionStatus: 'LIVE',
  
  // Actions
  setAircraftData: (newAircraftArray, timestamp) => {
    const aircraftDict = {};
    for (const ac of newAircraftArray) {
      aircraftDict[ac.id] = ac;
    }
    set({
      aircraft: aircraftDict,
      aircraftArray: Object.values(aircraftDict),
      lastRefresh: timestamp || Date.now()
    });
  },
  
  addAnomaly: (anomaly) => {
    set((state) => {
      const recentDuplicate = state.anomalies.find(
        (a) => a.icao24 === anomaly.icao24 && 
               a.type === anomaly.type && 
               Date.now() - new Date(a.detectedAt).getTime() < 60000
      );
      if (recentDuplicate) return state;
      const newAnomalies = [anomaly, ...state.anomalies].slice(0, MAX_ANOMALY_HISTORY);
      return { anomalies: newAnomalies };
    });
  },
  
  setRegion: (regionKey) => {
    if (REGIONS[regionKey]) {
      set({ 
        selectedRegion: REGIONS[regionKey],
        aircraft: {},
        aircraftArray: []
      });
    }
  },
  
  setSelectedAircraft: (id) => set({ selectedAircraftId: id }),
  clearSelectedAircraft: () => set({ selectedAircraftId: null }),
  
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  setConnectionStatus: (status) => set({ connectionStatus: status })
}));
```

---

### FIX-002: Double data transformation — Edge Function transforms AND useOpenSky transforms again
**File:** `src/hooks/useOpenSky.js`
**Line:** ~55
**Category:** API / Data Pipeline
**Problem:** The Edge Function (`supabase/functions/opensky-proxy/index.ts`, lines 125-146) already transforms the raw OpenSky state arrays into the `Aircraft` model (with unit conversions). The frontend hook at line 55 calls `transformOpenSkyAircraft()` on the already-transformed objects. This applies unit conversions **twice**, e.g., altitude gets multiplied by 3.28084 twice, producing wildly wrong values (a 10,000m aircraft would show as ~107,639 ft instead of ~32,808 ft).
**Expected:** The proxy returns fully transformed aircraft. The frontend should use them directly.
**Fix:**
```javascript
// In src/hooks/useOpenSky.js — Replace line 55:
const transformed = (rawData.aircraft || []).map(transformOpenSkyAircraft);

// With:
const transformed = rawData.aircraft || [];
```

---

### FIX-003: Supabase anomaly insert uses `.catch()` on Supabase query — doesn't return a Promise properly
**File:** `src/hooks/useAnomalyEngine.js`
**Line:** ~79–90
**Category:** API / Data Pipeline
**Problem:** The Supabase JS client `from().insert()` doesn't return a rejected Promise on failure; it returns `{ data, error }`. Using `.catch()` never actually catches insert errors. Additionally, the `then()` chain is not used, so the insert is fire-and-forget but errors are silently swallowed.
**Expected:** Use `await` or `.then()` and check the `error` field from the response.
**Fix:**
```javascript
// In src/hooks/useAnomalyEngine.js — Replace lines 78-90:
        if (supabase) {
          supabase.from('anomaly_log').insert([{
            icao24: anomalyRecord.icao24,
            callsign: anomalyRecord.callsign,
            type: anomalyRecord.type,
            severity: anomalyRecord.severity,
            altitude: anomalyRecord.altitude,
            speed: anomalyRecord.speed,
            vertical_rate: anomalyRecord.verticalRate,
            squawk: anomalyRecord.squawk,
            lat: anomalyRecord.lat,
            lng: anomalyRecord.lng
          }]).catch(err => console.error("Supabase Log Error:", err));
        }

// With:
        if (supabase) {
          supabase.from('anomaly_log').insert([{
            icao24: anomalyRecord.icao24,
            callsign: anomalyRecord.callsign,
            type: anomalyRecord.type,
            severity: anomalyRecord.severity,
            altitude: anomalyRecord.altitude,
            speed: anomalyRecord.speed,
            vertical_rate: anomalyRecord.verticalRate,
            squawk: anomalyRecord.squawk,
            lat: anomalyRecord.lat,
            lng: anomalyRecord.lng
          }]).then(({ error }) => {
            if (error) console.error("Supabase anomaly_log insert error:", error.message);
          });
        }
```

---

## Major Fixes

### FIX-004: Anomaly record missing `region` field — spec requires it for global logging
**File:** `src/hooks/useAnomalyEngine.js`
**Line:** ~60–73
**Category:** Spec Compliance
**Problem:** The `anomalyRecord` object doesn't include a `region` field. The data-model.md specifies: `region: string — Region key where detected (e.g., "EUROPE")`. The DB migration also doesn't include a `region` column. This breaks FR-012 (global anomaly logging with region context).
**Expected:** Anomaly records must include the current region key.
**Fix:**
```javascript
// In src/hooks/useAnomalyEngine.js — Add selectedRegion to the hook:
// After line 36 (const lastRefresh = ...):
  const selectedRegion = useFlightStore(state => state.selectedRegion);

// Then in the anomalyRecord object (after line 72: detectedAt):
          region: selectedRegion.key
```

Also add the `region` column to the Supabase insert (and to the migration):
```javascript
// In the supabase.from('anomaly_log').insert() call, add:
            region: anomalyRecord.region,
```

---

### FIX-005: DB migration column names diverge from data-model.md spec
**File:** `supabase/migrations/20260312000000_create_anomaly_log.sql`
**Line:** 1–35
**Category:** Spec Compliance
**Problem:** The spec data-model.md defines columns: `anomaly_type`, `latitude`, `longitude`, `altitude_ft`, `vertical_rate_fpm`, `speed_kts`, `detected_at`. The actual migration uses: `type`, `lat`, `lng`, `altitude`, `vertical_rate`, `speed`, `created_at`. Also missing: `region` column.
**Expected:** Column names should match the data-model.md schema for consistency.
**Fix:**
```sql
-- Replace entire migration file content:
CREATE TABLE IF NOT EXISTS public.anomaly_log (
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
  region text,
  detected_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_detected_at ON public.anomaly_log(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_log_severity ON public.anomaly_log(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_log_icao24 ON public.anomaly_log(icao24);

ALTER TABLE public.anomaly_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to anomaly_log"
  ON public.anomaly_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to anomaly_log"
  ON public.anomaly_log FOR SELECT
  USING (true);
```

> [!IMPORTANT]
> If you update the migration columns, you MUST also update the Supabase insert in `useAnomalyEngine.js` to use the new column names: `anomaly_type`, `latitude`, `longitude`, `altitude_ft`, `vertical_rate_fpm`, `speed_kts`, `region`, `detected_at`.

---

### FIX-006: Normal aircraft dot color is green (#10B981) — spec says dim teal (#1e6a7a)
**File:** `src/components/map/AircraftLayer.jsx`
**Line:** 10
**Category:** UI
**Problem:** The review prompt specifies normal aircraft dots should be `#1e6a7a` (dim teal). Currently using `#10B981` which is the bright atc-green theme color, making normal dots too prominent relative to anomaly dots.
**Expected:** Normal dots should be dim and subtle so anomaly dots stand out.
**Fix:**
```javascript
// In src/components/map/AircraftLayer.jsx — Replace line 10:
  NORMAL: '#10B981', // atc-green

// With:
  NORMAL: '#1e6a7a', // dim teal per spec
```

---

### FIX-007: Normal aircraft dot radius is 4px — spec says 3-4px, should be 3px for density
**File:** `src/components/map/AircraftLayer.jsx`
**Line:** 49
**Category:** UI / Performance
**Problem:** With 5,000 aircraft, 4px dots will overlap excessively. The spec says "small (3-4px)" and the selected state is 6px. Using 3px for normal improves density rendering.
**Expected:** Normal dots = 3px, selected = 6px.
**Fix:**
```javascript
// In src/components/map/AircraftLayer.jsx — Replace line 49:
              radius={isSelected ? 6 : 4}

// With:
              radius={isSelected ? 6 : 3}
```

---

### FIX-008: `checkAnomalies()` called redundantly in AircraftLayer — should read from store
**File:** `src/components/map/AircraftLayer.jsx`
**Line:** 32
**Category:** Performance
**Problem:** `checkAnomalies(ac)` is called for **every aircraft on every render** inside `AircraftLayer`. The anomaly engine already processes all aircraft and stores results. This means the anomaly rules run twice per refresh per aircraft. Additionally, the Aircraft data model in `data-model.md` defines `anomaly` and `anomalySeverity` fields that should be set by the engine.
**Expected:** The anomaly engine should set `anomaly`/`anomalySeverity` on each aircraft object. The AircraftLayer should read those fields, not re-run the rules.
**Fix:**
```javascript
// In src/hooks/useAnomalyEngine.js — After the anomaly check loop (after line 98),
// add a step that enriches the aircraft array with anomaly info:
    // Enrich aircraft with anomaly data for rendering
    const enriched = aircraftArray.map(ac => {
      const result = checkAnomalies(ac);
      return result 
        ? { ...ac, anomaly: result.type, anomalySeverity: result.severity }
        : { ...ac, anomaly: null, anomalySeverity: null };
    });
    // Only update if something changed
    if (enriched.some((ac, i) => ac.anomaly !== aircraftArray[i]?.anomaly)) {
      setAircraftData(enriched, lastRefresh);
    }

// Then in src/components/map/AircraftLayer.jsx — Replace line 32:
        const anomaly = checkAnomalies(ac);

// With:
        const anomaly = ac.anomaly ? { type: ac.anomaly, severity: ac.anomalySeverity } : null;

// And remove the import on line 5:
import { checkAnomalies } from '../../lib/anomalyRules';
```

> [!WARNING]
> This is a structural refactor. Test carefully to ensure the anomaly engine doesn't create an infinite re-render loop by setting aircraft data that triggers a new anomaly scan. The `processedTimestamps` guard should prevent this since `lastRefresh` doesn't change.

---

### FIX-009: Region selector shows key names like "NORTH_AMERICA" — should show labels
**File:** `src/components/panels/RegionSelector.jsx`
**Line:** 24
**Category:** UI
**Problem:** `region.key.replace('_', ' ')` only replaces the **first** underscore and shows uppercase keys ("NORTH AMERICA", "EUROPE") instead of the human-readable `label` field ("North America", "Europe").
**Expected:** Use `region.label` which is already defined in constants with proper casing.
**Fix:**
```javascript
// In src/components/panels/RegionSelector.jsx — Replace line 24:
            {region.key.replace('_', ' ')}

// With:
            {region.label}
```

---

### FIX-010: No "No aircraft in range" empty state message
**File:** `src/components/map/TraconMap.jsx` or `src/app/page.jsx`
**Category:** Spec Compliance
**Problem:** The spec edge cases require: "What happens when the data source returns zero aircraft for a region? → Display an empty map with a 'No aircraft in range' message." No such message exists anywhere in the codebase.
**Expected:** When `aircraftArray.length === 0` and connection is LIVE, show a centered message on the map.
**Fix:**
```jsx
// In src/app/page.jsx — After <TraconMap />, add:
import { useFlightStore } from '../store/flightStore';

// Inside the Page component, before the return:
  const aircraftCount = useFlightStore(state => state.aircraftArray.length);
  const connectionStatus = useFlightStore(state => state.connectionStatus);

// Inside the radar-sweep div, after <TraconMap />:
          {aircraftCount === 0 && connectionStatus === 'LIVE' && (
            <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none">
              <span className="text-atc-dim text-sm font-ui bg-radar-bg/80 px-4 py-2 rounded border border-radar-grid">
                No aircraft in range
              </span>
            </div>
          )}
```

---

### FIX-011: CORS headers missing `Access-Control-Allow-Methods`
**File:** `supabase/functions/opensky-proxy/index.ts`
**Line:** 4–7
**Category:** Deployment / CORS
**Problem:** The API contract specifies `Access-Control-Allow-Methods: GET, OPTIONS` in CORS headers. The actual Edge Function only sets `Allow-Origin` and `Allow-Headers`, missing `Allow-Methods`.
**Expected:** Include the methods header per the contract.
**Fix:**
```typescript
// In supabase/functions/opensky-proxy/index.ts — Replace lines 4-7:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// With:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## Minor Fixes

### FIX-012: `RadarSweep.jsx` component missing from project structure
**File:** `src/components/ui/RadarSweep.jsx`
**Category:** Spec Compliance
**Problem:** The plan.md project structure specifies `src/components/ui/RadarSweep.jsx — CSS radar animation`. The radar sweep was implemented as a CSS class in `globals.css` and applied directly to the page div, but the standalone component file doesn't exist.
**Expected:** Either create the component or acknowledge this was intentionally inlined.
**Fix:** This is a minor structural deviation. The animation works correctly as CSS-only. If you want strict spec compliance, create a wrapper component:
```jsx
// Create src/components/ui/RadarSweep.jsx:
import React from 'react';

export default function RadarSweep({ children }) {
  return (
    <div className="radar-sweep w-full h-full">
      {children}
    </div>
  );
}
```

---

### FIX-013: Missing `LICENSE` file
**File:** `LICENSE`
**Category:** README & Deployment
**Problem:** The review checklist requires a LICENSE file (MIT). None exists.
**Fix:**
```text
MIT License

Copyright (c) 2026 TraconView

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### FIX-014: Missing integration test file
**File:** `tests/integration/anomalyPipeline.test.js`
**Category:** Spec Compliance
**Problem:** The plan.md project structure specifies `tests/integration/anomalyPipeline.test.js`. This file doesn't exist.
**Expected:** At minimum, create a test that verifies the transform → anomaly engine pipeline.
**Fix:** Create a basic integration test:
```javascript
// Create tests/integration/anomalyPipeline.test.js:
import { describe, it, expect } from 'vitest';
import { transformOpenSkyAircraft } from '../../src/lib/transformers';
import { checkAnomalies } from '../../src/lib/anomalyRules';

describe('Anomaly Pipeline Integration', () => {
  it('transforms raw OpenSky data and detects squawk 7700', () => {
    const raw = ['abc123', 'TEST123', 'TestCountry', 1234567890, 1234567890, 10.0, 50.0, 10000, false, 250, 180, -5, null, null, '7700', false, 0];
    const aircraft = transformOpenSkyAircraft(raw);
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly).not.toBeNull();
    expect(anomaly.type).toBe('SQUAWK_7700');
    expect(anomaly.severity).toBe('CRITICAL');
  });

  it('transforms raw data and detects rapid descent', () => {
    const raw = ['def456', 'FAST01', 'US', 1234567890, 1234567890, -80.0, 40.0, 3000, false, 200, 90, -12, null, null, '1200', false, 0];
    const aircraft = transformOpenSkyAircraft(raw);
    const anomaly = checkAnomalies(aircraft);
    
    // 3000m = ~9843ft (>5000), verticalRate = -12 m/s = -2362 fpm (<-2000)
    expect(anomaly).not.toBeNull();
    expect(anomaly.type).toBe('RAPID_DESCENT');
    expect(anomaly.severity).toBe('MEDIUM');
  });

  it('returns null for normal flight', () => {
    const raw = ['ghi789', 'NORM01', 'FR', 1234567890, 1234567890, 2.0, 48.0, 11000, false, 250, 270, -2, null, null, '1000', false, 0];
    const aircraft = transformOpenSkyAircraft(raw);
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly).toBeNull();
  });
});
```

---

### FIX-015: No airspace layer toggle — spec says "toggling airspace overlays"
**File:** `src/components/map/AirspaceLayer.jsx` / `src/components/ui/Header.jsx`
**Category:** Spec Compliance
**Problem:** US5 acceptance scenario says: "Can be tested by **toggling** airspace overlays." There is no toggle UI to turn airspace polygons on/off.
**Expected:** Add a toggle button or checkbox for the airspace layer.
**Fix:** Add a `showAirspace` boolean to the Zustand store and a toggle button in the Header:
```javascript
// In src/store/flightStore.js — Add to UI State:
  showAirspace: true,

// Add action:
  toggleAirspace: () => set((state) => ({ showAirspace: !state.showAirspace })),

// In src/components/map/AirspaceLayer.jsx — Add at the top of the component:
  const showAirspace = useFlightStore(state => state.showAirspace);
  if (!showAirspace) return null;
```

---

### FIX-016: Background color is `#0B101E` — review checklist says `#050510`
**File:** `src/styles/globals.css`
**Line:** 4
**Category:** UI
**Problem:** The review checklist says the background should be `#050510`, but the CSS uses `#0B101E`. This is a minor color difference.
**Expected:** Match `#050510` if the review prompt is authoritative, OR keep `#0B101E` if the spec theme takes precedence (the spec itself doesn't mandate an exact hex).
**Fix:** Optional — if the darker background is preferred:
```css
/* In src/styles/globals.css — Replace line 4: */
  --color-radar-bg: #0B101E;
/* With: */
  --color-radar-bg: #050510;
```

---

### FIX-017: README missing screenshot, live demo link, and LICENSE reference
**File:** `README.md`
**Category:** README & Deployment
**Problem:** The README doesn't include a screenshot/demo gif, live demo URL, or mention the LICENSE file.
**Expected:** Add placeholder slots for screenshot and live demo.
**Fix:** Add to the top of README.md after the title:
```markdown
![TraconView Screenshot](docs/screenshot.png)

**[▸ Live Demo](https://traconview.vercel.app)** | [License](LICENSE)
```

---

### FIX-018: `useOpenSky` stale cleaner effect has `aircraftArray` in dependency — causes re-creation every render
**File:** `src/hooks/useOpenSky.js`
**Line:** 112–132
**Category:** Performance
**Problem:** The stale aircraft cleanup `setInterval` depends on `aircraftArray`, which changes on every data refresh. This means the interval is cleared and re-created every 15 seconds, and `aircraftArray` is a new reference each time causing unnecessary effect runs.
**Expected:** The cleanup interval should be stable. Use a ref for `aircraftArray` instead.
**Fix:**
```javascript
// In src/hooks/useOpenSky.js — Replace lines 112-132:
  useEffect(() => {
    const cleanerInterval = setInterval(() => {
      const now = Date.now() / 1000;
      const staleThreshold = now - (STALE_AIRCRAFT_MS / 1000);
      let removedAny = false;
      
      const freshAircraft = aircraftArray.filter(ac => {
        if (ac.lastSeen < staleThreshold) {
          removedAny = true;
          return false;
        }
        return true;
      });
      
      if (removedAny) {
        setAircraftData(freshAircraft, Date.now());
      }
    }, 10000);
    
    return () => clearInterval(cleanerInterval);
  }, [aircraftArray, setAircraftData]);

// With:
  const aircraftArrayRef = useRef([]);
  aircraftArrayRef.current = aircraftArray;

  useEffect(() => {
    const cleanerInterval = setInterval(() => {
      const current = aircraftArrayRef.current;
      const now = Date.now() / 1000;
      const staleThreshold = now - (STALE_AIRCRAFT_MS / 1000);
      let removedAny = false;
      
      const freshAircraft = current.filter(ac => {
        if (ac.lastSeen < staleThreshold) {
          removedAny = true;
          return false;
        }
        return true;
      });
      
      if (removedAny) {
        setAircraftData(freshAircraft, Date.now());
      }
    }, 10000);
    
    return () => clearInterval(cleanerInterval);
  }, [setAircraftData]);
```

---

### FIX-019: `.env.local` not covered by `.gitignore` pattern properly
**File:** `.gitignore`
**Line:** 13
**Category:** Security
**Problem:** The `.gitignore` has `*.local` which matches `.env.local` correctly. **This is actually correct.** ✅ No fix needed.

---

## Checklist Verdicts

| Category | Verdict |
|---|---|
| 1. Spec Compliance | ⚠️ 5 issues (FIX-001, 004, 010, 012, 014) |
| 2. API & Data Pipeline | 🚨 2 critical issues (FIX-002, 003) |
| 3. Anomaly Detection | ⚠️ 1 issue (FIX-004 region field) |
| 4. Frontend / UI | ⚠️ 3 issues (FIX-006, 007, 009) |
| 5. Airspace Overlay | ⚠️ 1 issue (FIX-015 toggle) |
| 6. Performance | ⚠️ 2 issues (FIX-008, 018) |
| 7. Error Handling | ✅ Adequate (429 handled, >3 failures → OFFLINE, StatusIndicator shows refresh time) |
| 8. Environment & Deployment | ⚠️ 1 issue (FIX-011 CORS methods) |
| 9. Security | ✅ All checks passed (secrets in Edge Function only, anon key in frontend, RLS enabled, .env.local gitignored) |
| 10. README & Deployment | ⚠️ 2 issues (FIX-013 LICENSE, FIX-017 screenshot) |

## Missing Files

- [ ] `src/components/ui/RadarSweep.jsx` — Standalone wrapper component for radar animation (FIX-012)
- [ ] `LICENSE` — MIT license file (FIX-013)
- [ ] `tests/integration/anomalyPipeline.test.js` — Integration test for transform → anomaly pipeline (FIX-014)

## Missing Features

- [ ] Airspace layer toggle button — US5 says "toggling airspace overlays" (FIX-015)
- [ ] "No aircraft in range" empty state message — spec edge case (FIX-010)
- [ ] Anomaly `region` field tracking — data-model.md requires region on anomaly records (FIX-004)
