// Vercel serverless function — ลบ Firebase Auth account (SuperAdmin only)
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  } catch (err) { console.error('Firebase Admin init failed:', err); }
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

  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });

  let decoded;
  try { decoded = await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }

  // ต้องเป็น SuperAdmin เท่านั้น
  const callerSnap = await admin.firestore().collection('admin_users').doc(decoded.uid).get();
  if (!callerSnap.exists || callerSnap.data().isSuperAdmin !== true) {
    return res.status(403).json({ error: 'ต้องเป็น SuperAdmin เท่านั้น' });
  }

  const { targetUid } = req.body || {};
  if (!targetUid) return res.status(400).json({ error: 'targetUid required' });

  // ป้องกันลบตัวเอง
  if (targetUid === decoded.uid) return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' });

  try {
    await admin.auth().deleteUser(targetUid);
    return res.status(200).json({ success: true });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      // Auth account ไม่มีแล้ว ถือว่า ok
      return res.status(200).json({ success: true, note: 'auth account already deleted' });
    }
    return res.status(500).json({ error: err.message });
  }
}
