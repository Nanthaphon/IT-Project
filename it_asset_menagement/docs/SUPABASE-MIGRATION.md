# ย้ายฐานข้อมูลจาก Firebase ไป Supabase

สถานะ: **ระยะที่ 1 เสร็จ · ระยะที่ 2 เสร็จส่วนที่ไม่ต้องใช้โปรเจคจริง** · อยู่บน branch `supabase-migration`
เว็บจริงยังใช้ Firebase ตามเดิม จนกว่าจะถึงวันสลับระบบ (ระยะที่ 5)

## แนวทางที่เลือก

**ยกเอกสารมาทั้งก้อน** — 1 collection ของ Firestore = 1 ตารางใน Postgres
ฟิลด์ทั้งหมดอยู่ในคอลัมน์ `data` (jsonb) · id เดิมไม่เปลี่ยน · Timestamp เก็บเป็น `{"__ts": "ISO"}`

| | ยกทั้งก้อน (เลือก) | ออกแบบตารางใหม่ทั้งหมด |
|---|---|---|
| เวลา | 2–3 สัปดาห์ | 4–6 สัปดาห์ |
| โค้ดที่ต้องแก้ | ชั้นเชื่อมฐานข้อมูลชั้นเดียว + เปลี่ยน import 14 ไฟล์ | เขียนใหม่ทุกจุดที่อ่าน/เขียน (~180 จุด) |
| ความเสี่ยงพัง | ต่ำ — หน้าจอเดิมทำงานเหมือนเดิม | สูง |
| ภายหลัง | ค่อย ๆ แยกฟิลด์ที่ใช้ค้นบ่อยเป็นคอลัมน์ได้ | — |

โค้ดใช้ Firestore แค่ไม่กี่คำสั่ง (collection / doc / add / set / update / delete / get / onSnapshot / where / orderBy / writeBatch)
จึงทำชั้นเชื่อมที่หน้าตาเหมือน Firestore แต่ข้างในคุย Supabase ได้

**ที่ไม่ย้าย:** หน้าเว็บยังอยู่ Firebase Hosting (ฟรี) · ฟังก์ชันใน `api/` ยังอยู่ Vercel

## ระยะงาน

| | งาน | สถานะ |
|---|---|---|
| 1 | โครงสร้างตาราง + สิทธิ์ (RLS แปลจาก `firestore.rules` ทีละข้อ) · สคริปต์ส่งออก/นำเข้าข้อมูล | ✅ เทสต์ผ่าน |
| 2 | ชั้นเชื่อม `src/db/compat.js` (หน้าตาเหมือน `firebase/firestore`) + realtime แทน onSnapshot | ✅ เทสต์ผ่านบน Postgres จริง (PGlite) |
| 2b | เปลี่ยน import 14 ไฟล์ → `src/db/compat.js` · ตรวจ realtime กับ Supabase จริง | ⬜ รอโปรเจค Supabase |
| 3 | เข้าสู่ระบบ: admin → Supabase Auth · พนักงาน → `api/staff-login` ออก JWT ของ Supabase · ฟังก์ชัน `api/` 8 ไฟล์เปลี่ยนจาก firebase-admin | ⬜ |
| 4 | รูป/ไฟล์แนบ → Supabase Storage (แก้ปัญหา Firebase Storage ที่เปิดไม่ได้มาตลอด) | ⬜ |
| 5 | วันสลับระบบ: หยุดแก้ข้อมูล ~1 ชม. → ส่งออกข้อมูลจริง → นำเข้า → เปลี่ยนค่าตั้งค่า → ตรวจ · Firebase เก็บไว้อ่านอย่างเดียว 30 วันเผื่อย้อนกลับ | ⬜ |

## สิ่งที่เจ้าของระบบต้องทำเอง (ผมทำแทนไม่ได้)

1. **สมัคร Supabase + สร้างโปรเจค** ที่ https://supabase.com → New project
   - Region: **Southeast Asia (Singapore)** — ใกล้ไทยสุด
   - ตั้งรหัสผ่านฐานข้อมูลแล้วเก็บไว้เอง
2. **เลือกแพ็กเกจ**
   - Free: ฐานข้อมูล 500 MB · **ไม่มีสำรองข้อมูลอัตโนมัติ** · ไม่มีคนใช้ 7 วันโปรเจคจะหยุด
   - Pro ($25/เดือน ≈ 900 บาท): สำรองข้อมูลทุกวัน · ไม่หยุดเอง — **แนะนำสำหรับระบบที่ใช้งานจริง**
3. **ส่งให้ผม 2 ค่า** (Project Settings → API) — สองค่านี้เปิดเผยได้ ปลอดภัยด้วย RLS
   - Project URL (`https://xxxx.supabase.co`)
   - anon / publishable key
4. **ค่าลับ — ห้ามส่งในแชท** ใส่เองที่ Vercel → Settings → Environment Variables และไฟล์ `.env.local` ในเครื่อง
   - `SUPABASE_SERVICE_ROLE_KEY` (secret key)
   - `SUPABASE_JWT_SECRET` (สำหรับออก token ให้พนักงาน)
5. **ไฟล์ service account ของ Firebase** (Firebase Console → Project settings → Service accounts → Generate new private key)
   ใช้ตอนส่งออกข้อมูลจริงวันสลับระบบ — เก็บในเครื่อง ห้าม commit

## คำสั่ง

```bash
npm run test:supabase                                      # เทสต์ตาราง + สิทธิ์ (PGlite — ไม่ต้องมี Docker/บัญชี)
node scripts/supabase/export-firestore.mjs                 # ส่งออกจาก emulator → .supabase-export/
node scripts/supabase/export-firestore.mjs --prod          # ส่งออกจากของจริง (ต้องตั้ง GOOGLE_APPLICATION_CREDENTIALS)
node scripts/supabase/import-to-supabase.mjs <ไฟล์> --dry-run   # ดูจำนวนก่อน ไม่เขียน
node scripts/supabase/import-to-supabase.mjs <ไฟล์>              # นำเข้า (รันซ้ำได้ ไม่ซ้ำ)
```

สร้างตารางในโปรเจค Supabase: วาง `supabase/migrations/20261110000000_init.sql` ใน SQL Editor แล้วกด Run (หรือ `supabase db push`)

## ไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `supabase/migrations/20261110000000_init.sql` | ตาราง 23 + `doc_chunks` (ไฟล์แนบแบ่งชิ้นทุกแบบ) · สิทธิ์ · trigger · realtime |
| `scripts/supabase/schema.test.mjs` | เทสต์สิทธิ์ 12 กรณีเทียบ `firestore.rules` (รันทุกไฟล์ migration) |
| `scripts/supabase/export-firestore.mjs` | Firestore → JSON (อ่านอย่างเดียว) |
| `scripts/supabase/import-to-supabase.mjs` | JSON → Supabase · สร้างบัญชีผู้ดูแลจากอีเมลเดิม |
| `src/db/codec.js` | แปลง Timestamp ↔ JSON · path → ตาราง (ใช้ร่วมสคริปต์ + ชั้นเชื่อม) |
| `supabase/migrations/20261110000100_doc_write.sql` | ฟังก์ชันเขียนเอกสารแบบ Firestore (create/set/merge/update · path ลึก · ลบฟิลด์) ภายใต้ RLS |
| `src/db/compat.js` | คำสั่งแบบ Firestore บน backend ใดก็ได้ — ข้อต่างจาก Firestore เขียนไว้หัวไฟล์ |
| `src/db/supabaseBackend.js` · `supabaseClient.js` | backend จริง (supabase-js · realtime) · ตั้งค่าจาก `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` |
| `scripts/supabase/compat.test.mjs` · `pgliteBackend.mjs` | เทสต์ชั้นเชื่อม 8 กรณี บน PGlite + RLS |

## สิ่งที่ต้องรู้

- **รหัสผ่านผู้ดูแลย้ายไม่ได้** — Firebase เข้ารหัสแบบที่ Supabase อ่านไม่ออก ผู้ดูแลทุกคนตั้งรหัสใหม่ครั้งเดียวหลังสลับ
  รหัสผ่านพนักงาน (`staff_passwords`) ย้ายได้ปกติ เพราะระบบเก็บเองไม่ได้พึ่ง Firebase Auth
- **ขนาดข้อมูล** — รูปประเมินสภาพเก็บเป็น base64 ในเอกสาร ถ้าใช้แพ็กเกจ Free จะเต็ม 500 MB เร็ว · ระยะที่ 4 ย้ายรูปไป Storage
- **staff แก้ข้อมูลตัวเอง / ให้คะแนนแจ้งซ่อม** — RLS เทียบค่าเก่ากับใหม่ไม่ได้ จึงตรวจด้วย trigger (`app.guard_*`)
- พบระหว่างทำ: `firestore.rules` ไม่มีสิทธิ์ให้ subcollection `chunks` ของ `transaction_attachments` / `asset_purchase_docs`
  (ตกกฎ "ปฏิเสธทั้งหมด") — ไฟล์แนบสองแบบนี้บน Firebase อาจบันทึกไม่ได้อยู่แล้ว · ฝั่ง Supabase ให้ admin เขียนได้

## ขั้นตอนย้ายข้อมูลจริง (ซ้อมก่อนวันสลับระบบ)

โปรเจค Supabase: `it-asset-management` (Singapore · แพ็กเกจ Pro) — URL อยู่ที่ Project Settings → API

1. **สร้างตาราง** — Supabase → SQL Editor → New query → วางเนื้อหา `supabase/setup.sql` ทั้งไฟล์ → Run (ขึ้น "Success. No rows returned")
2. **ส่งออกจาก Firebase** (อ่านอย่างเดียว ไม่แก้ข้อมูล · ใช้ราว 1–2 พันครั้งอ่าน)
   - Firebase Console → Project settings → Service accounts → Generate new private key → เก็บไฟล์ไว้นอกโฟลเดอร์โปรเจค
   - ```powershell
     $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\IT\firebase-key.json"
     node scripts/supabase/export-firestore.mjs --prod
     ```
3. **ลองดูก่อน** (ไม่เขียนอะไร) แล้วนำเข้าจริง — ค่าลับใส่ใน terminal เท่านั้น ห้ามส่งในแชท
   - ```powershell
     $env:SUPABASE_URL="https://xxxx.supabase.co"
     $env:SUPABASE_SERVICE_ROLE_KEY="(secret key จาก Project Settings → API Keys)"
     node scripts/supabase/import-to-supabase.mjs .supabase-export\firestore-xxx.json --dry-run
     node scripts/supabase/import-to-supabase.mjs .supabase-export\firestore-xxx.json
     ```
4. ตรวจใน Table Editor ว่าจำนวนแถวตรงกับที่สคริปต์ส่งออกรายงาน

**นี่คือการซ้อม** — เว็บยังอ่าน Firebase อยู่ ข้อมูลใน Supabase เป็นสำเนา ณ ตอนนั้น
นำเข้าซ้ำได้ (ทับ id เดิม) แต่รายการที่ถูกลบใน Firebase ทีหลังจะไม่ถูกลบตาม — วันสลับระบบจึงล้างตารางแล้วนำเข้าใหม่ทั้งหมด
