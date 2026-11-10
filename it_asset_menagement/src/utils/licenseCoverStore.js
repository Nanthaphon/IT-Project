/* ── ที่เก็บข้อมูลใบคลุมต่ออายุโปรแกรม ──────────────────────────────
   วันที่เริ่ม / วันหมดอายุ / ราคา ที่ผู้ใช้กรอกในหน้าต่างใบคลุม
   แยกจากข้อมูล License ในระบบโดยตั้งใจ (ผู้ใช้สั่ง: ไม่ต้องไปรวมกับเมนู License)
   เก็บที่ Firestore it_report/license_cover — rules ของ it_report = admin อ่าน/เขียนเท่านั้น
   (ใช้ collection เดิมเพื่อไม่ต้อง deploy rules ใหม่)

   รูปแบบ: { entries: { [itemKey]: { start, expiry, cost } }, _savedAt }
   itemKey = `${licenseId}::${checkoutId}` (ดู licenseCoverItems) — คงที่ตราบที่ยังไม่คืน seat */
import { doc, getDoc, setDoc } from '../db/compat.js';
import { db } from '../firebase.js';

const REMOTE = () => doc(db, 'it_report', 'license_cover');

export const firestoreLicenseCoverStore = {
  async load() {
    const snap = await getDoc(REMOTE());
    return snap.exists() ? (snap.data().entries || {}) : {};
  },
  async save(entries) {
    // Firestore ไม่รับ undefined — ผ่าน JSON ก่อน
    await setDoc(REMOTE(), { entries: JSON.parse(JSON.stringify(entries)), _savedAt: Date.now() });
  },
};
