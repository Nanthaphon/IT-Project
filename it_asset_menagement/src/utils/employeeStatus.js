/* สถานะพนักงาน — คำนวณ ไม่ได้เก็บ
   ออกแล้ว = ถูกลบ (ย้ายไป deleted_employees) หรือ "วันที่ออก" (resignDate) มาถึงแล้ว
   ตั้งวันที่ออกล่วงหน้าได้: ก่อนถึงวันยังเป็น "ทำงานอยู่" · ถึงวันนั้น/เลยไป = "ออกแล้ว" เอง ไม่ต้องมีใครกด */

export const EMP_ACTIVE = 'ทำงานอยู่';
export const EMP_LEFT = 'ออกแล้ว';

const pad2 = (n) => String(n).padStart(2, '0');
export const ymdOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** วันนี้ตามเวลาเครื่อง (YYYY-MM-DD) */
export const todayYmd = (now = new Date()) => ymdOf(now);

/** วันที่จากไฟล์/ฟอร์ม → YYYY-MM-DD
    รับ 2026-09-01 · 2/12/2022 (วัน/เดือน/ปี แบบไทย) · ปี พ.ศ. (>2400 ลบ 543) · ปี 2 หลัก
    อ่านไม่ออก = คืนค่าเดิม (ไม่ทิ้งข้อมูล) */
export function normalizeDate(v) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  let y; let m; let d;
  let mt = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T ].*)?$/);
  if (mt) { [, y, m, d] = mt.map(Number); }
  else {
    mt = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (!mt) return s;
    [, d, m, y] = mt.map(Number);
    if (y < 100) y += 2000;
  }
  if (y > 2400) y -= 543;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return s;
  return ymdOf(dt);
}

const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** วันที่ออกที่อ่านได้ (YYYY-MM-DD) หรือ '' */
export const resignDateOf = (emp) => {
  const d = normalizeDate(emp?.resignDate);
  return isYmd(d) ? d : '';
};

/** ถึงวันที่ออกแล้วหรือยัง (วันนั้นเองนับว่าออกแล้ว) */
export const isResignedByDate = (emp, today = todayYmd()) => {
  const d = resignDateOf(emp);
  return !!d && d <= today;
};

/** วันที่ออกที่ยังมาไม่ถึง (ไว้ขึ้นป้าย "จะออก ...") หรือ '' */
export const upcomingResignDate = (emp, today = todayYmd()) => {
  const d = resignDateOf(emp);
  return d && d > today ? d : '';
};

/** สถานะที่แสดง/กรอง/ส่งออก · removed = อยู่ใน deleted_employees */
export const empStatus = (emp, { removed = false, today = todayYmd() } = {}) =>
  (removed || isResignedByDate(emp, today) ? EMP_LEFT : EMP_ACTIVE);
