// Vercel serverless function — Admin set/reset staff password
// (เรียกได้เฉพาะผู้ดูแลที่ login ผ่าน Supabase Auth และมีแถวใน admin_users)
import {
  preflight, bearer, verifyCaller, adminRowOf, getData, setData, nowTs,
  hashPassword, newSalt, PBKDF2_ITERATIONS, validNewStaffPassword,
} from './_lib/supabaseAdmin.js';
import { ensureStaffUser } from './staff-login.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  const caller = await verifyCaller(token).catch(() => null);
  if (!caller) return res.status(401).json({ error: 'Invalid or expired token' });
  if (!(await adminRowOf(caller))) return res.status(403).json({ error: 'Caller is not an admin' });

  try {
    const { empDocId, newPassword } = req.body || {};
    if (typeof empDocId !== 'string' || !empDocId || empDocId.length > 128) {
      return res.status(400).json({ error: 'ข้อมูลพนักงานไม่ถูกต้อง' });
    }

    const emp = await getData('employees', empDocId);
    if (!emp) return res.status(404).json({ error: 'ไม่พบพนักงานคนนี้' });
    if (!validNewStaffPassword(newPassword, emp.empId)) {
      return res.status(400).json({ error: 'รหัสผ่านชั่วคราวต้องมี 8–1024 ตัวอักษร และไม่ใช่รหัสพนักงาน' });
    }

    const salt = newSalt();
    const credentialVersion = newSalt();

    await setData('staff_passwords', empDocId, {
      hash: hashPassword(newPassword, salt), salt,
      iterations: PBKDF2_ITERATIONS,
      updatedAt: nowTs(),
      updatedBy: caller.uid,
      mustChangePassword: true,
      isDefault: false,
      credentialVersion,
    });
    await ensureStaffUser(empDocId, emp.empId, credentialVersion);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('set-staff-password failed:', err.code || err.name || 'error');
    return res.status(500).json({ error: 'รีเซ็ตรหัสผ่านไม่สำเร็จ กรุณาลองใหม่' });
  }
}
