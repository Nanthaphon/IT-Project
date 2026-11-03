import { test } from 'node:test';
import assert from 'node:assert/strict';
import { takeSeat, returnSeats, removeAvailableSeats, availableArrays } from './licenseSeats.js';

const lic = (over = {}) => ({
  quantity: 3, assignees: [],
  availableKeys: ['', '', ''],
  availableSeatLabels: ['test1', 'test2', 'test3'],
  availableSeatNotes: ['n1', 'n2', 'n3'],
  availableSeatDocs: { 1: [{ name: 'b.pdf' }] },
  ...over,
});

test('จ่ายสิทธิ์: ชื่อ/หมายเหตุ/เอกสารตามผู้ถือไป ตัวที่เหลือไม่สลับตำแหน่ง', () => {
  const { seat, patch } = takeSeat(lic(), 1);
  assert.equal(seat.seatLabel, 'test2');
  assert.equal(seat.seatNote, 'n2');
  assert.deepEqual(seat.seatDocuments, [{ name: 'b.pdf' }]);
  assert.deepEqual(patch.availableSeatLabels, ['test1', 'test3']);
  assert.deepEqual(patch.availableSeatNotes, ['n1', 'n3']);
  assert.deepEqual(patch.availableSeatDocs, {});
});

test('สิทธิ์รุ่นเก่าไม่มี seatId → สร้างให้ตอนจ่าย · มีอยู่แล้วใช้ตัวเดิม', () => {
  assert.match(takeSeat(lic(), 0).seat.seatId, /^seat_/);
  const withId = lic({ availableSeatIds: ['s-a', 's-b', 's-c'] });
  assert.equal(takeSeat(withId, 2).seat.seatId, 's-c');
});

test('จ่ายแล้วคืน: สิทธิ์กลับมาครบทุกฟิลด์ พร้อม seatId เดิม', () => {
  const before = lic();
  const { seat, patch } = takeSeat(before, 0);
  const holder = { checkoutId: 'c1', empId: 'e1', ...seat };
  const after = { ...before, ...patch, assignees: [holder] };
  const back = returnSeats(after, [holder]);
  assert.deepEqual(back.availableSeatLabels, ['test2', 'test3', 'test1']);
  assert.equal(back.availableSeatIds[2], seat.seatId);
});

test('อาร์เรย์สั้นกว่าจำนวนสิทธิ์ว่าง: คืนแล้วค่าไปอยู่ตำแหน่งถูก ไม่ไปทับตัวแรก', () => {
  const l = { quantity: 3, assignees: [{ checkoutId: 'c1', seatLabel: 'X', seatId: 'sx' }], availableSeatLabels: [] };
  const back = returnSeats(l, [l.assignees[0]]);
  assert.deepEqual(back.availableSeatLabels, ['', '', 'X']);
  assert.equal(back.availableSeatIds[2], 'sx');
});

test('ลบสิทธิ์ว่าง: ลบทุกฟิลด์ตำแหน่งเดียวกัน', () => {
  const p = removeAvailableSeats(lic({ availableSeatDocs: { 2: [{ name: 'c.pdf' }] } }), [0]);
  assert.deepEqual(p.availableSeatLabels, ['test2', 'test3']);
  assert.deepEqual(p.availableSeatNotes, ['n2', 'n3']);
  assert.deepEqual(p.availableSeatDocs, { 1: [{ name: 'c.pdf' }] });
});

test('availableArrays เติมความยาวให้เท่าจำนวนสิทธิ์ว่าง', () => {
  assert.deepEqual(availableArrays({ quantity: 2, assignees: [] }).availableSeatIds, ['', '']);
});
