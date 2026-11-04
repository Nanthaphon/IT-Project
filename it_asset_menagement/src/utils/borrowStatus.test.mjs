import { test } from 'node:test';
import assert from 'node:assert/strict';
import { borrowState, isPastDue } from './borrowStatus.js';

const now = new Date(2026, 10, 4, 10, 0).getTime();   // 4 พ.ย. 2026 10:00
const req = (extra = {}) => ({ requestType: 'borrow', status: 'อนุมัติแล้ว', returnDate: '2026-10-31', ...extra });

test('isPastDue — วันที่กำหนดยังไม่นับว่าเลย', () => {
  assert.equal(isPastDue('2026-11-04', now), false);
  assert.equal(isPastDue('2026-11-03', now), true);
  assert.equal(isPastDue('', now), false);
});

test('ยังถืออยู่ + เลยกำหนด → overdue พร้อมจำนวนวัน', () => {
  const acc = { assignees: [{ checkoutId: 'c1', isBorrow: true, returnDate: '2026-10-31' }] };
  assert.deepEqual(borrowState(req({ givenItems: [{ sn: '', checkoutId: 'c1' }] }), acc, now), { overdue: true, days: 4 });
});

test('คืนแล้ว (ไม่อยู่ใน assignees) → returned ไม่เตือน', () => {
  const acc = { assignees: [{ checkoutId: 'other', isBorrow: true, returnDate: '2026-10-31' }] };
  assert.deepEqual(borrowState(req({ givenItems: [{ checkoutId: 'c1' }] }), acc, now), { returned: true });
});

test('คำขอรุ่นเก่า (ไม่มี checkoutId) เทียบด้วย SN + วันคืน', () => {
  const acc = { assignees: [{ isBorrow: true, returnDate: '2026-10-20', serialNumber: 'M0002' }] };
  assert.equal(borrowState(req({ returnDate: '2026-10-20', givenItems: [{ sn: 'M0002' }] }), acc, now).overdue, true);
  assert.equal(borrowState(req({ returnDate: '2026-10-20', givenItems: [{ sn: 'M0009' }] }), acc, now).returned, true);
});

test('ยังไม่ถึงกำหนด / ไม่ใช่ยืม / ยังไม่อนุมัติ', () => {
  const acc = { assignees: [{ checkoutId: 'c1' }] };
  assert.deepEqual(borrowState(req({ returnDate: '2026-11-04', givenItems: [{ checkoutId: 'c1' }] }), acc, now), { daysLeft: 0 });
  assert.equal(borrowState(req({ requestType: 'new' }), acc, now), null);
  assert.equal(borrowState(req({ status: 'รอดำเนินการ' }), acc, now), null);
  assert.equal(borrowState(req(), undefined, now), null);
});
