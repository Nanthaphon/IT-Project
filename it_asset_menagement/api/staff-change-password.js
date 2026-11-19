// Vercel serverless function — Staff change own password
// (ตรวจ token ของ Supabase Auth · ตรวจรหัสเดิม · อัปเดต hash + ล้าง mustChangePassword)
import {
  preflight, bearer, verifyCaller, getData, sb, nowTs, authRateLimit, validNewStaffPassword,
  hashPassword, timingSafeEqual, newSalt, PBKDF2_ITERATIONS,
} from './_lib/supabaseAdmin.js';
import { issueCredentialSession } from './staff-login.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  const caller = await verifyCaller(token, { allowPasswordChange: true }).catch(() => null);
  if (!caller) return res.status(401).json({ error: 'Invalid or expired token' });

  // ต้องเป็นพนักงานเท่านั้น
  if (caller.role !== 'staff' || !caller.empDocId) {
    return res.status(403).json({ error: 'ใช้สำหรับ staff เท่านั้น' });
  }

  try {
    const { currentPassword, newPassword, resetToDefault } = req.body || {};
    if (typeof currentPassword !== 'string' || !currentPassword || currentPassword.length > 1024) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านเดิม' });
    }

    if (!await authRateLimit(req, res, caller.empDocId, 'change-password')) return;
    if (resetToDefault === true) return res.status(400).json({ error: 'กรุณาตั้งรหัสผ่านส่วนตัว ห้ามใช้รหัสพนักงาน' });
    const emp = await getData('employees', caller.empDocId);
    if (!emp || !validNewStaffPassword(newPassword, emp.empId)) {
      return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมี 8–1024 ตัวอักษร และไม่ใช่รหัสพนักงาน' });
    }
    const pwd = await getData('staff_passwords', caller.empDocId);
    if (!pwd) return res.status(404).json({ error: 'ไม่พบข้อมูลรหัสผ่าน' });
    if (!pwd.salt || !timingSafeEqual(hashPassword(currentPassword, pwd.salt), pwd.hash)) {
      return res.status(403).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม' });
    }

    const salt = newSalt();
    const credentialVersion = newSalt();
    const { plaintext: _oldPassword, ...previous } = pwd;
    const newCredential = {
        ...previous,
        hash: hashPassword(newPassword, salt),
        salt,
        iterations: PBKDF2_ITERATIONS,
        updatedAt: nowTs(),
        updatedBy: caller.uid,
        mustChangePassword: false,
        isDefault: false,
        credentialVersion,
    };
    const { data: changed, error } = await sb().rpc('change_staff_password', {
      p_emp_id: caller.empDocId, p_expected_hash: pwd.hash, p_data: newCredential,
    });
    if (error) throw new Error('บันทึกไม่สำเร็จ');
    if (!changed) return res.status(409).json({ error: 'รหัสผ่านถูกเปลี่ยนระหว่างทำรายการ กรุณาเข้าสู่ระบบใหม่' });

    const issued = await issueCredentialSession(caller.empDocId, emp.empId, newCredential);
    if (!issued) return res.status(409).json({ error: 'รหัสผ่านถูกเปลี่ยนระหว่างทำรายการ กรุณาเข้าสู่ระบบใหม่' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ success: true, isDefault: false, session: issued.session });
  } catch (err) {
    console.error('staff-change-password failed:', err.code || err.name || 'error');
    return res.status(500).json({ error: 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่หรือติดต่อ IT' });
  }
}
