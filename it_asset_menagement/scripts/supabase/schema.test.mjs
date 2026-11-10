/* ทดสอบโครงสร้าง + สิทธิ์ (RLS) ของ Supabase บน PGlite (Postgres ในเครื่อง ไม่ต้องมี Docker / บัญชี Supabase)
   รัน: npm run test:supabase
   แต่ละเคสเทียบกับกฎเดิมใน firestore.rules */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const MIGRATION = new URL('../../supabase/migrations/20261110000000_init.sql', import.meta.url);
let db;

const ADMIN = { role: 'authenticated', sub: 'admin-uid' };
const SUPER = { role: 'authenticated', sub: 'super-uid' };
const STAFF = { role: 'authenticated', sub: 'emp-a', app_role: 'staff', emp_id: '1010001', emp_doc_id: 'emp-a' };
const ANON = { role: 'anon' };

/* รันคำสั่งในนามผู้ใช้ (เหมือน PostgREST: ตั้ง role + claims ต่อ transaction) */
async function as(claims, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.query(`set local role ${claims.role === 'anon' ? 'anon' : 'authenticated'}`);
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
    return tx.query(sql, params);
  });
}
const denied = (p) => assert.rejects(p, /row-level security|permission denied|staff แก้ได้|แก้ได้เฉพาะ/);

before(async () => {
  db = new PGlite();
  for (const r of ['anon', 'authenticated', 'service_role']) await db.exec(`create role ${r} nologin`);
  await db.exec(readFileSync(MIGRATION, 'utf8'));
  await db.exec(`
    insert into admin_users (id, data) values ('admin-uid', '{"email":"a@x"}'), ('super-uid', '{"email":"s@x","isSuperAdmin":true}');
    insert into employees (id, data) values ('emp-a', '{"empId":"1010001","fullName":"ก","manager":"ข"}'),
                                            ('emp-b', '{"empId":"1010002","fullName":"ข"}');
    insert into settings (id, data) values ('fieldOptions', '{"companies":["Globe"]}');
    insert into deleted_employees (id, data) values ('old', '{"empId":"9"}');
    insert into repair_requests (id, data) values
      ('r1', '{"empId":"1010001","empName":"ก","status":"รอดำเนินการ"}'),
      ('r2', '{"empId":"1010001","empName":"ก","status":"เสร็จสิ้น"}'),
      ('r3', '{"empId":"1010002","empName":"ข","status":"รอดำเนินการ"}');
  `);
});

test('settings อ่านได้โดยไม่ login · ข้อมูลหลักต้อง login', async () => {
  assert.equal((await as(ANON, 'select * from settings')).rows.length, 1);
  assert.equal((await as(ANON, 'select * from employees')).rows.length, 0);
  assert.equal((await as(STAFF, 'select * from employees')).rows.length, 2);
});

test('ทรัพย์สิน: admin เขียนได้ · staff เขียนไม่ได้', async () => {
  await as(ADMIN, `insert into assets (id, data) values ('a1', '{"name":"Notebook"}')`);
  await denied(as(STAFF, `insert into assets (id, data) values ('a2', '{"name":"x"}')`));
  const r = await as(STAFF, `update assets set data = '{"name":"hack"}' where id = 'a1'`);
  assert.equal(r.affectedRows, 0);
});

test('ข้อมูล admin เท่านั้น: staff ไม่เห็นพนักงานที่ลบแล้ว / ประวัติ', async () => {
  assert.equal((await as(STAFF, 'select * from deleted_employees')).rows.length, 0);
  assert.equal((await as(ADMIN, 'select * from deleted_employees')).rows.length, 1);
  await denied(as(STAFF, `insert into assets_transactions (data) values ('{}')`));
});

test('employees: staff แก้เฉพาะ profile ของตัวเอง', async () => {
  await as(STAFF, `update employees set data = data || '{"nickname":"เอ"}' where id = 'emp-a'`);
  assert.equal((await db.query(`select data->>'nickname' n from employees where id = 'emp-a'`)).rows[0].n, 'เอ');
  await denied(as(STAFF, `update employees set data = data || '{"manager":"ฉันเอง"}' where id = 'emp-a'`));
  assert.equal((await as(STAFF, `update employees set data = data || '{"nickname":"x"}' where id = 'emp-b'`)).affectedRows, 0);
  await as(ADMIN, `update employees set data = data || '{"manager":"ค"}' where id = 'emp-a'`);
});

test('employees: เอกสารใหม่ห้ามมีรหัส M365 (แม้ admin)', async () => {
  await denied(as(ADMIN, `insert into employees (id, data) values ('emp-c', '{"empId":"3","m365Password":"x"}')`));
  await as(ADMIN, `insert into employees (id, data) values ('emp-c', '{"empId":"3"}')`);
});

test('employee_secrets: staff อ่าน/เขียนได้เฉพาะของตัวเอง และแค่ m365Password', async () => {
  await as(ADMIN, `insert into employee_secrets (id, data) values ('emp-b', '{"m365Password":"b"}')`);
  await as(STAFF, `insert into employee_secrets (id, data) values ('emp-a', '{"m365Password":"a"}')`);
  assert.equal((await as(STAFF, 'select * from employee_secrets')).rows.length, 1);
  await denied(as(STAFF, `insert into employee_secrets (id, data) values ('emp-x', '{"m365Password":"a"}')`));
  await denied(as(STAFF, `update employee_secrets set data = '{"m365Password":"a","other":1}' where id = 'emp-a'`));
});

test('คำขอ: staff สร้างได้เฉพาะในนามตัวเอง และต้องมีฟิลด์ครบ', async () => {
  await as(STAFF, `insert into supply_requests (data) values ('{"empId":"1010001","empName":"ก"}')`);
  await denied(as(STAFF, `insert into supply_requests (data) values ('{"empId":"1010002","empName":"ข"}')`));
  await denied(as(STAFF, `insert into accessory_requests (data) values ('{"empId":"1010001","empName":"ก"}')`));
  await as(STAFF, `insert into accessory_requests (data) values ('{"empId":"1010001","empName":"ก","accessoryId":"x","requestType":"ยืม"}')`);
  await as(ADMIN, `insert into supply_requests (data) values ('{"empId":"1010002","empName":"ข"}')`);
});

test('แจ้งซ่อม: เจ้าของให้คะแนนได้ · เปลี่ยนสถานะเองไม่ได้ · ยกเลิกได้เฉพาะที่รอดำเนินการ', async () => {
  await as(STAFF, `update repair_requests set data = data || '{"evaluation":{"score":5}}' where id = 'r2'`);
  await denied(as(STAFF, `update repair_requests set data = data || '{"status":"เสร็จสิ้น"}' where id = 'r1'`));
  assert.equal((await as(STAFF, `delete from repair_requests where id = 'r2'`)).affectedRows, 0);
  assert.equal((await as(STAFF, `delete from repair_requests where id = 'r3'`)).affectedRows, 0);
  assert.equal((await as(STAFF, `delete from repair_requests where id = 'r1'`)).affectedRows, 1);
});

test('admin_users: เฉพาะ SuperAdmin เพิ่ม/ลบ · admin แก้ของตัวเองได้', async () => {
  await denied(as(ADMIN, `insert into admin_users (id, data) values ('new', '{}')`));
  await as(SUPER, `insert into admin_users (id, data) values ('new', '{}')`);
  assert.equal((await as(ADMIN, `update admin_users set data = '{"name":"ฉัน"}' where id = 'admin-uid'`)).affectedRows, 1);
  assert.equal((await as(ADMIN, `delete from admin_users where id = 'new'`)).affectedRows, 0);
  assert.equal((await as(STAFF, 'select * from admin_users')).rows.length, 0);
});

test('staff ที่ปลอม sub ให้ตรง admin ก็ไม่ได้สิทธิ์ admin', async () => {
  const fake = { ...STAFF, sub: 'admin-uid' };
  await denied(as(fake, `insert into assets (id, data) values ('z', '{}')`));
});

test('ไฟล์แนบแบ่งชิ้น (doc_chunks): admin เท่านั้น', async () => {
  await as(ADMIN, `insert into doc_chunks (parent_collection, parent_id, sub, id, data) values ('printed_documents', 'p1', 'chunks', '0', '{"index":0}')`);
  assert.equal((await as(STAFF, 'select * from doc_chunks')).rows.length, 0);
});

test('updated_at เปลี่ยนเองเมื่อแก้', async () => {
  await db.exec(`update assets set updated_at = now() - interval '1 day' where id = 'a1'`);
  await as(ADMIN, `update assets set data = data || '{"note":"x"}' where id = 'a1'`);
  const r = await db.query(`select updated_at > now() - interval '1 minute' as fresh from assets where id = 'a1'`);
  assert.equal(r.rows[0].fresh, true);
});
