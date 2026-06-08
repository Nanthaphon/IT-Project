// Vercel serverless function — Staff change own password
// (ใช้ Firebase ID token verify ตัวตน, ตรวจ current password, อัปเดต hash + clear mustChangePassword)
import admin from 'firebase-admin';
import crypto from 'node:crypto';

if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var ไม่ได้ถูกตั้งค่า');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  } catch (err) { console.error('Firebase Admin init failed:', err); }
}

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(String(password), salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256')
    .toString('hex');
}
function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
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

  // verify caller is signed-in staff
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });

  let decoded;
  try { decoded = await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }

  // ต้องเป็น role='staff' เท่านั้น
  if (decoded.role !== 'staff' || !decoded.empDocId) {
    return res.status(403).json({ error: 'ใช้สำหรับ staff เท่านั้น' });
  }

  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านเดิม' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม' });
    }

    const dbRef = admin.firestore();
    const pwdSnap = await dbRef.collection('staff_passwords').doc(decoded.empDocId).get();
    if (!pwdSnap.exists) return res.status(404).json({ error: 'ไม่พบข้อมูลรหัสผ่าน' });

    const { hash, salt } = pwdSnap.data();
    const inputHash = hashPassword(currentPassword, salt);
    if (!timingSafeEqual(inputHash, hash)) {
      return res.status(403).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }

    // generate new salt + hash, clear mustChangePassword
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassword, newSalt);

    await dbRef.collection('staff_passwords').doc(decoded.empDocId).set({
      hash: newHash,
      salt: newSalt,
      iterations: PBKDF2_ITERATIONS,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: decoded.uid,
      mustChangePassword: false,
    }, { merge: true });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('staff-change-password error:', err);
    return res.status(500).json({ error: err.message || 'failed' });
  }
}
