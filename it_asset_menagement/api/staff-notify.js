// Vercel serverless function — ส่งแจ้งเตือนผ่าน Microsoft Teams
// ใช้ Adaptive Card ยิงผ่าน Power Automate Workflow webhook
// HR channel = คำขอเบิกอุปกรณ์
// IT channel = แจ้งซ่อม / License หมดอายุ / คำขอเปลี่ยนเครื่อง / อุปกรณ์เสริม
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var ไม่ได้ถูกตั้งค่า');
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (err) {
    console.error('Firebase Admin init failed:', err);
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const defaults = ['http://localhost:5173', 'http://localhost:4173'];
  return allowed.includes(origin) || defaults.includes(origin);
}

const VALID_KINDS = new Set(['repair', 'supply', 'replacement', 'license', 'accessory_request']);

// ─────────────────────────────────────────────────────────────
// Adaptive Card สำหรับ Teams — ส่งผ่าน Power Automate webhook
// ─────────────────────────────────────────────────────────────
function buildTeamsAdaptiveCard({ title, emoji, facts, timestamp }) {
  const factRows = facts.map(f => ({
    type: 'ColumnSet',
    spacing: 'Small',
    columns: [
      {
        type: 'Column',
        width: '35',
        items: [{
          type: 'TextBlock',
          text: String(f.label || ''),
          wrap: true,
          size: 'Small',
          isSubtle: true,
        }],
      },
      {
        type: 'Column',
        width: '65',
        items: [{
          type: 'TextBlock',
          text: String(f.value || '-'),
          wrap: true,
          size: 'Small',
          weight: 'Bolder',
        }],
      },
    ],
  }));

  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      contentUrl: null,
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        msteams: { width: 'Full' },
        body: [
          {
            type: 'Container',
            style: 'emphasis',
            bleed: true,
            items: [
              {
                type: 'TextBlock',
                text: `${emoji}  ${title}`,
                size: 'Large',
                weight: 'Bolder',
                color: 'Accent',
                wrap: true,
              },
              {
                type: 'TextBlock',
                text: 'IT Asset Management',
                size: 'Small',
                isSubtle: true,
                spacing: 'None',
              },
            ],
          },
          { type: 'Container', spacing: 'Medium', items: factRows },
          {
            type: 'TextBlock',
            text: `🕐 ${timestamp}`,
            size: 'Small',
            isSubtle: true,
            horizontalAlignment: 'Center',
            spacing: 'Medium',
          },
        ],
      },
    }],
  };
}

async function sendTeamsMessage(webhookUrl, cardPayload) {
  if (!webhookUrl) throw new Error('Teams webhook URL ไม่ถูกตั้งค่า');
  const r = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardPayload),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Teams webhook ${r.status}: ${t}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!admin.apps.length) return res.status(500).json({ error: 'Firebase Admin not initialized' });

  // ── ตรวจ caller ต้อง login (staff หรือ admin) ──
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });
  try { await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }

  try {
    const { kind, facts } = req.body || {};
    if (!VALID_KINDS.has(kind)) return res.status(400).json({ error: 'invalid kind' });
    if (!Array.isArray(facts)) return res.status(400).json({ error: 'invalid facts' });

    // routing → channel
    let title, emoji, teamsChannel;
    if (kind === 'repair')            { title = 'แจ้งซ่อม / ปัญหา IT';       emoji = '🔧'; teamsChannel = 'it'; }
    if (kind === 'supply')            { title = 'คำขอเบิกอุปกรณ์สำนักงาน';   emoji = '📦'; teamsChannel = 'hr'; }
    if (kind === 'replacement')       { title = 'คำขอเปลี่ยนเครื่อง';         emoji = '💻'; teamsChannel = 'it'; }
    if (kind === 'license')           { title = 'License ใกล้หมดอายุ';         emoji = '⚠️'; teamsChannel = 'it'; }
    if (kind === 'accessory_request') { title = 'คำขออุปกรณ์เสริม';           emoji = '🖱'; teamsChannel = 'it'; }

    const teamsUrl = teamsChannel === 'hr'
      ? process.env.TEAMS_HR_WEBHOOK_URL
      : process.env.TEAMS_IT_WEBHOOK_URL;

    if (!teamsUrl) {
      return res.status(400).json({
        error: `Teams webhook URL ยังไม่ได้ตั้งค่า (${teamsChannel === 'hr' ? 'TEAMS_HR_WEBHOOK_URL' : 'TEAMS_IT_WEBHOOK_URL'})`,
      });
    }

    const timestamp = new Date().toLocaleString('th-TH', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok',
    });

    const card = buildTeamsAdaptiveCard({ title, emoji, facts, timestamp });
    await sendTeamsMessage(teamsUrl, card);

    return res.status(200).json({ success: true, channel: teamsChannel });
  } catch (err) {
    console.error('staff-notify error:', err);
    return res.status(500).json({ error: err.message || 'notify failed' });
  }
}
