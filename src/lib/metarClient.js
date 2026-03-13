export function getFlightCategoryColor(fltCat) {
  switch (fltCat?.toUpperCase()) {
    case 'VFR': return '#22c55e';
    case 'MVFR': return '#3b82f6';
    case 'IFR': return '#ef4444';
    case 'LIFR': return '#d946ef';
    default: return '#6b7280'; // gray for unknown
  }
}

export function isMetarStale(obsTime) {
  if (!obsTime) return { stale: true, age: 999 };
  const now = Date.now() / 1000;
  const ageSecs = now - obsTime;
  const ageMins = ageSecs / 60;
  return {
    stale: ageMins > 30,
    age: ageMins
  };
}

export async function fetchMetarData(stations) {
  if (!stations || stations.length === 0) return [];

  // Group stations (max 50)
  const ids = stations.join(',');
  const url = `/api/metar-proxy?ids=${ids}&format=json`; 
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) {
        console.warn("METAR API rate limited");
      } else {
        console.warn(`METAR API failed: ${response.status}`);
      }
      return [];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map(obs => {
      // Find highest cloud cover
      // For mapping, we rely on aviationweather.gov JSON response structure
      let cover = 'CLR';
      if (obs.clouds && obs.clouds.length > 0) {
        cover = obs.clouds.reduce((highest, current) => {
          const tiers = { 'CLR':0, 'FEW':1, 'SCT':2, 'BKN':3, 'OVC':4 };
          return ((tiers[current.cover] || 0) > (tiers[highest] || 0)) ? current.cover : highest;
        }, 'CLR');
      } else if (obs.rawOb?.includes('OVC')) cover = 'OVC';
      else if (obs.rawOb?.includes('BKN')) cover = 'BKN';
      else if (obs.rawOb?.includes('SCT')) cover = 'SCT';
      else if (obs.rawOb?.includes('FEW')) cover = 'FEW';

      return {
        icao: obs.icaoId,
        name: obs.name || obs.icaoId,
        lat: obs.lat,
        lng: obs.lon, // API sends 'lon'
        obsTime: obs.obsTime,
        rawOb: obs.rawOb,
        fltCat: obs.fltcat || 'VFR',
        temp: obs.temp,
        dewp: obs.dewp,
        wdir: obs.wdir === 'VRB' ? 'VRB' : (obs.wdir || 0),
        wspd: obs.wspd || 0,
        wgst: obs.wgst || null,
        visib: obs.visib,
        altim: obs.altim,
        clouds: obs.clouds || [],
        cover: cover
      };
    });
  } catch (error) {
    console.warn("Fetch metar data error:", error);
    return [];
  }
}
