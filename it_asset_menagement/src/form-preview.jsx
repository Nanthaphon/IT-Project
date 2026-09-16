/* Dev harness ดู modal ฟอร์มธีม v3 โดยไม่ต้องล็อกอิน
   ซ้าย = CheckoutModal ตัวจริง · ขวา = โชว์ primitives กลางที่ modal ทั้ง 9 ตัวใช้ร่วมกัน
   เปิดที่ http://localhost:5173/form-preview.html — ไม่เข้า production build */
import './index.css';
import './firebase.js';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Package } from 'lucide-react';
import CheckoutModal from './components/CheckoutModal.jsx';
import { Modal, ModalHeader, ModalBody, ModalFooter, Field, Button, SectionHeader, Badge, Card } from './ui/primitives.jsx';
import { cls } from './ui/theme.js';

const EMPLOYEES = [
  { id: 'e1', empId: 'EMP101', fullName: 'สมชาย ใจดี', department: 'Design Experience' },
  { id: 'e2', empId: 'EMP102', fullName: 'วิภา สุขสันต์', department: 'Business Development' },
];
const ASSET = { id: 'a1', name: 'Dell Latitude 5440', assetTag: 'GS-1042', type: 'โน๊ตบุ๊ค' };

function Harness() {
  const [which, setWhich] = useState('primitives');
  const [checkout, setCheckout] = useState({ isOpen: true, assetId: 'a1', collectionName: 'assets' });
  const [term, setTerm] = useState('');
  const [empId, setEmpId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [condition, setCondition] = useState(null);

  return (
    <>
      <div className="flex gap-2 bg-[#4A2B29] p-3">
        {[['primitives', 'primitives กลาง'], ['checkout', 'CheckoutModal ตัวจริง']].map(([k, label]) => (
          <button
            key={k} onClick={() => { setWhich(k); setCheckout({ isOpen: true, assetId: 'a1', collectionName: 'assets' }); }}
            className={`rounded-lg px-3 py-1.5 text-sm ${which === k ? 'bg-white text-stone-900' : 'text-white/70'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {which === 'primitives' && (
        <Modal open size="md" onClose={() => {}}>
          <ModalHeader
            icon={Package}
            title="ตัวอย่างฟอร์ม"
            subtitle="ชิ้นส่วนกลางที่ modal ทั้ง 9 ตัวใช้ร่วมกัน"
            onClose={() => {}}
          />
          <ModalBody className="space-y-6">
            <SectionHeader>ข้อมูลหลัก</SectionHeader>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ชื่ออุปกรณ์" required>
                <input className={cls.input} defaultValue="Dell Latitude 5440" />
              </Field>
              <Field label="ประเภท">
                <select className={cls.select} defaultValue="โน๊ตบุ๊ค">
                  <option>โน๊ตบุ๊ค</option><option>คอมพิวเตอร์</option>
                </select>
              </Field>
              <Field label="รหัสทรัพย์สิน" hint="เว้นว่างได้ ระบบจะออกให้อัตโนมัติ">
                <input className={cls.input} placeholder="GS-0000" />
              </Field>
              <Field label="ราคา" error="กรุณากรอกตัวเลข">
                <input className={cls.input} defaultValue="abc" />
              </Field>
            </div>

            <SectionHeader>สถานะ</SectionHeader>
            <div className="flex flex-wrap gap-2">
              <Badge kind="success">พร้อมใช้งาน</Badge>
              <Badge kind="warning">ใกล้หมดอายุ</Badge>
              <Badge kind="danger">ชำรุด</Badge>
              <Badge kind="neutral">ถูกใช้งาน</Badge>
              <Badge kind="brand">แบรนด์</Badge>
            </div>

            <Card>
              <p className="text-sm text-stone-600">การ์ดภายในฟอร์ม — ใช้ token เดียวกับการ์ดในหน้ารายการ</p>
            </Card>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary">ยกเลิก</Button>
            <Button variant="danger">ลบ</Button>
            <Button>บันทึก</Button>
          </ModalFooter>
        </Modal>
      )}

      {which === 'checkout' && (
        <CheckoutModal
          checkoutModal={checkout}
          setCheckoutModal={setCheckout}
          handleCheckout={(...a) => console.log('checkout', a)}
          checkoutSearchTerm={term} setCheckoutSearchTerm={setTerm}
          checkoutEmpId={empId} setCheckoutEmpId={setEmpId}
          employees={EMPLOYEES}
          checkoutRemarks={remarks} setCheckoutRemarks={setRemarks}
          licenses={[]} accessories={[]}
          assets={[ASSET]}
          checkoutCondition={condition} setCheckoutCondition={setCondition}
        />
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
    <Harness />
  </div>,
);

export default Harness;
