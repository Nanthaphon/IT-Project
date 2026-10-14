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
import { pickDraft } from './utils/reportDraftPick.js';

/* ที่เก็บร่างจำลอง (แทน Firestore it_report/shared) — window.__remote ไว้ตรวจว่าเขียนขึ้นอะไร
   ?remote=filled เริ่มด้วยร่างในระบบ · ?local=old เริ่มด้วยร่างเก่าในเครื่อง (ทดสอบการย้ายครั้งแรก)
   ?fail=1 จำลองเขียนขึ้นระบบไม่สำเร็จ */
const q = new URLSearchParams(location.search);
window.__remote = q.get('remote') === 'filled'
  ? { companyName: 'Globe Syndicate (Thailand) Company Limited', bigIssues: [{ issue: 'จากระบบ', raiseBy: 'All', status: '⏳ In Progress', due: '' }], rdProjects: [], followUps: [], stats: null, hw: null, sw: null, exp: null, _savedAt: 1000 }
  : null;
window.__remoteWrites = 0;
if (q.get('local') === 'old') localStorage.setItem('it_report_shared', JSON.stringify({ bigIssues: [{ issue: 'จากเครื่องนี้ (ร่างเก่า)', raiseBy: 'All', status: '⏳ In Progress', due: '' }] }));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fakeStore = {
  async load() {
    await wait(300);
    const local = JSON.parse(localStorage.getItem('it_report_shared') || 'null');
    return pickDraft(local, window.__remote);   // กติกาเดียวกับของจริง
  },
  saveLocal(d) { localStorage.setItem('it_report_shared', JSON.stringify(d)); },
  async saveRemote(d) { await wait(200); if (q.get('fail')) throw new Error('offline'); window.__remote = JSON.parse(JSON.stringify(d)); window.__remoteWrites += 1; },
};

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
    <ITReportPage licenses={LICENSES} draftStore={fakeStore} />
  </div>,
);
