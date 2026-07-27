import React from 'react';
import { Trash2 } from 'lucide-react';

export default function ConfirmDeleteModal({ confirmDeleteModal, setConfirmDeleteModal, executeDelete }) {
  if (!confirmDeleteModal.isOpen) return null;

  const close = () => setConfirmDeleteModal({ isOpen: false, id: null, collectionName: null });

  return (
    <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-[90]" onClick={close}>
      <div
        className="bg-white rounded-xl shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)] max-w-sm w-full overflow-hidden border border-slate-200/60 text-center p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-50 text-rose-500 mb-5 border border-rose-100">
          <Trash2 className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <h3 className="text-[20px] font-semibold text-slate-900 mb-2 tracking-tight">ยืนยันการลบข้อมูล?</h3>
        <p className="text-[14.5px] text-slate-500 mb-7 leading-relaxed">
          คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?
          <br />
          <span className="text-rose-600 font-medium">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={close}
            className="flex-1 py-2.5 rounded-lg text-[14.5px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={executeDelete}
            className="flex-1 py-2.5 rounded-lg text-[14.5px] font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
            style={{ boxShadow: '0 4px 12px rgba(225,29,72,0.25)' }}
          >
            ยืนยันลบ
          </button>
        </div>
      </div>
    </div>
  );
}
