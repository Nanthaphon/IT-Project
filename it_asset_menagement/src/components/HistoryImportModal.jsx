import React from 'react';
import { Upload, Download, History, Info } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '../ui/primitives.jsx';

/*
 * HistoryImportModal — นำเข้าประวัติการถือครองทรัพย์สินจาก CSV
 * (ย้ายประวัติเบิก-คืนจากระบบเก่า เช่น Snipe-IT)
 */
export default function HistoryImportModal({ isOpen, onClose, onDownloadTemplate, onUpload }) {
  if (!isOpen) return null;
  return (
    <Modal open={isOpen} onClose={onClose} size="md">
      <ModalHeader
        icon={History}
        title="นำเข้าประวัติการถือครอง"
        subtitle="ย้ายประวัติเบิก-คืนของทรัพย์สินจากระบบเก่า (CSV)"
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
          <p className="text-[13px] font-semibold text-[#1E487A] flex items-center gap-1.5 mb-2">
            <Info className="h-4 w-4" strokeWidth={2} /> คอลัมน์ที่รองรับ
          </p>
          <ul className="text-[12.5px] text-slate-600 space-y-1 leading-relaxed list-disc pl-5">
            <li><b>Asset Tag</b> หรือ <b>Serial</b> — ใช้จับคู่เครื่องในระบบ (จำเป็นอย่างใดอย่างหนึ่ง)</li>
            <li><b>Action</b> — <code>checkout</code> (เบิก) / <code>checkin</code> (คืน) — รองรับคำไทยด้วย</li>
            <li><b>Date</b> — วันที่ (เช่น 2026-01-15 หรือ 15/01/2026)</li>
            <li><b>Name</b> — ชื่อผู้ถือครอง (สำหรับ checkout)</li>
            <li><b>Note</b> — หมายเหตุ (ถ้ามี)</li>
          </ul>
          <p className="text-[12px] text-slate-500 mt-2">
            ระบบจะจับคู่ <b>เบิก → คืน</b> เป็นช่วงการถือครองให้อัตโนมัติ (เรียงตามวันที่) · แถวที่จับคู่เครื่องไม่ได้จะถูกข้ามและสรุปให้ทราบ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">1. ดาวน์โหลด Template</p>
            <button
              onClick={onDownloadTemplate}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Download className="h-4 w-4" strokeWidth={2} /> ดาวน์โหลด .csv
            </button>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">2. อัปโหลดไฟล์ประวัติ</p>
            <label className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-[#1E487A] text-white text-[13px] font-semibold rounded-lg hover:bg-[#163963] transition-colors cursor-pointer">
              <Upload className="h-4 w-4" strokeWidth={2} /> เลือกไฟล์ .csv
              <input type="file" accept=".csv" onChange={onUpload} className="hidden" />
            </label>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>ปิด</Button>
      </ModalFooter>
    </Modal>
  );
}
