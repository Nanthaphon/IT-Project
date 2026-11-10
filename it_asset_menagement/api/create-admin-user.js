// Vercel serverless function — สร้างบัญชีเข้าสู่ระบบของผู้ดูแลใหม่ (SuperAdmin only)
// แทน "secondary Firebase app" เดิมในหน้า UserManagementPage — หน้าเว็บเพิ่มแถว admin_users ต่อเอง
// อีเมลมีบัญชีอยู่แล้ว (เคยลบแค่สิทธิ์) → ตั้งรหัสใหม่แล้วใช้บัญชีเดิม
import { preflight, bearer, verifyCaller, adminRowOf, sb, findAuthUserByEmail } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  const caller = await verifyCaller(token).catch(() => null);
  if (!caller) return res.status(401).json({ error: 'Invalid or expired token' });
  const row = await adminRowOf(caller).catch(() => null);
  if (row?.isSuperAdmin !== true) return res.status(403).json({ error: 'ต้องเป็น SuperAdmin เท่านั้น' });

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'รูปแบบ Email ไม่ถูกต้อง' });
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const auth = sb().auth.admin;
    const { data, error } = await auth.createUser({ email, password, email_confirm: true });
    if (!error) return res.status(200).json({ success: true, uid: data.user.id });

    if (error.code === 'email_exists' || /already.*registered|already exists/i.test(error.message)) {
      const user = await findAuthUserByEmail(email);
      if (!user) throw new Error('Email นี้มีบัญชีอยู่แล้ว แต่หาไม่พบ');
      if (user.app_metadata?.app_role) return res.status(409).json({ error: 'Email นี้เป็นบัญชีประเภทอื่น ใช้เป็นผู้ดูแลไม่ได้' });
      const { error: upErr } = await auth.updateUserById(user.id, { password, ban_duration: 'none' });
      if (upErr) throw new Error(upErr.message);
      return res.status(200).json({ success: true, uid: user.id, reused: true });
    }
    const weak = error.code === 'weak_password' || /weak|short|at least/i.test(error.message);
    return res.status(400).json({ error: weak ? `รหัสผ่านไม่ผ่านเงื่อนไขของระบบ: ${error.message}` : error.message });
  } catch (err) {
    console.error('create-admin-user error:', err);
    return res.status(500).json({ error: err.message || 'เกิดข้อผิดพลาด' });
  }
}
