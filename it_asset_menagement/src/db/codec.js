/* แปลงค่าระหว่าง Firestore ↔ jsonb ของ Supabase
   Firestore มีชนิด Timestamp ที่ JSON ไม่มี → เก็บเป็น { "__ts": "ISO" }
   ตอนอ่านกลับคืนเป็นออบเจ็กต์หน้าตาเหมือน Timestamp (toMillis / toDate / seconds)
   โค้ดเดิมที่เรียก t?.toMillis?.() หรือ t?.seconds จึงทำงานต่อได้โดยไม่ต้องแก้
   ใช้ร่วมกัน: สคริปต์ย้ายข้อมูล (scripts/supabase) + ชั้นเชื่อมฐานข้อมูลในแอป */

export const TS_KEY = '__ts';

const isTimestampLike = (v) => v && typeof v === 'object' && typeof v.toDate === 'function' && 'seconds' in v;

/** ค่า Firestore (หรือ Date) → JSON-safe */
export function encodeValue(v) {
  if (v === undefined) return undefined;
  if (v === null || typeof v !== 'object') return v;
  if (v instanceof Date) return { [TS_KEY]: v.toISOString() };
  if (isTimestampLike(v)) return { [TS_KEY]: v.toDate().toISOString() };
  if (Array.isArray(v)) return v.map((x) => (x === undefined ? null : encodeValue(x)));
  const out = {};
  for (const [k, x] of Object.entries(v)) {
    const e = encodeValue(x);
    if (e !== undefined) out[k] = e;
  }
  return out;
}

/** ออบเจ็กต์แทน Firestore Timestamp */
export function makeTimestamp(iso) {
  const ms = Date.parse(iso);
  return {
    seconds: Math.floor(ms / 1000),
    nanoseconds: (ms % 1000) * 1e6,
    toMillis: () => ms,
    toDate: () => new Date(ms),
    toJSON: () => ({ [TS_KEY]: new Date(ms).toISOString() }),
    valueOf: () => ms,
  };
}

/** JSON จาก jsonb → ค่าที่โค้ดแอปใช้ (คืน Timestamp) */
export function decodeValue(v) {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(decodeValue);
  const keys = Object.keys(v);
  if (keys.length === 1 && keys[0] === TS_KEY && typeof v[TS_KEY] === 'string') return makeTimestamp(v[TS_KEY]);
  const out = {};
  for (const [k, x] of Object.entries(v)) out[k] = decodeValue(x);
  return out;
}

/* ── ชื่อตาราง ───────────────────────────────────────────────
   collection บนสุด = ตารางชื่อเดียวกัน
   subcollection (เช่น printed_documents/{id}/chunks) = ตารางกลาง doc_chunks
   แยกด้วย parent_collection + parent_id + sub */
export const TOP_TABLES = [
  'settings', 'it_report',
  'assets', 'accessories', 'licenses', 'office_supplies', 'bundled_items',
  'employees', 'employee_secrets', 'deleted_employees',
  'repair_requests', 'supply_requests', 'replacement_requests', 'accessory_requests',
  'assets_transactions', 'accessories_transactions', 'licenses_transactions',
  'transaction_attachments', 'asset_purchase_docs', 'printed_documents',
  'staff_passwords', 'line_users', 'admin_users',
];

export const CHUNK_TABLE = 'doc_chunks';

/** path Firestore → ที่เก็บใน Postgres
    'assets'                          → { table: 'assets' }
    'printed_documents/abc/chunks'    → { table: 'doc_chunks', parentCollection, parentId, sub } */
export function tableForPath(path) {
  const parts = String(path).split('/').filter(Boolean);
  if (parts.length === 1) {
    if (!TOP_TABLES.includes(parts[0])) throw new Error(`ไม่รู้จัก collection "${parts[0]}" — เพิ่มใน TOP_TABLES และ migration ก่อน`);
    return { table: parts[0] };
  }
  if (parts.length === 3) {
    const [parentCollection, parentId, sub] = parts;
    if (!TOP_TABLES.includes(parentCollection)) throw new Error(`ไม่รู้จัก collection "${parentCollection}"`);
    return { table: CHUNK_TABLE, parentCollection, parentId, sub };
  }
  throw new Error(`path ของ collection ไม่ถูกต้อง: ${path}`);
}
