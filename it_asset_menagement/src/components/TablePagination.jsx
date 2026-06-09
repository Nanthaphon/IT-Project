import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination footer สำหรับตาราง — clean และทำงานเร็ว
 *
 * Props:
 *   currentPage  : เลขหน้าปัจจุบัน (1-based)
 *   totalPages   : จำนวนหน้าทั้งหมด
 *   totalItems   : จำนวนรายการทั้งหมด (โชว์ใน label)
 *   itemsPerPage : รายการต่อหน้า (สำหรับคำนวณ range)
 *   onPageChange : (page: number) => void
 */
export default function TablePagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  if (totalPages <= 1) return null;

  const goTo = (p) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped !== currentPage) onPageChange(clamped);
  };

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  // ── สร้างเลขหน้าที่แสดง (max 5 ปุ่ม + ellipsis) ──
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    // always show first
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 3) { start = 2; end = 4; }
    if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const btn = 'inline-flex items-center justify-center min-w-[36px] h-9 px-2.5 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 mt-3 bg-slate-50/60 rounded-xl ring-1 ring-slate-200">

      {/* Label ซ้าย */}
      <div className="text-[13px] text-slate-500">
        แสดง <span className="font-semibold text-slate-700 tabular-nums">{from.toLocaleString()}</span>
        {' – '}
        <span className="font-semibold text-slate-700 tabular-nums">{to.toLocaleString()}</span>
        {' จาก '}
        <span className="font-semibold text-slate-700 tabular-nums">{totalItems.toLocaleString()}</span> รายการ
      </div>

      {/* Controls ขวา */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(1)}
          disabled={currentPage === 1}
          className={`${btn} text-slate-600 hover:bg-white hover:ring-1 hover:ring-slate-200`}
          title="หน้าแรก"
        >
          <ChevronsLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btn} text-slate-600 hover:bg-white hover:ring-1 hover:ring-slate-200`}
          title="ก่อนหน้า"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>

        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="text-slate-400 px-1">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              className={
                p === currentPage
                  ? `${btn} bg-[#1E487A] text-white shadow-sm`
                  : `${btn} text-slate-600 hover:bg-white hover:ring-1 hover:ring-slate-200`
              }
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btn} text-slate-600 hover:bg-white hover:ring-1 hover:ring-slate-200`}
          title="ถัดไป"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => goTo(totalPages)}
          disabled={currentPage === totalPages}
          className={`${btn} text-slate-600 hover:bg-white hover:ring-1 hover:ring-slate-200`}
          title="หน้าสุดท้าย"
        >
          <ChevronsRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
