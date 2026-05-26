import React from 'react';
import { Upload, Download, FileSpreadsheet, Info } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../ui/primitives.jsx';

/* ── รายการ field ที่แต่ละ entity import ได้ — แสดงเป็น preview ในกล่อง info ── */
const FIELDS_BY_MENU = {
  assets: {
    title: 'ทรัพย์สิน IT หลัก',
    fields: [
      'ชื่ออุปกรณ์ (จำเป็น)', 'ประเภท', 'แผนก',
      'รหัสทรัพย์สิน', 'Serial Number', 'ยี่ห้อ/รุ่น',
      'บริษัท', 'ผู้จัดจำหน่าย', 'วันที่ซื้อ (YYYY-MM-DD)',
      'วันหมด Warranty', 'ราคา', 'Tier (General/Data/Graphic-DX)',
      'หมายเหตุ', 'สถานะ',
    ],
  },
  licenses: {
    title: 'โปรแกรม / ใบอนุญาต',
    fields: [
      'ชื่อโปรแกรม (จำเป็น)', 'Product Key', 'รหัส Key',
      'Supplier', 'วันที่ซื้อ (YYYY-MM-DD)', 'วันหมดอายุ',
      'ราคา', 'จำนวนสิทธิ์', 'หมายเหตุ',
    ],
  },
  accessories: {
    title: 'อุปกรณ์เสริม',
    fields: [
      'ชื่ออุปกรณ์ (จำเป็น)', 'ประเภท', 'จำนวนทั้งหมด',
      'ราคา', 'วันที่ซื้อ', 'วันหมด Warranty',
      'ผู้จัดจำหน่าย', 'หมายเหตุ',
    ],
  },
  office_supplies: {
    title: 'อุปกรณ์สำนักงาน',
    fields: [
      'ชื่ออุปกรณ์ (จำเป็น)', 'ประเภท', 'จำนวน',
      'หน่วยนับ (ชิ้น/กล่อง/ด้าม)', 'ราคา', 'วันที่ซื้อ',
      'ผู้จัดจำหน่าย', 'หมายเหตุ',
    ],
  },
  employees: {
    title: 'พนักงาน',
    fields: [
      'รหัสพนักงาน (จำเป็น)', 'ชื่อ-นามสกุล (จำเป็น)',
      'ชื่อภาษาอังกฤษ', 'ชื่อเล่น', 'แผนก',
      'บริษัท', 'ตำแหน่ง', 'หัวหน้า',
      'เบอร์โทร', 'M365 Email', 'M365 Password',
    ],
  },
};

export default function ImportModal({
  isImportModalOpen,
  setIsImportModalOpen,
  handleDownloadTemplate,
  handleImportEmployees,
  activeMenu,
}) {
  if (!isImportModalOpen) return null;

  const meta = FIELDS_BY_MENU[activeMenu] || FIELDS_BY_MENU.employees;
  const title = meta.title;

  const close = () => setIsImportModalOpen(false);

  return (
    <Modal open={isImportModalOpen} onClose={close} size="md">
      <ModalHeader
        icon={FileSpreadsheet}
        title={`นำเข้าข้อมูล${title}`}
        subtitle="ดาวน์โหลดไฟล์ต้นแบบ กรอกข้อมูล แล้วอัปโหลดกลับ"
        onClose={close}
      />
      <ModalBody className="space-y-4">
        {/* ── Field preview — ให้ผู้ใช้รู้ว่าจะ import field อะไรบ้าง ── */}
        <div className="bg-blue-50/60 ring-1 ring-blue-200 p-4 rounded-xl">
          <div className="flex items-start gap-2.5">
            <Info className="h-4 w-4 text-[#1E487A] mt-0.5 shrink-0" strokeWidth={2.2} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#1E487A] mb-1.5">
                คอลัมน์ที่ระบบจะนำเข้า ({meta.fields.length} คอลัมน์):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {meta.fields.map((f, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center text-[11.5px] font-medium px-2 py-0.5 rounded-md ring-1 ring-inset ${
                      f.includes('จำเป็น')
                        ? 'bg-rose-50 text-rose-700 ring-rose-200'
                        : 'bg-white text-slate-700 ring-slate-200'
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-snug">
                💡 Template มีแถวตัวอย่าง 1 แถว ใช้ดู format แล้วลบทิ้งหรือแก้ไขก่อน import จริง
              </p>
            </div>
          </div>
        </div>

        {/* Step 1 */}
        <div className="bg-slate-50/70 ring-1 ring-slate-200 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="bg-blue-100 text-[#1E487A] w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[13.5px] ring-1 ring-blue-200/60">
              1
            </span>
            <h4 className="font-semibold text-slate-800 text-[15px]">ดาวน์โหลดไฟล์ต้นแบบ</h4>
          </div>
          <p className="text-[13.5px] text-slate-500 mb-3.5 pl-10">
            โหลดไฟล์ CSV (.csv) ที่มีหัวคอลัมน์ถูกต้อง เพื่อนำไปกรอกข้อมูล{title}
          </p>
          <div className="pl-10">
            <button
              onClick={handleDownloadTemplate}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-white ring-1 ring-inset ring-[#1E487A]/30 text-[#1E487A] rounded-lg font-semibold text-[14.5px] hover:bg-blue-50/60 hover:ring-[#1E487A]/50 transition-colors"
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              โหลด Template.csv
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-50/70 ring-1 ring-slate-200 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="bg-blue-100 text-[#1E487A] w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[13.5px] ring-1 ring-blue-200/60">
              2
            </span>
            <h4 className="font-semibold text-slate-800 text-[15px]">อัปโหลดไฟล์ข้อมูล</h4>
          </div>
          <p className="text-[13.5px] text-slate-500 mb-3.5 pl-10">
            เลือกไฟล์ CSV ที่กรอกข้อมูลเสร็จแล้ว ระบบจะนำเข้าข้อมูลทันที
          </p>
          <div className="pl-10 relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportEmployees}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              style={{ marginLeft: '2.5rem' }}
            />
            <div
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#1E487A] hover:bg-[#163963] text-white rounded-lg font-semibold text-[14.5px] transition-colors shadow-sm cursor-pointer"
              style={{ boxShadow: '0 4px 12px rgba(30,72,122,0.25)' }}
            >
              <Upload className="h-4 w-4" strokeWidth={2.2} />
              เลือกไฟล์เพื่อนำเข้า
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={close}>ปิด</Button>
      </ModalFooter>
    </Modal>
  );
}
