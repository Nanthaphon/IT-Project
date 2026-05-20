// Power Automate Flow: "IT Asset Email Notifications" (ส่ง email ไป IT/HR ตาม notifyType)
const TEAMS_WEBHOOK_URL =
  'https://defaultc172e49cae364c49b87c48a1df2152.f5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7ec69e61f94241089f5eb0bc5a9b3324/triggers/manual/paths/invoke?api-version=1';

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
