/* ── วันหมดอายุ License สำหรับ IT Monthly Report (สไลด์ "ซอฟต์แวร์ใกล้หมดอายุ") ──
   แยกจาก generateITReport.js เพื่อเทสต์ด้วย node ได้ (ไฟล์นั้น import pptxgenjs) */

export const EXPIRY_WINDOW_DAYS = 90;

const ymd = (d) => {
  const x = new Date(d);
  if (isNaN(x)) return '';
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

/* สถานะจากวันหมดอายุ (คิดสดทุกครั้ง — ผู้ใช้แก้วันที่ได้ สถานะต้องตาม)
   @returns { days, label, tone: 'expired' | 'soon' | 'later' | 'none' } */
export function expiryStatus(expiry, asOf = new Date()) {
  if (!expiry) return { days: null, label: 'ไม่ระบุวันที่', tone: 'none' };
  const d = new Date(expiry); d.setHours(0, 0, 0, 0);
  if (isNaN(d)) return { days: null, label: 'วันที่ไม่ถูกต้อง', tone: 'none' };
  const t = new Date(asOf); t.setHours(0, 0, 0, 0);
  const days = Math.round((d - t) / 86400000);
  if (days < 0)   return { days, label: `หมดอายุแล้ว ${-days} วัน`, tone: 'expired' };
  if (days === 0) return { days, label: 'หมดอายุวันนี้', tone: 'expired' };
  return { days, label: `อีก ${days} วัน`, tone: days <= 30 ? 'soon' : 'later' };
}

/* วันหมดอายุของสิทธิ์ทุกใบ — สิทธิ์ที่ไม่ได้ตั้งวันเอง ใช้วันของ License (ตรงกับ "ตามสัญญาหลัก" ใน SeatTable)
   สิทธิ์ว่างนับเฉพาะ N ช่องแรก (N = จำนวนที่ว่างจริง) — ข้อมูลรุ่นก่อนตอนจ่ายสิทธิ์ไม่ได้ตัดวันของช่องที่จ่ายออก
   วันเก่าจึงค้างท้ายอาร์เรย์ (เดิมสไลด์นี้นับหมด → License ที่ต่ออายุแล้วขึ้น "หมดอายุแล้ว 84 วัน"
   ทั้งที่หน้ารายการ / สไลด์สรุปซอฟต์แวร์ไม่ขึ้น เพราะสองที่นั้นตัดแล้ว) */
function seatDates(lic) {
  const main = ymd(lic.expirationDate);
  const assignees = lic.assignees || [];
  const free = Math.max(0, Number(lic.quantity ?? 1) - assignees.length);
  const avail = lic.availableSeatExpirationDates || [];
  const seats = [
    ...assignees.map((a) => ({ date: ymd(a.seatExpirationDate) || main, inUse: true })),
    ...Array.from({ length: free }, (_, i) => ({ date: ymd(avail[i]) || main, inUse: false })),
  ];
  // ไม่มีสิทธิ์ให้นับ (จำนวน 0) แต่มีวันหลัก → ยังนับวันหลัก (ไม่มีคนใช้)
  if (seats.length === 0 && main) seats.push({ date: main, inUse: false });
  return seats.filter((s) => s.date);
}

/* ซอฟต์แวร์ที่ต้องต่ออายุ/ตัดสินใจเร็ว ๆ นี้ (ใช้ร่วม PPTX + Preview + หน้ากรอก)
   ต่อ License หยิบวันที่ใกล้สุดที่ "ต้องสนใจ" 1 วัน
   - หมดในอีก ≤ 90 วัน → แสดง
   - หมดไปแล้ว แต่สิทธิ์ใบนั้นยังมีคนใช้ → แสดง (ด่วน)
   - หมดไปแล้วและไม่มีคนใช้ → ถือว่าเลิกใช้ ไม่แสดง
   seats = จำนวนสิทธิ์ที่หมดในวันนั้น
   @returns [{ name, expiry: 'YYYY-MM-DD', seats, note }] เรียงวันใกล้สุดก่อน */
export function getExpirySummary(licenses = [], asOf = new Date(), windowDays = EXPIRY_WINDOW_DAYS) {
  const out = [];
  (licenses || []).forEach((lic) => {
    const watch = seatDates(lic).filter((s) => {
      const { days } = expiryStatus(s.date, asOf);
      if (days == null) return false;
      return days < 0 ? s.inUse : days <= windowDays;
    });
    if (watch.length === 0) return;
    const pick = watch.map((s) => s.date).sort()[0];
    out.push({ name: lic.name || '–', expiry: pick, seats: watch.filter((s) => s.date === pick).length, note: '' });
  });
  return out.sort((a, b) => a.expiry.localeCompare(b.expiry));
}
