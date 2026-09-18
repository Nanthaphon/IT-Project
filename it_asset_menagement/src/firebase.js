import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore, initializeFirestore, connectFirestoreEmulator,
  persistentLocalCache, persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// ── Vercel API base URL ──
// เมื่อ deploy บน Firebase Hosting จะเรียก Vercel functions ผ่าน URL เต็ม
// เมื่อ deploy บน Vercel จะใช้ relative path (เว็บและ functions อยู่บน host เดียวกัน)
export const VERCEL_API_BASE =
  import.meta.env.VITE_VERCEL_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('.web.app')
    ? 'https://itassetmenagement.vercel.app'
    : '');

const firebaseConfig = {
  apiKey: "AIzaSyAyOWP7fsCUYh2cevBPBpehP85p7tuy-hM",
  authDomain: "it-asset-management-dc883.firebaseapp.com",
  projectId: "it-asset-management-dc883",
  storageBucket: "it-asset-management-dc883.firebasestorage.app",
  messagingSenderId: "897937967642",
  appId: "1:897937967642:web:9b0ccc5ca28a8c57f55fa3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/* ── แคชในเครื่อง (IndexedDB) ─────────────────────────────────────
   ค่าเริ่มต้นของ Firestore web SDK คือแคชในหน่วยความจำอย่างเดียว
   แปลว่า "รีเฟรชหน้า 1 ครั้ง = อ่านเอกสารใหม่ทั้งหมดจากเซิร์ฟเวอร์"
   ระบบนี้เปิด listener ครอบทั้ง collection พร้อมกันสิบกว่าตัวตอนล็อกอิน
   รีเฟรชไม่กี่สิบครั้งต่อวันก็ชน quota ของแพลนฟรี (50,000 reads/วัน)
   แล้วทั้งระบบล่มจนถึงเที่ยงคืนเวลาแปซิฟิก — เข้าสู่ระบบก็ไม่ได้

   เปิดแคชแบบ persistent แล้ว listener จะ resume ด้วย token
   คิด read เฉพาะเอกสารที่เปลี่ยนจริง ไม่ใช่ทั้ง collection ซ้ำทุกครั้ง
   multi-tab manager จำเป็นเพราะผู้ใช้เปิดหลายแท็บพร้อมกัน

   โหมด emulator ใช้แคชในหน่วยความจำตามเดิม — ไม่ต้องเก็บอะไรลงเครื่อง
   และเลี่ยงปัญหาข้อมูลเก่าค้างข้ามรอบทดสอบ */
export const db = import.meta.env.VITE_USE_EMULATOR === '1'
  ? getFirestore(app)
  : initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });

export const storage = getStorage(app);

/* ── โหมด emulator — เปิดด้วยคำสั่ง  npm run dev:emu  เท่านั้น ──────
   งานปรับ UI ไม่ควรไปกิน quota ของ Firestore ตัวจริง — โหมดนี้ชี้ทุกอย่าง
   ไปที่ emulator ในเครื่อง ข้อมูลอยู่ใน .emulator-data (ไม่ขึ้น git)
   npm run dev  ตามปกติยังต่อฐานข้อมูลจริงเหมือนเดิม                       */
if (import.meta.env.VITE_USE_EMULATOR === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  console.info('%c[emulator] ต่อ Firestore/Auth/Storage ในเครื่อง — ไม่แตะข้อมูลจริง',
    'background:#2B6777;color:#fff;padding:2px 6px;border-radius:4px');
}
