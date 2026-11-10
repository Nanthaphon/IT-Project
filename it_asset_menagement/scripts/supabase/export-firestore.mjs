/* ส่งออกข้อมูลทั้งหมดจาก Firestore → ไฟล์ JSON (อ่านอย่างเดียว ไม่แก้อะไรใน Firestore)
   ขั้นที่ 1 ของการย้ายไป Supabase — ไฟล์นี้ใช้ต่อกับ import-to-supabase.mjs

   ใช้กับ emulator (ค่าตั้งต้น — เปิด npm run emu ไว้ก่อน):
     node scripts/supabase/export-firestore.mjs
   ใช้กับฐานข้อมูลจริง (ต้องมีไฟล์ service account ของ Firebase · เจ้าของระบบรันเอง):
     set GOOGLE_APPLICATION_CREDENTIALS=C:\path\service-account.json
     node scripts/supabase/export-firestore.mjs --prod
   ผลลัพธ์: .supabase-export/firestore-<เวลา>.json (อยู่ใน .gitignore — มีข้อมูลส่วนบุคคล ห้าม commit) */
import { mkdirSync, writeFileSync } from 'node:fs';
import admin from 'firebase-admin';
import { encodeValue, TOP_TABLES } from '../../src/db/codec.js';
import { loadEnv } from './loadEnv.mjs';

loadEnv();   // GOOGLE_APPLICATION_CREDENTIALS อ่านจาก .env.migration.local ได้

const PROJECT = 'it-asset-management-dc883';
const prod = process.argv.includes('--prod');
if (!prod) process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
if (prod && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('❌ --prod ต้องตั้ง GOOGLE_APPLICATION_CREDENTIALS เป็นไฟล์ service account ก่อน (ใน terminal หรือ .env.migration.local)');
  process.exit(1);
}

admin.initializeApp({ projectId: PROJECT });
const db = admin.firestore();

const out = { source: prod ? 'production' : 'emulator', exportedAt: new Date().toISOString(), tables: {}, chunks: [], unknown: {} };
const counts = {};

for (const col of await db.listCollections()) {
  const snap = await col.get();
  const rows = [];
  for (const d of snap.docs) {
    rows.push({ id: d.id, data: encodeValue(d.data()) });
    for (const sub of await d.ref.listCollections()) {
      const subSnap = await sub.get();
      subSnap.docs.forEach((c) => out.chunks.push({
        parent_collection: col.id, parent_id: d.id, sub: sub.id, id: c.id, data: encodeValue(c.data()),
      }));
    }
  }
  // collection ที่ไม่มีตารางรองรับ — เก็บไว้ดูแยก ไม่ทิ้ง
  (TOP_TABLES.includes(col.id) ? out.tables : out.unknown)[col.id] = rows;
  counts[col.id] = rows.length;
}

mkdirSync('.supabase-export', { recursive: true });
const file = `.supabase-export/firestore-${out.exportedAt.replace(/[:.]/g, '-')}.json`;
writeFileSync(file, JSON.stringify(out));

console.log(`✅ ส่งออกจาก ${out.source} → ${file}`);
console.table(counts);
console.log(`ชิ้นไฟล์แนบ (subcollection): ${out.chunks.length}`);
if (Object.keys(out.unknown).length) {
  console.warn(`⚠️ collection ที่ยังไม่มีตารางใน Supabase: ${Object.keys(out.unknown).join(', ')} — เพิ่มใน migration + TOP_TABLES ก่อนนำเข้า`);
}
process.exit(0);
