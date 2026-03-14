import { createClient } from 'npm:@supabase/supabase-js@2'

// Using npm specifier for Supabase in Deno
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const REGIONS = ['EUROPE', 'MOROCCO', 'NORTH_AMERICA', 'GERMANY', 'GLOBAL']

const OPENSKY_API_URL = 'https://opensky-network.org/api/states/all';

// Mock function representing risk scoring to count anomalies roughly
// This is typically shared or replicated logic for the edge function
function getAnomalySeverity(ac: any) {
  // basic mock for severity based on emergency flags
  if (ac.squawk === '7700') return 'CRITICAL';
  if (ac.squawk === '7600' || ac.squawk === '7500') return 'WARNING';
  if ((ac.baro_altitude && ac.baro_altitude < 1000 && !ac.on_ground) && ac.velocity > 250) return 'CAUTION';
  if (ac.velocity > 550) return 'WATCH';
  return 'NORMAL';
}

Deno.serve(async (req) => {
  const results = [];
  
  for (const region of REGIONS) {
    try {
      // In a real scenario, limits bbox via OpenSky API for region.
      // E.g., ?lamin=45.8&lomin=5.9&lamax=47.8&lomax=10.5
      // To prevent taking too long and getting rate-limited by standard opensky, 
      // we'll fetch a small bbox or mock it in this phase, 
      // but the exact opensky call depends on region bounds.
      
      const res = await fetch(OPENSKY_API_URL);
      if (!res.ok) throw new Error(`OpenSky fetch failed: ${res.statusText}`);
      
      const data = await res.json();
      const states = data.states || [];
      
      // Compute statistics
      const total_aircraft = states.length;
      let in_flight = 0;
      let active_anomalies = 0;
      const anomaliesBySeverity: Record<string, number> = { CRITICAL: 0, WARNING: 0, CAUTION: 0, WATCH: 0 };
      const countries: Record<string, number> = {};
      const altitudeBands = { low: 0, medium: 0, high: 0 };
      
      let sumAlt = 0;
      let sumSpeed = 0;
      let freshDataCount = 0;
      
      const now = Date.now() / 1000;
      
      for (const st of states) {
        // st format: [icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, baro_altitude, on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source]
        const ac = {
          origin_country: st[2],
          last_contact: st[4],
          baro_altitude: st[7],
          on_ground: st[8],
          velocity: st[9],
          squawk: st[14]
        };
        
        if (!ac.on_ground) in_flight++;
        if (now - ac.last_contact < 60) freshDataCount++;
        
        // Country
        countries[ac.origin_country] = (countries[ac.origin_country] || 0) + 1;
        
        // Altitude
        const altFt = ac.baro_altitude ? ac.baro_altitude * 3.28084 : 0;
        sumAlt += altFt;
        if (altFt < 10000) altitudeBands.low++;
        else if (altFt < 30000) altitudeBands.medium++;
        else altitudeBands.high++;
        
        // Speed
        const speedKts = ac.velocity ? ac.velocity * 1.94384 : 0;
        sumSpeed += speedKts;
        
        // Anomaly
        const sev = getAnomalySeverity(ac);
        if (sev !== 'NORMAL') {
          active_anomalies++;
          anomaliesBySeverity[sev]++;
        }
      }
      
      // Top 10 countries
      const sortedCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]);
      const top10 = sortedCountries.slice(0, 10);
      const otherCountries = sortedCountries.slice(10).reduce((acc, curr) => acc + curr[1], 0);
      const countryBreakdown = Object.fromEntries(top10);
      if (otherCountries > 0) countryBreakdown['Other'] = otherCountries;

      const statistics = {
        total: total_aircraft,
        altitudeBands,
        countryBreakdown,
        anomaliesBySeverity,
        avgAltitudeFt: total_aircraft > 0 ? sumAlt / total_aircraft : 0,
        avgSpeedKts: total_aircraft > 0 ? sumSpeed / total_aircraft : 0,
        freshDataCount
      };

      // Fetch previous snapshot to compute trends
      const { data: prevData } = await supabase
        .from('radar_snapshots')
        .select('*')
        .eq('region', region)
        .order('snapshot_time', { ascending: false })
        .limit(1);
        
      const prev = prevData && prevData.length > 0 ? prevData[0] : null;
      const trends = {
        totalDelta: prev ? total_aircraft - prev.total_aircraft : 0,
        inFlightDelta: prev ? in_flight - prev.in_flight : 0,
        anomalyDelta: prev ? active_anomalies - prev.active_anomalies : 0
      };

      // Insert snapshot
      const { data: insertResult, error } = await supabase
        .from('radar_snapshots')
        .insert({
          region,
          snapshot_time: new Date().toISOString(),
          total_aircraft,
          in_flight,
          active_anomalies,
          coverage_percent: total_aircraft > 0 ? Math.round((freshDataCount / total_aircraft) * 100) : 100,
          statistics,
          trends
        });
        
      if (error) {
         console.error(`Error inserting snapshot for ${region}:`, error);
      } else {
         results.push({ region, status: 'success' });
      }

    } catch (err) {
      console.error(`Error computing snapshot for ${region}:`, err);
      results.push({ region, status: 'error', error: err.message });
    }
  }

  return new Response(
    JSON.stringify({ status: 'completed', results }),
    { headers: { "Content-Type": "application/json" } },
  );
});
