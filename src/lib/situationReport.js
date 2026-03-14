import { formatAltitude, formatHeadingWithCardinal } from './formatters';

export function generateSituationReport(aircraft, riskResult, nearestAirport, metar = null) {
  const status = aircraft.onGround ? 'ON GROUND' : (aircraft.isHolding ? 'HOLDING PATTERN' : 'IN FLIGHT');
  
  let formattedVerticalRate = 'Level';
  if (aircraft.verticalRate > 200) formattedVerticalRate = `↑ ${Math.round(aircraft.verticalRate)} ft/min`;
  else if (aircraft.verticalRate < -200) formattedVerticalRate = `↓ ${Math.abs(Math.round(aircraft.verticalRate))} ft/min`;

  const latStr = `${Math.abs(aircraft.lat).toFixed(4)}°${aircraft.lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(aircraft.lng).toFixed(4)}°${aircraft.lng >= 0 ? 'E' : 'W'}`;

  const sections = {
    identity: {
      callsign: aircraft.callsign || 'UNKNOWN',
      icao24: aircraft.id || 'N/A',
      country: aircraft.country || 'Unknown'
    },
    status,
    position: {
      coordinates: `${latStr}, ${lngStr}`,
      altitude: formatAltitude(aircraft.altitude),
      speed: `${Math.round(aircraft.speed || 0)} kts GS`,
      heading: formatHeadingWithCardinal(aircraft.heading),
      verticalRate: formattedVerticalRate
    },
    nearestAirport: nearestAirport ? {
      icao: nearestAirport.icao,
      name: nearestAirport.name || nearestAirport.icao,
      distance: `${Math.round(nearestAirport.distance)} nm`,
      bearing: formatHeadingWithCardinal(nearestAirport.bearing)
    } : null,
    riskAssessment: {
      score: `${riskResult?.score || 0}/100`,
      threshold: riskResult?.threshold || 'NORMAL',
      breakdown: (riskResult?.rules || []).map(r => `${r.label} (+${r.weight})`)
    },
    weather: metar ? {
      category: metar.fltCat || 'UNKNOWN',
      wind: `${metar.wdir}° at ${metar.wspd} kts${metar.wgst ? `, gusting ${metar.wgst} kts` : ''}`,
      visibility: `${metar.visib} SM`,
      ceiling: metar.clouds && metar.clouds.length > 0 
        ? metar.clouds.map(c => `${c.cover} at ${(c.base || 0).toLocaleString()} ft`).join(', ') 
        : 'CLR',
      rawMetar: metar.rawOb || 'N/A'
    } : null
  };

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  let formatted = `═══════════════════════════════════════\n`;
  formatted += `  SITUATION REPORT — ${sections.identity.callsign}\n`;
  formatted += `  Generated: ${now}\n`;
  formatted += `═══════════════════════════════════════\n\n`;

  formatted += `▶ IDENTITY\n`;
  formatted += `  Callsign:  ${sections.identity.callsign}\n`;
  formatted += `  ICAO24:    ${sections.identity.icao24}\n`;
  formatted += `  Registry:  ${sections.identity.country}\n\n`;

  formatted += `▶ STATUS: ${sections.status}\n\n`;

  formatted += `▶ POSITION\n`;
  formatted += `  Coordinates: ${sections.position.coordinates}\n`;
  formatted += `  Altitude:    ${sections.position.altitude}\n`;
  formatted += `  Speed:       ${sections.position.speed}\n`;
  formatted += `  Heading:     ${sections.position.heading}\n`;
  formatted += `  Vert. Rate:  ${sections.position.verticalRate}\n\n`;

  formatted += `▶ NEAREST AIRPORT\n`;
  if (sections.nearestAirport) {
    formatted += `  ${sections.nearestAirport.icao} — ${sections.nearestAirport.name}\n`;
    formatted += `  Distance: ${sections.nearestAirport.distance} | Bearing: ${sections.nearestAirport.bearing}\n\n`;
  } else {
    formatted += `  No airports nearby\n\n`;
  }

  formatted += `▶ RISK ASSESSMENT [${sections.riskAssessment.score} — ${sections.riskAssessment.threshold}]\n`;
  if (sections.riskAssessment.breakdown.length === 0) {
    formatted += `  • No active risk factors\n\n`;
  } else {
    sections.riskAssessment.breakdown.forEach(b => {
      formatted += `  • ${b}\n`;
    });
    formatted += `\n`;
  }

  if (sections.nearestAirport && sections.weather) {
    formatted += `▶ WEATHER AT ${sections.nearestAirport.icao} [${sections.weather.category}]\n`;
    formatted += `  Wind:       ${sections.weather.wind}\n`;
    formatted += `  Visibility: ${sections.weather.visibility}\n`;
    formatted += `  Ceiling:    ${sections.weather.ceiling}\n`;
    formatted += `  Raw METAR:  ${sections.weather.rawMetar}\n\n`;
  } else if (sections.nearestAirport) {
    formatted += `▶ WEATHER AT ${sections.nearestAirport.icao}\n`;
    formatted += `  Weather data unavailable\n\n`;
  }

  formatted += `═══════════════════════════════════════`;

  return { sections, formatted, generatedAt: new Date().toISOString() };
}
