/* Dev harness ฝั่งพนักงาน (StaffView) โดยไม่ต้องล็อกอิน / ไม่แตะ Firestore
   เปิดที่ /staff-preview.html — ไม่เข้า production build
   ?tab=office_supplies เปิดแท็บเบิกอุปกรณ์ให้เลย (ค่าอื่น: profile, it_repair, my_assets ...)

   ข้อมูล: อุปกรณ์ 14 ชิ้น มีหมด / ใกล้หมด / ชื่อยาว / ไม่มีรูป · มีของบริษัทอื่นปน (ต้องถูกกรองออก) */
import './index.css';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import StaffView from './components/StaffView.jsx';

const swatch = (c) => 'data:image/svg+xml;base64,' + btoa(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect x="20" y="20" width="80" height="80" rx="14" fill="${c}"/></svg>`);

const STAFF = {
  id: 'emp-p', empId: '1010145', fullName: 'นันทพล นายาต', nickname: 'พีช',
  position: 'IT Support Officer', department: 'Business Development', company: 'Globe Syndicate',
  phone: '095-339-6516', manager: 'นายวัฒนา มีเย็น',
  links: [{ label: 'แบบฟอร์มลาออก', url: 'https://forms.office.com/r/resign', optionId: 'lo1', id: 'l1' }],
};

const G = 'Globe Syndicate';
const SUPPLIES = [
  ['มีดคัตเตอร์ ใหญ่', 0, '#8FD3B8'], ['มีดคัตเตอร์ ใบเล็ก', 0, '#B8C2C8'],
  ['ใบมีดคัตเตอร์ เล็ก', 9, '#E3D5DA'], ['สมุดปกภาพ', 3, '#F2B8A8'],
  ['ลวดเสียบกระดาษ elfen No.1', 41, '#3A55A8'], ['กาวแท่ง UHU', 0, '#F4E27A'],
  ['เทปใสแกนเล็ก ยาว 36 หลา', 24, '#E6EAEC'], ['ปากกาลูกลื่น ควอนตั้ม สีน้ำเงิน 0.5 มม. (แพ็ค 12 ด้าม)', 5, '#2B4F9E'],
  ['ถ่านไฟฉายอัลคาไลน์ AA', 12, '#9FBDCB'], ['แฟ้มเจาะ 2 ห่วง', 7, null],
  ['กระดาษ A4 80 แกรม', 30, '#FFFFFF'], ['คลิปดำ 2 ขา', 2, '#333333'],
  ['ปากกาไวท์บอร์ด', 16, '#D9534F'], ['ยางลบ', 0, '#EDEDED'],
].map(([name, quantity, color], i) => ({
  id: `s${i}`, name, quantity, unit: i % 4 === 0 ? 'อัน' : 'ชิ้น', company: G, image: color ? swatch(color) : '',
}));
SUPPLIES.push({ id: 'x1', name: 'ของบริษัทอื่น (ต้องไม่เห็น)', quantity: 9, company: 'Besthrm' });

const REQS = [
  { id: 'q1', empId: '1010145', supplyName: 'สมุดปกภาพ', requestedQty: 2, status: 'รอดำเนินการ', timestamp: Date.now() - 3600e3 },
  { id: 'q2', empId: '1010145', supplyName: 'ถ่านไฟฉายอัลคาไลน์ AA', requestedQty: 4, status: 'อนุมัติแล้ว', timestamp: Date.now() - 86400e3 * 3 },
];

function Harness() {
  const [staff, setStaff] = useState(STAFF);
  const [supplyRequests, setSupplyRequests] = useState(REQS);
  /* เปิดแท็บตาม ?tab= — กดปุ่มเมนูให้ (StaffView เก็บแท็บเป็น state ภายใน) */
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (!tab) return;
    const labels = { office_supplies: 'เบิกอุปกรณ์ สนง.', it_repair: 'แจ้งปัญหา IT', my_assets: 'ทรัพย์สินของฉัน' };
    const t = setTimeout(() => {
      [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === labels[tab])?.click();
    }, 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <StaffView
      currentStaff={staff} setCurrentStaff={setStaff} setAuthRole={() => {}}
      handleLogout={() => {}}
      staffMustChangePassword={false} setStaffMustChangePassword={() => {}}
      staffRepairForm={{ assetName: '', issue: '' }} setStaffRepairForm={() => {}}
      handleSubmitRepairRequest={async () => {}} repairRequests={[]}
      editStaffRepairModal={{ isOpen: false }} setEditStaffRepairModal={() => {}}
      officeSupplies={SUPPLIES} supplyRequests={supplyRequests}
      handleStaffSubmitSupplyRequest={async (supplyId, name, qty) => {
        setSupplyRequests((r) => [{ id: `n${Date.now()}${supplyId}`, empId: '1010145', supplyName: name, requestedQty: Number(qty), status: 'รอดำเนินการ', timestamp: Date.now() }, ...r]);
      }}
      handleStaffCancelSupplyRequest={(req) => setSupplyRequests((r) => r.filter((x) => x.id !== req.id))}
      handleStaffUpdateProfile={async (p) => setStaff((s) => ({ ...s, ...p }))}
    />
  );
}

createRoot(document.getElementById('root')).render(<Harness />);
