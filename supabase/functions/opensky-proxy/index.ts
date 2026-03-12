// supabase/functions/opensky-proxy/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REGIONS = {
  EUROPE: { lamin: 35.0, lamax: 72.0, lomin: -15.0, lomax: 40.0 },
  MOROCCO: { lamin: 20.0, lamax: 37.0, lomin: -18.0, lomax: 5.0 },
  NORTH_AMERICA: { lamin: 24.0, lamax: 71.0, lomin: -125.0, lomax: -66.0 },
  GERMANY: { lamin: 47.0, lamax: 55.0, lomin: 5.0, lomax: 15.0 },
  GLOBAL: { lamin: -90.0, lamax: 90.0, lomin: -180.0, lomax: 180.0 }
};

// Global cache (lives across invocations within same Deno isolate)
const cache = new Map<string, { data: any, expires: number }>();
let oauthToken: string | null = null;
let tokenExpiresAt = 0;

async function getOpenSkyToken() {
  const now = Date.now();
  if (oauthToken && now < tokenExpiresAt) {
    return oauthToken;
  }

  const clientId = Deno.env.get('OPENSKY_CLIENT_ID');
  const clientSecret = Deno.env.get('OPENSKY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.warn("OPENSKY_CLIENT_ID or SECRET not set. Falling back to anonymous access.");
    return null;
  }

  const response = await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
  });

  if (!response.ok) {
    throw new Error(`Failed to get OpenSky token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  oauthToken = data.access_token;
  // Expires is in seconds, subtract 60s for safety margin
  tokenExpiresAt = now + ((data.expires_in - 60) * 1000);
  
  return oauthToken;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const regionKey = url.searchParams.get('region') || 'EUROPE';
    
    // Validate region
    const bounds = REGIONS[regionKey as keyof typeof REGIONS];
    if (!bounds) {
      return new Response(JSON.stringify({ error: "Invalid region", valid: Object.keys(REGIONS) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check Cache (15s TTL)
    const now = Date.now();
    const cachedEntry = cache.get(regionKey);
    if (cachedEntry && now < cachedEntry.expires) {
      return new Response(JSON.stringify(cachedEntry.data), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Fetch new token if configured
    const token = await getOpenSkyToken();
    
    // Construct URL with bounding box
    // Global uses no bounding box
    let apiUrl = 'https://opensky-network.org/api/states/all';
    if (regionKey !== 'GLOBAL') {
      apiUrl += `?lamin=${bounds.lamin}&lamax=${bounds.lamax}&lomin=${bounds.lomin}&lomax=${bounds.lomax}`;
    }

    const fetchHeaders: HeadersInit = {};
    if (token) {
      fetchHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(apiUrl, { headers: fetchHeaders });
    
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfter: 60 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }
    
    if (!response.ok) {
        throw new Error(`OpenSky API Error: ${response.status}`);
    }

    const { time, states } = await response.json();
    
    // OpenSky returns states as an array of arrays
    // For proxy we just forward the payload, and append some meta.
    // However, the contract in spec says: "aircraft: Aircraft[] | Array of transformed aircraft objects"
    // So the proxy is expected to return the raw arrays and we transform in the frontend, OR transform here.
    // Let's pass the raw states array and let transformers.js handle it to save Deno CPU compute and distribute to clients.
    // Wait, the API contract says "Array of transformed aircraft objects". 
    // Let's stick to the frontend doing it: the contract says `aircraft: Aircraft[]`.
    // Actually, passing the raw `states` to the frontend and transforming there makes more sense, 
    // but to adhere strictly to the `opensky-proxy-api.md` contract I wrote:
    // the proxy returns `aircraft: [{ id, callsign, ... }]`
    
    // To match the contract natively in the Edge function:
    const aircraft = (states || []).map((raw: any[]) => {
      const id = raw[0];
      let callsign = raw[1] ? String(raw[1]).trim() : '';
      if (!callsign) callsign = id;
      
      return {
        id,
        callsign,
        country: raw[2],
        lastSeen: raw[4],
        lng: raw[5] !== null ? raw[5] : null,
        lat: raw[6] !== null ? raw[6] : null,
        altitude: raw[7] !== null ? raw[7] * 3.28084 : 0,
        onGround: !!raw[8],
        speed: raw[9] !== null ? raw[9] * 1.94384 : 0,
        heading: raw[10] !== null ? raw[10] : 0,
        verticalRate: raw[11] !== null ? raw[11] * 196.85 : 0,
        squawk: raw[14] !== null ? String(raw[14]) : null,
        spi: !!raw[15],
        source: ['ADSB','ASTERIX','MLAT','FLARM'][raw[16]] || 'UNKNOWN'
      };
    });

    const payload = {
      time: time,
      aircraft: aircraft,
      meta: {
        region: regionKey,
        count: aircraft.length,
        cached: false,
        creditWarning: false // Needs X-Rate-Limit-Remaining headers logic
      }
    };

    const remaining = response.headers.get('x-rate-limit-remaining');
    if (remaining && parseInt(remaining) < 500) {
      payload.meta.creditWarning = true;
    }

    // Cache the response block for 15s
    const cachePayload = { ...payload, meta: { ...payload.meta, cached: true } };
    cache.set(regionKey, { data: cachePayload, expires: now + 15000 });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
})
