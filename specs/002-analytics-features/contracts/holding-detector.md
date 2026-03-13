# Contract: Holding Pattern Detector

**Module**: `src/lib/holdingDetector.js`
**Type**: Pure function library (no React, no side effects)

## Public API

### `detectHolding(positions)`

Analyzes an aircraft's recent position history to detect circular holding patterns.

**Input**:
```
positions: Array<{
  heading: number           // Degrees true (0-360)
  altitude: number          // Feet
  timestamp: number         // Unix timestamp (seconds)
}>
// Ordered chronologically (oldest first), max 10 entries
```

**Output**:
```
{
  isHolding: boolean        // True if cumulative heading change > 300°
  cumulativeHeading: number // Total absolute heading change in degrees
}
```

**Algorithm**:
1. Require minimum 8 entries (~2 minutes of data at 15s polling)
2. Skip if aircraft altitude < 1000ft (exclude ground movement and VFR circuits)
3. For each consecutive pair, compute heading delta with wraparound: `delta = ((h2 - h1 + 540) % 360) - 180`
4. Sum absolute values of all deltas → `cumulativeHeading`
5. If `cumulativeHeading > 300` → `isHolding = true`

**Invariants**:
- Returns `{ isHolding: false, cumulativeHeading: 0 }` if fewer than 8 positions
- Returns `{ isHolding: false, cumulativeHeading: 0 }` if latest altitude < 1000ft
- Heading wraparound handled correctly (e.g., 350° → 10° = 20° delta, not 340°)

### `hasExitedHolding(positions)`

Checks if an aircraft previously in a holding pattern has stabilized.

**Input**: Same as `detectHolding`
**Output**: `boolean` — True if last 5 positions show <30° total heading change

**Algorithm**:
1. Require at least 5 recent entries
2. Take the last 5 positions
3. Compute cumulative heading change over those 5
4. If <30° → aircraft has exited holding

### `updatePositionHistory(history, aircraft, maxEntries)`

Appends new position to history with ring buffer eviction.

**Input**:
```
history: Map<string, PositionEntry[]>  // Aircraft ID → position array
aircraft: Array<{ id, lat, lng, heading, altitude, lastSeen }>
maxEntries: number                      // Default 10
```

**Output**: `Map<string, PositionEntry[]>` — Updated history (new Map, immutable)

**Behavior**:
- Appends new entry for each aircraft that has valid lat/lng
- Evicts oldest entry if array exceeds `maxEntries`
- Removes aircraft not present in current data for 2 consecutive calls (eviction after 2 missed polls)

## Test Contract

Tests MUST cover:
- Straight-line flight (heading constant) → isHolding: false
- Standard holding pattern (heading changes ~360°) → isHolding: true
- Partial turn (~200°) → isHolding: false (below 300° threshold)
- Heading wraparound: 350° → 10° → 30° → ... correctly computed
- Fewer than 8 positions → isHolding: false
- Low altitude (<1000ft) → isHolding: false
- Exit detection: 5 stable headings → hasExitedHolding: true
- Position history ring buffer: 11th entry evicts 1st
- Stale aircraft eviction after 2 missed polls
