import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { buildEmployeeTemplate, DEFAULT_BRANDS, EMPLOYEE_HEADERS, MAIN_SHEET, PEOPLE_SHEET, peopleRows, pickImportSheet, REF_SHEET, referenceRows } from './employeeTemplate.js';

const opts = { companies: ['Globe Syndicate', 'Besthrm'], departments: ['IT', 'HR'], positions: ['IT Support'] };

test('2 sheet: กรอกข้อมูล + ข้อมูลอ้างอิง · ไม่ได้ตั้งแบรนด์ = รายการตั้งต้น', () => {
  const wb = buildEmployeeTemplate(XLSX, opts);
  assert.deepEqual(wb.SheetNames, [MAIN_SHEET, REF_SHEET, PEOPLE_SHEET]);
  const ref = XLSX.utils.sheet_to_json(wb.Sheets[REF_SHEET], { header: 1 });
  assert.deepEqual(ref[0], ['บริษัท', 'แบรนด์ที่ดูแล', 'แผนก', 'ตำแหน่ง', 'คำนำหน้า', 'สถานะ']);
  assert.deepEqual(ref.slice(1).map((r) => r[1]).filter(Boolean), DEFAULT_BRANDS);
  assert.deepEqual(ref.slice(1, 3).map((r) => r[0]), ['Globe Syndicate', 'Besthrm']);
});

test('คอลัมน์ตรงไฟล์ที่คลีนแล้ว · แถวตัวอย่างใช้บริษัท/แบรนด์จากรายการจริง · รหัส 10101XX', () => {
  const wb = buildEmployeeTemplate(XLSX, { ...opts, brands: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] });
  const rows = XLSX.utils.sheet_to_json(pickImportSheet(wb), { header: 1, defval: '' });
  assert.deepEqual(rows[0], EMPLOYEE_HEADERS);
  assert.equal(rows[1][0], 'Globe Syndicate');
  assert.equal(rows[2][0], 'Besthrm');
  const col = (h) => rows[0].indexOf(h);
  assert.equal(rows[1][col('รหัสพนักงาน')], '10101XX');
  // แบรนด์ = คอลัมน์เดียว คั่นจุลภาค
  assert.equal(rows[1][col('แบรนด์ที่ดูแล')], 'E, G, I');
  assert.equal(rows[2][col('แบรนด์ที่ดูแล')], 'A');
  assert.equal(rows[2][col('วันที่ออก')], '2027-01-31');
  rows.forEach((r) => assert.equal(r.length, rows[0].length));
});

test('นำเข้าเลือก sheet "พนักงาน" แม้ไม่ได้อยู่ลำดับแรก', () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['x']]), REF_SHEET);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['y']]), MAIN_SHEET);
  assert.equal(XLSX.utils.sheet_to_csv(pickImportSheet(wb)), 'y');
});

test('referenceRows เติมช่องว่างให้คอลัมน์สั้น', () => {
  const rows = referenceRows({ companies: ['A'], brands: ['x', 'y'] });
  assert.deepEqual(rows[0], ['บริษัท', 'แบรนด์ที่ดูแล', 'แผนก', 'ตำแหน่ง', 'คำนำหน้า', 'สถานะ']);
  assert.deepEqual(rows[1].slice(0, 4), ['A', 'x', '', '']);
  assert.deepEqual(rows[2].slice(0, 4), ['', 'y', '', '']);
  assert.equal(rows.length, 7);   // คำนำหน้า 6 ค่ายาวสุด
});

test('sheetToCsv: ช่องที่ Excel แปลงเป็นวันที่ → YYYY-MM-DD', async () => {
  const { sheetToCsv } = await import('./employeeTemplate.js');
  const ws = XLSX.utils.aoa_to_sheet([['รหัส', 'วันที่เริ่มงาน'], [1010911, new Date(2024, 0, 15)]], { cellDates: true });
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'พนักงาน');
  const back = XLSX.read(XLSX.write(wb, { type: 'array', bookType: 'xlsx', cellDates: true }), { type: 'array', cellDates: true });
  assert.equal(sheetToCsv(XLSX, pickImportSheet(back)), 'รหัส,วันที่เริ่มงาน\n1010911,2024-01-15');
});

test('รายชื่อพนักงาน: เรียงตามรหัส ข้ามคนไม่มีรหัส · หัวคอลัมน์รหัสหัวหน้าใน sheet หลัก', () => {
  const rows = peopleRows([{ empId: 1010010, fullName: 'ข' }, { empId: '1010002', fullName: 'ก', nickname: 'เอ' }, { fullName: 'ไม่มีรหัส' }]);
  assert.deepEqual(rows.slice(1).map((r) => r[0]), ['1010002', '1010010']);
  const wb = buildEmployeeTemplate(XLSX, opts);
  const head = XLSX.utils.sheet_to_json(wb.Sheets[MAIN_SHEET], { header: 1 })[0];
  assert.ok(head.includes('รหัสหัวหน้า') && !head.includes('หัวหน้า'));
});
