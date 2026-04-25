import React from 'react';

const ICONS = {
  trash: {
    bg: 'bg-red-50 border-red-100',
    text: 'text-red-500',
    confirmCls: 'bg-red-600 hover:bg-red-700 shadow-red-600/30',
    svg: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    ),
  },
  warning: {
    bg: 'bg-amber-50 border-amber-100',
    text: 'text-amber-500',
    confirmCls: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30',
    svg: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
  },
  import: {
    bg: 'bg-emerald-50 border-emerald-100',
    text: 'text-emerald-500',
    confirmCls: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30',
    svg: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    ),
  },
  return: {
    bg: 'bg-blue-50 border-blue-100',
    text: 'text-blue-500',
    confirmCls: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30',
    svg: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    ),
  },
};

export default function ConfirmModal({
  isOpen, title, message, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก',
  icon = 'warning', onConfirm, onCancel,
}) {
  if (!isOpen) return null;

  const theme = ICONS[icon] || ICONS.warning;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[95] transition-opacity"
      style={{ fontFamily: "'Prompt', sans-serif" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-100 text-center p-8">
        <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full ${theme.bg} ${theme.text} mb-6 shadow-inner border`}>
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {theme.svg}
          </svg>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed whitespace-pre-line">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all shadow-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${theme.confirmCls}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
