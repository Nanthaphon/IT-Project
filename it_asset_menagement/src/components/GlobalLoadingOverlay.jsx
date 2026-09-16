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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950/30 animate-in fade-in"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-no-scroll-lock
    >
      <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(74,43,41,0.04),0_10px_28px_-16px_rgba(74,43,41,0.12)] px-10 py-7 flex flex-col items-center gap-4 border border-stone-200">
        {/* Spinner */}
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{
            border: '4px solid rgba(166,95,60, 0.15)',
            borderTopColor: '#A65F3C',
          }}
        />
        <p className="text-[14.5px] font-semibold text-stone-700 tracking-tight">
          {message || 'กำลังประมวลผล...'}
        </p>
      </div>
    </div>
  );
}
