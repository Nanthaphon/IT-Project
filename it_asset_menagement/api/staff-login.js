// Vercel serverless function — Staff login
// ตรวจ empId + password (staff_passwords · PBKDF2) → คืน session ของ Supabase Auth ให้หน้าเว็บ setSession
//
// พนักงาน 1 คน = ผู้ใช้ Supabase Auth 1 บัญชี (uid คงที่จาก empDocId · อีเมลสังเคราะห์)
//   app_metadata = { app_role: 'staff', emp_id, emp_doc_id } — RLS อ่านค่านี้ (migration 20261110000500)
// ออก session ด้วย admin.generateLink(magiclink) → verifyOtp(token_hash) — ไม่ส่งอีเมล ไม่ต้องใช้ JWT secret
import {
  preflight, sb, throwaway, nowTs, getData, setData, findEmployeeByEmpId,
  hashPassword, timingSafeEqual, newSalt, hasResigned, staffUid, staffEmail, PBKDF2_ITERATIONS,
} from './_lib/supabaseAdmin.js';

/** สร้าง/ปรับบัญชีของพนักงานให้ตรงกับข้อมูลล่าสุด → อีเมลของบัญชี */
export async function ensureStaffUser(empDocId, empId) {
  const auth = sb().auth.admin;
  const uid = staffUid(empDocId);
  const email = staffEmail(uid);
  const meta = { app_role: 'staff', emp_id: String(empId), emp_doc_id: empDocId };

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
    || (user.banned_until && Date.parse(user.banned_until) > Date.now());
  if (stale) {
    const { error } = await auth.updateUserById(uid, { email, email_confirm: true, app_metadata: meta, ban_duration: 'none' });
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

export default async function handler(req, res) {
  if (preflight(req, res, { auth: false })) return;

  try {
    const { empId, password } = req.body || {};
    if (!empId || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงานและรหัสผ่าน' });
    }

    const emp = await findEmployeeByEmpId(empId);
    if (!emp) return res.status(404).json({ error: 'ไม่พบรหัสพนักงานนี้ในระบบ' });

    const empData = emp.data || {};
    const empIdFromDb = String(empData.empId || '').trim();

    // ถึง "วันที่ออก" แล้ว (ตั้งล่วงหน้าได้) = ออกแล้ว เข้าระบบไม่ได้ — เหมือนคนที่ถูกลบ (src/utils/employeeStatus.js)
    if (hasResigned(empData)) {
      return res.status(403).json({ error: 'พนักงานคนนี้ออกจากบริษัทแล้ว — ติดต่อฝ่าย IT' });
    }

    let mustChangePassword = false;
    const pwd = await getData('staff_passwords', emp.id);

    if (!pwd) {
      // ── First-time login: รหัสผ่าน default = empId (ไม่บังคับเปลี่ยน) ──
      if (String(password).trim() !== empIdFromDb) {
        return res.status(403).json({ error: 'รหัสผ่านไม่ถูกต้อง — รหัสผ่านเริ่มต้นคือรหัสพนักงาน' });
      }
      const salt = newSalt();
      await setData('staff_passwords', emp.id, {
        hash: hashPassword(empIdFromDb, salt), salt,
        iterations: PBKDF2_ITERATIONS,
        updatedAt: nowTs(),
        updatedBy: 'auto-first-login',
        mustChangePassword: false,
        isDefault: true,          // กำลังใช้รหัสพนักงานเป็นรหัสผ่าน
        plaintext: empIdFromDb,   // ⚠️ ให้ admin เห็น (RLS: admin อ่านได้เท่านั้น)
      });
    } else {
      if (!pwd.salt || !timingSafeEqual(hashPassword(password, pwd.salt), pwd.hash)) {
        return res.status(403).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
      }
      mustChangePassword = pwd.mustChangePassword === true;
    }

    const email = await ensureStaffUser(emp.id, empIdFromDb);
    const session = await issueSession(email);
    return res.status(200).json({ session, empDocId: emp.id, mustChangePassword });
  } catch (err) {
    console.error('staff-login error:', err);
    return res.status(500).json({ error: err.message || 'login failed' });
  }
}
