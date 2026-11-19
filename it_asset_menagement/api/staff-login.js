// Vercel serverless function — Staff login
// ตรวจ empId + password (staff_passwords · PBKDF2) → คืน session ของ Supabase Auth ให้หน้าเว็บ setSession
//
// พนักงาน 1 คน = ผู้ใช้ Supabase Auth 1 บัญชี (uid คงที่จาก empDocId · อีเมลสังเคราะห์)
//   app_metadata = { app_role: 'staff', emp_id, emp_doc_id } — RLS อ่านค่านี้ (migration 20261110000500)
// ออก session ด้วย admin.generateLink(magiclink) → verifyOtp(token_hash) — ไม่ส่งอีเมล ไม่ต้องใช้ JWT secret
import { Buffer } from 'node:buffer';
import {
  preflight, sb, throwaway, nowTs, getData, findEmployeeByEmpId, authRateLimit,
  hashPassword, timingSafeEqual, newSalt, hasResigned, staffUid, staffEmail, PBKDF2_ITERATIONS,
} from './_lib/supabaseAdmin.js';

/** สร้าง/ปรับบัญชีของพนักงานให้ตรงกับข้อมูลล่าสุด → อีเมลของบัญชี */
export async function ensureStaffUser(empDocId, empId, credentialVersion = 'legacy') {
  const auth = sb().auth.admin;
  const uid = staffUid(empDocId);
  const email = staffEmail(uid);
  const meta = { app_role: 'staff', emp_id: String(empId), emp_doc_id: empDocId, credential_version: credentialVersion };

  const { data: got, error: getErr } = await auth.getUserById(uid);
  const user = got?.user;
  if (!user) {
    if (getErr && getErr.status && getErr.status !== 404) throw new Error(`อ่านบัญชีพนักงานไม่สำเร็จ: ${getErr.message}`);
    const { error } = await auth.createUser({ id: uid, email, email_confirm: true, app_metadata: meta });
    if (error) throw new Error(`สร้างบัญชีพนักงานไม่สำเร็จ: ${error.message}`);
    return email;
  }
  const m = user.app_metadata || {};
  const stale = user.email !== email || m.app_role !== 'staff' || m.emp_id !== meta.emp_id || m.emp_doc_id !== empDocId
    || m.credential_version !== credentialVersion
    || (user.banned_until && Date.parse(user.banned_until) > Date.now());
  if (stale) {
    // A random, unshared Auth password revokes old refresh tokens when an app
    // credential version changes; staff still log in through the app hash.
    const passwordReset = m.credential_version !== credentialVersion ? { password: `${newSalt()}Aa1!` } : {};
    const { error } = await auth.updateUserById(uid, { email, email_confirm: true, app_metadata: meta, ban_duration: 'none', ...passwordReset });
    if (error) throw new Error(`อัปเดตบัญชีพนักงานไม่สำเร็จ: ${error.message}`);
  }
  return email;
}

/** ออก session ให้บัญชี (ไม่ส่งอีเมล) */
export async function issueSession(email) {
  const { data, error } = await sb().auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw new Error(`ออก session ไม่สำเร็จ: ${error.message}`);
  const token_hash = data?.properties?.hashed_token;
  if (!token_hash) throw new Error('ออก session ไม่สำเร็จ: ไม่มี token');
  // client ใช้ครั้งเดียว — ถ้าใช้ตัว service role ร่วม session ของพนักงานจะไปทับสิทธิ์ service role
  const { data: v, error: vErr } = await throwaway().auth.verifyOtp({ type: 'magiclink', token_hash });
  if (vErr || !v?.session) throw new Error(`ออก session ไม่สำเร็จ: ${vErr?.message || 'ไม่มี session'}`);
  const { access_token, refresh_token, expires_at, expires_in } = v.session;
  return { access_token, refresh_token, expires_at, expires_in };
}

/** Bind asynchronous Auth issuance to the exact credentials verified by this
 * request. Auth may otherwise mint newer app_metadata after a concurrent reset. */
export async function issueCredentialSession(empDocId, empId, verifiedPassword) {
  const expectedHash = verifiedPassword.hash;
  const expectedVersion = verifiedPassword.credentialVersion || 'legacy';
  const matches = (current) => current && timingSafeEqual(current.hash, expectedHash)
    && (current.credentialVersion || 'legacy') === expectedVersion;
  if (!matches(await getData('staff_passwords', empDocId))) return null;

  const email = await ensureStaffUser(empDocId, empId, expectedVersion);
  const session = await issueSession(email);
  let accepted = false;
  try {
    // This JWT comes directly from the authenticated Supabase Auth response.
    const claims = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64url').toString('utf8'));
    const metadata = claims.app_metadata || {};
    const latest = await getData('staff_passwords', empDocId);
    const employee = await getData('employees', empDocId);
    if (!matches(latest) || !employee || hasResigned(employee)
      || String(employee.empId || '').trim() !== String(empId)
      || claims.sub !== staffUid(empDocId) || metadata.app_role !== 'staff'
      || metadata.emp_doc_id !== empDocId || metadata.emp_id !== String(empId)
      || (metadata.credential_version || 'legacy') !== expectedVersion) return null;
    accepted = true;
    return { session, password: latest };
  } finally {
    // A discarded session is never returned; revoke its own refresh token too.
    if (!accepted) await sb().auth.admin.signOut(session.access_token, 'local').catch(() => {});
  }
}

export default async function handler(req, res) {
  if (preflight(req, res, { auth: false })) return;

  try {
    const { empId, password } = req.body || {};
    if (typeof empId !== 'string' || !empId.trim() || empId.length > 64
      || typeof password !== 'string' || password.length === 0 || password.length > 1024) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงานและรหัสผ่าน' });
    }

    if (!await authRateLimit(req, res, empId)) return;
    const denied = () => res.status(403).json({ error: 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีไม่พร้อมใช้งาน' });

    const emp = await findEmployeeByEmpId(empId);
    if (!emp) { hashPassword(password, 'staff-login-dummy'); return denied(); }

    const empData = emp.data || {};
    const empIdFromDb = String(empData.empId || '').trim();

    // ถึง "วันที่ออก" แล้ว (ตั้งล่วงหน้าได้) = ออกแล้ว เข้าระบบไม่ได้ — เหมือนคนที่ถูกลบ (src/utils/employeeStatus.js)
    if (hasResigned(empData)) {
      hashPassword(password, 'staff-login-dummy');
      return denied();
    }

    let mustChangePassword = false;
    let pwd = await getData('staff_passwords', emp.id);

    if (!pwd) {
      // First login: grant a restricted session that can only change password.
      if (String(password).trim() !== empIdFromDb) {
        hashPassword(password, 'staff-login-dummy');
        return denied();
      }
      const salt = newSalt();
      const { error } = await sb().from('staff_passwords').upsert({ id: emp.id, data: {
        hash: hashPassword(empIdFromDb, salt), salt,
        iterations: PBKDF2_ITERATIONS,
        updatedAt: nowTs(),
        updatedBy: 'auto-first-login',
        mustChangePassword: true,
        isDefault: true,
        credentialVersion: newSalt(),
      } }, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw new Error('ไม่สามารถสร้างข้อมูลเข้าสู่ระบบได้');
      pwd = await getData('staff_passwords', emp.id);
    }
    if (!pwd?.salt || !timingSafeEqual(hashPassword(password, pwd.salt), pwd.hash)) return denied();
    mustChangePassword = pwd.mustChangePassword !== false || pwd.isDefault !== false || password.trim() === empIdFromDb;
    if (mustChangePassword && pwd.mustChangePassword !== true) {
      const { data: updated, error } = await sb().rpc('change_staff_password', {
        p_emp_id: emp.id, p_expected_hash: pwd.hash,
        p_data: { ...pwd, mustChangePassword: true, ...(password.trim() === empIdFromDb ? { isDefault: true } : {}) },
      });
      if (error) throw new Error('ไม่สามารถตรวจสอบข้อมูลเข้าสู่ระบบได้');
      if (!updated) return denied();
    }

    const issued = await issueCredentialSession(emp.id, empIdFromDb, pwd);
    if (!issued) return denied();
    mustChangePassword ||= issued.password.mustChangePassword !== false || issued.password.isDefault !== false;
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ session: issued.session, empDocId: emp.id, empId: empIdFromDb, mustChangePassword });
  } catch (err) {
    console.error('staff-login failed:', err.code || err.name || 'error');
    return res.status(500).json({ error: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่หรือติดต่อ IT' });
  }
}
