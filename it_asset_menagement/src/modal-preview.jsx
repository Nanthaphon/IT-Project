/* Dev harness ดู AssetDetailsModal ธีม v3 โดยไม่ต้องล็อกอิน
   เปิดที่ http://localhost:5173/modal-preview.html — ไม่เข้า production build */
import './index.css';
import './firebase.js';                 // ให้ getFirestore() ใน modal มี app ให้เกาะ
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import AssetDetailsModal from './components/AssetDetailsModal.jsx';

const noop = (...a) => console.log('action:', ...a);

const ASSET = {
  id: 'a1',
  assetTag: 'GS-1042',
  name: 'Dell Latitude 5440',
  model: 'Latitude 5440',
  sn: 'SN70421',
  type: 'โน๊ตบุ๊ค',
  status: 'ถูกใช้งาน',
  company: 'Globe Syndicate',
  vendor: 'JIB Computer',
  forDepartment: 'Design Experience',
  department: 'Design Experience',
  assignedTo: 'e1',
  assignedName: 'สมชาย ใจดี',
  cost: 32000,
  scrapValue: 9000,
  purchaseDate: '2024-03-15',
  warrantyDate: '2027-03-15',
  note: 'เปลี่ยน SSD เป็น 1TB แล้ว',
  remark: 'เครื่องสำรองของฝ่าย',
  documents: [],
  items: [],
  photoGallery: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHElEQVQI12P4z8DwHwwZGBgYmBgYGBgYGBgYAAA5ZgQVAAAAAElFTkSuQmCC", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHElEQVQI12P4z8DwHwwZGBgYmBgYGBgYGBgYAAA5ZgQVAAAAAElFTkSuQmCC"],
};


/* 🆕 ข้อมูลสมมติให้แท็บ "ไทม์ไลน์" มีอะไรแสดง */
const ago = (d) => new Date(Date.now() - d * 86400000).setHours(10, 24, 0, 0);
const TIMELINE_TX = [
  { assetId: "a1", action: "เบิกจ่าย", empName: "สมชาย ใจดี", condition: "ปกติ",
    remarks: "เครื่องใหม่ ส่งมอบพร้อมอุปกรณ์ครบ", timestamp: ago(700), checkoutId: "co1" },
  { assetId: "a1", action: "รับคืน", empName: "สมชาย ใจดี", condition: "ปกติ",
    remarks: "-", timestamp: ago(400), checkoutId: "co1" },
  { assetId: "a1", action: "เบิกจ่าย", empName: "ณัฐธิดา เพชรแก้ว", condition: "ปกติ",
    remarks: "-", timestamp: ago(380), checkoutId: "co2" },
  { assetId: "a1", isAssetBound: true, category: "licenses", action: "เบิกจ่าย",
    licenseName: "Microsoft 365 Business", empName: "ณัฐธิดา เพชรแก้ว", timestamp: ago(370) },
];
const TIMELINE_REPAIRS = [
  { assetId: "a1", empName: "ณัฐธิดา เพชรแก้ว", issue: "พัดลมเสียงดัง",
    status: "กำลังดำเนินการ", timestamp: ago(12) },
];

const EMPLOYEES = [{ id: 'e1', empId: 'EMP101', fullName: 'สมชาย ใจดี', department: 'Design Experience' }];


/* 🆕 เคส License สำหรับตรวจ "รายการผู้ถือสิทธิ์"
   12 สิทธิ์: ว่าง 3 · พนักงานถือ 7 · ผูกกับเครื่อง 2
   หนึ่งสิทธิ์ตั้งวันหมดอายุเองต่างจากระดับ License เพื่อดูว่าขึ้นเฉพาะตัวนั้น */
const HOLDERS = ['นางสาวอลิสา แดงวิเชียร (Jan)', 'Mr.Amorn Puttagotirat (Art)',
  'Mr.Boonchai Putakotirat (Man)', 'นายวัฒนา มีเย็น (มอส)', 'ณัฐธิดา เพชรแก้ว',
  'ธณกร น้อยหมอ', 'พรชนก แก้วเข้ม'];

const LICENSE_DEMO = {
  id: 'lic-demo',
  name: 'Microsoft 365 Business Basic (Globe)',
  supplier: 'Mail Master',
  productKey: 'Admin@globesyndicate.co.th',
  quantity: 12,
  purchaseDate: '2026-08-10',
  expirationDate: '2027-08-10',
  status: 'มีสิทธิ์ว่าง',
  availableKeys: ['msolicq2708@outlook.com', '', 'msolicq2710@outlook.com'],
  availableSeatExpirationDates: ['', '2026-12-31', ''],
  assignees: [
    ...HOLDERS.map((empName, i) => ({
      checkoutId: 'co' + i, empId: 'e' + i, empName,
      checkoutDate: '18/06/2569',
      productKey: 'msolicq' + (2720 + i) + '@outlook.com',
    })),
    { checkoutId: 'cb1', isAssetBound: true, assignedAssetId: 'a1',
      assignedAssetName: 'Dell Latitude 5440', empName: 'สมชาย ใจดี',
      productKey: 'msolicq2799@outlook.com' },
    { checkoutId: 'cb2', isAssetBound: true, assignedAssetId: 'a2',
      assignedAssetName: 'HP ProBook 450', empId: null,
      productKey: 'msolicq2800@outlook.com' },
  ],
};


/* เคสที่ผู้ใช้เจอบั๊ก: 2 สิทธิ์ และ seatLabel เป็นชื่อแพ็กเกจยาวมาก */
const LICENSE_LONG = {
  id: 'lic-long', name: 'Sketchup Pro', supplier: 'Trimble',
  quantity: 2, expirationDate: '2027-02-12',
  assignees: [
    { checkoutId: 'L1', empId: 'e1', empName: 'นางสาวมณฑิตา กันนิกา (Tangmoo)',
      checkoutDate: '18/06/2569', seatExpirationDate: '2026-10-31',
      seatLabel: 'SketchUp Pro Single User Annual Subscription Renewal (1 Year)',
      productKey: 'Yuwadee.P@globesyndicate.co.th' },
    { checkoutId: 'L2', empId: 'e2', empName: 'นางสาวสุนันทา หัสดีธรรม (Nuss)',
      checkoutDate: '18/06/2569', seatExpirationDate: '2027-02-12',
      seatLabel: 'SketchUp Pro 2026 Commercial Windows/Mac Single User' },
  ],
};

function Harness() {
  const [detail, setDetail] = useState(ASSET);
  const [cat, setCat] = useState('assets');
  const showLicense = () => { setDetail(LICENSE_DEMO); setCat('licenses'); };
  const showLong = () => { setDetail(LICENSE_LONG); setCat('licenses'); };
  const showAsset = () => { setDetail(ASSET); setCat('assets'); };
  if (!detail) {
    return (
      <div className="p-10">
        <button onClick={() => setDetail(ASSET)} className="rounded-xl bg-clay-600 px-4 py-2.5 text-sm font-medium text-white">
          เปิด modal อีกครั้ง
        </button>
      </div>
    );
  }
  return (
    <>
    <div className="fixed left-4 top-4 z-[200] flex gap-2 rounded-xl border border-stone-200/60 bg-white p-2 shadow-sm">
      <button onClick={showAsset} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${cat === 'assets' ? 'bg-clay-600 text-white' : 'text-stone-600'}`}>ทรัพย์สิน</button>
      <button onClick={showLicense} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${detail?.id==='lic-demo' ? 'bg-clay-600 text-white' : 'text-stone-600'}`}>License</button>
      <button onClick={showLong} className={`rounded-xl px-3 py-1.5 text-sm font-medium ${detail?.id==='lic-long' ? 'bg-clay-600 text-white' : 'text-stone-600'}`}>ชื่อยาว 2 สิทธิ์</button>
    </div>
    <AssetDetailsModal
      selectedAssetDetail={detail}
      setSelectedAssetDetail={setDetail}
      selectedAssetCategory={cat}
      setSelectedAssetCategory={setCat}
      assets={[ASSET]}
      accessories={[]}
      licenses={[]}
      transactions={TIMELINE_TX}
      employees={EMPLOYEES}
      repairRequests={TIMELINE_REPAIRS}
      setCheckoutModal={noop}
      setReturnModal={noop}
      handleCheckin={noop}
      openEditLicenseModal={noop}
      openEditAssetModal={noop}
      setRepairModal={noop}
      setRepairQuantity={noop}
      setRepairRemarks={noop}
      showConfirm={noop}
      setCustomAlert={noop}
      handleAssignLicenseToAsset={noop}
      handleRevokeLicenseFromAsset={noop}
    />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
    <Harness />
  </div>,
);

export default Harness;
