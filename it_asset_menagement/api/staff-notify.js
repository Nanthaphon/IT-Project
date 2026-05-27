// Vercel serverless function — Staff submission notification
// (Staff submits a request → frontend calls this to fire Teams card + email)
// เรียกได้จาก user ที่ login (role: 'staff' หรือ 'admin' ก็ได้)
// ส่งได้เฉพาะ recipients ที่อยู่ใน whitelist (IT/HR email + Teams webhook)
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

const VALID_KINDS = new Set(['repair', 'supply', 'replacement']);
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || '';

async function getNotifyEmails() {
  try {
    const snap = await admin.firestore().doc('settings/notifications').get();
    const data = snap.exists ? snap.data() : {};
    return {
      it: (data.itEmail || '').trim() || 'Nanthaphon.nay@globesyndicate.co.th',
      hr: (data.hrEmail || '').trim() || 'Tanat.nai@globesyndicate.co.th',
    };
  } catch {
    return {
      it: 'Nanthaphon.nay@globesyndicate.co.th',
      hr: 'Tanat.nai@globesyndicate.co.th',
    };
  }
}

async function sendEmailJS(toEmail, subject, message) {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (!serviceId || !templateId || !publicKey) return; // ไม่ตั้งค่า ก็ข้าม

  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    ...(privateKey ? { accessToken: privateKey } : {}),
    template_params: {
      to_email: toEmail,
      subject,
      message,
      timestamp: new Date().toLocaleString('th-TH', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok',
      }),
    },
  };
  const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) console.error('EmailJS failed:', r.status, await r.text());
}

async function sendTeamsCard(title, color, facts) {
  if (!TEAMS_WEBHOOK_URL) return;
  const card = {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          { type: 'Container', style: 'emphasis', items: [{ type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium', color, wrap: true }] },
          { type: 'FactSet', facts: facts.map(f => ({ title: f.label, value: f.value })) },
          { type: 'TextBlock', text: `🕐 ${new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' })}`, size: 'Small', isSubtle: true, spacing: 'Small' },
        ],
      },
    }],
  };
  const r = await fetch(TEAMS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
  if (!r.ok) console.error('Teams webhook failed:', r.status, await r.text());
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
  let decoded;
  try { decoded = await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }

  try {
    const { kind, facts } = req.body || {};
    if (!VALID_KINDS.has(kind)) return res.status(400).json({ error: 'invalid kind' });
    if (!Array.isArray(facts)) return res.status(400).json({ error: 'invalid facts' });

    const emails = await getNotifyEmails();
    const message = facts.map(f => `• ${f.label}: ${f.value}`).join('\n');

    let title, recipient, color;
    if (kind === 'repair')      { title = '🔧 แจ้งปัญหา IT / แจ้งซ่อม'; recipient = emails.it; color = 'Accent';  }
    if (kind === 'supply')      { title = '📦 คำขอเบิกอุปกรณ์สำนักงาน'; recipient = emails.hr; color = 'Good';    }
    if (kind === 'replacement') { title = '💻 คำขอเปลี่ยนเครื่อง';        recipient = emails.it; color = 'Warning'; }

    await Promise.allSettled([
      sendTeamsCard(title, color, facts),
      sendEmailJS(recipient, title, message),
    ]);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('staff-notify error:', err);
    return res.status(500).json({ error: err.message || 'notify failed' });
  }
}
