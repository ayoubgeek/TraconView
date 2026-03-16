/**
 * @file airports.js
 * @description Airport ICAO code to country/name lookup and flag emoji utilities.
 */

/** Map of country name → ISO 3166-1 alpha-2 code for flag emoji */
const COUNTRY_CODES = {
  'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Argentina': 'AR',
  'Armenia': 'AM', 'Australia': 'AU', 'Austria': 'AT', 'Azerbaijan': 'AZ',
  'Bahrain': 'BH', 'Bangladesh': 'BD', 'Belarus': 'BY', 'Belgium': 'BE',
  'Bolivia': 'BO', 'Bosnia and Herzegovina': 'BA', 'Brazil': 'BR', 'Bulgaria': 'BG',
  'Cambodia': 'KH', 'Canada': 'CA', 'Chile': 'CL', 'China': 'CN',
  'Colombia': 'CO', 'Costa Rica': 'CR', 'Croatia': 'HR', 'Cuba': 'CU',
  'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Czechia': 'CZ',
  'Denmark': 'DK', 'Dominican Republic': 'DO',
  'Ecuador': 'EC', 'Egypt': 'EG', 'El Salvador': 'SV', 'Estonia': 'EE', 'Ethiopia': 'ET',
  'Finland': 'FI', 'France': 'FR',
  'Georgia': 'GE', 'Germany': 'DE', 'Ghana': 'GH', 'Greece': 'GR', 'Guatemala': 'GT',
  'Honduras': 'HN', 'Hong Kong': 'HK', 'Hungary': 'HU',
  'Iceland': 'IS', 'India': 'IN', 'Indonesia': 'ID', 'Iran': 'IR', 'Iraq': 'IQ',
  'Ireland': 'IE', 'Israel': 'IL', 'Italy': 'IT',
  'Jamaica': 'JM', 'Japan': 'JP', 'Jordan': 'JO',
  'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kuwait': 'KW', 'Kyrgyzstan': 'KG',
  'Latvia': 'LV', 'Lebanon': 'LB', 'Libya': 'LY', 'Lithuania': 'LT', 'Luxembourg': 'LU',
  'Malaysia': 'MY', 'Maldives': 'MV', 'Malta': 'MT', 'Mexico': 'MX',
  'Moldova': 'MD', 'Mongolia': 'MN', 'Montenegro': 'ME', 'Morocco': 'MA', 'Mozambique': 'MZ',
  'Nepal': 'NP', 'Netherlands': 'NL', 'New Zealand': 'NZ', 'Nicaragua': 'NI',
  'Nigeria': 'NG', 'North Macedonia': 'MK', 'Norway': 'NO',
  'Oman': 'OM',
  'Pakistan': 'PK', 'Panama': 'PA', 'Paraguay': 'PY', 'Peru': 'PE',
  'Philippines': 'PH', 'Poland': 'PL', 'Portugal': 'PT',
  'Qatar': 'QA',
  'Romania': 'RO', 'Russia': 'RU', 'Russian Federation': 'RU', 'Rwanda': 'RW',
  'Saudi Arabia': 'SA', 'Senegal': 'SN', 'Serbia': 'RS', 'Singapore': 'SG',
  'Slovakia': 'SK', 'Slovenia': 'SI', 'South Africa': 'ZA', 'South Korea': 'KR',
  'Spain': 'ES', 'Sri Lanka': 'LK', 'Sweden': 'SE', 'Switzerland': 'CH',
  'Syria': 'SY',
  'Taiwan': 'TW', 'Tanzania': 'TZ', 'Thailand': 'TH', 'Tunisia': 'TN',
  'Turkey': 'TR', 'Turkmenistan': 'TM',
  'Uganda': 'UG', 'Ukraine': 'UA', 'United Arab Emirates': 'AE',
  'United Kingdom': 'GB', 'United States': 'US', 'Uruguay': 'UY', 'Uzbekistan': 'UZ',
  'Venezuela': 'VE', 'Vietnam': 'VN',
  'Yemen': 'YE', 'Zambia': 'ZM', 'Zimbabwe': 'ZW'
};

/**
 * Convert ISO 3166-1 alpha-2 code to flag emoji.
 * @param {string} countryCode
 * @returns {string}
 */
export function countryCodeToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = [...countryCode.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

/**
 * Get flag emoji from country name (as returned by OpenSky).
 * @param {string} countryName
 * @returns {string}
 */
export function countryNameToFlag(countryName) {
  if (!countryName) return '';
  const code = COUNTRY_CODES[countryName];
  return code ? countryCodeToFlag(code) : '';
}

/**
 * ICAO airport prefix → country code mapping.
 * First letter(s) of ICAO code determine the country/region.
 */
const ICAO_PREFIX_MAP = {
  'ED': 'DE', 'ET': 'DE',  // Germany
  'EG': 'GB',               // United Kingdom
  'LF': 'FR',               // France
  'LI': 'IT',               // Italy
  'LE': 'ES', 'GC': 'ES',  // Spain
  'EH': 'NL',               // Netherlands
  'EB': 'BE',               // Belgium
  'EL': 'LU',               // Luxembourg
  'LS': 'CH',               // Switzerland
  'LO': 'AT',               // Austria
  'EP': 'PL',               // Poland
  'LK': 'CZ',               // Czech Republic
  'LZ': 'SK',               // Slovakia
  'LH': 'HU',               // Hungary
  'LR': 'RO',               // Romania
  'LB': 'BG',               // Bulgaria
  'LG': 'GR',               // Greece
  'LT': 'TR',               // Turkey
  'EK': 'DK',               // Denmark
  'EN': 'NO',               // Norway
  'ES': 'SE',               // Sweden
  'EF': 'FI',               // Finland
  'EE': 'EE',               // Estonia
  'EV': 'LV',               // Latvia
  'EY': 'LT',               // Lithuania
  'BI': 'IS',               // Iceland
  'EI': 'IE',               // Ireland
  'LP': 'PT',               // Portugal
  'LD': 'HR',               // Croatia
  'LJ': 'SI',               // Slovenia
  'LY': 'RS',               // Serbia
  'LQ': 'BA',               // Bosnia
  'LC': 'CY',               // Cyprus
  'LL': 'IL',               // Israel
  'OJ': 'JO',               // Jordan
  'OL': 'LB',               // Lebanon
  'OS': 'SY',               // Syria
  'OI': 'IR',               // Iran
  'OR': 'IQ',               // Iraq
  'OK': 'KW',               // Kuwait
  'OE': 'SA',               // Saudi Arabia
  'OM': 'AE',               // UAE
  'OT': 'QA',               // Qatar
  'OB': 'BH',               // Bahrain
  'OO': 'OM',               // Oman
  'DA': 'DZ',               // Algeria
  'DT': 'TN',               // Tunisia
  'GM': 'MA',               // Morocco
  'HL': 'LY',               // Libya
  'HE': 'EG',               // Egypt
  'HA': 'ET',               // Ethiopia
  'HK': 'KE',               // Kenya
  'FA': 'ZA',               // South Africa
  'DN': 'NG',               // Nigeria
  'K': 'US',                // USA
  'C': 'CA',                // Canada
  'MM': 'MX',               // Mexico
  'SB': 'BR',               // Brazil
  'SA': 'AR',               // Argentina
  'RJ': 'JP', 'RO': 'JP',  // Japan
  'RK': 'KR',               // South Korea
  'RC': 'TW',               // Taiwan
  'ZB': 'CN', 'ZG': 'CN', 'ZH': 'CN', 'ZJ': 'CN', 'ZL': 'CN', 'ZP': 'CN', 'ZS': 'CN', 'ZU': 'CN', 'ZW': 'CN', 'ZY': 'CN', // China
  'VI': 'IN', 'VA': 'IN', 'VE': 'IN', 'VO': 'IN', // India
  'VT': 'TH',               // Thailand
  'WS': 'SG',               // Singapore
  'WM': 'MY', 'WB': 'MY',  // Malaysia
  'WI': 'ID', 'WA': 'ID', 'WR': 'ID', // Indonesia
  'RP': 'PH',               // Philippines
  'VV': 'VN',               // Vietnam
  'Y': 'AU',                // Australia
  'NZ': 'NZ',               // New Zealand
  'U': 'RU',                // Russia
  'UK': 'UA',               // Ukraine
};

/**
 * Get country flag emoji from an ICAO airport code.
 * @param {string} icaoCode - e.g. "EDDF", "EGLL", "KJFK"
 * @returns {string} flag emoji or empty string
 */
export function airportToFlag(icaoCode) {
  if (!icaoCode || icaoCode.length < 2) return '';
  const upper = icaoCode.toUpperCase();

  // Try 2-letter prefix first, then 1-letter
  const cc = ICAO_PREFIX_MAP[upper.substring(0, 2)] || ICAO_PREFIX_MAP[upper.substring(0, 1)];
  return cc ? countryCodeToFlag(cc) : '';
}
