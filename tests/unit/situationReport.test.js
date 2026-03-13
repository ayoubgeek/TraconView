import { describe, it, expect } from 'vitest';
import { generateSituationReport } from '../../src/lib/situationReport';

describe('situationReport generator', () => {
  const mockAircraft = {
    id: 'c060b2', callsign: 'RAM1204', country: 'Morocco', lat: 33.5731, lng: -7.5898,
    altitude: 35000, speed: 432, heading: 180, verticalRate: 0, onGround: false, squawk: '7700', isHolding: false
  };

  const mockRiskResult = {
    score: 72, threshold: 'WARNING',
    rules: [{ id: 'SQUAWK_7700', label: 'Emergency Squawk 7700', weight: 50 }, { id: 'SPI', label: 'SPI Active', weight: 10 }]
  };

  const mockNearestAirport = {
    icao: 'GMMN', name: 'Mohammed V International', distance: 23.4, bearing: 45.2
  };

  const mockMetar = {
    fltCat: 'VFR', rawOb: 'GMMN 131430Z 27015KT 10SM SCT035 22/15 Q1012',
    wdir: 270, wspd: 15, wgst: null, visib: '10+', clouds: [{ cover: 'SCT', base: 3500 }], altim: 1012
  };

  it('generates a full report with all fields populated', () => {
    const report = generateSituationReport(mockAircraft, mockRiskResult, mockNearestAirport, mockMetar);
    
    expect(report.sections.identity.callsign).toBe('RAM1204');
    expect(report.sections.status).toBe('IN FLIGHT');
    expect(report.sections.position.altitude).toBe('FL350');
    expect(report.sections.nearestAirport.distance).toBe('23 nm');
    expect(report.sections.nearestAirport.bearing).toBe('045° (NE)');
    expect(report.sections.weather.category).toBe('VFR');
    expect(report.formatted).toContain('SITUATION REPORT');
  });

  it('handles null METAR gracefully', () => {
    const report = generateSituationReport(mockAircraft, mockRiskResult, mockNearestAirport, null);
    expect(report.sections.weather).toBeNull();
    expect(report.formatted).toContain('Weather data unavailable');
  });

  it('handles null nearest airport gracefully', () => {
    const report = generateSituationReport(mockAircraft, mockRiskResult, null, mockMetar);
    expect(report.sections.nearestAirport).toBeNull();
    expect(report.formatted).toContain('No airports nearby');
  });

  it('labels aircraft on ground correctly', () => {
    const report = generateSituationReport({ ...mockAircraft, onGround: true }, mockRiskResult, mockNearestAirport, null);
    expect(report.sections.status).toBe('ON GROUND');
  });

  it('labels aircraft holding correctly', () => {
    const report = generateSituationReport({ ...mockAircraft, isHolding: true }, mockRiskResult, mockNearestAirport, null);
    expect(report.sections.status).toBe('HOLDING PATTERN');
  });

  it('cleans risk section when score is 0', () => {
    const cleanRisk = { score: 0, threshold: 'NORMAL', rules: [] };
    const report = generateSituationReport(mockAircraft, cleanRisk, mockNearestAirport, null);
    expect(report.sections.riskAssessment.score).toBe('0/100');
    expect(report.sections.riskAssessment.breakdown).toHaveLength(0);
    expect(report.formatted).toContain('No active risk factors');
  });
});
