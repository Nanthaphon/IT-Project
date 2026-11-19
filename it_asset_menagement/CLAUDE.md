# IT Asset Management — Globe Syndicate (Thailand)

React 19 + Vite + Tailwind v4 · branch `supabase-migration` = Supabase · `main` = Firebase · ตอบ/UI ภาษาไทย

## ข้อกำหนดสำคัญ
- **ห้าม deploy / push จนกว่าผู้ใช้จะสั่ง**
- **สลับไป Supabase แล้ว (19 พ.ย. 2026)** — `it-assets-management.gbos.app` = ระบบจริง · Firestore อ่านอย่างเดียว · งานค้างดู `docs/SUPABASE-MIGRATION.md` "ยังค้าง"
- เทสต์: `npm test` (node --test · `src/**/*.test.mjs`) · ตรวจ JSX เร็ว ๆ:
  `npx esbuild --loader:.jsx=jsx src/components/ไฟล์.jsx --outdir="$TEMP/check" --log-level=error`

## เอกสารอ่านเมื่อเกี่ยวข้อง (ไม่ต้องอ่านทุกครั้ง)
| ไฟล์ | อ่านเมื่อ |
|---|---|
| `docs/UI-RULES.md` | แก้หน้าตา — palette, คอนทราสต์, ตารางกฎ component, ข้อยกเว้นไอคอน/emoji, หน้า `*-preview.html` |
| `docs/DOMAIN-NOTES.md` | แก้ฟีเจอร์ — License seats, คำขออุปกรณ์เสริม, นำเข้าพนักงาน, รายงานรายเดือน, รหัส M365, ไทม์ไลน์ · emulator ของ branch main |
| `docs/SUPABASE-MIGRATION.md` | แผนย้าย, hosting/โดเมน, deploy, เช็กลิสต์วันสลับ |

## กฎ UI ย่อ (ละเอียดใน `docs/UI-RULES.md`)
- สีมาจาก `src/index.css` `@theme` เท่านั้น — ใช้ `clay-*`(แบรนด์ teal) `sand-*` `olive-*`(สำเร็จ) `ochre-*` `brick-*`(ลบ) `rose-*` `stone-*` · **ห้าม hardcode สี**
  ของค้างที่ต้องแก้: `#A65F3C`, `#1E487A`, `emerald-*`, โทนส้ม/น้ำตาล · พื้นปุ่มเขียวใช้ `olive-600` ห้าม `#52ab98` ดิบ
- ขนาดตัวอักษรเฉพาะ: `text-[10px] [11px] xs [13px] sm [15px] [19px] [22px] 3xl` · น้ำหนักแค่ `font-normal`/`font-medium`
- ห้าม `uppercase` `tracking-wide` `rounded-md` `font-semibold/bold`
- การ์ด `rounded-2xl` · ปุ่ม/ช่องกรอก `rounded-xl` · **Modal `rounded-lg`** overlay `bg-stone-950/50` · หน้าเต็มความกว้าง `p-4 lg:p-5` ห้าม `max-w-* mx-auto`
- ไอคอน `lucide-react` เท่านั้น `strokeWidth={2}` · ห้ามเขียน `<svg>` เอง ห้าม emoji แทนไอคอน
- สีสถานะผ่าน `statusTone()` ใน `src/ui/earth.js` · หน้าตารางใหม่ประกอบจาก `components/list/ListPage.jsx` (ตัวอย่าง `licenses/LicenseListPage.jsx`)
- CSS ใหม่ใน `index.css` ต้องอยู่ใน `@layer` (นอก layer จะทับ utility ทุกตัว)

## โครงสร้าง
```
src/App.jsx                    ศูนย์กลาง state + handlers (ไฟล์ใหญ่) — หน้าเป็น controlled ห้ามสร้าง state ซ้ำในคอมโพเนนต์
src/components/AssetDetailsModal.jsx   ใช้ร่วม assets/accessories/licenses
src/components/EditAssetModal.jsx, AddModal.jsx   ใช้ร่วม assets/accessories/office_supplies
src/ui/earth.js, earthUI.jsx   token + component กลาง · ui/theme.js, primitives.jsx = modal
src/hooks/firebaseNeeds.js     เมนูไหน subscribe collection ไหน — เพิ่ม collection ต้องเพิ่มที่นี่ + `npm run check:needs`
src/utils/formatDate.js        วันที่ DD/MM/YYYY
api/                           Vercel Functions (staff auth, Teams notify, cascade-delete)
```
- ย้ายสิทธิ์ License ต้องผ่าน `utils/licenseSeats.js` · `api/cascade-delete.js` มีสำเนา `SEAT_FIELDS` แก้คู่กัน
- รหัส M365 อยู่ `employee_secrets/` ผ่าน `utils/employeeSecrets.js` เท่านั้น
- ตารางทรัพย์สินมีทั้ง `note` และ `remark` — คนละฟิลด์

## Supabase (branch นี้)
- ห้าม import `firebase/*` ใน src — ใช้ `src/db/compat.js` (`src/firebase.js` ส่งออก `db`/`auth` ของ Supabase)
- สิทธิ์อยู่ `supabase/migrations/*.sql` → แก้แล้ว `npm run test:supabase` + สร้าง `supabase/setup.sql` ใหม่ · migration ใหม่เจ้าของวางใน SQL Editor เอง
- collection ใหม่ = ตารางใน migration + `TOP_TABLES` ใน `src/db/codec.js`
- `api/` ใช้ service role ผ่าน `api/_lib/supabaseAdmin.js` · `npm run dev` รัน `api/` ในเครื่อง ค่าลับจาก `.env.migration.local`
- ไฟล์แนบ → bucket private `it-private` ผ่าน `utils/privateStorage.js` แสดงด้วย `ui/PrivateImage.jsx`/`PrivateFileLink.jsx`
- ก่อน `vercel --prod` ต้องผ่าน `node scripts/supabase/check-release.mjs`
