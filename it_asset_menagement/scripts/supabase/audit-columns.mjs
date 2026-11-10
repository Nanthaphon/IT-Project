/* ตรวจคอลัมน์ทั้งระบบกับข้อมูลจริง (บน PGlite = โครงสร้างเดียวกับ Supabase) — อ่านอย่างเดียว ไม่พิมพ์ข้อมูลส่วนบุคคล
   รัน: node scripts/supabase/audit-columns.mjs [.supabase-export/firestore-xxx.json]   (ไม่ใส่ = ไฟล์ล่าสุด)
     1) ฟิลด์ใน data ที่ยังไม่มีคอลัมน์ — พร้อมเหตุผล (ตั้งใจไม่แยก / ควรเพิ่ม)
     2) ค่าหาย: data มีค่า แต่คอลัมน์ว่าง (แปลงตัวเลข/วันที่ไม่ได้) — นับทุกแถว ทุกคอลัมน์
     3) report.license_seats / accessory_holders เทียบกับหลักเดียวกับ CSV ของเว็บ
     4) (ถ้ามี .env.migration.local) Supabase จริงมีคอลัมน์ครบเท่านี้หรือยัง */
import { readFileSync, readdirSync } from 'node:fs';
import { createTestDb } from './pgliteBackend.mjs';
import { prepareDump } from './prepareDump.mjs';
import { loadEnv } from './loadEnv.mjs';

const file = process.argv[2] || `.supabase-export/${readdirSync('.supabase-export').filter((f) => f.endsWith('.json')).sort().at(-1)}`;
const dump = JSON.parse(readFileSync(file, 'utf8'));
prepareDump(dump);
const db = await createTestDb();
for (const [t, rows] of Object.entries(dump.tables)) {
  for (const r of rows) await db.query(`insert into ${t} (id, data) values ($1, $2)`, [r.id, r.data]);
}
for (const c of dump.chunks) {
  await db.query('insert into doc_chunks (parent_collection, parent_id, sub, id, data) values ($1,$2,$3,$4,$5)',
    [c.parent_collection, c.parent_id, c.sub, c.id, c.data]);
}
console.log(`ข้อมูล: ${file} (${dump.source} ${dump.exportedAt})\n`);

/* ฟิลด์ที่ตั้งใจไม่แยกเป็นคอลัมน์ */
const INTENTIONAL = {
  m365Password: 'รหัสผ่าน', nationalId: 'เลขบัตรประชาชน (ข้อมูลอ่อนไหว)', password: 'รหัสผ่าน', hash: 'รหัสผ่าน', salt: 'รหัสผ่าน', plaintext: 'รหัสผ่าน',
  createdAt: 'มีคอลัมน์ created_at แล้ว', updatedAt: 'มีคอลัมน์ updated_at แล้ว', id: 'ซ้ำกับ id', uid: 'ซ้ำกับ id', createdTs: 'เวลาสร้างรุ่นเก่า (มี created_at)',
  image: 'รูป base64', fileData: 'ไฟล์ base64', photoGallery: 'รูป', damagePhoto: 'รูป', damagePhotos: 'รูป', pictureUrl: 'ลิงก์รูปโปรไฟล์ LINE',
  links: 'รายการลิงก์ (ซ้อน)', document: 'ไฟล์แนบ', documents: 'ไฟล์แนบ', signedFile: 'ไฟล์ที่เซ็น',
  assignees: 'รายการผู้ถือ → report.license_seats / accessory_holders / assigned_count', givenItems: 'รายการชิ้นที่จ่าย (ซ้อน)',
  permissions: 'สิทธิ์เมนู (ซ้อน)', evaluation: 'แยกเป็นคะแนนแต่ละด้านแล้ว', isChunked: 'ภายในระบบ', chunkCount: 'ภายในระบบ', chunks: 'ภายในระบบ',
  assetIds: 'รายการ id (ซ้อน · มี asset_names)', bundledCount: 'ภายในระบบ',
};
const PREFIX_INTENTIONAL = [
  [/^available/, 'ข้อมูลรายสิทธิ์/รายชิ้นที่ว่าง → report.license_seats'],
  [/^(checkout|return)(Fields|Checklist|Photos|Assessment)$/, 'แบบประเมินสภาพ (ซ้อน)'],
  [/^condition(Before|After)$/, 'แบบประเมินสภาพ (ซ้อน)'],
  [/^brokenItems$/, 'รายการชิ้นชำรุด (ซ้อน)'], [/^purchaseHistoryLog$/, 'ประวัติการซื้อ (ซ้อน)'],
  [/^old[A-Z]/, 'ข้อมูลเครื่องเดิมในคำขอ (ว่างทุกแถว)'],
];
const NO_COLUMNS_TABLES = {
  settings: 'ค่าตั้งค่าระบบ (เอกสารเดียว ซ้อนหลายชั้น)', it_report: 'ร่างรายงานรายเดือน (ซ้อน)',
  employee_secrets: 'รหัสผ่าน M365 (ตั้งใจไม่แยก)', staff_passwords: 'รหัสผ่าน Staff Portal (ตั้งใจไม่แยก)',
};

const kind = (v) => (v === null || v === undefined ? 'ว่าง' : Array.isArray(v) ? 'รายการ' : typeof v === 'object'
  ? ('__ts' in v ? 'เวลา' : 'ออบเจ็กต์') : typeof v === 'string' ? (v === '' ? 'ว่าง' : v.length > 300 ? 'ข้อความยาว' : 'ข้อความ') : typeof v);
const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length);

const genCols = async (t) => (await db.query(
  `select column_name, data_type, generation_expression from information_schema.columns
    where table_schema = 'public' and table_name = $1 and is_generated = 'ALWAYS' order by ordinal_position`, [t])).rows;
const keysIn = (expr) => [...expr.matchAll(/'([A-Za-z0-9_]+)'::text/g)].map((m) => m[1]);

let problems = 0;
const missingReport = [];
const lostReport = [];
const tableSummary = [];

for (const [t, rows] of Object.entries(dump.tables)) {
  const cols = await genCols(t);
  const covered = new Set(cols.flatMap((c) => keysIn(c.generation_expression)));
  const keyStat = {};
  rows.forEach((r) => Object.entries(r.data).forEach(([k, v]) => {
    const s = (keyStat[k] ||= { filled: 0, kinds: new Set() });
    if (!isEmpty(v)) { s.filled++; s.kinds.add(kind(v)); }
  }));
  let noCol = 0;
  for (const [k, s] of Object.entries(keyStat)) {
    if (covered.has(k)) continue;
    const reason = NO_COLUMNS_TABLES[t] || INTENTIONAL[k] || PREFIX_INTENTIONAL.find(([re]) => re.test(k))?.[1]
      || (s.filled === 0 ? 'ว่างทุกแถว' : null);
    if (!reason) { problems++; missingReport.push({ ตาราง: t, ฟิลด์: k, 'แถวที่มีค่า': `${s.filled}/${rows.length}`, ชนิด: [...s.kinds].join('/') }); }
    else noCol++;
  }

  // ค่าหาย: data มีค่า แต่คอลัมน์ว่าง (เฉพาะคอลัมน์ที่มาจากฟิลด์เดียว)
  for (const c of cols) {
    const keys = [...new Set(keysIn(c.generation_expression))];
    if (keys.length !== 1 && !(keys.length === 2 && keys[0] === 'evaluation')) continue;
    if (/app\.len\(/.test(c.generation_expression)) continue;
    const path = keys.length === 2 ? `data->'${keys[0]}'->'${keys[1]}'` : `data->'${keys[0]}'`;
    const r = (await db.query(
      `select count(*)::int n, array_agg(distinct left(regexp_replace(${path} #>> '{}', '[0-9]', '9', 'g'), 20)) pats from ${t}
        where ${c.column_name} is null and ${path} is not null and jsonb_typeof(${path}) <> 'null'
          and coalesce(${path} #>> '{}', '') <> '' and not (jsonb_typeof(${path}) = 'array' and jsonb_array_length(${path}) = 0)`)).rows[0];
    if (r.n) { problems++; lostReport.push({ ตาราง: t, คอลัมน์: c.column_name, ชนิด: c.data_type, 'แถวที่ค่าหาย': r.n, 'รูปแบบค่า': (r.pats || []).join(' | ') }); }
  }
  tableSummary.push({ ตาราง: t, แถว: rows.length, 'ฟิลด์ใน data': Object.keys(keyStat).length, คอลัมน์ที่แยก: cols.length, 'ตั้งใจไม่แยก': noCol });
}

console.log('── สรุปรายตาราง ──');
console.table(tableSummary);
console.log('\n── ฟิลด์ที่มีค่าแต่ยังไม่มีคอลัมน์ (ควรเพิ่ม) ──');
if (missingReport.length) console.table(missingReport); else console.log('✓ ไม่มี — ทุกฟิลด์ที่มีค่ามีคอลัมน์ หรือตั้งใจไม่แยกพร้อมเหตุผล');
console.log('\n── ค่าหาย (data มีค่า แต่คอลัมน์ว่าง) ──');
if (lostReport.length) console.table(lostReport); else console.log('✓ ไม่มี — ทุกคอลัมน์แปลงค่าได้ครบทุกแถว');

/* ── สิทธิ์ License รายตัว: เทียบกับหลักเดียวกับ CSV (handleExportLicenses) ── */
const nz = (a, b) => (a === undefined || a === null || a === '' ? b : a);
let expSeats = 0; let seatMismatch = 0;
for (const l of dump.tables.licenses) {
  const d = l.data;
  const total = Number(d.quantity || 0) || 1;
  const as = d.assignees || [];
  const exp = [
    ...as.map((a) => ({ status: (a.isAssetBound || a.assignedAssetId) ? (a.empId ? 'ใช้งาน (ผูกเครื่อง)' : 'ติดตั้งบนเครื่อง') : 'ใช้งาน', emp: a.empId || null, key: nz(a.productKey, d.productKey) || null })),
    ...Array.from({ length: Math.max(0, total - as.length) }, (_, i) => ({ status: 'ว่าง', emp: null, key: nz((d.availableKeys || [])[i], d.productKey) || null })),
  ];
  expSeats += exp.length;
  const got = (await db.query('select seat_status, emp_id, product_key from report.license_seats where license_id = $1 order by seat_no', [l.id])).rows;
  if (got.length !== exp.length || got.some((g, i) => g.seat_status !== exp[i].status || (g.emp_id || null) !== exp[i].emp || (g.product_key || null) !== exp[i].key)) seatMismatch++;
}
const seatDates = (await db.query(`select count(*) filter (where checkout_date is not null)::int ok, count(*) filter (where seat_status <> 'ว่าง')::int used,
  min(checkout_date)::text first, max(checkout_date)::text last from report.license_seats`)).rows[0];
console.log(`\n── report.license_seats ── แถว ${(await db.query('select count(*)::int n from report.license_seats')).rows[0].n} (CSV ได้ ${expSeats}) · License ที่ไม่ตรง ${seatMismatch} · วันที่เบิกแปลงได้ ${seatDates.ok}/${seatDates.used} (${seatDates.first} – ${seatDates.last})`);
if (seatMismatch) problems++;

const holders = dump.tables.accessories.reduce((s, r) => s + (r.data.assignees || []).length, 0);
const gotHolders = (await db.query('select count(*)::int n from report.accessory_holders')).rows[0].n;
console.log(`── report.accessory_holders ── แถว ${gotHolders} (ชิ้นที่จ่ายออกในข้อมูล ${holders})`);
if (holders !== gotHolders) problems++;

/* ── พนักงาน: รหัสหัวหน้า / วันที่ออก / สถานะ เทียบกับ CSV ของเว็บ (handleExportEmployees) ── */
{
  const { managerCodeOf } = await import('../../src/utils/managers.js');
  const { resignDateOf, empStatus } = await import('../../src/utils/employeeStatus.js');
  const everyone = [...dump.tables.employees, ...dump.tables.deleted_employees].map((r) => ({ id: r.id, ...r.data }));
  const today = (await db.query(`select (now() at time zone 'Asia/Bangkok')::date::text d`)).rows[0].d;
  let ok = 0; const bad = [];
  for (const [t, removed] of [['employees', false], ['deleted_employees', true]]) {
    const view = new Map((await db.query(`select id, manager_emp_id, resign_date::text rd, status from report.${t}`)).rows.map((r) => [r.id, r]));
    for (const r of dump.tables[t]) {
      const emp = { id: r.id, ...r.data };
      const delMs = r.data.deletedAt?.__ts ? Date.parse(r.data.deletedAt.__ts) : null;
      const csv = {
        mgr: managerCodeOf(emp, everyone) || null,
        // เว็บใช้เวลาเครื่องผู้ใช้ (ไทย) — เทียบด้วยเวลาไทยเสมอ ไม่ขึ้นกับเขตเวลาของเครื่องที่รันสคริปต์
        rd: resignDateOf(emp) || (removed && delMs ? new Date(delMs + 7 * 3600e3).toISOString().slice(0, 10) : null),
        st: empStatus(emp, { removed, today }),
      };
      const v = view.get(r.id);
      const same = (v.manager_emp_id || null) === csv.mgr && (v.rd || null) === csv.rd && v.status === csv.st;
      if (same) ok++; else bad.push({ ตาราง: t, id: r.id.slice(0, 6), หัวหน้า: `${v.manager_emp_id}≠${csv.mgr}`, วันที่ออก: `${v.rd}≠${csv.rd}`, สถานะ: `${v.status}≠${csv.st}` });
    }
  }
  console.log(`── พนักงาน (รหัสหัวหน้า · วันที่ออก · สถานะ) ── ตรงกับ CSV ${ok}/${ok + bad.length}`);
  if (bad.length) { console.table(bad); problems++; }
}

/* ── Supabase จริงมีคอลัมน์ครบหรือยัง ── */
loadEnv();
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const H = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` };
  const missing = [];
  for (const t of Object.keys(dump.tables)) {
    const cols = (await genCols(t)).map((c) => c.column_name);
    if (!cols.length) continue;
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${t}?select=${cols.join(',')}&limit=1`, { headers: H });
    if (!r.ok) missing.push(`${t}: ${(await r.json()).message}`);
  }
  console.log(`\n── Supabase จริง ── ${missing.length ? `ยังขาดคอลัมน์ (ต้องรัน SQL):\n  ${missing.join('\n  ')}` : '✓ มีคอลัมน์ครบเท่าที่ตรวจ'}`);
}

console.log(problems ? `\n❌ พบ ${problems} จุดที่ต้องดู` : '\n✅ ผ่านทุกข้อ');
process.exit(problems ? 1 : 0);
