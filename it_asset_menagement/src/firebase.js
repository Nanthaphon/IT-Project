/* ════════════════════════════════════════════════════════════════════════
   จุดเชื่อมฐานข้อมูล + ระบบเข้าสู่ระบบของแอป — ตอนนี้เป็น Supabase แล้ว (branch supabase-migration)
   ชื่อไฟล์ยังเป็น firebase.js เพื่อไม่ต้องแก้ import ทุกไฟล์ — ข้างในไม่มี Firebase แล้ว

   db   = getFirestore() ของชั้นเชื่อม src/db/compat.js (คำสั่งหน้าตาเหมือน firebase/firestore)
   auth = src/db/auth.js (หน้าตาเหมือน firebase/auth: currentUser / getIdToken / onAuthStateChanged)
   ════════════════════════════════════════════════════════════════════════ */
import { supabase } from './db/supabaseClient.js';   // ตั้ง backend ให้ compat.js ตอน import
import { getFirestore } from './db/compat.js';
import { auth } from './db/auth.js';

// ── Vercel API base URL ──
// หน้าเว็บอยู่ Firebase Hosting (*.web.app) → เรียก Vercel functions ผ่าน URL เต็ม
// หน้าเว็บอยู่ Vercel → relative path (host เดียวกัน)
// ตอน `npm run dev` ใช้ path ตรง ๆ — vite.config.js รันฟังก์ชันใน api/ ในเครื่องเอง (ต่อ Supabase)
export const VERCEL_API_BASE = import.meta.env.DEV ? '' : (
  import.meta.env.VITE_VERCEL_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('.web.app')
    ? 'https://itassetmenagement.vercel.app'
    : ''));

export { supabase, auth };
export const db = getFirestore();
