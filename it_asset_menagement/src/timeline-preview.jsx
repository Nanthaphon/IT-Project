/* Dev harness ดู Timeline โดยไม่ต้องต่อ Firestore
   เปิดที่ http://localhost:5173/timeline-preview.html — ไม่เข้า production build

   ข้อมูลในไฟล์นี้เป็นข้อมูลสมมติ ครอบทุกชนิดเหตุการณ์ + เคสขอบ
   (ไม่มีประวัติ / รายการที่จับคู่จากชื่อ / วันที่ล้วนไม่มีเวลา) */
import './index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Timeline from './components/timeline/Timeline.jsx';
import { buildAssetTimeline, buildLicenseTimeline } from './components/timeline/buildTimeline.js';

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
    licenseName: 'Microsoft 365 Business', empName: 'ณัฐธิดา เพชรแก้ว', timestamp: ago(370) },
  { assetId: 'asset1', isAssetBound: true, category: 'licenses', action: 'รับคืน',
    licenseName: 'Microsoft 365 Business', timestamp: ago(121) },
  { assetId: 'asset1', isAssetBound: true, category: 'licenses', action: 'เบิกจ่าย',
    licenseName: 'Adobe Acrobat Pro', empName: 'วัฒนา มีเย็น (มอส)', timestamp: ago(88) },
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
