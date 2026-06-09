// Vercel serverless function — ส่ง LINE notification ไปยังผู้รับผิดชอบ
// เรียกได้จาก user ที่ login (role: 'staff' หรือ 'admin')
// ใช้ LINE Messaging API (Push) ส่งหา userId ที่ตั้งไว้ใน settings/notifications
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

const VALID_KINDS = new Set(['repair', 'supply', 'replacement', 'license']);

async function getRecipients() {
  try {
    const snap = await admin.firestore().doc('settings/notifications').get();
    const data = snap.exists ? snap.data() : {};
    return {
      it: (data.itLineUserId || '').trim(),
      hr: (data.hrLineUserId || '').trim(),
    };
  } catch {
    return { it: '', hr: '' };
  }
}

// สร้าง Flex Message ที่สวยงาม — ใช้ field มาตรฐานเท่านั้น
function buildFlexMessage({ title, emoji, color, facts, timestamp }) {
  // แต่ละ fact = 1 row (label + value)
  const factBoxes = facts.map(f => ({
    type: 'box',
    layout: 'horizontal',
    margin: 'md',
    contents: [
      {
        type: 'text',
        text: String(f.label || ''),
        size: 'sm',
        color: '#6B7280',
        flex: 4,
        wrap: true,
      },
      {
        type: 'text',
        text: String(f.value || '-'),
        size: 'sm',
        color: '#1F2937',
        weight: 'bold',
        flex: 6,
        wrap: true,
      },
    ],
  }));

  return {
    type: 'flex',
    altText: `${emoji} ${title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: color,
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: `${emoji}  ${title}`,
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            wrap: true,
          },
          {
            type: 'text',
            text: 'IT Asset Management',
            color: '#DBEAFE',
            size: 'xs',
            margin: 'sm',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: factBoxes,
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        contents: [
          {
            type: 'separator',
            color: '#E5E7EB',
          },
          {
            type: 'text',
            text: `🕐 ${timestamp}`,
            size: 'xs',
            color: '#9CA3AF',
            margin: 'md',
            align: 'center',
          },
        ],
      },
      styles: {
        body: { backgroundColor: '#FFFFFF' },
        footer: { backgroundColor: '#FAFAFA' },
      },
    },
  };
}

// Push message ผ่าน LINE Messaging API (รองรับทั้ง flex และ text)
async function pushLineMessage(userId, message) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN not configured on Vercel');
  if (!userId) throw new Error('LINE userId ปลายทางว่าง — กรุณาตั้งค่าในเมนู "ตั้งค่าระบบ"');
  const messages = typeof message === 'string' ? [{ type: 'text', text: message }] : [message];
  const r = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`LINE Push ${r.status}: ${t}`);
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!admin.apps.length) return res.status(500).json({ error: 'Firebase Admin not initialized' });

  /* ── ตรวจ caller ต้อง login (staff หรือ admin) ── */
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });
  try { await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }

  try {
    const { kind, facts } = req.body || {};
    if (!VALID_KINDS.has(kind)) return res.status(400).json({ error: 'invalid kind' });
    if (!Array.isArray(facts)) return res.status(400).json({ error: 'invalid facts' });

    const recipients = await getRecipients();

    let title, recipient, emoji, color;
    if (kind === 'repair')      { title = 'แจ้งซ่อม / ปัญหา IT';     recipient = recipients.it; emoji = '🔧'; color = '#1E487A'; }
    if (kind === 'supply')      { title = 'คำขอเบิกอุปกรณ์สำนักงาน'; recipient = recipients.hr; emoji = '📦'; color = '#047857'; }
    if (kind === 'replacement') { title = 'คำขอเปลี่ยนเครื่อง';        recipient = recipients.it; emoji = '💻'; color = '#B45309'; }
    if (kind === 'license')     { title = 'License ใกล้หมดอายุ';        recipient = recipients.it; emoji = '⚠️'; color = '#B91C1C'; }

    const timestamp = new Date().toLocaleString('th-TH', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok',
    });

    // Flex Message สวยๆ
    const flexMsg = buildFlexMessage({ kind, title, emoji, color, facts, timestamp });

    try {
      await pushLineMessage(recipient, flexMsg);
    } catch (err) {
      return res.status(502).json({ error: `LINE push failed: ${err.message}` });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('staff-notify error:', err);
    return res.status(500).json({ error: err.message || 'notify failed' });
  }
}
