import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeValue, encodeValue, tableForPath } from './codec.js';

test('Timestamp → {"__ts"} → กลับมาใช้ toMillis / seconds ได้เหมือนเดิม', () => {
  const fsTs = { seconds: 1762700000, nanoseconds: 0, toDate: () => new Date(1762700000 * 1000) };
  const enc = encodeValue({ createdAt: fsTs, list: [{ at: new Date(0) }], skip: undefined, n: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(enc)), {
    createdAt: { __ts: '2025-11-09T14:53:20.000Z' }, list: [{ at: { __ts: '1970-01-01T00:00:00.000Z' } }], n: 1,
  });
  const dec = decodeValue(enc);
  assert.equal(dec.createdAt.toMillis(), 1762700000 * 1000);
  assert.equal(dec.createdAt.seconds, 1762700000);
  assert.equal(dec.list[0].at.toDate().getTime(), 0);
  assert.deepEqual(JSON.parse(JSON.stringify(dec)), JSON.parse(JSON.stringify(enc)));
});

test('ออบเจ็กต์ทั่วไปที่มีคีย์ __ts ปนคีย์อื่น ไม่ถูกแปลง', () => {
  assert.deepEqual(decodeValue({ __ts: 'x', other: 1 }), { __ts: 'x', other: 1 });
});

test('tableForPath: collection บนสุด / subcollection / ไม่รู้จัก', () => {
  assert.deepEqual(tableForPath('assets'), { table: 'assets' });
  assert.deepEqual(tableForPath('printed_documents/p1/chunks'),
    { table: 'doc_chunks', parentCollection: 'printed_documents', parentId: 'p1', sub: 'chunks' });
  assert.throws(() => tableForPath('nope'), /ไม่รู้จัก/);
});
