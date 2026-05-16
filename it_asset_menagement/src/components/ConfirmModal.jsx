import React from 'react';

export default function ConfirmModal({ isOpen, title, message, confirmText, cancelText, icon, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[90] transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-100 text-center p-8">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-50 text-amber-500 mb-6 shadow-inner border border-amber-100">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-[#1E487A] mb-3">{title}</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all shadow-sm"
          >
            {cancelText || 'ยกเลิก'}
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#1E487A] hover:bg-[#133257] transition-all shadow-lg shadow-[#1E487A]/30"
          >
            {confirmText || 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  );
}