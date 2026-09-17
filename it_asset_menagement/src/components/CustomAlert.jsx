import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

export default function CustomAlert({ customAlert, setCustomAlert }) {
  if (!customAlert.isOpen) return null;
  const isError = customAlert.type === 'error';
  const close = () => setCustomAlert({ ...customAlert, isOpen: false });

  return (
    <div className="fixed inset-0 bg-stone-950/50 flex items-center justify-center p-4 z-[90]" onClick={close}>
      <div
        className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(22,32,36,0.20)] max-w-sm w-full overflow-hidden border border-stone-200/60 text-center p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-5 border ${
            isError ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-olive-50 text-olive-500 border-olive-100'
          }`}
        >
          {isError ? <AlertCircle className="h-8 w-8" strokeWidth={2} /> : <CheckCircle2 className="h-8 w-8" strokeWidth={2} />}
        </div>
        <h3 className="text-[19px] font-medium mb-2 tracking-tight" style={{ color: BRAND.primary }}>
          {customAlert.title}
        </h3>
        <p className="text-[15px] text-stone-500 mb-7 whitespace-pre-line leading-relaxed">{customAlert.message}</p>
        <button
          onClick={close}
          className={`w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors shadow-sm ${
            isError ? 'bg-brick-600 hover:bg-brick-700' : ''
          }`}
          style={!isError ? { background: BRAND.primary, boxShadow: `0 4px 12px ${BRAND.primary}40` } : { boxShadow: '0 4px 12px rgba(225,29,72,0.30)' }}
          onMouseEnter={(e) => !isError && (e.currentTarget.style.background = BRAND.primaryDark)}
          onMouseLeave={(e) => !isError && (e.currentTarget.style.background = BRAND.primary)}
        >
          ตกลง
        </button>
      </div>
    </div>
  );
}
