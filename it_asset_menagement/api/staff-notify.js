// Vercel serverless function — ส่ง LINE notification ไปยังผู้รับผิดชอบ
// เรียกได้จาก user ที่ login (role: 'staff' หรือ 'admin')
// ใช้ LINE Messaging API (Push) ส่งหา userId ที่ตั้งไว้ใน settings/notifications
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var ไม่ได้ถูกตั้งค่า');
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (err) {
    console.error('Firebase Admin init failed:', err);
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const defaults = ['http://localhost:5173', 'http://localhost:4173'];
  return allowed.includes(origin) || defaults.includes(origin);
}

const VALID_KINDS = new Set(['repair', 'supply', 'replacement', 'license', 'accessory_request']);

// 🆕 แยก User ID เป็นหลายคน — รองรับทั้ง newline และเครื่องหมาย ","
function parseUserIds(raw) {
  return String(raw || '')
    .split(/[\n,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

async function getRecipients() {
  try {
    const snap = await admin.firestore().doc('settings/notifications').get();
    const data = snap.exists ? snap.data() : {};
    return {
      it: parseUserIds(data.itLineUserId),
      hr: parseUserIds(data.hrLineUserId),
    };
  } catch {
    return { it: [], hr: [] };
  }
}

// สร้าง Flex Message ที่สวยงาม — ใช้ field มาตรฐานเท่านั้น
function buildFlexMessage({ title, emoji, color, facts, timestamp }) {
  // แต่ละ fact = 1 row (label + value)
  const factBoxes = facts.map(f => ({
    type: 'box',
    layout: 'horizontal',
    margin: 'md',
    contents: [
      {
        type: 'text',
        text: String(f.label || ''),
        size: 'sm',
        color: '#6B7280',
        flex: 4,
        wrap: true,
      },
      {
        type: 'text',
        text: String(f.value || '-'),
        size: 'sm',
        color: '#1F2937',
        weight: 'bold',
        flex: 6,
        wrap: true,
      },
    ],
  }));

  return {
    type: 'flex',
    altText: `${emoji} ${title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: color,
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: `${emoji}  ${title}`,
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
            wrap: true,
          },
          {
            type: 'text',
            text: 'IT Asset Management',
            color: '#DBEAFE',
            size: 'xs',
            margin: 'sm',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: factBoxes,
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        contents: [
          {
            type: 'separator',
            color: '#E5E7EB',
          },
          {
            type: 'text',
            text: `🕐 ${timestamp}`,
            size: 'xs',
            color: '#9CA3AF',
            margin: 'md',
            align: 'center',
          },
        ],
      },
      styles: {
        body: { backgroundColor: '#FFFFFF' },
        footer: { backgroundColor: '#FAFAFA' },
      },
    },
  };
}

// 🆕 ────────────────────────────────────────────────────────────
// Microsoft Teams — Adaptive Card via Power Automate Workflow
// ─────────────────────────────────────────────────────────────
function buildTeamsAdaptiveCard({ title, emoji, color, facts, timestamp }) {
  // Fact rows แต่ละ row เป็น TextBlock 2 คอลัมน์
  const factRows = facts.map(f => ({
    type: 'ColumnSet',
    spacing: 'Small',
    columns: [
      {
        type: 'Column',
        width: '35',
        items: [{
          type: 'TextBlock',
          text: String(f.label || ''),
          wrap: true,
          size: 'Small',
          color: 'Default',
          isSubtle: true,
        }],
      },
      {
        type: 'Column',
        width: '65',
        items: [{
          type: 'TextBlock',
          text: String(f.value || '-'),
          wrap: true,
          size: 'Small',
          weight: 'Bolder',
        }],
      },
    ],
  }));

  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      contentUrl: null,
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        msteams: { width: 'Full' },
        body: [
          {
            type: 'Container',
            style: 'emphasis',
            bleed: true,
            items: [{
              type: 'TextBlock',
              text: `${emoji}  ${title}`,
              size: 'Large',
              weight: 'Bolder',
              color: 'Accent',
              wrap: true,
            },{
              type: 'TextBlock',
              text: 'IT Asset Management',
              size: 'Small',
              isSubtle: true,
              spacing: 'None',
            }],
          },
          {
            type: 'Container',
            spacing: 'Medium',
            items: factRows,
          },
          {
            type: 'TextBlock',
            text: `🕐 ${timestamp}`,
            size: 'Small',
            isSubtle: true,
            horizontalAlignment: 'Center',
            spacing: 'Medium',
          },
        ],
      },
    }],
  };
}

async function sendTeamsMessage(webhookUrl, cardPayload) {
  if (!webhookUrl) throw new Error('Teams webhook URL ไม่ถูกตั้งค่า');
  const r = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardPayload),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Teams webhook ${r.status}: ${t}`);
  }
}

// Push message ผ่าน LINE Messaging API (รองรับทั้ง flex และ text)
async function pushLineMessage(userId, message) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN not configured on Vercel');
  if (!userId) throw new Error('LINE userId ปลายทางว่าง — กรุณาตั้งค่าในเมนู "ตั้งค่าระบบ"');
  const messages = typeof message === 'string' ? [{ type: 'text', text: message }] : [message];
  const r = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`LINE Push ${r.status}: ${t}`);
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!admin.apps.length) return res.status(500).json({ error: 'Firebase Admin not initialized' });

  /* ── ตรวจ caller ต้อง login (staff หรือ admin) ── */
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });
  try { await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }

  try {
    const { kind, facts } = req.body || {};
    if (!VALID_KINDS.has(kind)) return res.status(400).json({ error: 'invalid kind' });
    if (!Array.isArray(facts)) return res.status(400).json({ error: 'invalid facts' });

    const recipients = await getRecipients();

    let title, recipientList, emoji, color, teamsChannel;
    if (kind === 'repair')              { title = 'แจ้งซ่อม / ปัญหา IT';     recipientList = recipients.it; emoji = '🔧'; color = '#1E487A'; teamsChannel = 'it'; }
    if (kind === 'supply')              { title = 'คำขอเบิกอุปกรณ์สำนักงาน'; recipientList = recipients.hr; emoji = '📦'; color = '#047857'; teamsChannel = 'hr'; }
    if (kind === 'replacement')         { title = 'คำขอเปลี่ยนเครื่อง';        recipientList = recipients.it; emoji = '💻'; color = '#B45309'; teamsChannel = 'it'; }
    if (kind === 'license')             { title = 'License ใกล้หมดอายุ';        recipientList = recipients.it; emoji = '⚠️'; color = '#B91C1C'; teamsChannel = 'it'; }
    if (kind === 'accessory_request')   { title = 'คำขออุปกรณ์เสริม';          recipientList = recipients.it; emoji = '🖱'; color = '#0891B2'; teamsChannel = 'it'; }

    const timestamp = new Date().toLocaleString('th-TH', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok',
    });

    // 🆕 ────────────────────────────────────────────────────────
    // ช่องทางแจ้งเตือน — ส่ง Teams ก่อน (ฟรี, ไม่จำกัด)
    //                    LINE เป็น fallback (เผื่อ Teams ล้ม)
    // ─────────────────────────────────────────────────────────
    const teamsUrl = teamsChannel === 'hr'
      ? process.env.TEAMS_HR_WEBHOOK_URL
      : process.env.TEAMS_IT_WEBHOOK_URL;

    const channelResults = {
      teams:  { attempted: false, success: false, error: null },
      line:   { attempted: false, sent: 0, total: 0, failed: 0, error: null },
    };

    // 1) พยายามส่ง Teams
    if (teamsUrl) {
      channelResults.teams.attempted = true;
      try {
        const card = buildTeamsAdaptiveCard({ title, emoji, color, facts, timestamp });
        await sendTeamsMessage(teamsUrl, card);
        channelResults.teams.success = true;
      } catch (err) {
        console.error('Teams push failed:', err.message);
        channelResults.teams.error = err.message;
      }
    }

    // 2) ส่ง LINE (ถ้ามีคนตั้งค่าไว้) — ทำเสมอเพื่อให้ HR/IT รับสอง channel ได้
    if (recipientList && recipientList.length > 0) {
      channelResults.line.attempted = true;
      channelResults.line.total = recipientList.length;
      try {
        const flexMsg = buildFlexMessage({ kind, title, emoji, color, facts, timestamp });
        const results = await Promise.allSettled(
          recipientList.map(uid => pushLineMessage(uid, flexMsg))
        );
        const failed = results.filter(r => r.status === 'rejected');
        channelResults.line.sent = recipientList.length - failed.length;
        channelResults.line.failed = failed.length;
        if (failed.length === recipientList.length) {
          channelResults.line.error = failed[0].reason?.message || 'unknown';
        }
      } catch (err) {
        channelResults.line.error = err.message;
      }
    }

    // สรุปผล — ถือว่าสำเร็จถ้ามีอย่างน้อย 1 ช่องทางส่งผ่าน
    const teamsOk = channelResults.teams.attempted && channelResults.teams.success;
    const lineOk  = channelResults.line.attempted  && channelResults.line.sent > 0;
    const anyOk   = teamsOk || lineOk;

    if (!anyOk) {
      // ทั้งคู่ล้มเหลว (หรือทั้งคู่ไม่ตั้งค่า)
      if (!channelResults.teams.attempted && !channelResults.line.attempted) {
        return res.status(400).json({ error: 'ยังไม่ได้ตั้งค่าช่องทางแจ้งเตือน (Teams หรือ LINE)' });
      }
      const msg = channelResults.teams.error || channelResults.line.error || 'notify failed';
      return res.status(502).json({ error: `แจ้งเตือนล้มเหลว: ${msg}`, detail: channelResults });
    }

    return res.status(200).json({
      success: true,
      channels: channelResults,
    });
  } catch (err) {
    console.error('staff-notify error:', err);
    return res.status(500).json({ error: err.message || 'notify failed' });
  }
}
