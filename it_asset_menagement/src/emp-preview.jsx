/* Dev harness ดู modal รายละเอียดพนักงาน โดยไม่ต้องล็อกอิน
   เปิดที่ http://localhost:5173/emp-preview.html — ไม่เข้า production build

   หมายเหตุ: SetStaffPasswordForm จะ subscribe staff_passwords/<id> 1 doc
   ใส่ id ปลอมไว้ อ่านได้ 1 read ต่อการเปิด (rules จะปฏิเสธ ไม่กิน quota จริงจัง) */
import './index.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import EmployeeDetailsModal from './components/EmployeeDetailsModal.jsx';

const EMP = {
  id: 'preview-emp', empId: '1010184',
  fullName: 'ณัฐธิดา เพชรแก้ว', nickname: 'มายด์',
  firstName: 'ณัฐธิดา', lastName: 'เพชรแก้ว',
  firstNameEng: 'Nathida', lastNameEng: 'Pertkeaw',
  position: 'Senior Recruitment Executive',
  department: 'Recruitment & Field Force',
  company: 'Globe Syndicate',
  phone: '0825246319',
  manager: 'นายธีระวัฒน์ ชูรอด',
  startDate: '2024-08-24',
  m365Email: 'Nathida.p@globesyndicate.co.th',
  m365Password: 'Gl0be#2026!xY',
};

const day = 86400000;
const ago = (d) => Date.now() - d * day;

const assets = [
  { id: 'a1', name: 'Lenovo IdeaPad3 15IAU7 i3-1215U', type: 'โน้ตบุ๊ค',
    assetTag: 'GCO-BD-6802001', sn: 'PF54VZJ2', assignedTo: 'preview-emp' },
];
const accessories = [
  { id: 'c1', name: 'Logitech Mouse M171', type: 'เมาส์',
    assignees: [{ empId: 'preview-emp', assignedDate: '2025-10-22' }] },
];
const licenses = [
  { id: 'l1', name: 'Microsoft 365 Business Basic (Globe)',
    assignees: [{ empId: 'preview-emp', productKey: 'admin@globesyndicate.co.th' }] },
];
const transactions = [
  { id: 't1', empId: 'preview-emp', category: 'assets', assetId: 'a1',
    assetName: 'Lenovo IdeaPad3 15IAU7 i3-1215U', action: 'เบิกจ่าย',
    condition: 'ปกติ', remarks: 'เครื่องใหม่', timestamp: ago(400) },
  { id: 't2', empId: 'preview-emp', category: 'licenses',
    licenseName: 'Microsoft 365 Business Basic (Globe)', action: 'เบิกจ่าย',
    productKey: 'admin@globesyndicate.co.th', timestamp: ago(398) },
  { id: 't3', empId: 'preview-emp', category: 'accessories',
    assetName: 'Logitech Mouse M171', action: 'เบิกจ่าย', sn: 'MS-77120', timestamp: ago(330) },
  { id: 't4', empId: 'preview-emp', category: 'assets', assetId: 'a1',
    assetName: 'Lenovo IdeaPad3 15IAU7 i3-1215U', action: 'รับคืน',
    condition: 'ชำรุด', remarks: 'จอมีรอย', timestamp: ago(120) },
];
const repairRequests = [
  { id: 'r1', empId: 'preview-emp', assetName: 'Lenovo IdeaPad3 15IAU7 i3-1215U',
    issue: 'คีย์บอร์ดปุ่ม F5 หลุด', status: 'ซ่อมเสร็จสิ้น', timestamp: ago(125) },
];

function Harness() {
  const [emp, setEmp] = useState(EMP);
  const [tab, setTab] = useState('info');
  /* สลับดูได้ทั้งโหมดหน้าเต็ม (URL /employees/:id) และ modal เดิม */
  const [asPage, setAsPage] = useState(true);
  return (
    <div className="h-screen bg-sand-50">
      <div className="flex gap-2 border-b border-stone-200/60 bg-white p-2">
        {[['หน้าเต็ม', true], ['modal (ของเดิม)', false]].map(([label, v]) => (
          <button key={label} onClick={() => { setAsPage(v); setEmp(EMP); }}
            className={`rounded-xl px-3 py-1.5 text-[13px] font-medium ${asPage === v ? 'bg-clay-600 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>
            {label}
          </button>
        ))}
      </div>
      {!emp && (
        <button onClick={() => setEmp(EMP)}
          className="m-8 rounded-xl bg-clay-600 px-4 py-2.5 text-sm font-medium text-white">
          เปิด modal อีกครั้ง
        </button>
      )}
      <div className="h-[calc(100vh-49px)]">
      <EmployeeDetailsModal
        asPage={asPage}
        onClosePage={() => setEmp(null)}
        selectedEmployee={emp} setSelectedEmployee={setEmp}
        empModalTab={tab} setEmpModalTab={setTab}
        assets={assets} licenses={licenses} accessories={accessories}
        transactions={transactions} repairRequests={repairRequests}
        openEditEmpModal={() => console.log('edit')}
        handleCheckin={() => {}} setReturnModal={() => {}}
        setSelectedAssetDetail={() => {}} setSelectedAssetCategory={() => {}}
      />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <div className="font-sans text-stone-900"><Harness /></div>,
);

export default Harness;
