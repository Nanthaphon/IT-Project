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

**Hosting:** หน้าเว็บ + ฟังก์ชัน `api/` อยู่โปรเจคเดียวบน **Vercel ทีมบริษัท `globe-syndicate`** (ดูหัวข้อ "ย้าย hosting ไป Vercel ทีมบริษัท")
Firebase Hosting (`*.web.app`) เหลือเป็นหน้าพาไปที่อยู่ใหม่หลังวันสลับ

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

## ย้าย hosting ไป Vercel ทีมบริษัท (globe-syndicate)

ทีม Globe Syndicate เป็นแพ็กเกจ **Hobby** — เพิ่มสมาชิกไม่ได้ จึง "โอนโปรเจคเดิม" จากบัญชีส่วนตัวเข้ามาไม่ได้
**วิธีที่ใช้: สร้างโปรเจคใหม่ในทีมบริษัท (Import จาก GitHub) แล้ววันสลับย้ายโดเมน `itassetmenagement.vercel.app` มาไว้ที่โปรเจคใหม่**

- **QR บนสติกเกอร์ที่พิมพ์แล้วชี้โดเมนนี้** — ย้ายโดเมนตามมา สติกเกอร์ใช้ได้ต่อ (ช่วงย้ายเว็บว่างไม่กี่นาที ทำนอกเวลางาน)
- โปรเจคเดิมในบัญชีส่วนตัวเก็บไว้ไม่แตะ = ทางย้อนกลับ (ย้ายโดเมนกลับ)
- ⚠️ เงื่อนไข Vercel: Hobby สำหรับใช้ส่วนตัวไม่ใช่เชิงพาณิชย์ — ระบบภายในบริษัทควรอัปเป็น Pro ($20/คน/เดือน) เมื่อพร้อม
  อัปแล้วไม่ต้องย้ายอะไรใหม่ · ข้อจำกัด Hobby ที่เกี่ยว: ฟังก์ชันไม่เกิน 12 (ใช้ 9) · ไม่มีแจ้งเตือนการใช้งาน

สิ่งที่ตั้งไว้ในโค้ดแล้ว (`vercel.json`): build Vite → `dist` · ฟังก์ชันรันที่ **สิงคโปร์ (`sin1`)** ใกล้ฐานข้อมูล Supabase
(เดิมค่าเริ่มต้นสหรัฐฯ — ทุกคำขอข้ามมหาสมุทร) · header ความปลอดภัย · แคชไฟล์ `/assets` ถาวร · `/api` ไม่แคช
หน้าเว็บกับ `api/` อยู่ host เดียวกัน → เรียก `/api/...` ตรง ๆ ไม่ติด CORS (`ALLOWED_ORIGINS` ไม่จำเป็นแล้ว)

### ขั้นตอนสร้างโปรเจค (เจ้าของทำ — ล็อกอิน Vercel ทีม Globe Syndicate)

1. Projects → **Import Project** → **Import** → เลือก GitHub → repo `IT-Project`
   (ไม่เห็น repo = กด "Adjust GitHub App Permissions" แล้วอนุญาต repo นี้ · ล็อกอิน GitHub บัญชี Nanthaphon)
2. หน้า Configure Project
   - Project Name: `it-asset-management`
   - **Root Directory: กด Edit → เลือกโฟลเดอร์ `it_asset_menagement`** (สำคัญ — ไม่งั้น build ไม่เจอโปรเจค)
   - Framework Preset: Vite (ขึ้นเอง) · Build/Output ไม่ต้องแก้
   - Environment Variables: ใส่ตามตาราง "ค่าที่ต้องใส่ใน Vercel" ด้านล่าง
   - กด **Deploy**
3. deploy แรกจะเป็น branch `main` (รุ่น Firebase ที่ยังไม่มี `FIREBASE_SERVICE_ACCOUNT`) — URL นี้ยังไม่มีใครใช้ ไม่เป็นไร
4. Settings → Environment Variables: ติ๊ก **Preview** ให้ทุกค่าด้วย — ใช้ทดสอบ branch `supabase-migration` บน Vercel จริงก่อนวันสลับ
   (หลังเจ้าของสั่ง push branch นี้ Vercel สร้าง Preview URL ให้เอง · ดูได้เฉพาะคนที่ล็อกอิน Vercel ทีมนี้)
5. **(ไม่บังคับ) โดเมนบริษัท** — Settings → Domains → Add (เช่น `it.บริษัท.co.th`) แล้วให้ฝ่ายดูแล DNS เพิ่ม record ตามที่ Vercel บอก
   แล้วตั้ง env `VITE_PUBLIC_APP_URL` = โดเมนนั้น (สติกเกอร์ใหม่ชี้โดเมนบริษัท · `itassetmenagement.vercel.app` ต้องเปิดไว้ให้สติกเกอร์เก่า)
   และเพิ่มโดเมนใน Supabase → Authentication → URL Configuration


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
4. **ลิงก์ "ลืมรหัสผ่าน"** — Authentication → URL Configuration → Site URL = `https://itassetmenagement.vercel.app` · Redirect URLs เพิ่ม `http://localhost:5173/**`

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
5. ☐ merge branch `supabase-migration` เข้า main แล้ว push → โปรเจคใหม่ในทีมบริษัท deploy หน้าเว็บ + `api/` พร้อมกัน
   เปิด URL ของโปรเจคใหม่ ล็อกอินผู้ดูแลได้ก่อนค่อยไปต่อ
   **ย้ายโดเมน** (ทำติดกัน ช่วงว่างไม่กี่นาที): โปรเจคเดิม (บัญชีส่วนตัว) → Settings → Domains → ลบ `itassetmenagement.vercel.app`
   → โปรเจคใหม่ (Globe Syndicate) → Settings → Domains → Add `itassetmenagement.vercel.app` → สแกน QR สติกเกอร์ 1 ใบ
6. ☐ เปลี่ยน Firebase Hosting เป็นหน้าพาไปที่อยู่ใหม่ (กันคนเปิดลิงก์ `*.web.app` ที่บันทึกไว้ แล้วไปแก้ข้อมูลใน Firebase เก่า)
   ```powershell
   firebase deploy --only hosting --config firebase.redirect.json
   ```
7. ☐ ผู้ดูแลทุกคนตั้งรหัสผ่านใหม่ (รหัสผ่านผู้ดูแลจาก Firebase ย้ายไม่ได้) — SuperAdmin ตั้งให้จากหน้า "จัดการผู้ใช้" · พนักงานใช้รหัสเดิมได้เลย
8. ☐ ทดสอบ: ผู้ดูแลเข้าได้ทุกเมนู · พนักงาน 1 คนเข้าได้ แจ้งซ่อมได้ · แจ้งเตือน Teams เข้า
9. ☐ Firebase เก็บไว้อ่านอย่างเดียว 30 วันเผื่อย้อนกลับ
   ย้อนกลับ = ย้ายโดเมน `itassetmenagement.vercel.app` กลับไปโปรเจคเดิมในบัญชีส่วนตัว (ยังเป็นรุ่น Firebase ไม่ถูกแตะ) · ห้ามลบโปรเจคเดิมจนครบ 30 วัน

### ค่าที่ต้องใส่ใน Vercel ทีมบริษัท (โปรเจคใหม่ → Settings → Environment Variables → Production + Preview)

| ชื่อ | ค่า | |
|---|---|---|
| `SUPABASE_URL` | Project URL (`https://xxxx.supabase.co`) | ใหม่ |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (Project Settings → API Keys) — **ห้ามส่งในแชท** | ใหม่ |
| `VITE_SUPABASE_URL` · `VITE_SUPABASE_ANON_KEY` | ค่าเดียวกับ `.env.local` (เปิดเผยได้) — Vercel build หน้าเว็บด้วย ไม่ใส่ = หน้าเว็บบน Vercel ขาว | ใหม่ |
| `STAFF_EMAIL_DOMAIN` | ไม่ต้องใส่ (ค่าเริ่มต้น `staff.itasset.invalid`) — ห้ามเปลี่ยนหลังใช้งานจริง | ไม่บังคับ |
| `TEAMS_IT_WEBHOOK_URL` · `TEAMS_HR_WEBHOOK_URL` | คัดลอกจากโปรเจคเดิม (บัญชีส่วนตัว → Settings → Environment Variables) | คัดลอก |
| `VITE_PUBLIC_APP_URL` | ไม่ต้องใส่ จนกว่าจะมีโดเมนบริษัท (ค่าเริ่มต้น `https://itassetmenagement.vercel.app`) | ไม่บังคับ |
| `ALLOWED_ORIGINS` · `VITE_VERCEL_API_URL` | ไม่จำเป็นแล้ว (หน้าเว็บกับ api อยู่ host เดียวกัน) — คงไว้ไม่เสียหาย | เลิกใช้ |
| `FIREBASE_SERVICE_ACCOUNT` | ไม่ต้องใส่ในโปรเจคใหม่ (อยู่ที่โปรเจคเดิมเผื่อย้อนกลับ) | เลิกใช้ |

หน้าเว็บ build บน Vercel เอง ใช้ค่า `VITE_*` จากตารางนี้ (ไม่ใช้ `.env.local` ในเครื่อง)

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
| `vercel.json` | hosting บน Vercel ทีมบริษัท: build · ภูมิภาค sin1 · header · แคช · rewrite หน้าเว็บ |
| `firebase.redirect.json` · `hosting-redirect/` | วันสลับ: Firebase Hosting พาไปที่อยู่ใหม่ (คง path + `?asset=`) |
| `src/utils/publicUrl.js` | ที่อยู่สาธารณะสำหรับ QR สติกเกอร์ (`VITE_PUBLIC_APP_URL`) |
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
