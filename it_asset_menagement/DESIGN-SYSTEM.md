# ยกชุด UI นี้ไปใช้กับโปรเจคอื่น

คู่มือย้าย design system ของ IT Asset Management ไปเริ่มโปรเจคใหม่ พร้อมเปลี่ยนโทนสี

ตรวจตัวเลขทั้งหมดในเอกสารนี้จากโค้ดจริงเมื่อ 23 ก.ย. 2569

---

## สรุปสั้น

ชั้น design system **ไม่มีไฟล์ไหนแตะ Firebase เลย** พึ่งแค่ React + lucide-react + Tailwind v4
ก๊อป 12 ไฟล์ (~1,960 บรรทัด) ไปวางแล้วใช้ได้เลย

สิ่งที่ทำให้หน้าตาเป็นชุดเดียวกันคือ **กฎ** ไม่ใช่สี — อ่าน `CLAUDE.md` หัวข้อ Design System
แล้วยกกฎไปด้วย ไม่งั้นโปรเจคใหม่จะเพี้ยนภายในเดือนเดียว

---

## 1. สิ่งที่ต้องลง

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm i lucide-react
npm i -D tailwindcss @tailwindcss/vite
```

`vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({ plugins: [react(), tailwindcss()] })
```

> ต้องเป็น **Tailwind v4** เท่านั้น — ธีมทั้งชุดใช้บล็อก `@theme` ซึ่ง v3 ไม่มี

---

## 2. ไฟล์ที่ต้องก๊อป

ก๊อปตามโครงเดิมได้เลย ไม่ต้องแก้ path

| ไฟล์ | บรรทัด | หน้าที่ |
|---|---|---|
| `src/index.css` | 48 ค่าสี | **นิยามสีทั้งระบบ** |
| `src/ui/earth.js` | 92 | token `surface`/`text`/`button` + `statusTone()` + `fmt` |
| `src/ui/earthUI.jsx` | 331 | `DataTable` `Row` `Cell` `CellTitle` `Clamp` `Thumb` `StatusBadge` `SearchInput` `Pagination` `EmptyState` `Popover` `ActionMenu` `MetricCard` `Panel` `BulkBar` |
| `src/ui/useDismiss.js` | 20 | ปิด popover เมื่อคลิกนอก/กด Esc |
| `src/ui/theme.js` | 105 | `BRAND` + `cls` ของ modal |
| `src/ui/primitives.jsx` | 182 | `Modal` `ModalHeader/Body/Footer` `Field` `Button` `Card` `Badge` `PageHeader` |
| `src/ui/ImageViewer.jsx` | 70 | ดูรูปเต็มจอ (กด Esc ปิด) |
| `src/components/list/ListPage.jsx` | 263 | โครงหน้ารายการ — ค้นหา/กรอง/คอลัมน์/แบ่งหน้า/เลือกหลายรายการ |
| `src/components/list/ItemsToolbar.jsx` | 183 | แถบหัวของรายการย่อยใน modal |
| `src/components/list/filterOptions.js` | 35 | ตัวเลือกตัวกรองสำเร็จรูป |
| `src/components/timeline/Timeline.jsx` | 211 | ไทม์ไลน์ (ตัวแสดงผล) |
| `src/utils/printTheme.js` | 79 | สีสำหรับไฟล์ที่พิมพ์ออก |

### ที่ไม่ควรก๊อปตรง ๆ

| ไฟล์ | ทำไม |
|---|---|
| `src/components/timeline/buildTimeline.js` | ผูกกับโดเมนทรัพย์สิน IT (assets/licenses/repairs) — เอาไปเป็นตัวอย่างการเขียน builder ของโดเมนใหม่แทน |
| `src/utils/print*.js` ตัวอื่น | เป็นแบบฟอร์มเฉพาะงาน (ใบส่งมอบ/ใบรับคืน) |
| `src/ui/earth.js` เฉพาะ `STATUS_TONE` | มีสถานะภาษาไทย 14 ค่าของงานทรัพย์สิน — เปลี่ยนเป็นสถานะของโดเมนใหม่ |

---

## 3. เปลี่ยนโทนสี

### ตอนนี้ต้องแก้ 3 ไฟล์

**1) `src/index.css` — บล็อก `@theme`** (ตัวหลัก 48 ค่า)

ไม่ต้องคิดเองทั้ง 48 ค่า เลือกสีฐาน 5–6 ตัวก่อน แล้วไล่ไล่โทนอ่อน/เข้มรอบ ๆ

```css
@theme {
  --color-clay-600: #2B6777;   /* สีแบรนด์ — ปุ่ม ไฮไลท์ sidebar */
  --color-clay-700: #225462;   /* hover */
  --color-clay-900: #12303A;   /* พื้น sidebar */
  --color-sand-50:  #F7F9FA;   /* พื้นหน้าจอ */
  --color-olive-600:#3D8072;   /* สถานะสำเร็จ */
  /* ... */
}
```

> **ชื่อ token ไม่ต้องตรงกับสี** — `clay` เคยเป็นสีส้มอิฐ ตอนนี้เป็น teal
> ตั้งใจไม่ rename เพื่อไม่ต้องแตะคลาสในคอมโพเนนต์นับพันจุด
> ถ้าโปรเจคใหม่อยากได้ชื่อที่สื่อบทบาท (`brand-*` `success-*` `danger-*`)
> ให้ rename ตอนเริ่มเลย ทำทีหลังแพงกว่ามาก

**2) `src/ui/theme.js` — `BRAND`**

มีสี hardcode ซ้ำกับ `index.css` 5 ค่า ใช้อยู่ **43 จุด** ผ่าน `style={{}}`
(จำเป็น เพราะ inline style ใช้คลาส Tailwind ไม่ได้)

**3) `src/utils/printTheme.js` — `P` และ `TONE`**

หน้าพิมพ์เปิดใน window ใหม่ที่ไม่มี Tailwind จึงต้องเขียนค่าสีตรง ๆ

### ตรวจคอนทราสต์ก่อนใช้จริง

สีที่ดูดีบนจอ อาจอ่านไม่ออกตอนเป็นตัวอักษรเล็ก เคยเจอมาแล้วทั้งสองแบบ:

- `#52ab98` เป็นพื้นปุ่มตัวอักษรขาว = 2.75:1 — ไม่ผ่าน ต้องใช้ `#3D8072` (4.64:1)
- ป้าย "ตัดจำหน่าย" บนกระดาษ 9.5px = 2.78:1 — บนจอใช้ได้ บนกระดาษอ่านแทบไม่ออก

เกณฑ์: ตัวอักษรปกติต้อง **≥ 4.5:1** · ป้ายเล็ก (10px) ยิ่งต้องเผื่อ

---

## 4. ของที่จะมาขวาง

**hex hardcode ค้างอยู่ 167 จุด** ในหน้าต่าง ๆ — พวกนี้จะไม่เปลี่ยนตามธีม ต้องไล่แก้มือ

| ไฟล์ | จุด |
|---|---|
| `StaffView.jsx` | 57 |
| `SupplyRequestTable.jsx` | 17 |
| `ITReportModal.jsx` | 16 |
| `KpiDashboard.jsx` | 15 |
| `ITReportPreview.jsx` | 14 |
| `AccessoryRequestTable.jsx` | 14 |

ถ้าไม่ได้ก๊อปหน้าพวกนี้ไปด้วยก็ไม่ต้องสนใจ — ชั้น design system เองเหลือ hex แค่ 19 จุด
(ส่วนใหญ่เป็นสีสถานะใน `statusTone` ที่ต้องเป็นค่าตรงอยู่แล้ว)

---

## 5. กฎที่ต้องยกไปด้วย

ย่อจาก `CLAUDE.md` — ฉบับเต็มอยู่ในหัวข้อ Design System

| เรื่อง | กฎ |
|---|---|
| ขนาดตัวอักษร | **9 ค่าเท่านั้น** `10 · 11 · 12 · 13 · 14 · 15 · 19 · 22 · 30` ห้ามค่าครึ่งพิกเซล |
| ความหนา | **`font-normal` กับ `font-medium` เท่านั้น** ห้าม semibold/bold |
| ไอคอน | `lucide-react` เท่านั้น · `strokeWidth={2}` ค่าเดียว · ห้ามเขียน `<svg>` เอง · ห้ามใช้ emoji แทนไอคอน |
| การ์ด | `rounded-2xl` + `border-stone-200/60` + เงาบาง |
| Badge | `rounded-lg` + พื้นอ่อน **ไม่มีขอบ** + `font-medium` |
| ตาราง | หัวตารางไม่มีพื้น · แถว `py-4` · เส้นคั่นบาง |
| สถานะ | ใช้ `statusTone()` เสมอ ห้ามเขียนสีที่คอมโพเนนต์ |
| หน้า | `max-w-[1360px]` + `p-6 lg:p-8` |
| ข้อความไทยในตาราง | ต้อง `whitespace-nowrap` — ไทยไม่มีเว้นวรรค เบราว์เซอร์ตัดกลางคำได้ |

**เหตุผลที่ต้องคุมขนาด/ความหนา:** ระบบนี้เคยมีขนาดตัวอักษร 30 ค่า และ `strokeWidth` 12 ค่า
ทุกหน้าสีตรงธีมหมดแต่ยังดูไม่เป็นชุดเดียวกัน จนมาคุมสองอย่างนี้ถึงหาย

---

## 6. เครื่องมือที่ควรยกไปด้วย

**Dev harness** — ดูหน้าได้โดยไม่ต้องล็อกอิน ไม่ต้องต่อฐานข้อมูล

สร้าง `xxx-preview.html` ที่ root + `src/xxx-preview.jsx` แล้วเปิด `localhost:5173/xxx-preview.html`
Vite build เฉพาะ `index.html` ไฟล์พวกนี้จึงไม่ขึ้น production

คุ้มมาก — งาน UI ทั้งหมดในโปรเจคนี้ตรวจผ่าน harness ไม่ต้องแตะฐานข้อมูลจริง
และเป็นที่เดียวที่ทำให้จับบั๊กอย่าง "ข้อความไทยตกบรรทัดตอนคอลัมน์โดนบีบ" ได้

**สคริปต์ตรวจอัตโนมัติ** ที่มีอยู่แล้วและยกไปใช้ต่อได้

```bash
npm run check:needs    # ตรวจ mapping ของ Firestore (เฉพาะโปรเจคนี้)
```

แนะนำให้เขียนเพิ่มอีกตัวสำหรับโปรเจคใหม่: **ไล่หาคลาสสีที่ไม่มีนิยาม**
เคยเจอ `text-clay-950` กับ `hover:text-olive-900` ที่ Tailwind ไม่สร้างคลาสให้
เพราะไม่มีใน `@theme` — เป็นคลาสตายที่ไม่มี error ให้เห็น ป้ายบน sidebar เลยอ่านไม่ออกอยู่นาน

---

## 7. ลำดับที่แนะนำ

1. ตั้งโปรเจคใหม่ + ลง Tailwind v4 (ข้อ 1)
2. ก๊อป 12 ไฟล์ (ข้อ 2)
3. **เปลี่ยนสีใน `index.css` ให้เสร็จก่อนเขียนหน้าแรก** — ทำทีหลังแพงกว่ามาก
4. แก้ `BRAND` ใน `theme.js` + `P`/`TONE` ใน `printTheme.js` ให้ตรงกัน
5. เขียน `STATUS_TONE` ของโดเมนใหม่ใน `earth.js`
6. ลอก section Design System จาก `CLAUDE.md` ไปไว้ใน `CLAUDE.md` ของโปรเจคใหม่
7. ทำหน้าแรกด้วย `ListPage` — ส่งแค่ `columns` + `rowActions` + `toolbar`
   ดูตัวอย่างที่ `components/licenses/LicenseListPage.jsx` (~110 บรรทัด)

---

## 8. ข้อเสนอให้ทำก่อนยก (ยังไม่ได้ทำ)

**เปลี่ยนสีจากไฟล์เดียว** — ย้ายสีไปไว้ใน `src/ui/palette.js` เป็น JS ธรรมดา
แล้วให้ `theme.js` กับ `printTheme.js` import จากตรงนั้น
ส่วน `index.css` ให้เขียนสคริปต์ generate บล็อก `@theme` จาก `palette.js`
(Tailwind v4 บังคับให้ `@theme` เป็น CSS จริง สร้างจาก JS ตรง ๆ ไม่ได้)

หลังจากนั้น เปลี่ยนธีม = แก้ `palette.js` → `npm run theme:build` จบ

ควรทำ**ก่อน**ยกไปโปรเจคใหม่ ไม่งั้นโปรเจคที่ 2 จะลอกปัญหาสีซ้ำซ้อนไปด้วย
