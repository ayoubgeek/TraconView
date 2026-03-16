export default async function handler(req, res) {
  // Extract the target path
  // The route will be /api/opensky/...
  // We want to proxy to https://opensky-network.org/api/...
  let targetUrl = `https://opensky-network.org/api${req.url.replace(/^\/api\/opensky/, '')}`;
  
  if (!targetUrl.includes('?')) {
      const searchParams = new URLSearchParams(req.query).toString();
      if(searchParams) {
          targetUrl += '?' + searchParams;
      }
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TraconView-VercelProxy/1.0.0'
      }
    };

    // Forward auth if present
    if (req.headers.authorization) {
      fetchOptions.headers['Authorization'] = req.headers.authorization;
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Forward the status
    res.status(response.status);

    // Forward specific rate limit headers if OpenSky sends them
    ['x-rate-limit-remaining', 'x-rate-limit-retry-after-seconds'].forEach(header => {
      if (response.headers.has(header)) {
        res.setHeader(header, response.headers.get(header));
      }
    });
    
    // Add strict CORS headers to allow browser usage
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    )

    // Handle OPTIONS early
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    const data = await response.text();
    
    // Try sending as JSON if it looks like it
    try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
    } catch {
        // Otherwise send raw text
        res.send(data);
    }

  } catch (error) {
    console.error('Proxy Fetch Error:', error);
    res.status(502).json({ error: 'Failed to proxy request to OpenSky', message: error.message });
  }
}
