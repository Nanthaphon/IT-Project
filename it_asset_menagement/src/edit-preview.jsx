/* Dev harness ดูหน้าแก้ไข (โหมดหน้าเต็ม) โดยไม่ต้องล็อกอิน
   เปิดที่ http://localhost:5173/edit-preview.html — ไม่เข้า production build

   ใช้ตรวจว่า layout กินความกว้างเต็มสัดส่วน ไม่ใช่กองอยู่กลางจอ */
import './index.css';
import './firebase.js';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import EditLicenseModal from './components/EditLicenseModal.jsx';
import EditAssetModal from './components/EditAssetModal.jsx';

const FIELD_OPTIONS = {
  vendors: ['Mail Master', 'JIB Computer', 'Advice'],
  manufacturers: ['Microsoft', 'ASUS', 'Dell'],
  departments: ['General', 'Design Experience', 'IT'],
  assetTypes: ['โน๊ตบุ๊ค', 'คอมพิวเตอร์', 'จอมอนิเตอร์'],
};

const LICENSE = {
  isOpen: true,
  data: {
    id: 'lic1',
    name: 'Microsoft 365 Business Basic (Globe)',
    productKey: 'Admin@globesyndicate.co.th',
    keyCode: '',
    supplier: 'Mail Master',
    purchaseDate: '2026-08-10',
    expirationDate: '2027-08-10',
    cost: 26000,
    quantity: 52,
    status: 'มีสิทธิ์ว่าง',
    note: 'Manufacturer: Trimble',
  },
};

const ASSET = {
  isOpen: true,
  collectionName: 'assets',
  data: {
    id: 'a1',
    name: 'ASUS FX504G',
    type: 'โน๊ตบุ๊ค',
    assetTag: 'IT-102050',
    sn: 'j3nrcx03z382137',
    model: 'FX504G',
    company: '',
    forDepartment: 'General',
    vendor: '',
    condition: 'used',
    purchaseDate: '2024-01-15',
    warrantyDate: '2027-01-15',
    cost: 10000,
    status: 'ตัดจำหน่าย',
  },
};

const TABS = {
  'แก้ไข License': 'license',
  'แก้ไขทรัพย์สิน': 'asset',
};

function Harness() {
  const [tab, setTab] = useState('license');
  const [lic, setLic] = useState(LICENSE);
  const [asset, setAsset] = useState(ASSET);
  const noop = (...a) => console.log('action:', ...a);

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="flex gap-2 border-b border-stone-200/60 bg-white p-3">
        {Object.entries(TABS).map(([label, key]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-clay-600 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="h-[calc(100vh-61px)]">
        {tab === 'license' ? (
          <EditLicenseModal
            asPage
            editLicenseModal={lic}
            setEditLicenseModal={setLic}
            handleUpdateLicense={(e) => { e?.preventDefault?.(); noop('save license'); }}
            handleEditLicenseChange={(e) =>
              setLic((p) => ({ ...p, data: { ...p.data, [e.target.name]: e.target.value } }))}
            fieldOptions={FIELD_OPTIONS}
            onClosePage={() => noop('close')}
          />
        ) : (
          <EditAssetModal
            asPage
            editAssetModal={asset}
            setEditAssetModal={setAsset}
            handleUpdateAsset={(e) => { e?.preventDefault?.(); noop('save asset'); }}
            handleEditAssetChange={(e) =>
              setAsset((p) => ({ ...p, data: { ...p.data, [e.target.name]: e.target.value } }))}
            fieldOptions={FIELD_OPTIONS}
            onClosePage={() => noop('close')}
          />
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <div className="font-sans text-stone-900"><Harness /></div>,
);

export default Harness;
