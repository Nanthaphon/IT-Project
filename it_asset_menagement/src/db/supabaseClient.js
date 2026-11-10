/* เชื่อมแอปกับ Supabase — import ครั้งแรกจาก src/firebase.js ตอนเริ่มแอป (ตั้ง backend ให้ compat.js)

   ต้องตั้งใน .env.local (และ Vercel/ที่ build):
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=...        (publishable/anon key — เปิดเผยได้ ปลอดภัยด้วย RLS)
   ห้ามใส่ service_role / secret key ในตัวแปร VITE_* — จะหลุดไปอยู่ในไฟล์หน้าเว็บ */
import { createClient } from '@supabase/supabase-js';
import { configureBackend } from './compat.js';
import { createSupabaseBackend } from './supabaseBackend.js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('ยังไม่ได้ตั้ง VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

configureBackend(createSupabaseBackend(supabase));
