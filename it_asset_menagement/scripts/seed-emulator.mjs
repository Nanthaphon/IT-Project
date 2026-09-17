/* เติมข้อมูลตัวอย่างลง Firebase emulator — ไม่แตะฐานข้อมูลจริง
   ใช้: เปิด `npm run emu` ไว้อีกหน้าต่าง แล้วสั่ง `npm run emu:seed`

   ข้อมูลชุดนี้ครอบทุกเมนู + ทุกสถานะ เพื่อให้ตรวจ UI ได้ครบโดยไม่ต้อง
   พึ่งข้อมูลจริง (ซึ่งทุกครั้งที่โหลด = อ่าน Firestore จริงหลายร้อย docs) */
const PROJECT = 'it-asset-management-dc883';
const FS = '127.0.0.1:8080';
const AUTH = '127.0.0.1:9099';

const base = `http://${FS}/v1/projects/${PROJECT}/databases/(default)/documents`;

/* ── ตรวจว่า emulator เปิดอยู่ไหม ─────────────────────────── */
try {
  const ping = await fetch(`http://${FS}/`);
  if (!ping.ok && ping.status !== 404) throw new Error('status ' + ping.status);
} catch {
  console.error('❌ ไม่พบ Firestore emulator ที่ ' + FS);
  console.error('   เปิดอีกหน้าต่างแล้วสั่ง:  npm run emu');
  process.exit(1);
}

/* ── แปลงค่า JS -> รูปแบบ Firestore REST ──────────────────── */
const val = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(val) } };
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, val(x)])) } };
  return { stringValue: String(v) };
};

const put = async (path, data) => {
  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, val(v)]));
  const r = await fetch(`${base}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
};

/* ── ข้อมูลตัวอย่าง ───────────────────────────────────────── */
const DEPTS = ['Design Experience', 'Recruitment', 'Accounting', 'IT', 'Sales'];
const COMPANIES = ['Globe Syndicate', 'Besthrm'];
const VENDORS = ['JIB Computer', 'Advice', 'Banana IT'];
const POSITIONS = ['Designer', 'Recruiter', 'Accountant', 'IT Support', 'Sales Executive'];
const pick = (a, i) => a[i % a.length];
const d = (y, m, day) => `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const NAMES = [
  'สมชาย ใจดี', 'ณัฐธิดา เพชรแก้ว', 'ธณกร น้อยหมอ', 'พรชนก แก้วเข้ม',
  'สุภาพร สันจิตร', 'ณัฐภพ หนองเหล็ก', 'มณฑิตา กันนิกา', 'ภัชริยา ตุ่ยไชย',
  'ธาริตา ศรีจรัส', 'พรนภา พุทธา', 'วัฒนา มีเย็น', 'มุทิตา ลักษณ์',
];

const employees = NAMES.map((fullName, i) => ({
  id: `emp${i + 1}`,
  empId: `10101${String(i + 1).padStart(2, '0')}`,
  fullName,
  department: pick(DEPTS, i),
  position: pick(POSITIONS, i),
  company: pick(COMPANIES, i),
  status: i === 11 ? 'ลาออก' : 'ทำงานอยู่',
}));

const ASSET_TYPES = ['โน๊ตบุ๊ค', 'คอมพิวเตอร์', 'จอมอนิเตอร์', 'เครื่องพิมพ์', 'ทีวี'];
const ASSET_STATUS = ['พร้อมใช้งาน', 'ถูกใช้งาน', 'ชำรุดเสียหาย', 'สำรอง', 'ตัดจำหน่าย'];
const MODELS = ['Latitude 5440', 'FX504G', 'ProBook 450', 'ThinkPad E14', '64A6500N'];
const BRANDS = ['Dell Latitude 5440', 'ASUS FX504G', 'HP ProBook 450', 'Lenovo ThinkPad E14', 'ทีวี LED 65 นิ้ว'];

const assets = Array.from({ length: 24 }, (_, i) => ({
  id: `asset${i + 1}`,
  assetTag: `GS-${1000 + i}`,
  name: `${pick(BRANDS, i)} #${i + 1}`,
  model: pick(MODELS, i),
  sn: `SN${70000 + i}`,
  type: pick(ASSET_TYPES, i),
  status: pick(ASSET_STATUS, i),
  company: pick(COMPANIES, i),
  vendor: pick(VENDORS, i),
  department: pick(DEPTS, i),
  forDepartment: pick(DEPTS, i),
  assignedTo: i % 3 === 1 ? `emp${(i % 12) + 1}` : '',
  assignedName: i % 3 === 1 ? employees[i % 12].fullName : '',
  cost: 18000 + i * 1500,
  scrapValue: 4000 + i * 200,
  purchaseDate: d(2023 + (i % 3), (i % 12) + 1, 15),
  warrantyDate: d(2026 + (i % 2), (i % 12) + 1, 15),
  note: i % 4 === 0 ? 'เปลี่ยน SSD เป็น 1TB แล้ว' : '',
  documents: [],
  items: [],
}));

const LIC_NAMES = ['Microsoft 365 Business', 'Adobe Acrobat Pro', 'AutoCAD LT', 'Zoom Pro', 'Figma Org'];
const licenses = Array.from({ length: 8 }, (_, i) => ({
  id: `lic${i + 1}`,
  name: `${pick(LIC_NAMES, i)} #${i + 1}`,
  supplier: pick(['Microsoft', 'SoftDebut', 'Autodesk'], i),
  productKey: `KEY-${2000 + i}`,
  totalSeats: 5 + i,
  purchaseDate: d(2024, (i % 12) + 1, 10),
  expirationDate: i % 4 === 3 ? d(2026, 10, 1) : d(2027, (i % 12) + 1, 10),
  cost: 3500 + i * 900,
  seats: [],
}));

const ACC_NAMES = [
  'AUKEY Unity Link PD III Hub', 'Logitech MX Master 3', 'คีย์บอร์ด Keychron K2',
  'หูฟัง Jabra Evolve2', 'Docking Station Dell WD19', 'เมาส์ Logitech M331',
];
const accessories = ACC_NAMES.map((name, i) => ({
  id: `acc${i + 1}`,
  name,
  type: pick(['เมาส์ (Mouse)', 'คีย์บอร์ด (Keyboard)', 'หูฟัง (Headset)', 'อื่นๆ'], i),
  quantity: 3 + i,
  cost: 890 + i * 350,
  vendor: pick(VENDORS, i),
  purchaseDate: d(2024, (i % 12) + 1, 5),
  items: [],
}));

const SUPPLY_NAMES = [
  'กล่องพัสดุ ไซส์ H', 'มีดคัตเตอร์ ใหญ่', 'ปากกาลูกลื่น น้ำเงิน', 'กระดาษ A4 80 แกรม',
  'ลวดเย็บกระดาษ', 'แฟ้มสันกว้าง', 'ถ่านไฟฉาย AA',
];
const officeSupplies = Array.from({ length: 14 }, (_, i) => ({
  id: `sup${i + 1}`,
  name: `${pick(SUPPLY_NAMES, i)} #${i + 1}`,
  type: 'เครื่องเขียน',
  unit: pick(['กล่อง', 'ชิ้น', 'รีม', 'แพ็ค'], i),
  quantity: i % 5 === 0 ? 0 : (i % 7 === 0 ? 4 : 30 + i * 3),
  minQuantity: 10,
  cost: 25 + i * 12,
}));

const STATUS_REPAIR = ['รอดำเนินการ', 'กำลังดำเนินการ', 'ซ่อมเสร็จสิ้น', 'ยกเลิก'];
const repairs = Array.from({ length: 9 }, (_, i) => ({
  id: `rep${i + 1}`,
  empName: employees[i % 12].fullName,
  empId: employees[i % 12].empId,
  department: pick(DEPTS, i),
  deviceType: pick(['โน๊ตบุ๊ค/คอมพิวเตอร์', 'เครื่องพิมพ์', 'อื่นๆ'], i),
  problem: pick(['เปิดไม่ติด', 'จอกระพริบ', 'คีย์บอร์ดค้าง', 'พิมพ์ไม่ออก'], i),
  status: pick(STATUS_REPAIR, i),
  createdAt: d(2026, (i % 9) + 1, 5 + i),
  rating: i % 3 === 0 ? 5 : (i % 3 === 1 ? 4 : 0),
}));

const STATUS_REQ = ['รอดำเนินการ', 'อนุมัติแล้ว', 'ปฏิเสธคำขอ'];
const supplyReq = Array.from({ length: 11 }, (_, i) => ({
  id: `sreq${i + 1}`,
  empName: employees[i % 12].fullName,
  department: pick(DEPTS, i),
  status: pick(STATUS_REQ, i),
  items: [{ name: pick(SUPPLY_NAMES, i), qty: 1 + (i % 4) }],
  createdAt: d(2026, (i % 9) + 1, 3 + i),
}));

const replacementReq = Array.from({ length: 4 }, (_, i) => ({
  id: `rreq${i + 1}`,
  empName: employees[i % 12].fullName,
  department: pick(DEPTS, i),
  reason: pick(['เปิดไม่ติด / ชำรุดหนัก', 'เครื่องช้ามาก', 'ตัวเครื่องบวมจนใช้ไม่ได้'], i),
  status: pick(STATUS_REQ, i),
  photos: [],
  createdAt: d(2026, i + 4, 12),
}));

const accessoryReq = Array.from({ length: 4 }, (_, i) => ({
  id: `areq${i + 1}`,
  empName: employees[i % 12].fullName,
  department: pick(DEPTS, i),
  requestType: pick(['request', 'change', 'borrow'], i),
  status: pick(['รอดำเนินการ', 'อนุมัติแล้ว', 'ปฏิเสธคำขอ', 'คืนแล้ว'], i),
  items: [{ name: 'Logitech MX Master 3', qty: 1 }],
  createdAt: d(2026, i + 5, 8),
}));

/* ── เขียนลง emulator ─────────────────────────────────────── */
const COLLECTIONS = {
  employees,
  assets,
  licenses,
  accessories,
  office_supplies: officeSupplies,
  repair_requests: repairs,
  supply_requests: supplyReq,
  replacement_requests: replacementReq,
  accessory_requests: accessoryReq,
};

let total = 0;
for (const [col, rows] of Object.entries(COLLECTIONS)) {
  for (const row of rows) {
    const { id, ...data } = row;
    await put(`${col}/${id}`, data);
    total++;
  }
  console.log(`  ${col.padEnd(22)} ${rows.length} รายการ`);
}

await put('settings/fieldOptions', {
  assetType: ASSET_TYPES,
  assetStatus: ASSET_STATUS,
  department: DEPTS,
  company: COMPANIES,
  vendor: VENDORS,
  position: POSITIONS,
});
total++;

/* ── บัญชี admin สำหรับ login ในโหมด emulator ──────────────── */
const EMAIL = 'admin@local.test';
const PASSWORD = 'admin1234';
const MENUS = [
  'dashboard', 'assets', 'furniture', 'licenses', 'accessories', 'office_supplies',
  'supply_requests', 'accessory_requests', 'employees', 'repairs', 'replacements',
  'kpi', 'field_options', 'it_report', 'user_management',
];

const signUp = await fetch(
  `http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
  },
);
const account = await signUp.json();

if (account.localId) {
  await put(`admin_users/${account.localId}`, {
    email: EMAIL,
    name: 'Admin (emulator)',
    isSuperAdmin: true,
    menus: MENUS,
    canEdit: true,
    canManagePasswords: true,
  });
  total++;
  console.log('  admin_users            1 บัญชี');
} else {
  console.log('  admin_users            มีอยู่แล้ว (' + (account.error?.message || '?') + ')');
}

console.log(`\n✅ เขียน ${total} documents ลง emulator`);
console.log('\nเข้าระบบฝั่ง IT Admin ด้วย');
console.log(`   อีเมล     ${EMAIL}`);
console.log(`   รหัสผ่าน   ${PASSWORD}`);
console.log('\nเปิดแอปโหมด emulator:   npm run dev:emu');
console.log('ดูข้อมูลใน emulator UI: http://127.0.0.1:4000');
