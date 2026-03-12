// api/opensky-proxy.js
export default async function handler(req, res) {
  // CORS headers for browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const { url, headers } = req;
    
    // We expect requests like: /api/opensky-proxy/states/all?lamin=xxx...
    // Strip "/api/opensky-proxy" to get the path
    const targetPath = url.replace('/api/opensky-proxy', '');
    const targetUrl = `https://opensky-network.org/api${targetPath}`;

    // Forward the Authorization header if provided
    const fetchHeaders = {};
    if (headers.authorization) {
      fetchHeaders['Authorization'] = headers.authorization;
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 25000);

    const apiRes = await fetch(targetUrl, {
      method: req.method,
      headers: fetchHeaders,
      signal: abortController.signal
    });

    clearTimeout(timeout);

    // Forward the status and data back
    res.status(apiRes.status);
    
    // Pass rate limit warning if present
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
    return res.status(500).json({ 
      error: "Internal Proxy Error",
      details: err.message,
      stack: err.stack
    });
  }
}
