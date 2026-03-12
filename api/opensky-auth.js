// api/opensky-auth.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // Read from env (no need to send them from frontend anymore)
    const clientId = process.env.VITE_OPENSKY_CLIENT_ID;
    const clientSecret = process.env.VITE_OPENSKY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Server missing OpenSky credentials" });
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const authRes = await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!authRes.ok) {
       return res.status(authRes.status).json({ error: `OpenSky Auth failed: ${authRes.status}` });
    }

    const data = await authRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error("Auth Proxy Error:", err);
    return res.status(500).json({ 
      error: "Internal Auth Proxy Error",
      details: err.message,
      stack: err.stack
    });
  }
}
