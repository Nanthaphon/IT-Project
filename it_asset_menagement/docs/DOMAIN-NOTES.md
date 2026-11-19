# หมายเหตุระบบ (domain notes)

ย้ายมาจาก CLAUDE.md · อ่านเมื่อแก้ฟีเจอร์ที่เกี่ยวข้อง

## หมายเหตุสำคัญ

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

## Firebase emulator (branch main เท่านั้น)

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
