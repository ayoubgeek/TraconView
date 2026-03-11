// src/lib/anomalyRules.js
import { ANOMALY_SEVERITY, ANOMALY_TYPES } from './constants';

const rules = [
  // 1. SQUAWK 7500 (Hijack) - CRITICAL
  {
    test: (ac) => ac.squawk === '7500',
    type: ANOMALY_TYPES.SQUAWK_7500,
    severity: ANOMALY_SEVERITY.CRITICAL
  },
  // 2. SQUAWK 7700 (Emergency) - CRITICAL
  {
    test: (ac) => ac.squawk === '7700',
    type: ANOMALY_TYPES.SQUAWK_7700,
    severity: ANOMALY_SEVERITY.CRITICAL
  },
  // 3. SQUAWK 7600 (Radio Failure) - HIGH
  {
    test: (ac) => ac.squawk === '7600',
    type: ANOMALY_TYPES.SQUAWK_7600,
    severity: ANOMALY_SEVERITY.HIGH
  },
  // 4. RAPID DESCENT (<-2000 fpm, not onGround, > 5000ft) - MEDIUM
  {
    test: (ac) => !ac.onGround && ac.altitude > 5000 && ac.verticalRate < -2000,
    type: ANOMALY_TYPES.RAPID_DESCENT,
    severity: ANOMALY_SEVERITY.MEDIUM
  },
  // 5. UNUSUAL SPEED (speed < 150 kts, altitude > 25000ft) - LOW
  {
    test: (ac) => ac.altitude > 25000 && ac.speed < 150,
    type: ANOMALY_TYPES.UNUSUAL_SPEED,
    severity: ANOMALY_SEVERITY.LOW
  },
  // 6. SPI ACTIVE - LOW
  {
    test: (ac) => ac.spi === true,
    type: ANOMALY_TYPES.SPI_ACTIVE,
    severity: ANOMALY_SEVERITY.LOW
  }
];

export function checkAnomalies(aircraft) {
  // Rules are evaluated in priority order. First matching rule wins.
  for (const rule of rules) {
    if (rule.test(aircraft)) {
      return {
        type: rule.type,
        severity: rule.severity
      };
    }
  }
  return null;
}
