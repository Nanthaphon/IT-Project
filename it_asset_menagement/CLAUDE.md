# IT Asset Management — Globe Syndicate (Thailand)

ระบบจัดการทรัพย์สิน IT · React 19 + Vite + Tailwind v4 + Firebase (Firestore/Auth) + Vercel Functions

**ภาษา:** ตอบเป็นภาษาไทย · UI ทั้งหมดเป็นภาษาไทย

---

## ข้อกำหนดสำคัญ

- **ห้าม deploy หรือ push ขึ้น GitHub จนกว่าผู้ใช้จะสั่ง** — ทำและทดสอบบน localhost (`npm run dev`) เท่านั้น
- Vercel Functions ใน `api/` ใช้เฉพาะ staff auth + Teams notification (ไม่ใช่ backend หลัก)

---

## Design System — ธีม v4 "Harbor" (มาตรฐานปัจจุบัน)

⚠️ **ธีม Canyon (terracotta) และ navy `#1E487A` ถูกยกเลิกแล้วทั้งคู่**
ถ้าเจอ `#A65F3C`, `#1E487A`, `emerald-*`, สีอุ่นโทนส้ม/น้ำตาล = ของค้าง ให้แก้ตาม palette ด้านล่าง

### แหล่งเดียวของความจริง

| ไฟล์ | หน้าที่ |
|---|---|
| `src/index.css` (`@theme`) | **นิยามสีทั้งหมด** — เปลี่ยนธีมทั้งระบบได้จากบล็อกนี้บล็อกเดียว |
| `src/ui/earth.js` | token สี/ตัวอักษร/ปุ่ม + `statusTone()` map สถานะไทย |
| `src/ui/earthUI.jsx` | component กลาง (การ์ด ตาราง badge ปุ่ม popover) |
| `src/components/list/ListPage.jsx` | โครงหน้ารายการ — ทุกเมนูที่เป็นตารางใช้ตัวนี้ |
| `src/ui/theme.js` + `ui/primitives.jsx` | token ของ modal (9 ตัวใช้ร่วม) |

**ห้าม hardcode สีในคอมโพเนนต์** — ใช้คลาส `clay-*`/`sand-*`/`ochre-*`/`olive-*`/`stone-*`

> **ชื่อ token กับสีไม่ตรงกันแล้ว** — `clay` เคยเป็น terracotta ตอนนี้เป็น teal,
> `olive` เคยเป็นเขียวมะกอกตอนนี้เป็นเขียวน้ำทะเล การเปลี่ยนธีมเลือกแก้แค่ "ค่า"
> เพื่อไม่ต้องแตะคลาสในคอมโพเนนต์นับพันจุด ถ้าจะ rename ให้เป็นชื่อเชิงบทบาท
> (`brand-*`/`success-*`/`danger-*`) ควรทำเป็นงานแยกต่างหาก

### Palette — ฐานจาก 5 สีที่กำหนด

```
#2b6777  teal เข้ม   สีแบรนด์      #c8d8e4  ฟ้าอ่อน
#ffffff  ขาว         การ์ด         #f2f2f2  เทาอ่อน  พื้นผิว
#52ab98  เขียวน้ำทะเล  สถานะสำเร็จ
```

| token | บทบาท | ค่าหลัก |
|---|---|---|
| `clay-*` | **แบรนด์** ปุ่ม/ไฮไลท์/sidebar | `clay-600 #2B6777` · hover `clay-700 #225462` · sidebar `clay-900 #12303A` · `clay-200 #C8D8E4` |
| `sand-*` | พื้นผิว | `sand-50 #F7F9FA` (พื้นหน้าจอ) · `sand-100 #F2F2F2` |
| `olive-*` | สถานะสำเร็จ/พร้อมใช้งาน | `olive-500 #52AB98` · `olive-600 #3D8072` (พื้นปุ่ม) · `olive-700 #2C5D53` (ตัวอักษร) |
| `ochre-*` | สถานะกำลังดำเนินการ | `ochre-50` / `ochre-700` — อำพันหม่น ตัดกับ teal ชัด |
| `brick-*` | ปุ่มลบ/อันตรายพื้นทึบ | `brick-600 #B0453C` |
| `rose-*` | ป้ายเตือนพื้นอ่อน | `bg-rose-50` / `text-rose-700` |
| `stone-*` | โทนกลาง ตัวอักษร/ขอบ | **ทับค่า Tailwind เดิมด้วยเทาโทนเย็น** `stone-900 #162024` |

### ข้อควรระวังเรื่องคอนทราสต์ (วัดจริงแล้ว)

| คู่สี | อัตราส่วน | |
|---|---|---|
| ตัวอักษรขาวบน `clay-600 #2B6777` | 6.35:1 | ✓ AA |
| ตัวอักษรขาวบน **`#52ab98` ดิบ** | **2.75:1** | ✗ **ห้ามใช้เป็นพื้นปุ่ม** — ใช้ `olive-600 #3D8072` (4.64:1) แทน |
| ตัวอักษรขาวบน `brick-600` | 5.58:1 | ✓ AA |
| `stone-500` บนพื้นขาว | 4.79:1 | ✓ AA |
| `stone-400` บนพื้นขาว | 3.15:1 | △ ใช้ได้เฉพาะป้ายรอง/หัวตาราง |

`#52ab98` เหมาะเป็น **พื้นอ่อน/จุดสถานะ/เส้นกราฟ** ไม่ใช่พื้นปุ่มที่มีตัวอักษรขาว

## การรันเพื่อทดสอบ — ใช้ emulator เสมอ (เฉพาะ branch main ที่ยังเป็น Firebase · branch supabase-migration ดูหัวข้อ Supabase ท้ายไฟล์)

`npm run dev` ต่อ **Firestore ตัวจริง** การแก้ UI แล้ว hot-reload ซ้ำ ๆ
จึงกินโควตาจนระบบใช้งานไม่ได้
(เคยเกิดมาแล้ว: `8 RESOURCE_EXHAUSTED: Quota exceeded` — login ไม่ได้ทั้งระบบ)

**การโหลดข้อมูลตอนนี้เป็นแบบ on-demand แล้ว** — `useFirebaseData(authRole, activeMenu)`
subscribe เฉพาะ collection ที่เมนูปัจจุบันใช้ แล้วไม่ถอดออก (กลับมาเมนูเดิมไม่เสีย read ซ้ำ)
ตารางว่าเมนูไหนใช้ก้อนไหนอยู่ที่ `src/hooks/firebaseNeeds.js`
แก้ตารางแล้วรัน `npm run check:needs` — จะตรวจว่าชื่อเมนูตรงกับ `MENU_PATH`,
collection ที่อ้างถึงเปิดได้จริง, ป้ายบน sidebar ยังมีข้อมูลทุกหน้า และ StaffView ได้ครบ
**เพิ่ม collection ใหม่ต้องเพิ่มใน `firebaseNeeds.js` ด้วย ไม่งั้นจะไม่ถูก subscribe เลย**

```bash
npm run emu        # หน้าต่าง 1 — เปิด emulator (ต้องมี Java)
npm run emu:seed   # หน้าต่าง 2 — เติมข้อมูลตัวอย่างครั้งแรก
npm run dev:emu    # หน้าต่าง 3 — เปิดแอปชี้ไป emulator
npm run test:rules # ทดสอบ firestore.rules (หลัง emu:seed)
```

Java ที่ใช้กับ emulator: `%LOCALAPPDATA%\Programs\temurin-jre21\jdk-21.0.12.1+1-jre\bin` (portable — ใส่ใน PATH ก่อนสั่ง `npm run emu`)
emulator โหลด rules ใหม่เองเมื่อแก้ไฟล์ แต่บางครั้งพลาดรอบสุดท้าย — ถ้าเทสต์ผลแปลก ให้แตะไฟล์ (`touch firestore.rules`) ซ้ำ

| | `npm run dev` | `npm run dev:emu` |
|---|---|---|
| ฐานข้อมูล | **ของจริง** | ในเครื่อง (`.emulator-data`) |
| กินโควตา | ใช่ | **ไม่** |
| บัญชีเข้าระบบ | ของจริง | `admin@local.test` / `admin1234` |

**ใช้ `npm run dev` เฉพาะตอนต้องยืนยันกับข้อมูลจริงจริง ๆ เท่านั้น**
และอย่าปล่อยให้ hot-reload วนหลายสิบรอบ

### กฎการออกแบบ

| องค์ประกอบ | ใช้ | ห้ามใช้ |
|---|---|---|
| **การ์ด** | `rounded-2xl` + `border-stone-200/60` + `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` | `rounded-xl`, ขอบทึบ, เงาหนัก, เงาโทนน้ำเงิน |
| **ปุ่มหลัก** | `bg-clay-600 text-white rounded-xl font-medium hover:bg-clay-700` | `font-semibold/bold`, `rounded-lg`, gradient |
| **ปุ่มลบ (ยืนยัน)** | `bg-brick-600 text-white rounded-xl` | `bg-rose-600` (แดงนีออน ตัดกับพื้นครีม) |
| **Modal** | overlay `bg-stone-950/50` · กล่อง **`rounded-lg`** (เหลี่ยมกว่าการ์ด — ผู้ใช้ไม่ชอบ modal มน) · หัว/ท้าย `px-7 py-5` | `rounded-2xl`/`rounded-xl` ที่กล่อง modal, overlay ความมืดอื่น, `shadow-2xl` |
| **แถบเลื่อน** | กำหนดไว้ทั้งระบบใน `index.css` ใน `@layer base` (แท่งบางมน ไม่มีลูกศร) · ซ่อนทั้งอันใช้ `no-scrollbar` (sidebar) | ตั้ง `scrollbar-width`/`scrollbar-color` เพิ่ม (Chrome จะเมินสไตล์ webkit) · เขียน CSS ใหม่ไว้นอก `@layer` — Tailwind v4 วาง utility ใน layer และ CSS นอก layer ชนะเสมอ จะไปทับคลาสทุกตัว |
| **ปุ่มรอง** | `bg-white border border-stone-200/60 rounded-xl text-stone-600` | ขอบทึบ |
| **ป้ายกำกับฟอร์ม** | `text-[13px] font-medium text-stone-500` | **`uppercase`**, `tracking-wide`, `font-semibold` |
| **Badge สถานะ** | `rounded-lg` + พื้นอ่อน **ไม่มีขอบ** + `font-medium` | pill กลม, `border`, `font-bold` |
| **ช่องกรอก** | `border-stone-200/60 rounded-xl` + `focus:ring-2 focus:ring-clay-600/15` | `rounded-lg`, `border-stone-300` |
| **ตัวเลขเด่น** | `text-3xl font-medium tabular-nums` | `font-bold`, `font-black` |
| **แถวตาราง** | `py-4` + `border-stone-100` บางๆ + hover | เส้นคั่นหนา, แถวแน่น |
| **หัวตาราง** | `text-[12px] font-medium text-stone-400` ไม่มีพื้น | พื้นเทา, `uppercase` |
| **หน้า** | **เต็มความกว้าง** `p-4 lg:p-5` + `space-y-4` · ไม่มีหัวเรื่องซ้ำกับแถบบน (ใช้ `sr-only`) | `max-w-*` + `mx-auto` จัดกึ่งกลาง — จอกว้างเหลือที่ว่างสองข้าง ผู้ใช้ไม่ชอบ |

### ขนาดตัวอักษร — ใช้ได้เฉพาะ 9 ค่านี้

| คลาส | px | ใช้กับ |
|---|---|---|
| `text-[10px]` | 10 | ป้ายจิ๋วในตาราง/ชิป |
| `text-[11px]` | 11 | คำอธิบายย่อย, หน่วย |
| `text-xs` | 12 | หัวตาราง, badge, meta |
| `text-[13px]` | 13 | ป้ายกำกับฟอร์ม, ข้อความรอง |
| `text-sm` | 14 | เนื้อความหลัก, ปุ่ม |
| `text-[15px]` | 15 | หัวข้อย่อย (h2) |
| `text-[19px]` | 19 | หัวข้อ modal (h3) — ตรงกับ `ModalHeader` |
| `text-[22px]` | 22 | หัวข้อหน้า (h1) — ตรงกับ `text.h1` |
| `text-3xl` | 30 | ตัวเลขเด่นในการ์ดสถิติ |

**ห้าม** ค่าครึ่งพิกเซล (`text-[12.5px]`, `text-[13.5px]`, …) และค่าอื่นนอกตาราง
เดิมระบบมี 30 ค่า ทำให้ทุกหน้าดูไม่เป็นชุดเดียวกันแม้สีจะตรงธีมแล้ว

### ความหนา — มีแค่ `font-normal` กับ `font-medium`

`font-semibold` / `font-bold` / `font-black` **ห้ามใช้ทั้งระบบ** — ใน theme v3
`font-medium` คือน้ำหนักสำหรับเน้น ส่วนความคมชัดมาจากสี (`text-stone-900`)
ถ้าเห็นหน้าไหน "หนา" กว่าหน้าอื่น แปลว่ามี `font-semibold` หลุดมา
**หลักคิด:** โปร่ง เรียบ อ่านง่าย — ตัดตัวพิมพ์ใหญ่ ตัดตัวหนา ตัดเงาหนัก ใช้พื้นที่ว่างแบ่งสัดส่วนแทนเส้น

### ไอคอน — `lucide-react` เท่านั้น

**ห้ามเขียน `<svg>` เอง** ถ้าต้องการไอคอน — เดิมมี Heroicons เขียนมือปนอยู่ 72 จุด
ทำให้ไอคอนความหมายเดียวกันหน้าตาคนละแบบ (เช่น ปุ่มปิดมี X สองทรง)

```jsx
import { Trash2, SquarePen, Search } from 'lucide-react';
<Trash2 className="h-4 w-4" strokeWidth={2} />
```

| | ค่า |
|---|---|
| **ความหนาเส้น** | `strokeWidth={2}` **ค่าเดียวทั้งระบบ** (ตรงกับ default ของ lucide) |
| ขนาดมาตรฐาน | `h-4 w-4` (ทั่วไป) · `h-3.5 w-3.5` (ในแถว/ชิป) · `h-5 w-5` (หัวข้อ/ปุ่มไอคอน) |

เดิมความหนาเส้นมี **12 ค่า** (1.5–3) ใน 448 จุด ไอคอนตัวเดียวกันจึงดูหนาบาง
ไม่เท่ากันแล้วแต่หน้า — ตอนนี้เหลือค่าเดียว ถ้าเห็นค่าอื่นแปลว่าหลุดมา

**ห้ามใช้ emoji แทนไอคอน** — เดิมมี emoji ทำหน้าที่ไอคอนอยู่ ~25 จุด
(✨ เครื่องใหม่ · ♻️ มือสอง · 🖥️🖱️🔑 ประเภทรายการ · 💡 คำแนะนำ · ⚠️ เตือน)
emoji เรนเดอร์ต่างกันทุกระบบปฏิบัติการ ปรับสี/ขนาดไม่ได้ และเข้าไม่ได้กับธีม

**emoji ที่เก็บไว้ตั้งใจ** (เป็นข้อมูล ไม่ใช่ UI — แก้แล้วกระทบของจริง):
`App.jsx` label ของการ์ดแจ้งเตือน Teams (`api/staff-notify`) ·
`STATUS_OPTIONS` ของ IT Report ที่ถูกเก็บลง Firestore และพิมพ์ลง .pptx

**ข้อยกเว้นที่ไม่ใช่ไอคอน** (ยังเป็น `<svg>` ได้):
`SupplyRequestTable` กราฟโดนัท · `EditAssetModal` ลูกศร select ที่เป็น
data-URI ใน CSS background (ทำเป็นคอมโพเนนต์ไม่ได้)

### สถานะ — ใช้ `statusTone()` จาก `earth.js` เสมอ

```
พร้อมใช้งาน / เสร็จสิ้น / อนุมัติ   olive   (ok)
กำลังดำเนินการ / รอดำเนินการ        ochre   (busy)
ชำรุด / ปฏิเสธ / ผิดพลาด            rose    (bad)
ถูกใช้งาน / สำรอง                   stone   (neutral)
ตัดจำหน่าย                          sand    (off)
```
เพิ่มสถานะใหม่ = เพิ่มใน `STATUS_TONE` ของ `earth.js` ไม่ใช่ไปเขียนสีที่คอมโพเนนต์

### หน้าที่ทำแล้ว

✅ ครบทั้งแอป — แดชบอร์ด · 6 เมนูรายการ · modal ทั้งหมด · 4 หน้า workflow · ฝั่งพนักงาน
**ไม่เหลือสีนอก palette และไม่เหลือ `uppercase`/`rounded-md`/`font-bold` แม้แต่จุดเดียว**

⬜ ยังเป็นโครงเดิม (สีถูกแล้ว แต่ information architecture ยังไม่ได้ออกแบบใหม่):
`StaffView` · 4 หน้า workflow · `KpiDashboard`

### หน้าใหม่ที่เป็นตาราง — ประกอบจาก `ListPage`

ส่งเข้าไปแค่ `columns` + `rowActions` + `toolbar` ไม่ต้องเขียนหน้าใหม่ทั้งหน้า
ดูตัวอย่างที่ `components/licenses/LicenseListPage.jsx` (~110 บรรทัด)

**ทุกหน้าเป็น controlled component** — ค้นหา/กรอง/แบ่งหน้า/การเลือก เป็น state ของ `App.jsx`
ห้ามสร้าง state ซ้ำในคอมโพเนนต์ (จะเกิด "ความจริงสองชุด" ดีบักยากมาก)

### ดูหน้าโดยไม่ต้องล็อกอิน

```
localhost:5173/dashboard-preview.html   แดชบอร์ด
localhost:5173/list-preview.html        License / อุปกรณ์เสริม / พนักงาน / อุปกรณ์สำนักงาน
localhost:5173/assets-preview.html      ทรัพย์สิน (128 รายการ)
localhost:5173/modal-preview.html       AssetDetailsModal
localhost:5173/submodal-preview.html    Seat / ชิ้นย่อยอุปกรณ์เสริม (sub-modal) · แท็บไทม์ไลน์รายตัว (ประวัติจำลอง) · ?nokey = สิทธิ์ไม่มี Product Key
localhost:5173/form-preview.html        primitives กลาง + CheckoutModal
localhost:5173/report-preview.html      สร้าง IT Monthly Report (localStorage จำลอง — ไม่ทับร่างจริง · License ครบทุกกรณีวันหมดอายุ)
localhost:5173/timeline-preview.html    ไทม์ไลน์ทรัพย์สิน / License
localhost:5173/login-preview.html       หน้าเข้าสู่ระบบ (ไม่ต้อง logout ของจริง)
localhost:5173/edit-preview.html        หน้าแก้ไข License / ทรัพย์สิน (โหมดหน้าเต็ม)
localhost:5173/emp-preview.html         รายละเอียดพนักงาน (สลับหน้าเต็ม / modal ได้)
localhost:5173/supply-preview.html      คำขอเบิกอุปกรณ์ (ชื่อมีคำนำหน้า · ชื่อเล่น · ทุกสถานะ)
localhost:5173/sidebar-preview.html     Sidebar ของจริง (ย่อความสูงหน้าต่างเพื่อตรวจการเลื่อน)
localhost:5173/fieldopt-preview.html    ตัวเลือกฟิลด์ (กดบันทึกแล้วโชว์ก้อนที่จะเขียนลง settings/fieldOptions)
localhost:5173/repair-preview.html      แจ้งซ่อม (ชื่อเล่น · ทุกสถานะ · คะแนน · ข้อมูลหลายเดือนไว้ตรวจตัวกรองวันที่)
localhost:5173/staff-preview.html       ฝั่งพนักงาน (?tab=office_supplies เปิดแท็บเบิกอุปกรณ์ · ย่อจอเป็นมือถือเพื่อตรวจแถบลอย)
localhost:5173/accreq-preview.html      คำขออุปกรณ์เสริม (กดอนุมัติ → เลือกชิ้นในสต็อก · ผลตัดสต็อกโชว์ท้ายหน้า)
localhost:5173/licover-preview.html     ใบคลุมต่ออายุโปรแกรม (ติ๊กโปรแกรม → เอกสารโชว์ใน iframe แทนกล่องพิมพ์)
```
ทุกตัวจำลอง app shell จริง ใช้ตรวจ integration ได้ · ไม่เข้า production build


## โครงสร้างที่ควรรู้

```
src/
  App.jsx                    ศูนย์กลาง state + handlers ทั้งหมด (ไฟล์ใหญ่)
  components/
    StaffView.jsx            ฝั่งพนักงาน (ยังไม่ได้ออกแบบโครงใหม่)
    Sidebar.jsx              เมนู admin (พื้นไล่สี clay-800 -> clay-900)
    AssetDetailsModal.jsx    modal รายละเอียด — ใช้ร่วม assets/accessories/licenses
    *RequestTable.jsx        หน้า workflow อนุมัติ (ไม่ใช่ตารางธรรมดา)
    list/ListPage.jsx        โครงหน้ารายการกลาง — เมนูที่เป็นตารางใช้ตัวนี้
  ui/
    earth.js / earthUI.jsx   ⭐ token + component กลางของธีม v3
    theme.js / primitives.jsx  token ของ modal (BRAND, cls.*, COMPANIES)
    primitives.jsx           Modal, ModalHeader/Body/Footer, Field, Button
  utils/
    printAssetReport.js      PDF รายงานทรัพย์สิน (dynamic columns)
    printLicenseCover.js     ใบคลุมต่ออายุโปรแกรม — รายการละ โปรแกรม + ผู้ถือครอง 1 คน · หลายรายการรวมหน้าเดียว 2 คอลัมน์ ไม่มีลายเซ็น · วันที่/ราคาผู้ใช้กรอกเอง (ว่าง = เส้นจุด) บันทึกอัตโนมัติที่ it_report/license_cover (licenseCoverStore.js) ไม่แตะ licenses (ปุ่ม "ใบคลุม" / "พิมพ์ใบคลุม" หน้า License)
    printLicenseList.js      รายการโปรแกรม + ผู้ถือครองทั้งหมดแบบตาราง (A4 แนวนอน) — ปุ่ม "พิมพ์รายการ" ตอนติ๊กโปรแกรม · วันที่/ราคาใช้ค่าที่กรอกในใบคลุมก่อน ไม่มีค่อยใช้ข้อมูลระบบ · รวมราคาท้ายตาราง
    uploadPhoto.js           อัปโหลดรูป — ตอนนี้เก็บ base64 ตรง (Storage ยังไม่ได้เปิด: bucket 404 · `STORAGE_ENABLED=false`)
api/                         Vercel Functions (staff auth, Teams notify) · branch supabase-migration: service role ผ่าน api/_lib/
```

### หมายเหตุสำคัญ

- **`AssetDetailsModal.jsx` ใช้ร่วม 3 ประเภท** (assets / accessories / licenses) — แก้ส่วนไหนต้องดูว่ากระทบประเภทอื่นไหม
- **`EditAssetModal.jsx` / `AddModal.jsx` ก็ใช้ร่วมกัน** ระหว่าง assets / accessories / office_supplies
- **ลิงก์พนักงาน** — ตั้งตัวเลือกใน "ตัวเลือกฟิลด์" (`fieldOptions.links = [{id,name,url}]`) แล้วเลือกใส่ในหน้ารายละเอียดพนักงาน
  (`components/employees/EmployeeLinks.jsx` → `employees/{id}.links` = `[{ label, url, id?, optionId? }]` เก็บสำเนา label/url ลบตัวเลือกทิ้งภายหลังลิงก์ของคนเดิมยังอยู่)
  ⚠️ **ฟิลด์เดียวกับที่พนักงานเพิ่มเองในหน้า "ข้อมูลของฉัน" และฟอร์มแก้ไขพนักงาน** — ชื่อต้องอยู่ที่ `label` · บันทึกผ่าน `cleanLinks()` เสมอ (ไม่งั้น optionId หลุด)
  ⚠️ `handleSaveFieldOptions` ใช้ `setDoc` ทับทั้งเอกสาร — เพิ่ม key ใหม่ใน fieldOptions ต้องใส่ใน state `local` ของ `DropdownOptionsManager` ด้วย ไม่งั้นกดบันทึกแล้วหาย
- **ร่าง IT Monthly Report เก็บที่ Firestore `it_report/shared`** (admin เท่านั้น — rules แยกจาก settings/ ที่อ่านได้สาธารณะ)
  localStorage เป็นแค่สำรอง/ย้ายครั้งแรก · กติกาเลือกร่างอยู่ที่ `utils/reportDraftPick.js` (มีเทสต์) — **ร่างว่างของเครื่องใหม่ห้ามเขียนทับของจริง**
  autosave เขียนเฉพาะเมื่อแก้จริง (เทียบกับ lastJson) และหน่วง 1.2 วิ ไม่เขียนทุกตัวอักษร
  **หมายเหตุตารางฮาร์ดแวร์/ซอฟต์แวร์แยกรายเดือน** — `draft.notes.{hw,sw}['YYYY-MM'][ชื่อแถว]` (`utils/reportNotes.js` มีเทสต์)
  ผูกกับชื่อแถว ไม่ใช่ตาราง → "ดึงจากระบบ" ไม่ลบ · เดือนที่ยังไม่แก้ยกยอดจากเดือนก่อน · `0000-00` = หมายเหตุที่ย้ายจากร่างรุ่นก่อน
- **อนุมัติคำขออุปกรณ์เสริม = เลือกชิ้นในสต็อก** (`accessories/ApproveAccessoryModal.jsx`) ส่ง `pickedItems: [{index, sn}]`
  ตัดสต็อกด้วย `takeItems()` ใน `utils/accessoryItems.js` (ตรวจ SN ซ้ำ — ชิ้นถูกเบิกไประหว่างเปิดหน้าต่าง = หยุด ไม่ให้ของผิดชิ้น)
  ยืม = assignee.isBorrow + returnDate → หน้าพนักงานติดป้าย "ยืม · คืน …" (เลยกำหนด = แดง)
  หน้าคำขอ: แถวยืมที่เลยกำหนดและยังไม่คืน = แดง + ชิป "เลยกำหนดคืน" — `utils/borrowStatus.js` ดูจาก assignees ของอุปกรณ์
  (คำขอไม่ถูกแก้ตอนรับคืน) · `givenItems[].checkoutId` จับตรงตัว คำขอรุ่นเก่าเทียบ ยืม + วันคืน + SN
- **พนักงานที่ออกแล้ว** — ยังเก็บที่ `deleted_employees` (ลบ = ย้ายไปที่นั่น) แต่หน้ารายชื่อแสดงรวมกับคนที่ทำงานอยู่ (ไม่มีถังขยะแยกแล้ว)
  ตัวกรอง "สถานะ" ทำงานอยู่/ออกแล้ว (`empFilterStatus`) · ระบุว่าออกแล้วจาก "ไม่อยู่ใน employees" (`isLeftEmp`) ไม่ใช่ `deletedAt` (serverTimestamp ยัง pending ได้)
  CSV ส่งออก = ที่ติ๊กเลือก หรือทั้งหมดตามตัวกรอง/ค้นหา · มีคอลัมน์ สถานะ + วันที่ออก
- **สถานะพนักงานคำนวณ ไม่ได้เก็บ** (`utils/employeeStatus.js` มีเทสต์) — ออกแล้ว = อยู่ใน `deleted_employees` **หรือ** `employees.resignDate` (YYYY-MM-DD) ≤ วันนี้
  ตั้งวันที่ออกล่วงหน้าได้ (ฟอร์ม/นำเข้า) ก่อนถึงวันป้าย "จะออก …" · ถึงวัน = "ออกแล้ว" เอง (ตัวกรอง/CSV/หน้ารายละเอียด) · `api/staff-login.js` ไม่ให้เข้าระบบเมื่อถึงวันที่ออก
  `isLeftEmp` = อยู่ใน deleted_employees (ใช้เลือกเมนูแถว กู้คืน/ลบถาวร) · `empStatusOf` = สถานะที่แสดง — คนละอย่างกัน
- **นำเข้าพนักงาน = วางแผนก่อน แล้วถามยืนยันทุกครั้ง** (`utils/employeeImport.js` มีเทสต์ · `employees/EmployeeImportConfirm.jsx`)
  รหัสพนักงานตรง = อัปเดตเอกสารเดิม (คนที่ลบแล้วอัปเดตใน deleted_employees) · แก้เฉพาะช่องที่ต่าง · ช่องว่างในไฟล์ไม่ลบของเดิม
  แปลงวันที่ 2/12/2022 / พ.ศ. → YYYY-MM-DD · เบอร์ที่ Excel ตัด 0 → เติม 0 · `#N/A` = ว่าง · สถานะ "ออกแล้ว" ไม่มีวันที่ = ออกวันนี้
- **คอลัมน์ template = คอลัมน์ CSV ส่งออก** (`EMPLOYEE_HEADERS` 20 คอลัมน์ ตามไฟล์ที่ผู้ใช้คลีนแล้ว) — ส่งออกแล้วนำเข้ากลับต้องได้ "ไม่มีอะไรเปลี่ยน"
- **Template นำเข้าพนักงานเป็น .xlsx 2 sheet** (`utils/employeeTemplate.js` มีเทสต์) — sheet "พนักงาน" กรอก · sheet "ข้อมูลอ้างอิง" = บริษัท (COMPANIES) / แบรนด์ / แผนก / ตำแหน่ง จาก fieldOptions
  นำเข้ารับ .xlsx (อ่าน sheet "พนักงาน" → `sheetToCsv` → ขั้นตอน CSV เดิม) และ .csv · โหลด `xlsx` แบบ dynamic import เท่านั้น (ไฟล์ ~420KB)
- **หัวหน้างาน** — ระบบเก็บ `employees.manager` = ชื่อหัวหน้า (+ `managerEmpId` เมื่อเลือกจากรายการ/นำเข้า) · ไฟล์นำเข้า/ส่งออกใช้ "รหัสหัวหน้า"
  นำเข้าแปลงรหัส → ชื่อ จากพนักงานในระบบ + คนในไฟล์เดียวกัน (หาไม่เจอ = เว้นว่าง แจ้งท้าย) · ส่งออกหารหัสด้วย `managerCodeOf` (`utils/managers.js`)
  template มี sheet "รายชื่อพนักงาน" ไว้หารหัส
- **ช่องที่ดึงจากตัวเลือกฟิลด์ (บริษัท/แผนก/ตำแหน่ง/ผู้จำหน่าย/แบรนด์ ฯลฯ) สร้างค่าใหม่ในฟอร์มไม่ได้** — `FieldOptionSelect` default `allowCustom=false`
  ต้องเพิ่มที่ ตั้งค่า → ตัวเลือกฟิลด์ ก่อน (ผู้ใช้สั่ง) · ค่าเดิมที่ไม่อยู่ในรายการยังแสดง/บันทึกต่อได้ · นำเข้า CSV/Excel ยังไม่ตรวจกับรายการ
- **แบรนด์ที่ดูแล** — `employees.brands` = อาร์เรย์ (เลือกได้หลายค่า · `MultiOptionField`) ตัวเลือกที่ `fieldOptions.brands`
  CSV/Excel ใช้คอลัมน์เดียว "แบรนด์ที่ดูแล" คั่นจุลภาค (template + ส่งออก) · นำเข้ารับ "แบรนด์" / "แบรนด์ 1..N" ด้วย (`collectImportedBrands`) · อ่าน/แสดงผ่าน `toBrands` / `brandsText` (`utils/brands.js`)
- **รหัสผ่าน M365 อยู่ที่ `employee_secrets/{empDocId}` ไม่ใช่ใน `employees`** — `employees` อ่านได้ทุกคนที่ login
  อ่าน/เขียนผ่าน `utils/employeeSecrets.js` เท่านั้น (`loadM365Password` / `saveM365Password` / `splitM365Password`)
  rules ห้ามสร้างพนักงานที่มี `m365Password` ในเอกสาร · ตรวจสิทธิ์ด้วย `npm run test:rules` (ต้องเปิด emulator)
- **รูปประเมินสภาพเก็บเป็น base64 ในเอกสาร** — Firebase Storage ยังไม่ได้เปิด (bucket ตอบ 404 · ต้องอัปเป็นแพลน Blaze ถึงสร้างได้)
  เดิมลอง Storage ก่อนทุกรูป → ค้าง 8 วิ/รูป ผู้ใช้คิดว่าระบบค้าง · เปิด Storage วันไหนให้ตั้ง `STORAGE_ENABLED = true` ใน `utils/uploadPhoto.js`
  อ่านรูปไม่ได้ (HEIC จาก iPhone / ไฟล์เสีย) `compressImage` โยน Error ภาษาไทย → ช่องแนบรูปแสดงข้อความ (ห้ามกลืน error เงียบ)
- **ไทม์ไลน์รายตัว** (แท็บในหน้าต่างรายการย่อย) — `buildSeatTimeline` จับสิทธิ์ด้วย Product Key · `buildAccessoryItemTimeline` จับชิ้นด้วย SN (timeline/buildTimeline.js)
  ไม่มี Key/SN หรือ Key ซ้ำ → เห็นแค่รอบที่ถืออยู่ (จับด้วย checkoutId) · รายการจ่าย License บันทึก `checkoutId` ตั้งแต่ 11/2026
  **ย้ายสิทธิ์ License (จ่าย/ผูก/ถอด/คืน/ลบ/เพิ่ม) ต้องผ่าน `utils/licenseSeats.js` เสมอ** — `takeSeat` / `returnSeats` / `removeAvailableSeats` ย้ายทุกฟิลด์รายสิทธิ์ (`SEAT_FIELDS`)
  และ `seatId` (รหัสประจำสิทธิ์ ให้ไทม์ไลน์ตามสิทธิ์ที่ไม่มี Product Key) · `api/cascade-delete.js` มีสำเนา `SEAT_FIELDS` แก้คู่กัน
  ไทม์ไลน์ License: จับด้วย `licenseId` → `assetId` (คืนสิทธิ์รุ่นเก่า) → ชื่อ (เฉพาะรายการหลังวันสร้าง License — กันประวัติของตัวที่ลบไปแล้วแต่ชื่อซ้ำ)
  เทสต์: `npm test` (node --test · `src/**/*.test.mjs`)
- คอลัมน์ตารางทรัพย์สินมีทั้ง `note` (หมายเหตุ) และ `remark` (Remark) — คนละฟิลด์กัน
- วันที่แสดงผลรูปแบบ DD/MM/YYYY ผ่าน `utils/formatDate.js`

### ย้ายไป Supabase (branch `supabase-migration` — ใช้ Supabase แล้ว · main ยังเป็น Firebase)

แผน + เช็กลิสต์วันสลับ + env: `docs/SUPABASE-MIGRATION.md` · แนวทาง = 1 collection = 1 ตาราง (`id`, `data jsonb`)
- **บน branch นี้ไม่มี Firebase ในหน้าเว็บแล้ว** — `src/firebase.js` (ชื่อเดิม) ส่งออก `db` = compat · `auth` = `src/db/auth.js`
  import คำสั่งฐานข้อมูลจาก `src/db/compat.js` (หน้าตาเหมือน `firebase/firestore`) · ห้าม import `firebase/*` ใน src อีก
- สิทธิ์อยู่ที่ `supabase/migrations/*.sql` (ไม่ใช่ `firestore.rules`) → แก้แล้วรัน `npm run test:supabase` + สร้าง `supabase/setup.sql` ใหม่ (รวมทุกไฟล์)
  migration ใหม่ต้องให้เจ้าของวางใน SQL Editor เอง (ไม่มีรหัสฐานข้อมูลในเครื่อง)
- เพิ่ม collection ใหม่ = เพิ่มตารางใน migration + `TOP_TABLES` ใน `src/db/codec.js`
- `api/` ใช้ service role ผ่าน `api/_lib/supabaseAdmin.js` · `npm run dev` รัน `api/` ในเครื่อง (vite.config.js) ค่าลับจาก `.env.migration.local`
- Hosting = Vercel ทีมบริษัท `globe-syndicate` → โปรเจค `it-asset-management` · โดเมน **`it.gbos.app`** (+ `gbos.app`)
  deploy ด้วย **Vercel CLI จากเครื่อง** (`vercel --prod`) ยังไม่ได้ผูก GitHub · ค่า env ส่งด้วย `node scripts/vercel-env-push.mjs`
  `.vercelignore` เป็นรายการอนุญาต — กัน `.env*.local` / `.supabase-export/` / `*-preview.html` ไม่ให้ขึ้นเซิร์ฟเวอร์
  วันสลับต้องย้าย `itassetmenagement.vercel.app` (โปรเจคเดิมในบัญชีส่วนตัว) มาที่นี่ด้วย เพราะ QR สติกเกอร์ที่พิมพ์แล้วชี้โดเมนนั้น · `src/utils/publicUrl.js`
  หน้าเว็บ + `api/` host เดียวกัน → `VERCEL_API_BASE` = '' · ตั้งค่าใน `vercel.json` (ฟังก์ชันรัน sin1)
- พนักงาน = ผู้ใช้ Supabase Auth ที่ `api/staff-login` สร้าง (`app_metadata.app_role = 'staff'`) · ข้อมูลใน Supabase ตอนนี้เป็นสำเนาซ้อม

### ตรวจ syntax เร็วๆ หลังแก้ JSX
```bash
npx esbuild --loader:.jsx=jsx src/components/ไฟล์.jsx --outdir="$TEMP/check" --log-level=error
```
