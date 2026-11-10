// Vercel serverless function — Admin set/reset staff password
// (เรียกได้เฉพาะผู้ดูแลที่ login ผ่าน Supabase Auth และมีแถวใน admin_users)
import {
  preflight, bearer, verifyCaller, adminRowOf, getData, setData, nowTs,
  hashPassword, newSalt, PBKDF2_ITERATIONS,
} from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  const caller = await verifyCaller(token).catch(() => null);
  if (!caller) return res.status(401).json({ error: 'Invalid or expired token' });
  if (!(await adminRowOf(caller))) return res.status(403).json({ error: 'Caller is not an admin' });

  try {
    const { empDocId, newPassword } = req.body || {};
    if (!empDocId || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง (รหัสผ่านอย่างน้อย 6 ตัว)' });
    }

    const emp = await getData('employees', empDocId);
    if (!emp) return res.status(404).json({ error: 'ไม่พบพนักงานคนนี้' });

    const salt = newSalt();
    const empId = String(emp.empId || '').trim();

    await setData('staff_passwords', empDocId, {
      hash: hashPassword(newPassword, salt), salt,
      iterations: PBKDF2_ITERATIONS,
      updatedAt: nowTs(),
      updatedBy: caller.uid,
      mustChangePassword: false,          // admin ตั้งเอง → ไม่บังคับเปลี่ยน (admin จะบอกพนักงานเอง)
      isDefault: newPassword === empId,   // ตั้งเป็นรหัสพนักงาน
      plaintext: newPassword,             // ⚠️ ให้ admin เห็น
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('set-staff-password error:', err);
    return res.status(500).json({ error: err.message || 'failed' });
  }
}
