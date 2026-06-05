import React from 'react';

/**
 * GlobalLoadingOverlay
 * ────────────────────
 * โอเวอร์เลย์เต็มจอ มีสปินเนอร์ + ข้อความ — แสดงเมื่อระบบกำลังประมวลผล async operation
 * ใช้คู่กับ `useGlobalLoading` hook ที่ใช้ใน App.jsx
 *
 * Props:
 *   show     - boolean — แสดง overlay หรือไม่
 *   message  - string  — ข้อความใต้สปินเนอร์ (optional, default: "กำลังประมวลผล...")
 */
export default function GlobalLoadingOverlay({ show, message }) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/30 backdrop-blur-sm animate-in fade-in"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 px-10 py-7 flex flex-col items-center gap-4 ring-1 ring-slate-200">
        {/* Spinner */}
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{
            border: '4px solid rgba(30, 72, 122, 0.15)',
            borderTopColor: '#1E487A',
          }}
        />
        <p className="text-[14.5px] font-semibold text-slate-700 tracking-tight">
          {message || 'กำลังประมวลผล...'}
        </p>
      </div>
    </div>
  );
}
