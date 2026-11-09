import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanCell, normalizePhone, planEmployeeImport, rowToRecord, finalizeRecord, diffEmployee } from './employeeImport.js';
import { EMPLOYEE_HEADERS } from './employeeTemplate.js';

// หัวคอลัมน์ + แถวจากไฟล์จริงที่ผู้ใช้คลีนแล้ว (มีคอลัมน์ว่างต่อท้าย)
const H = [...EMPLOYEE_HEADERS, '', ''];
const row = (o) => H.map((h) => o[h] ?? '');
const chon = row({
  'บริษัท': 'Besthrm', 'รหัสพนักงาน': '1010027', 'คำนำหน้า': 'นางสาว', 'ชื่อจริง': 'วุฑฒิกานต์', 'นามสกุล': 'แสนภักดี',
  'ชื่อ-นามสกุล': 'วุฑฒิกานต์ แสนภักดี', 'ชื่อเล่น': 'Chon', 'ตำแหน่ง': 'ACC/ FN Manager', 'แผนก': 'Accounting and Finance',
  'เบอร์โทร': '087-822-8330', 'วันที่เริ่มงาน': '2/12/2022', 'สถานะ': 'ทำงานอยู่', 'รหัสหัวหน้า': '1010002',
});
const pui = row({
  'บริษัท': 'Besthrm', 'รหัสพนักงาน': '1010093', 'ชื่อจริง': 'จันสุดา', 'นามสกุล': 'พุฒฝอย', 'ตำแหน่ง': 'ACC/FN Officer',
  'เบอร์โทร': '815638752', 'วันที่เริ่มงาน': '17/6/2024', 'วันที่ออก': '2026-12-01', 'แบรนด์ที่ดูแล': 'Sharp, Haier',
  'รหัสหัวหน้า': '1010027',
});
const ceo = row({ 'บริษัท': 'Globe Syndicate', 'รหัสพนักงาน': '1', 'คำนำหน้า': '#N/A', 'ชื่อจริง': 'Mr.Boonchai', 'นามสกุล': 'Putakotirat' });

test('ช่องว่างของ Excel (#N/A) = ว่าง · เบอร์ที่ 0 หน้าหาย = เติม 0', () => {
  assert.equal(cleanCell('#N/A'), '');
  assert.equal(normalizePhone('815638752'), '0815638752');
  assert.equal(normalizePhone('064 054 3349'), '064 054 3349');
  assert.equal(normalizePhone('087-822-8330'), '087-822-8330');
});

test('แถวจากไฟล์จริง → วันที่เป็น YYYY-MM-DD · คำนำหน้า · ไม่มีฟิลด์ชั่วคราวหลุด', () => {
  const { rec } = finalizeRecord(rowToRecord(H, chon), new Map([['1010002', 'พรนภา พุทธาโกฐิรัตน์']]), '2026-11-09');
  assert.equal(rec.startDate, '2022-12-02');
  assert.equal(rec.namePrefix, 'นางสาว');
  assert.equal(rec.manager, 'พรนภา พุทธาโกฐิรัตน์');
  assert.equal(rec.managerEmpId, '1010002');
  assert.ok(!('status' in rec) && !('managerCode' in rec) && !('managerName' in rec));
  const ceoRec = finalizeRecord(rowToRecord(H, ceo)).rec;
  assert.ok(!('namePrefix' in ceoRec));
});

test('สถานะ "ออกแล้ว" แต่ไม่มีวันที่ออก = ออกวันนี้', () => {
  const r = row({ 'รหัสพนักงาน': '9', 'ชื่อจริง': 'ก', 'สถานะ': 'ออกแล้ว' });
  assert.equal(finalizeRecord(rowToRecord(H, r), new Map(), '2026-11-09').rec.resignDate, '2026-11-09');
});

test('ไม่มีรหัสหัวหน้า → ใช้ชื่อหัวหน้าในไฟล์', () => {
  const r = row({ 'รหัสพนักงาน': '9', 'ชื่อจริง': 'ก', 'ชื่อหัวหน้า': 'ธีระวัฒน์ ชูรอด' });
  assert.equal(finalizeRecord(rowToRecord(H, r)).rec.manager, 'ธีระวัฒน์ ชูรอด');
});

test('diffEmployee: เฉพาะช่องที่ไฟล์มีค่าและต่าง · ช่องว่างไม่ลบของเดิม', () => {
  const prev = { fullName: 'ก ข', firstName: 'ก', lastName: 'ข', position: 'เดิม', phone: '081', brands: ['Haier', 'Sharp'] };
  const { patch, changes } = diffEmployee(prev, { firstName: 'ก', lastName: 'ข', fullName: 'ก ข', position: 'ใหม่', brands: 'Haier, Sharp' });
  assert.deepEqual(patch, { position: 'ใหม่' });
  assert.deepEqual(changes, [{ field: 'position', label: 'ตำแหน่ง', from: 'เดิม', to: 'ใหม่' }]);
});

test('diffEmployee: เอกสารเก่ามีแค่ fullName → ไฟล์ที่แยกชื่อแล้วไม่นับว่าเปลี่ยน', () => {
  const { changes } = diffEmployee({ fullName: 'ธาริตา ศรีจรัส' }, { firstName: 'ธาริตา', lastName: 'ศรีจรัส', fullName: 'ธาริตา ศรีจรัส' });
  assert.deepEqual(changes, []);
});

test('planEmployeeImport: รหัสตรง = อัปเดต · ไม่ตรง = เพิ่ม · ไม่เปลี่ยน · ซ้ำในไฟล์ · ลบแล้วก็อัปเดตเอกสารเดิม', () => {
  const existing = [
    { id: 'a', empId: '1010027', fullName: 'วุฑฒิกานต์ แสนภักดี', firstName: 'วุฑฒิกานต์', lastName: 'แสนภักดี', position: 'Manager' },
    { id: 'p', empId: '1010002', fullName: 'พรนภา พุทธาโกฐิรัตน์' },
  ];
  const removed = [{ id: 'z', empId: '1', fullName: 'Mr.Boonchai Putakotirat', firstName: 'Mr.Boonchai', lastName: 'Putakotirat', company: 'Globe Syndicate' }];
  const plan = planEmployeeImport({
    headers: H,
    rows: [{ row: 2, vals: chon }, { row: 3, vals: pui }, { row: 4, vals: ceo }, { row: 5, vals: chon }, { row: 6, vals: H.map(() => '') }],
    existing, removed, today: '2026-11-09',
  });
  assert.equal(plan.updates.length, 1);
  const u = plan.updates[0];
  assert.equal(u.id, 'a');
  assert.ok(u.changes.some((c) => c.field === 'position' && c.from === 'Manager' && c.to === 'ACC/ FN Manager'));
  assert.equal(u.patch.manager, 'พรนภา พุทธาโกฐิรัตน์');
  assert.equal(u.patch.managerEmpId, '1010002');
  assert.equal(plan.creates.length, 1);
  assert.equal(plan.creates[0].rec.empId, '1010093');
  assert.equal(plan.creates[0].rec.manager, 'วุฑฒิกานต์ แสนภักดี');   // หัวหน้าอยู่ในไฟล์เดียวกัน
  assert.deepEqual(plan.creates[0].rec.brands, ['Sharp', 'Haier']);
  assert.equal(plan.unchanged.length, 1);
  assert.equal(plan.unchanged[0].removed, true);
  assert.deepEqual(plan.dupInFile, [{ row: 5, empId: '1010027' }]);
});

test('รหัสหัวหน้าที่หาไม่เจอ → แจ้ง (ยังนำเข้า)', () => {
  const r = row({ 'รหัสพนักงาน': '5', 'ชื่อจริง': 'ข', 'รหัสหัวหน้า': '999' });
  const plan = planEmployeeImport({ headers: H, rows: [{ row: 2, vals: r }] });
  assert.equal(plan.creates.length, 1);
  assert.deepEqual(plan.unknownManagers, [{ row: 2, code: '999' }]);
});
