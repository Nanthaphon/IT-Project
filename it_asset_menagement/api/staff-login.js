// Vercel serverless function — Staff login
// (ตรวจ empId + password → return Firebase custom token)
import admin from 'firebase-admin';
import crypto from 'node:crypto';

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

/* ── Password hashing — PBKDF2-SHA256 100k iterations ── */
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha256';
function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(String(password), salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
}
function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/* ── Origins ที่อนุญาต ── */
function isAllowedOrigin(origin) {
  if (!origin) return false;
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const defaults = ['http://localhost:5173', 'http://localhost:4173'];
  return allowed.includes(origin) || defaults.includes(origin);
}

export default async function handler(req, res) {
  /* ── CORS ── */
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!admin.apps.length) return res.status(500).json({ error: 'Firebase Admin not initialized' });

  try {
    const { empId, password } = req.body || {};
    if (!empId || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงานและรหัสผ่าน' });
    }

    const dbRef = admin.firestore();
    const inputEmpId = String(empId).trim();

    // หา employee (case-insensitive)
    const allSnap = await dbRef.collection('employees').get();
    const empDoc = allSnap.docs.find(d => (d.data().empId || '').toLowerCase() === inputEmpId.toLowerCase());
    if (!empDoc) return res.status(404).json({ error: 'ไม่พบรหัสพนักงานนี้ในระบบ' });

    // ตรวจ password
    const pwdSnap = await dbRef.collection('staff_passwords').doc(empDoc.id).get();
    if (!pwdSnap.exists) {
      return res.status(412).json({ error: 'ยังไม่ได้ตั้งรหัสผ่าน กรุณาติดต่อ IT เพื่อขอรหัสผ่าน' });
    }
    const { hash, salt } = pwdSnap.data();
    const inputHash = hashPassword(password, salt);
    if (!timingSafeEqual(inputHash, hash)) {
      return res.status(403).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ออก custom token (uid = staff_<empDocId>, claim role='staff')
    const uid = `staff_${empDoc.id}`;
    const claims = {
      role: 'staff',
      empId: empDoc.data().empId,
      empDocId: empDoc.id,
    };
    const token = await admin.auth().createCustomToken(uid, claims);
    return res.status(200).json({ token, empDocId: empDoc.id });
  } catch (err) {
    console.error('staff-login error:', err);
    return res.status(500).json({ error: err.message || 'login failed' });
  }
}
