/* Dev harness ดู sub-modal สองตัวใน AssetDetailsModal ที่หลุดจาก sweep รอบก่อน
   (SeatDetailModal / AccessoryItemDetailModal) — เปิดที่
   http://localhost:5173/submodal-preview.html · ไม่เข้า production build */
import './index.css';
import './firebase.js';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SeatDetailModal, AccessoryItemDetailModal } from './components/AssetDetailsModal.jsx';

const noop = (...a) => console.log('action:', ...a);
const nullSetter = () => {};

const ITEM = {
  id: 'i1',
  sn: 'AK-PD3-00871',
  model: 'AUKEY Unity Link PD III',
  type: 'assigned',
  itemCost: 1290,
  purchaseDate: '2024-08-02',
  warrantyDate: '2026-08-02',
  assignee: { empName: 'สมชาย ใจดี', empId: 'EMP101', date: '2024-09-10' },
  documents: [],
};

const SEAT = {
  seatLabel: 'Seat 3 — Adobe Acrobat Pro',
  type: 'assigned',
  seatSupplier: 'SoftDebut',
  seatPurchaseDate: '2024-01-10',
  seatExpirationDate: '2026-01-10',
  assignee: { empName: 'สมชาย ใจดี', empId: 'EMP101' },
};

const LICENSE = {
  name: 'Adobe Acrobat Pro',
  supplier: 'SoftDebut',
  purchaseDate: '2024-01-10',
  expirationDate: '2026-01-10',
};

const checkLicenseExpiration = () => ({ status: 'ปกติ', daysLeft: 120 });
const calcAge = (d) => (d ? '1 ปี 2 เดือน' : '-');

/* prop temp* ทั้งหมดเป็นสถานะโหมดแก้ไข — harness ใช้ค่าว่าง/ตัวเปล่า */
const TEMPS = Object.fromEntries(
  [
    'tempLicenseLabel', 'tempLicenseProductKey', 'tempLicenseKeyCode', 'tempLicenseSupplier',
    'tempLicenseSeatCost', 'tempLicensePurchaseDate', 'tempLicenseExpirationDate', 'tempLicenseNote',
    'tempSNValue', 'tempModelValue', 'tempCostValue', 'tempPurchaseDateValue', 'tempWarrantyDateValue',
  ].flatMap((k) => [[k, ''], ['set' + k[0].toUpperCase() + k.slice(1), nullSetter]]),
);

const TABS = {
  'ชิ้นย่อยอุปกรณ์เสริม': (
    <AccessoryItemDetailModal
      item={ITEM}
      accessoryName="AUKEY Unity Link PD III 90W"
      calcAccessoryAge={calcAge}
      onClose={noop}
      onEdit={noop}
      isEditing={false}
      onCancelEdit={noop}
      onSaveEdit={noop}
      tempAccDocs={[]}
      setTempAccDocs={nullSetter}
      handleAccItemDocUpload={noop}
      handleOpenAccDoc={noop}
      isSavingItem={false}
      {...TEMPS}
    />
  ),
  'Seat ของ License': (
    <SeatDetailModal
      seat={SEAT}
      license={LICENSE}
      checkLicenseExpiration={checkLicenseExpiration}
      calculateAge={calcAge}
      onClose={noop}
      onEdit={noop}
      isEditing={false}
      onCancelEdit={noop}
      onSaveEdit={noop}
      tempLicenseSeatDocs={[]}
      setTempLicenseSeatDocs={nullSetter}
      handleLicenseSeatDocUpload={noop}
      isSavingItem={false}
      {...TEMPS}
    />
  ),
};

function Harness() {
  const names = Object.keys(TABS);
  const [tab, setTab] = useState(names[0]);
  return (
    <>
      <div className="fixed left-4 top-4 z-[200] flex gap-2 rounded-xl border border-stone-200/60 bg-white p-2 shadow-sm">
        {names.map((n) => (
          <button
            key={n}
            onClick={() => setTab(n)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === n ? 'bg-clay-600 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {TABS[tab]}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <div className="min-h-screen bg-sand-50 font-sans text-stone-900">
    <Harness />
  </div>,
);

export default Harness;
