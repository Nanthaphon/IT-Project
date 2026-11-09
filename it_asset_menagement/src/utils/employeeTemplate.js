/* ── Template นำเข้าพนักงาน (.xlsx 2 sheet) ─────────────────────────────
   sheet "พนักงาน"        — ที่กรอกข้อมูล (หัวคอลัมน์ตรงกับ MAP นำเข้าใน App.jsx) + แถวตัวอย่าง
   sheet "ข้อมูลอ้างอิง"  — ค่าที่ใช้ได้ (บริษัท / แบรนด์ / แผนก / ตำแหน่ง) ให้ลอกไปใส่ ไม่ต้องเดาตัวสะกด
   sheet "รายชื่อพนักงาน" — รหัส + ชื่อของพนักงานที่มีอยู่ ไว้หา "รหัสหัวหน้า"
   นำเข้าอ่านเฉพาะ sheet "พนักงาน" (ไม่มีชื่อนี้ = sheet แรก) — ดู pickImportSheet
   ไม่ import xlsx ตรง ๆ — รับ XLSX เข้ามา (หน้าเว็บโหลดแบบ dynamic import · เทสต์ส่งของ node) */

export const MAIN_SHEET = 'พนักงาน';
export const REF_SHEET = 'ข้อมูลอ้างอิง';
export const PEOPLE_SHEET = 'รายชื่อพนักงาน';

/* ใช้เมื่อยังไม่ได้ตั้ง "แบรนด์ที่ดูแล" ในตัวเลือกฟิลด์ */
export const DEFAULT_BRANDS = ['Aux', 'Beko', 'Bosch', 'Carrier', 'Haier', 'Hisense', 'Hitachi', 'Osuka', 'Sharp'];

export const EMPLOYEE_HEADERS = [
  'บริษัท', 'ชื่อจริง', 'นามสกุล', 'ตำแหน่ง', 'M365 Email', 'เบอร์โทร',
  'ชื่อเล่น', 'รหัสพนักงาน', 'แผนก', 'รหัสหัวหน้า', 'ชื่อจริง (EN)', 'นามสกุล (EN)',
  'วันที่เริ่มงาน', 'M365 Password', 'แบรนด์ที่ดูแล',
];

/* แบรนด์ = คอลัมน์เดียว คั่นด้วยจุลภาค เช่น "Haier, Hitachi" */
export function employeeExamples(companies, brands) {
  const b = (...idx) => idx.map((i) => brands[i]).filter(Boolean).join(', ');
  return [
    [companies[0] || 'Globe Syndicate', 'ตัวอย่าง', 'ทดสอบ', 'IT Support', 'sample@globesyndicate.co.th', '081-234-5678',
      'ทอม', '10101XX', 'IT', '', 'Sample', 'Test', '2024-01-15', '', b(4, 6, 8)],
    [companies[1] || companies[0] || 'Besthrm', 'ตัวอย่างสอง', 'ทดสอบ', 'PC', 'sample2@besthrm.co.th', '089-876-5432',
      'บี', '10101XX', 'Operation', '10101XX', 'Sample', 'Two', '2024-02-01', '', b(0)],
  ];
}

/** ตารางอ้างอิง: 1 คอลัมน์ต่อ 1 หมวด เรียงลงมา */
export function referenceRows({ companies = [], brands = [], departments = [], positions = [] }) {
  const cols = [['บริษัท', companies], ['แบรนด์ที่ดูแล', brands], ['แผนก', departments], ['ตำแหน่ง', positions]];
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
  ref['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 30 }, { wch: 36 }];
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
