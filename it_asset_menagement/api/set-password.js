// Vercel serverless function — รีเซ็ตรหัสผ่านบัญชีผู้ดูแล (Supabase Auth admin API)
// ตรวจสิทธิ์ผู้เรียกจาก admin_users ก่อนเปลี่ยนรหัสผ่าน
// body: { idToken, targetUid, newPassword }  — idToken ส่งใน body ได้ (หน้าเว็บรุ่นเดิม) หรือ Authorization header
import { preflight, bearer, verifyCaller, adminRowOf, getData, sb, findAuthUserByEmail } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  try {
    const { idToken: bodyToken, targetUid, targetEmail, newPassword, lookupByEmail } = req.body || {};
    const idToken = bearer(req) || bodyToken;

    if (!idToken || typeof idToken !== 'string') return res.status(400).json({ error: 'ไม่พบ idToken' });
    if (!targetUid && !targetEmail) return res.status(400).json({ error: 'ไม่พบ targetUid หรือ targetEmail' });
    if (!lookupByEmail && typeof newPassword !== 'string') return res.status(400).json({ error: 'ไม่พบ newPassword' });
    if (newPassword && newPassword.length < 6) return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });

    const caller = await verifyCaller(idToken).catch(() => null);
    if (!caller) return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });

    const row = await adminRowOf(caller);
    if (!row) return res.status(403).json({ error: 'ไม่มีสิทธิ์ดำเนินการ' });
    const callerIsSuperAdmin = row.isSuperAdmin === true;
    if (!callerIsSuperAdmin && row.permissions?.canManagePasswords !== true) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์รีเซ็ตรหัสผ่าน' });
    }

    /* ── lookupByEmail — คืน uid ของอีเมลที่มีบัญชีอยู่แล้ว (+ ตั้งรหัสใหม่ให้) ── */
    if (lookupByEmail && targetEmail) {
      const user = await findAuthUserByEmail(targetEmail);
      if (!user) return res.status(404).json({ error: 'ไม่พบ email นี้ในระบบเข้าสู่ระบบ' });
      if (user.app_metadata?.app_role) return res.status(403).json({ error: 'บัญชีนี้ไม่ใช่บัญชีผู้ดูแล' });
      if (newPassword) {
        const { error } = await sb().auth.admin.updateUserById(user.id, { password: newPassword });
        if (error) throw new Error(error.message);
      }
      return res.status(200).json({ success: true, uid: user.id });
    }

    /* ── ห้าม admin ที่ไม่ใช่ SuperAdmin รีเซ็ตรหัส SuperAdmin ── */
    const target = await getData('admin_users', targetUid);
    if (!target) return res.status(404).json({ error: 'ไม่พบผู้ดูแลคนนี้' });   // จำกัดให้แก้ได้เฉพาะบัญชีผู้ดูแล
    if (target.isSuperAdmin === true && !callerIsSuperAdmin) {
      return res.status(403).json({ error: 'ไม่สามารถรีเซ็ตรหัสผ่านของ SuperAdmin ได้' });
    }

    const { error } = await sb().auth.admin.updateUserById(targetUid, { password: newPassword });
    if (error) {
      if (error.status === 404) return res.status(404).json({ error: 'ยังไม่มีบัญชีเข้าสู่ระบบของผู้ดูแลคนนี้' });
      const weak = /weak|short|at least/i.test(error.message);
      return res.status(weak ? 400 : 500).json({ error: weak ? `รหัสผ่านไม่ผ่านเงื่อนไขของระบบ: ${error.message}` : error.message });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('set-password error:', err);
    return res.status(500).json({ error: err.message || 'เกิดข้อผิดพลาด' });
  }
}
