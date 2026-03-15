/* eslint-disable */
import { createClient } from 'npm:@supabase/supabase-js@2'

// Using npm specifier for Supabase in Deno
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const OPENSKY_API_URL = 'https://opensky-network.org/api/states/all';

// Region definitions with bounding boxes — must stay in sync with src/lib/constants.js REGIONS
const REGION_BOUNDS: Record<string, { south: number; north: number; west: number; east: number } | null> = {
  EUROPE:        { south: 35.0,  north: 72.0,  west: -15.0,  east: 40.0  },
  MOROCCO:       { south: 20.0,  north: 37.0,  west: -18.0,  east: 5.0   },
  NORTH_AMERICA: { south: 24.0,  north: 71.0,  west: -125.0, east: -66.0 },
  GERMANY:       { south: 47.0,  north: 55.0,  west: 5.0,    east: 15.0  },
  GLOBAL:        null, // no bbox filter — fetch everything
};

const REGIONS = Object.keys(REGION_BOUNDS);

// Risk rules replicated exactly from src/lib/riskScoring.js RISK_RULES.
// IMPORTANT: keep in sync with the frontend riskScoring.js whenever rules change.
const RISK_RULES = [
  { id: 'SQUAWK_7700',        weight: 50 },
  { id: 'SQUAWK_7500',        weight: 50 },
  { id: 'SQUAWK_7600',        weight: 35 },
  { id: 'RAPID_DESCENT_HIGH', weight: 25 },
  { id: 'RAPID_DESCENT_LOW',  weight: 15 },
  { id: 'UNUSUAL_SPEED',      weight: 10 },
  { id: 'SPI_ACTIVE',         weight: 10 },
  { id: 'DATA_GAP',           weight:  5 },
  { id: 'LOW_ALTITUDE',       weight:  5 },
];

const RISK_SCORE_BOUNDS = { CRITICAL: 76, WARNING: 51, CAUTION: 26, WATCH: 11 };

function computeAnomalyScore(ac: {
  squawk: string | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  vertical_rate: number | null;
  spi: boolean;
  last_contact: number;
}): number {
  const now = Date.now() / 1000;
  let score = 0;
  const altFt = ac.baro_altitude ? ac.baro_altitude * 3.28084 : 0;
  const speedKts = ac.velocity ? ac.velocity * 1.94384 : 0;
  const vrateFpm = ac.vertical_rate ? ac.vertical_rate * 196.85 : 0;

  if (ac.squawk === '7700') score += RISK_RULES.find(r => r.id === 'SQUAWK_7700')!.weight;
  if (ac.squawk === '7500') score += RISK_RULES.find(r => r.id === 'SQUAWK_7500')!.weight;
  if (ac.squawk === '7600') score += RISK_RULES.find(r => r.id === 'SQUAWK_7600')!.weight;
  if (vrateFpm < -2000 && altFt > 10000) score += RISK_RULES.find(r => r.id === 'RAPID_DESCENT_HIGH')!.weight;
  if (vrateFpm < -1500 && altFt > 5000 && altFt <= 10000) score += RISK_RULES.find(r => r.id === 'RAPID_DESCENT_LOW')!.weight;
  if (speedKts < 150 && altFt > 25000) score += RISK_RULES.find(r => r.id === 'UNUSUAL_SPEED')!.weight;
  if (ac.spi) score += RISK_RULES.find(r => r.id === 'SPI_ACTIVE')!.weight;
  if ((now - ac.last_contact) > 30) score += RISK_RULES.find(r => r.id === 'DATA_GAP')!.weight;
  if (altFt < 1000 && altFt > 0 && !ac.on_ground) score += RISK_RULES.find(r => r.id === 'LOW_ALTITUDE')!.weight;

  return Math.min(score, 100);
}

function getAnomalySeverity(score: number): string {
  if (score >= RISK_SCORE_BOUNDS.CRITICAL) return 'CRITICAL';
  if (score >= RISK_SCORE_BOUNDS.WARNING)  return 'WARNING';
  if (score >= RISK_SCORE_BOUNDS.CAUTION)  return 'CAUTION';
  if (score >= RISK_SCORE_BOUNDS.WATCH)    return 'WATCH';
  return 'NORMAL';
}

Deno.serve(async (req) => {
  const results = [];
  
  for (const region of REGIONS) {
    try {
      const bbox = REGION_BOUNDS[region];
      const qs = bbox
        ? `?lamin=${bbox.south}&lamax=${bbox.north}&lomin=${bbox.west}&lomax=${bbox.east}`
        : '';

      const res = await fetch(`${OPENSKY_API_URL}${qs}`);
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
          vertical_rate: st[11],
          squawk: st[14] !== null ? String(st[14]) : null,
          spi: !!st[15]
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
        
        // Anomaly — score via replicated RISK_RULES, then map to severity tier
        const anomalyScore = computeAnomalyScore(ac);
        const sev = getAnomalySeverity(anomalyScore);
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
      const { error } = await supabase
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
      results.push({ region, status: 'error', error: (err as Error).message });
    }
  }

  return new Response(
    JSON.stringify({ status: 'completed', results }),
    { headers: { "Content-Type": "application/json" } },
  );
});
