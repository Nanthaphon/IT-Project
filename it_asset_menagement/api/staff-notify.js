// Vercel serverless function — ส่งแจ้งเตือนทางอีเมล (Microsoft Graph · บัญชี M365 บริษัท)
// เดิมส่ง Adaptive Card เข้า Teams — เปลี่ยนเป็นอีเมล 11/2026 · ตั้งค่าดู docs/EMAIL-NOTIFY.md
// HR = คำขอเบิกอุปกรณ์สำนักงาน
// IT = แจ้งซ่อม / License หมดอายุ / คำขอเปลี่ยนเครื่อง / อุปกรณ์เสริม
import { preflight, bearer, verifyCaller, getData, patchData } from './_lib/supabaseAdmin.js';
import { buildEmail, sendMail, missingMailEnv, parseRecipients, RECIPIENT_ENV } from './_lib/mailer.js';

const NOTIFY_STATE = 'notify_state'; // it_report/notify_state — ตาราง admin เท่านั้น

const KINDS = {
  repair:            { title: 'แจ้งซ่อม / ปัญหา IT',     channel: 'it' },
  supply:            { title: 'คำขอเบิกอุปกรณ์สำนักงาน', channel: 'hr' },
  replacement:       { title: 'คำขอเปลี่ยนเครื่อง',       channel: 'it' },
  license:           { title: 'License ใกล้หมดอายุ',       channel: 'it' },
  accessory_request: { title: 'คำขออุปกรณ์เสริม',         channel: 'it' },
};

export default async function handler(req, res) {
  if (preflight(req, res)) return;

  // ── ตรวจ caller ต้อง login (staff หรือ admin) — token ของ Supabase Auth ──
  const idToken = bearer(req);
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });
  if (!(await verifyCaller(idToken).catch(() => null))) return res.status(401).json({ error: 'Invalid or expired token' });

  try {
    const { kind, facts, groups, summary } = req.body || {};
    const k = KINDS[kind];
    if (!k) return res.status(400).json({ error: 'invalid kind' });
    const hasGroups = Array.isArray(groups) && groups.length > 0;
    if (!hasGroups && !Array.isArray(facts)) return res.status(400).json({ error: 'invalid facts' });

    const missing = missingMailEnv(k.channel);
    if (missing.length) return res.status(400).json({ error: `ยังไม่ได้ตั้งค่าอีเมลแจ้งเตือน (${missing.join(', ')})` });
    const to = parseRecipients(process.env[RECIPIENT_ENV[k.channel]]);
    if (!to.length) return res.status(400).json({ error: `${RECIPIENT_ENV[k.channel]} ไม่มีอีเมลที่ถูกต้อง` });

    // License ใกล้หมดอายุ ถูกยิงจากเบราว์เซอร์ของแอดมินทุกคน (วันละครั้งต่อเครื่อง) — กันอีเมลซ้ำ: วันละฉบับทั้งระบบ
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    if (kind === 'license') {
      const state = await getData('it_report', NOTIFY_STATE).catch(() => null);
      if (state?.licenseSentOn === today) return res.status(200).json({ success: true, skipped: 'already-sent-today' });
    }

    const timestamp = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' });
    const appUrl = (process.env.VITE_PUBLIC_APP_URL || 'https://it-assets-management.gbos.app').replace(/\/+$/, '');
    const mail = buildEmail({ title: k.title, facts, groups, summary, timestamp, appUrl });
    await sendMail({ to, subject: mail.subject, html: mail.html });
    if (kind === 'license') await patchData('it_report', NOTIFY_STATE, { licenseSentOn: today }).catch((e) => console.error('notify_state:', e));

    return res.status(200).json({ success: true, channel: k.channel, recipients: to.length });
  } catch (err) {
    console.error('staff-notify error:', err);
    return res.status(500).json({ error: err.message || 'notify failed' });
  }
}
