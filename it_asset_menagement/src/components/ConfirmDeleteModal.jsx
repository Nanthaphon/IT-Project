import React from 'react';

export default function ConfirmDeleteModal({ confirmDeleteModal, setConfirmDeleteModal, executeDelete }) {
  if (!confirmDeleteModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[90] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-100 text-center p-8">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 text-red-500 mb-6 shadow-inner border border-red-100">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-3">ยืนยันการลบข้อมูล?</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? <br/><span className="text-red-500 font-medium">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => setConfirmDeleteModal({ isOpen: false, id: null, collectionName: null })}
            className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all shadow-sm"
          >
            ยกเลิก
          </button>
          <button 
            onClick={executeDelete}
            className="flex-1 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-600/30"
          >
            ยืนยันลบ
          </button>
        </div>
      </div>
    </div>
  );
}