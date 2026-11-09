import { test } from 'node:test';
import assert from 'node:assert/strict';
import { managerCodeOf, managerLookup } from './managers.js';

const people = [
  { empId: '1010001', fullName: 'สมชาย ใจดี' },
  { empId: '1010002', fullName: 'สมหญิง รักงาน' },
  { empId: '1010003', fullName: 'สมชาย ใจดี' },   // ชื่อซ้ำ
];

test('managerLookup: รหัส (ไม่สนตัวพิมพ์/ช่องว่าง) → ชื่อ', () => {
  const m = managerLookup(people);
  assert.equal(m.get('1010002'), 'สมหญิง รักงาน');
  assert.equal(m.get(' 1010002 '.trim()), 'สมหญิง รักงาน');
  assert.equal(m.get('9999999'), undefined);
});

test('managerCodeOf: managerEmpId ที่ชื่อตรงชนะ (ชื่อซ้ำ) · ไม่มีค่อยหาจากชื่อ', () => {
  assert.equal(managerCodeOf({ manager: 'สมชาย ใจดี', managerEmpId: '1010003' }, people), '1010003');
  assert.equal(managerCodeOf({ manager: 'สมหญิง รักงาน' }, people), '1010002');
  // managerEmpId ค้าง (แก้ชื่อหัวหน้าเป็นคนอื่นทีหลัง) → ใช้ชื่อปัจจุบัน
  assert.equal(managerCodeOf({ manager: 'สมหญิง รักงาน', managerEmpId: '1010001' }, people), '1010002');
  assert.equal(managerCodeOf({ manager: '' }, people), '');
});
