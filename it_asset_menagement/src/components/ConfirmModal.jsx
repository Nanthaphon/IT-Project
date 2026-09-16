import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

export default function ConfirmModal({ isOpen, title, message, confirmText, cancelText, icon, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/50 flex items-center justify-center p-4 z-[90]" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(74,43,41,0.20)] max-w-sm w-full overflow-hidden border border-stone-200/60 text-center p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-clay-100 text-clay-500 mb-5 border border-clay-100">
          <AlertTriangle className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <h3 className="text-[20px] font-semibold mb-2 tracking-tight" style={{ color: BRAND.primary }}>{title}</h3>
        <p className="text-[14.5px] text-stone-500 mb-7 leading-relaxed">{message}</p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-[14.5px] font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-colors"
          >
            {cancelText || 'ยกเลิก'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg text-[14.5px] font-semibold text-white transition-colors"
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
