// supabase/functions/opensky-proxy/index.ts
//
// Proxies OpenSky API requests. Tries authenticated first, falls back to
// unauthenticated if the auth server is unreachable from this runtime.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const OPENSKY_TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const OPENSKY_API_URL = "https://opensky-network.org/api/states/all";

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
  GLOBAL: { lamin: -90.0, lamax: 90.0, lomin: -180.0, lomax: 180.0 },
};

// In-memory cache
let cachedData: { data: unknown; timestamp: number; region: string } | null = null;
const CACHE_TTL_MS = 12000;

// Token cache
let accessToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string | null> {
  if (accessToken && Date.now() < tokenExpiresAt - 30000) {
    return accessToken;
  }

  const clientId = Deno.env.get("OPENSKY_CLIENT_ID");
  const clientSecret = Deno.env.get("OPENSKY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return null; // No credentials, will use unauthenticated access
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(OPENSKY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      console.warn(`Token request failed: ${resp.status}, falling back to unauthenticated`);
      return null;
    }

    const json = await resp.json();
    accessToken = json.access_token;
    tokenExpiresAt = Date.now() + (json.expires_in || 1800) * 1000;
    return accessToken;
  } catch (err: any) {
    console.warn("Auth server unreachable, using unauthenticated access:", err?.message);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const regionKey = url.searchParams.get("region") || "EUROPE";
    const region = REGIONS[regionKey];

    if (!region) {
      return new Response(
        JSON.stringify({ error: "Invalid region", valid: Object.keys(REGIONS) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache
    if (
      cachedData &&
      cachedData.region === regionKey &&
      Date.now() - cachedData.timestamp < CACHE_TTL_MS
    ) {
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    // Try to get OAuth2 token (non-blocking, falls back to null)
    const token = await getToken();

    // Build OpenSky API URL
    const params = new URLSearchParams({
      lamin: region.lamin.toString(),
      lamax: region.lamax.toString(),
      lomin: region.lomin.toString(),
      lomax: region.lomax.toString(),
    });

    const fetchHeaders: Record<string, string> = {};
    if (token) {
      fetchHeaders["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const openSkyResp = await fetch(`${OPENSKY_API_URL}?${params}`, {
      headers: fetchHeaders,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const rateLimitRemaining = openSkyResp.headers.get("X-Rate-Limit-Remaining");

    if (!openSkyResp.ok) {
      return new Response(
        JSON.stringify({ error: `OpenSky returned ${openSkyResp.status}`, rateLimitRemaining }),
        {
          status: openSkyResp.status === 429 ? 429 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await openSkyResp.json();

    const responseBody = {
      time: data.time,
      states: data.states || [],
      region: regionKey,
      rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : null,
    };

    cachedData = { data: responseBody, timestamp: Date.now(), region: regionKey };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });

  } catch (error: any) {
    const msg = error?.name === "AbortError"
      ? "OpenSky API request timed out"
      : (error?.message || "Unknown error");
    console.error("Edge Function error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
