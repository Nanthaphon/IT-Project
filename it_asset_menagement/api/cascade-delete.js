// Vercel serverless function — Admin cascade-delete employee/asset/license/accessory
// (ลบ documents ที่ผูกกับ entity ที่กำลังลบ — ป้องกัน orphan data)
import { preflight, bearer, verifyCaller, adminRowOf, deleteWhere, removeData, listAll, patchData } from './_lib/supabaseAdmin.js';

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

async function cascadeEmployee(empDocId, empId) {
  const results = await Promise.all([
    deleteWhere('repair_requests', 'empId', empId),
    deleteWhere('supply_requests', 'empId', empId),
    deleteWhere('replacement_requests', 'empId', empId),
    deleteWhere('assets_transactions', 'empId', empId),
    deleteWhere('accessories_transactions', 'empId', empId),
    deleteWhere('licenses_transactions', 'empId', empId),
    removeData('staff_passwords', empDocId).catch(() => 0),
  ]);
  return { repair_requests: results[0], supply_requests: results[1], replacement_requests: results[2],
    assets_transactions: results[3], accessories_transactions: results[4], licenses_transactions: results[5],
    staff_password: results[6] };
}

async function cascadeAsset(assetId) {
  const txCount = await deleteWhere('assets_transactions', 'assetId', assetId);
  const docCount = await deleteWhere('asset_purchase_docs', 'assetId', assetId);

  // Revoke device-bound license seats
  let revokedSeats = 0;
  for (const licDoc of await listAll('licenses')) {
    const lic = licDoc.data || {};
    const assignees = lic.assignees || [];
    const removed = assignees.filter(a => a.isAssetBound && a.assignedAssetId === assetId);
    if (removed.length === 0) continue;
    const kept = assignees.filter(a => !(a.isAssetBound && a.assignedAssetId === assetId));
    const totalQty = Number(lic.quantity ?? 1);
    await patchData('licenses', licDoc.id, {
      assignees: kept,
      status: kept.length >= totalQty ? 'ถูกใช้งาน' : 'พร้อมใช้งาน',
      assignedTo:   kept.filter(a => a.empId).map(a => a.empId).join(',') || null,
      assignedName: kept.filter(a => a.empName || a.assignedAssetName)
                      .map(a => a.empName || a.assignedAssetName).join(', ') || null,
      ...returnSeats(lic, removed),
    }, 'update');
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
  if (preflight(req, res)) return;

  /* ── ตรวจ caller — admin only (token ของ Supabase Auth + แถวใน admin_users) ── */
  const idToken = bearer(req);
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });
  const caller = await verifyCaller(idToken).catch(() => null);
  if (!caller) return res.status(401).json({ error: 'Invalid or expired token' });
  if (!(await adminRowOf(caller).catch(() => null))) return res.status(403).json({ error: 'Caller is not an admin' });

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
