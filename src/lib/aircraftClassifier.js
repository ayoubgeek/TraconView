// @ts-check
/** @import { Aircraft } from '../types/index.js' */

import { isMilitaryByHex } from './militaryHexRanges';
import { isMilitaryByCallsign } from './militaryCallsigns';

const CATEGORIES = [
  'military', 'helicopter', 'business_jet', 'general_aviation',
  'cargo', 'commercial', 'unknown'
];

/**
 * Classifies an aircraft into one of 7 standard categories based on database info and heuristics.
 * Priority: Military -> Helicopter -> Business Jet -> GA -> Cargo -> Commercial -> Unknown
 *
 * @param {Aircraft} aircraft The live aircraft object containing id, callsign, speed, altitude, etc.
 * @param {any|null} dbInfo Optional database info about the aircraft (e.g., from registration db)
 * @returns {{category: string, categoryConfidence: 'high'|'heuristic'}}
 */
export function classifyAircraft(aircraft, dbInfo = null) {
  // If database provides a direct high-confidence category, use it if valid
  if (dbInfo?.category && CATEGORIES.includes(dbInfo.category)) {
    return { category: dbInfo.category, categoryConfidence: 'high' };
  }

  // 1. Military (highest priority heuristic)
  if (isMilitaryByHex(aircraft.id) || isMilitaryByCallsign(aircraft.callsign || '')) {
    return { category: 'military', categoryConfidence: 'heuristic' };
  }

  // 2. Helicopter
  if (dbInfo?.isHelicopter || dbInfo?.typeCode?.startsWith('H') || dbInfo?.engineType === 'rotorcraft') {
    return { category: 'helicopter', categoryConfidence: 'heuristic' };
  }

  // 3. Business Jet
  if (dbInfo?.isBusinessJet || dbInfo?.description === 'Business Jet') {
    return { category: 'business_jet', categoryConfidence: 'heuristic' };
  }

  // 4. General Aviation
  // Heuristic: callsign starts with N followed by numbers (US generic)
  if (dbInfo?.isGeneralAviation || dbInfo?.description === 'General Aviation') {
    return { category: 'general_aviation', categoryConfidence: 'heuristic' };
  }
  if (aircraft.callsign && aircraft.callsign.match(/^N\d+[A-Z]*$/)) {
    return { category: 'general_aviation', categoryConfidence: 'heuristic' };
  }

  // 5. Cargo
  const cargoPrefixes = ['FDX', 'UPS', 'GTI', 'PAC', 'ABX', 'ATI'];
  if (dbInfo?.isCargo || (aircraft.callsign && cargoPrefixes.some(p => aircraft.callsign?.startsWith(p)))) {
    return { category: 'cargo', categoryConfidence: 'heuristic' };
  }

  // 6. Commercial
  const commercialPrefixes = ['DAL', 'UAL', 'AAL', 'AFR', 'BAW', 'SWA', 'RYR', 'EZS', 'JBU', 'NKS', 'ASA'];
  if (dbInfo?.isCommercial || (aircraft.callsign && commercialPrefixes.some(p => aircraft.callsign?.startsWith(p)))) {
    return { category: 'commercial', categoryConfidence: 'heuristic' };
  }
  
  // Coarse heuristic for commercial: if speed is typical of airliners (>300kts) and high altitude (>20000)
  if ((aircraft.speed || 0) > 300 && (aircraft.altitude || 0) > 20000) {
    return { category: 'commercial', categoryConfidence: 'heuristic' };
  }

  // 7. Unknown
  return { category: 'unknown', categoryConfidence: 'heuristic' };
}
