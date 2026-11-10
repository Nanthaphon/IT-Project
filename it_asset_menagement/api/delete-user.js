// Vercel serverless function — ลบบัญชีเข้าสู่ระบบ (Supabase Auth) ของผู้ดูแล (SuperAdmin only)
// หน้าเว็บลบแถว admin_users ต่อเอง
import { preflight, bearer, verifyCaller, adminRowOf, sb } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  const caller = await verifyCaller(token).catch(() => null);
  if (!caller) return res.status(401).json({ error: 'Invalid or expired token' });

  // ต้องเป็น SuperAdmin เท่านั้น
  const row = await adminRowOf(caller).catch(() => null);
  if (row?.isSuperAdmin !== true) return res.status(403).json({ error: 'ต้องเป็น SuperAdmin เท่านั้น' });

  const { targetUid } = req.body || {};
  if (!targetUid) return res.status(400).json({ error: 'targetUid required' });
  if (targetUid === caller.uid) return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' });

  try {
    const { error } = await sb().auth.admin.deleteUser(targetUid);
    if (error) {
      // ไม่มีบัญชีแล้ว (หรือ id ไม่ใช่ uid ของ Supabase เช่น uid เก่าของ Firebase) ถือว่า ok
      if (error.status === 404 || /not.?found|invalid.*uuid|User not allowed/i.test(error.message)) {
        return res.status(200).json({ success: true, note: 'auth account already deleted' });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
