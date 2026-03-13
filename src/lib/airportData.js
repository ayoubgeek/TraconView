import europe from '../data/airports/europe.json';
import morocco from '../data/airports/morocco.json';
import germany from '../data/airports/germany.json';
import northAmerica from '../data/airports/north-america.json';

const AIRPORT_REGIONS = {
  EUROPE: europe,
  MOROCCO: morocco,
  GERMANY: germany,
  NORTH_AMERICA: northAmerica,
  GLOBAL: [...europe, ...morocco, ...germany, ...northAmerica]
};

/**
 * Loads the list of static airports for a given region key.
 * @param {string} regionKey - The region identifier from constants.js (e.g. 'EUROPE')
 * @returns {Array} List of AirportInfo objects
 */
export function getAirportsForRegion(regionKey) {
  return AIRPORT_REGIONS[regionKey] || [];
}
