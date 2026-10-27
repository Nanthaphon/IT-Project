/* Dev harness ใบคลุมต่ออายุโปรแกรม (LicenseCoverModal + printLicenseCover) — ไม่ต้องล็อกอิน / ไม่แตะ Firestore
   เปิดที่ /licover-preview.html — ไม่เข้า production build
   1 แถว = โปรแกรม + ผู้ถือครอง · กด "พิมพ์ / PDF" → แทนที่จะเปิดกล่องพิมพ์ จะโชว์เอกสารใน iframe ด้านล่าง (window.__coverHtml) */
import './index.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import LicenseCoverModal from './components/licenses/LicenseCoverModal.jsx';
import { buildLicenseCoverHtml } from './utils/printLicenseCover.js';

const EMPLOYEES = [
  { id: 'e1', empId: '1010122', fullName: 'นายกษิดิศ จรัสทรัพย์', department: 'Business Development' },
  { id: 'e2', empId: '1010184', fullName: 'อัญวีณ์ โชติกัมพลพงศ์', department: 'Operation Team 1 (Hitachi)' },
];
const LICENSES = [
  { id: 'l1', name: 'Microsoft 365 Business Standard', supplier: 'Synnex', cost: 15600, quantity: 4,
    purchaseDate: '2025-11-01', expirationDate: '2026-11-01', note: 'ต่ออายุรายปี จ่ายผ่านใบแจ้งหนี้',
    assignees: [
      { checkoutId: 'c1', empId: '1010122', empName: 'นายกษิดิศ จรัสทรัพย์', checkoutDate: '01/11/2025', seatCost: 5200 },
      { checkoutId: 'c2', empId: '1010184', empName: 'อัญวีณ์ โชติกัมพลพงศ์', checkoutDate: '15/01/2026', seatCost: 5200, seatExpirationDate: '2027-01-15' },
      { checkoutId: 'c3', isAssetBound: true, assignedAssetName: 'NB-GB-0042 (ThinkPad E14)', empName: 'นายณัฐภพ หนองเหล็ก', checkoutDate: '02/02/2026', seatCost: 5200 },
    ] },
  { id: 'l2', name: 'Adobe Acrobat Pro', supplier: 'Adobe', cost: '', quantity: 1, purchaseDate: '2025-12-10', expirationDate: '2026-12-10',
    assignees: [{ checkoutId: 'c4', empId: 'e1', checkoutDate: '10/12/2025', seatCost: '9,990' }] },
  { id: 'l3', name: 'AutoCAD LT', supplier: 'Autodesk', cost: 18000, quantity: 2, purchaseDate: '2025-10-20', expirationDate: '2026-10-20', assignees: [] },
];

function App() {
  const [open, setOpen] = useState(true);
  const [html, setHtml] = useState('');
  return (
    <div className="min-h-screen bg-sand-50 p-6">
      <button className="rounded-lg border bg-white px-3 py-2 text-sm" onClick={() => setOpen(true)}>เปิดหน้าต่าง</button>
      {open && (
        <LicenseCoverModal
          licenses={LICENSES} employees={EMPLOYEES} initialIds={['l1']}
          onClose={() => setOpen(false)}
          onPrint={(opts) => {
            const h = buildLicenseCoverHtml({ ...opts, asOf: new Date('2026-10-27') });
            window.__coverHtml = h; window.__coverOpts = opts; setHtml(h); setOpen(false);
          }}
        />
      )}
      {html && <iframe id="cover" title="cover" srcDoc={html} className="mt-4 h-[1200px] w-[820px] border bg-white" />}
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App />);
