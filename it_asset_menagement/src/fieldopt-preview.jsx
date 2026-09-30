/* หน้าทดสอบ "ตัวเลือกฟิลด์" (DropdownOptionsManager) — ไม่ต้องล็อกอิน
   เปิดที่ http://localhost:5173/fieldopt-preview.html — ไม่เข้า production build
   ปุ่มบันทึกไม่เขียน Firestore แค่โชว์ก้อนข้อมูลที่จะถูกบันทึกไว้ด้านล่าง */
import './index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import DropdownOptionsManager from './components/DropdownOptionsManager.jsx';

const INITIAL = {
  companies: ['Globe Syndicate', 'Besthrm'],
  vendors: ['VST', 'Advice', '2beshop'],
  departments: ['General', 'Management', 'Human Resources'],
  forDepartments: ['General'],
  positions: ['Developer'],
  locations: ['สำนักงานใหญ่'],
  links: [
    { id: 'lo1', name: 'แบบฟอร์มลาออก', url: 'https://forms.office.com/r/resign' },
    { id: 'lo2', name: 'โฟลเดอร์เอกสารพนักงาน', url: 'https://globesyndicate.sharepoint.com/sites/hr/Shared%20Documents' },
  ],
};

function Harness() {
  const [data, setData] = useState(INITIAL);
  return (
    <div className="min-h-screen bg-sand-50">
      <DropdownOptionsManager fieldOptions={data} onSave={async (d) => setData(d)} saving={false} />
      <pre id="saved" className="m-5 overflow-auto rounded-xl bg-white p-4 text-[11px] text-stone-500">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Harness />);
