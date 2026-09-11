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
