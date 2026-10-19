/* Dev harness หน้าคำขออุปกรณ์เสริม (AccessoryRequestTable) — ไม่ต้องล็อกอิน / ไม่แตะ Firestore
   เปิดที่ /accreq-preview.html — ไม่เข้า production build

   กดอนุมัติ → หน้าต่างเลือกชิ้นในสต็อก · ยืนยันแล้วจำลองการตัดสต็อกแบบเดียวกับ App
   (takeItems ตัวเดียวกัน) แล้วโชว์ผลไว้ที่ window.__lastApprove + ด้านล่างหน้า */
import './index.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import AccessoryRequestTable from './components/AccessoryRequestTable.jsx';
import { getAvailableItems, takeItems } from './utils/accessoryItems.js';

const ACCESSORIES = [
  { id: 'a1', name: 'Anitech W227 Wireless', type: 'เมาส์', quantity: 5, assignees: [{}, {}],
    availableItems: [
      { sn: 'AN-W227-0088', model: 'W227', cost: 290, purchaseDate: '2026-02-01', warrantyDate: '2027-02-01' },
      { sn: 'AN-W227-0091', model: 'W227', cost: 290, purchaseDate: '2026-02-01', warrantyDate: '2027-02-01' },
      { sn: '', model: 'W227', cost: 290 },
    ] },
  { id: 'a2', name: 'Wise MT-201', type: 'เมาส์', quantity: 1, assignees: [{}], availableItems: [] },   // หมดสต็อก
];

const now = Date.now(), h = 3600e3;
const REQS = [
  { id: 'r1aaaaaa', empId: '1010122', empName: 'นายกษิดิศ จรัสทรัพย์', nickname: 'Best', department: 'Business Development',
    accessoryId: 'a1', accessoryName: 'Anitech W227 Wireless', requestType: 'borrow', quantity: 1,
    reason: 'ลืมเอามาจากบ้าน', returnDate: '2026-10-20', status: 'รอดำเนินการ', timestamp: now - 2 * h },
  { id: 'r2bbbbbb', empId: '1010184', empName: 'อัญวีณ์ โชติกัมพลพงศ์', nickname: 'Prim', department: 'Operation Team 1 (Hitachi)',
    accessoryId: 'a1', accessoryName: 'Anitech W227 Wireless', requestType: 'new', quantity: 2,
    reason: 'พนักงานใหม่', status: 'รอดำเนินการ', timestamp: now - 30 * h },
  { id: 'r3cccccc', empId: '1010006', empName: 'นายณัฐภพ หนองเหล็ก', nickname: 'Noom', department: 'Operation Team',
    accessoryId: 'a2', accessoryName: 'Wise MT-201', requestType: 'new', quantity: 1,
    reason: 'เมาส์ใช้งานไม่ได้', status: 'รอดำเนินการ', timestamp: now - 80 * h },
];

function Harness() {
  const [reqs, setReqs] = useState(REQS);
  const [accs, setAccs] = useState(ACCESSORIES);
  const [log, setLog] = useState(null);
  const approve = async (req, status, _reason, meta = {}) => {
    if (status !== 'อนุมัติแล้ว') { setReqs((rs) => rs.map((r) => (r.id === req.id ? { ...r, status } : r))); return; }
    const acc = accs.find((a) => a.id === req.accessoryId);
    const { picked, remaining, missing } = takeItems(getAvailableItems(acc), meta.pickedItems, Number(req.quantity || 1));
    const result = { request: req.id, type: meta.requestType, returnDate: meta.returnDate || null,
      given: picked.map((p) => p.sn || '(ไม่มี SN)'), left: remaining.map((p) => p.sn || '(ไม่มี SN)'), missing };
    window.__lastApprove = result;
    setLog(result);
    setAccs((as) => as.map((a) => (a.id === acc.id ? { ...a, availableItems: remaining } : a)));
    setReqs((rs) => rs.map((r) => (r.id === req.id
      ? { ...r, status, requestType: meta.requestType, returnDate: meta.returnDate || r.returnDate, givenItems: picked.map((p) => ({ sn: p.sn || '', model: p.model || '' })) }
      : r)));
  };
  return (
    <div className="min-h-screen bg-sand-50">
      <AccessoryRequestTable
        accessoryRequests={reqs} accessories={accs}
        handleUpdateAccessoryRequestStatus={approve}
        handleDeleteAccessoryRequest={(id) => setReqs((rs) => rs.filter((r) => r.id !== id))}
        canEdit
      />
      {log && <pre id="log" className="m-5 rounded-xl bg-white p-4 text-[11px] text-stone-500">{JSON.stringify(log, null, 2)}</pre>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Harness />);
