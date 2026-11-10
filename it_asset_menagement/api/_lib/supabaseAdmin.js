/* ตัวช่วยร่วมของ Vercel Functions — คุย Supabase ด้วย service role (ข้าม RLS)
   ไฟล์/โฟลเดอร์ใน api/ ที่ขึ้นต้นด้วย _ ไม่ถูกนับเป็นฟังก์ชัน (Vercel)

   env (Vercel → Settings → Environment Variables · ในเครื่อง = .env.migration.local)
     SUPABASE_URL               https://xxxx.supabase.co
     SUPABASE_SERVICE_ROLE_KEY  secret key (sb_secret_…) — ห้ามใส่ในตัวแปร VITE_*
     STAFF_EMAIL_DOMAIN         (ไม่บังคับ) โดเมนอีเมลสังเคราะห์ของบัญชีพนักงาน

   ข้อมูลในตาราง = { id, data jsonb } แบบเดียวกับ src/db/compat.js · เวลาเก็บเป็น { "__ts": ISO } */
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { createClient } from '@supabase/supabase-js';

const URL_ = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const clientOpts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

let admin = null;
/** client service role ตัวเดียวต่อ cold start — ห้ามใช้ sign-in ใด ๆ กับตัวนี้ (session จะทับ service role) */
export function sb() {
  if (!admin) {
    if (!URL_() || !KEY()) throw new Error('ระบบยังไม่พร้อม — ยังไม่ได้ตั้ง SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    admin = createClient(URL_(), KEY(), clientOpts);
  }
  return admin;
}
export const ready = () => !!(URL_() && KEY());

/** client ใช้ครั้งเดียว (ไม่จำ session) — ใช้ตอนต้อง "เป็น" ผู้ใช้ เช่น verifyOtp */
export const throwaway = () => createClient(URL_(), KEY(), clientOpts);

export const nowTs = () => ({ __ts: new Date().toISOString() });

/* ── CORS ─────────────────────────────────────────────────────────── */
function isAllowedOrigin(origin) {
  if (!origin) return false;
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const defaults = ['http://localhost:5173', 'http://localhost:4173'];
  return allowed.includes(origin) || defaults.includes(origin);
}
/** ตั้ง header CORS · คืน true ถ้าตอบไปแล้ว (OPTIONS / method ผิด) */
export function preflight(req, res, { auth = true } = {}) {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', auth ? 'Content-Type, Authorization' : 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return true; }
  if (!ready()) {
    res.status(500).json({ error: 'ระบบยังไม่พร้อมใช้งาน — ยังไม่ได้ตั้ง SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ใน Vercel' });
    return true;
  }
  return false;
}

/* ── ผู้เรียก ─────────────────────────────────────────────────────── */
export const bearer = (req) => (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();

/** ตรวจ access token ของ Supabase Auth → { uid, email, role, empId, empDocId } หรือ null
    role = 'staff' (พนักงาน) · 'hr' · null (ผู้ดูแล/ทั่วไป — ต้องดู admin_users ต่อ) */
export async function verifyCaller(token) {
  if (!token) return null;
  const { data, error } = await sb().auth.getUser(token);
  if (error || !data?.user) return null;
  const u = data.user;
  const m = u.app_metadata || {};
  return { uid: u.id, email: u.email || null, role: m.app_role || null, empId: m.emp_id ?? null, empDocId: m.emp_doc_id ?? null };
}

/** แถว admin_users ของผู้เรียก (token พนักงาน/hr ไม่นับ) */
export async function adminRowOf(caller) {
  if (!caller || caller.role) return null;
  return getData('admin_users', caller.uid);
}

/* ── ตารางเอกสาร (id, data) ───────────────────────────────────────── */
export async function getData(table, id) {
  const { data, error } = await sb().from(table).select('data').eq('id', id).maybeSingle();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data?.data ?? null;
}

/** เขียนทับทั้งเอกสาร (เหมือน setDoc) */
export async function setData(table, id, data) {
  const { error } = await sb().from(table).upsert({ id, data });
  if (error) throw new Error(`${table}: ${error.message}`);
}

/** แก้บางฟิลด์บนสุด — mode 'merge' (ไม่มีเอกสาร = สร้าง) / 'update' (ไม่มี = error) */
export async function patchData(table, id, patch, mode = 'merge') {
  const ops = Object.entries(patch).filter(([, v]) => v !== undefined).map(([k, value]) => ({ path: [k], value }));
  const { error } = await sb().rpc('doc_write', { p_table: table, p_id: id, p_mode: mode, p_ops: ops });
  if (error) throw new Error(`${table}: ${error.message}`);
}

export async function removeData(table, id) {
  const { error, count } = await sb().from(table).delete({ count: 'exact' }).eq('id', id);
  if (error) throw new Error(`${table}: ${error.message}`);
  return count || 0;
}

/** ลบทุกแถวที่ data.field == value · คืนจำนวนที่ลบ */
export async function deleteWhere(table, field, value) {
  if (value === undefined || value === null || value === '') return 0;
  const { error, count } = await sb().from(table).delete({ count: 'exact' }).eq(`data->>${field}`, String(value));
  if (error) throw new Error(`${table}: ${error.message}`);
  return count || 0;
}

/** ทุกแถวของตาราง → [{ id, data }] (PostgREST ส่งครั้งละไม่เกิน 1000) */
export async function listAll(table) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb().from(table).select('id,data').order('id').range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

/** หา employee จากรหัสพนักงาน — ตรงตัวก่อน แล้วลองตัวพิมพ์เล็ก/ใหญ่ (ไม่เกิน 3 ครั้ง) → { id, data } */
export async function findEmployeeByEmpId(empId) {
  const input = String(empId || '').trim();
  const seen = new Set();
  for (const c of [input, input.toLowerCase(), input.toUpperCase()]) {
    if (!c || seen.has(c)) continue;
    seen.add(c);
    const { data, error } = await sb().from('employees').select('id,data').eq('data->>empId', c).limit(1);
    if (error) throw new Error(`employees: ${error.message}`);
    if (data?.length) return data[0];
  }
  return null;
}

/* ── บัญชี Supabase Auth ──────────────────────────────────────────── */
/** หา user จากอีเมล (admin API ไม่มีค้นตรง — ไล่ทีละหน้า ผู้ใช้ระบบนี้หลักร้อย) */
export async function findAuthUserByEmail(email) {
  const target = String(email || '').trim().toLowerCase();
  for (let page = 1; ; page++) {
    const { data, error } = await sb().auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => (u.email || '').toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < 1000) return null;
  }
}

/* ── รหัสผ่านพนักงาน (staff_passwords) — PBKDF2-SHA256 100k รอบ (เหมือนเดิม) ── */
export const PBKDF2_ITERATIONS = 100_000;
export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), salt, PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');
}
export function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
export const newSalt = () => crypto.randomBytes(16).toString('hex');

/** ถึง "วันที่ออก" แล้ว (เวลาไทย) — เหมือน src/utils/employeeStatus.js และ app.staff_active() */
export function hasResigned(empData, now = Date.now()) {
  const resign = String(empData?.resignDate || '').trim();
  const todayTH = new Date(now + 7 * 3600 * 1000).toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(resign) && resign <= todayTH;
}

/* ── บัญชีของพนักงาน ──────────────────────────────────────────────
   uid คงที่ต่อพนักงาน (คำนวณจาก empDocId) → หาเจอได้ทันทีโดยไม่ต้องค้นอีเมล
   อีเมลสังเคราะห์ ไม่มีกล่องจดหมายจริง ระบบไม่ส่งอีเมลไปที่นี่ (ใช้ admin API ออก session) */
export function staffUid(empDocId) {
  const h = crypto.createHash('sha256').update(`it-asset-staff:${empDocId}`).digest('hex');
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export const staffEmail = (uid) => `staff-${uid}@${process.env.STAFF_EMAIL_DOMAIN || 'staff.itasset.invalid'}`;
