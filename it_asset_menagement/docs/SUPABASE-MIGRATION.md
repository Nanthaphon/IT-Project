# ย้ายฐานข้อมูลจาก Firebase ไป Supabase

สถานะ: **ระยะที่ 1–3 เสร็จบน branch `supabase-migration`** — เว็บบน branch นี้อ่าน/เขียน Supabase และล็อกอินด้วย Supabase Auth แล้ว
เว็บจริง (main) ยังใช้ Firebase ตามเดิม จนกว่าจะถึงวันสลับระบบ (ระยะที่ 5)

## แนวทางที่เลือก

**ยกเอกสารมาทั้งก้อน** — 1 collection ของ Firestore = 1 ตารางใน Postgres
ฟิลด์ทั้งหมดอยู่ในคอลัมน์ `data` (jsonb) · id เดิมไม่เปลี่ยน · Timestamp เก็บเป็น `{"__ts": "ISO"}`

| | ยกทั้งก้อน (เลือก) | ออกแบบตารางใหม่ทั้งหมด |
|---|---|---|
| เวลา | 2–3 สัปดาห์ | 4–6 สัปดาห์ |
| โค้ดที่ต้องแก้ | ชั้นเชื่อมฐานข้อมูลชั้นเดียว + เปลี่ยน import 14 ไฟล์ | เขียนใหม่ทุกจุดที่อ่าน/เขียน (~180 จุด) |
| ความเสี่ยงพัง | ต่ำ — หน้าจอเดิมทำงานเหมือนเดิม | สูง |
| ภายหลัง | ค่อย ๆ แยกฟิลด์ที่ใช้ค้นบ่อยเป็นคอลัมน์ได้ | — |

**ที่ไม่ย้าย:** หน้าเว็บยังอยู่ Firebase Hosting (ฟรี) · ฟังก์ชันใน `api/` ยังอยู่ Vercel

## ระยะงาน

| | งาน | สถานะ |
|---|---|---|
| 1 | โครงสร้างตาราง + สิทธิ์ (RLS แปลจาก `firestore.rules` ทีละข้อ) · สคริปต์ส่งออก/นำเข้าข้อมูล | ✅ |
| 2 | ชั้นเชื่อม `src/db/compat.js` (หน้าตาเหมือน `firebase/firestore`) + realtime แทน onSnapshot | ✅ |
| 2b | 14 ไฟล์ import จาก `src/db/compat.js` แล้ว · `src/firebase.js` = จุดเชื่อม Supabase (ชื่อไฟล์เดิม) | ✅ |
| 3 | ผู้ดูแล → Supabase Auth · พนักงาน → `api/staff-login` ออก session ของ Supabase · `api/` 9 ไฟล์ใช้ service role | ✅ เทสต์ผ่าน · ✅ เจ้าของล็อกอินผู้ดูแลยืนยัน (10 พ.ย. 2026 — แดชบอร์ด/ทรัพย์สิน/พนักงาน/License โหลดครบ) · ⬜ ล็อกอินพนักงานกับระบบจริง |
| 4 | รูป/ไฟล์แนบ → Supabase Storage (ตอนนี้ยังเก็บ base64 ในเอกสารเหมือนเดิม) | ⬜ |
| 5 | วันสลับระบบ — เช็กลิสต์ด้านล่าง | ⬜ |

## ระบบเข้าสู่ระบบ (ระยะที่ 3)

| ใคร | วิธี | สิทธิ์ (RLS) |
|---|---|---|
| ผู้ดูแล | อีเมล + รหัสผ่าน (Supabase Auth) · `admin_users.id` = uid | มีแถวใน `admin_users` |
| พนักงาน | `api/staff-login` ตรวจรหัสกับ `staff_passwords` (PBKDF2 เดิม) → สร้าง/ปรับบัญชี → ออก session (`generateLink` + `verifyOtp` ไม่ส่งอีเมล) → หน้าเว็บ `setSession` | `app_metadata = { app_role: 'staff', emp_id, emp_doc_id }` |
| HR | อีเมล + รหัสผ่าน · ตั้ง `app_metadata.app_role = 'hr'` (ดูด้านล่าง) | อ่านได้ เขียนไม่ได้ |

- บัญชีพนักงาน: uid คงที่ต่อพนักงาน (คำนวณจาก id เอกสาร) · อีเมลสังเคราะห์ `staff-<uid>@staff.itasset.invalid` (ไม่มีกล่องจดหมายจริง เปลี่ยนโดเมนได้ด้วย env `STAFF_EMAIL_DOMAIN`)
- **สิทธิ์เข้มกว่า Firebase:** "login แล้ว" ต้องเป็นคนที่ระบบรู้จัก (ผู้ดูแล / พนักงานที่ยังทำงาน / hr) — บัญชีที่สมัครเองอ่านอะไรไม่ได้
  พนักงานที่ถูกลบ หรือถึงวันที่ออก หมดสิทธิ์ทันทีแม้ยังค้างหน้าจอไว้ (migration `20261110000500_staff_auth.sql`)
- "ลืมรหัสผ่าน" (ผู้ดูแล) ส่งอีเมลลิงก์ → เปิดลิงก์แล้วหน้าเว็บขึ้นหน้าต่าง "ตั้งรหัสผ่านใหม่" (ไม่ต้องกรอกรหัสเดิม)
- `npm run dev` รันฟังก์ชัน `api/` ในเครื่องเอง (vite.config.js) ต่อ Supabase ด้วยค่าลับใน `.env.migration.local` — ไม่ proxy ไป Vercel แล้ว

## สิ่งที่เจ้าของต้องทำ — ตอนนี้ (ก่อนวันสลับ)

1. **รันสิทธิ์ชุดใหม่** — Supabase → SQL Editor → New query → วางเนื้อหาไฟล์ `supabase/migrations/20261110000500_staff_auth.sql` → Run
   (ต้องมีก่อนพนักงานล็อกอินได้ · ผู้ดูแลล็อกอินได้แม้ยังไม่รัน)
2. **ปิดการสมัครบัญชีเอง** — Authentication → Sign In / Providers → ปิด **Allow new users to sign up** → Save
   (บัญชีผู้ดูแล/พนักงานสร้างผ่านระบบหลังบ้าน ไม่กระทบ)
3. **ตั้งรหัสผ่านผู้ดูแลของตัวเอง** — SQL Editor → New query → วางแล้วแก้ 2 จุดในเครื่องหมาย ' ' → Run
   ```sql
   update auth.users
   set encrypted_password = extensions.crypt('รหัสผ่านใหม่ของคุณ', extensions.gen_salt('bf')), updated_at = now()
   where email = 'อีเมลผู้ดูแลของคุณ';
   ```
   ขึ้น "Success. 1 rows affected" = ใช้ได้ · ผู้ดูแลคนอื่นตั้งให้ได้จากหน้า "จัดการผู้ใช้" → ปุ่มรีเซ็ตรหัสผ่าน หลังคุณเข้าระบบได้แล้ว
4. **ลิงก์ "ลืมรหัสผ่าน"** — Authentication → URL Configuration → Site URL = ที่อยู่เว็บจริง · Redirect URLs เพิ่ม `http://localhost:5173/**`

## เช็กลิสต์วันสลับระบบ (ระยะที่ 5)

ทำนอกเวลางาน · ใช้เวลาราว 1 ชม. · **ทุกขั้นเจ้าของสั่งเอง**

1. ☐ ประกาศหยุดแก้ข้อมูล (เว็บเดิมยังเปิดอ่านได้)
2. ☐ ส่งออกจาก Firebase (อ่านอย่างเดียว)
   ```powershell
   node scripts/supabase/export-firestore.mjs --prod
   ```
3. ☐ ล้างข้อมูลซ้อมใน Supabase — SQL Editor (บัญชีเข้าสู่ระบบไม่ถูกลบ uid เดิมใช้ต่อได้)
   ```sql
   truncate settings, it_report, assets, accessories, licenses, office_supplies, bundled_items,
     employees, employee_secrets, deleted_employees, repair_requests, supply_requests,
     replacement_requests, accessory_requests, assets_transactions, accessories_transactions,
     licenses_transactions, transaction_attachments, asset_purchase_docs, printed_documents,
     staff_passwords, line_users, admin_users, asset_handovers, doc_chunks;
   ```
4. ☐ นำเข้า + ตรวจ
   ```powershell
   node scripts/supabase/import-to-supabase.mjs .supabase-export\firestore-xxx.json --dry-run
   node scripts/supabase/import-to-supabase.mjs .supabase-export\firestore-xxx.json
   npm run verify:supabase -- .supabase-export\firestore-xxx.json
   npm run smoke:supabase
   ```
5. ☐ ตั้งค่า Vercel (ตารางด้านล่าง) → merge branch `supabase-migration` เข้า main → Vercel deploy ฟังก์ชัน `api/`
   ⚠️ ฟังก์ชัน `api/` ชุดใหม่ใช้กับหน้าเว็บชุดใหม่เท่านั้น — deploy หน้าเว็บ (ข้อ 6) ต่อทันที ห้ามทิ้งห่าง
6. ☐ build หน้าเว็บด้วยค่า Supabase (`.env.local` มี `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`) → `npm run build` → `firebase deploy --only hosting`
7. ☐ ผู้ดูแลทุกคนตั้งรหัสผ่านใหม่ (รหัสผ่านผู้ดูแลจาก Firebase ย้ายไม่ได้) — SuperAdmin ตั้งให้จากหน้า "จัดการผู้ใช้" · พนักงานใช้รหัสเดิมได้เลย
8. ☐ ทดสอบ: ผู้ดูแลเข้าได้ทุกเมนู · พนักงาน 1 คนเข้าได้ แจ้งซ่อมได้ · แจ้งเตือน Teams เข้า
9. ☐ Firebase เก็บไว้อ่านอย่างเดียว 30 วันเผื่อย้อนกลับ (ย้อนกลับ = deploy main รุ่นก่อน merge)

### ค่าที่ต้องใส่ใน Vercel (Settings → Environment Variables → Production)

| ชื่อ | ค่า | |
|---|---|---|
| `SUPABASE_URL` | Project URL (`https://xxxx.supabase.co`) | ใหม่ |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (Project Settings → API Keys) — **ห้ามส่งในแชท** | ใหม่ |
| `VITE_SUPABASE_URL` · `VITE_SUPABASE_ANON_KEY` | ค่าเดียวกับ `.env.local` (เปิดเผยได้) — Vercel build หน้าเว็บด้วย ไม่ใส่ = หน้าเว็บบน Vercel ขาว | ใหม่ |
| `STAFF_EMAIL_DOMAIN` | ไม่ต้องใส่ (ค่าเริ่มต้น `staff.itasset.invalid`) — ห้ามเปลี่ยนหลังใช้งานจริง | ไม่บังคับ |
| `ALLOWED_ORIGINS` · `TEAMS_IT_WEBHOOK_URL` · `TEAMS_HR_WEBHOOK_URL` | ค่าเดิม | คงไว้ |
| `FIREBASE_SERVICE_ACCOUNT` | ลบได้หลังสลับครบ 30 วัน | เลิกใช้ |

ค่าที่หน้าเว็บใช้ (ตอน build — `.env.local` / `.env.production`): `VITE_SUPABASE_URL` · `VITE_SUPABASE_ANON_KEY` · `VITE_VERCEL_API_URL` (ถ้าหน้าเว็บไม่ได้อยู่ `*.web.app`)

## บัญชี HR (ถ้ามี)

Firebase เดิมนับอีเมลที่ขึ้นต้น `hr@` และไม่อยู่ใน `admin_users` เป็น HR · บน Supabase ต้องสร้างบัญชีแล้วติดป้าย:
Authentication → Users → Add user (อีเมล + รหัสผ่าน · ติ๊ก Auto Confirm) แล้ว SQL Editor:
```sql
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"app_role":"hr"}' where email = 'hr@...';
```

## คำสั่ง

```bash
npm run test:supabase      # ตาราง + สิทธิ์ + ชั้นเชื่อม (PGlite) + ฟังก์ชัน api/ บน Supabase จำลอง — ไม่ต้องมีบัญชี
npm run smoke:supabase     # ตรวจโปรเจคจริงแบบไม่ login (ไม่เขียนข้อมูล)
npm run verify:supabase -- <ไฟล์ export>   # เทียบข้อมูลที่นำเข้ากับไฟล์ส่งออก
node scripts/supabase/export-firestore.mjs --prod          # ส่งออกจาก Firebase จริง
node scripts/supabase/import-to-supabase.mjs <ไฟล์> [--dry-run]
```

## ไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `supabase/migrations/*.sql` · `supabase/setup.sql` (รวมทุกไฟล์) | ตาราง · สิทธิ์ · doc_write · คอลัมน์ดู · view report · ระบบล็อกอิน (0500) |
| `src/firebase.js` | จุดเชื่อมของแอป: `db` (compat) · `auth` · `VERCEL_API_BASE` — ไม่มี Firebase แล้ว |
| `src/db/compat.js` | คำสั่งแบบ Firestore บน Supabase — ข้อต่างจาก Firestore เขียนไว้หัวไฟล์ |
| `src/db/auth.js` | ล็อกอินแบบหน้าตา `firebase/auth` (currentUser / getIdToken / onAuthStateChanged) บน Supabase Auth |
| `src/db/supabaseClient.js` · `supabaseBackend.js` · `codec.js` | client + backend realtime + แปลง Timestamp |
| `api/_lib/supabaseAdmin.js` | ตัวช่วยร่วมของฟังก์ชัน: service role · ตรวจ token · อ่าน/เขียนตาราง · hash รหัสพนักงาน |
| `api/create-admin-user.js` | (ใหม่) สร้างบัญชีผู้ดูแล — แทน secondary Firebase app ในหน้าจัดการผู้ใช้ |
| `scripts/supabase/schema.test.mjs` · `compat.test.mjs` · `api.test.mjs` | เทสต์สิทธิ์ · ชั้นเชื่อม · ฟังก์ชัน api/ |

## สิ่งที่ต้องรู้

- **รหัสผ่านผู้ดูแลย้ายไม่ได้** — ผู้ดูแลทุกคนตั้งรหัสใหม่ครั้งเดียว · รหัสพนักงาน (`staff_passwords`) ใช้ต่อได้ (สูตร hash เดิม มีเทสต์)
- **รูป** ยังเก็บ base64 ในเอกสาร (`utils/uploadPhoto.js`) — ระยะที่ 4 ย้ายไป Storage
- **staff แก้ข้อมูลตัวเอง / ให้คะแนนแจ้งซ่อม** — RLS เทียบค่าเก่ากับใหม่ไม่ได้ จึงตรวจด้วย trigger (`app.guard_*`)
- **ล็อกอินพนักงานพร้อมกันจำนวนมาก** — ทุกครั้งผ่าน `verify` ของ Supabase Auth จากเครื่อง Vercel
  ถ้าเจอข้อความ rate limit ให้เพิ่ม "Token verifications" ที่ Authentication → Rate Limits
- `npm run emu` / `dev:emu` / `test:rules` ใช้กับรุ่น Firebase (branch main) เท่านั้น
- พบระหว่างทำ: `firestore.rules` ไม่มีสิทธิ์ให้ subcollection `chunks` ของ `transaction_attachments` / `asset_purchase_docs`
  — บน Firebase อาจบันทึกไม่ได้อยู่แล้ว · ฝั่ง Supabase ให้ admin เขียนได้
