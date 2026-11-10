/* รหัสผ่าน M365 ของพนักงาน — เก็บแยกที่ employee_secrets/{empDocId}
   เดิมอยู่ใน employees/{id}.m365Password ซึ่งพนักงานทุกคนที่ login อ่านได้
   rules: อ่าน/เขียนได้เฉพาะ admin กับเจ้าของ (staff ที่ empDocId ตรงกัน)

   ช่วงเปลี่ยนผ่าน (ก่อนรัน scripts/migrate-m365-secrets.mjs) ยังมีค่าเก่าค้างใน
   employees — loadM365Password จึง fallback ไปอ่านค่านั้นถ้ายังไม่มีเอกสารใหม่ */
import { doc, getDoc, setDoc, serverTimestamp } from '../db/compat.js';
import { db } from '../firebase.js';

export const SECRETS_COLLECTION = 'employee_secrets';

export async function loadM365Password(emp) {
  if (!emp?.id) return '';
  try {
    const snap = await getDoc(doc(db, SECRETS_COLLECTION, emp.id));
    if (snap.exists()) return snap.data().m365Password || '';
  } catch (err) {
    console.warn('loadM365Password:', err?.code || err);
  }
  return emp.m365Password || '';
}

export async function saveM365Password(empDocId, value) {
  await setDoc(
    doc(db, SECRETS_COLLECTION, empDocId),
    { m365Password: value || '', updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** แยกรหัสออกจากก้อนข้อมูลพนักงาน → [ข้อมูลที่ลง employees ได้, รหัส | undefined] */
export function splitM365Password(data) {
  const { m365Password, ...rest } = data || {};
  return [rest, m365Password];
}
