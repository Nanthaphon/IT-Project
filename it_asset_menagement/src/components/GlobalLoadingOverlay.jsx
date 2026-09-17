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
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(22,32,36,0.20)] px-10 py-7 flex flex-col items-center gap-4 border border-stone-200">
        {/* Spinner */}
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{
            border: '4px solid rgba(43,103,119, 0.15)',
            borderTopColor: '#2B6777',
          }}
        />
        <p className="text-sm font-medium text-stone-700 tracking-tight">
          {message || 'กำลังประมวลผล...'}
        </p>
      </div>
    </div>
  );
}
