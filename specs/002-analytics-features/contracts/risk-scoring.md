# Contract: Risk Scoring Engine

**Module**: `src/lib/riskScoring.js`
**Type**: Pure function library (no React, no side effects)

## Public API

### `computeRiskScore(aircraft, prevScore?)`

Computes an additive risk score for a single aircraft based on all matching rules.

**Input**:
```
aircraft: {
  squawk: string | null
  verticalRate: number      // ft/min
  altitude: number          // feet
  speed: number             // knots
  onGround: boolean
  spi: boolean
  lastSeen: number          // Unix timestamp (seconds)
}
prevScore?: number          // Previous cycle's score (for threshold crossing detection)
```

**Output**:
```
{
  score: number             // 0-100 (capped)
  threshold: string         // "NORMAL" | "WATCH" | "CAUTION" | "WARNING" | "CRITICAL"
  rules: Array<{
    id: string              // Rule identifier
    label: string           // Human-readable label
    weight: number          // Points contributed
  }>
  isNewCritical: boolean    // True if score >= 76 AND prevScore < 76
}
```

**Rules (evaluated exhaustively — all matching rules contribute)**:

| Rule ID | Condition | Weight | Label |
|---------|-----------|--------|-------|
| `SQUAWK_7700` | squawk === "7700" | +50 | Emergency Squawk 7700 |
| `SQUAWK_7500` | squawk === "7500" | +50 | Hijack Squawk 7500 |
| `SQUAWK_7600` | squawk === "7600" | +35 | Radio Failure Squawk 7600 |
| `RAPID_DESCENT_HIGH` | verticalRate < -2000 && altitude > 10000 | +25 | Rapid Descent >2000fpm above FL100 |
| `RAPID_DESCENT_LOW` | verticalRate < -1500 && altitude > 5000 && altitude <= 10000 | +15 | Rapid Descent >1500fpm above FL050 |
| `UNUSUAL_SPEED` | speed < 150 && altitude > 25000 | +10 | Unusually Low Speed above FL250 |
| `SPI_ACTIVE` | spi === true | +10 | Special Position Identification Active |
| `DATA_GAP` | (now - lastSeen) > 30 | +5 | Data Gap >30 seconds |
| `LOW_ALTITUDE` | altitude < 1000 && altitude > 0 && !onGround | +5 | Low Altitude (not on ground) |

**Invariants**:
- Score is always in range [0, 100]
- `rules` array contains only rules that matched (non-empty only if score > 0)
- `threshold` always reflects the score: NORMAL (0-10), WATCH (11-25), CAUTION (26-50), WARNING (51-75), CRITICAL (76-100)
- `isNewCritical` is true only when prevScore is provided AND prevScore < 76 AND score >= 76

### `getThreshold(score)`

Maps a numeric score to its threshold string.

**Input**: `score: number` (0-100)
**Output**: `"NORMAL" | "WATCH" | "CAUTION" | "WARNING" | "CRITICAL"`

### `RISK_RULES`

Exported constant array of all rule definitions for display and configuration purposes.

```
Array<{
  id: string
  label: string
  weight: number
  description: string
}>
```

## Test Contract

Tests MUST cover:
- Each rule in isolation (one rule fires, correct weight)
- Multiple rules simultaneously (additive, verify sum)
- Score capping at 100 (e.g., squawk 7700 + 7500 = 100, not 100)
- Threshold boundaries (10→WATCH, 25→WATCH, 26→CAUTION, etc.)
- `isNewCritical` detection (prevScore=50, score=80 → true; prevScore=80, score=90 → false)
- Aircraft with no anomalies returns score=0, threshold="NORMAL", rules=[]
