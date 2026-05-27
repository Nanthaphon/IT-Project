// ════════════════════════════════════════════════════════════════════════
// Cloud Functions — โปรเจ็คนี้ใช้ Vercel functions แทน (อยู่ภายใต้ /api/)
// ไฟล์นี้เหลือเปล่า ๆ ไว้กันการ deploy โดยไม่ได้ตั้งใจ
//
// API endpoints ที่ใช้งานจริง (Vercel):
//   /api/staff-login            — Staff login (รับ empId+password → custom token)
//   /api/set-staff-password     — Admin ตั้ง/รีเซ็ตรหัสผ่านพนักงาน
//   /api/staff-notify           — แจ้งเตือน Teams + email หลัง staff submit
//   /api/cascade-delete         — ลบ orphan data หลังลบ employee/asset/license
//   /api/send-email             — ส่ง email (admin events เช่น license expiry)
//   /api/notify-teams           — proxy ส่งเข้า Teams (deprecated; ใช้ staff-notify แทน)
//   /api/set-password           — Admin reset Firebase auth password
// ════════════════════════════════════════════════════════════════════════
