// api/opensky-proxy.js
// Proxies requests to OpenSky's /api/states/all endpoint.
// Strips browser Origin header to bypass CORS. No auth needed.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // Forward query params (lamin, lamax, lomin, lomax) to OpenSky
    const url = new URL(req.url, `https://${req.headers.host}`);
    const queryString = url.search || '';
    const targetUrl = `https://opensky-network.org/api/states/all${queryString}`;

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 25000);

    const apiRes = await fetch(targetUrl, {
      method: 'GET',
      signal: abortController.signal
    });

    clearTimeout(timeout);

    res.status(apiRes.status);

    const rateLimit = apiRes.headers.get('x-rate-limit-remaining');
    if (rateLimit) {
      res.setHeader('X-Rate-Limit-Remaining', rateLimit);
    }

    const data = await apiRes.json();
    return res.json(data);

  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: "OpenSky API timeout" });
    }
    console.error("API Proxy Error:", err);
    return res.status(500).json({ error: "Internal Proxy Error", details: err.message });
  }
}
