import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ITReportPage from './components/ITReportModal.jsx';
const assets = [
  ...Array.from({length:63}, ()=>({ type:'โน้ตบุ๊ค', status:'ถูกใช้งาน' })),
  ...Array.from({length:13}, ()=>({ type:'โน้ตบุ๊ค', status:'ตัดจำหน่าย' })),
  { type:'โน้ตบุ๊ค', status:'ชำรุดเสียหาย' },
  ...Array.from({length:38}, ()=>({ type:'เฟอร์นิเจอร์', status:'พร้อมใช้งาน' })),
  ...Array.from({length:3}, ()=>({ type:'คอมพิวเตอร์', status:'พร้อมใช้งาน' })),
];
const accessories = [];
const licenses = [
  { name:'Microsoft 365 Business', quantity:70, assignees:Array.from({length:61},()=>({})), expirationDate:'2026-12-31' },
  { name:'Adobe Acrobat Pro', quantity:5, assignees:[{},{},{}], expirationDate:'2026-10-30' },
];
const employees = Array.from({length:61},(_,i)=>({ id:i, fullName:'พนักงาน '+i }));
/* เคสแจ้งซ่อมของเดือนปัจจุบัน — ครอบทุกสถานะ/แผนก เพื่อตรวจสไลด์ใหม่ */
const now = new Date();
const inMonth = (day) => new Date(now.getFullYear(), now.getMonth(), day, 10, 30).getTime();
const REPAIR_CASES = [
  ['นพดล ศรีทอง',   'Operation Team 1',        'Lenovo IdeaPad3 15IAU7',  'คีย์บอร์ดปุ่ม F5 หลุด กดไม่ติด',   'ซ่อมเสร็จสิ้น',  2],
  ['ปรียา วงศ์ดี',   'Design Experience',       'Dell P2422H',             'จอกระพริบเป็นช่วง ๆ',              'ซ่อมเสร็จสิ้น',  3],
  ['อนุชา แสงเพชร', 'Recruitment & Field Force','Victus by HP 16-d0268TX', 'พัดลมเสียงดังมาก เครื่องร้อน',     'กำลังดำเนินการ', 5],
  ['กมล ทองสุข',    'Operation Team 1',        'HP LaserJet M404',        'ปริ้นออกมาเป็นเส้น',               'รอดำเนินการ',    8],
  ['วิภา สุขสันต์',  'Business Development',    'Lenovo IdeaPad3 15IAU7',  'เปิดเครื่องไม่ติด ไฟไม่เข้า',       'กำลังดำเนินการ', 9],
  ['ธนกร พงษ์ทอง',  'Operation Team 1',        'Logitech Mouse M171',     'คลิกซ้ายไม่ติด',                   'ซ่อมเสร็จสิ้น',  11],
  ['สมชาย ใจดี',    'Design Experience',       'Dell P2422H',             'สาย HDMI หลวม ภาพหลุด',            'ยกเลิก',        12],
  ['ณัฐธิดา เพชรแก้ว','Recruitment & Field Force','Wi-Fi AP ชั้น 3',        'สัญญาณ Wi-Fi หลุดบ่อยช่วงบ่าย',     'รอดำเนินการ',    14],
];
const repairRequests = REPAIR_CASES.map(([empName, department, assetName, issue, status, day], i) => ({
  id: 'r' + i, empId: 'e' + i, empName, department, assetName, issue, status, timestamp: inMonth(day),
}));
/* StrictMode ให้เหมือน main.jsx จริง — เอฟเฟกต์รันซ้ำสองรอบ
   บั๊กเรื่องร่างหายของหน้านี้โผล่เฉพาะตอนมี StrictMode เท่านั้น */
createRoot(document.getElementById('root')).render(
  <StrictMode>
  <div style={{ background:'#F7F9FA', minHeight:'100vh', padding:'24px' }}>
    <ITReportPage employees={employees} repairRequests={repairRequests} assets={assets} accessories={accessories} licenses={licenses} />
  </div>
  </StrictMode>
);
