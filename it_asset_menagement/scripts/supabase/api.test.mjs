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
const attempts = new Map();
const rotated = [];
let beforeVerify = null;

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function fakeFetch(input, init = {}) {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const method = (init.method || 'GET').toUpperCase();
  const body = init.body ? JSON.parse(init.body) : null;
  const p = url.pathname;
  calls.push(`${method} ${p}`);

  if (p === '/rest/v1/rpc/consume_auth_attempt') {
    const n = (attempts.get(body.p_key) || 0) + 1;
    attempts.set(body.p_key, n);
    return json(200, { allowed: n <= body.p_limit, retryAfter: n <= body.p_limit ? 0 : 900 });
  }
  if (p === '/rest/v1/rpc/change_staff_password') {
    const old = tables.staff_passwords.get(body.p_emp_id);
    if (!old || old.hash !== body.p_expected_hash) return json(200, false);
    tables.staff_passwords.set(body.p_emp_id, body.p_data);
    return json(200, true);
  }

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
      if (body.password) rotated.push(m[1]);
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
    if (beforeVerify) {
      const intervene = beforeVerify;
      beforeVerify = null;
      await intervene();
    }
    const access_token = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: uid, app_metadata: users.get(uid).app_metadata })).toString('base64url')}.${crypto.randomBytes(6).toString('hex')}`;
    tokens.set(access_token, uid);
    return json(200, { access_token, refresh_token: 'rt', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: users.get(uid) });
  }
  if (p === '/auth/v1/logout') {
    tokens.delete((init.headers?.Authorization || init.headers?.authorization || '').replace('Bearer ', ''));
    return new Response(null, { status: 204 });
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
  assert.deepEqual({ ...u.app_metadata, provider: undefined }, { provider: undefined, app_role: 'staff', emp_id: '1010001', emp_doc_id: 'emp-a', credential_version: tables.staff_passwords.get('emp-a').credentialVersion });
  assert.match(u.email, /^staff-.+@staff\.itasset\.invalid$/);
  const pw = tables.staff_passwords.get('emp-a');
  assert.equal(pw.isDefault, true);
  assert.equal(r.body.mustChangePassword, true);
  assert.equal(pw.mustChangePassword, true);
  assert.equal('plaintext' in pw, false);
  assert.ok(pw.updatedAt.__ts);
});

test('staff-login: รหัสผิด / ถึงวันที่ออก / ไม่มีรหัสพนักงาน', async () => {
  assert.equal((await call(staffLogin, { empId: '1010001', password: 'nope' })).statusCode, 403);
  const left = await call(staffLogin, { empId: '1010009', password: '1010009' });
  assert.equal(left.statusCode, 403);
  const unknown = await call(staffLogin, { empId: '999', password: '999' });
  assert.equal(unknown.statusCode, 403);
  assert.equal(left.body.error, unknown.body.error);
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
  assert.equal((await call(setStaffPw, { empDocId: 'emp-a', newPassword: 'reset111' })).statusCode, 401);
  const ok = await call(setStaffPw, { empDocId: 'emp-a', newPassword: 'reset111' }, { authorization: 'Bearer admin-token' });
  assert.equal(ok.statusCode, 200, JSON.stringify(ok.body));
  assert.equal(tables.staff_passwords.get('emp-a').updatedBy, 'admin-uid');
  assert.equal(tables.staff_passwords.get('emp-a').mustChangePassword, true);
  assert.equal('plaintext' in tables.staff_passwords.get('emp-a'), false);
});

test('login rejects malformed/oversized inputs and conceals unknown employees', async () => {
  for (const body of [{ empId: {}, password: 'a' }, { empId: 'x', password: 'x'.repeat(1025) }, { empId: 'x'.repeat(65), password: 'x' }]) {
    assert.equal((await call(staffLogin, body)).statusCode, 400);
  }
});

test('login durable limit blocks attempts before password checking', async () => {
  const before = calls.length;
  const key = 'limited-user';
  let response;
  for (let i = 0; i < 11; i++) response = await call(staffLogin, { empId: key, password: 'wrong' });
  assert.equal(response.statusCode, 429);
  assert.equal(Number(response.headers['Retry-After']), 900);
  assert.ok(calls.slice(before).some((c) => c === 'POST /rest/v1/rpc/consume_auth_attempt'));
});

test('legacy defaults require change; staff cannot set/reset password to employee id', async () => {
  attempts.clear();
  const old = tables.staff_passwords.get('emp-a');
  tables.staff_passwords.set('emp-a', { ...old, isDefault: true, mustChangePassword: false });
  const login = await call(staffLogin, { empId: '2020001', password: 'reset111' });
  assert.equal(login.body.mustChangePassword, true);
  const headers = { authorization: `Bearer ${login.body.session.access_token}` };
  assert.equal((await call(changePw, { currentPassword: 'reset111', resetToDefault: true }, headers)).statusCode, 400);
  assert.equal((await call(changePw, { currentPassword: 'reset111', newPassword: 'short' }, headers)).statusCode, 400);
  assert.equal((await call(changePw, { currentPassword: 'reset111', newPassword: '2020001' }, headers)).statusCode, 400);
  const changed = await call(changePw, { currentPassword: 'reset111', newPassword: 'secure-new-password' }, headers);
  assert.equal(changed.statusCode, 200);
  assert.equal(tables.staff_passwords.get('emp-a').mustChangePassword, false);
  assert.equal('plaintext' in tables.staff_passwords.get('emp-a'), false);
});

test('password change denies an existing token after employee resigns', async () => {
  attempts.clear();
  const login = await call(staffLogin, { empId: '2020001', password: 'secure-new-password' });
  tables.employees.get('emp-a').resignDate = '2000-01-01';
  const result = await call(changePw, { currentPassword: 'secure-new-password', newPassword: 'another-password' }, { authorization: `Bearer ${login.body.session.access_token}` });
  assert.equal(result.statusCode, 401);
});

test('unauthenticated first-setup is retired: knowing employee email cannot set a password', async () => {
  const setup = (await import('../../api/staff-first-setup.js')).default;
  tables.employees.set('setup-target', { empId: 'SETUP001', m365Email: 'known@example.test' });
  const response = await call(setup, { empId: 'SETUP001', m365Email: 'known@example.test', newPassword: 'unexpected-password' });
  assert.equal(response.statusCode, 410);
  assert.equal(tables.staff_passwords.has('setup-target'), false);
});

test('admin reset rejects the old JWT even though Auth returns current user metadata', async () => {
  attempts.clear();
  delete tables.employees.get('emp-a').resignDate;
  const login = await call(staffLogin, { empId: '2020001', password: 'secure-new-password' });
  assert.equal(login.statusCode, 200);
  const reset = await call(setStaffPw, { empDocId: 'emp-a', newPassword: 'new-temporary-password' }, { authorization: 'Bearer admin-token' });
  assert.equal(reset.statusCode, 200);
  const response = await call(changePw, { currentPassword: 'new-temporary-password', newPassword: 'stolen-session-password' }, { authorization: `Bearer ${login.body.session.access_token}` });
  assert.equal(response.statusCode, 401);
  assert.ok(rotated.includes(lib.staffUid('emp-a')), 'Auth password rotation also revokes pre-reset refresh tokens');
});

test('legacy employee-id password without default flags is restricted in the database', async () => {
  attempts.clear();
  tables.employees.set('legacy-unmarked', { empId: 'LEGACY001' });
  tables.staff_passwords.set('legacy-unmarked', { hash: lib.hashPassword('LEGACY001', 'legacy-salt'), salt: 'legacy-salt' });
  const login = await call(staffLogin, { empId: 'LEGACY001', password: 'LEGACY001' });
  assert.equal(login.statusCode, 200);
  assert.equal(login.body.mustChangePassword, true);
  assert.equal(tables.staff_passwords.get('legacy-unmarked').mustChangePassword, true);
});

test('old-password login cannot inherit a new session when reset completes during issuance', async () => {
  attempts.clear();
  const existing = await call(staffLogin, { empId: '2020001', password: 'new-temporary-password' });
  assert.equal(existing.statusCode, 200);
  beforeVerify = async () => {
    const reset = await call(setStaffPw, { empDocId: 'emp-a', newPassword: 'intervening-reset-password' }, { authorization: 'Bearer admin-token' });
    assert.equal(reset.statusCode, 200);
  };
  const stale = await call(staffLogin, { empId: '2020001', password: 'new-temporary-password' });
  assert.equal(stale.statusCode, 403);
  assert.equal(stale.body.session, undefined);
});

test('old-password login cannot inherit normal access after reset plus forced change during issuance', async () => {
  attempts.clear();
  beforeVerify = async () => {
    const reset = await call(setStaffPw, { empDocId: 'emp-a', newPassword: 'second-reset-password' }, { authorization: 'Bearer admin-token' });
    assert.equal(reset.statusCode, 200);
    const login = await call(staffLogin, { empId: '2020001', password: 'second-reset-password' });
    const changed = await call(changePw, { currentPassword: 'second-reset-password', newPassword: 'final-personal-password' }, { authorization: `Bearer ${login.body.session.access_token}` });
    assert.equal(changed.statusCode, 200);
  };
  const stale = await call(staffLogin, { empId: '2020001', password: 'intervening-reset-password' });
  assert.equal(stale.statusCode, 403);
  assert.equal(stale.body.session, undefined);
});

test('self-change does not return another reset credential session after its CAS succeeds', async () => {
  attempts.clear();
  const login = await call(staffLogin, { empId: '2020001', password: 'final-personal-password' });
  beforeVerify = async () => {
    const reset = await call(setStaffPw, { empDocId: 'emp-a', newPassword: 'reset-during-self-change' }, { authorization: 'Bearer admin-token' });
    assert.equal(reset.statusCode, 200);
  };
  const changed = await call(changePw, { currentPassword: 'final-personal-password', newPassword: 'replaced-personal-password' }, { authorization: `Bearer ${login.body.session.access_token}` });
  assert.equal(changed.statusCode, 409);
  assert.equal(changed.body.session, undefined);
});

test('unmarked legacy personal passwords also receive only restricted sessions', async () => {
  attempts.clear();
  tables.employees.set('unknown-flags', { empId: 'UNKNOWN001' });
  tables.staff_passwords.set('unknown-flags', { hash: lib.hashPassword('old-private-password', 'legacy'), salt: 'legacy' });
  const login = await call(staffLogin, { empId: 'UNKNOWN001', password: 'old-private-password' });
  assert.equal(login.statusCode, 200);
  assert.equal(login.body.mustChangePassword, true);
  assert.equal(tables.staff_passwords.get('unknown-flags').mustChangePassword, true);
});
