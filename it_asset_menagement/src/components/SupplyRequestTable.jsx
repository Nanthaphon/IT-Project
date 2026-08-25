import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2, ClipboardList, CheckCircle2, XCircle,
  Clock, Package, Check, X, CalendarDays, BarChart3, TrendingUp, ChevronDown, ChevronUp,
  Download, Building2,
} from 'lucide-react';
import { formatDateTimeShort, formatDateShort } from '../utils/formatDate.js';

/* ─── Staff-theme tokens ─────────────────────────────────── */
const CARD = 'bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)]';
const LABEL = 'text-[11px] font-semibold text-slate-400 uppercase tracking-wide';
const SELECT = 'bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-[13px] font-medium outline-none cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] transition-colors';

/* ─── Status config ─────────────────────────────────────── */
const STATUS = {
  'รอดำเนินการ': {
    bar:   'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon:  Clock,
  },
  'อนุมัติแล้ว': {
    bar:   'bg-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon:  CheckCircle2,
  },
  'ปฏิเสธคำขอ': {
    bar:   'bg-rose-400',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    icon:  XCircle,
  },
};

/* ─── Date helpers ───────────────────────────────────────── */
const TH_MONTHS = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
function getUniqueYears(data) {
  const set = new Set();
  (data || []).forEach(item => { if (item.timestamp) set.add(String(new Date(item.timestamp).getFullYear())); });
  return Array.from(set).sort().reverse();
}
function getUniqueMonthsForYear(data, year) {
  const set = new Set();
  (data || []).forEach(item => {
    if (!item.timestamp) return;
    const d = new Date(item.timestamp);
    if (year !== 'ทั้งหมด' && String(d.getFullYear()) !== year) return;
    set.add(String(d.getMonth() + 1).padStart(2, '0'));
  });
  return Array.from(set).sort();
}
function getUniqueDays(data, year, month) {
  const set = new Set();
  (data || []).forEach(item => {
    if (!item.timestamp) return;
    const d = new Date(item.timestamp);
    if (year  !== 'ทั้งหมด' && String(d.getFullYear()) !== year) return;
    if (month !== 'ทั้งหมด' && String(d.getMonth() + 1).padStart(2, '0') !== month) return;
    set.add(String(d.getDate()).padStart(2, '0'));
  });
  return Array.from(set).sort();
}

/* ─── Main component ─────────────────────────────────────── */
export default function SupplyRequestTable({
  supplyRequests,
  currentSupplyRequests,
  officeSupplies = [],
  supplyFilterYear,
  setSupplyFilterYear,
  supplyFilterMonth,
  setSupplyFilterMonth,
  supplyFilterDay,
  setSupplyFilterDay,
  supplyFilterStatus,
  setSupplyFilterStatus,
  handleUpdateSupplyRequestStatus,
  handleDelete,
  canEdit,
}) {
  const counts = {
    pending:  supplyRequests.filter(r => r.status === 'รอดำเนินการ').length,
    approved: supplyRequests.filter(r => r.status === 'อนุมัติแล้ว').length,
    rejected: supplyRequests.filter(r => r.status === 'ปฏิเสธคำขอ').length,
  };

  // 🆕 Pagination — 10 รายการ/หน้า
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(currentSupplyRequests.length / PAGE_SIZE));
  useEffect(() => { setCurrentPage(1); }, [supplyFilterStatus, supplyFilterYear, supplyFilterMonth, supplyFilterDay]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages, currentPage]);
  const pagedRequests = useMemo(
    () => currentSupplyRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentSupplyRequests, currentPage]
  );

  const statusFilters = [
    { value: 'ทั้งหมด',    label: 'ทั้งหมด',    count: supplyRequests.length },
    { value: 'รอดำเนินการ', label: 'รอดำเนินการ', count: counts.pending  },
    { value: 'อนุมัติแล้ว',  label: 'อนุมัติแล้ว',  count: counts.approved },
    { value: 'ปฏิเสธคำขอ',  label: 'ปฏิเสธคำขอ',  count: counts.rejected },
  ];

  // 🆕 Dashboard toggle
  const [showDashboard, setShowDashboard] = useState(false);

  // 🆕 Insights — compute จาก currentSupplyRequests (ตาม filter ปัจจุบัน)
  //    เอาเฉพาะที่ "อนุมัติแล้ว" มาคิด (จะได้รู้ว่าเบิกออกไปจริงเท่าไหร่)
  const insights = useMemo(() => {
    const approved = currentSupplyRequests.filter(r => r.status === 'อนุมัติแล้ว');

    // นับตามอุปกรณ์ — top 8 (สำหรับแสดง + เก็บทั้งหมดสำหรับ CSV)
    const itemMap = new Map(); // supplyId → { name, count, qty, image }
    approved.forEach(r => {
      const key = r.supplyId || r.supplyName;
      if (!key) return;
      const existing = itemMap.get(key) || { name: r.supplyName || '-', count: 0, qty: 0, supplyId: r.supplyId };
      existing.count++;
      existing.qty += Number(r.requestedQty || 0);
      itemMap.set(key, existing);
    });
    const allItems = [...itemMap.values()]
      .sort((a, b) => b.qty - a.qty)
      .map(item => {
        const supply = officeSupplies.find(s => s.id === item.supplyId);
        return { ...item, image: supply?.image, unit: supply?.unit };
      });
    const topItems = allItems.slice(0, 8);

    // นับตามพนักงาน — top 8
    const empMap = new Map(); // empId → { name, dept, count, qty }
    approved.forEach(r => {
      const key = r.empId || r.empName;
      if (!key) return;
      const existing = empMap.get(key) || { name: r.empName || '-', dept: r.department || '', count: 0, qty: 0 };
      existing.count++;
      existing.qty += Number(r.requestedQty || 0);
      empMap.set(key, existing);
    });
    const allEmployees = [...empMap.values()].sort((a, b) => b.count - a.count);
    const topEmployees = allEmployees.slice(0, 8);

    // นับตามแผนก
    const deptMap = new Map();
    approved.forEach(r => {
      const key = r.department || 'ไม่ระบุแผนก';
      const existing = deptMap.get(key) || { dept: key, count: 0, qty: 0 };
      existing.count++;
      existing.qty += Number(r.requestedQty || 0);
      deptMap.set(key, existing);
    });
    const topDepartments = [...deptMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);

    // นับตามเดือน (12 เดือนย้อนหลัง)
    const monthMap = new Map();
    approved.forEach(r => {
      if (!r.timestamp) return;
      const d = new Date(r.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(key) || { month: key, count: 0, qty: 0 };
      existing.count++;
      existing.qty += Number(r.requestedQty || 0);
      monthMap.set(key, existing);
    });
    const monthlyTrend = [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

    const totalApprovedQty = approved.reduce((s, r) => s + Number(r.requestedQty || 0), 0);
    const uniqueItems = itemMap.size;
    const uniqueEmployees = empMap.size;

    return {
      topItems, topEmployees, topDepartments, monthlyTrend,
      allItems, allEmployees,
      totalApprovedQty, approvedCount: approved.length,
      uniqueItems, uniqueEmployees,
    };
  }, [currentSupplyRequests, officeSupplies]);

  // 🆕 CSV Export — สำหรับเสนอผู้บริหาร
  const handleExportCSV = () => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    // BOM สำหรับ Excel ให้อ่านภาษาไทย
    const BOM = '﻿';
    const esc = (v) => {
      const s = String(v ?? '');
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [];

    // Section 1: สรุปภาพรวม
    lines.push('=== สรุปภาพรวมคำขอเบิกอุปกรณ์สำนักงาน ===');
    lines.push(`วันที่ส่งออก,${now.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' })}`);
    lines.push(`คำขอทั้งหมดในมุมมอง,${currentSupplyRequests.length}`);
    lines.push(`อนุมัติแล้ว,${insights.approvedCount}`);
    lines.push(`ปริมาณเบิกออก (ชิ้น),${insights.totalApprovedQty}`);
    lines.push(`ประเภทอุปกรณ์ที่ถูกเบิก,${insights.uniqueItems}`);
    lines.push(`พนักงานที่เบิก,${insights.uniqueEmployees}`);
    lines.push('');

    // Section 2: อุปกรณ์ที่เบิกบ่อยสุด
    lines.push('=== อุปกรณ์ที่เบิกบ่อยสุด (เรียงจากมากไปน้อย) ===');
    lines.push('อันดับ,ชื่ออุปกรณ์,จำนวนครั้งที่เบิก,ปริมาณรวม (ชิ้น),หน่วย');
    insights.allItems.forEach((item, i) => {
      lines.push([i + 1, esc(item.name), item.count, item.qty, esc(item.unit || 'ชิ้น')].join(','));
    });
    lines.push('');

    // Section 3: พนักงานที่เบิกบ่อยสุด
    lines.push('=== พนักงานที่เบิกบ่อยสุด (เรียงจากมากไปน้อย) ===');
    lines.push('อันดับ,ชื่อพนักงาน,แผนก,จำนวนครั้ง,ปริมาณรวม (ชิ้น)');
    insights.allEmployees.forEach((emp, i) => {
      lines.push([i + 1, esc(emp.name), esc(emp.dept || '-'), emp.count, emp.qty].join(','));
    });
    lines.push('');

    // Section 4: สรุปตามแผนก
    lines.push('=== สรุปการเบิกตามแผนก ===');
    lines.push('อันดับ,แผนก,จำนวนคำขอ,ปริมาณรวม (ชิ้น)');
    insights.topDepartments.forEach((d, i) => {
      lines.push([i + 1, esc(d.dept), d.count, d.qty].join(','));
    });
    lines.push('');

    // Section 5: รายการดิบทั้งหมด (จากคำขอที่อนุมัติ)
    lines.push('=== รายการคำขอที่อนุมัติแล้ว (ทั้งหมด) ===');
    lines.push('วันที่,ผู้ขอ,แผนก,อุปกรณ์,บริษัทที่จัดหา,จำนวน,หน่วย,สถานะ');
    currentSupplyRequests
      .filter(r => r.status === 'อนุมัติแล้ว')
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .forEach(r => {
        const supply = officeSupplies.find(s => s.id === r.supplyId);
        lines.push([
          esc(r.timestamp ? formatDateShort(r.timestamp) : '-'),
          esc(r.empName || '-'),
          esc(r.department || '-'),
          esc(r.supplyName || '-'),
          esc(r.supplyCompany || supply?.company || '-'),
          Number(r.requestedQty || 0),
          esc(r.unit || 'ชิ้น'),
          esc(r.status),
        ].join(','));
      });

    const csv = BOM + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-requests-report_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`h-full overflow-y-auto ${CARD}`}>

      {/* ══ Header ══════════════════════════════════════════ */}
      <div>

        {/* title + date filter */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1E487A]/8 text-[#1E487A] flex items-center justify-center shrink-0">
              <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-800 tracking-tight">คำขอเบิกอุปกรณ์</p>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {currentSupplyRequests.length} รายการในมุมมองนี้
              </p>
            </div>
          </div>

          {/* date filters — ปี / เดือน / วัน */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={supplyFilterYear}
              onChange={(e) => { setSupplyFilterYear(e.target.value); setSupplyFilterMonth('ทั้งหมด'); setSupplyFilterDay('ทั้งหมด'); }}
              className={SELECT}
            >
              <option value="ทั้งหมด">ปี: ทั้งหมด</option>
              {getUniqueYears(supplyRequests).map(y => (
                <option key={y} value={y}>พ.ศ. {Number(y) + 543}</option>
              ))}
            </select>
            <select
              value={supplyFilterMonth}
              onChange={(e) => { setSupplyFilterMonth(e.target.value); setSupplyFilterDay('ทั้งหมด'); }}
              className={SELECT}
            >
              <option value="ทั้งหมด">เดือน: ทั้งหมด</option>
              {getUniqueMonthsForYear(supplyRequests, supplyFilterYear).map(m => (
                <option key={m} value={m}>{TH_MONTHS[Number(m)]}</option>
              ))}
            </select>
            <select
              value={supplyFilterDay}
              onChange={(e) => setSupplyFilterDay(e.target.value)}
              className={SELECT}
            >
              <option value="ทั้งหมด">วัน: ทั้งหมด</option>
              {getUniqueDays(supplyRequests, supplyFilterYear, supplyFilterMonth).map(d => (
                <option key={d} value={d}>{Number(d)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* stat strip — จุดสี + ตัวเลข (ธีมพนักงาน) */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          <StatCell label="รอดำเนินการ" count={counts.pending}  dot="bg-amber-400"   />
          <StatCell label="อนุมัติแล้ว"  count={counts.approved} dot="bg-emerald-400" />
          <StatCell label="ปฏิเสธคำขอ"  count={counts.rejected} dot="bg-rose-400"    />
        </div>

        <div className="px-5 pt-4">

        {/* 🆕 Dashboard toggle + export bar */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
                <span className="text-[13px] font-semibold text-slate-700">Dashboard วิเคราะห์คำขอ</span>
                <span className="text-[11.5px] text-slate-400 hidden sm:inline">
                  อนุมัติแล้ว {insights.approvedCount} รายการ · {insights.totalApprovedQty.toLocaleString()} ชิ้น
                </span>
              </div>
              {showDashboard
                ? <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-slate-600" strokeWidth={2} />
                : <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600" strokeWidth={2} />
              }
            </button>
            <button
              onClick={handleExportCSV}
              disabled={currentSupplyRequests.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#1E487A] hover:bg-[#163963] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-[13px] font-semibold transition-colors"
              title="ส่งออกรายงาน CSV สำหรับเสนอผู้บริหาร"
            >
              <Download className="h-4 w-4" strokeWidth={2.2} />
              <span className="hidden sm:inline">ส่งออก CSV</span>
            </button>
          </div>

          {showDashboard && (
            <div className="mt-3 space-y-3 animate-in fade-in duration-200">

              {/* ── Donut chart: สัดส่วนอุปกรณ์ที่เบิก ── */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
                  <span className="text-[13px] font-bold text-slate-700">สัดส่วนการเบิกอุปกรณ์</span>
                </div>
                {insights.topItems.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-slate-400">— ยังไม่มีคำขอที่อนุมัติแล้ว —</div>
                ) : (
                  <div className="flex items-center gap-5">
                    {/* Donut SVG */}
                    <div className="relative shrink-0 w-32 h-32">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="5.5" />
                        {(() => {
                          const total = insights.totalApprovedQty || 1;
                          const colors = ['#1E487A', '#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#BE185D'];
                          let acc = 0;
                          return insights.topItems.map((item, i) => {
                            const pct = (item.qty / total) * 100;
                            const dash = `${pct * 0.879} 87.9`;
                            const offset = `-${(acc / total) * 100 * 0.879}`;
                            acc += item.qty;
                            return (
                              <circle key={item.supplyId || item.name}
                                cx="18" cy="18" r="14" fill="none"
                                stroke={colors[i % colors.length]} strokeWidth="5.5"
                                strokeDasharray={dash}
                                strokeDashoffset={offset}
                                strokeLinecap="butt"
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-slate-400 font-medium">รวม</span>
                        <span className="text-[17px] font-bold text-slate-800 tabular-nums leading-none">{insights.totalApprovedQty.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">ชิ้น</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      {insights.topItems.map((item, i) => {
                        const colors = ['#1E487A', '#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#BE185D'];
                        const color = colors[i % colors.length];
                        const pct = insights.totalApprovedQty > 0 ? (item.qty / insights.totalApprovedQty) * 100 : 0;
                        return (
                          <div key={item.supplyId || item.name} className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-[12px] font-semibold text-slate-700 truncate flex-1">{item.name}</span>
                            <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color }}>{pct.toFixed(0)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Top items */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
                    <span className="text-[13px] font-bold text-slate-700">อุปกรณ์ที่เบิกบ่อยสุด (Top 5)</span>
                  </div>
                  {insights.topItems.length === 0 ? (
                    <div className="py-8 text-center text-[13px] text-slate-400">— ยังไม่มีคำขอที่อนุมัติแล้ว —</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {insights.topItems.slice(0, 5).map((item, i) => {
                        const maxQty = insights.topItems[0]?.qty || 1;
                        const pct = (item.qty / maxQty) * 100;
                        return (
                          <div key={item.supplyId || item.name} className="px-4 py-2.5 flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                              i === 0 ? 'bg-amber-100 text-amber-700' :
                              i === 1 ? 'bg-slate-200 text-slate-600' :
                              i === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-500'
                            }`}>{i + 1}</div>
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <Package className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.8} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-slate-700 truncate">{item.name}</p>
                              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-[#1E487A] rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[15px] font-bold text-[#1E487A] tabular-nums leading-none">
                                {item.qty.toLocaleString()}
                                <span className="text-[10.5px] font-normal text-slate-400 ml-0.5">{item.unit || 'ชิ้น'}</span>
                              </p>
                              <p className="text-[10.5px] text-slate-400 leading-none mt-1">{item.count} ครั้ง</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Top employees */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
                    <span className="text-[13px] font-bold text-slate-700">พนักงานที่เบิกบ่อยสุด (Top 5)</span>
                  </div>
                  {insights.topEmployees.length === 0 ? (
                    <div className="py-8 text-center text-[13px] text-slate-400">— ยังไม่มีคำขอที่อนุมัติแล้ว —</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {insights.topEmployees.slice(0, 5).map((emp, i) => {
                        const maxCount = insights.topEmployees[0]?.count || 1;
                        const pct = (emp.count / maxCount) * 100;
                        return (
                          <div key={emp.name + i} className="px-4 py-2.5 flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                              i === 0 ? 'bg-amber-100 text-amber-700' :
                              i === 1 ? 'bg-slate-200 text-slate-600' :
                              i === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-500'
                            }`}>{i + 1}</div>
                            <div className="w-8 h-8 rounded-full bg-[#1E487A]/10 text-[#1E487A] flex items-center justify-center font-bold text-[12px] shrink-0">
                              {(emp.name || '?').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-slate-700 truncate">{emp.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {emp.dept && (
                                  <span className="text-[10.5px] text-slate-400 truncate">{emp.dept}</span>
                                )}
                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[15px] font-bold text-emerald-700 tabular-nums leading-none">
                                {emp.count}
                                <span className="text-[10.5px] font-normal text-slate-400 ml-0.5">ครั้ง</span>
                              </p>
                              <p className="text-[10.5px] text-slate-400 leading-none mt-1">รวม {emp.qty.toLocaleString()} ชิ้น</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap pb-4 border-b border-slate-100">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setSupplyFilterStatus(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors ${
                supplyFilterStatus === f.value
                  ? 'bg-[#1E487A] text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {f.label}
              <span className={`text-[11px] font-bold tabular-nums ${
                supplyFilterStatus === f.value ? 'text-white/70' : 'text-slate-400'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* ══ Body ════════════════════════════════════════════ */}
      <div className="p-5">

        {currentSupplyRequests.length === 0 ? (
          /* empty state */
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="h-9 w-9 text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="font-semibold text-slate-500 text-[14px]">ไม่มีคำขอในสถานะนี้</p>
            <p className="text-[12.5px] text-slate-400 mt-1">ลองเปลี่ยนตัวกรองด้านบน</p>
          </div>
        ) : (
          <>
            {/* 🆕 compact horizontal rows */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {pagedRequests.map((req, idx) => (
                <SupplyRow
                  key={req.id}
                  req={req}
                  isFirst={idx === 0}
                  supply={officeSupplies.find(s => s.id === req.supplyId)}
                  onUpdateStatus={handleUpdateSupplyRequestStatus}
                  onDelete={handleDelete}
                  canEdit={canEdit}
                />
              ))}
            </div>

            {/* 🆕 Pagination */}
            {currentSupplyRequests.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-3 mt-4">
                <p className="text-[12px] text-slate-500">
                  แสดง {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, currentSupplyRequests.length)} จาก {currentSupplyRequests.length} รายการ
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && p - arr[i - 1] > 1 && (
                          <span className="px-1 text-slate-400 text-[12px]">…</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[32px] px-2 py-1.5 text-[12px] font-semibold rounded-md transition ${
                            p === currentPage
                              ? 'bg-[#1E487A] text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Compact Row ────────────────────────────────────────── */
function SupplyRow({ req, isFirst, supply, onUpdateStatus, onDelete, canEdit }) {
  const cfg = STATUS[req.status] ?? STATUS['รอดำเนินการ'];
  const StatusIcon = cfg.icon;
  const isPending = req.status === 'รอดำเนินการ';
  const initial = req.empName?.charAt(0) ?? '?';
  const dateStr = formatDateTimeShort(req.timestamp);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors ${isFirst ? '' : 'border-t border-slate-100'}`}>
      {/* status bar */}
      <div className={`w-1 h-10 rounded-full ${cfg.bar} shrink-0`} />

      {/* employee avatar */}
      <div className="w-9 h-9 rounded-lg bg-[#1E487A] text-white flex items-center justify-center text-[13px] font-bold shrink-0 select-none">
        {initial}
      </div>

      {/* supply image — เด่นชัด */}
      {supply?.image ? (
        <img src={supply.image} alt={req.supplyName} className="w-11 h-11 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0 p-0.5" />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
          <Package className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
        </div>
      )}

      {/* main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-semibold text-slate-800 truncate">{req.empName}</span>
          <span className="text-[11px] text-slate-400">·</span>
          <span className="text-[11.5px] text-slate-500 truncate">{req.empId}{req.department ? ` · ${req.department}` : ''}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[12px] text-slate-700 truncate">{req.supplyName}</span>
          <span className="text-[11px] font-semibold text-[#1E487A] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md">× {req.requestedQty}</span>
          {(req.supplyCompany || supply?.company) && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#1E487A] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md">
              <Building2 className="h-2.5 w-2.5 shrink-0" strokeWidth={2.4} />
              {req.supplyCompany || supply?.company}
            </span>
          )}
          {req.note && <span className="text-[11px] text-slate-400 truncate hidden md:inline">— {req.note}</span>}
        </div>
      </div>

      {/* date */}
      <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
        <CalendarDays className="h-3 w-3" strokeWidth={2} />
        {dateStr}
      </div>

      {/* status */}
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border ${cfg.badge} shrink-0`}>
        <StatusIcon className="h-3 w-3" strokeWidth={2.2} />
        <span className="hidden sm:inline">{req.status}</span>
      </span>

      {/* actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {canEdit && isPending ? (
          <>
            <button
              onClick={() => onUpdateStatus(req, 'อนุมัติแล้ว')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-[#1E487A] hover:bg-[#163963] transition-colors"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="hidden sm:inline">อนุมัติ</span>
            </button>
            <button
              onClick={() => onUpdateStatus(req, 'ปฏิเสธคำขอ')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-rose-600 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="hidden sm:inline">ปฏิเสธ</span>
            </button>
          </>
        ) : canEdit && !isPending ? (
          <select
            value={req.status}
            onChange={(e) => onUpdateStatus(req, e.target.value)}
            className={`px-2 py-1 rounded-md text-[11.5px] font-semibold border outline-none cursor-pointer ${cfg.badge}`}
          >
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
            <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
          </select>
        ) : null}
        {canEdit && (
          <button
            onClick={() => onDelete(req.id, 'supply_requests')}
            className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-300 rounded-lg transition-colors"
            title="ลบ"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Stat cell (ธีมพนักงาน — จุดสี + ตัวเลข) ────────────── */
function StatCell({ label, count, dot }) {
  return (
    <div className="px-5 py-3 flex items-center gap-2.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div className="min-w-0">
        <p className={`${LABEL} truncate`}>{label}</p>
        <p className="text-[19px] font-bold text-slate-800 tabular-nums leading-tight">{count}</p>
      </div>
    </div>
  );
}
