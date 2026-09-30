/* Dev harness หน้าแจ้งซ่อม โดยไม่ต้องล็อกอิน / ไม่แตะ Firestore
   เปิดที่ /repair-preview.html — ไม่เข้า production build

   ครอบเคสจริง: ชื่อมีคำนำหน้าติดกัน · มี/ไม่มีชื่อเล่น · พนักงานที่ไม่อยู่ในทะเบียนแล้ว
   · ทุกสถานะ · มี/ไม่มีคะแนนประเมิน · ปัญหายาวมาก · ข้อมูลหลายเดือน (ตรวจตัวกรองวันที่)
   กรองด้วยเงื่อนไขเดียวกับ App.jsx (สถานะ + filterByDate) */
import './index.css';
import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import RepairTable from './components/RepairTable.jsx';
import { filterByDate } from './utils/dateFilter.js';

const EMPLOYEES = [
  { id: 'e1', empId: '1010093', fullName: 'จันสุดา พูลฝอย', nickname: 'จัน', department: 'Accounting and Finance' },
  { id: 'e2', empId: '1010183', fullName: 'ธณกร น้อยหมอ', nickname: 'ต้น', department: 'Recruitment & Field Force' },
  { id: 'e3', empId: '1010002', fullName: 'พรนภา พุทธาโกฐิรัตน์', nickname: '', department: 'Management' },
  { id: 'e4', empId: '1010006', fullName: 'นิภาวรรณ ไวยขุนทด', nickname: 'นิ่ม', department: 'Operation Team 1 (Hitachi)' },
  { id: 'e5', empId: '1010038', fullName: 'นารีนาถ ทับซ้อน', nickname: 'แนน', department: 'Operation Team 2 (Beko)' },
  /* 1010186 ไม่อยู่ในทะเบียน -> ต้องใช้ชื่อจากงานแจ้งซ่อมแทน */
];

const EVAL = (r) => ({
  overallRating: r, speedRating: 5, qualityRating: r, serviceRating: 5,
  comment: 'ช่วยได้เร็วมากครับ', evaluatedByName: 'ธณกร น้อยหมอ', evaluatedAt: Date.UTC(2026, 8, 17, 3, 0),
});
const at = (m, d, h, min) => new Date(2026, m - 1, d, h, min).getTime();

const REQS = [
  ['r1', '1010093', 'นางสาวจันสุดา พูลฝอย', 'อื่นๆ', 'สายแลนใช้ไม่ได้', 'รอดำเนินการ', at(9, 30, 11, 11)],
  ['r2', '1010183', 'ธณกร น้อยหมอ', 'โน๊ตบุ๊ค/คอมพิวเตอร์', 'คอมปรับเพิ่มแสง ลดแสงไม่ได้', 'กำลังดำเนินการ', at(9, 16, 11, 48)],
  ['r3', '1010002', 'นางสาวพรนภา พุทธาโกฐิรัตน์', 'อื่นๆ',
    'ไม่สามารถส่งข้อมูล/ไฟล์จาก LINE เข้าอีเมลได้ ส่งอีเมลเป็นรูปซองจดหมาย ซึ่งก็เปิดชื่ออีเมลบริษัท ที่ผ่านมาสามารถรับข้อมูลได้ แต่สัปดาห์ที่ผ่านมาไม่ได้รับข้อมูล ไอทีช่วยตรวจสอบให้หน่อยค่ะ',
    'ซ่อมเสร็จสิ้น', at(9, 16, 10, 35), EVAL(5)],
  ['r4', '1010006', 'นางสาวนิภาวรรณ ไวยขุนทด', 'โปรแกรม', 'เข้าแชร์พอย บริษัท ไม่ได้', 'ซ่อมเสร็จสิ้น', at(9, 9, 10, 0)],
  ['r5', '1010038', 'นางสาวนารีนาถ ทับซ้อน', 'โน๊ตบุ๊ค/คอมพิวเตอร์', 'โน๊ตบุ๊คพี่ยุ้ยไม่สามารถเปิดได้ค่ะ', 'ยกเลิก', at(9, 8, 9, 23)],
  ['r6', '1010186', 'ณัฐพงศ์ พงศ์ปฐมกุล', 'โน๊ตบุ๊ค/คอมพิวเตอร์', 'การลงโปรแกรมเพิ่มเติม', 'ซ่อมเสร็จสิ้น', at(9, 7, 15, 30), EVAL(4)],
  /* เดือนอื่น — เลือก ก.ย. แล้วต้องไม่ถูกนับ */
  ['r7', '1010038', 'นางสาวนารีนาถ ทับซ้อน', 'เครื่องพิมพ์', 'กระดาษติด', 'ซ่อมเสร็จสิ้น', at(8, 20, 9, 39)],
  ['r8', '1010093', 'นางสาวจันสุดา พูลฝอย', 'โปรแกรม', 'Excel ค้าง', 'ซ่อมเสร็จสิ้น', at(8, 3, 14, 5)],
  ['r9', '1010002', 'นางสาวพรนภา พุทธาโกฐิรัตน์', 'อื่นๆ', 'เมาส์ดับเบิลคลิก', 'รอดำเนินการ', at(7, 11, 13, 0)],
].map(([id, empId, empName, assetName, issue, status, timestamp, evaluation]) => ({
  id, empId, empName, assetName, issue, status, timestamp,
  department: EMPLOYEES.find((e) => e.empId === empId)?.department || 'Recruitment & Field Force',
  ...(evaluation ? { evaluation } : {}),
}));

function Harness() {
  const [reqs, setReqs] = useState(REQS);
  const [status, setStatus] = useState('ทั้งหมด');
  const [y, setY] = useState('ทั้งหมด');
  const [m, setM] = useState('09');
  const [d, setD] = useState('ทั้งหมด');
  const current = useMemo(
    () => filterByDate(reqs, y, m, d).filter((r) => status === 'ทั้งหมด' || r.status === status),
    [reqs, status, y, m, d],
  );
  return (
    <div className="h-screen bg-sand-50">
      <RepairTable
        repairRequests={reqs} currentRepairRequests={current} employees={EMPLOYEES}
        repairFilterYear={y} setRepairFilterYear={setY}
        repairFilterMonth={m} setRepairFilterMonth={setM}
        repairFilterDay={d} setRepairFilterDay={setD}
        repairFilterStatus={status} setRepairFilterStatus={setStatus}
        handleUpdateRepairRequestStatus={(id, s) => setReqs((rs) => rs.map((r) => (r.id === id ? { ...r, status: s } : r)))}
        handleDeleteRepairRequest={(id) => setReqs((rs) => rs.filter((r) => r.id !== id))}
        canEdit
      />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<div className="font-sans text-stone-900"><Harness /></div>);
