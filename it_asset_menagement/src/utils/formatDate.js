/**
 * Unified date formatters — บังคับ DD/MM/YYYY (ปี ค.ศ.)
 * เลี่ยงการใช้ toLocaleDateString แบบไม่ระบุ option เพราะ
 * แต่ละ browser/OS อาจสลับเป็น MM/DD/YYYY ได้ (โดยเฉพาะ Windows-EN)
 */

const pad2 = (n) => String(n).padStart(2, '0');
const toBE = (year) => year + 543;

const toDate = (val) => {
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return null;
    // "DD/MM/YYYY" (ค่าที่ระบบเก็บเป็นสตริงแสดงผล) — parse เอง กัน browser สลับ MM/DD
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      let year = Number(m[3]);
      if (year >= 2400) year -= 543;   // เผื่อค่าเก่าที่เก็บเป็น พ.ศ.
      const dt = new Date(year, Number(m[2]) - 1, Number(m[1]));
      return isNaN(dt.getTime()) ? null : dt;
    }
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
};

/* "17/06/2026" — สำหรับใช้ทั่วระบบ (วัน/เดือน/ปี ค.ศ.) */
export function formatDateShort(value) {
  const d = toDate(value);
  if (!d) return '-';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/* "17/06/2026 14:32" — สำหรับ history/log */
export function formatDateTimeShort(value) {
  const d = toDate(value);
  if (!d) return '-';
  return `${formatDateShort(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/* "17 มิ.ย. 2569" — สำหรับใช้ใน UI ที่ต้องการอ่านง่าย */
const TH_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
export function formatDateMedium(value) {
  const d = toDate(value);
  if (!d || isNaN(d.getTime())) return '-';
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]} ${toBE(d.getFullYear())}`;
}

/* "17 มิถุนายน 2569" — แบบเต็ม */
const TH_MONTHS_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
export function formatDateLong(value) {
  const d = toDate(value);
  if (!d || isNaN(d.getTime())) return '-';
  return `${d.getDate()} ${TH_MONTHS_FULL[d.getMonth()]} ${toBE(d.getFullYear())}`;
}
