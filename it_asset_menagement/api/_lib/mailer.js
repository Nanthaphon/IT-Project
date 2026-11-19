/* ส่งอีเมลแจ้งเตือนผ่าน Microsoft Graph (บัญชี M365 ของบริษัท) — แทน Teams webhook เดิม
   ใช้ app registration แบบ client credentials + สิทธิ์ Mail.Send (Application) · ตั้งค่าดู docs/EMAIL-NOTIFY.md
   env: MS_TENANT_ID · MS_CLIENT_ID · MS_CLIENT_SECRET · MAIL_FROM (กล่องที่ใช้ส่ง)
        IT_NOTIFY_EMAILS · HR_NOTIFY_EMAILS (ผู้รับ คั่นด้วย , หรือ ;) */

export const MAIL_ENV = ['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET', 'MAIL_FROM'];
export const RECIPIENT_ENV = { it: 'IT_NOTIFY_EMAILS', hr: 'HR_NOTIFY_EMAILS' };

export const missingMailEnv = (channel) =>
  [...MAIL_ENV, RECIPIENT_ENV[channel]].filter((k) => !String(process.env[k] || '').trim());

export const parseRecipients = (s) =>
  [...new Set(String(s || '').split(/[,;\s]+/).map((x) => x.trim()).filter((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)))];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// label จากหน้าเว็บมี emoji นำหน้า (ใช้กับการ์ด Teams เดิม) — อีเมลตัดออกให้อ่านง่าย
const cleanLabel = (s) => String(s ?? '').replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '').trim();

function daysLabel(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return '';
  if (n < 0) return `หมดอายุแล้ว ${Math.abs(n)} วัน`;
  if (n === 0) return 'หมดอายุวันนี้';
  return `อีก ${n} วัน`;
}
const daysColor = (days) => (Number(days) <= 0 ? '#B0453C' : Number(days) <= 30 ? '#8A5A12' : '#2B6777');

const MAX_ROWS = 200;

/* สร้างหัวเรื่อง + เนื้อหา (HTML และข้อความล้วน) — ฟังก์ชันบริสุทธิ์ มีเทสต์ */
export function buildEmail({ title, facts, groups, summary, timestamp, appUrl }) {
  const hasGroups = Array.isArray(groups) && groups.length > 0;
  const td = 'padding:8px 12px;border-top:1px solid #E6EAEC;font-size:14px;vertical-align:top;';
  let rowsHtml = '';
  let text = '';
  let subjectTail = '';

  if (hasGroups) {
    const rows = [];
    groups.forEach((g) => (g.items || []).forEach((it) => rows.push({ name: g.name || 'License', ...it })));
    rows.sort((a, b) => Number(a.days) - Number(b.days));
    const seats = summary?.seats || rows.length;
    const programs = summary?.programs || groups.length;
    subjectTail = `${seats} สิทธิ์`;
    rowsHtml = `<p style="margin:0 0 12px;color:#4A5A60;font-size:14px">${esc(seats)} สิทธิ์ จาก ${esc(programs)} โปรแกรม จะหมดอายุภายใน 90 วัน</p>`
      + `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">`
      + `<tr><td style="padding:6px 12px;font-size:12px;color:#5F6E73">โปรแกรม / Product Key</td><td style="padding:6px 12px;font-size:12px;color:#5F6E73;text-align:right">หมดอายุ</td></tr>`
      + rows.slice(0, MAX_ROWS).map((r) =>
        `<tr><td style="${td}"><div style="color:#162024;font-weight:500">${esc(r.name)}</div><div style="color:#5F6E73;font-size:12px">${esc(r.productKey || 'ไม่มี Product Key')}</div></td>`
        + `<td style="${td}text-align:right;white-space:nowrap"><div style="color:${daysColor(r.days)};font-weight:500">${esc(daysLabel(r.days))}</div><div style="color:#5F6E73;font-size:12px">${esc(r.dateText || '-')}</div></td></tr>`).join('')
      + (rows.length > MAX_ROWS ? `<tr><td colspan="2" style="${td}color:#5F6E73;text-align:center">… และอีก ${rows.length - MAX_ROWS} สิทธิ์ — ดูทั้งหมดในระบบ</td></tr>` : '')
      + `</table>`;
    text = `${seats} สิทธิ์ จาก ${programs} โปรแกรม จะหมดอายุภายใน 90 วัน\n\n`
      + rows.slice(0, MAX_ROWS).map((r) => `- ${r.name} (${r.productKey || 'ไม่มี Product Key'}) — ${daysLabel(r.days)} · ${r.dateText || '-'}`).join('\n');
  } else {
    const list = (facts || []).map((f) => ({ label: cleanLabel(f.label), value: String(f.value ?? '') || '-' }));
    subjectTail = list[0]?.value && list[0].value !== '-' ? list[0].value : '';
    rowsHtml = `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">`
      + list.map((f) => `<tr><td style="${td}width:35%;color:#5F6E73">${esc(f.label)}</td><td style="${td}color:#162024;font-weight:500;white-space:pre-wrap">${esc(f.value)}</td></tr>`).join('')
      + `</table>`;
    text = list.map((f) => `${f.label}: ${f.value}`).join('\n');
  }

  const link = appUrl ? `<p style="margin:20px 0 0"><a href="${esc(appUrl)}" style="display:inline-block;background:#2B6777;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:12px;font-size:14px">เปิดระบบ IT Asset</a></p>` : '';
  const html = `<!doctype html><html lang="th"><body style="margin:0;background:#F7F9FA;font-family:'Segoe UI',Tahoma,sans-serif">`
    + `<div style="max-width:640px;margin:0 auto;padding:24px 16px">`
    + `<div style="background:#ffffff;border:1px solid #E6EAEC;border-radius:16px;overflow:hidden">`
    + `<div style="background:#2B6777;padding:16px 20px"><div style="color:#ffffff;font-size:19px;font-weight:500">${esc(title)}</div><div style="color:#C8D8E4;font-size:12px">IT Asset Management</div></div>`
    + `<div style="padding:16px 8px 20px">${rowsHtml}<div style="padding:0 12px">${link}</div></div>`
    + `</div><p style="color:#5F6E73;font-size:12px;text-align:center;margin:12px 0 0">${esc(timestamp)} · อีเมลอัตโนมัติ ไม่ต้องตอบกลับ</p>`
    + `</div></body></html>`;

  return {
    subject: `[IT Asset] ${title}${subjectTail ? ` — ${subjectTail}` : ''}`,
    html,
    text: `${title}\n\n${text}\n\n${timestamp}${appUrl ? `\n${appUrl}` : ''}`,
  };
}

/* ── Microsoft Graph ── */
let cachedToken = null; // { token, exp }

async function graphToken() {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const r = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(process.env.MS_TENANT_ID)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MS_CLIENT_ID,
      client_secret: process.env.MS_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }).toString(),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`ขอสิทธิ์ส่งอีเมลไม่สำเร็จ (${r.status} ${j.error || ''})`.trim());
  cachedToken = { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
  return cachedToken.token;
}

export async function sendMail({ to, subject, html }) {
  if (!to.length) throw new Error('ไม่มีอีเมลผู้รับ');
  const token = await graphToken();
  const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(process.env.MAIL_FROM)}/sendMail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: to.map((address) => ({ emailAddress: { address } })),
      },
      saveToSentItems: false,
    }),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) cachedToken = null;
    throw new Error(`ส่งอีเมลไม่สำเร็จ (${r.status} ${j.error?.code || ''})`.trim());
  }
}
