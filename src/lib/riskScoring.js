export const RISK_RULES = [
  { id: 'SQUAWK_7700', label: 'Emergency Squawk 7700', weight: 50 },
  { id: 'SQUAWK_7500', label: 'Hijack Squawk 7500', weight: 50 },
  { id: 'SQUAWK_7600', label: 'Radio Failure Squawk 7600', weight: 35 },
  { id: 'RAPID_DESCENT_HIGH', label: 'Rapid Descent >2000fpm above FL100', weight: 25 },
  { id: 'RAPID_DESCENT_LOW', label: 'Rapid Descent >1500fpm above FL050', weight: 15 },
  { id: 'UNUSUAL_SPEED', label: 'Unusually Low Speed above FL250', weight: 10 },
  { id: 'SPI_ACTIVE', label: 'Special Position Identification Active', weight: 10 },
  { id: 'DATA_GAP', label: 'Data Gap >30 seconds', weight: 5 },
  { id: 'LOW_ALTITUDE', label: 'Low Altitude (not on ground)', weight: 5 }
];

export function getThreshold(score) {
  if (score >= 76) return 'CRITICAL';
  if (score >= 51) return 'WARNING';
  if (score >= 26) return 'CAUTION';
  if (score >= 11) return 'WATCH';
  return 'NORMAL';
}

export function computeRiskScore(aircraft, prevScore = 0) {
  let score = 0;
  const rules = [];
  
  const now = Date.now() / 1000;
  const {
    squawk, verticalRate, altitude, speed, onGround, spi, lastSeen
  } = aircraft;

  if (squawk === '7700') {
    score += 50;
    rules.push(RISK_RULES.find(r => r.id === 'SQUAWK_7700'));
  }
  if (squawk === '7500') {
    score += 50;
    rules.push(RISK_RULES.find(r => r.id === 'SQUAWK_7500'));
  }
  if (squawk === '7600') {
    score += 35;
    rules.push(RISK_RULES.find(r => r.id === 'SQUAWK_7600'));
  }
  
  if (verticalRate < -2000 && altitude > 10000) {
    score += 25;
    rules.push(RISK_RULES.find(r => r.id === 'RAPID_DESCENT_HIGH'));
  }
  if (verticalRate < -1500 && altitude > 5000 && altitude <= 10000) {
    score += 15;
    rules.push(RISK_RULES.find(r => r.id === 'RAPID_DESCENT_LOW'));
  }
  
  if (speed < 150 && altitude > 25000) {
    score += 10;
    rules.push(RISK_RULES.find(r => r.id === 'UNUSUAL_SPEED'));
  }
  
  if (spi === true) {
    score += 10;
    rules.push(RISK_RULES.find(r => r.id === 'SPI_ACTIVE'));
  }
  
  if ((now - lastSeen) > 30) {
    score += 5;
    rules.push(RISK_RULES.find(r => r.id === 'DATA_GAP'));
  }
  
  if (altitude < 1000 && altitude > 0 && !onGround) {
    score += 5;
    rules.push(RISK_RULES.find(r => r.id === 'LOW_ALTITUDE'));
  }

  const cappedScore = Math.min(score, 100);
  
  return {
    score: cappedScore,
    threshold: getThreshold(cappedScore),
    rules,
    isNewCritical: (prevScore < 76 && cappedScore >= 76)
  };
}
