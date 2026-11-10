// Vercel serverless function — Staff change own password
// (ตรวจ token ของ Supabase Auth · ตรวจรหัสเดิม · อัปเดต hash + ล้าง mustChangePassword)
import {
  preflight, bearer, verifyCaller, getData, patchData, nowTs,
  hashPassword, timingSafeEqual, newSalt, PBKDF2_ITERATIONS,
} from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  const caller = await verifyCaller(token).catch(() => null);
  if (!caller) return res.status(401).json({ error: 'Invalid or expired token' });

  // ต้องเป็นพนักงานเท่านั้น
  if (caller.role !== 'staff' || !caller.empDocId) {
    return res.status(403).json({ error: 'ใช้สำหรับ staff เท่านั้น' });
  }

  try {
    const { currentPassword, newPassword, resetToDefault } = req.body || {};
    if (typeof currentPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านเดิม' });
    }

    const pwd = await getData('staff_passwords', caller.empDocId);
    if (!pwd) return res.status(404).json({ error: 'ไม่พบข้อมูลรหัสผ่าน' });
    if (!pwd.salt || !timingSafeEqual(hashPassword(currentPassword, pwd.salt), pwd.hash)) {
      return res.status(403).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }

    let finalNewPassword;
    let isDefault = false;
    if (resetToDefault === true) {
      // ── ตั้งกลับเป็นรหัสพนักงาน — อ่านจาก employees (ไม่ใช้ค่าใน token เผื่อข้อมูลเปลี่ยน) ──
      const emp = await getData('employees', caller.empDocId);
      if (!emp) return res.status(404).json({ error: 'ไม่พบข้อมูลพนักงาน' });
      const empId = String(emp.empId || '').trim();
      if (!empId) return res.status(500).json({ error: 'ไม่พบรหัสพนักงาน' });
      finalNewPassword = empId;
      isDefault = true;
    } else {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
      }
      if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม' });
      }
      finalNewPassword = newPassword;
    }

    const salt = newSalt();
    await patchData('staff_passwords', caller.empDocId, {
      hash: hashPassword(finalNewPassword, salt),
      salt,
      iterations: PBKDF2_ITERATIONS,
      updatedAt: nowTs(),
      updatedBy: caller.uid,
      mustChangePassword: false,
      isDefault,
      plaintext: finalNewPassword,  // ⚠️ ให้ admin เห็น
    });

    return res.status(200).json({ success: true, isDefault });
  } catch (err) {
    console.error('staff-change-password error:', err);
    return res.status(500).json({ error: err.message || 'failed' });
  }
}
