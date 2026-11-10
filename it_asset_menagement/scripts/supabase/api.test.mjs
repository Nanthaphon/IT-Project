/* เทสต์ฟังก์ชัน Vercel (api/*.js) บน Supabase ปลอมในหน่วยความจำ (แทน fetch) — ไม่ต่อเน็ต ไม่ต้องมีบัญชี
   ตรวจลำดับขั้นของ staff-login: หาพนักงาน → ตรวจรหัส → สร้าง/ปรับบัญชี (app_metadata) → ออก session
   รัน: npm run test:supabase */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_test';

/* ── Supabase ปลอม ─────────────────────────────────────────────── */
const tables = { employees: new Map(), staff_passwords: new Map(), admin_users: new Map() };
const users = new Map();          // uid → user
const tokens = new Map();         // access_token → uid
const links = new Map();          // hashed_token → uid
const calls = [];

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function fakeFetch(input, init = {}) {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const method = (init.method || 'GET').toUpperCase();
  const body = init.body ? JSON.parse(init.body) : null;
  const p = url.pathname;
  calls.push(`${method} ${p}`);

  if (p.startsWith('/rest/v1/rpc/doc_write')) {
    const t = tables[body.p_table];
    const cur = t.get(body.p_id) || {};
    for (const op of body.p_ops) cur[op.path[0]] = op.value;
    t.set(body.p_id, cur);
    return json(200, cur);
  }
  if (p.startsWith('/rest/v1/')) {
    const t = tables[p.slice('/rest/v1/'.length)];
    if (method === 'POST') { (Array.isArray(body) ? body : [body]).forEach((r) => t.set(r.id, r.data)); return new Response(null, { status: 201 }); }
    let rows = [...t.entries()].map(([id, data]) => ({ id, data }));
    for (const [k, v] of url.searchParams) {
      if (!v.startsWith('eq.')) continue;
      const want = v.slice(3);
      rows = rows.filter((r) => (k === 'id' ? r.id : k.startsWith('data->>') ? String(r.data[k.slice(7)] ?? '') : null) === want);
    }
    if (method === 'DELETE') { rows.forEach((r) => t.delete(r.id)); return new Response(null, { status: 204, headers: { 'Content-Range': `*/${rows.length}` } }); }
    return json(200, rows);
  }
  if (p === '/auth/v1/user') {
    const uid = tokens.get((init.headers?.Authorization || init.headers?.authorization || '').replace('Bearer ', ''));
    return uid ? json(200, users.get(uid)) : json(401, { code: 'bad_jwt', msg: 'invalid JWT' });
  }
  let m;
  if ((m = p.match(/^\/auth\/v1\/admin\/users\/([^/]+)$/))) {
    const u = users.get(m[1]);
    if (method === 'GET') return u ? json(200, u) : json(404, { code: 'user_not_found', msg: 'User not found' });
    if (method === 'PUT') {
      Object.assign(u, { email: body.email ?? u.email, app_metadata: { ...u.app_metadata, ...(body.app_metadata || {}) } });
      return json(200, u);
    }
  }
  if (p === '/auth/v1/admin/users' && method === 'POST') {
    const u = { id: body.id || crypto.randomUUID(), email: body.email, app_metadata: { provider: 'email', ...(body.app_metadata || {}) }, user_metadata: {} };
    users.set(u.id, u);
    return json(200, u);
  }
  if (p === '/auth/v1/admin/generate_link') {
    const u = [...users.values()].find((x) => x.email === body.email);
    const hashed_token = crypto.randomBytes(8).toString('hex');
    links.set(hashed_token, u.id);
    return json(200, { ...u, action_link: 'x', email_otp: '1', hashed_token, redirect_to: '', verification_type: 'magiclink' });
  }
  if (p === '/auth/v1/verify') {
    const uid = links.get(body.token_hash);
    if (!uid || body.type !== 'magiclink') return json(403, { code: 'otp_expired', msg: 'expired' });
    links.delete(body.token_hash);
    const access_token = `at-${crypto.randomBytes(6).toString('hex')}`;
    tokens.set(access_token, uid);
    return json(200, { access_token, refresh_token: 'rt', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: users.get(uid) });
  }
  return json(404, { msg: `ไม่ได้จำลอง ${method} ${p}` });
}
globalThis.fetch = fakeFetch;

/* ── เรียก handler แบบ Vercel ─────────────────────────────────── */
async function call(handler, body, headers = {}) {
  const res = { statusCode: 200, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; }, end() { return this; } };
  await handler({ method: 'POST', headers: { origin: 'http://localhost:5173', ...headers }, body }, res);
  return res;
}

let staffLogin; let changePw; let setStaffPw; let lib;
before(async () => {
  lib = await import('../../api/_lib/supabaseAdmin.js');
  staffLogin = (await import('../../api/staff-login.js')).default;
  changePw = (await import('../../api/staff-change-password.js')).default;
  setStaffPw = (await import('../../api/set-staff-password.js')).default;
  tables.employees.set('emp-a', { empId: '1010001', fullName: 'ก' });
  tables.employees.set('emp-left', { empId: '1010009', fullName: 'ออก', resignDate: '2020-01-31' });
  tables.admin_users.set('admin-uid', { email: 'a@x' });
  users.set('admin-uid', { id: 'admin-uid', email: 'a@x', app_metadata: { provider: 'email' } });
  tokens.set('admin-token', 'admin-uid');
});

test('staffUid คงที่ต่อพนักงาน และเป็น UUID ที่ Supabase รับ', () => {
  const a = lib.staffUid('emp-a');
  assert.equal(a, lib.staffUid('emp-a'));
  assert.notEqual(a, lib.staffUid('emp-A'));
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('hash รหัสผ่านเหมือนสูตรเดิมใน Firebase (ย้าย staff_passwords มาแล้วใช้ต่อได้)', () => {
  const legacy = crypto.pbkdf2Sync('pass1234', 'salt', 100_000, 32, 'sha256').toString('hex');
  assert.equal(lib.hashPassword('pass1234', 'salt'), legacy);
});

test('staff-login ครั้งแรก: รหัสเริ่มต้น = รหัสพนักงาน → สร้างบัญชี app_metadata staff + คืน session', async () => {
  assert.equal((await call(staffLogin, { empId: '1010001', password: 'wrong' })).statusCode, 403);
  const r = await call(staffLogin, { empId: '1010001', password: '1010001' });
  assert.equal(r.statusCode, 200, JSON.stringify(r.body));
  assert.ok(r.body.session.access_token && r.body.session.refresh_token);
  assert.equal(r.body.empDocId, 'emp-a');
  const u = users.get(lib.staffUid('emp-a'));
  assert.deepEqual({ ...u.app_metadata, provider: undefined }, { provider: undefined, app_role: 'staff', emp_id: '1010001', emp_doc_id: 'emp-a' });
  assert.match(u.email, /^staff-.+@staff\.itasset\.invalid$/);
  const pw = tables.staff_passwords.get('emp-a');
  assert.equal(pw.isDefault, true);
  assert.ok(pw.updatedAt.__ts);
});

test('staff-login: รหัสผิด / ถึงวันที่ออก / ไม่มีรหัสพนักงาน', async () => {
  assert.equal((await call(staffLogin, { empId: '1010001', password: 'nope' })).statusCode, 403);
  const left = await call(staffLogin, { empId: '1010009', password: '1010009' });
  assert.equal(left.statusCode, 403);
  assert.match(left.body.error, /ออกจากบริษัท/);
  assert.equal((await call(staffLogin, { empId: '999', password: '999' })).statusCode, 404);
});

test('staff-login: รหัสพนักงานถูกแก้ → app_metadata อัปเดตตาม', async () => {
  tables.employees.get('emp-a').empId = '2020001';
  const r = await call(staffLogin, { empId: '2020001', password: '1010001' });
  assert.equal(r.statusCode, 200, JSON.stringify(r.body));
  assert.equal(users.get(lib.staffUid('emp-a')).app_metadata.emp_id, '2020001');
  assert.ok(calls.includes(`PUT /auth/v1/admin/users/${lib.staffUid('emp-a')}`));
});

test('staff-change-password: ใช้ token ของพนักงาน · admin เรียกไม่ได้', async () => {
  const login = await call(staffLogin, { empId: '2020001', password: '1010001' });
  const auth = { authorization: `Bearer ${login.body.session.access_token}` };
  assert.equal((await call(changePw, { currentPassword: 'x', newPassword: 'newpass1' }, auth)).statusCode, 403);
  const ok = await call(changePw, { currentPassword: '1010001', newPassword: 'newpass1' }, auth);
  assert.equal(ok.statusCode, 200, JSON.stringify(ok.body));
  assert.equal(tables.staff_passwords.get('emp-a').isDefault, false);
  assert.equal((await call(staffLogin, { empId: '2020001', password: 'newpass1' })).statusCode, 200);
  assert.equal((await call(changePw, { currentPassword: 'a', newPassword: 'bbbbbb' }, { authorization: 'Bearer admin-token' })).statusCode, 403);
});

test('set-staff-password: admin เท่านั้น', async () => {
  const login = await call(staffLogin, { empId: '2020001', password: 'newpass1' });
  const staffAuth = { authorization: `Bearer ${login.body.session.access_token}` };
  assert.equal((await call(setStaffPw, { empDocId: 'emp-a', newPassword: 'hacked1' }, staffAuth)).statusCode, 403);
  assert.equal((await call(setStaffPw, { empDocId: 'emp-a', newPassword: 'reset11' })).statusCode, 401);
  const ok = await call(setStaffPw, { empDocId: 'emp-a', newPassword: 'reset11' }, { authorization: 'Bearer admin-token' });
  assert.equal(ok.statusCode, 200, JSON.stringify(ok.body));
  assert.equal(tables.staff_passwords.get('emp-a').updatedBy, 'admin-uid');
});
