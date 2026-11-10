/* ════════════════════════════════════════════════════════════════════════
   จุดเชื่อมฐานข้อมูล + ระบบเข้าสู่ระบบของแอป — ตอนนี้เป็น Supabase แล้ว (branch supabase-migration)
   ชื่อไฟล์ยังเป็น firebase.js เพื่อไม่ต้องแก้ import ทุกไฟล์ — ข้างในไม่มี Firebase แล้ว

   db   = getFirestore() ของชั้นเชื่อม src/db/compat.js (คำสั่งหน้าตาเหมือน firebase/firestore)
   auth = src/db/auth.js (หน้าตาเหมือน firebase/auth: currentUser / getIdToken / onAuthStateChanged)
   ════════════════════════════════════════════════════════════════════════ */
import { supabase } from './db/supabaseClient.js';   // ตั้ง backend ให้ compat.js ตอน import
import { getFirestore } from './db/compat.js';
import { auth } from './db/auth.js';

// ── ที่อยู่ของฟังก์ชัน api/ ──
// หน้าเว็บ + api/ อยู่โปรเจคเดียวกันบน Vercel ทีมบริษัท (globe-syndicate) → path ตรง ๆ (host เดียวกัน · ไม่ติด CORS)
// `npm run dev` ก็ path ตรง — vite.config.js รันฟังก์ชันใน api/ ในเครื่องเอง
// เผื่อย้อนกลับไปเปิดหน้าเว็บจาก Firebase Hosting (*.web.app) เท่านั้นที่ใช้ URL เต็ม (VITE_VERCEL_API_URL)
//   ตั้งใจไม่ใช้ค่านี้ที่อื่น — กัน build ในเครื่องที่ .env.local ยังชี้ Vercel เก่า แล้วหน้าเว็บใหม่ไปเรียก api รุ่น Firebase
const ON_FIREBASE_HOSTING = typeof window !== 'undefined' && window.location.hostname.endsWith('.web.app');
export const VERCEL_API_BASE = ON_FIREBASE_HOSTING
  ? (import.meta.env.VITE_VERCEL_API_URL || 'https://itassetmenagement.vercel.app')
  : '';

export { supabase, auth };
export const db = getFirestore();
