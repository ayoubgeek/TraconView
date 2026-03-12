// supabase/functions/opensky-proxy/index.ts
// 
// Architecture: This Edge Function serves as a TOKEN PROXY only.
// It handles the OAuth2 client_credentials flow with OpenSky's auth server,
// then returns the access token to the frontend. The frontend uses this token
// to call the OpenSky data API directly.
//
// Why? OpenSky's data API (opensky-network.org/api/states/all) is unreachable
// from Supabase's Edge Function runtime (cloud provider IPs are blocked/throttled).
// However, the auth server (auth.opensky-network.org) IS reachable.
// The frontend browser can reach both servers without issue.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REGIONS: Record<string, { lamin: number; lamax: number; lomin: number; lomax: number }> = {
  EUROPE: { lamin: 35.0, lamax: 72.0, lomin: -15.0, lomax: 40.0 },
  MOROCCO: { lamin: 20.0, lamax: 37.0, lomin: -18.0, lomax: 5.0 },
  NORTH_AMERICA: { lamin: 24.0, lamax: 71.0, lomin: -125.0, lomax: -66.0 },
  GERMANY: { lamin: 47.0, lamax: 55.0, lomin: 5.0, lomax: 15.0 },
  GLOBAL: { lamin: -90.0, lamax: 90.0, lomin: -180.0, lomax: 180.0 }
};

// Token cache
let oauthToken: string | null = null;
let tokenExpiresAt = 0;

async function getOpenSkyToken(): Promise<string | null> {
  const now = Date.now();
  if (oauthToken && now < tokenExpiresAt) {
    return oauthToken;
  }

  const clientId = Deno.env.get('OPENSKY_CLIENT_ID');
  const clientSecret = Deno.env.get('OPENSKY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.warn("OPENSKY credentials not set");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  const response = await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`,
    signal: controller.signal
  });
  clearTimeout(timeout);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token request failed: ${response.status} ${errorText}`);
    throw new Error(`Token request failed: ${response.status}`);
  }

  const data = await response.json();
  oauthToken = data.access_token;
  // Cache token, expire 60s before actual expiry for safety
  tokenExpiresAt = now + ((data.expires_in - 60) * 1000);
  console.log("OAuth2 token obtained successfully, expires in", data.expires_in, "seconds");
  return oauthToken;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const regionKey = url.searchParams.get('region') || 'EUROPE';
    
    // Validate region
    const bounds = REGIONS[regionKey];
    if (!bounds) {
      return new Response(JSON.stringify({ error: "Invalid region", valid: Object.keys(REGIONS) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get the OAuth2 token (cached or fresh)
    const token = await getOpenSkyToken();

    // Return the token and region bounds to the frontend
    // The frontend will call OpenSky's data API directly
    const payload = {
      token: token,
      bounds: bounds,
      region: regionKey,
      tokenExpiresIn: Math.max(0, Math.floor((tokenExpiresAt - Date.now()) / 1000))
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Edge Function error:", error?.message || error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
})
