import React from 'react';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../ui/primitives.jsx';

export default function ImportModal({
  isImportModalOpen,
  setIsImportModalOpen,
  handleDownloadTemplate,
  handleImportEmployees,
  activeMenu,
}) {
  if (!isImportModalOpen) return null;

  const title =
    activeMenu === 'accessories' ? 'อุปกรณ์เสริม' :
    activeMenu === 'assets'      ? 'ทรัพย์สินหลัก' :
    activeMenu === 'licenses'    ? 'โปรแกรม / License' :
    'พนักงาน';

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
