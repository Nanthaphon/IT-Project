# Security Hardening Deployment Guide

หลังจากแก้ 5 จุดวิกฤต (C1+C2, C3+C4, M10, C5+M1, H1) ต้อง deploy ตามขั้นตอนนี้ทั้งหมด ห้ามข้าม

## 1. ตั้ง Cloud Function secrets

```bash
cd functions
firebase functions:secrets:set TEAMS_WEBHOOK_URL
firebase functions:secrets:set EMAILJS_SERVICE_ID
firebase functions:secrets:set EMAILJS_TEMPLATE_ID
firebase functions:secrets:set EMAILJS_PUBLIC_KEY
firebase functions:secrets:set EMAILJS_PRIVATE_KEY   # optional ถ้าเปิด "Restrict to server-side" บน EmailJS dashboard
```

แต่ละคำสั่งจะถามค่าให้พิมพ์ครั้งเดียว ไม่ถูกบันทึกใน source

## 2. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

จะ deploy 8 ฟังก์ชัน:
- `notifyRepairRequest`, `notifySupplyRequest`, `notifyReplacementRequest` — ส่ง Teams + email อัตโนมัติ
- `cascadeDeleteEmployee`, `cascadeDeleteAsset`, `cascadeDeleteLicense`, `cascadeDeleteAccessory` — ลบข้อมูลที่ผูกอยู่
- `setStaffPassword` — admin ตั้ง/รีเซ็ตรหัสผ่านพนักงาน
- `staffLogin` — staff login (ส่ง custom token)
- `setUserPassword` — admin reset password (เดิม)

## 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

⚠️ **หลัง deploy rule ใหม่ — staff ทั้งหมดจะ login ไม่ได้จนกว่า admin จะตั้งรหัสผ่านให้** ดูข้อ 5

## 4. ตั้ง Vercel env vars

ไปที่ Vercel Dashboard → Project Settings → Environment Variables เพิ่ม (scope = Production + Preview):

| ชื่อ | ค่า |
|------|-----|
| `ALLOWED_ORIGINS` | `https://yourdomain.com,https://yourdomain.vercel.app` (ใส่ domain ที่ใช้จริง คั่นด้วย comma) |
| `EMAILJS_SERVICE_ID` | จาก EmailJS dashboard |
| `EMAILJS_TEMPLATE_ID` | จาก EmailJS dashboard |
| `EMAILJS_PUBLIC_KEY` | จาก EmailJS dashboard |
| `EMAILJS_PRIVATE_KEY` | จาก EmailJS dashboard (Account → API Keys → Private Key) |
| `TEAMS_WEBHOOK_URL` | Power Automate URL |
| `FIREBASE_SERVICE_ACCOUNT` | JSON ทั้งก้อนจาก Firebase Console → Service Accounts → Generate new private key (มีอยู่แล้ว) |

แล้ว redeploy:
```bash
git push   # Vercel จะ redeploy อัตโนมัติ
```

## 5. ตั้งรหัสผ่านให้พนักงานทุกคน (one-time migration)

หลัง deploy เสร็จ:
1. Login เข้าระบบในฐานะ admin
2. ไปที่ "พนักงาน" → คลิกพนักงานคนหนึ่ง → tab "ข้อมูลทั่วไป"
3. เลื่อนลงมาที่ section "รหัสผ่านเข้าใช้ระบบ (Staff Portal)"
4. ใส่รหัสผ่านใหม่ → ยืนยัน → กด "ตั้งรหัสผ่าน"
5. แจ้งรหัสผ่านให้พนักงานทาง Teams DM หรือ ซองปิดผนึก (อย่าส่งทาง email!)
6. ทำซ้ำกับพนักงานทุกคน

ถ้าพนักงานยังไม่ได้ตั้งรหัสผ่าน เวลา login จะขึ้น **"ยังไม่ได้ตั้งรหัสผ่าน กรุณาติดต่อ IT"**

## 6. ทำความสะอาด (optional)

ลบไฟล์/dependency ที่ไม่ใช้แล้ว:
```bash
npm uninstall @emailjs/browser    # ย้ายไป Cloud Function แล้ว
```

---

## สรุปสิ่งที่เปลี่ยน

### 🔴 C1+C2 — Firestore Rules
- ทุก collection ต้อง login ก่อนอ่าน (เดิม public read)
- `staff_passwords` block ทุก client access (เฉพาะ Cloud Function แตะได้)
- Employee update: admin = ทุกฟิลด์, staff = เฉพาะ profile fields ของตัวเอง

### 🔴 C3+C4 — Staff Login + M365 Password
- Login form มี `รหัสผ่าน` field
- Cloud Function `staffLogin` ตรวจรหัสผ่าน (PBKDF2 100k iterations + salt) แล้วส่ง custom token
- Firebase signInWithCustomToken → staff มี `role: 'staff'` claim
- M365 Password ใน UI ซ่อนเป็น ••••• พร้อม eye icon เพื่อกดเปิด + copy button

### 🟡 M10 — HTML Escape Print Forms
- เพิ่ม `src/utils/htmlEscape.js` (`e()` + `safeUrl()`)
- ห่อทุก interpolation ของค่าจาก database ใน print forms 4 ไฟล์

### 🔴 C5+M1 — EmailJS + Teams Serverless
- EmailJS keys ย้ายจาก bundle ไป env vars บน Cloud Function + Vercel
- `/api/send-email`, `/api/notify-teams`, `/api/set-password` ทุก endpoint ต้อง:
  - Verify Firebase ID token
  - ตรวจว่าเรียกจาก admin
  - จำกัด origin ตาม `ALLOWED_ORIGINS`
- Staff submission emails ย้ายไป Cloud Function trigger (ไม่ผ่าน frontend แล้ว)

### 🟠 H1 — Cascade Delete
- เพิ่ม Cloud Function triggers: `cascadeDeleteEmployee/Asset/License/Accessory`
- ลบพนักงาน → ลบ requests + transactions อัตโนมัติ
- ลบ asset → ลบ transactions + purchase docs + revoke device-bound licenses
- ลบ license/accessory → ลบ transactions

---

## เช็คก่อนเปิดใช้งานจริง

- [ ] ทดสอบ admin login ปกติ
- [ ] ทดสอบ staff login (ตั้งรหัสผ่านแล้วลอง login)
- [ ] ทดสอบส่งใบแจ้งซ่อมจากฝั่ง staff → ดู Teams + email ว่ามาหรือไม่
- [ ] ทดสอบลบพนักงาน → ดู Firestore ว่า requests/transactions ของเขาหายไปด้วย
- [ ] ทดสอบพิมพ์ใบส่งมอบ — ลองใส่ `<script>alert(1)</script>` ใน note field, ดูว่าไม่รัน JS
- [ ] เช็ค `/api/send-email` ผ่าน DevTools → ไม่มี EmailJS key ใน bundle.js
