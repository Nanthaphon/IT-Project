/* เทสต์แจ้งเตือนทางอีเมล (api/staff-notify.js + api/_lib/mailer.js) — Supabase และ Microsoft Graph ปลอม ไม่ต่อเน็ต
   รัน: npm run test:supabase */
import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'http://supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_test';
const MAIL = {
  MS_TENANT_ID: 'tenant-1', MS_CLIENT_ID: 'client-1', MS_CLIENT_SECRET: 'secret-1', MAIL_FROM: 'it-notify@corp.test',
  IT_NOTIFY_EMAILS: 'it1@corp.test; it2@corp.test', HR_NOTIFY_EMAILS: 'hr@corp.test',
};

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const itReport = new Map();
let sent = []; let tokenCalls = 0; let graphStatus = 202;

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const method = (init.method || 'GET').toUpperCase();
  if (url.host === 'login.microsoftonline.com') {
    tokenCalls++;
    const form = new URLSearchParams(init.body);
    assert.equal(form.get('grant_type'), 'client_credentials');
    assert.equal(form.get('client_secret'), 'secret-1');
    return json(200, { access_token: 'graph-token', expires_in: 3600 });
  }
  if (url.host === 'graph.microsoft.com') {
    assert.equal(init.headers.Authorization, 'Bearer graph-token');
    if (graphStatus !== 202) return json(graphStatus, { error: { code: 'ErrorAccessDenied' } });
    sent.push({ path: url.pathname, ...JSON.parse(init.body) });
    return new Response(null, { status: 202 });
  }
  if (url.pathname === '/auth/v1/user') {
    const ok = (init.headers?.Authorization || init.headers?.authorization) === 'Bearer admin-token';
    return ok ? json(200, { id: 'admin-uid', email: 'a@x', app_metadata: { provider: 'email' } }) : json(401, { msg: 'bad' });
  }
  if (url.pathname === '/rest/v1/rpc/doc_write') {
    const b = JSON.parse(init.body);
    const cur = itReport.get(b.p_id) || {};
    for (const op of b.p_ops) cur[op.path[0]] = op.value;
    itReport.set(b.p_id, cur);
    return json(200, cur);
  }
  if (url.pathname.startsWith('/rest/v1/')) {
    const id = (url.searchParams.get('id') || '').replace(/^eq\./, '');
    const d = url.pathname.endsWith('/it_report') ? itReport.get(id) : null;
    return json(200, d ? [{ data: d }] : []);
  }
  return json(404, { msg: `ไม่ได้จำลอง ${method} ${url}` });
};

async function call(handler, body, token = 'admin-token') {
  const res = { statusCode: 200, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; }, end() { return this; } };
  await handler({ method: 'POST', headers: { origin: 'http://localhost:5173', authorization: `Bearer ${token}` }, body }, res);
  return res;
}

let notify; let mailer;
before(async () => {
  mailer = await import('../../api/_lib/mailer.js');
  notify = (await import('../../api/staff-notify.js')).default;
});
beforeEach(() => { sent = []; graphStatus = 202; Object.assign(process.env, MAIL); });

test('parseRecipients: คั่นด้วย , ; เว้นวรรค · ตัดค่าที่ไม่ใช่อีเมลและซ้ำ', () => {
  assert.deepEqual(mailer.parseRecipients(' a@x.co, b@x.co;a@x.co  nope  c@y.th '), ['a@x.co', 'b@x.co', 'c@y.th']);
  assert.deepEqual(mailer.parseRecipients(''), []);
});

test('buildEmail: ตัด emoji หน้า label · escape HTML · หัวเรื่องมีชื่อคนแจ้ง', () => {
  const m = mailer.buildEmail({
    title: 'แจ้งซ่อม / ปัญหา IT', timestamp: 'ts', appUrl: 'https://app.test',
    facts: [{ label: '👤 ชื่อ-นามสกุล', value: 'สมชาย' }, { label: '⚠️ อาการที่พบ', value: '<script>x</script>' }],
  });
  assert.equal(m.subject, '[IT Asset] แจ้งซ่อม / ปัญหา IT — สมชาย');
  assert.match(m.html, />ชื่อ-นามสกุล</);
  assert.match(m.html, />อาการที่พบ</);
  assert.ok(!m.html.includes('<script>x'));
  assert.match(m.html, /&lt;script&gt;/);
  assert.match(m.html, /href="https:\/\/app.test"/);
  assert.match(m.text, /อาการที่พบ: <script>x<\/script>/);
});

test('buildEmail: License เรียงใกล้หมดก่อน · ไม่มี Product Key แสดงข้อความแทน', () => {
  const m = mailer.buildEmail({
    title: 'License ใกล้หมดอายุ', timestamp: 'ts', summary: { programs: 2, seats: 3 },
    groups: [
      { name: 'Office', items: [{ productKey: 'K-1', days: 40, dateText: '01/01/2027' }, { days: 0, dateText: 'วันนี้' }] },
      { name: 'Adobe', items: [{ productKey: 'A-1', days: -2, dateText: 'เมื่อวาน' }] },
    ],
  });
  assert.equal(m.subject, '[IT Asset] License ใกล้หมดอายุ — 3 สิทธิ์');
  const order = ['Adobe', 'หมดอายุวันนี้', 'อีก 40 วัน'].map((s) => m.html.indexOf(s));
  assert.ok(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), 'เรียงตามวัน');
  assert.match(m.html, /ไม่มี Product Key/);
  assert.match(m.html, /หมดอายุแล้ว 2 วัน/);
});

test('staff-notify: ยังไม่ตั้งค่า env → 400 บอกชื่อที่ขาด · ไม่ส่ง', async () => {
  delete process.env.MS_CLIENT_SECRET; delete process.env.HR_NOTIFY_EMAILS;
  const r = await call(notify, { kind: 'supply', facts: [] });
  assert.equal(r.statusCode, 400);
  assert.match(r.body.error, /MS_CLIENT_SECRET/);
  assert.match(r.body.error, /HR_NOTIFY_EMAILS/);
  assert.equal(sent.length, 0);
});

test('staff-notify: ไม่มี token / kind ผิด', async () => {
  assert.equal((await call(notify, { kind: 'repair', facts: [] }, 'bad')).statusCode, 401);
  assert.equal((await call(notify, { kind: 'hack', facts: [] })).statusCode, 400);
});

test('staff-notify: แจ้งซ่อม → ส่งจากกล่อง MAIL_FROM ถึงผู้รับ IT ทุกคน', async () => {
  const r = await call(notify, { kind: 'repair', facts: [{ label: '👤 ชื่อ-นามสกุล', value: 'สมชาย' }] });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.recipients, 2);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].path, '/v1.0/users/it-notify%40corp.test/sendMail');
  assert.deepEqual(sent[0].message.toRecipients.map((x) => x.emailAddress.address), ['it1@corp.test', 'it2@corp.test']);
  assert.equal(sent[0].message.body.contentType, 'HTML');
  assert.equal(sent[0].saveToSentItems, false);
});

test('staff-notify: เบิกอุปกรณ์สำนักงาน → ผู้รับ HR · token ของ Graph ใช้ซ้ำ', async () => {
  const before = tokenCalls;
  await call(notify, { kind: 'supply', facts: [] });
  await call(notify, { kind: 'supply', facts: [] });
  assert.deepEqual(sent.map((s) => s.message.toRecipients[0].emailAddress.address), ['hr@corp.test', 'hr@corp.test']);
  assert.ok(tokenCalls - before <= 1);
});

test('staff-notify: Graph ปฏิเสธ → 500 พร้อมรหัสข้อผิดพลาด', async () => {
  graphStatus = 403;
  const r = await call(notify, { kind: 'repair', facts: [] });
  assert.equal(r.statusCode, 500);
  assert.match(r.body.error, /403 ErrorAccessDenied/);
});

test('staff-notify: License ใกล้หมดอายุ ส่งวันละฉบับทั้งระบบ (แอดมินหลายเครื่องไม่ซ้ำ)', async () => {
  const body = { kind: 'license', summary: { programs: 1, seats: 1 }, groups: [{ name: 'Office', items: [{ days: 5 }] }] };
  const a = await call(notify, body);
  const b = await call(notify, body);
  assert.equal(a.statusCode, 200);
  assert.equal(b.body.skipped, 'already-sent-today');
  assert.equal(sent.length, 1);
});
