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

## การรันเพื่อทดสอบ — ใช้ emulator เสมอ

`npm run dev` ต่อ **Firestore ตัวจริง** และ `useFirebaseData` ผูก listener 15
collection ทันทีที่ login → เปิดแอป 1 ครั้ง = อ่านหลายร้อย docs
การแก้ UI แล้ว hot-reload ซ้ำ ๆ จึงกินโควตาจนระบบใช้งานไม่ได้
(เคยเกิดมาแล้ว: `8 RESOURCE_EXHAUSTED: Quota exceeded` — login ไม่ได้ทั้งระบบ)

```bash
npm run emu        # หน้าต่าง 1 — เปิด emulator (ต้องมี Java)
npm run emu:seed   # หน้าต่าง 2 — เติมข้อมูลตัวอย่างครั้งแรก
npm run dev:emu    # หน้าต่าง 3 — เปิดแอปชี้ไป emulator
```

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
| **Modal** | overlay `bg-stone-950/50` · กล่อง `rounded-2xl` · หัว/ท้าย `px-7 py-5` | overlay ความมืดอื่น, `rounded-xl`, `shadow-2xl` |
| **ปุ่มรอง** | `bg-white border border-stone-200/60 rounded-xl text-stone-600` | ขอบทึบ |
| **ป้ายกำกับฟอร์ม** | `text-[13px] font-medium text-stone-500` | **`uppercase`**, `tracking-wide`, `font-semibold` |
| **Badge สถานะ** | `rounded-lg` + พื้นอ่อน **ไม่มีขอบ** + `font-medium` | pill กลม, `border`, `font-bold` |
| **ช่องกรอก** | `border-stone-200/60 rounded-xl` + `focus:ring-2 focus:ring-clay-600/15` | `rounded-lg`, `border-stone-300` |
| **ตัวเลขเด่น** | `text-3xl font-medium tabular-nums` | `font-bold`, `font-black` |
| **แถวตาราง** | `py-4` + `border-stone-100` บางๆ + hover | เส้นคั่นหนา, แถวแน่น |
| **หัวตาราง** | `text-[12px] font-medium text-stone-400` ไม่มีพื้น | พื้นเทา, `uppercase` |
| **หน้า** | `max-w-[1360px]` + `p-6 lg:p-8` + `space-y-6` | เต็มจอ, padding แน่น |

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
localhost:5173/submodal-preview.html    Seat / ชิ้นย่อยอุปกรณ์เสริม (sub-modal)
localhost:5173/form-preview.html        primitives กลาง + CheckoutModal
localhost:5173/preview-test.html        IT Report
localhost:5173/timeline-preview.html    ไทม์ไลน์ทรัพย์สิน / License
localhost:5173/login-preview.html       หน้าเข้าสู่ระบบ (ไม่ต้อง logout ของจริง)
```
ทุกตัวจำลอง app shell จริง ใช้ตรวจ integration ได้ · ไม่เข้า production build


## โครงสร้างที่ควรรู้

```
src/
  App.jsx                    ศูนย์กลาง state + handlers ทั้งหมด (ไฟล์ใหญ่)
  components/
    StaffView.jsx            ฝั่งพนักงาน (ยังไม่ได้ออกแบบโครงใหม่)
    Sidebar.jsx              เมนู admin (พื้น maroon clay-900)
    AssetDetailsModal.jsx    modal รายละเอียด — ใช้ร่วม assets/accessories/licenses
    *RequestTable.jsx        หน้า workflow อนุมัติ (ไม่ใช่ตารางธรรมดา)
    list/ListPage.jsx        โครงหน้ารายการกลาง — เมนูที่เป็นตารางใช้ตัวนี้
  ui/
    earth.js / earthUI.jsx   ⭐ token + component กลางของธีม v3
    theme.js / primitives.jsx  token ของ modal (BRAND, cls.*, COMPANIES)
    primitives.jsx           Modal, ModalHeader/Body/Footer, Field, Button
  utils/
    printAssetReport.js      PDF รายงานทรัพย์สิน (dynamic columns)
    uploadPhoto.js           อัปโหลดรูป — Storage ก่อน แล้ว fallback base64
api/                         Vercel Functions (staff auth, Teams notify)
```

### หมายเหตุสำคัญ

- **`AssetDetailsModal.jsx` ใช้ร่วม 3 ประเภท** (assets / accessories / licenses) — แก้ส่วนไหนต้องดูว่ากระทบประเภทอื่นไหม
- **`EditAssetModal.jsx` / `AddModal.jsx` ก็ใช้ร่วมกัน** ระหว่าง assets / accessories / office_supplies
- คอลัมน์ตารางทรัพย์สินมีทั้ง `note` (หมายเหตุ) และ `remark` (Remark) — คนละฟิลด์กัน
- วันที่แสดงผลรูปแบบ DD/MM/YYYY ผ่าน `utils/formatDate.js`

### ตรวจ syntax เร็วๆ หลังแก้ JSX
```bash
npx esbuild --loader:.jsx=jsx src/components/ไฟล์.jsx --outdir="$TEMP/check" --log-level=error
```
