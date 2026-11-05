import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE_KEY, applyNotes, legacyNotes, monthKey, noteFor, setNote, stripNotes } from './reportNotes.js';

const OCT = monthKey(2026, 9), NOV = monthKey(2026, 10), DEC = monthKey(2026, 11);

test('monthKey', () => assert.equal(OCT, '2026-10'));

test('แก้เดือนใหม่ไม่ทับเดือนเก่า · เดือนที่ยังไม่แก้ยกยอดจากเดือนก่อน', () => {
  let n = setNote({}, OCT, 'ทีวี', 'ห้องประชุม');
  n = setNote(n, NOV, 'ทีวี', 'ห้องประชุม + ห้อง BD');
  assert.equal(noteFor(n, OCT, 'ทีวี'), 'ห้องประชุม');
  assert.equal(noteFor(n, NOV, 'ทีวี'), 'ห้องประชุม + ห้อง BD');
  assert.equal(noteFor(n, DEC, 'ทีวี'), 'ห้องประชุม + ห้อง BD');
  assert.equal(noteFor(n, '2026-09', 'ทีวี'), undefined);
});

test('ค่าตั้งต้นจากระบบเก่าใช้ได้ทุกเดือน · ลบจนว่างก็ถือว่ากรอก', () => {
  let n = { [BASE_KEY]: { 'ปริ้นเตอร์': 'Epson 3' } };
  assert.equal(noteFor(n, '2025-01', 'ปริ้นเตอร์'), 'Epson 3');
  n = setNote(n, NOV, 'ปริ้นเตอร์', '');
  assert.equal(noteFor(n, NOV, 'ปริ้นเตอร์'), '');
  assert.equal(noteFor(n, OCT, 'ปริ้นเตอร์'), 'Epson 3');
});

test('ดึงจากระบบ (แถวใหม่ ลำดับเปลี่ยน) → หมายเหตุกลับมาตรงชื่อแถว', () => {
  const notes = { [OCT]: { 'หน้าจอ': 'จอพนักงาน' } };
  const fresh = [{ type: 'โน๊ตบุ๊ค', note: 'สำรอง 2' }, { type: 'หน้าจอ', note: '' }];
  assert.deepEqual(applyNotes(fresh, notes, NOV, 'type'), [{ type: 'โน๊ตบุ๊ค', note: 'สำรอง 2' }, { type: 'หน้าจอ', note: 'จอพนักงาน' }]);
});

test('stripNotes คืนหมายเหตุเดิมของแถว', () => {
  const base = [{ type: 'หน้าจอ', total: 1, note: '' }];
  const edited = [{ type: 'หน้าจอ', total: 2, note: 'จอพนักงาน' }, { type: 'ใหม่', note: 'x' }];
  assert.deepEqual(stripNotes(edited, base, 'type'), [{ type: 'หน้าจอ', total: 2, note: '' }, { type: 'ใหม่', note: 'x' }]);
});

test('legacyNotes ข้ามหมายเหตุที่ระบบสร้าง', () => {
  const rows = [
    { type: 'โน๊ตบุ๊ค', note: 'สำรอง 2 · ตัดจำหน่าย 13' },
    { type: 'หน้าจอ', note: 'จอมอนิเตอร์สำหรับพนักงาน' },
    { type: 'อื่นๆ', note: '–' },
    { name: 'Zoom', note: 'ใกล้หมดอายุ (12 วัน)' },
  ];
  assert.deepEqual(legacyNotes(rows, 'type'), { 'หน้าจอ': 'จอมอนิเตอร์สำหรับพนักงาน' });
});
