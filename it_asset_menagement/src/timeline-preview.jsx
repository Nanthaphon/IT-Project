/* Dev harness ดู Timeline โดยไม่ต้องต่อ Firestore
   เปิดที่ http://localhost:5173/timeline-preview.html — ไม่เข้า production build

   ข้อมูลในไฟล์นี้เป็นข้อมูลสมมติ ครอบทุกชนิดเหตุการณ์ + เคสขอบ
   (ไม่มีประวัติ / รายการที่จับคู่จากชื่อ / วันที่ล้วนไม่มีเวลา) */
import './index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Timeline from './components/timeline/Timeline.jsx';
import { buildAssetTimeline, buildLicenseTimeline, buildEmployeeTimeline } from './components/timeline/buildTimeline.js';

const day = 86400000;
const ago = (d, h = 10) => new Date(Date.now() - d * day).setHours(h, 24, 0, 0);

const ASSET = {
  id: 'asset1',
  name: 'Lenovo IdeaPad3 15IAU7 i3-1215U',
  assetTag: 'GS-1042',
  sn: 'SN70421',
  vendor: 'JIB Computer',
  cost: 18900,
  purchaseDate: '2023-03-15',
  purchaseHistoryLog: [
    { id: 'p1', purchaseDate: '2023-03-15', cost: 18900, vendor: 'JIB Computer',
      model: 'IdeaPad3 15IAU7', note: 'ซื้อพร้อมกระเป๋า', documents: [{}, {}] },
  ],
};

const TRANSACTIONS = [
  { assetId: 'asset1', action: 'เบิกจ่าย', empName: 'สมชาย ใจดี', condition: 'ปกติ',
    remarks: 'เครื่องใหม่ ส่งมอบพร้อมอุปกรณ์ครบ', timestamp: ago(700), checkoutId: 'co1' },
  { assetId: 'asset1', action: 'รับคืน', empName: 'สมชาย ใจดี', condition: 'ปกติ',
    remarks: '-', timestamp: ago(400), checkoutId: 'co1' },
  { assetId: 'asset1', action: 'เบิกจ่าย', empName: 'ณัฐธิดา เพชรแก้ว', condition: 'ปกติ',
    remarks: '-', timestamp: ago(380), checkoutId: 'co2' },
  { assetId: 'asset1', action: 'รับคืน', empName: 'ณัฐธิดา เพชรแก้ว', condition: 'ชำรุด',
    remarks: 'จอมีรอย คีย์บอร์ดปุ่ม F5 หลุด', timestamp: ago(120), checkoutId: 'co2' },
  { assetId: 'asset1', action: 'ซ่อมเสร็จ/เข้าคลัง', empName: 'ฝ่าย IT', condition: 'ปกติ',
    remarks: 'เปลี่ยนคีย์บอร์ดแล้ว', timestamp: ago(100) },
  { assetId: 'asset1', action: 'เบิกจ่าย', empName: 'วัฒนา มีเย็น (มอส)', condition: 'ปกติ',
    remarks: '-', timestamp: ago(90), checkoutId: 'co3' },
  // License ที่ผูกกับเครื่องนี้
  { assetId: 'asset1', isAssetBound: true, category: 'licenses', action: 'เบิกจ่าย',
    licenseName: 'Microsoft 365 Business', empName: 'ณัฐธิดา เพชรแก้ว', timestamp: ago(370),
    productKey: 'NKGV4-7W2XT-B7K2M-QQ8YT-PGKW9', keyCode: 'MS-0042' },
  { assetId: 'asset1', isAssetBound: true, category: 'licenses', action: 'รับคืน',
    licenseName: 'Microsoft 365 Business', timestamp: ago(121),
    productKey: 'NKGV4-7W2XT-B7K2M-QQ8YT-PGKW9', keyCode: 'MS-0042' },
  { assetId: 'asset1', isAssetBound: true, category: 'licenses', action: 'เบิกจ่าย',
    licenseName: 'Adobe Acrobat Pro', empName: 'วัฒนา มีเย็น (มอส)', timestamp: ago(88),
    productKey: 'ADBE-2024-PRO-77213' },
];

const REPAIRS = [
  { assetName: 'Lenovo IdeaPad3 15IAU7 i3-1215U', empName: 'ณัฐธิดา เพชรแก้ว',
    issue: 'คีย์บอร์ดปุ่ม F5 หลุด กดไม่ติด', status: 'ซ่อมเสร็จสิ้น', timestamp: ago(118) },
  { assetId: 'asset1', empName: 'วัฒนา มีเย็น (มอส)',
    issue: 'พัดลมเสียงดัง', status: 'กำลังดำเนินการ', timestamp: ago(12) },
];

const LICENSE = {
  id: 'lic1',
  name: 'Microsoft 365 Business',
  supplier: 'Microsoft',
  cost: 12000,
  purchaseDate: '2024-01-10',
};

const LIC_TX = [
  { category: 'licenses', licenseId: 'lic1', action: 'เบิกจ่าย', empName: 'สมชาย ใจดี',
    remarks: 'seat 1', timestamp: ago(600) },
  { category: 'licenses', licenseId: 'lic1', action: 'รับคืน', empName: 'สมชาย ใจดี',
    remarks: '-', timestamp: ago(420) },
  { category: 'licenses', licenseId: 'lic1', isAssetBound: true, action: 'เบิกจ่าย',
    assetName: 'Lenovo IdeaPad3 15IAU7', empName: 'ณัฐธิดา เพชรแก้ว', timestamp: ago(370) },
  { category: 'licenses', licenseId: 'lic1', isAssetBound: true, action: 'รับคืน',
    assetName: 'Lenovo IdeaPad3 15IAU7', timestamp: ago(121) },
  // รายการรุ่นเก่า: ไม่มี licenseId -> ต้องขึ้นป้าย "จับคู่จากชื่อ"
  { category: 'licenses', action: 'เบิกจ่าย', assetName: 'Microsoft 365 Business',
    empName: 'ธณกร น้อยหมอ', timestamp: ago(800) },
];


/* เคสจริงที่เจอบ่อย: รายการเก่าไม่ได้บันทึก productKey ไว้
   แต่สิทธิ์ยังผูกกับเครื่องนี้อยู่ -> ต้องดึงจากของจริงมาแสดง
   พร้อมบอกว่า (จากสิทธิ์ที่ผูกอยู่) */
const OLD_TX = [
  { assetId: 'asset1', isAssetBound: true, category: 'licenses', action: 'เบิกจ่าย',
    licenseId: 'licX', licenseName: 'Corona Solo Chaos', timestamp: ago(200) },
];
const LIC_BOUND = [
  { id: 'licX', name: 'Corona Solo Chaos',
    assignees: [{ isAssetBound: true, assignedAssetId: 'asset1',
      productKey: 'CRNA-SOLO-2024-88431', keyCode: 'CR-11' }] },
];

/* ── เคสพนักงาน: ของที่คนนี้เคยถือ + สิทธิ์ + งานแจ้งซ่อมที่ตัวเองแจ้ง ── */
const EMP = { id: 'emp1', fullName: 'ณัฐพงศ์ พงศ์ปฐมกุล' };

const EMP_ASSETS = [
  { id: 'asset1', assetTag: 'GCO-BD-6802001', sn: 'PF54VZJ2' },
  { id: 'asset9', assetTag: 'GCO-BD-6802099', sn: 'XZ99AA10' },
];

const EMP_TX = [
  { empId: 'emp1', category: 'assets', assetId: 'asset1', assetName: 'Lenovo IdeaPad3 15IAU7 i3-1215U',
    action: 'เบิกจ่าย', condition: 'ปกติ', remarks: 'เครื่องใหม่', timestamp: ago(400) },
  { empId: 'emp1', category: 'licenses', licenseName: 'Microsoft 365 Business Basic (Globe)',
    action: 'เบิกจ่าย', timestamp: ago(398), productKey: 'admin@globesyndicate.co.th' },
  { empId: 'emp1', category: 'accessories', assetName: 'Logitech Mouse M171',
    action: 'เบิกจ่าย', sn: 'MS-77120', remarks: '-', timestamp: ago(330) },
  { empId: 'emp1', category: 'assets', assetId: 'asset1', assetName: 'Lenovo IdeaPad3 15IAU7 i3-1215U',
    action: 'รับคืน', condition: 'ชำรุด', remarks: 'จอมีรอย', timestamp: ago(120) },
  { empId: 'emp1', category: 'licenses', licenseName: 'Microsoft Office 2021 Professional Plus (Globe)',
    action: 'เบิกจ่าย', timestamp: ago(60) },
  { empId: 'emp1', category: 'assets', assetId: 'asset9', assetName: 'Dell Latitude 3540',
    action: 'เบิกจ่าย', condition: 'ปกติ', remarks: '-', timestamp: ago(58) },
  /* รายการรุ่นเก่า: ไม่มีฟิลด์ productKey เลย -> ต้องขึ้น "ไม่ได้บันทึก Product Key ไว้" */
  { empId: 'emp1', category: 'licenses', licenseName: 'Adobe Acrobat Pro', action: 'รับคืน',
    timestamp: ago(500) },
  /* คนอื่น — ต้องไม่โผล่ */
  { empId: 'emp2', category: 'assets', assetName: 'ของคนอื่น', action: 'เบิกจ่าย', timestamp: ago(10) },
];

const EMP_REPAIRS = [
  { empId: 'emp1', assetName: 'Lenovo IdeaPad3 15IAU7 i3-1215U', issue: 'คีย์บอร์ดปุ่ม F5 หลุด',
    status: 'ซ่อมเสร็จสิ้น', timestamp: ago(125) },
  { empId: 'emp2', assetName: 'ของคนอื่น', issue: 'x', status: 'รอดำเนินการ', timestamp: ago(5) },
];

const TABS = {
  'ทรัพย์สิน — มีประวัติครบ': () => (
    <Timeline events={buildAssetTimeline(ASSET, TRANSACTIONS, REPAIRS)} />
  ),
  'License — เคยอยู่กับใคร/เครื่องไหน': () => (
    <Timeline
      events={buildLicenseTimeline(LICENSE, LIC_TX)}
      holderLabel="ผู้/เครื่องที่เคยใช้สิทธิ์"
      holderKinds={['seatOn', 'licOn']}
      assignLabel="จ่ายสิทธิ์ไปแล้ว"
      emptyHint="ยังไม่มีประวัติการใช้สิทธิ์ของ License นี้"
    />
  ),
  'รายการเก่า — ดึง key จากสิทธิ์ที่ผูกอยู่': () => (
    <Timeline events={buildAssetTimeline(ASSET, OLD_TX, [], LIC_BOUND)} />
  ),
  'พนักงาน — เคยถืออะไรบ้าง': () => (
    <Timeline
      events={buildEmployeeTimeline(EMP, EMP_TX, EMP_ASSETS, EMP_REPAIRS)}
      holderLabel="รายการที่เกี่ยวข้อง"
      holderKinds={['checkout', 'seatOn', 'licOn']}
      assignLabel="เบิก / รับสิทธิ์"
      ageLabel="ประวัติย้อนหลัง"
      emptyHint="ยังไม่มีประวัติของพนักงานคนนี้"
      renderAction={(e) => (e.kind === 'checkin' && e.cat === 'assets' ? (
        <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-clay-600 transition-colors hover:bg-stone-100">
          ใบรับคืน
        </button>
      ) : null)}
    />
  ),
  'ยังไม่มีประวัติ': () => (
    <Timeline events={buildAssetTimeline({ id: 'x' }, [], [])} />
  ),
};

function Harness() {
  const names = Object.keys(TABS);
  const [tab, setTab] = useState(names[0]);
  const View = TABS[tab];
  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-[1360px] space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-[22px] font-medium tracking-tight text-stone-900">ไทม์ไลน์ทรัพย์สิน</h1>
          <p className="mt-1 text-sm text-stone-500">ข้อมูลสมมติสำหรับตรวจ UI — ไม่ต่อ Firestore</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {names.map((n) => (
            <button
              key={n}
              onClick={() => setTab(n)}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                tab === n ? 'bg-clay-600 text-white' : 'bg-white text-stone-600 border border-stone-200/60 hover:border-stone-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <View />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <div className="font-sans text-stone-900">
    <Harness />
  </div>,
);

export default Harness;
