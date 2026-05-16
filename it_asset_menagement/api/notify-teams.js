const TEAMS_WEBHOOK_URL =
  'https://defaultc172e49cae364c49b87c48a1df2152.f5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cb2a94ff6c124f83bdf128c177a463e1/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=6tyj3Sp8-d7trIMuxPo6uMwg9th3a1I6mauD3x9xxBo';

export default async function handler(req, res) {
  // Allow CORS from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    return res.status(200).json({ ok: true, status: response.status, body: text });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
