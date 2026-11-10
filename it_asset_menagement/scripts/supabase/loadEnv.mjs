/* โหลดค่าจาก .env.migration.local (ค่าลับสำหรับย้ายข้อมูล) และ .env.local เข้า process.env
   ไม่ทับค่าที่ตั้งไว้แล้วใน terminal · ไฟล์ *.local ไม่ถูก commit (.gitignore)
   ห้าม console.log ค่าที่โหลด — มีคีย์ลับ */
import { existsSync, readFileSync } from 'node:fs';

export function loadEnv(files = ['.env.migration.local', '.env.local']) {
  for (const f of files) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m || !m[2] || m[1] in process.env) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  // URL ใช้ค่าเดียวกับแอปได้
  process.env.SUPABASE_URL ||= process.env.VITE_SUPABASE_URL || '';
}
