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
      }, { merge: true });
    } catch (err) {
      console.error('save line_user failed:', err.message);
    }

    // ตอบกลับเฉพาะ 2 กรณี (เลี่ยงรบกวนคนที่ใช้ OA เพื่อฟังก์ชันอื่น):
    //   1. ผู้ใช้ add OA เป็นเพื่อนครั้งแรก (follow event)
    //   2. ผู้ใช้พิมพ์ keyword "userid" / "myid" / "ไอดี" (กรณีอยากเช็ค)
    const isFollow = ev.type === 'follow';
    const text = ev.type === 'message' && ev.message?.type === 'text' ? (ev.message.text || '').trim().toLowerCase() : '';
    const isIdRequest = ['userid', 'user id', 'myid', 'my id', 'ไอดี', 'id'].includes(text);

    if (isFollow || isIdRequest) {
      const replyToken = ev.replyToken;
      const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (replyToken && token) {
        const msg = isFollow
          ? `🎉 ยินดีต้อนรับสู่ GB-ANEK!\n\nหากต้องการรับการแจ้งเตือนจากระบบ IT Asset Management (เช่น แจ้งซ่อม / เบิกอุปกรณ์) — แอดมินจะใช้ User ID ของคุณตั้งค่าให้\n\nUser ID ของคุณ:\n${userId}\n\n(พิมพ์ "userid" เมื่อใดก็ได้เพื่อดู User ID ใหม่)`
          : `🆔 User ID ของคุณ:\n${userId}\n\nแจ้งแอดมินนำไปตั้งค่าในระบบ IT Asset Management ได้เลย`;
        try {
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ replyToken, messages: [{ type: 'text', text: msg }] }),
          });
        } catch (err) { console.error('LINE reply failed:', err.message); }
      }
    }
  }

  return res.status(200).send('OK');
}
