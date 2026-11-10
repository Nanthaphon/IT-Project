/* นำไฟล์ JSON จาก export-firestore.mjs เข้า Supabase (ขั้นที่ 2 ของการย้าย)

   ต้องตั้งค่าก่อน (เอามาจาก Supabase → Project Settings → API — ห้ามใส่ใน git / ห้ามส่งในแชท):
     set SUPABASE_URL=https://xxxx.supabase.co
     set SUPABASE_SERVICE_ROLE_KEY=...        (คีย์ลับ — ข้าม RLS ได้ ใช้เฉพาะสคริปต์นี้)

   ลองดูก่อน ไม่เขียนอะไร:
     node scripts/supabase/import-to-supabase.mjs .supabase-export/firestore-xxx.json --dry-run
   นำเข้าจริง (รันซ้ำได้ — id เดิมจะทับ ไม่ซ้ำ):
     node scripts/supabase/import-to-supabase.mjs .supabase-export/firestore-xxx.json

   ผู้ดูแลระบบ (admin_users): id เดิมเป็น uid ของ Firebase Auth ซึ่งย้ายรหัสผ่านไม่ได้
   สคริปต์สร้างบัญชีใน Supabase Auth ด้วยอีเมลเดิม (ยังไม่มีรหัสผ่าน) แล้วเปลี่ยน id ให้ตรงบัญชีใหม่
   หลังนำเข้า: ผู้ดูแลแต่ละคนกด "ลืมรหัสผ่าน" ตั้งรหัสใหม่ หรือ SuperAdmin ตั้งให้ */
import { readFileSync } from 'node:fs';
import { CHUNK_TABLE } from '../../src/db/codec.js';
import { loadEnv } from './loadEnv.mjs';

loadEnv();   // SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY อ่านจาก .env.migration.local ได้ (ไม่ต้องพิมพ์ใน terminal)

const [file] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dry = process.argv.includes('--dry-run');
if (!file) { console.error('ใช้: node scripts/supabase/import-to-supabase.mjs <ไฟล์ export> [--dry-run]'); process.exit(1); }

const { SUPABASE_URL: URL_, SUPABASE_SERVICE_ROLE_KEY: KEY } = process.env;
if (!dry && (!URL_ || !KEY)) { console.error('❌ ตั้ง SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ก่อน (ใน terminal หรือ .env.migration.local)'); process.exit(1); }

const dump = JSON.parse(readFileSync(file, 'utf8'));
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

/* created_at ของแถว = createdAt ในเอกสาร (ถ้ามี) — ให้เรียงตามเวลาสร้างจริงได้ */
const createdAt = (data) => {
  const c = data?.createdAt;
  if (c && typeof c === 'object' && typeof c.__ts === 'string') return c.__ts;
  if (typeof c === 'number' && c > 1e12) return new Date(c).toISOString();
  return undefined;
};

/* แบ่งส่งทีละก้อน: ไม่เกิน 500 แถว และไม่เกิน ~4 MB (ชิ้นไฟล์แนบชิ้นละ ~700 KB — ส่งรวดเดียวเซิร์ฟเวอร์ปฏิเสธ) */
const MAX_ROWS = 500;
const MAX_BYTES = 4 * 1024 * 1024;
function* batches(rows) {
  let part = []; let size = 0;
  for (const r of rows) {
    const n = Buffer.byteLength(JSON.stringify(r));
    if (part.length && (part.length >= MAX_ROWS || size + n > MAX_BYTES)) { yield part; part = []; size = 0; }
    part.push(r); size += n;
  }
  if (part.length) yield part;
}

async function upsert(table, rows, conflict = 'id') {
  for (const part of batches(rows)) {
    const r = await fetch(`${URL_}/rest/v1/${table}?on_conflict=${conflict}`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(part),
    });
    if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
  }
}

/* ผู้ดูแล: สร้าง/หาบัญชี Supabase Auth จากอีเมล → id ใหม่ */
async function remapAdmins(rows) {
  const out = [];
  for (const row of rows) {
    const email = String(row.data?.email || '').trim().toLowerCase();
    if (!email) { console.warn(`⚠️ admin_users/${row.id} ไม่มีอีเมล — ข้าม`); continue; }
    let r = await fetch(`${URL_}/auth/v1/admin/users`, {
      method: 'POST', headers, body: JSON.stringify({ email, email_confirm: true }),
    });
    let uid;
    if (r.ok) uid = (await r.json()).id;
    else {
      // มีบัญชีอยู่แล้ว (รันซ้ำ) → หาจากรายชื่อ
      r = await fetch(`${URL_}/auth/v1/admin/users?per_page=1000`, { headers });
      uid = (await r.json()).users?.find((u) => u.email?.toLowerCase() === email)?.id;
    }
    if (!uid) throw new Error(`สร้างบัญชีผู้ดูแล ${email} ไม่สำเร็จ`);
    out.push({ ...row, id: uid, data: { ...row.data, uid, firebaseUid: row.id } });
  }
  return out;
}

const summary = {};
for (const [table, rows] of Object.entries(dump.tables)) {
  summary[table] = rows.length;
  if (dry || !rows.length) continue;
  const prepared = table === 'admin_users' ? await remapAdmins(rows) : rows;
  await upsert(table, prepared.map((r) => ({ id: r.id, data: r.data, ...(createdAt(r.data) && { created_at: createdAt(r.data) }) })));
  console.log(`✓ ${table} ${prepared.length}`);
}
summary[CHUNK_TABLE] = dump.chunks.length;
if (!dry && dump.chunks.length) {
  await upsert(CHUNK_TABLE, dump.chunks, 'parent_collection,parent_id,sub,id');
  console.log(`✓ ${CHUNK_TABLE} ${dump.chunks.length}`);
}

console.log(dry ? `\n(ลองดู — ยังไม่ได้เขียนอะไร) ไฟล์จาก ${dump.source} ${dump.exportedAt}` : '\n✅ นำเข้าเสร็จ');
console.table(summary);
if (Object.keys(dump.unknown || {}).length) console.warn(`⚠️ ไม่ได้นำเข้า (ไม่มีตาราง): ${Object.keys(dump.unknown).join(', ')}`);
