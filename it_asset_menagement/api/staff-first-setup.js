// Vercel serverless function — Staff First-time Password Setup
// (พนักงานตั้งรหัสผ่านเองครั้งแรก โดยยืนยันด้วย M365 Email)
import {
  preflight, getData, setData, nowTs, findEmployeeByEmpId,
  hashPassword, newSalt, PBKDF2_ITERATIONS,
} from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (preflight(req, res, { auth: false })) return;

  try {
    const { empId, m365Email, newPassword } = req.body || {};
    if (!empId) return res.status(400).json({ error: 'กรุณากรอกรหัสพนักงาน' });
    if (!m365Email) return res.status(400).json({ error: 'กรุณากรอก M365 Email เพื่อยืนยันตัวตน' });
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const emp = await findEmployeeByEmpId(empId);
    if (!emp) return res.status(404).json({ error: 'ไม่พบรหัสพนักงานนี้ในระบบ' });

    // ตรวจ M365 email ตรงกัน
    const empData = emp.data || {};
    const storedEmail = String(empData.m365Email || '').trim().toLowerCase();
    if (!storedEmail) {
      return res.status(412).json({
        error: 'พนักงานคนนี้ยังไม่มี M365 Email ในระบบ — กรุณาติดต่อ IT เพื่อตั้งรหัสผ่าน',
      });
    }
    if (storedEmail !== String(m365Email).trim().toLowerCase()) {
      return res.status(403).json({ error: 'M365 Email ไม่ตรงกับข้อมูลในระบบ' });
    }

    // ตรวจว่ายังไม่เคยตั้งรหัสผ่าน (กันไม่ให้ override ของเดิม)
    if (await getData('staff_passwords', emp.id)) {
      return res.status(409).json({
        error: 'รหัสผ่านถูกตั้งไว้แล้ว — ถ้าลืมรหัสผ่าน กรุณาติดต่อ IT เพื่อรีเซ็ต',
      });
    }

    const salt = newSalt();
    await setData('staff_passwords', emp.id, {
      hash: hashPassword(newPassword, salt),
      salt,
      iterations: PBKDF2_ITERATIONS,
      updatedAt: nowTs(),
      updatedBy: 'self-setup',
      isFirstSetup: true,
    });

    return res.status(200).json({ success: true, empName: empData.fullName || '' });
  } catch (err) {
    console.error('staff-first-setup error:', err);
    return res.status(500).json({ error: err.message || 'setup failed' });
  }
}
