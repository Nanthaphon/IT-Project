import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './pgliteBackend.mjs';
let db;
const admin = { role: 'authenticated', sub: 'admin' };
const hr = { role: 'authenticated', sub: 'hr', app_metadata: { app_role: 'hr' } };
const staff = { role: 'authenticated', sub: 'staff-a', app_metadata: { app_role: 'staff', emp_doc_id: 'a', emp_id: 'A' } };
async function as(claims, sql, params = []) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${claims.role === 'anon' ? 'anon' : 'authenticated'}`);
    await tx.query(`select set_config('request.jwt.claims',$1,true)`, [JSON.stringify(claims)]);
    return tx.query(sql, params);
  });
}
before(async () => {
  db = await createTestDb();
  await db.exec(`insert into admin_users(id,data) values ('admin','{}');
    insert into employees(id,data) values ('a','{"empId":"A"}');
    insert into staff_passwords(id,data) values ('a','{"isDefault":false,"mustChangePassword":false}');`);
});
after(async () => db?.close());

test('bucket is private and bounded; no anonymous or unknown-account reads', async () => {
  const bucket = (await db.query(`select * from storage.buckets where id='it-private'`)).rows[0];
  assert.equal(bucket.public, false);
  assert.equal(Number(bucket.file_size_limit), 16 * 1024 * 1024);
  await as(admin, `insert into storage.objects(bucket_id,name) values ('it-private','admin/docs/a')`);
  assert.equal((await as({ role: 'anon' }, 'select * from storage.objects')).rows.length, 0);
  assert.equal((await as({ role: 'authenticated', sub: 'unknown' }, 'select * from storage.objects')).rows.length, 0);
  await assert.rejects(as({ role: 'anon' }, `insert into storage.objects(bucket_id,name) values ('it-private','catalog/x')`), /row-level security/);
});

test('HR/admin access docs; staff see catalog/own photos but cannot read admin or cross-owner photos', async () => {
  await as(admin, `insert into storage.objects(bucket_id,name) values ('it-private','catalog/images/a'),('it-private','staff/staff-a/a'),('it-private','staff/staff-b/a')`);
  assert.equal((await as(hr, `select * from storage.objects`)).rows.length, 4);
  await assert.rejects(as(hr, `insert into storage.objects(bucket_id,name) values ('it-private','admin/docs/hr-write')`), /row-level security/);
  assert.equal((await as(hr, `delete from storage.objects where name='admin/docs/a'`)).affectedRows, 0);
  assert.equal((await as(hr, `update storage.objects set name='admin/docs/renamed' where name='admin/docs/a'`)).affectedRows, 0);
  const rows = (await as(staff, `select name from storage.objects order by name`)).rows.map(r => r.name);
  assert.deepEqual(rows, ['catalog/images/a', 'staff/staff-a/a']);
  await as(staff, `insert into storage.objects(bucket_id,name) values ('it-private','staff/staff-a/b')`);
  for (const path of ['staff/staff-b/b', 'catalog/images/b', 'admin/docs/b', 'staff/staff-a/../other']) {
    await assert.rejects(as(staff, `insert into storage.objects(bucket_id,name) values ('it-private',$1)`, [path]), /row-level security/);
  }
});

test('forced-password-change and revoked staff tokens cannot read or upload any objects', async () => {
  await db.exec(`update staff_passwords set data='{"isDefault":true}' where id='a'`);
  assert.equal((await as(staff, `select * from storage.objects`)).rows.length, 0);
  await assert.rejects(as(staff, `insert into storage.objects(bucket_id,name) values ('it-private','staff/staff-a/c')`), /row-level security/);
  await db.exec(`update staff_passwords set data='{"isDefault":false,"mustChangePassword":false,"credentialVersion":"new"}' where id='a'`);
  assert.equal((await as(staff, `select * from storage.objects`)).rows.length, 0);
});

test('migration CAS is service-role only and rejects concurrent edits', async () => {
  await db.exec(`insert into assets(id,data) values ('cas','{"name":"new"}')`);
  await assert.rejects(as(admin, `select public.storage_migrate_document('assets','cas','{}','{}')`), /permission denied/);
  const mismatch = await db.query(`select public.storage_migrate_document('assets','cas','{}','{"image":"ref"}') as changed`);
  assert.equal(mismatch.rows[0].changed, false);
  assert.equal((await db.query(`select data from assets where id='cas'`)).rows[0].data.name, 'new');
  const ok = await db.query(`select public.storage_migrate_document('assets','cas','{"name":"new"}','{"name":"new","image":"ref"}') as changed`);
  assert.equal(ok.rows[0].changed, true);
});
