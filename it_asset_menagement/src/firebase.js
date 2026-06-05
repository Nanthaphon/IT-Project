import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app);
