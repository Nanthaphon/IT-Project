// Vercel serverless function — LINE Messaging API Webhook
// LINE จะเรียก endpoint นี้ทุกครั้งที่บอตได้รับ event (เช่น user ส่งข้อความหา)
// หน้าที่: เก็บ userId + displayName ลง Firestore collection `line_users`
// → admin จะหยิบ userId ไปตั้งเป็น IT/HR ในเมนู "ตั้งค่าระบบ" ได้
import admin from 'firebase-admin';
import crypto from 'crypto';

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

// ต้องอ่าน raw body เพื่อ verify signature
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

function verifyLineSignature(rawBody, signature) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) {
    console.warn('LINE_CHANNEL_SECRET not set — skip signature verification');
    return true;
  }
  if (!signature) return false;
  const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  return hash === signature;
}

async function fetchLineProfile(userId) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !userId) return null;
  try {
    const r = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (err) {
    console.error('fetchLineProfile failed:', err.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // GET → ใช้ทดสอบว่าเปิดเปลี่ยนยังไง ผ่าน browser
    return res.status(200).send('LINE webhook is alive');
  }

  if (!admin.apps.length) return res.status(500).send('Firebase Admin not initialized');

  let rawBody;
  try { rawBody = await readRawBody(req); }
  catch (err) { return res.status(400).send('Cannot read body'); }

  const signature = req.headers['x-line-signature'];
  if (!verifyLineSignature(rawBody, signature)) {
    return res.status(401).send('Invalid signature');
  }

  let payload;
  try { payload = JSON.parse(rawBody.toString('utf8')); }
  catch { return res.status(400).send('Invalid JSON'); }

  const events = Array.isArray(payload.events) ? payload.events : [];

  for (const ev of events) {
    const userId = ev?.source?.userId;
    if (!userId) continue;

    // 🔒 บันทึกเฉพาะ chat ส่วนตัว (1-on-1 กับบอต) — ไม่บันทึก userId จากกลุ่ม/ห้องแชต
    // source.type: 'user' = direct chat, 'group' = LINE group, 'room' = multi-person chat
    const sourceType = ev?.source?.type;
    if (sourceType !== 'user') {
      // ข้าม event จาก group/room — ไม่เก็บข้อมูล userId
      continue;
    }

    // ดึง profile (ชื่อ + รูป) — best-effort
    const profile = await fetchLineProfile(userId);

    try {
      await admin.firestore().collection('line_users').doc(userId).set({
        userId,
        displayName: profile?.displayName || '',
        pictureUrl: profile?.pictureUrl || '',
        lastEventType: ev.type || 'unknown',
        lastMessage: ev.type === 'message' && ev.message?.type === 'text' ? (ev.message.text || '') : '',
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        sourceType: 'user',  // ⓘ บันทึกที่มา — จะมีเฉพาะ direct chat
      }, { merge: true });
    } catch (err) {
      console.error('save line_user failed:', err.message);
    }

    // ตอบกลับ 4 กรณี:
    //   1. Follow event → welcome + link + user ID
    //   2. Keyword ขอ User ID: "userid" / "myid" / "ไอดี"
    //   3. Keyword ขอลิงก์ระบบ: contains "ระบบ" / "link" / "เว็บ" ฯลฯ
    //   4. Fallback: text message อื่นๆ ที่ user ส่งมา → ตอบ menu ช่วยเหลือ
    const SYSTEM_URL = process.env.SYSTEM_URL || 'https://it-asset-management-dc883.web.app';
    const isFollow = ev.type === 'follow';
    const isText = ev.type === 'message' && ev.message?.type === 'text';
    const rawText = isText ? (ev.message.text || '').trim() : '';
    const text = rawText.toLowerCase();

    // ID request — match ทั้งเป๊ะและ contain
    const idKeywords = ['userid', 'user id', 'myid', 'my id', 'ไอดี', 'ยูสไอดี', 'ไอดีของ', 'my id?'];
    const isIdRequest = idKeywords.some(k => text === k || text.includes(k));

    // 🆕 Link request — เช็คแบบ contain ให้ยืดหยุ่นขึ้น (รองรับ "เข้าระบบหน่อย" ฯลฯ)
    const linkKeywords = [
      'เข้าระบบ', 'เข้าสู่ระบบ', 'ระบบ', 'ลิ้งค์', 'ลิงก์', 'ลิงค์', 'link',
      'website', 'เว็บ', 'เว็บไซต์', 'login', 'menu', 'เมนู', 'เริ่ม', 'start',
      'home', 'ไปที่ระบบ', 'ช่วย', 'help', 'ช่วยเหลือ',
    ];
    const isLinkRequest = linkKeywords.some(k => text === k || text.includes(k));

    // 🆕 fallback: text ใดๆ ที่ไม่ตรง keyword → ตอบ menu ช่วยเหลือ (เฉพาะข้อความอย่างเดียว ไม่ใช่ sticker/รูป)
    const isFallback = isText && !isFollow && !isIdRequest && !isLinkRequest;

    if (isFollow || isIdRequest || isLinkRequest || isFallback) {
      const replyToken = ev.replyToken;
      const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (replyToken && token) {
        // Flex message with button — ลิงก์เข้าระบบ
        const linkFlex = {
          type: 'flex',
          altText: 'ระบบ IT Asset Management',
          contents: {
            type: 'bubble',
            size: 'kilo',
            header: {
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#1E487A',
              paddingAll: '16px',
              contents: [
                { type: 'text', text: '🔗 IT Asset Management', color: '#FFFFFF', weight: 'bold', size: 'md' },
                { type: 'text', text: 'ระบบจัดการทรัพย์สิน IT', color: '#DBEAFE', size: 'xs', margin: 'sm' },
              ],
            },
            body: {
              type: 'box',
              layout: 'vertical',
              paddingAll: '14px',
              spacing: 'md',
              contents: [
                { type: 'text', text: 'กดปุ่มด้านล่างเพื่อเข้าสู่ระบบ', size: 'sm', color: '#475569', wrap: true },
                {
                  type: 'button',
                  style: 'primary',
                  color: '#1E487A',
                  height: 'sm',
                  action: { type: 'uri', label: '🚀 เข้าสู่ระบบ', uri: SYSTEM_URL },
                },
                { type: 'separator', margin: 'sm' },
                { type: 'text', text: '💡 พิมพ์ "userid" เพื่อดู User ID ของคุณ', size: 'xxs', color: '#94A3B8', wrap: true },
              ],
            },
          },
        };

        let messages;
        if (isFollow) {
          messages = [
            { type: 'text', text: `🎉 ยินดีต้อนรับสู่ GB-ANEK!\n\nนี่คือ LINE OA ของระบบ IT Asset Management\n\n📌 User ID ของคุณ:\n${userId}\n\n(แจ้งแอดมินเพื่อรับการแจ้งเตือนอัตโนมัติ)` },
            linkFlex,
          ];
        } else if (isIdRequest) {
          messages = [
            { type: 'text', text: `🆔 User ID ของคุณ:\n${userId}\n\nแจ้งแอดมินนำไปตั้งค่าในระบบได้เลย` },
          ];
        } else if (isLinkRequest) {
          messages = [linkFlex];
        } else {
          // isFallback — text อื่นๆ → ตอบ menu ช่วยเหลือ + link
          messages = [
            { type: 'text', text: `💡 พิมพ์คำสั่งเหล่านี้:\n\n• "ระบบ" — รับลิงก์เข้าระบบ\n• "userid" — ดู User ID ของคุณ` },
            linkFlex,
          ];
        }

        try {
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ replyToken, messages }),
          });
        } catch (err) { console.error('LINE reply failed:', err.message); }
      }
    }
  }

  return res.status(200).send('OK');
}
