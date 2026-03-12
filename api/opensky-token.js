// api/opensky-token.js
// Vercel Serverless Function — handles OpenSky OAuth2 token exchange
// The frontend calls this to get a Bearer token, then calls OpenSky data API directly.

let cachedToken = null;
let tokenExpiresAt = 0;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const now = Date.now();

    // Return cached token if still valid
    if (cachedToken && now < tokenExpiresAt) {
      return res.status(200).json({
        token: cachedToken,
        tokenExpiresIn: Math.max(0, Math.floor((tokenExpiresAt - now) / 1000)),
        cached: true
      });
    }

    const clientId = process.env.OPENSKY_CLIENT_ID;
    const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'OpenSky credentials not configured' });
    }

    const response = await fetch(
      'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token request failed: ${response.status} ${errorText}`);
      return res.status(502).json({ error: `Token request failed: ${response.status}` });
    }

    const data = await response.json();
    cachedToken = data.access_token;
    // Cache with 60s safety margin
    tokenExpiresAt = now + ((data.expires_in - 60) * 1000);

    return res.status(200).json({
      token: cachedToken,
      tokenExpiresIn: data.expires_in - 60,
      cached: false
    });
  } catch (error) {
    console.error('Token proxy error:', error);
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
}
