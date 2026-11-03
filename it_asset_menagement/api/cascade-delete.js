// Vercel serverless function — Admin cascade-delete employee/asset/license/accessory
// (ลบ documents ที่ผูกกับ entity ที่กำลังลบ — ป้องกัน orphan data)
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

/* คืนสิทธิ์ License กลับเป็นสิทธิ์ว่าง — สำเนาของ returnSeats ใน src/utils/licenseSeats.js
   (Vercel Function import โค้ดฝั่งเว็บไม่ได้) แก้รายการฟิลด์ต้องแก้คู่กันทั้งสองไฟล์ */
const SEAT_FIELDS = [
  ['availableKeys', 'productKey'], ['availableKeyCodes', 'keyCode'], ['availableSeatCosts', 'seatCost'],
  ['availableSeatLabels', 'seatLabel'], ['availableSeatSuppliers', 'seatSupplier'],
  ['availableSeatPurchaseDates', 'seatPurchaseDate'], ['availableSeatExpirationDates', 'seatExpirationDate'],
  ['availableSeatNotes', 'seatNote'], ['availableSeatIds', 'seatId'],
];
function returnSeats(lic, returned) {
  const n = Math.max(0, Number(lic.quantity ?? 1) - (lic.assignees || []).length);
  const fit = (arr) => { const a = (arr || []).slice(0, n); while (a.length < n) a.push(''); return a; };
  const patch = {};
  for (const [arrKey, field] of SEAT_FIELDS) {
    const a = fit(lic[arrKey]);
    returned.forEach((r) => a.push(r?.[field] || ''));
    patch[arrKey] = a;
  }
  const map = {};
  Object.entries(lic.availableSeatDocs || {}).forEach(([k, v]) => { if (Number(k) < n) map[k] = v; });
  returned.forEach((r, k) => { if (r?.seatDocuments?.length) map[String(n + k)] = r.seatDocuments; });
  patch.availableSeatDocs = map;
  return patch;
}

/** ลบทุก doc ใน collection ที่ matching where(field, '==', value) ทีละ batch (450 ต่อรอบ) */
async function deleteWhere(collectionName, field, value) {
  const db = admin.firestore();
  const snap = await db.collection(collectionName).where(field, '==', value).get();
  if (snap.empty) return 0;

  let count = 0;
  let batch = db.batch();
  for (const docSnap of snap.docs) {
    batch.delete(docSnap.ref);
    count++;
    if (count % 450 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  return count;
}

async function cascadeEmployee(empDocId, empId) {
  const results = await Promise.all([
    deleteWhere('repair_requests', 'empId', empId),
    deleteWhere('supply_requests', 'empId', empId),
    deleteWhere('replacement_requests', 'empId', empId),
    deleteWhere('assets_transactions', 'empId', empId),
    deleteWhere('accessories_transactions', 'empId', empId),
    deleteWhere('licenses_transactions', 'empId', empId),
    admin.firestore().collection('staff_passwords').doc(empDocId).delete().then(() => 1).catch(() => 0),
  ]);
  return { repair_requests: results[0], supply_requests: results[1], replacement_requests: results[2],
    assets_transactions: results[3], accessories_transactions: results[4], licenses_transactions: results[5],
    staff_password: results[6] };
}

async function cascadeAsset(assetId) {
  const db = admin.firestore();
  const txCount = await deleteWhere('assets_transactions', 'assetId', assetId);
  const docCount = await deleteWhere('asset_purchase_docs', 'assetId', assetId);

  // Revoke device-bound license seats
  let revokedSeats = 0;
  const licSnap = await db.collection('licenses').get();
  for (const licDoc of licSnap.docs) {
    const lic = licDoc.data();
    const assignees = lic.assignees || [];
    const removed = assignees.filter(a => a.isAssetBound && a.assignedAssetId === assetId);
    if (removed.length === 0) continue;
    const kept = assignees.filter(a => !(a.isAssetBound && a.assignedAssetId === assetId));
    const totalQty = Number(lic.quantity ?? 1);
    await licDoc.ref.update({
      assignees: kept,
      status: kept.length >= totalQty ? 'ถูกใช้งาน' : 'พร้อมใช้งาน',
      assignedTo:   kept.filter(a => a.empId).map(a => a.empId).join(',') || null,
      assignedName: kept.filter(a => a.empName || a.assignedAssetName)
                      .map(a => a.empName || a.assignedAssetName).join(', ') || null,
      ...returnSeats(lic, removed),
    });
    revokedSeats += removed.length;
  }
  return { transactions: txCount, purchaseDocs: docCount, revokedLicenseSeats: revokedSeats };
}

async function cascadeLicense(licenseId) {
  // จ่ายสิทธิ์ / ผูกเครื่อง เก็บไว้ที่ licenseId (assetId ของรายการผูกเครื่อง = id เครื่อง)
  // เดิมลบแค่ assetId → ประวัติค้าง แล้วไปโผล่ในไทม์ไลน์ของ License ใหม่ที่ตั้งชื่อซ้ำ
  const [byAsset, byLicense] = await Promise.all([
    deleteWhere('licenses_transactions', 'assetId', licenseId),
    deleteWhere('licenses_transactions', 'licenseId', licenseId),
  ]);
  return { transactions: byAsset + byLicense };
}

async function cascadeAccessory(accessoryId) {
  return { transactions: await deleteWhere('accessories_transactions', 'assetId', accessoryId) };
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

  /* ── ตรวจ caller — admin only ── */
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });
  let decoded;
  try { decoded = await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
  const adminSnap = await admin.firestore().collection('admin_users').doc(decoded.uid).get();
  if (!adminSnap.exists) return res.status(403).json({ error: 'Caller is not an admin' });

  try {
    const { kind, id, empId } = req.body || {};
    if (!kind || !id) return res.status(400).json({ error: 'invalid kind/id' });

    let result;
    if      (kind === 'employee')   result = await cascadeEmployee(id, empId);
    else if (kind === 'asset')      result = await cascadeAsset(id);
    else if (kind === 'license')    result = await cascadeLicense(id);
    else if (kind === 'accessory')  result = await cascadeAccessory(id);
    else return res.status(400).json({ error: 'unknown kind' });

    return res.status(200).json({ success: true, deleted: result });
  } catch (err) {
    console.error('cascade-delete error:', err);
    return res.status(500).json({ error: err.message || 'cascade failed' });
  }
}
