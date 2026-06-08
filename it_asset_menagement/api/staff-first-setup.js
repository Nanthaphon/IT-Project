// Vercel serverless function — Staff First-time Password Setup
// (พนักงานตั้งรหัสผ่านเองครั้งแรก โดยยืนยันด้วย M365 Email)
import admin from 'firebase-admin';
import crypto from 'node:crypto';

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

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(String(password), salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256')
    .toString('hex');
}

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!admin.apps.length) return res.status(500).json({ error: 'Firebase Admin not initialized' });

  try {
    const { empId, m365Email, newPassword } = req.body || {};
    if (!empId) return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงาน' });
    if (!m365Email) return res.status(400).json({ error: 'กรุณากรอก M365 Email เพื่อยืนยันตัวตน' });
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const dbRef = admin.firestore();
    const inputEmpId = String(empId).trim();
    const inputEmail = String(m365Email).trim().toLowerCase();

    // หา employee จาก empId (case-insensitive)
    const allSnap = await dbRef.collection('employees').get();
    const empDoc = allSnap.docs.find(d => (d.data().empId || '').toLowerCase() === inputEmpId.toLowerCase());
    if (!empDoc) return res.status(404).json({ error: 'ไม่พบรหัสพนักงานนี้ในระบบ' });

    // ตรวจ M365 email ตรงกัน
    const empData = empDoc.data();
    const storedEmail = String(empData.m365Email || '').trim().toLowerCase();
    if (!storedEmail) {
      return res.status(412).json({
        error: 'พนักงานคนนี้ยังไม่มี M365 Email ในระบบ — กรุณาติดต่อ IT เพื่อตั้งรหัสผ่าน',
      });
    }
    if (storedEmail !== inputEmail) {
      return res.status(403).json({ error: 'M365 Email ไม่ตรงกับข้อมูลในระบบ' });
    }

    // ตรวจว่ายังไม่เคยตั้งรหัสผ่าน (กันไม่ให้ override ของเดิม)
    const pwdSnap = await dbRef.collection('staff_passwords').doc(empDoc.id).get();
    if (pwdSnap.exists) {
      return res.status(409).json({
        error: 'รหัสผ่านถูกตั้งไว้แล้ว — ถ้าลืมรหัสผ่าน กรุณาติดต่อ IT เพื่อรีเซ็ต',
      });
    }

    // hash + save
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(newPassword, salt);

    await dbRef.collection('staff_passwords').doc(empDoc.id).set({
      hash,
      salt,
      iterations: PBKDF2_ITERATIONS,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'self-setup',
      isFirstSetup: true,
    });

    return res.status(200).json({ success: true, empName: empData.fullName || '' });
  } catch (err) {
    console.error('staff-first-setup error:', err);
    return res.status(500).json({ error: err.message || 'setup failed' });
  }
}
