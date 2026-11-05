import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expiryStatus, getExpirySummary } from './licenseExpiry.js';

const asOf = new Date(2026, 10, 5);   // 5 พ.ย. 2026

test('วันเก่าค้างท้ายอาร์เรย์สิทธิ์ว่าง (ของช่องที่จ่ายไปแล้ว) ไม่นับ', () => {
  // ต่ออายุแล้ว: วันหลัก 2027 · มีคนใช้ 1 ใบ ว่าง 0 ใบ แต่อาร์เรย์ยังมีวันปีก่อนค้าง
  const lic = { name: '3Ds Max 2026', quantity: 1, expirationDate: '2027-08-13',
    availableSeatExpirationDates: ['2026-08-13'], assignees: [{ empId: 'e1' }] };
  assert.deepEqual(getExpirySummary([lic], asOf), []);
});

test('ใกล้หมด (ภายใน 90 วัน) → แสดง พร้อมจำนวนสิทธิ์ที่ใช้วันหลัก', () => {
  const lic = { name: 'Canva', quantity: 3, expirationDate: '2026-12-01', assignees: [{}, {}] };
  assert.deepEqual(getExpirySummary([lic], asOf), [{ name: 'Canva', expiry: '2026-12-01', seats: 3, note: '' }]);
});

test('หมดแล้ว: แสดงเฉพาะเมื่อสิทธิ์ใบที่หมดยังมีคนใช้', () => {
  const unused = { name: 'A', quantity: 2, expirationDate: '2026-08-01', assignees: [] };
  const used = { name: 'B', quantity: 1, expirationDate: '2026-08-01', assignees: [{}] };
  // สิทธิ์ว่างหมดแล้ว แต่ใบที่มีคนใช้ต่ออายุแล้ว → ไม่แสดง
  const seatRenewed = { name: 'C', quantity: 2, expirationDate: '2026-08-01',
    availableSeatExpirationDates: [''], assignees: [{ seatExpirationDate: '2027-08-01' }] };
  assert.deepEqual(getExpirySummary([unused, used, seatRenewed], asOf).map((r) => r.name), ['B']);
});

test('วันของสิทธิ์ที่ตั้งเองชนะวันหลัก', () => {
  const lic = { name: 'Adobe', quantity: 2, expirationDate: '2027-06-01',
    assignees: [{ seatExpirationDate: '2026-11-11' }, {}] };
  assert.deepEqual(getExpirySummary([lic], asOf), [{ name: 'Adobe', expiry: '2026-11-11', seats: 1, note: '' }]);
});

test('expiryStatus', () => {
  assert.equal(expiryStatus('2026-11-05', asOf).label, 'หมดอายุวันนี้');
  assert.equal(expiryStatus('2026-12-01', asOf).label, 'อีก 26 วัน');
  assert.equal(expiryStatus('2026-08-13', asOf).label, 'หมดอายุแล้ว 84 วัน');
});
