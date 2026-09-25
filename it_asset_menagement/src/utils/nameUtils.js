/* ────────────────────────────────────────────────────────────
   nameUtils — แยก/รวม ชื่อจริง + นามสกุล
   แยกด้วย "ช่องว่างแรก": ก่อนช่องว่าง = ชื่อจริง, ที่เหลือ = นามสกุล
   (รองรับนามสกุลหลายคำ เช่น "van der Berg")
   ──────────────────────────────────────────────────────────── */

export function splitName(full) {
  const s = String(full || '').trim().replace(/\s+/g, ' ');
  if (!s) return { first: '', last: '' };
  const i = s.indexOf(' ');
  if (i === -1) return { first: s, last: '' };
  return { first: s.slice(0, i), last: s.slice(i + 1) };
}

export function joinName(first, last) {
  return [String(first || '').trim(), String(last || '').trim()].filter(Boolean).join(' ');
}

/* คืน { first, last } โดยใช้ field ที่แยกไว้ก่อน ถ้าไม่มีค่อย fallback แยกจาก full */
export function resolveName(firstField, lastField, full) {
  const f = String(firstField || '').trim();
  const l = String(lastField || '').trim();
  if (f || l) return { first: f, last: l };
  return splitName(full);
}

/* ────────────────────────────────────────────────────────────
   ตัดคำนำหน้าชื่อออก — ใช้ตอน "แสดงผล" เท่านั้น ไม่แก้ข้อมูลที่เก็บ

   คำขอเบิกเก็บชื่อพร้อมคำนำหน้าติดกัน ("นางสาวกชกร เรืองนุ้ย")
   อวาตาร์ที่ใช้ตัวแรกของชื่อเลยได้ "น" ทุกแถว บอกอะไรไม่ได้เลย

   นางสาว ต้องมาก่อน นาง ไม่งั้น "นางสาว..." จะเหลือ "สาว..."
   ข้อจำกัด: ชื่อจริงที่ขึ้นต้นด้วย นาย/นาง จะถูกตัดผิด (เช่น "นายิกา")
   จึงควรใช้ชื่อจากทะเบียนพนักงานก่อน แล้วค่อยใช้ตัวนี้เป็นทางสำรอง
   ──────────────────────────────────────────────────────────── */
const TITLES = ['นางสาว', 'น.ส.', 'นาง', 'นาย', 'ด.ญ.', 'ด.ช.', 'Mrs.', 'Mr.', 'Ms.', 'Miss'];

export function stripTitle(name) {
  const s = String(name || '').trim();
  for (const t of TITLES) {
    if (s.startsWith(t)) {
      const rest = s.slice(t.length).trim();
      return rest || s;
    }
  }
  return s;
}

/* ตัวอักษรสำหรับอวาตาร์ — ชื่อเล่นก่อน (เพื่อนร่วมงานจำกันด้วยชื่อเล่น)
   ข้ามสระหน้า เ แ โ ใ ไ ไปเอาพยัญชนะ ไม่งั้น "เกศินี" จะได้ "เ" โดด ๆ */
const LEADING_VOWELS = 'เแโใไ';

export function initialOf(name, nickname) {
  const src = String(nickname || '').trim() || stripTitle(name);
  if (!src) return '?';
  const first = src.charAt(0);
  if (LEADING_VOWELS.includes(first) && src.length > 1) return src.charAt(1);
  return first.toUpperCase();
}
