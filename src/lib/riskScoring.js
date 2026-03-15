// @ts-check
/** @import { Aircraft, RiskScoreResult, RiskFactor } from '../types/index.js' */
import { RISK_SCORE_BOUNDS } from './constants';

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

/**
 * Maps a numeric score to a threshold category.
 * @param {number} score
 * @returns {string} 
 */
export function getThreshold(score) {
  if (score >= RISK_SCORE_BOUNDS.CRITICAL) return 'CRITICAL';
  if (score >= RISK_SCORE_BOUNDS.WARNING) return 'WARNING';
  if (score >= RISK_SCORE_BOUNDS.CAUTION) return 'CAUTION';
  if (score >= RISK_SCORE_BOUNDS.WATCH) return 'WATCH';
  return 'NORMAL';
}

/**
 * Computes risk score for an aircraft based on configured rules
 * @param {Aircraft} aircraft
 * @param {any} [prevResult] 
 * @returns {RiskScoreResult}
 */
export function computeRiskScore(aircraft, prevResult = null) {
  const prevScore = typeof prevResult === 'number' ? prevResult : (prevResult ? prevResult.score : 0);
  let score = 0;
  /** @type {import('../types/index.js').RiskFactor[]} */
  const rules = [];
  
  const now = Date.now() / 1000;
  const {
    squawk, verticalRate, altitude, speed, onGround, spi, lastSeen
  } = aircraft;

  if (squawk === '7700') {
    score += 50;
    const r = RISK_RULES.find(r => r.id === 'SQUAWK_7700');
    if (r) rules.push(r);
  }
  if (squawk === '7500') {
    score += 50;
    const r = RISK_RULES.find(r => r.id === 'SQUAWK_7500');
    if (r) rules.push(r);
  }
  if (squawk === '7600') {
    score += 35;
    const r = RISK_RULES.find(r => r.id === 'SQUAWK_7600');
    if (r) rules.push(r);
  }
  
  if ((verticalRate || 0) < -2000 && (altitude || 0) > 10000) {
    score += 25;
    const r = RISK_RULES.find(r => r.id === 'RAPID_DESCENT_HIGH');
    if (r) rules.push(r);
  }
  if ((verticalRate || 0) < -1500 && (altitude || 0) > 5000 && (altitude || 0) <= 10000) {
    score += 15;
    const r = RISK_RULES.find(r => r.id === 'RAPID_DESCENT_LOW');
    if (r) rules.push(r);
  }
  
  if ((speed || 0) < 150 && (altitude || 0) > 25000) {
    score += 10;
    const r = RISK_RULES.find(r => r.id === 'UNUSUAL_SPEED');
    if (r) rules.push(r);
  }
  
  if (spi === true) {
    score += 10;
    const r = RISK_RULES.find(r => r.id === 'SPI_ACTIVE');
    if (r) rules.push(r);
  }
  
  if ((now - lastSeen) > 30) {
    score += 5;
    const r = RISK_RULES.find(r => r.id === 'DATA_GAP');
    if (r) rules.push(r);
  }
  
  if ((altitude || 0) < 1000 && (altitude || 0) > 0 && !onGround) {
    score += 5;
    const r = RISK_RULES.find(r => r.id === 'LOW_ALTITUDE');
    if (r) rules.push(r);
  }

  const cappedScore = Math.min(score, 100);
  const threshold = getThreshold(cappedScore);
  
  // Explanation Tracking
  const nowISO = new Date().toISOString();
  let firstDetectedAt = null;
  let resolvedAt = null;
  let resolutionReason = null;
  
  const prevExplanation = prevResult && prevResult.explanation ? prevResult.explanation : {};
  
  if (cappedScore > 10) {
      // Active anomaly
      firstDetectedAt = prevExplanation.firstDetectedAt || nowISO;
      resolvedAt = null; // clear any previous resolution
      resolutionReason = null;
  } else {
      if (prevScore > 10) {
          // Just resolved
          firstDetectedAt = prevExplanation.firstDetectedAt;
          resolvedAt = nowISO;
          
          const prevRules = prevExplanation.factors || [];
          const droppedRule = prevRules.find(/** @param {import('../types/index.js').RiskFactor} pr */ pr => !rules.some(r => r.id === pr.id));
          if (droppedRule) {
             resolutionReason = `${droppedRule.label} condition returned to normal`;
          } else {
             resolutionReason = "Conditions returned to normal";
          }
      } else {
          // Stayed normal or stayed resolved
          firstDetectedAt = prevExplanation.firstDetectedAt || null;
          resolvedAt = prevExplanation.resolvedAt || null;
          resolutionReason = prevExplanation.resolutionReason || null;
      }
  }
  
  return {
    score: cappedScore,
    threshold,
    rules,
    isNewCritical: (prevScore < RISK_SCORE_BOUNDS.CRITICAL && cappedScore >= RISK_SCORE_BOUNDS.CRITICAL),
    explanation: {
       factors: rules,
       firstDetectedAt,
       resolvedAt,
       resolutionReason
    }
  };
}
