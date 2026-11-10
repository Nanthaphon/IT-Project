/* เทสต์ชั้นเชื่อม src/db/compat.js — ใช้คำสั่งแบบเดียวกับโค้ดแอป (หน้าตา firebase/firestore)
   ยิงลง Postgres จริง (PGlite) ผ่าน doc_write + RLS · รัน: npm run test:supabase */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, createPgliteBackend } from './pgliteBackend.mjs';
import {
  configureBackend, getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, limit, onSnapshot, writeBatch, serverTimestamp, deleteField,
} from '../../src/db/compat.js';

const ADMIN = { role: 'authenticated', sub: 'admin-uid' };
const STAFF = { role: 'authenticated', sub: 'emp-a', app_role: 'staff', emp_id: '1010001', emp_doc_id: 'emp-a' };
let pg; let adminBe; let staffBe;
const db = getFirestore();
const asAdmin = () => configureBackend(adminBe);
const asStaff = () => configureBackend(staffBe);

before(async () => {
  pg = await createTestDb();
  await pg.exec(`insert into admin_users (id, data) values ('admin-uid', '{"email":"a@x"}')`);
  adminBe = createPgliteBackend(pg, ADMIN);
  staffBe = createPgliteBackend(pg, STAFF);
});

test('addDoc + serverTimestamp → getDoc คืน Timestamp ใช้ toMillis ได้', async () => {
  asAdmin();
  const t0 = Date.now();
  const ref = await addDoc(collection(db, 'assets'), { name: 'Notebook', cost: 25000, createdAt: serverTimestamp(), gone: undefined });
  assert.equal(ref.id.length, 20);
  const snap = await getDoc(doc(db, 'assets', ref.id));
  assert.equal(snap.exists(), true);
  assert.equal(snap.data().name, 'Notebook');
  assert.equal(snap.data().cost, 25000);
  assert.ok(snap.data().createdAt.toMillis() >= t0 - 5);
  assert.ok(!('gone' in snap.data()));
  assert.equal((await getDoc(doc(db, 'assets', 'nope'))).exists(), false);
});

test('updateDoc: path "a.b" แก้ลึก · deleteField ลบ · ออบเจ็กต์แทนทั้งก้อน · ไม่มีเอกสาร = error', async () => {
  asAdmin();
  const ref = doc(db, 'licenses', 'L1');
  await setDoc(ref, { name: 'Office', meta: { a: 1, b: 2 }, note: 'x', keep: { y: 1 } });
  await updateDoc(ref, { 'meta.a': 9, note: deleteField(), keep: { z: 2 } });
  assert.deepEqual((await getDoc(ref)).data(), { name: 'Office', meta: { a: 9, b: 2 }, keep: { z: 2 } });
  await assert.rejects(updateDoc(doc(db, 'licenses', 'missing'), { x: 1 }), (e) => e.code === 'not-found');
});

test('setDoc merge รวมลึกเหมือน Firestore · setDoc ธรรมดาแทนทั้งก้อน', async () => {
  asAdmin();
  const ref = doc(db, 'settings', 'fieldOptions');
  await setDoc(ref, { companies: ['A'], nested: { x: 1, y: 1 } });
  await setDoc(ref, { nested: { y: 2 }, brands: ['Haier'] }, { merge: true });
  assert.deepEqual((await getDoc(ref)).data(), { companies: ['A'], nested: { x: 1, y: 2 }, brands: ['Haier'] });
  await setDoc(ref, { only: true });
  assert.deepEqual((await getDoc(ref)).data(), { only: true });
});

test('query: where / orderBy / limit (ประวัติตาม checkoutId · ชิ้นไฟล์ตาม index)', async () => {
  asAdmin();
  const col = collection(db, 'assets_transactions');
  for (const [i, c] of ['c1', 'c2', 'c1'].entries()) await addDoc(col, { checkoutId: c, n: i });
  const r = await getDocs(query(col, where('checkoutId', '==', 'c1'), orderBy('n', 'desc')));
  assert.deepEqual(r.docs.map((d) => d.data().n), [2, 0]);
  assert.equal((await getDocs(query(col, orderBy('n'), limit(1)))).docs[0].data().n, 0);

  const att = await addDoc(collection(db, 'transaction_attachments'), { fileName: 'big.pdf' });
  const chunks = collection(db, 'transaction_attachments', att.id, 'chunks');
  await Promise.all([2, 0, 1].map((index) => addDoc(chunks, { index, data: `part${index}` })));
  const parts = await getDocs(query(chunks, orderBy('index')));
  assert.equal(parts.docs.map((d) => d.data().data).join(''), 'part0part1part2');
});

test('ชิ้นเอกสารพิมพ์ (setDoc ใส่ id เอง) อ่านกลับทีละชิ้น', async () => {
  asAdmin();
  const meta = await addDoc(collection(db, 'printed_documents'), { chunks: 0 });
  for (let i = 0; i < 2; i++) await setDoc(doc(db, 'printed_documents', meta.id, 'chunks', String(i)), { idx: i, data: `<p>${i}</p>` });
  await setDoc(doc(db, 'printed_documents', meta.id), { chunks: 2 }, { merge: true });
  const m = (await getDoc(doc(db, 'printed_documents', meta.id))).data();
  let html = '';
  for (let i = 0; i < m.chunks; i++) html += (await getDoc(doc(db, 'printed_documents', meta.id, 'chunks', String(i)))).data().data;
  assert.equal(html, '<p>0</p><p>1</p>');
});

test('RLS ผ่านชั้นเชื่อม: staff แก้ทรัพย์สินไม่ได้ · แก้ข้อมูลตัวเองได้', async () => {
  asAdmin();
  await setDoc(doc(db, 'employees', 'emp-a'), { empId: '1010001', fullName: 'ก' });
  await setDoc(doc(db, 'assets', 'A1'), { name: 'x' });
  asStaff();
  await assert.rejects(updateDoc(doc(db, 'assets', 'A1'), { name: 'hack' }), (e) => e.code === 'permission-denied');
  await assert.rejects(addDoc(collection(db, 'assets'), { name: 'y' }), (e) => e.code === 'permission-denied');
  await updateDoc(doc(db, 'employees', 'emp-a'), { nickname: 'เอ', updatedAt: serverTimestamp() });
  await assert.rejects(updateDoc(doc(db, 'employees', 'emp-a'), { manager: 'ตัวเอง' }), /staff แก้ได้/);
  asAdmin();
  assert.equal((await getDoc(doc(db, 'employees', 'emp-a'))).data().nickname, 'เอ');
});

test('writeBatch + deleteDoc', async () => {
  asAdmin();
  const b = writeBatch(db);
  b.set(doc(db, 'office_supplies', 'S1'), { name: 'ปากกา', quantity: 1 });
  b.set(doc(db, 'office_supplies', 'S2'), { name: 'กระดาษ', quantity: 5 });
  b.update(doc(db, 'office_supplies', 'S1'), { quantity: 3 });
  await b.commit();
  assert.equal((await getDoc(doc(db, 'office_supplies', 'S1'))).data().quantity, 3);
  await deleteDoc(doc(db, 'office_supplies', 'S2'));
  assert.equal((await getDocs(collection(db, 'office_supplies'))).size, 1);
});

test('onSnapshot: ครั้งแรกได้ทั้งชุด · เพิ่ม/แก้/ลบ ส่ง docChanges · เลิกฟังแล้วเงียบ', async () => {
  asAdmin();
  const seen = [];
  const unsub = onSnapshot(collection(db, 'accessories'), (s) => seen.push({ ids: s.docs.map((d) => d.id).sort(), ch: s.docChanges().map((c) => c.type) }));
  await new Promise((r) => setTimeout(r, 50));
  await setDoc(doc(db, 'accessories', 'X1'), { name: 'เมาส์' });
  await updateDoc(doc(db, 'accessories', 'X1'), { name: 'เมาส์ไร้สาย' });
  await deleteDoc(doc(db, 'accessories', 'X1'));
  unsub();
  await setDoc(doc(db, 'accessories', 'X2'), { name: 'คีย์บอร์ด' });
  assert.deepEqual(seen, [
    { ids: [], ch: [] },
    { ids: ['X1'], ch: ['added'] },
    { ids: ['X1'], ch: ['modified'] },
    { ids: [], ch: ['removed'] },
  ]);

  const docSeen = [];
  const u2 = onSnapshot(doc(db, 'accessories', 'X2'), (s) => docSeen.push(s.exists() ? s.data().name : null));
  await new Promise((r) => setTimeout(r, 50));
  await updateDoc(doc(db, 'accessories', 'X2'), { name: 'คีย์บอร์ดใหม่' });
  u2();
  assert.deepEqual(docSeen, ['คีย์บอร์ด', 'คีย์บอร์ดใหม่']);
});
