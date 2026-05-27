// Vercel serverless function — ส่ง email notification ผ่าน EmailJS REST API
// (ย้ายมาจากฝั่ง client เพื่อ:
//  1. ซ่อน EmailJS keys ออกจาก bundle
//  2. บังคับให้เรียกได้เฉพาะ admin ที่ login แล้ว
//  3. จำกัด origin)
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

/* ── Origins ที่อนุญาตให้เรียก endpoint ── */
function isAllowedOrigin(origin) {
  if (!origin) return false;
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  // dev default
  const defaults = ['http://localhost:5173', 'http://localhost:4173'];
  return allowed.includes(origin) || defaults.includes(origin);
}

export default async function handler(req, res) {
  /* ── CORS ── */
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  /* ── ตรวจ Firebase Admin พร้อมหรือยัง ── */
  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  /* ── ตรวจ ID token ของผู้เรียก (ต้องเป็น admin) ── */
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

  /* ── ตรวจ payload ── */
  const { toEmail, subject, message } = req.body || {};
  if (typeof toEmail !== 'string' || !toEmail.includes('@')) {
    return res.status(400).json({ error: 'invalid toEmail' });
  }
  if (typeof subject !== 'string' || subject.length === 0) {
    return res.status(400).json({ error: 'invalid subject' });
  }
  if (typeof message !== 'string') {
    return res.status(400).json({ error: 'invalid message' });
  }

  /* ── เรียก EmailJS REST API ── */
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY; // optional — แต่แนะนำให้เปิด "Restrict to server-side" บน EmailJS dashboard

  if (!serviceId || !templateId || !publicKey) {
    return res.status(500).json({ error: 'EmailJS env vars not configured' });
  }

  try {
    const emailjsResp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      }),
    });

    if (!emailjsResp.ok) {
      const text = await emailjsResp.text();
      console.error('EmailJS error:', emailjsResp.status, text);
      return res.status(502).json({ error: 'EmailJS request failed' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-email error:', err);
    return res.status(500).json({ error: err.message || 'send failed' });
  }
}
