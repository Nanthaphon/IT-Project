import './index.css';
import React from 'react';
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
const repairRequests = [];
createRoot(document.getElementById('root')).render(
  <div style={{ background:'#F7F9FA', minHeight:'100vh', padding:'24px' }}>
    <ITReportPage employees={employees} repairRequests={repairRequests} assets={assets} accessories={accessories} licenses={licenses} />
  </div>
);
