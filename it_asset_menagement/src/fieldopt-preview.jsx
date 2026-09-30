/* หน้าทดสอบ "ตัวเลือกฟิลด์" (DropdownOptionsManager) — ไม่ต้องล็อกอิน
   เปิดที่ http://localhost:5173/fieldopt-preview.html — ไม่เข้า production build
   บันทึกทันทีที่กดเพิ่ม/ลบ — ที่นี่ไม่เขียน Firestore แค่โชว์ก้อนที่จะถูกบันทึกไว้ด้านล่าง
   (หน่วง 400ms เหมือนเน็ตจริง · ติ๊ก "จำลองบันทึกไม่สำเร็จ" เพื่อดูการย้อนค่ากลับ) */
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
  const [fail, setFail] = useState(false);
  const onSave = async (d) => {
    await new Promise((r) => setTimeout(r, 400));
    if (fail) { alert("ผิดพลาด (จำลอง)"); return false; }
    setData(d);
    return true;
  };
  return (
    <div className="min-h-screen bg-sand-50">
      <label className="flex items-center gap-2 px-5 pt-3 text-[13px] text-stone-500">
        <input id="fail" type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} /> จำลองบันทึกไม่สำเร็จ
      </label>
      <DropdownOptionsManager fieldOptions={data} onSave={onSave} />
      <pre id="saved" className="m-5 overflow-auto rounded-xl bg-white p-4 text-[11px] text-stone-500">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Harness />);
