// Retired: knowing an employee ID and email is not proof of account ownership.
// First use now goes through staff-login and a restricted password-change session.
import { preflight } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (preflight(req, res, { auth: false })) return;
  return res.status(410).json({ error: 'กรุณาเข้าสู่ระบบด้วยรหัสเริ่มต้นแล้วตั้งรหัสผ่านส่วนตัว หากเข้าไม่ได้ให้ติดต่อ IT' });
}
