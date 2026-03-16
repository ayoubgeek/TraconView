// api/opensky-proxy.js
// Edge Function proxy to OpenSky Network API.
// Runs on Vercel Edge Network to avoid datacenter IP blocks.
export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const incoming = new URL(request.url);
    // Extract the OpenSky API path from the "path" query param, default to states/all
    const apiPath = incoming.searchParams.get('_path') || 'states/all';
    incoming.searchParams.delete('_path');
    const targetUrl = `https://opensky-network.org/api/${apiPath}${incoming.search}`;

    const fetchHeaders = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 TraconView/2.0'
    };

    const auth = request.headers.get('authorization');
    if (auth) {
      fetchHeaders['Authorization'] = auth;
    }

    const apiRes = await fetch(targetUrl, {
      method: 'GET',
      headers: fetchHeaders
    });

    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    };

    const rateLimit = apiRes.headers.get('x-rate-limit-remaining');
    if (rateLimit) responseHeaders['X-Rate-Limit-Remaining'] = rateLimit;

    const retryAfter = apiRes.headers.get('x-rate-limit-retry-after-seconds');
    if (retryAfter) responseHeaders['X-Rate-Limit-Retry-After-Seconds'] = retryAfter;

    const data = await apiRes.text();
    return new Response(data, {
      status: apiRes.status,
      headers: responseHeaders
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
