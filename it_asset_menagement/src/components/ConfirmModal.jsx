import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

export default function ConfirmModal({ isOpen, title, message, confirmText, cancelText, icon, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 max-w-sm w-full overflow-hidden ring-1 ring-slate-200/60 text-center p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 text-amber-500 mb-5 ring-1 ring-amber-100">
          <AlertTriangle className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <h3 className="text-[19px] font-semibold mb-2 tracking-tight" style={{ color: BRAND.primary }}>{title}</h3>
        <p className="text-[13.5px] text-slate-500 mb-7 leading-relaxed">{message}</p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-[13.5px] font-medium text-slate-700 bg-white ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 transition-colors"
          >
            {cancelText || 'ยกเลิก'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg text-[13.5px] font-semibold text-white transition-colors shadow-sm hover:shadow-md"
            style={{ background: BRAND.primary, boxShadow: `0 4px 12px ${BRAND.primary}40` }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.primaryDark)}
            onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.primary)}
          >
            {confirmText || 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  );
}
