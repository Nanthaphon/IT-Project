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
};

const EMPLOYEES = [{ id: 'e1', empId: 'EMP101', fullName: 'สมชาย ใจดี', department: 'Design Experience' }];

function Harness() {
  const [detail, setDetail] = useState(ASSET);
  const [cat, setCat] = useState('assets');
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
    <AssetDetailsModal
      selectedAssetDetail={detail}
      setSelectedAssetDetail={setDetail}
      selectedAssetCategory={cat}
      setSelectedAssetCategory={setCat}
      assets={[ASSET]}
      accessories={[]}
      licenses={[]}
      transactions={[]}
      employees={EMPLOYEES}
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
  );
}

createRoot(document.getElementById('root')).render(
  <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
    <Harness />
  </div>,
);

export default Harness;
