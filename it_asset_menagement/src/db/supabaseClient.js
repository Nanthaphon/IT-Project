/* เชื่อมแอปกับ Supabase — ใช้ตอนสลับระบบ (ระยะที่ 2 ใน docs/SUPABASE-MIGRATION.md)
   ยังไม่มีไฟล์ไหน import ไฟล์นี้ · เว็บจริงยังใช้ Firebase

   ต้องตั้งใน .env.local (และ Vercel/ที่ build):
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=...        (publishable/anon key — เปิดเผยได้ ปลอดภัยด้วย RLS)
   ห้ามใส่ service_role key ในตัวแปร VITE_* — จะหลุดไปอยู่ในไฟล์หน้าเว็บ */
import { createClient } from '@supabase/supabase-js';
import { configureBackend } from './compat.js';
import { createSupabaseBackend } from './supabaseBackend.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error('ยังไม่ได้ตั้ง VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

configureBackend(createSupabaseBackend(supabase));
