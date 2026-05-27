// Vercel serverless function — Admin set/reset staff password
// (เรียกได้เฉพาะ admin ที่ login ผ่าน Firebase Auth)
import admin from 'firebase-admin';
import crypto from 'node:crypto';

/* ── Firebase Admin init ── */
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

/* ── Hashing ── */
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(String(password), salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256')
    .toString('hex');
}

/* ── CORS origins ── */
function isAllowedOrigin(origin) {
  if (!origin) return false;
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const defaults = ['http://localhost:5173', 'http://localhost:4173'];
  return allowed.includes(origin) || defaults.includes(origin);
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

  /* ── verify caller is admin ── */
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });

  let decoded;
  try { decoded = await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }

  const dbRef = admin.firestore();
  const adminSnap = await dbRef.collection('admin_users').doc(decoded.uid).get();
  if (!adminSnap.exists) return res.status(403).json({ error: 'Caller is not an admin' });

  try {
    const { empDocId, newPassword } = req.body || {};
    if (!empDocId || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง (รหัสผ่านอย่างน้อย 6 ตัว)' });
    }

    const empSnap = await dbRef.collection('employees').doc(empDocId).get();
    if (!empSnap.exists) return res.status(404).json({ error: 'ไม่พบพนักงานคนนี้' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(newPassword, salt);

    await dbRef.collection('staff_passwords').doc(empDocId).set({
      hash, salt,
      iterations: PBKDF2_ITERATIONS,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: decoded.uid,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('set-staff-password error:', err);
    return res.status(500).json({ error: err.message || 'failed' });
  }
}
