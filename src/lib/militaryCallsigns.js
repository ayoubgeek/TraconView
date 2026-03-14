export const MILITARY_CALLSIGN_PREFIXES = [
  'RCH', 'CNV', 'EVAC', 'SPAR', 'JAKE', 'VALOR', 'PAT', 'NAVY', 'COAST',
  'GAF', 'RRR', 'CTM', 'IAM', 'AME', 'LION', 'BAF', 'NATO'
];

/**
 * Checks if an aircraft is military based on its callsign prefix.
 * @param {string} callsign The callsign to check
 * @returns {boolean} True if military, false otherwise
 */
export function isMilitaryByCallsign(callsign) {
  if (!callsign || typeof callsign !== 'string') return false;
  const upper = callsign.toUpperCase();
  return MILITARY_CALLSIGN_PREFIXES.some(prefix => upper.startsWith(prefix));
}
