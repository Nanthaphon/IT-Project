/* สถานะการยืมของคำขออุปกรณ์เสริม (หน้า "คำขออุปกรณ์เสริม")
   คำขอไม่ถูกแก้ตอนรับคืน — จึงดูว่าของยังอยู่กับผู้ยืมไหมจาก assignees ของอุปกรณ์
   givenItems[].checkoutId (อนุมัติตั้งแต่ 11/2026) → จับตรงตัว · คำขอรุ่นก่อนเทียบ ยืม + วันคืน + SN */

const DAY = 864e5;
const endOfDay = (iso) => new Date(iso).setHours(23, 59, 59, 999);

/** เลยกำหนดคืนแล้ว (นับถึงสิ้นวันที่กำหนด — คืนภายในวันนั้นยังไม่เลย) */
export const isPastDue = (iso, now = Date.now()) => !!iso && endOfDay(iso) < now;

/** null = ไม่ใช่คำขอยืมที่อนุมัติแล้ว / หาอุปกรณ์ไม่เจอ
    { returned: true } · { overdue: true, days } · { daysLeft } (0 = ครบกำหนดวันนี้) */
export function borrowState(req, acc, now = Date.now()) {
  if (req?.requestType !== 'borrow' || req.status !== 'อนุมัติแล้ว' || !req.returnDate || !acc) return null;
  const given = req.givenItems || [];
  const ids = given.map((g) => g.checkoutId).filter(Boolean);
  const sns = given.map((g) => g.sn).filter(Boolean);
  const held = (acc.assignees || []).some((a) => (ids.length
    ? ids.includes(a.checkoutId)
    : a.isBorrow && a.returnDate === req.returnDate && (!sns.length || sns.includes(a.serialNumber))));
  if (!held) return { returned: true };
  const end = endOfDay(req.returnDate);
  if (end < now) return { overdue: true, days: Math.floor((now - end) / DAY) + 1 };
  return { daysLeft: Math.floor((end - now) / DAY) };
}
