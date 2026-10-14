/* Dev harness หน้า "สร้าง IT Monthly Report" โดยไม่ต้องล็อกอิน / ไม่แตะ Firestore
   เปิดที่ /report-preview.html — ไม่เข้า production build

   ⚠️ แทน localStorage ด้วยของในหน่วยความจำ — หน้าจริงเก็บร่างไว้ที่คีย์ it_report_shared
   บน origin เดียวกัน (localhost) ถ้าใช้ของจริง หน้านี้จะเขียนทับร่างที่ผู้ใช้กรอกไว้

   License ตัวอย่างครอบทุกกรณีของสไลด์ "ซอฟต์แวร์ใกล้หมดอายุ":
   ใกล้หมด · หมดแล้วแต่ยังใช้อยู่ · หมดแล้วไม่มีคนใช้ (ต้องไม่ขึ้น) · seat ใกล้หมดแต่วันหลักไกล · ไกลเกิน 90 วัน */
const mem = new Map();
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
    clear: () => mem.clear(),
  },
});

import './index.css';
import { createRoot } from 'react-dom/client';
import ITReportPage from './components/ITReportModal.jsx';

const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const LICENSES = [
  { id: 'l1', name: 'Enscape', quantity: 2, expirationDate: d(35), assignees: [{}, {}] },
  { id: 'l2', name: 'AutoCAD LT', quantity: 4, expirationDate: d(-43), assignees: [{}, {}, {}, {}] },
  { id: 'l3', name: 'Power Bi Pro', quantity: 3, expirationDate: d(-160), assignees: [] },
  { id: 'l4', name: 'Adobe Illustrator Account ID 1005384818', quantity: 2, expirationDate: d(240),
    assignees: [{ seatExpirationDate: d(6) }, {}] },
  { id: 'l5', name: 'Claude', quantity: 2, expirationDate: d(200), assignees: [] },
  { id: 'l6', name: 'Microsoft Office 2021 Professional Plus (Globe)', quantity: 34, assignees: Array(28).fill({}) },
];

createRoot(document.getElementById('root')).render(
  <div className="min-h-screen bg-sand-50">
    <ITReportPage licenses={LICENSES} />
  </div>,
);
