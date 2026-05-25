import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

export default function CustomAlert({ customAlert, setCustomAlert }) {
  if (!customAlert.isOpen) return null;
  const isError = customAlert.type === 'error';
  const close = () => setCustomAlert({ ...customAlert, isOpen: false });

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]" onClick={close}>
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 max-w-sm w-full overflow-hidden ring-1 ring-slate-200/60 text-center p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-5 ring-1 ${
            isError ? 'bg-rose-50 text-rose-500 ring-rose-100' : 'bg-emerald-50 text-emerald-500 ring-emerald-100'
          }`}
        >
          {isError ? <AlertCircle className="h-8 w-8" strokeWidth={1.8} /> : <CheckCircle2 className="h-8 w-8" strokeWidth={1.8} />}
        </div>
        <h3 className="text-[20px] font-semibold mb-2 tracking-tight" style={{ color: BRAND.primary }}>
          {customAlert.title}
        </h3>
        <p className="text-[15px] text-slate-500 mb-7 whitespace-pre-line leading-relaxed">{customAlert.message}</p>
        <button
          onClick={close}
          className={`w-full py-2.5 rounded-lg text-[14.5px] font-semibold text-white transition-colors shadow-sm hover:shadow-md ${
            isError ? 'bg-rose-600 hover:bg-rose-700' : ''
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
