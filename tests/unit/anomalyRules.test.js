import { describe, it, expect } from 'vitest';
import { checkAnomalies } from '../../src/lib/anomalyRules';
import { ANOMALY_SEVERITY, ANOMALY_TYPES } from '../../src/lib/constants';

describe('Anomaly Rules Engine', () => {
  const createMockAircraft = (overrides = {}) => ({
    id: '123456',
    callsign: 'TEST1',
    squawk: '1000',
    altitude: 10000,
    speed: 300,
    verticalRate: 0,
    onGround: false,
    spi: false,
    ...overrides
  });

  it('detects SQUAWK_7500 (Hijack) as CRITICAL priority over 7700', () => {
    const aircraft = createMockAircraft({ squawk: '7500' });
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly).toBeTruthy();
    expect(anomaly.type).toBe(ANOMALY_TYPES.SQUAWK_7500);
    expect(anomaly.severity).toBe(ANOMALY_SEVERITY.CRITICAL);
  });

  it('detects SQUAWK_7700 (Emergency) as CRITICAL', () => {
    const aircraft = createMockAircraft({ squawk: '7700' });
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly.type).toBe(ANOMALY_TYPES.SQUAWK_7700);
    expect(anomaly.severity).toBe(ANOMALY_SEVERITY.CRITICAL);
  });

  it('detects SQUAWK_7600 (Radio Failure) as HIGH', () => {
    const aircraft = createMockAircraft({ squawk: '7600' });
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly.type).toBe(ANOMALY_TYPES.SQUAWK_7600);
    expect(anomaly.severity).toBe(ANOMALY_SEVERITY.HIGH);
  });

  it('detects RAPID_DESCENT (<-2000 fpm) as MEDIUM', () => {
    const aircraft = createMockAircraft({ verticalRate: -2500, altitude: 6000 });
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly).toBeTruthy();
    expect(anomaly.type).toBe(ANOMALY_TYPES.RAPID_DESCENT);
    expect(anomaly.severity).toBe(ANOMALY_SEVERITY.MEDIUM);
  });

  it('ignores RAPID_DESCENT below 5000ft (landing profiles)', () => {
    const aircraft = createMockAircraft({ verticalRate: -2500, altitude: 4000 });
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly).toBeNull();
  });

  it('detects UNUSUAL_SPEED (slow at high altitude) as LOW', () => {
    const aircraft = createMockAircraft({ speed: 140, altitude: 26000 });
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly).toBeTruthy();
    expect(anomaly.type).toBe(ANOMALY_TYPES.UNUSUAL_SPEED);
    expect(anomaly.severity).toBe(ANOMALY_SEVERITY.LOW);
  });

  it('detects SPI active as LOW', () => {
    const aircraft = createMockAircraft({ spi: true });
    const anomaly = checkAnomalies(aircraft);
    
    expect(anomaly).toBeTruthy();
    expect(anomaly.type).toBe(ANOMALY_TYPES.SPI_ACTIVE);
    expect(anomaly.severity).toBe(ANOMALY_SEVERITY.LOW);
  });

  it('returns null for normal flight', () => {
    const aircraft = createMockAircraft();
    expect(checkAnomalies(aircraft)).toBeNull();
  });
});
