export const MILITARY_HEX_RANGES = [
  { min: 0xADF7C8, max: 0xAFFFFF }, // US
  { min: 0x43C000, max: 0x43CFFF }, // UK
  { min: 0x3E8000, max: 0x3EFFFF }, // DE
  { min: 0x3A0000, max: 0x3A7FFF }, // FR
  { min: 0x4B7000, max: 0x4B7FFF }, // CH
  { min: 0x477000, max: 0x477FFF }  // DK
];

/**
 * Checks if an aircraft is military based on its ICAO24 hex code.
 * @param {string} icao24 The 6-character hex code
 * @returns {boolean} True if military, false otherwise
 */
export function isMilitaryByHex(icao24) {
  if (!icao24 || typeof icao24 !== 'string') return false;
  
  const hexString = icao24.trim();
  if (hexString.length > 6) return false;
  
  const hexNum = parseInt(hexString, 16);
  if (isNaN(hexNum)) return false;
  
  return MILITARY_HEX_RANGES.some(range => hexNum >= range.min && hexNum <= range.max);
}
