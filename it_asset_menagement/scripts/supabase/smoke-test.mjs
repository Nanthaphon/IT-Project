/* ตรวจโปรเจค Supabase จริงผ่านชั้นเชื่อมของแอป (src/db) — ใช้ anon key (เหมือนคนที่ยังไม่ login)
   ไม่เขียนข้อมูลใด ๆ ลงฐานข้อมูล · รัน: node scripts/supabase/smoke-test.mjs
   ค่าอ่านจาก .env.local (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) หรือ environment */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { configureBackend, getFirestore, collection, doc, getDoc, getDocs, setDoc, onSnapshot } from '../../src/db/compat.js';
import { createSupabaseBackend } from '../../src/db/supabaseBackend.js';
import { TOP_TABLES } from '../../src/db/codec.js';

const env = { ...process.env };
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in env)) env[m[1]] = m[2].trim();
  }
}
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) { console.error('❌ ไม่พบ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'); process.exit(1); }

const supabase = createClient(url, key);
configureBackend(createSupabaseBackend(supabase));
const db = getFirestore();

let fail = 0;
const check = async (name, fn) => {
  try { const r = await fn(); console.log(`✓ ${name}${r ? ` — ${r}` : ''}`); }
  catch (e) { fail++; console.log(`✗ ${name} — ${e.message}`); }
};

await check('ตารางครบทุกตาราง (อ่านได้ ไม่ error)', async () => {
  const bad = [];
  for (const t of TOP_TABLES) {
    const { error } = await supabase.from(t).select('id').limit(1);
    if (error) bad.push(`${t}: ${error.message}`);
  }
  if (bad.length) throw new Error(bad.join(' | '));
  return `${TOP_TABLES.length} ตาราง`;
});

await check('settings อ่านได้โดยไม่ login (หน้า login ใช้)', async () => {
  const snap = await getDocs(collection(db, 'settings'));
  return `${snap.size} เอกสาร`;
});

for (const t of ['employees', 'assets', 'licenses', 'admin_users', 'employee_secrets', 'staff_passwords']) {
  await check(`${t}: คนที่ยังไม่ login มองไม่เห็นข้อมูล (RLS)`, async () => {
    const snap = await getDocs(collection(db, t));
    if (snap.size !== 0) throw new Error(`เห็น ${snap.size} แถว — สิทธิ์รั่ว!`);
  });
}

await check('คนที่ยังไม่ login เขียนข้อมูลไม่ได้', async () => {
  try { await setDoc(doc(db, 'settings', '__smoke'), { x: 1 }); }
  catch (e) { if (e.code === 'permission-denied' || /row-level security|ไม่มีสิทธิ์/.test(e.message)) return; throw e; }
  throw new Error('เขียนสำเร็จ — สิทธิ์รั่ว!');
});

await check('getDoc เอกสารที่ไม่มี → exists() = false', async () => {
  if ((await getDoc(doc(db, 'settings', '__nope'))).exists()) throw new Error('ไม่ควรมี');
});

await check('realtime: เชื่อมช่องได้ภายใน 8 วินาที', async () => {
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => { un(); reject(new Error('หมดเวลา')); }, 8000);
    const ch = supabase.channel('smoke').subscribe((s) => {
      if (s === 'SUBSCRIBED') { clearTimeout(t); supabase.removeChannel(ch); resolve(); }
      if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') { clearTimeout(t); reject(new Error(s)); }
    });
    const un = () => supabase.removeChannel(ch);
  });
});

void onSnapshot;   // (onSnapshot ถูกเทสต์ใน compat.test.mjs แล้ว — ที่นี่ตรวจแค่ช่องเชื่อมต่อ)
console.log(fail ? `\n❌ ไม่ผ่าน ${fail} ข้อ` : '\n✅ โปรเจค Supabase พร้อม — ตารางครบ สิทธิ์กั้นถูก realtime ต่อได้');
process.exit(fail ? 1 : 0);
