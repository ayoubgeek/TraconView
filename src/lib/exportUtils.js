// @ts-check
/** @import { Aircraft } from '../types/index.js' */

/**
 * Formats aircraft data to CSV format
 * @param {Aircraft} ac 
 * @param {number} riskScore 
 * @returns {string}
 */
export function formatAircraftCsv(ac, riskScore = 0) {
  const headers = [
    'Callsign',
    'ICAO24',
    'Latitude',
    'Longitude',
    'Altitude',
    'Speed',
    'Heading',
    'Squawk',
    'RiskScore',
    'Timestamp'
  ];

  const valueRow = [
    ac.callsign || '',
    ac.id || '',
    ac.lat ?? '',
    ac.lng ?? '',
    ac.altitude ?? '',
    ac.velocity ?? '',
    ac.heading ?? '',
    ac.squawk || '',
    riskScore,
    ac.lastSeen || ''
  ];

  return headers.join(',') + '\n' + valueRow.join(',');
}

/**
 * Downloads a string content as a CSV file
 * @param {string} filename 
 * @param {string} content 
 */
export function downloadCsv(filename, content) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
