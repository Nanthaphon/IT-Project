/* ── collection ไหนต้องโหลดตอนไหน ────────────────────────────────

   เดิม useFirebaseData ผูก listener ครอบทั้ง collection 15 ตัวพร้อมกัน
   ทันทีที่ล็อกอิน เปิดแอป 1 ครั้ง = อ่านหลายร้อย docs ทั้งที่แต่ละเมนู
   ใช้จริงแค่ 2-3 ก้อน แพลนฟรีให้ 50,000 reads/วัน จึงชนเพดานจนล็อกอิน
   ไม่ได้ทั้งระบบ (เกิดมาแล้วจริง: 8 RESOURCE_EXHAUSTED)

   ALWAYS      ก้อนที่ต้องมีทุกหน้า เพราะ sidebar/กระดิ่งนับเลขค้างจากมันตรง ๆ
   MENU_NEEDS  ก้อนเพิ่มของแต่ละเมนู
   หน้ารายละเอียด (ประวัติ/ไทม์ไลน์) ไม่ต้องมีรายการแยก เพราะทุกเส้นทางที่เปิด
   รายละเอียดสลับเมนูไปที่ assets/accessories/licenses/employees ก่อนเสมอ

   subscribe แล้วไม่ถอด — กลับมาเมนูเดิมจึงไม่เสีย read ซ้ำ
   กรณีแย่สุด (ไล่เข้าครบทุกเมนู) เท่าของเดิม ไม่แย่กว่า                  */

export const ALWAYS = [
  'employees',            // ใช้ lookup ชื่อแทบทุกหน้า
  'fieldOptions',         // doc เดียว
  'licenses',             // ป้าย "ใกล้หมดอายุ" บน sidebar
  'repair_requests',      // ป้าย "รอดำเนินการ"
  'supply_requests',
  'replacement_requests',
  'accessory_requests',
];

const TX = ['accessories_transactions', 'assets_transactions', 'licenses_transactions'];

export const MENU_NEEDS = {
  dashboard:            ['assets', 'accessories'],
  assets:               ['assets', ...TX],
  furniture:            ['assets', ...TX],
  licenses:             ['assets', ...TX],
  accessories:          ['accessories', ...TX],
  office_supplies:      ['office_supplies'],
  supply_requests:      ['office_supplies'],
  accessory_requests:   ['accessories'],
  employees:            ['assets', 'accessories', 'deleted_employees', 'bundled_items', ...TX],
  repairs:              ['assets'],
  replacement_requests: ['assets'],
  kpi_dashboard:        [],
  field_options:        [],
  it_report:            ['assets', 'accessories'],
  users:                [],
};

/* collection ที่อ่านได้เฉพาะ admin (ตาม firestore.rules) */
const ADMIN_ONLY = new Set(['deleted_employees', ...TX]);

/* ฝั่งพนักงาน (StaffView) เป็นหน้าเดียวจบ ไม่มีเมนูให้สลับ
   จึงใช้รายการตายตัวตามที่ StaffView รับเข้าไปจริง ไม่อิง activeMenu */
const STAFF_NEEDS = ['assets', 'accessories', 'office_supplies'];

/**
 * รายชื่อ collection ที่ต้อง subscribe สำหรับสถานะปัจจุบัน
 * pure — เทสต์ได้โดยไม่ต้องต่อ Firestore
 *
 * @param {string}      menu       เมนูที่เปิดอยู่ (ใช้เฉพาะ admin/hr)
 * @param {string|null} opts.role  admin / hr / staff
 * @returns {Set<string>}
 */
export function planCollections(menu, { role = null } = {}) {
  const want = new Set(ALWAYS);
  if (role === 'staff') {
    STAFF_NEEDS.forEach((k) => want.add(k));
  } else {
    (MENU_NEEDS[menu] || []).forEach((k) => want.add(k));
  }
  if (role !== 'admin') ADMIN_ONLY.forEach((k) => want.delete(k));
  return want;
}
