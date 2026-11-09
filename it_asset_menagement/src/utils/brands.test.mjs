import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brandCsvHeaders, collectImportedBrands, toBrands } from './brands.js';

test('หัวคอลัมน์ template', () => {
  assert.deepEqual(brandCsvHeaders(), ['แบรนด์ 1', 'แบรนด์ 2', 'แบรนด์ 3', 'แบรนด์ 4', 'แบรนด์ 5']);
});

test('นำเข้าแบบแยกคอลัมน์ — ข้ามช่องว่าง เรียงตามเลขคอลัมน์ ลบฟิลด์ชั่วคราว', () => {
  const rec = collectImportedBrands({ empId: '1', brand2: 'Hitachi', brand1: 'Haier', brand3: '', brand10: 'LG' });
  assert.deepEqual(rec, { empId: '1', brands: ['Haier', 'Hitachi', 'LG'] });
});

test('ไฟล์รุ่นก่อน (คอลัมน์เดียวคั่นจุลภาค) + ไม่ซ้ำ', () => {
  assert.deepEqual(collectImportedBrands({ brands: 'Haier, Samsung', brand1: 'Haier' }).brands, ['Haier', 'Samsung']);
});

test('ไม่มีแบรนด์เลย → ไม่ใส่ฟิลด์ brands', () => {
  assert.deepEqual(collectImportedBrands({ empId: '2', brand1: '', brand2: '' }), { empId: '2' });
});

test('toBrands รับได้ทั้งอาร์เรย์และข้อความ', () => {
  assert.deepEqual(toBrands(['A', ' B ']), ['A', 'B']);
  assert.deepEqual(toBrands('A,,B'), ['A', 'B']);
});
