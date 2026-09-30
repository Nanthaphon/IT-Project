/* ── ตัวกรอง ปี / เดือน / วัน ของหน้าคิวงาน (แจ้งซ่อม · คำขอเบิกอุปกรณ์) ──
   ตรงกับเงื่อนไขที่ App.jsx ใช้กรองรายการ — ใช้ร่วมกันเพื่อให้ตัวเลขสรุป
   (การ์ดสถิติ + ตัวเลขบนแท็บ) นับจากชุดเดียวกับรายการที่เห็น
   เดิมตัวเลขนับจากข้อมูลทั้งหมด เลือกเดือนแล้วรายการเหลือ 11 แต่แท็บยังบอก 31

   ค่า 'ทั้งหมด' = ไม่กรอง · รายการที่ไม่มี timestamp ผ่านเสมอ (เหมือนเดิม) */
const ALL = 'ทั้งหมด';

export function matchesDate(timestamp, year, month, day) {
  if (!timestamp) return true;
  const d = new Date(timestamp);
  if (year  !== ALL && String(d.getFullYear()) !== year) return false;
  if (month !== ALL && String(d.getMonth() + 1).padStart(2, '0') !== month) return false;
  if (day   !== ALL && String(d.getDate()).padStart(2, '0') !== day) return false;
  return true;
}

export const filterByDate = (list = [], year, month, day) =>
  list.filter((r) => matchesDate(r.timestamp, year, month, day));
