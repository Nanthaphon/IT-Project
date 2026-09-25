/* Dev harness หน้าคำขอเบิกอุปกรณ์ โดยไม่ต้องล็อกอิน / ไม่แตะ Firestore
   เปิดที่ /supply-preview.html — ไม่เข้า production build

   ครอบเคสจริงที่เจอ: ชื่อมีคำนำหน้าติดกัน · มี/ไม่มีชื่อเล่น ·
   พนักงานที่ไม่อยู่ในทะเบียนแล้ว (ทางสำรอง) · ทุกสถานะ · มี/ไม่มีรูป */
import './index.css';
import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SupplyRequestTable from './components/SupplyRequestTable.jsx';

const swatch = (c) => 'data:image/svg+xml;base64,' + btoa(
  `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="12" fill="${c}"/></svg>`);

const SUPPLIES = [
  { id: 's1', name: 'เทปใสแกนเล็ก ยาว 36 หลา', company: 'Globe Syndicate', image: swatch('#E6EAEC') },
  { id: 's2', name: 'เทป OPP2 ใหญ่', company: 'Globe Syndicate', image: swatch('#C8D8E4') },
  { id: 's3', name: 'สมุดปกภาพ', company: 'Globe Syndicate' },
  { id: 's4', name: 'ถ่านไฟฉายอัลคาไลน์ AA', company: 'Globe Syndicate', image: swatch('#9FBDCB') },
  { id: 's5', name: 'ปากกา ควันตั้ม แดง', company: 'Besthrm' },
];

/* ทะเบียนพนักงาน — fullName ไม่มีคำนำหน้า (แบบข้อมูลจริง) */
const EMPLOYEES = [
  { id: 'e1', empId: '1010114', fullName: 'กชกร เรืองนุ้ย', nickname: 'มายด์', department: 'Design Experience' },
  { id: 'e2', empId: '1010122', fullName: 'กษิดิศ จรัสทรัพย์', nickname: 'บอส', department: 'Business Development' },
  { id: 'e3', empId: '1010008', fullName: 'ปัทมวรรณ ช่อทองดี', nickname: '', department: 'PcMs Haier' },
  { id: 'e4', empId: '1010060', fullName: 'เกศินี สุขใจ', nickname: 'อ้อม', department: 'Midea' },
  /* 1010181 ไม่อยู่ในทะเบียน -> ต้องใช้ชื่อจากคำขอแทน */
];

const now = Date.now(), h = 3600000;
const REQS = [
  ['r1', '1010114', 'นางสาวกชกร เรืองนุ้ย', 'Design Experience', 's1', 1, 'รอดำเนินการ', 2],
  ['r2', '1010114', 'นางสาวกชกร เรืองนุ้ย', 'Design Experience', 's2', 1, 'อนุมัติแล้ว', 5],
  ['r3', '1010114', 'นางสาวกชกร เรืองนุ้ย', 'Design Experience', 's3', 2, 'อนุมัติแล้ว', 6],
  ['r4', '1010122', 'นายกษิดิศ จรัสทรัพย์', 'Business Development', 's4', 1, 'อนุมัติแล้ว', 50],
  ['r5', '1010008', 'นางสาวปัทมวรรณ ช่อทองดี', 'PcMs Haier', 's4', 2, 'ปฏิเสธคำขอ', 160],
  ['r6', '1010060', 'นางสาวเกศินี สุขใจ', 'Midea', 's5', 1, 'รอดำเนินการ', 1],
  ['r7', '1010181', 'อาทิติญา มาสม', 'Operation Team 6 (Haier)', 's4', 1, 'อนุมัติแล้ว', 260],
].map(([id, empId, empName, department, supplyId, requestedQty, status, hoursAgo]) => ({
  id, empId, empName, department, supplyId, requestedQty, status,
  supplyName: SUPPLIES.find((s) => s.id === supplyId).name,
  supplyCompany: SUPPLIES.find((s) => s.id === supplyId).company,
  timestamp: now - hoursAgo * h,
  note: id === 'r4' ? 'เบิกแล้ว ทำย้อนหลัง' : '',
}));

function Harness() {
  const [reqs, setReqs] = useState(REQS);
  const [status, setStatus] = useState('all');
  const [y, setY] = useState('all');
  const [m, setM] = useState('all');
  const [d, setD] = useState('all');
  const current = useMemo(() => (status === 'all' ? reqs : reqs.filter((r) => r.status === status)), [reqs, status]);
  return (
    <div className="min-h-screen bg-sand-50 p-6 lg:p-8">
      <SupplyRequestTable
        supplyRequests={reqs} currentSupplyRequests={current}
        officeSupplies={SUPPLIES} employees={EMPLOYEES}
        supplyFilterYear={y} setSupplyFilterYear={setY}
        supplyFilterMonth={m} setSupplyFilterMonth={setM}
        supplyFilterDay={d} setSupplyFilterDay={setD}
        supplyFilterStatus={status} setSupplyFilterStatus={setStatus}
        handleUpdateSupplyRequestStatus={(req, s) => setReqs((rs) => rs.map((r) => (r.id === req.id ? { ...r, status: s } : r)))}
        handleDelete={(id) => setReqs((rs) => rs.filter((r) => r.id !== id))}
        canEdit
      />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<div className="font-sans text-stone-900"><Harness /></div>);
export default Harness;
