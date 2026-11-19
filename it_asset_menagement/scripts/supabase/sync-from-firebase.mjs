/* ซิงก์ข้อมูลใหม่จาก Firebase → Supabase (ไม่ล้าง ไม่ทับงานที่ทำบน Supabase) — กติกาอยู่ที่ syncMerge.mjs

   1. node scripts/supabase/export-firestore.mjs --prod            (Firebase ล่าสุด · อ่านอย่างเดียว)
   2. node scripts/supabase/production-status.mjs                  (snapshot Supabase ล่าสุด)
   3. node scripts/supabase/sync-from-firebase.mjs <ฐาน> <firebase ล่าสุด> <supabase ล่าสุด>           ดูแผน
      ... --apply                                                                                  เขียนจริง
   ฐาน = ไฟล์ export ที่เคยนำเข้า Supabase (ครั้งแรก: firestore-2026-11-10T03-57-41-712Z.json)
   ซิงก์รอบถัดไป: ฐาน = ไฟล์ Firebase ที่ใช้ซิงก์รอบก่อน
   หลังเขียน: รัน migrate-private-storage.mjs --apply ซ้ำ (รูปใหม่จาก Firebase ยังเป็น base64)
   ไม่พิมพ์ข้อมูลส่วนตัว · สำรองค่าก่อนแก้ทุกแถวลง .supabase-export/sync-backup-*.json ก่อนเขียน */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { TOP_TABLES, CHUNK_TABLE } from '../../src/db/codec.js';
import { loadEnv } from './loadEnv.mjs';
import { prepareDump } from './prepareDump.mjs';
import { planSync } from './syncMerge.mjs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const files = args.filter((a) => !a.startsWith('--'));
if (files.length !== 3) { console.error('ใช้: sync-from-firebase.mjs <ฐาน> <firebase ล่าสุด> <supabase ล่าสุด> [--apply]'); process.exit(1); }
const [base, firebase, supabase] = files.map((f) => JSON.parse(readFileSync(f, 'utf8')));
if (firebase.source === 'supabase' || supabase.source !== 'supabase') throw new Error('ลำดับไฟล์ผิด: ฐาน, firebase, supabase');
for (const d of [base, firebase, supabase]) prepareDump(d);

const plan = planSync({ base, firebase, supabase, tables: TOP_TABLES });
console.table(plan.summary.filter((r) => r.insert || r.update || r.delete || r.conflict));
const conflicts = Object.entries(plan.tables).flatMap(([table, t]) => t.conflicts.map((c) => ({ table, fields: c.fields, partial: !!c.partial })));
if (conflicts.length) console.log('Conflict (คงค่า Supabase · ชื่อฟิลด์เท่านั้น):', JSON.stringify(conflicts));
if (!apply) { console.log('\n(ดูแผน — ยังไม่เขียนอะไร) เพิ่ม --apply เพื่อเขียนจริง'); process.exit(0); }

loadEnv();
const { SUPABASE_URL: URL_, SUPABASE_SERVICE_ROLE_KEY: KEY } = process.env;
if (!URL_ || !KEY) throw new Error('ตั้ง SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ก่อน');
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

mkdirSync('.supabase-export', { recursive: true });
const backupPath = `.supabase-export/sync-backup-${new Date().toISOString().replaceAll(':', '-')}.json`;
writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), plan }), { flag: 'wx' });
JSON.parse(readFileSync(backupPath, 'utf8'));   // อ่านกลับได้ก่อนแตะของจริง

const createdAt = (data) => {
  const c = data?.createdAt;
  if (c && typeof c === 'object' && typeof c.__ts === 'string') return c.__ts;
  if (typeof c === 'number' && c > 1e12) return new Date(c).toISOString();
  return undefined;
};
const q = encodeURIComponent;
const result = { inserted: 0, updated: 0, deleted: 0, stale: 0, failed: 0 };
async function call(url, init, okRows) {
  const r = await fetch(url, { ...init, headers: { ...headers, ...init.headers } });
  if (r.status === 409) { result.stale++; return; }
  if (!r.ok) { result.failed++; console.warn(`⚠️ ${init.method} ${r.status}`); return; }
  if (okRows) {
    const rows = await r.json();
    if (!rows.length) { result.stale++; return; }   // มีคนแก้หลัง snapshot — ข้าม รันซ้ำกับ snapshot ใหม่
  }
  return true;
}

for (const [table, t] of Object.entries(plan.tables)) {
  for (const row of t.inserts) {
    const body = { id: row.id, data: row.data, ...(createdAt(row.data) && { created_at: createdAt(row.data) }) };
    if (await call(`${URL_}/rest/v1/${table}`, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(body) })) result.inserted++;
  }
  for (const row of t.updates) {
    const url = `${URL_}/rest/v1/${table}?id=eq.${q(row.id)}&updated_at=eq.${q(row.updated_at)}`;
    if (await call(url, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ data: row.data }) }, true)) result.updated++;
  }
  for (const row of t.deletes) {
    const url = `${URL_}/rest/v1/${table}?id=eq.${q(row.id)}&updated_at=eq.${q(row.updated_at)}`;
    if (await call(url, { method: 'DELETE', headers: { Prefer: 'return=representation' } }, true)) result.deleted++;
  }
}
for (const c of plan.chunks.inserts) {
  if (await call(`${URL_}/rest/v1/${CHUNK_TABLE}`, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(c) })) result.inserted++;
}
for (const c of plan.chunks.deletes) {
  const url = `${URL_}/rest/v1/${CHUNK_TABLE}?parent_collection=eq.${q(c.parent_collection)}&parent_id=eq.${q(c.parent_id)}&sub=eq.${q(c.sub)}&id=eq.${q(c.id)}`;
  if (await call(url, { method: 'DELETE', headers: { Prefer: 'return=representation' } }, true)) result.deleted++;
}
console.log('\n✅ ซิงก์เสร็จ', result, `\nสำรองค่าก่อนแก้: ${backupPath}`);
if (result.stale || result.failed) process.exitCode = 1;
