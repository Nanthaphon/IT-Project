// Vercel serverless function — รีเซ็ตรหัสผ่านบัญชีผู้ใช้ผ่าน Firebase Admin SDK
// ตรวจสิทธิ์ผู้เรียกจาก admin_users collection ก่อนเปลี่ยนรหัสผ่าน
import admin from 'firebase-admin';

/* ── เริ่มต้น Firebase Admin (ครั้งเดียวต่อ cold start) ── */
if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT env var ไม่ได้ถูกตั้งค่า');
    }
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
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

export default async function handler(req, res) {
  /* ── CORS (จำกัด origin ตาม env) ── */
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  /* ── ตรวจว่า Firebase Admin พร้อมหรือยัง ── */
  if (!admin.apps.length) {
    return res.status(500).json({
      error: 'ระบบยังไม่พร้อมใช้งาน (Firebase Admin not initialized — กรุณาตั้งค่า FIREBASE_SERVICE_ACCOUNT ใน Vercel)',
    });
  }

  try {
    const { idToken, targetUid, targetEmail, newPassword, lookupByEmail } = req.body || {};

    /* ── ตรวจ input ── */
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'ไม่พบ idToken' });
    }
    if (!targetUid && !targetEmail) {
      return res.status(400).json({ error: 'ไม่พบ targetUid หรือ targetEmail' });
    }
    if (!lookupByEmail && typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'ไม่พบ newPassword' });
    }
    if (newPassword && newPassword.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    /* ── ตรวจ ID token ของผู้เรียก ── */
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
    const callerUid = decoded.uid;

    /* ── ตรวจสิทธิ์ผู้เรียกจาก Firestore ── */
    const db = admin.firestore();
    const callerSnap = await db.collection('admin_users').doc(callerUid).get();
    if (!callerSnap.exists) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์ดำเนินการ' });
    }
    const caller = callerSnap.data();
    const callerIsSuperAdmin = caller.isSuperAdmin === true;
    const callerCanManage =
      callerIsSuperAdmin ||
      (caller.permissions && caller.permissions.canManagePasswords === true);
    if (!callerCanManage) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์รีเซ็ตรหัสผ่าน' });
    }

    /* ── lookupByEmail mode — คืน UID ของ email ที่มีอยู่ใน Auth (สำหรับ reuse orphan account) ── */
    if (lookupByEmail && targetEmail) {
      try {
        const userRecord = await admin.auth().getUserByEmail(targetEmail);
        // รีเซ็ตรหัสผ่านใหม่ให้ด้วยเลย
        if (newPassword) await admin.auth().updateUser(userRecord.uid, { password: newPassword });
        return res.status(200).json({ success: true, uid: userRecord.uid });
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          return res.status(404).json({ error: 'ไม่พบ email นี้ใน Firebase Auth' });
        }
        throw err;
      }
    }

    /* ── ห้าม admin ที่ไม่ใช่ SuperAdmin รีเซ็ตรหัส SuperAdmin ── */
    const resolvedUid = targetUid;
    const targetSnap = await db.collection('admin_users').doc(resolvedUid).get();
    if (
      targetSnap.exists &&
      targetSnap.data().isSuperAdmin === true &&
      !callerIsSuperAdmin
    ) {
      return res.status(403).json({
        error: 'ไม่สามารถรีเซ็ตรหัสผ่านของ SuperAdmin ได้',
      });
    }

    /* ── อัปเดตรหัสผ่าน ── */
    await admin.auth().updateUser(resolvedUid, { password: newPassword });
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('set-password error:', err);
    return res.status(500).json({ error: err.message || 'เกิดข้อผิดพลาด' });
  }
}
