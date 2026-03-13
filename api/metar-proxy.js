export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { ids, format } = req.query;

  if (!ids) {
    return res.status(400).json({ error: 'Missing ids parameter' });
  }

  try {
    const upstreamUrl = `https://aviationweather.gov/api/data/metar?ids=${ids}&format=${format || 'json'}`;
    const upstreamRes = await fetch(upstreamUrl);
    
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ error: 'Upstream fetched failed' });
    }

    const data = await upstreamRes.json();
    
    // Set caching
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(data);
  } catch (err) {
    console.error("METAR proxy error:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
