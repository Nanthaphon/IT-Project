import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMP_ACTIVE, EMP_LEFT, empStatus, isResignedByDate, normalizeDate, upcomingResignDate } from './employeeStatus.js';

test('normalizeDate: ISO · วัน/เดือน/ปี · พ.ศ. · อ่านไม่ออกคืนค่าเดิม', () => {
  assert.equal(normalizeDate('2026-09-01'), '2026-09-01');
  assert.equal(normalizeDate('2026-9-1'), '2026-09-01');
  assert.equal(normalizeDate('2/12/2022'), '2022-12-02');
  assert.equal(normalizeDate('17/6/2024'), '2024-06-17');
  assert.equal(normalizeDate('9/11/2569'), '2026-11-09');
  assert.equal(normalizeDate('31/2/2024'), '31/2/2024');
  assert.equal(normalizeDate('ไม่ทราบ'), 'ไม่ทราบ');
  assert.equal(normalizeDate(''), '');
});

test('ตั้งวันที่ออกล่วงหน้า: ก่อนวัน = ทำงานอยู่ · ถึงวัน/เลยวัน = ออกแล้ว', () => {
  const emp = { resignDate: '2026-11-09' };
  assert.equal(empStatus(emp, { today: '2026-11-08' }), EMP_ACTIVE);
  assert.equal(empStatus(emp, { today: '2026-11-09' }), EMP_LEFT);
  assert.equal(empStatus(emp, { today: '2026-12-01' }), EMP_LEFT);
  assert.equal(upcomingResignDate(emp, '2026-11-08'), '2026-11-09');
  assert.equal(upcomingResignDate(emp, '2026-11-09'), '');
});

test('ลบแล้ว = ออกแล้วเสมอ · ไม่มีวันที่ = ทำงานอยู่', () => {
  assert.equal(empStatus({}, { removed: true }), EMP_LEFT);
  assert.equal(empStatus({}), EMP_ACTIVE);
  assert.equal(isResignedByDate({ resignDate: '9/11/2026' }, '2026-11-09'), true);
});
