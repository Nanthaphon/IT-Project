/* ตรวจหลังนำเข้า: จำนวนแถวใน Supabase ต้องเท่ากับไฟล์ส่งออก ทุกตาราง + สุ่มเทียบเนื้อหา
   ใช้ service role (ค่าจาก .env.migration.local) · อ่านอย่างเดียว · ไม่พิมพ์ข้อมูลส่วนบุคคล
   รัน: node scripts/supabase/verify-import.mjs .supabase-export/firestore-xxx.json */
import { readFileSync } from 'node:fs';
import { loadEnv } from './loadEnv.mjs';
import { prepareDump } from './prepareDump.mjs';
import { CHUNK_TABLE } from '../../src/db/codec.js';

loadEnv();
const [file] = process.argv.slice(2);
const { SUPABASE_URL: URL_, SUPABASE_SERVICE_ROLE_KEY: KEY } = process.env;
if (!file || !URL_ || !KEY) { console.error('ใช้: node scripts/supabase/verify-import.mjs <ไฟล์ export> (ต้องมี .env.migration.local)'); process.exit(1); }
const dump = JSON.parse(readFileSync(file, 'utf8'));
prepareDump(dump);   // ปรับแบบเดียวกับตอนนำเข้า (ย้ายรหัส M365) ให้ตัวเลขเทียบกันได้
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function count(table) {
  const r = await fetch(`${URL_}/rest/v1/${table}?select=id`, { method: 'HEAD', headers: { ...headers, Prefer: 'count=exact' } });
  if (!r.ok) throw new Error(`${table}: ${r.status}`);
  return Number(r.headers.get('content-range')?.split('/')[1]);
}
async function fetchRow(table, id) {
  const r = await fetch(`${URL_}/rest/v1/${table}?select=data&id=eq.${encodeURIComponent(id)}`, { headers });
  return (await r.json())[0]?.data;
}
const stable = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x));

const rows = [];
let bad = 0;
const all = { ...dump.tables, [CHUNK_TABLE]: dump.chunks };
for (const [table, list] of Object.entries(all)) {
  const n = await count(table);
  // สุ่ม 3 แถวเทียบเนื้อหาทั้งก้อน (ผู้ดูแลถูกเปลี่ยน id ตอนนำเข้า — ข้าม)
  let sample = '—';
  if (table !== 'admin_users' && table !== CHUNK_TABLE && list.length) {
    const picks = [0, Math.floor(list.length / 2), list.length - 1].map((i) => list[i]);
    let same = 0;
    for (const p of picks) if (stable(await fetchRow(table, p.id)) === stable(p.data)) same++;
    sample = `${same}/${picks.length}`;
    if (same !== picks.length) bad++;
  }
  const ok = n === list.length;
  if (!ok) bad++;
  rows.push({ table, 'ไฟล์ส่งออก': list.length, 'ใน Supabase': n, 'ตรง': ok ? '✓' : '✗', 'เนื้อหาสุ่มเทียบ': sample });
}
console.table(rows);
console.log(bad ? `❌ ไม่ตรง ${bad} จุด` : `✅ ตรงครบทุกตาราง (${rows.length} ตาราง · ${rows.reduce((s, r) => s + r['ใน Supabase'], 0)} แถว)`);
process.exit(bad ? 1 : 0);
