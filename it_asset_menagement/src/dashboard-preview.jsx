/* Dev harness ดูหน้า Dashboard ธีม v3 โดยไม่ต้องล็อกอิน Firebase
   เปิดที่ http://localhost:5173/dashboard-preview.html — ไม่เข้า production build
   (Vite build เฉพาะ index.html) · ลบทิ้งได้เมื่อ merge เข้าเมนูจริงแล้ว */
import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import DashboardPage from './components/dashboard/DashboardPage.jsx';

const mk = (n, fill) => Array.from({ length: n }, (_, i) => fill(i));

const assets = [
  ...mk(48, () => ({ type: 'โน้ตบุ๊ค', status: 'ถูกใช้งาน', cost: 32000, company: 'Globe Syndicate' })),
  ...mk(9, () => ({ type: 'โน้ตบุ๊ค', status: 'พร้อมใช้งาน', cost: 32000, company: 'Globe Syndicate' })),
  ...mk(3, () => ({ type: 'โน้ตบุ๊ค', status: 'ชำรุดเสียหาย', cost: 32000, company: 'Globe Syndicate' })),
  ...mk(13, () => ({ type: 'โน้ตบุ๊ค', status: 'ตัดจำหน่าย', cost: 32000, company: 'Globe Syndicate' })),
  ...mk(21, () => ({ type: 'คอมพิวเตอร์ตั้งโต๊ะ', status: 'ถูกใช้งาน', cost: 24000, company: 'Globe Syndicate' })),
  ...mk(14, () => ({ type: 'จอมอนิเตอร์', status: 'ถูกใช้งาน', cost: 5500, company: 'Best HRM' })),
  ...mk(4, () => ({ type: 'จอมอนิเตอร์', status: 'สำรอง', cost: 5500, company: 'Best HRM' })),
  ...mk(11, () => ({ type: 'เครื่องพิมพ์', status: 'ถูกใช้งาน', cost: 8900, company: 'Best HRM' })),
  ...mk(6, () => ({ type: 'โทรศัพท์มือถือ', status: 'ถูกใช้งาน', cost: 15000, company: 'Globe Syndicate' })),
  ...mk(5, () => ({ type: 'แท็บเล็ต', status: 'พร้อมใช้งาน', cost: 12000, company: 'Globe Syndicate' })),
  ...mk(2, () => ({ type: 'เราเตอร์', status: 'รอดำเนินการ', cost: 3200, company: 'Best HRM' })),
  ...mk(38, () => ({ assetGroup: 'office', type: 'เก้าอี้สำนักงาน', status: 'ถูกใช้งาน', cost: 2400, company: 'Globe Syndicate' })),
];

const licenses = [
  { name: 'Microsoft 365 Business', quantity: 70, assignees: mk(61, () => ({})), cost: 210000, expirationDate: '2026-12-31' },
  { name: 'Adobe Acrobat Pro', quantity: 5, assignees: mk(3, () => ({})), cost: 32000, expirationDate: '2026-10-30' },
  { name: 'AutoCAD LT', quantity: 2, assignees: mk(2, () => ({})), cost: 48000, expirationDate: '2027-06-30' },
];

const accessories = [
  { name: 'คีย์บอร์ด', quantity: 40, assignees: mk(31, () => ({})), brokenQuantity: 2, cost: 690 },
  { name: 'เมาส์', quantity: 55, assignees: mk(44, () => ({})), brokenQuantity: 4, cost: 450 },
  { name: 'Docking Station', quantity: 12, assignees: mk(9, () => ({})), brokenQuantity: 0, cost: 4200 },
];

const employees = [
  ...mk(18, () => ({ department: 'ฝ่ายขาย' })),
  ...mk(12, () => ({ department: 'ฝ่ายบัญชี' })),
  ...mk(9, () => ({ department: 'ฝ่ายผลิต' })),
  ...mk(22, () => ({ department: 'ฝ่ายปฏิบัติการ' })),
];

const day = (n) => new Date(Date.now() - n * 86400000).toISOString();
const repairRequests = [
  { id: 'r1', assetName: 'Notebook Dell Latitude 5440', empName: 'สมชาย ใจดี', department: 'ฝ่ายขาย', issue: 'เปิดไม่ติด', status: 'รอดำเนินการ', timestamp: day(1) },
  { id: 'r2', assetName: 'เครื่องพิมพ์ HP LaserJet', empName: 'วิภา สุขสันต์', department: 'ฝ่ายบัญชี', issue: 'กระดาษติด', status: 'กำลังดำเนินการ', timestamp: day(2) },
  { id: 'r3', assetName: 'จอมอนิเตอร์ Dell P2422H', empName: 'ธนกร พงษ์ทอง', department: 'ฝ่ายผลิต', issue: 'จอมีเส้น', status: 'รอดำเนินการ', timestamp: day(4) },
  { id: 'r4', assetName: 'Notebook Lenovo ThinkPad', empName: 'ปรียา วงศ์ดี', department: 'ฝ่ายปฏิบัติการ', issue: 'แบตเสื่อม', status: 'กำลังดำเนินการ', timestamp: day(6) },
  { id: 'r5', assetName: 'Docking Station', empName: 'อนุชา แสงเพชร', department: 'ฝ่ายขาย', issue: 'ต่อจอไม่ขึ้น', status: 'รอดำเนินการ', timestamp: day(9) },
  { id: 'r6', assetName: 'เมาส์ Logitech', empName: 'กมล ทองสุข', department: 'ฝ่ายบัญชี', issue: 'คลิกไม่ติด', status: 'เสร็จสิ้น', timestamp: day(12) },
];

/* จำลอง app shell จริงใน App.jsx: พื้น stone-50 + main + scroll container
   ที่ตอนนี้ไม่ใส่ padding ให้หน้า dashboard แล้ว — ใช้ตรวจว่า integration ไม่เพี้ยน */
createRoot(document.getElementById('root')).render(
  <div className="flex h-screen bg-stone-50 text-stone-900 font-sans">
    <div className="w-[280px] shrink-0 bg-[#12303A]" />{/* แทน Sidebar */}
    <main className="flex-1 flex flex-col overflow-hidden bg-transparent min-w-0">
      <div id="main-scroll-container" className="flex-1 overflow-auto">
        <DashboardPage
    assets={assets}
    licenses={licenses}
    accessories={accessories}
    employees={employees}
    repairRequests={repairRequests}
          onOpenRepairs={() => console.log('ไปหน้าแจ้งซ่อม')}
          onOpenAssets={() => console.log('ไปหน้าทรัพย์สิน')}
        />
      </div>
    </main>
  </div>,
);
