import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from './pgliteBackend.mjs';

let db;
const STAFF = { role: 'authenticated', sub: 'staff-a', app_metadata: { app_role: 'staff', emp_doc_id: 'emp-security', emp_id: 'SEC001' } };
async function as(claims, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${claims.role === 'anon' ? 'anon' : claims.role === 'service_role' ? 'service_role' : 'authenticated'}`);
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
    return tx.query(sql, params);
  });
}
before(async () => {
  db = await createTestDb();
  await db.exec(`insert into employees (id,data) values ('emp-security','{"empId":"SEC001"}');
    insert into assets (id,data) values ('security-asset','{"name":"test"}');
    insert into staff_passwords (id,data) values ('emp-security','{"isDefault":true,"mustChangePassword":false}');`);
});

test('default/reset password blocks direct reads and request writes, including existing sessions', async () => {
  assert.equal((await as(STAFF, 'select id from assets')).rows.length, 0);
  assert.equal((await as(STAFF, 'select id from employees')).rows.length, 0);
  await assert.rejects(as(STAFF, `insert into repair_requests (data) values ('{"empId":"SEC001","empName":"test"}')`), /row-level security/);
  const status = (await as(STAFF, 'select public.staff_access_status() as status')).rows[0].status;
  assert.equal(status.mustChangePassword, true);
  assert.equal(status.empDocId, 'emp-security');
  await db.exec(`update staff_passwords set data='{"isDefault":false,"mustChangePassword":false}' where id='emp-security'`);
  assert.equal((await as(STAFF, 'select id from assets')).rows.length, 1);
  await db.exec(`update staff_passwords set data='{"isDefault":false,"mustChangePassword":true}' where id='emp-security'`);
  assert.equal((await as(STAFF, 'select id from assets')).rows.length, 0);
});

test('resigned and deleted employees cannot obtain bootstrap status', async () => {
  await db.exec(`update employees set data=data || '{"resignDate":"2000-01-01"}' where id='emp-security'`);
  assert.equal((await as(STAFF, 'select public.staff_access_status() as status')).rows[0].status, null);
  await db.exec(`delete from employees where id='emp-security'`);
  assert.equal((await as(STAFF, 'select public.staff_access_status() as status')).rows[0].status, null);
  await assert.rejects(as({ role: 'anon' }, 'select public.staff_access_status()'), /permission denied/);
});

test('atomic rate limit allows exactly the quota and persists rejection across calls', async () => {
  const claims = { role: 'service_role' };
  for (let i = 0; i < 3; i++) {
    const out = (await as(claims, `select public.consume_auth_attempt('test-key',3,900) as result`)).rows[0].result;
    assert.equal(out.allowed, true);
  }
  const blocked = (await as(claims, `select public.consume_auth_attempt('test-key',3,900) as result`)).rows[0].result;
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter > 0 && blocked.retryAfter <= 900);
  await db.exec(`update public.auth_rate_limits set window_started_at=now()-interval '16 minutes' where key='test-key'`);
  assert.equal((await as(claims, `select public.consume_auth_attempt('test-key',3,900) as result`)).rows[0].result.allowed, true);
});

test('rate limit state/RPC cannot be read or reset by anonymous/staff clients', async () => {
  for (const claims of [{ role: 'anon' }, STAFF]) {
    await assert.rejects(as(claims, `select public.consume_auth_attempt('test-key',999,1)`), /permission denied/);
    await assert.rejects(as(claims, 'select * from public.auth_rate_limits'), /permission denied/);
  }
});

test('plaintext password writes are stripped by database trigger', async () => {
  await db.exec(`insert into staff_passwords (id,data) values ('strip-test','{"hash":"test-hash","plaintext":"temporary-secret","isDefault":true}')`);
  const data = (await db.query(`select data from staff_passwords where id='strip-test'`)).rows[0].data;
  assert.equal('plaintext' in data, false);
  assert.equal(data.mustChangePassword, true);
});

test('password change cannot overwrite a concurrent admin reset', async () => {
  await db.exec(`insert into staff_passwords (id,data) values ('cas-test','{"hash":"reset-hash","isDefault":false,"mustChangePassword":true}')`);
  const args = ['cas-test', 'stale-hash', JSON.stringify({ hash: 'replacement', isDefault: false, mustChangePassword: false })];
  assert.equal((await as({ role: 'service_role' }, 'select public.change_staff_password($1,$2,$3) as changed', args)).rows[0].changed, false);
  assert.equal((await db.query(`select data->>'hash' as hash from staff_passwords where id='cas-test'`)).rows[0].hash, 'reset-hash');
  args[1] = 'reset-hash';
  assert.equal((await as({ role: 'service_role' }, 'select public.change_staff_password($1,$2,$3) as changed', args)).rows[0].changed, true);
  await assert.rejects(as(STAFF, 'select public.change_staff_password($1,$2,$3)', args), /permission denied/);
});

test('password reset/change invalidates older sessions even after forced change is complete', async () => {
  await db.exec(`insert into employees (id,data) values ('emp-version','{"empId":"VERSION"}');
    insert into staff_passwords (id,data) values ('emp-version','{"isDefault":false,"mustChangePassword":false,"credentialVersion":"v2"}')`);
  const stale = { ...STAFF, app_metadata: { ...STAFF.app_metadata, emp_doc_id: 'emp-version', credential_version: 'v1' } };
  assert.equal((await as(stale, 'select id from assets')).rows.length, 0);
  assert.equal((await as(stale, 'select public.staff_access_status() as status')).rows[0].status, null);
  stale.app_metadata.credential_version = 'v2';
  assert.equal((await as(stale, 'select id from assets')).rows.length, 1);
});

test('legacy rows without explicit credential flags remain restricted until password change', async () => {
  await db.exec(`insert into employees (id,data) values ('emp-unknown','{"empId":"UNKNOWN001"}');
    insert into staff_passwords (id,data) values ('emp-unknown','{"hash":"legacy-hash","salt":"salt"}')`);
  const legacy = { ...STAFF, app_metadata: { ...STAFF.app_metadata, emp_doc_id: 'emp-unknown', emp_id: 'UNKNOWN001' } };
  assert.equal((await as(legacy, 'select id from assets')).rows.length, 0);
  assert.equal((await as(legacy, 'select public.staff_access_status() as status')).rows[0].status.mustChangePassword, true);
  assert.equal((await db.query(`select data from staff_passwords where id='emp-unknown'`)).rows[0].data.mustChangePassword, true);
});
