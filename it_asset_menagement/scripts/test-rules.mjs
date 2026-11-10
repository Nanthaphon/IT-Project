/* ทดสอบ firestore.rules กับ emulator — เน้นสิทธิ์ staff / รหัส M365
   ใช้: npm run emu (อีกหน้าต่าง) → npm run emu:seed → node scripts/test-rules.mjs

   ใช้ token แบบไม่เซ็น (alg: none) ซึ่ง Firestore emulator ยอมรับ — จำลอง staff
   ที่ login ผ่าน custom token (claim role/empId/empDocId) และ admin ใน admin_users */
const PROJECT = 'it-asset-management-dc883';
const FS = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const base = `http://${FS}/v1/projects/${PROJECT}/databases/(default)/documents`;

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (uid, claims = {}) => {
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
    iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT,
    sub: uid, user_id: uid, iat: now, exp: now + 3600, auth_time: now,
    firebase: { sign_in_provider: 'custom', identities: {} }, ...claims,
  })}.`;
};

const val = (v) => (typeof v === 'string' ? { stringValue: v } : { timestampValue: v.toISOString() });
const fields = (o) => ({ fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, val(v)])) });

async function call(tok, method, path, body, query = '') {
  const r = await fetch(`${base}/${path}${query}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.status;
}
const get = (tok, path) => call(tok, 'GET', path);
const patch = (tok, path, data) => call(tok, 'PATCH', path, fields(data),
  '?' + Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&'));
const create = (tok, col, id, data) => call(tok, 'POST', col, fields(data), `?documentId=${id}`);

/* ── หา admin uid จาก seed ── */
const list = await fetch(`${base}/admin_users`, { headers: { Authorization: 'Bearer owner' } }).then(r => r.json());
const adminUid = list.documents?.[0]?.name.split('/').pop();
if (!adminUid) { console.error('❌ ไม่พบ admin_users — รัน npm run emu:seed ก่อน'); process.exit(1); }

const staff2 = token('staff_emp2', { role: 'staff', empId: '1010102', empDocId: 'emp2' });
const admin = token(adminUid, { email: 'admin@local.test' });
const stranger = token('random-signup-user', { email: 'x@example.com' });  // สมัครเองผ่าน Auth
const now = new Date();
const rid = () => 'test' + Math.random().toString(36).slice(2, 8);

const cases = [
  // staff — รหัส M365
  ['staff อ่านรหัส M365 ของตัวเอง',          true,  () => get(staff2, 'employee_secrets/emp2')],
  ['staff อ่านรหัส M365 ของคนอื่น',           false, () => get(staff2, 'employee_secrets/emp1')],
  ['staff แก้รหัส M365 ของตัวเอง',            true,  () => patch(staff2, 'employee_secrets/emp2', { m365Password: 'new-pass', updatedAt: now })],
  ['staff แก้รหัส M365 ของคนอื่น',            false, () => patch(staff2, 'employee_secrets/emp1', { m365Password: 'hacked' })],
  ['staff ใส่ฟิลด์อื่นใน secrets',             false, () => patch(staff2, 'employee_secrets/emp2', { note: 'x' })],
  // staff — ข้อมูลพนักงาน
  ['staff แก้เบอร์โทรของตัวเอง',              true,  () => patch(staff2, 'employees/emp2', { phone: '0800000000' })],
  ['staff แก้เบอร์โทรของคนอื่น',              false, () => patch(staff2, 'employees/emp1', { phone: '0800000000' })],
  ['staff เขียน m365Password ลง employees',    false, () => patch(staff2, 'employees/emp2', { m365Password: 'x' })],
  ['staff อ่านรายชื่อพนักงาน (ยังต้องได้)',     true,  () => get(staff2, 'employees/emp1')],
  // staff — คำขอ
  ['staff แจ้งซ่อมในชื่อตัวเอง',              true,  () => create(staff2, 'repair_requests', rid(), { empId: '1010102', empName: 'ทดสอบ' })],
  ['staff แจ้งซ่อมในชื่อคนอื่น',              false, () => create(staff2, 'repair_requests', rid(), { empId: '1010101', empName: 'ทดสอบ' })],
  // admin
  ['admin อ่านรหัส M365 ของทุกคน',            true,  () => get(admin, 'employee_secrets/emp3')],
  ['admin แก้รหัส M365',                      true,  () => patch(admin, 'employee_secrets/emp3', { m365Password: 'by-admin' })],
  ['admin สร้างพนักงานโดยไม่มีรหัสในเอกสาร',   true,  () => create(admin, 'employees', rid(), { empId: 'T1', fullName: 'ทดสอบ' })],
  ['admin สร้างพนักงานพร้อม m365Password',     false, () => create(admin, 'employees', rid(), { empId: 'T2', m365Password: 'x' })],
  // ไฟล์แนบใหญ่ที่แบ่งเป็นชิ้น (subcollection chunks) — เดิมตกกฎปฏิเสธทั้งหมด ไฟล์ใหญ่บันทึกไม่ได้
  ['admin บันทึกชิ้นไฟล์แนบประวัติถือครอง',     true,  () => create(admin, 'transaction_attachments/ta1/chunks', rid(), { data: 'AAAA' })],
  ['admin บันทึกชิ้นเอกสารการซื้อ',            true,  () => create(admin, 'asset_purchase_docs/pd1/chunks', rid(), { data: 'AAAA' })],
  ['admin อ่านชิ้นเอกสารการซื้อ',              true,  () => get(admin, 'asset_purchase_docs/pd1/chunks')],
  ['staff บันทึกชิ้นไฟล์แนบ',                  false, () => create(staff2, 'transaction_attachments/ta1/chunks', rid(), { data: 'AAAA' })],
  ['staff อ่านชิ้นเอกสารการซื้อ',              false, () => get(staff2, 'asset_purchase_docs/pd1/chunks')],
  // คนนอก / ไม่ login
  ['บัญชีที่สมัครเอง อ่านรหัส M365',           false, () => get(stranger, 'employee_secrets/emp1')],
  ['ไม่ login อ่านรหัส M365',                 false, () => get(null, 'employee_secrets/emp1')],
  ['ไม่ login อ่านพนักงาน',                   false, () => get(null, 'employees/emp1')],
];

let fail = 0;
for (const [name, expectAllow, run] of cases) {
  const status = await run();
  const allowed = status === 200;
  const ok = allowed === expectAllow;
  if (!ok) fail++;
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(40)} ${expectAllow ? 'ต้องได้' : 'ต้องถูกปฏิเสธ'} (HTTP ${status})`);
}
console.log(fail ? `\n❌ ไม่ผ่าน ${fail}/${cases.length}` : `\n✅ ผ่านทั้งหมด ${cases.length} ข้อ`);
process.exit(fail ? 1 : 0);
