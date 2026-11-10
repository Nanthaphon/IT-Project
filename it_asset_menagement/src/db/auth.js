/* ════════════════════════════════════════════════════════════════════════
   ระบบเข้าสู่ระบบ — หน้าตาเหมือน 'firebase/auth' (เท่าที่แอปใช้) แต่ข้างในคือ Supabase Auth
   โค้ดหน้าจอเดิมเรียก auth.currentUser / getIdToken / onAuthStateChanged ได้เหมือนเดิม

   ผู้ดูแล  = ผู้ใช้ Supabase Auth (อีเมล + รหัสผ่าน) ที่มีแถวใน admin_users (id = uid)
   พนักงาน = ผู้ใช้ Supabase Auth ที่ api/staff-login สร้างให้ (อีเมลสังเคราะห์)
             app_metadata = { app_role: 'staff', emp_id, emp_doc_id } — ผู้ใช้แก้เองไม่ได้
             → claims ที่หน้าจอเห็น = { role: 'staff', empId, empDocId } เหมือน custom token เดิม

   ข้อควรระวังของ supabase-js: ห้ามเรียกคำสั่ง supabase ใน onAuthStateChange ตรง ๆ (ค้างได้)
   จึงส่งต่อให้ผู้ฟังด้วย setTimeout เสมอ
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient.js';

let current = null;          // ผู้ใช้ปัจจุบัน (รูปแบบเดียวกับ Firebase User เท่าที่ใช้)
let initialized = false;     // รู้สถานะครั้งแรกแล้วหรือยัง (INITIAL_SESSION)
const listeners = new Set();
const recoveryListeners = new Set();
let pendingRecovery = false;  // ลิงก์จากอีเมลถูกอ่านก่อนหน้าจอพร้อม — จำไว้ให้ผู้ฟังที่มาทีหลัง

function claimsOf(user) {
  const m = user?.app_metadata || {};
  return { role: m.app_role || null, empId: m.emp_id ?? null, empDocId: m.emp_doc_id ?? null };
}

async function freshToken(fallback) {
  const { data } = await supabase.auth.getSession();   // ต่ออายุให้เองถ้าใกล้หมด
  return data.session?.access_token || fallback || null;
}

function wrap(session) {
  const u = session?.user;
  if (!u) return null;
  const claims = claimsOf(u);
  return {
    uid: u.id,
    email: u.email || null,
    claims,
    getIdToken: () => freshToken(session.access_token),
    getIdTokenResult: async () => ({ token: await freshToken(session.access_token), claims }),
  };
}

const later = (fn) => setTimeout(fn, 0);

supabase.auth.onAuthStateChange((event, session) => {
  const prevUid = current?.uid ?? null;
  current = wrap(session);
  const first = !initialized;
  initialized = true;
  if (event === 'PASSWORD_RECOVERY') {
    if (recoveryListeners.size) later(() => recoveryListeners.forEach((fn) => fn()));
    else pendingRecovery = true;
  }
  // แจ้งเฉพาะเมื่อ "คน" เปลี่ยน — ต่ออายุ token ทุกชั่วโมงไม่ต้องให้หน้าจอโหลดใหม่
  if (first || (current?.uid ?? null) !== prevUid) {
    const user = current;
    later(() => listeners.forEach((fn) => fn(user)));
  }
});

/** ใช้แทน getAuth() / auth ของ Firebase */
export const auth = {
  get currentUser() { return current; },
};
export const getAuth = () => auth;

/** onAuthStateChanged(auth, cb) → ฟังก์ชันเลิกฟัง · เรียก cb ทันทีด้วยสถานะปัจจุบัน (ถ้ารู้แล้ว) */
export function onAuthStateChanged(_auth, cb) {
  listeners.add(cb);
  if (initialized) { const user = current; later(() => { if (listeners.has(cb)) cb(user); }); }
  return () => listeners.delete(cb);
}

/** เปิดลิงก์ "ตั้งรหัสผ่านใหม่" จากอีเมล → แอปควรเปิดหน้าต่างตั้งรหัส */
export function onPasswordRecovery(cb) {
  recoveryListeners.add(cb);
  if (pendingRecovery) { pendingRecovery = false; later(cb); }
  return () => recoveryListeners.delete(cb);
}

const authError = (error) => {
  const e = new Error(error.message);
  e.code = error.code || error.name;
  e.status = error.status;
  return e;
};

export async function signInWithEmailAndPassword(_auth, email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: String(email).trim(), password });
  if (error) throw authError(error);
  return { user: wrap(data.session) };
}

/** พนักงาน: api/staff-login ส่ง access/refresh token กลับมา → ตั้งเป็น session ของเครื่องนี้ */
export async function signInWithStaffSession({ access_token, refresh_token }) {
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw authError(error);
  return { user: wrap(data.session) };
}

/** ออกจากระบบเฉพาะเครื่องนี้ (เหมือน Firebase) — เครื่องอื่นที่ล็อกอินบัญชีเดียวกันไม่หลุด */
export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw authError(error);
}

/** ตรวจรหัสผ่านปัจจุบันโดยไม่แตะ session ของหน้าเว็บ (ใช้ client ชั่วคราวที่ไม่จำอะไร) */
export async function verifyPassword(email, password) {
  const temp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'verify-password' },
  });
  const { error } = await temp.auth.signInWithPassword({ email, password });
  if (error) throw authError(error);
  await temp.auth.signOut({ scope: 'local' }).catch(() => {});
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw authError(error);
}

/** ส่งอีเมลลิงก์ตั้งรหัสผ่านใหม่ — ลิงก์พากลับมาหน้าเว็บนี้ แล้ว onPasswordRecovery ทำงาน
    (ต้องใส่ URL ของเว็บใน Supabase → Authentication → URL Configuration) */
export async function sendPasswordResetEmail(_auth, email) {
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(String(email).trim(), { redirectTo });
  if (error) throw authError(error);
}
