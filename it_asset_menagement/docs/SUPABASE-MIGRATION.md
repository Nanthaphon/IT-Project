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
| 3b | ความปลอดภัยพนักงาน: เลิกเก็บรหัสอ่านออก · รหัสเริ่มต้น/รีเซ็ตต้องเปลี่ยนก่อนใช้ · จำกัดลองรหัสผิด · "จดจำฉัน" จำแค่รหัสพนักงาน | ✅ โค้ด+เทสต์ (19 พ.ย.) · ⬜ รัน SQL บนโปรเจคจริง |
| 4 | รูป/ไฟล์แนบ → bucket `it-private` (private + signed URL) · หน้าเว็บอ่านไฟล์ base64 เดิมได้ต่อ | ✅ โค้ด+เทสต์ (19 พ.ย.) · ⬜ รัน SQL + ย้ายไฟล์จริง |
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

## Hosting — Vercel ทีมบริษัท `globe-syndicate` (สร้างแล้ว)

| | |
|---|---|
| ทีม | `globe-syndicate` (ล็อกอิน `bd@globesyndicate.co.th`) · แพ็กเกจ **Hobby** |
| โปรเจค | `it-asset-management` (`prj_yRTeKApeqFOtqUxkqaXOLTVChi9o`) |
| โดเมน | **`it-assets-management.gbos.app`** เท่านั้น — ค่าของ `VITE_PUBLIC_APP_URL` · QR สติกเกอร์ใหม่ชี้ที่นี่ |
| deploy | **Vercel CLI จากเครื่อง** (`vercel --prod`) — ยังไม่ได้ผูก GitHub |

### `gbos.app` = โดเมนกลางของบริษัท — 1 โปรเจค 1 subdomain

`gbos.app` จดทะเบียนผ่าน Vercel และใช้ nameserver ของ Vercel → เพิ่ม subdomain ให้โปรเจคไหนก็ได้ ออกใบรับรองเองอัตโนมัติ ไม่ต้องแก้ DNS ที่อื่น
**แต่ 1 โดเมนผูกได้ 1 โปรเจคเท่านั้น** — ระบบอื่นของบริษัทจึงต้องใช้ subdomain ของตัวเอง (`hr.gbos.app`, `crm.gbos.app`, …)

`gbos.app` (apex) ถอดออกจากโปรเจคนี้แล้ว — เก็บไว้ให้เว็บบริษัท/พอร์ทัลภายหลัง (ตอนนี้เปิดแล้วเจอ 404 ของ Vercel ซึ่งปกติ)

**ถอดโดเมนออกจากโปรเจคต้องทำในหน้าเว็บ**: Vercel → โปรเจค → Settings → Domains → แถวนั้น → `Edit` → **Remove**
(อย่าใช้ `vercel domains rm <โดเมน>` — คำสั่งนั้นถอดโดเมนออกจาก**ทั้งทีม** ไม่ใช่แค่โปรเจคนี้)

**`it-asset-management-xi.vercel.app`** = โดเมนแถมที่ Vercel สร้างให้ทุกโปรเจค ลบไม่ได้ (เปลี่ยนได้ด้วยการเปลี่ยนชื่อโปรเจคเท่านั้น)
ไม่ต้องสนใจ ไม่มีใครรู้ URL นี้นอกจากคนในทีม

- ⚠️ เงื่อนไข Vercel: Hobby สำหรับใช้ส่วนตัวไม่ใช่เชิงพาณิชย์ — ระบบภายในบริษัทควรอัปเป็น Pro ($20/คน/เดือน) เมื่อพร้อม
  อัปแล้วไม่ต้องย้ายอะไรใหม่ · ข้อจำกัด Hobby ที่เกี่ยว: ฟังก์ชันไม่เกิน 12 (ใช้ 9) · ไม่มีแจ้งเตือนการใช้งาน · เพิ่มสมาชิกในทีมไม่ได้
- โปรเจคเดิมในบัญชี Vercel ส่วนตัว (`itassetmenagement.vercel.app`) **เลิกใช้ ลบได้** — ไม่ใช้สติกเกอร์ QR รุ่นเก่าแล้ว (เจ้าของยืนยัน 19 พ.ย. 2026)

สิ่งที่ตั้งไว้ในโค้ดแล้ว (`vercel.json`): build Vite → `dist` · ฟังก์ชันรันที่ **สิงคโปร์ (`sin1`)** ใกล้ฐานข้อมูล Supabase
(เดิมค่าเริ่มต้นสหรัฐฯ — ทุกคำขอข้ามมหาสมุทร) · header ความปลอดภัย · แคชไฟล์ `/assets` ถาวร · `/api` ไม่แคช
หน้าเว็บกับ `api/` อยู่ host เดียวกัน → เรียก `/api/...` ตรง ๆ ไม่ติด CORS (`ALLOWED_ORIGINS` ไม่จำเป็นแล้ว)

**`.vercelignore`** = รายการอนุญาต (อัปเฉพาะ `src` `api` `public` `index.html` `vercel.json` `package*.json` `vite.config.js` + `scripts/supabase/loadEnv.mjs`)
กัน `.env*.local` (service key) · `.supabase-export/` (ข้อมูลพนักงานจริง ~219 MB) · `*-preview.html` · `functions/` ของ Firebase ไม่ให้ขึ้นเซิร์ฟเวอร์

### คำสั่ง deploy (ในโฟลเดอร์ `it_asset_menagement`)

```bash
vercel --prod            # ขึ้น production (it-assets-management.gbos.app)
vercel                   # ขึ้น preview URL เฉพาะกิจ ไม่แตะโดเมนจริง
vercel env ls            # ดูว่ามีค่า env อะไรบ้าง (ไม่โชว์ค่า)
node scripts/vercel-env-push.mjs   # ส่งค่าลับจาก .env.local / .env.migration.local ขึ้น Vercel
```

`vercel-env-push.mjs` อ่านค่าจากไฟล์ในเครื่องแล้วส่งทาง stdin — **ไม่พิมพ์ค่าออกหน้าจอ ไม่ขึ้นในรายการโปรเซส** รันซ้ำได้ (ทับค่าเดิม)
ใส่ให้ทั้ง Production + Development · **Preview ยังไม่ได้ใส่** (CLI รุ่น 54 วนถาม git branch เมื่อโปรเจคยังไม่ผูก Git — ผูก GitHub แล้วค่อยคัดลอกในหน้าเว็บ Vercel)

### ผูก GitHub ภายหลัง (ยังไม่ทำ — deploy ด้วย CLI ไปก่อนได้)

ต้องย้าย repo `Nanthaphon/IT-Project` → บัญชีบริษัท `bdglobesyndicate` ก่อน (GitHub 1 บัญชีผูก Vercel ได้บัญชีเดียว)
แล้ว Vercel → Project Settings → Git → Connect · **Root Directory = `it_asset_menagement`**

### วันสลับระบบ — โดเมนเก่า

~~ย้าย `itassetmenagement.vercel.app` มาโปรเจคนี้~~ — **ยกเลิก** ไม่ใช้สติกเกอร์ QR รุ่นเก่าแล้ว · QR ใหม่ชี้ `it-assets-management.gbos.app`

## ✅ สลับระบบแล้ว 19 พ.ย. 2026 (~17:45)

| ขั้น | ผล |
|---|---|
| SQL `upgrade-20261119.sql` (เจ้าของรันใน SQL Editor) | ✅ `check-release` ผ่าน |
| `vercel --prod` → `it-assets-management.gbos.app` | ✅ |
| ย้ายไฟล์เข้า `it-private` | ✅ 352 เอกสาร · 702 ไฟล์ ตรวจ hash ครบ · conflict 0 |
| Firebase Hosting (`*.web.app`) → หน้าพาไป gbos.app (302 + path/query เดิม) | ✅ |
| Firestore → **อ่านอย่างเดียว** (`firestore.readonly.rules` สร้างด้วย `scripts/make-readonly-rules.mjs` — สิทธิ์อ่านเดิม · เขียน = false) | ✅ |
| ส่งออก Firebase ครั้งสุดท้ายหลังปิดเขียน → `sync-from-firebase.mjs --apply` | ✅ เพิ่ม 33 · แก้ 49 · ลบ 4 · ล้มเหลว 0 |
| ย้ายไฟล์ของแถวที่ซิงก์มา · smoke test · ซิงก์ซ้ำ (ต้องว่าง) | ✅ |
| ลบโปรเจค Vercel เดิม (บัญชีส่วนตัว) — `itassetmenagement.vercel.app` ตอบ 404 | ✅ |
| อุปกรณ์เสริมที่แก้ทั้งสองระบบ: **W227** ใช้ `assignees`/`availableItems` จาก Firebase (6→8 คน · เพิ่ม Au, Faii ที่เบิกบนเว็บเดิม 18–19 พ.ย. · ประวัติเบิกมีอยู่แล้ว) สำรองเดิม `w227-backup-*.json` · **M171** ตรงกันแล้ว | ✅ |

**ยังค้าง**
- อีเมลแจ้งเตือน (แทน Teams) — ตั้ง app registration M365 + env 6 ตัว ตาม `docs/EMAIL-NOTIFY.md`
- ผู้ดูแลคนอื่นตั้งรหัสผ่านใหม่ (หน้า "จัดการผู้ใช้") · พนักงาน 49 คนต้องเปลี่ยนรหัสตอนล็อกอินครั้งแรก
- merge `supabase-migration` → main + push (รอเจ้าของสั่ง)

**ย้อนกลับ** (ภายใน 30 วัน): `firebase deploy --only firestore:rules` (กฎเดิม) → checkout main แล้ว `npm run build` + `firebase deploy --only hosting`
ข้อมูลที่เกิดบน Supabase หลังสลับต้องนำกลับเอง · backup ทุกขั้นอยู่ใน `.supabase-export/` (`storage-backup-*` · `sync-backup-*`)

## ข้อมูลสองระบบเคยแยกกัน (ตรวจ 19 พ.ย. 2026 ก่อนสลับ — แก้แล้วด้วยการซิงก์)

`compare-cutover.mjs` เทียบ export Firebase 10 พ.ย. (ฐาน) · Firebase 19 พ.ย. · Supabase 19 พ.ย. (อ่านอย่างเดียว ไม่พิมพ์ข้อมูลส่วนตัว)

| | จำนวน |
|---|---|
| มีใหม่ใน Firebase เท่านั้น (เว็บเดิมยังใช้งาน) | supply_requests 29 · office_supplies 19 · employee_secrets 14 · employees 6 · อื่น ๆ ~10 |
| มีใหม่ใน **Supabase เท่านั้น** (มีคนแก้บน `it-assets-management.gbos.app`) | licenses 3 · accessories_transactions 3 |
| แก้ทั้งสองฝั่งไม่ตรงกัน | accessories 1 แถว (ฟิลด์ `assignees`, `availableItems`) |

**ผลต่อวันสลับ:** ขั้น "ล้าง + นำเข้า" แบบเดิมจะ**ทับรายการที่แก้บน Supabase หาย** (3+3+1 แถว)
- ก่อนวันสลับ **อย่าใช้ `it-assets-management.gbos.app` แก้ข้อมูลจริง** — ใช้เว็บเดิมที่เดียว
- รายการที่ทำบน Supabase ไปแล้ว: วันสลับให้คนที่แก้ทำซ้ำบนเว็บเดิมก่อนส่งออก หรือจดไว้ทำซ้ำหลังนำเข้า
  (ดูว่าแถวไหนใน `.supabase-export/cutover-comparison.json` — ไฟล์ส่วนตัว ไม่ขึ้น git)

## ขั้นที่เหลือ — ขึ้นความปลอดภัย + Storage บนโปรเจคจริง (เจ้าของสั่งเอง)

ตรวจล่าสุด `node scripts/supabase/check-release.mjs` → **RELEASE BLOCKED**: ยังไม่มี RPC 4 ตัว · ไม่มี bucket `it-private` · รหัสพนักงานแบบอ่านออกยังอยู่
(การสมัครบัญชีเองปิดแล้ว ✅)

**ห้าม `vercel --prod` โค้ดตั้งแต่ commit `3cef837` ก่อนทำข้อ 2** — หน้าเว็บใหม่เรียก RPC ที่ยังไม่มี → พนักงานล็อกอินไม่ได้

1. snapshot ก่อน: `node scripts/supabase/production-status.mjs` (เก็บใน `.supabase-export/`)
2. Supabase → SQL Editor → วางทั้งไฟล์ `supabase/upgrade-20261119.sql` → Run (ทั้งก้อนอยู่ใน transaction เดียว พังกลางทาง = ไม่เปลี่ยนอะไร)
   ⚠️ ลบรหัสพนักงานแบบอ่านออกถาวร — admin "ดูรหัส" ไม่ได้อีก ใช้ "รีเซ็ต" แทน · พนักงานที่ใช้รหัสเริ่มต้นจะถูกบังคับเปลี่ยนรหัสตอนล็อกอินครั้งถัดไป
3. `node scripts/supabase/check-release.mjs` ต้องขึ้น "checks passed"
4. `vercel --prod` ทันทีหลังข้อ 3
5. ย้ายไฟล์แนบ: `node scripts/supabase/migrate-private-storage.mjs` (ดูก่อน · dry-run 19 พ.ย.: 352 เอกสาร 702 ไฟล์ ~60 MB)
   → `... --apply` (เขียน backup ลง `.supabase-export/` ก่อนแตะอะไร · รันซ้ำได้) · ย้อนกลับ: `... --rollback <ไฟล์ backup> --apply`
6. เปิดเว็บ ดูรูปทรัพย์สิน/เอกสารแนบ 2–3 รายการ · ล็อกอินพนักงาน 1 คน

**วันสลับ:** ทำข้อ 2–5 ซ้ำหลังนำเข้าข้อมูลใหม่ (import ดึงรหัส plaintext + รูป base64 มาจาก Firebase อีกรอบ — trigger ตัด plaintext ให้อัตโนมัติ แต่ไฟล์ต้องรันข้อ 5 ใหม่)

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
4. **ลิงก์ "ลืมรหัสผ่าน"** — Authentication → URL Configuration → Site URL = `https://it-assets-management.gbos.app`
   Redirect URLs เพิ่มให้ครบ: `https://it-assets-management.gbos.app/**` · `http://localhost:5173/**` · `http://localhost:5180/**`
   (ไม่เพิ่ม = กดลิงก์รีเซ็ตรหัสผ่านแล้วเด้งผิดที่)

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
6. ☐ เปลี่ยน Firebase Hosting เป็นหน้าพาไปที่อยู่ใหม่ (กันคนเปิดลิงก์ `*.web.app` ที่บันทึกไว้ แล้วไปแก้ข้อมูลใน Firebase เก่า)
   ```powershell
   firebase deploy --only hosting --config firebase.redirect.json
   ```
7. ☐ ผู้ดูแลทุกคนตั้งรหัสผ่านใหม่ (รหัสผ่านผู้ดูแลจาก Firebase ย้ายไม่ได้) — SuperAdmin ตั้งให้จากหน้า "จัดการผู้ใช้" · พนักงานใช้รหัสเดิมได้เลย
8. ☐ ทดสอบ: ผู้ดูแลเข้าได้ทุกเมนู · พนักงาน 1 คนเข้าได้ แจ้งซ่อมได้ · อีเมลแจ้งเตือนเข้า
9. ☐ Firebase เก็บไว้อ่านอย่างเดียว 30 วันเผื่อย้อนกลับ
   ย้อนกลับ = ผ่าน Firebase Hosting (หัวข้อ "ย้อนกลับ" ด้านบน) · โปรเจค Vercel เดิมเลิกใช้แล้ว

### ค่า env ของโปรเจค `it-asset-management`

ส่วนใหญ่ใส่ให้แล้วด้วย `node scripts/vercel-env-push.mjs` (อ่านจาก `.env.local` + `.env.migration.local` ในเครื่อง)

| ชื่อ | ค่า | สถานะ |
|---|---|---|
| `VITE_PUBLIC_APP_URL` | `https://it-assets-management.gbos.app` — QR สติกเกอร์ใหม่ชี้ที่นี่ | ✅ ใส่แล้ว |
| `SUPABASE_URL` · `VITE_SUPABASE_URL` | Project URL (`https://xxxx.supabase.co`) | สคริปต์ใส่ให้ |
| `VITE_SUPABASE_ANON_KEY` | anon key — เปิดเผยได้ (ติดไปกับหน้าเว็บอยู่แล้ว) · ไม่ใส่ = หน้าเว็บขาว | สคริปต์ใส่ให้ |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key — **ห้ามส่งในแชท** · ไม่ใส่ = ล็อกอินพนักงาน/จัดการผู้ใช้พัง | สคริปต์ใส่ให้ |
| `MS_TENANT_ID` · `MS_CLIENT_ID` · `MS_CLIENT_SECRET` · `MAIL_FROM` · `IT_NOTIFY_EMAILS` · `HR_NOTIFY_EMAILS` | อีเมลแจ้งเตือน (แทน `TEAMS_*` ที่เลิกใช้) — วิธีตั้งดู `docs/EMAIL-NOTIFY.md` · ไม่ใส่ = ไม่มีแจ้งเตือน | ⬜ ต้องใส่เอง |
| `STAFF_EMAIL_DOMAIN` | ไม่ต้องใส่ (ค่าเริ่มต้น `staff.itasset.invalid`) — ห้ามเปลี่ยนหลังใช้งานจริง | ไม่บังคับ |
| `ALLOWED_ORIGINS` · `VITE_VERCEL_API_URL` | ไม่จำเป็นแล้ว (หน้าเว็บกับ api อยู่ host เดียวกัน) | เลิกใช้ |
| `FIREBASE_SERVICE_ACCOUNT` | ไม่ต้องใส่ (อยู่ที่โปรเจคเดิมเผื่อย้อนกลับ) | เลิกใช้ |

หน้าเว็บ build บน Vercel เอง ใช้ค่า `VITE_*` จากตารางนี้ (ไม่ใช้ `.env.local` ในเครื่อง) — **แก้ค่า env แล้วต้อง `vercel --prod` ใหม่**

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
