// api/opensky-proxy.js
// Proxies requests to OpenSky's /api/states/all endpoint.
// Strips browser Origin header to bypass CORS. No auth needed.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const queryString = url.search || '';
    const targetUrl = `https://opensky-network.org/api/states/all${queryString}`;

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 25000);

    const fetchHeaders = {
      'Accept': 'application/json',
      'User-Agent': 'TraconView/2.0'
    };

    if (req.headers.authorization) {
      fetchHeaders['Authorization'] = req.headers.authorization;
    }

    const apiRes = await fetch(targetUrl, {
      method: 'GET',
      headers: fetchHeaders,
      signal: abortController.signal
    });

    clearTimeout(timeout);

    res.status(apiRes.status);

    const rateLimit = apiRes.headers.get('x-rate-limit-remaining');
    if (rateLimit) {
      res.setHeader('X-Rate-Limit-Remaining', rateLimit);
    }

    const retryAfter = apiRes.headers.get('x-rate-limit-retry-after-seconds');
    if (retryAfter) {
      res.setHeader('X-Rate-Limit-Retry-After-Seconds', retryAfter);
    }

    const data = await apiRes.json();
    return res.json(data);

  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'OpenSky API timeout' });
    }
    const cause = err.cause ? (err.cause.code || err.cause.message || String(err.cause)) : 'unknown';
    console.error('API Proxy Error:', err.message, 'cause:', cause);
    return res.status(502).json({ error: 'Proxy error', message: err.message, cause });
  }
}
