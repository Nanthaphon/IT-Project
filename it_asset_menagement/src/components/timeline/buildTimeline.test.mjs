/* เทสต์ buildTimeline — รัน: npm test (node --test ไม่ต้องต่อ Firestore) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLicenseTimeline } from './buildTimeline.js';

const day = 86400000;
const created = Date.UTC(2026, 10, 3, 9, 0);   // 3 พ.ย. 2569 — วันที่สร้าง License ใหม่
const before = created - 150 * day;             // ~5 เดือนก่อน
const lic = (over = {}) => ({ id: 'newLic', name: 'test', createdAt: { seconds: created / 1000 }, assignees: [], ...over });
const tx = (over) => ({ category: 'licenses', action: 'เบิกจ่าย', empId: 'e1', ...over });

test('License ใหม่ชื่อซ้ำของเก่าที่ถูกลบ ไม่ดึงประวัติของตัวเก่ามา', () => {
  const events = buildLicenseTimeline(lic(), [
    // ของ License "test" ตัวเก่า (ลบไปแล้ว) — รุ่นที่ไม่ได้เก็บ licenseId
    tx({ assetId: 'oldLic', assetName: 'test', action: 'รับคืน', timestamp: before }),
    tx({ licenseName: 'test', isAssetBound: true, assetId: 'pc1', assetName: 'PC-01', timestamp: before }),
    tx({ assetName: 'test', timestamp: before + day }),
    // ของตัวใหม่จริง
    tx({ licenseId: 'newLic', licenseName: 'test', timestamp: created + 60_000 }),
  ]);
  assert.equal(events.length, 1);
  assert.equal(events[0].kind, 'seatOn');
});

test('คืนสิทธิ์ที่เก็บแค่ assetId (ไม่มี licenseId) จับคู่ด้วย id ไม่ใช่ชื่อ', () => {
  const events = buildLicenseTimeline(lic({ name: 'ชื่อใหม่หลังเปลี่ยน' }), [
    tx({ assetId: 'newLic', assetName: 'test', action: 'รับคืน', timestamp: created + day }),
  ]);
  assert.equal(events.length, 1);
  assert.equal(events[0].kind, 'seatOff');
  assert.equal(events[0].matchedByName, false);
});

test('License เก่าที่ไม่มี createdAt ยังจับคู่ด้วยชื่อได้เหมือนเดิม', () => {
  const events = buildLicenseTimeline(lic({ createdAt: undefined }), [
    tx({ assetName: 'test', timestamp: before }),
  ]);
  assert.equal(events.length, 1);
  assert.equal(events[0].matchedByName, true);
});

test('รายการที่มี licenseId ของ License อื่น ไม่ถูกนับ แม้ชื่อตรงกัน', () => {
  const events = buildLicenseTimeline(lic(), [
    tx({ licenseId: 'otherLic', licenseName: 'test', timestamp: created + day }),
  ]);
  assert.equal(events.length, 0);
});

test('ไทม์ไลน์รายสิทธิ์บอกสาเหตุที่ประวัติไม่ครบ: ไม่มี Key / Key ซ้ำ', async () => {
  const { buildSeatTimeline } = await import('./buildTimeline.js');
  const noKey = buildSeatTimeline(lic({ availableKeys: [''] }), { productKey: '' }, []);
  assert.equal(noKey.partial, true);
  assert.equal(noKey.reason, 'noKey');
  const dup = buildSeatTimeline(lic({ availableKeys: ['AAA', 'AAA'] }), { productKey: 'AAA' }, []);
  assert.equal(dup.reason, 'dupKey');
  const ok = buildSeatTimeline(lic({ availableKeys: ['AAA', 'BBB'] }), { productKey: 'AAA' }, []);
  assert.equal(ok.partial, false);
});
