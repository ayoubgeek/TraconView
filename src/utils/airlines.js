/**
 * @file airlines.js
 * @description Provides a lookup mapping from 3-letter ICAO callsign prefixes to Airline Names.
 */

// A curated list of common global airlines
const ICAO_AIRLINE_MAP = {
  'AAL': 'American Airlines',
  'UAL': 'United Airlines',
  'DAL': 'Delta Air Lines',
  'SWA': 'Southwest Airlines',
  'BAW': 'British Airways',
  'AFR': 'Air France',
  'DLH': 'Lufthansa',
  'KLM': 'KLM Royal Dutch Airlines',
  'UAE': 'Emirates',
  'QFA': 'Qantas',
  'ACA': 'Air Canada',
  'JBU': 'JetBlue Airways',
  'ASA': 'Alaska Airlines',
  'NKS': 'Spirit Airlines',
  'FFT': 'Frontier Airlines',
  'RYR': 'Ryanair',
  'EZY': 'easyJet',
  'THY': 'Turkish Airlines',
  'QTR': 'Qatar Airways',
  'SIA': 'Singapore Airlines',
  'CPA': 'Cathay Pacific',
  'ANA': 'All Nippon Airways',
  'JAL': 'Japan Airlines',
  'ANZ': 'Air New Zealand',
  'VIR': 'Virgin Atlantic',
  'VOZ': 'Virgin Australia',
  'HAL': 'Hawaiian Airlines',
  'ENY': 'Envoy Air',
  'RPA': 'Republic Airways',
  'SKW': 'SkyWest Airlines',
  'WJA': 'WestJet',
  'TSC': 'Air Transat',
  'SVR': 'Ural Airlines',
  'AFL': 'Aeroflot',
  'AIC': 'Air India',
  'IGO': 'IndiGo',
  'CCA': 'Air China',
  'CSN': 'China Southern Airlines',
  'CES': 'China Eastern Airlines',
  'KAL': 'Korean Air',
  'AAR': 'Asiana Airlines',
  'SAS': 'Scandinavian Airlines',
  'FIN': 'Finnair',
  'IBE': 'Iberia',
  'AEA': 'Air Europa',
  'VLG': 'Vueling',
  'TAP': 'TAP Air Portugal',
  'AZA': 'ITA Airways',
  'SWR': 'Swiss International Air Lines',
  'AUA': 'Austrian Airlines',
  'ELY': 'El Al',
  'MEA': 'Middle East Airlines',
  'ETH': 'Ethiopian Airlines',
  'KQA': 'Kenya Airways',
  'ATN': 'Air Transport International',
  'GTI': 'Atlas Air',
  'UPS': 'UPS Airlines',
  'FDX': 'FedEx Express',
  'ABW': 'AirBridgeCargo',
  'SXS': 'SunExpress',
  'PGT': 'Pegasus Airlines',
  'TAR': 'Tunisair',
  'DAH': 'Air Algerie',
  'RAM': 'Royal Air Maroc',
  'MSR': 'EgyptAir',
  'RJA': 'Royal Jordanian',
  'OMA': 'Oman Air',
  'GFA': 'Gulf Air',
  'SVA': 'Saudia',
  'KAC': 'Kuwait Airways',
  'TGZ': 'Air Georgia',
  'LOT': 'LOT Polish Airlines',
  'WZZ': 'Wizz Air',
  'EXS': 'Jet2.com',
  'BEE': 'Flybe',
  'EIN': 'Aer Lingus',
  'ICE': 'Icelandair',
  'AMX': 'Aeromexico',
  'VOI': 'Volaris',
  'CMP': 'Copa Airlines',
  'AVA': 'Avianca',
  'LAN': 'LATAM Airlines',
  'TAM': 'LATAM Brasil',
  'GOL': 'GOL Linhas Aereas',
  'AZU': 'Azul Brazilian Airlines',
  'AEP': 'Aerolineas Argentinas',
  'SKY': 'Sky Airline',
  'TWA': 'Trans World Airlines',
  'PAA': 'Pan American World Airways',
  'CKS': 'Kalitta Air',
  'PAC': 'Polar Air Cargo',
  'SYB': 'Syrian Air'
};

/**
 * Extracts the 3-letter ICAO prefix from a callsign and looks up the airline name.
 * Returns null if the callsign isn't standard format or airline is unknown.
 * @param {string} callsign - The flight callsign (e.g., "AAL123" or "BAW45R")
 * @returns {string|null} - The airline name (e.g., "American Airlines") or null
 */
export function callsignToAirline(callsign) {
  if (!callsign || callsign.length < 3) return null;
  // Match the first 3 letters as the ICAO code
  const match = callsign.match(/^([A-Z]{3})/i);
  if (!match) return null;
  
  const prefix = match[1].toUpperCase();
  return ICAO_AIRLINE_MAP[prefix] || null;
}
