/* ย้ายสิทธิ์ License ระหว่าง "สิทธิ์ว่าง" (available* — อาร์เรย์ขนานกัน ตำแหน่ง i = สิทธิ์ว่างตัวที่ i)
   กับ "ผู้ถือ" (assignees[] — ข้อมูลของสิทธิ์อยู่ในออบเจกต์ของผู้ถือ)

   เดิมแต่ละเส้นทาง (จ่าย / ผูกเครื่อง / ถอด / คืน / คืนทั้งหมด / ลบสิทธิ์) ย้ายเองแค่ Key, KeyCode, ราคา
   ชื่อ / ผู้ขาย / วันที่ / หมายเหตุของสิทธิ์จึงไม่ตามไป แล้วตำแหน่งเลื่อนไปตรงกับสิทธิ์ตัวอื่น
   ทุกเส้นทางต้องผ่านไฟล์นี้ — เพิ่มฟิลด์รายสิทธิ์ใหม่ = เพิ่มใน SEAT_FIELDS ที่เดียว

   seatId = รหัสประจำสิทธิ์ ติดตัวไปทุกการย้าย · ไทม์ไลน์รายสิทธิ์ใช้ตามสิทธิ์ที่ไม่มี Product Key
   สิทธิ์รุ่นก่อนไม่มี → สร้างให้ตอนจ่ายออกครั้งแรก

   ⚠️ api/cascade-delete.js มีสำเนารายการฟิลด์นี้ (ฝั่ง server import ไฟล์นี้ไม่ได้) — แก้ต้องแก้คู่กัน */

export const SEAT_FIELDS = [
  ['availableKeys', 'productKey'],
  ['availableKeyCodes', 'keyCode'],
  ['availableSeatCosts', 'seatCost'],
  ['availableSeatLabels', 'seatLabel'],
  ['availableSeatSuppliers', 'seatSupplier'],
  ['availableSeatPurchaseDates', 'seatPurchaseDate'],
  ['availableSeatExpirationDates', 'seatExpirationDate'],
  ['availableSeatNotes', 'seatNote'],
  ['availableSeatIds', 'seatId'],
];

export const newSeatId = () =>
  'seat_' + (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);

/** จำนวนสิทธิ์ว่าง ณ ตอนนี้ */
export const availableCount = (lic) =>
  Math.max(0, Number(lic?.quantity ?? 1) - (lic?.assignees || []).length);   // ไม่มี quantity = 1 · ลบสิทธิ์จนเหลือ 0 = 0

/* ตัด/เติมอาร์เรย์ให้ยาวเท่าจำนวนสิทธิ์ว่างพอดี — ข้อมูลรุ่นเก่ามีทั้งสั้นกว่า (ไม่เคยกรอก)
   และยาวกว่า (ค่าค้าง) ถ้าไม่ทำก่อน push/splice ค่าจะไปตกผิดตำแหน่ง */
const fit = (arr, n) => {
  const a = (arr || []).slice(0, n);
  while (a.length < n) a.push('');
  return a;
};

/** อาร์เรย์สิทธิ์ว่างทั้งชุด ปรับความยาวแล้ว — ใช้ก่อนเพิ่ม/แก้สิทธิ์ว่าง */
export function availableArrays(lic) {
  const n = availableCount(lic);
  return Object.fromEntries(SEAT_FIELDS.map(([arrKey]) => [arrKey, fit(lic?.[arrKey], n)]));
}

/** ดึงสิทธิ์ว่างตำแหน่ง idx ออก → { seat: ฟิลด์ที่ใส่ในผู้ถือ, patch: available* ใหม่ไว้ updateDoc } */
export function takeSeat(lic, idx) {
  const n = availableCount(lic);
  const seat = {};
  const patch = {};
  for (const [arrKey, field] of SEAT_FIELDS) {
    const a = fit(lic?.[arrKey], n);
    seat[field] = a[idx] || '';
    a.splice(idx, 1);
    patch[arrKey] = a;
  }
  if (!seat.seatId) seat.seatId = newSeatId();

  const docs = lic?.availableSeatDocs || {};
  seat.seatDocuments = docs[String(idx)] || [];
  const map = {};
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i === idx) continue;
    if (docs[String(i)]) map[String(j)] = docs[String(i)];
    j++;
  }
  patch.availableSeatDocs = map;
  return { seat, patch };
}

/** คืนสิทธิ์ของผู้ถือ (1 คนหรือหลายคน) กลับเป็นสิทธิ์ว่างต่อท้าย
    lic = ค่าก่อนคืน (assignees ยังมีคนที่คืนอยู่) · คืน patch ของ available* */
export function returnSeats(lic, returned) {
  const n = availableCount(lic);
  const patch = {};
  for (const [arrKey, field] of SEAT_FIELDS) {
    const a = fit(lic?.[arrKey], n);
    returned.forEach((r) => a.push(r?.[field] || ''));
    patch[arrKey] = a;
  }
  const map = {};
  Object.entries(lic?.availableSeatDocs || {}).forEach(([k, v]) => { if (Number(k) < n) map[k] = v; });
  returned.forEach((r, k) => { if (r?.seatDocuments?.length) map[String(n + k)] = r.seatDocuments; });
  patch.availableSeatDocs = map;
  return patch;
}

/** ลบสิทธิ์ว่างหลายตำแหน่ง → patch ของ available* */
export function removeAvailableSeats(lic, indices) {
  const n = availableCount(lic);
  const drop = new Set(indices);
  const patch = {};
  for (const [arrKey] of SEAT_FIELDS) patch[arrKey] = fit(lic?.[arrKey], n).filter((_, i) => !drop.has(i));
  const docs = lic?.availableSeatDocs || {};
  const map = {};
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (drop.has(i)) continue;
    if (docs[String(i)]) map[String(j)] = docs[String(i)];
    j++;
  }
  patch.availableSeatDocs = map;
  return patch;
}

/** ผู้ถือรุ่นก่อนยังไม่มี seatId → ให้รหัสตอนคืน (ใช้ค่าเดียวกันทั้งใน available* และ transaction) */
export const ensureSeatId = (a) => (a?.seatId ? a : { ...a, seatId: newSeatId() });
