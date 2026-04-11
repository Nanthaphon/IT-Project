import React from 'react';

export default function CustomAlert({ customAlert, setCustomAlert }) {
  // ถ้า isOpen เป็น false ไม่ต้องแสดงผลอะไรเลย
  if (!customAlert.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-100 text-center p-8">
        <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full ${customAlert.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'} mb-6`}>
          {customAlert.type === 'error' ? (
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          ) : (
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          )}
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-3">{customAlert.title}</h3>
        <p className="text-base text-slate-500 mb-8 whitespace-pre-line leading-relaxed">
          {customAlert.message}
        </p>
        <button 
          onClick={() => setCustomAlert({ ...customAlert, isOpen: false })}
          className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${
            customAlert.type === 'error' 
              ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' 
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
          }`}
        >
          ตกลง
        </button>
      </div>
    </div>
  );
}