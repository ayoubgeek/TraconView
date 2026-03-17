import fs from 'fs';

async function fetchAndMinifyAirports() {
  console.log('Fetching airports data...');
  const res = await fetch('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json');
  const data = await res.json();
  
  const minified = {};
  
  for (const [icao, apt] of Object.entries(data)) {
    // Only keep airports that have an IATA code or are major
    if (apt.iata && apt.lat && apt.lon) {
      minified[icao] = {
        icao: apt.icao,
        iata: apt.iata,
        name: apt.name,
        city: apt.city,
        country: apt.country,
        lat: apt.lat,
        lon: apt.lon,
        tz: apt.tz
      };
    }
  }
  
  fs.writeFileSync('./public/data/airports.json', JSON.stringify(minified));
  console.log(`Saved ${Object.keys(minified).length} airports to public/data/airports.json`);
}

fetchAndMinifyAirports().catch(console.error);
