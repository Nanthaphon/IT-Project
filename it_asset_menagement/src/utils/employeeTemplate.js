/* ── Template นำเข้าพนักงาน (.xlsx 2 sheet) ─────────────────────────────
   sheet "พนักงาน"        — ที่กรอกข้อมูล (หัวคอลัมน์ = ไฟล์ส่งออก CSV · MAP นำเข้าอยู่ที่ employeeImport.js) + แถวตัวอย่าง
   sheet "ข้อมูลอ้างอิง"  — ค่าที่ใช้ได้ (บริษัท / แบรนด์ / แผนก / ตำแหน่ง / คำนำหน้า / สถานะ) ให้ลอกไปใส่ ไม่ต้องเดาตัวสะกด
   sheet "รายชื่อพนักงาน" — รหัส + ชื่อของพนักงานที่มีอยู่ ไว้หา "รหัสหัวหน้า"
   นำเข้าอ่านเฉพาะ sheet "พนักงาน" (ไม่มีชื่อนี้ = sheet แรก) — ดู pickImportSheet
   ไม่ import xlsx ตรง ๆ — รับ XLSX เข้ามา (หน้าเว็บโหลดแบบ dynamic import · เทสต์ส่งของ node) */

export const MAIN_SHEET = 'พนักงาน';
export const REF_SHEET = 'ข้อมูลอ้างอิง';
export const PEOPLE_SHEET = 'รายชื่อพนักงาน';

/* ใช้เมื่อยังไม่ได้ตั้ง "แบรนด์ที่ดูแล" ในตัวเลือกฟิลด์ */
export const DEFAULT_BRANDS = ['Aux', 'Beko', 'Bosch', 'Carrier', 'Haier', 'Hisense', 'Hitachi', 'Osuka', 'Sharp'];

/* คอลัมน์เดียวกับไฟล์ส่งออก CSV (เรียงตามไฟล์ที่ผู้ใช้คลีนแล้ว) — นำเข้าไฟล์ที่ส่งออกกลับได้ทันที
   สถานะ = คำนวณจากวันที่ออก (ใส่ไว้ดูเฉย ๆ) · ชื่อหัวหน้า = ใช้เมื่อไม่มีรหัสหัวหน้า */
export const EMPLOYEE_HEADERS = [
  'บริษัท', 'รหัสพนักงาน', 'คำนำหน้า', 'ชื่อจริง', 'นามสกุล', 'ชื่อ-นามสกุล', 'ชื่อเล่น',
  'ชื่อจริง (EN)', 'นามสกุล (EN)', 'ชื่อภาษาอังกฤษ', 'ตำแหน่ง', 'แผนก', 'M365 Email', 'เบอร์โทร',
  'วันที่เริ่มงาน', 'วันที่ออก', 'แบรนด์ที่ดูแล', 'สถานะ', 'รหัสหัวหน้า', 'ชื่อหัวหน้า',
];

export const NAME_PREFIXES = ['นาย', 'นาง', 'นางสาว', 'Mr.', 'Mrs.', 'Ms.'];
export const EMPLOYEE_STATUSES = ['ทำงานอยู่', 'ออกแล้ว'];

/* แบรนด์ = คอลัมน์เดียว คั่นด้วยจุลภาค เช่น "Haier, Hitachi" · แถวที่ 2 ตั้งวันที่ออกล่วงหน้า */
export function employeeExamples(companies, brands) {
  const b = (...idx) => idx.map((i) => brands[i]).filter(Boolean).join(', ');
  return [
    [companies[0] || 'Globe Syndicate', '10101XX', 'นาย', 'สมชาย', 'ใจดี', 'สมชาย ใจดี', 'ชาย',
      'Somchai', 'Jaidee', 'Somchai Jaidee', 'IT Support', 'IT', 'somchai.j@globesyndicate.co.th', '081-234-5678',
      '2024-01-15', '', b(4, 6, 8), 'ทำงานอยู่', '10101XX', ''],
    [companies[1] || companies[0] || 'Besthrm', '10101XX', 'นางสาว', 'สมหญิง', 'รักงาน', 'สมหญิง รักงาน', 'หญิง',
      'Somying', 'Rakngan', 'Somying Rakngan', 'PC Management Specialist', 'PCMS', 'somying.r@besthrm.co.th', '089-876-5432',
      '2024-02-01', '2027-01-31', b(0), 'ทำงานอยู่', '10101XX', ''],
  ];
}

/** ตารางอ้างอิง: 1 คอลัมน์ต่อ 1 หมวด เรียงลงมา */
export function referenceRows({ companies = [], brands = [], departments = [], positions = [] }) {
  const cols = [['บริษัท', companies], ['แบรนด์ที่ดูแล', brands], ['แผนก', departments], ['ตำแหน่ง', positions],
    ['คำนำหน้า', NAME_PREFIXES], ['สถานะ', EMPLOYEE_STATUSES]];
  const height = Math.max(0, ...cols.map(([, v]) => v.length));
  return [
    cols.map(([h]) => h),
    ...Array.from({ length: height }, (_, i) => cols.map(([, v]) => v[i] ?? '')),
  ];
}

/** รายชื่อพนักงานไว้หารหัสหัวหน้า — เรียงตามรหัส */
export function peopleRows(people = []) {
  return [
    ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'แผนก', 'ตำแหน่ง'],
    ...people.filter((p) => p?.empId)
      .map((p) => [String(p.empId), p.fullName || '', p.nickname || '', p.department || '', p.position || ''])
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })),
  ];
}

export function buildEmployeeTemplate(XLSX, { companies = [], brands = [], departments = [], positions = [], people = [] } = {}) {
  const useBrands = brands.length ? brands : DEFAULT_BRANDS;
  const wb = XLSX.utils.book_new();

  const main = XLSX.utils.aoa_to_sheet([EMPLOYEE_HEADERS, ...employeeExamples(companies, useBrands)]);
  main['!cols'] = EMPLOYEE_HEADERS.map((h) => ({ wch: Math.max(12, h.length + 4) }));
  XLSX.utils.book_append_sheet(wb, main, MAIN_SHEET);

  const ref = XLSX.utils.aoa_to_sheet(referenceRows({ companies, brands: useBrands, departments, positions }));
  ref['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 30 }, { wch: 36 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ref, REF_SHEET);

  const ppl = XLSX.utils.aoa_to_sheet(peopleRows(people));
  ppl['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 12 }, { wch: 30 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, ppl, PEOPLE_SHEET);
  return wb;
}

/** sheet ที่จะนำเข้า: "พนักงาน" ก่อน ไม่มีค่อยใช้ sheet แรก (กันนำเข้าตารางอ้างอิงผิด sheet) */
export const pickImportSheet = (wb) => wb.Sheets[wb.SheetNames.includes(MAIN_SHEET) ? MAIN_SHEET : wb.SheetNames[0]];

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Excel → CSV สำหรับขั้นตอนนำเข้าเดิม (ต้องอ่านไฟล์ด้วย cellDates: true)
    ช่องที่ Excel แปลงเป็นวันที่ (พิมพ์ 2024-01-15 แล้วกลายเป็น 15/1/2024) → คืนเป็น YYYY-MM-DD แบบเดียวกับ template */
export function sheetToCsv(XLSX, ws) {
  Object.keys(ws).forEach((addr) => {
    const c = ws[addr];
    if (addr[0] !== '!' && c?.t === 'd' && c.v instanceof Date && !isNaN(c.v)) ws[addr] = { t: 's', v: ymd(c.v) };
  });
  return XLSX.utils.sheet_to_csv(ws, { blankrows: false });
}
