# IT Asset Management — Globe Syndicate (Thailand)

ระบบจัดการทรัพย์สิน IT · React 19 + Vite + Tailwind v4 + Firebase (Firestore/Auth) + Vercel Functions

**ภาษา:** ตอบเป็นภาษาไทย · UI ทั้งหมดเป็นภาษาไทย

---

## ข้อกำหนดสำคัญ

- **ห้าม deploy หรือ push ขึ้น GitHub จนกว่าผู้ใช้จะสั่ง** — ทำและทดสอบบน localhost (`npm run dev`) เท่านั้น
- Vercel Functions ใน `api/` ใช้เฉพาะ staff auth + Teams notification (ไม่ใช่ backend หลัก)

---

## Design System — "ธีมฝั่งพนักงาน"

ทั้งระบบยึดธีมของฝั่งพนักงาน (`src/components/StaffView.jsx`) เป็นมาตรฐาน
เมื่อผู้ใช้บอกว่า *"ทำเมนู X ให้เป็นธีมพนักงาน"* ให้ใช้กฎด้านล่างนี้ทันที **ไม่ต้องไปอ่าน StaffView ใหม่**

### สีหลัก
```
navy (primary)  #1E487A     hover  #163963
พื้นหลังหน้าจอ   #F1F5FA
```

### Token ที่ใช้บ่อย (copy ได้เลย)

```jsx
// การ์ด — เงานุ่มโทนน้ำเงิน ไม่ใช้ ring
const CARD = 'bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)]';

// label เล็กเหนือค่า
const LABEL = 'text-[11px] font-semibold text-slate-400 uppercase tracking-wide';
```

### กฎการออกแบบ

| องค์ประกอบ | ใช้ | ห้ามใช้ |
|---|---|---|
| **การ์ด** | `rounded-xl` + `border border-slate-200/70` + เงานุ่มด้านบน | `ring-1`, `rounded-2xl`, `shadow-md/lg` |
| **ปุ่มหลัก** | `bg-[#1E487A] text-white rounded-lg hover:bg-[#163963]` แบบทึบ | ปุ่ม outline, gradient, เงาสี |
| **ปุ่มรอง** | `bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300` | ring, สีเข้ม |
| **ปุ่มลบ/ปฏิเสธ** | ปุ่มขาว + `text-rose-600` + `hover:border-rose-300 hover:bg-rose-50` | พื้นแดงทึบ |
| **ปุ่มรับคืน** | ปุ่มขาว + `text-emerald-600` + `hover:border-emerald-300` | teal, พื้นเขียวทึบ |
| **Badge สถานะ** | `rounded-md` + `border` สีอ่อน + `text-xs font-semibold` | pill กลม (`rounded-full`), `ring-1 ring-inset`, จุด `animate-pulse` |
| **ช่องกรอก** | `border border-slate-200 rounded-lg` + `focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A]` | `border-slate-300`, `focus:ring-1` |
| **ปุ่ม icon** | `w-7 h-7 bg-white border border-slate-200 rounded-lg` + hover เปลี่ยนสีขอบ | `ring-1 ring-inset` |
| **รูป/ไอคอน** | `rounded-lg` + `border border-slate-200` | `rounded-xl` + `ring` + `shadow-sm` |
| **สถิติด้านบน** | จุดสีเล็ก + ตัวเลข + LABEL คั่นด้วย `divide-x divide-slate-100` | กล่องสีเต็ม (เหลือง/เขียว/แดง) |
| **Filter pill** | `rounded-lg` · active = พื้นกรมทึบ · inactive = `text-slate-500 hover:bg-slate-100` | pill กลม + เงา |

**หลักคิด:** เรียบ บาง สะอาด — ตัดเงาหนัก ตัด ring ตัด animation ตัด emoji ในป้ายสถานะ

---

### 🆕 สไตล์ v2 — "clean / airy / modern" (มาตรฐานใหม่ ใช้กับหน้าที่ redesign ใหม่)

อ้างอิงหน้า Email Signature generator ที่ user ชอบ · **นำร่องแล้วที่ `DashboardStats.jsx`**
v2 คือ v1 + โปร่งขึ้น + มุมนุ่มขึ้น + สีน้อยลง (ไม่ขัดกับกฎด้านบน แค่ยกระดับ)

```jsx
// การ์ด v2 — มุมนุ่ม เงาฟุ้ง airy
const CARD = 'bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(16,47,87,0.03),0_14px_36px_-20px_rgba(16,47,87,0.14)]';
```

| องค์ประกอบ | v1 (ตาราง/หนาแน่น) | v2 (redesign ใหม่) |
|---|---|---|
| **มุมการ์ด** | `rounded-xl` (12px) | **`rounded-2xl`** (16px) |
| **ขอบการ์ด** | `border-slate-200/70` | `border-slate-200/60` (จางลง) |
| **เงา** | นุ่ม | ฟุ้งกว่า airy |
| **padding การ์ด** | `p-5` | **`p-6`** |
| **gap ระหว่างการ์ด** | `gap-4` | **`gap-5`/`gap-6`** |
| **หัวหน้า (page header)** | ไม่มี | **มี** `<h1>` 22px + subtitle สีจาง |
| **หัวการ์ด** | ไอคอนเล็ก | **IconBadge** `w-9 h-9 rounded-xl` พื้นสีอ่อน (tint) |
| **ตัวเลขเด่น** | 18-20px | **26-30px** bold |
| **ความกว้างหน้า** | เต็มจอ | `max-w-[1400px] mx-auto` |
| **สีในกราฟ/badge** | หลายเฉด + gradient bar | **สีเดียวเรียบ** ลด noise |

**IconBadge pattern (หัวการ์ด v2):**
```jsx
<div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint, color }}>
  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
</div>
// tint สีอ่อน: navy #EFF6FF · violet #F5F3FF · emerald #ECFDF5 · amber #FFFBEB · green #F0FDF4
```

**Segmented toggle (v2 — แทน dropdown/pill กลม เมื่อเลือก 2-3 ตัว):**
```jsx
// container: bg-slate-100 p-1 rounded-xl · ปุ่ม active: bg-white shadow-sm text-slate-800 · inactive: text-slate-500
```

**หน้าที่ทำ v2 แล้ว:** ✅ Dashboard (`DashboardStats.jsx`)

### Badge สีตามสถานะ (ตรงกับ `statusBadge()` ใน StaffView)
```
รอดำเนินการ    bg-amber-50   text-amber-700   border-amber-200
กำลังดำเนินการ  bg-blue-50    text-blue-700    border-blue-200
เสร็จสิ้น/อนุมัติ bg-emerald-50 text-emerald-700 border-emerald-200
ปฏิเสธ/ผิดพลาด  bg-rose-50    text-rose-700    border-rose-200
```

### สถานะการทำธีม (อัปเดตเมื่อทำเพิ่ม)
- ✅ ขอเปลี่ยนเครื่อง — `ReplacementRequestTable.jsx`
- ✅ โปรแกรม / License — `LicenseTable.jsx` + ส่วน license ใน `AssetDetailsModal.jsx` (รวม SeatDetailModal)
- ✅ อุปกรณ์เสริม — `AccessoryTable.jsx` + ส่วน accessories ใน `AssetDetailsModal.jsx` + footer ของ modal
- ✅ อุปกรณ์สำนักงาน — `OfficeSupplyTable.jsx` + `EditAssetModal.jsx` + `AddModal.jsx`
- ✅ **Token กลาง** — `ui/theme.js` (`cls.card`, `cls.modalShell`, `cls.badge`, `cls.btnPrimary`) + `ui/primitives.jsx` (`BADGE_CLS`) เข้าธีมแล้ว → modal/badge ที่ใช้ primitives ได้ธีมอัตโนมัติ
- ⬜ ทรัพย์สิน · แจ้งซ่อม · คำขอเบิก · พนักงาน

---

## โครงสร้างที่ควรรู้

```
src/
  App.jsx                    ศูนย์กลาง state + handlers ทั้งหมด (ไฟล์ใหญ่)
  components/
    StaffView.jsx            ฝั่งพนักงาน — ต้นแบบธีม
    Sidebar.jsx              เมนู admin (ธีม navy gradient)
    AssetDetailsModal.jsx    modal รายละเอียด — ใช้ร่วม assets/accessories/licenses
    *Table.jsx               ตารางแต่ละเมนู
  ui/
    theme.js                 BRAND, cls.*, COMPANIES
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
