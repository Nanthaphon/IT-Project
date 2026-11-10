/* ส่งค่า env จากไฟล์ในเครื่อง (.env.local / .env.migration.local) ขึ้นโปรเจค Vercel ที่ link ไว้
   — ค่าลับไม่ถูกพิมพ์ออกหน้าจอและไม่ถูกส่งที่อื่น ส่งผ่าน stdin ให้ `vercel env add` ตรง ๆ

   ใช้:  node scripts/vercel-env-push.mjs
   ต้อง `vercel login` + `vercel link` มาก่อน (มีโฟลเดอร์ .vercel) */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// preview ข้ามไว้ — CLI 54 วนถาม git branch ไม่จบเมื่อโปรเจคยังไม่ได้ผูก Git repo
// (ผูก GitHub เมื่อไหร่ค่อยกดคัดลอกค่าไป Preview ในหน้าเว็บ Vercel ทีเดียว)
const TARGETS = ['production', 'development'];

// ชื่อตัวแปรที่ต้องมีบน Vercel → อ่านค่าจากตัวแปรชื่อไหนในไฟล์ (ตรงกันถ้าไม่ระบุ)
const WANTED = [
  ['VITE_SUPABASE_URL'],
  ['SUPABASE_URL', 'VITE_SUPABASE_URL'],      // api/ ใช้ชื่อไม่มี VITE_
  ['VITE_SUPABASE_ANON_KEY'],
  ['SUPABASE_SERVICE_ROLE_KEY'],
  ['TEAMS_IT_WEBHOOK_URL'],                   // ไม่มีในเครื่องก็ข้าม (แจ้งเตือน Teams จะเงียบไว้ก่อน)
  ['TEAMS_HR_WEBHOOK_URL'],
];

const env = {};
for (const f of ['.env.local', '.env.migration.local']) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[2]) env[m[1]] ||= m[2].replace(/^["']|["']$/g, '');
  }
}

// Windows: ต้อง shell:true ถึงจะเรียก vercel.cmd ได้ (Node รุ่นใหม่ไม่รันไฟล์ .cmd ตรง ๆ แล้ว)
// ปลอดภัยเพราะ argument เป็นชื่อตัวแปรคงที่ ส่วนค่าลับไปทาง stdin ไม่ใช่ command line
const vercel = process.platform === 'win32' ? 'vercel.cmd' : 'vercel';
const spawnOpts = { shell: process.platform === 'win32' };
let added = 0;
const skipped = [];

for (const [name, from = name] of WANTED) {
  const value = env[from];
  if (!value) { skipped.push(name); continue; }
  for (const target of TARGETS) {
    // ลบของเดิมก่อน (ถ้ายังไม่มีจะ error — ไม่เป็นไร) แล้วค่อยเพิ่มใหม่ เพื่อให้รันซ้ำได้
    // ส่งค่าทาง stdin ไม่ใช่ --value — ค่าลับจะได้ไม่โผล่ในรายการโปรเซสของเครื่อง
    const r = spawnSync(vercel, ['env', 'add', name, target, '--force'],
      { ...spawnOpts, input: value, stdio: ['pipe', 'ignore', 'inherit'] });
    if (r.status !== 0) { console.error(`! ใส่ ${name} (${target}) ไม่สำเร็จ`); process.exit(1); }
  }
  console.log(`✓ ${name}  → ${TARGETS.join(', ')}`);
  added++;
}

if (skipped.length) console.log(`\nข้าม (ไม่มีค่าในเครื่อง): ${skipped.join(', ')}`);
console.log(`\nใส่แล้ว ${added} ตัว — deploy รอบถัดไปจะใช้ค่าเหล่านี้`);
