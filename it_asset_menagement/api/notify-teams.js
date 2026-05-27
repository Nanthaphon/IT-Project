// Vercel serverless function — ส่งการแจ้งเตือนเข้า Microsoft Teams (Power Automate Flow)
// (ต้องมี auth + origin check เพื่อกัน spammer ใช้ endpoint เรา)
import admin from 'firebase-admin';

/* ── เริ่มต้น Firebase Admin (ครั้งเดียวต่อ cold start) ── */
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

/* ── Origins ที่อนุญาต ── */
function isAllowedOrigin(origin) {
  if (!origin) return false;
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const defaults = ['http://localhost:5173', 'http://localhost:4173'];
  return allowed.includes(origin) || defaults.includes(origin);
}

/* ── URL webhook ดึงจาก env (ไม่อยู่ใน source code อีกต่อไป) ── */
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || '';

export default async function handler(req, res) {
  /* ── CORS ── */
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!TEAMS_WEBHOOK_URL) {
    return res.status(500).json({ error: 'TEAMS_WEBHOOK_URL env var ไม่ได้ตั้งค่า' });
  }

  /* ── ตรวจ Firebase Admin พร้อมหรือยัง ── */
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  /* ── ตรวจ ID token (admin เท่านั้น) ── */
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const adminSnap = await admin.firestore().collection('admin_users').doc(decoded.uid).get();
  if (!adminSnap.exists) {
    return res.status(403).json({ error: 'Caller is not an admin' });
  }

  /* ── ส่งต่อ payload ไปยัง Teams webhook ── */
  try {
    const response = await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Teams webhook error:', response.status, text);
      return res.status(502).json({ error: 'Teams webhook failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('notify-teams error:', err);
    return res.status(500).json({ error: err.message || 'request failed' });
  }
}
