/* ── หมายเหตุรายเดือนของตารางฮาร์ดแวร์ / ซอฟต์แวร์ ใน IT Monthly Report ──
   เดิมหมายเหตุอยู่ในแถวของตาราง (hw/sw) ซึ่งใช้ร่วมทุกเดือน และกด "ดึงจากระบบ" = แทนทั้งตาราง → หมายเหตุหาย

   ตอนนี้แยกเก็บ: notes = { [monthKey 'YYYY-MM']: { [ชื่อประเภท/ชื่อโปรแกรม]: ข้อความ } }
   - แก้เดือนไหน เก็บที่เดือนนั้น · เดือนที่ยังไม่เคยแก้ ใช้ค่าล่าสุดของเดือนก่อนหน้า (ยกยอดมา)
   - ย้อนไปเดือนก่อน → เห็นค่าเดิมของเดือนนั้น ไม่โดนค่าที่แก้ทีหลังทับ
   - ผูกกับชื่อแถว ไม่ใช่ลำดับ → ดึงจากระบบใหม่ (ลำดับเปลี่ยน) หมายเหตุก็กลับมาตรงแถว
   BASE_KEY = หมายเหตุที่ย้ายมาจากระบบเก่า ใช้เป็นค่าตั้งต้นของทุกเดือน */

export const BASE_KEY = '0000-00';

export const monthKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`;

const has = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

/** หมายเหตุของแถว ณ เดือนนั้น (undefined = ไม่เคยกรอก → ใช้ค่าจากระบบ) */
export function noteFor(notes, mk, rowKey) {
  let best = null;
  for (const k of Object.keys(notes || {})) {
    if (k <= mk && (best === null || k > best) && has(notes[k], rowKey)) best = k;
  }
  return best === null ? undefined : notes[best][rowKey];
}

/** แถวพร้อมหมายเหตุของเดือนนั้น */
export const applyNotes = (rows, notes, mk, keyField) => rows.map((r) => {
  const n = r[keyField] ? noteFor(notes, mk, r[keyField]) : undefined;
  return n === undefined ? r : { ...r, note: n };
});

export const setNote = (notes, mk, rowKey, text) => ({ ...notes, [mk]: { ...(notes?.[mk] || {}), [rowKey]: text } });

/** ตารางที่แก้มาจากแถวที่ใส่หมายเหตุรายเดือนแล้ว → คืนหมายเหตุเดิมของแถว (ไม่ให้หมายเหตุเดือนนี้ไปฝังในตารางที่ใช้ร่วม) */
export function stripNotes(rows, baseRows, keyField) {
  const base = new Map(baseRows.map((r) => [r[keyField], r.note]));
  return rows.map((r) => (base.has(r[keyField]) ? { ...r, note: base.get(r[keyField]) } : r));
}

/* หมายเหตุที่ระบบสร้างเอง — ไม่ย้ายเป็นหมายเหตุที่ผู้ใช้กรอก (ไม่งั้นตัวเลขจะค้าง ไม่อัปเดตตามระบบ) */
const AUTO_NOTE = /^((สำรอง|ตัดจำหน่าย) \d+( · )?)+$|^(หมดอายุ|ใกล้หมดอายุ)/;

/** ร่างรุ่นก่อน: หมายเหตุที่ผู้ใช้กรอกไว้ในแถว → { ชื่อแถว: ข้อความ } */
export function legacyNotes(rows, keyField) {
  const out = {};
  (rows || []).forEach((r) => {
    const n = String(r?.note ?? '').trim();
    if (r?.[keyField] && n && n !== '–' && !AUTO_NOTE.test(n)) out[r[keyField]] = r.note;
  });
  return out;
}
