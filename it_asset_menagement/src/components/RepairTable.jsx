import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2, Wrench, CheckCircle2, Clock, Loader2,
  XCircle, AlertCircle, CalendarDays, Play, Check,
  Star, MessageSquare, User,
} from 'lucide-react';
import { BRAND } from '../ui/theme.js';
import { formatDateTimeShort } from '../utils/formatDate.js';

/* ─── Status config ──────────────────────────────────────── */
const STATUS = {
  'รอดำเนินการ':    { bar: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200',     icon: Clock,       },
  'กำลังดำเนินการ': { bar: 'bg-blue-400',    badge: 'bg-blue-50 text-[#1E487A] ring-blue-200',        icon: Loader2,     },
  'ซ่อมเสร็จสิ้น':  { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  'ยกเลิก':         { bar: 'bg-slate-300',   badge: 'bg-slate-100 text-slate-500 ring-slate-200',     icon: XCircle,     },
};

/* ─── Main component ─────────────────────────────────────── */
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

export default function RepairTable({
  repairRequests,
  currentRepairRequests,
  repairFilterYear,
  setRepairFilterYear,
  repairFilterMonth,
  setRepairFilterMonth,
  repairFilterDay,
  setRepairFilterDay,
  repairFilterStatus,
  setRepairFilterStatus,
  handleUpdateRepairRequestStatus,
  handleDeleteRepairRequest,
  canEdit,
}) {
  const counts = {
    pending:    repairRequests.filter(r => r.status === 'รอดำเนินการ').length,
    inProgress: repairRequests.filter(r => r.status === 'กำลังดำเนินการ').length,
    done:       repairRequests.filter(r => r.status === 'ซ่อมเสร็จสิ้น').length,
    cancelled:  repairRequests.filter(r => r.status === 'ยกเลิก').length,
  };

  // 🆕 Pagination — 10 รายการ/หน้า
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(currentRepairRequests.length / PAGE_SIZE));
  useEffect(() => { setCurrentPage(1); }, [repairFilterStatus, repairFilterYear, repairFilterMonth, repairFilterDay]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages, currentPage]);
  const pagedRequests = useMemo(
    () => currentRepairRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentRepairRequests, currentPage]
  );

  const statusFilters = [
    { value: 'ทั้งหมด',       label: 'ทั้งหมด',       count: repairRequests.length },
    { value: 'รอดำเนินการ',    label: 'รอดำเนินการ',    count: counts.pending    },
    { value: 'กำลังดำเนินการ', label: 'กำลังดำเนินการ', count: counts.inProgress },
    { value: 'ซ่อมเสร็จสิ้น',  label: 'ซ่อมเสร็จสิ้น',  count: counts.done       },
    { value: 'ยกเลิก',         label: 'ยกเลิก',         count: counts.cancelled  },
  ];

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">

      {/* ══ Header ══════════════════════════════════════════ */}
      <div className="px-6 pt-5 pb-0 shrink-0">

        {/* title + month filter */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${BRAND.primary}15`, color: BRAND.primary }}
            >
              <Wrench className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
                คิวงานแจ้งซ่อม
              </h3>
              <p className="text-[12.5px] text-slate-400 mt-0.5">
                {currentRepairRequests.length} รายการในมุมมองนี้
              </p>
            </div>
          </div>

          {/* date filters — ปี / เดือน / วัน */}
          <div className="flex items-center gap-2">
            {/* ปี */}
            <select
              value={repairFilterYear}
              onChange={(e) => { setRepairFilterYear(e.target.value); setRepairFilterMonth('ทั้งหมด'); setRepairFilterDay('ทั้งหมด'); }}
              className="bg-white ring-1 ring-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[13.5px] font-medium outline-none cursor-pointer hover:ring-slate-300 focus:ring-2 focus:ring-[#1E487A]/30 transition-colors"
            >
              <option value="ทั้งหมด">ปี: ทั้งหมด</option>
              {getUniqueYears(repairRequests).map(y => (
                <option key={y} value={y}>พ.ศ. {Number(y) + 543}</option>
              ))}
            </select>
            {/* เดือน */}
            <select
              value={repairFilterMonth}
              onChange={(e) => { setRepairFilterMonth(e.target.value); setRepairFilterDay('ทั้งหมด'); }}
              className="bg-white ring-1 ring-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[13.5px] font-medium outline-none cursor-pointer hover:ring-slate-300 focus:ring-2 focus:ring-[#1E487A]/30 transition-colors"
            >
              <option value="ทั้งหมด">เดือน: ทั้งหมด</option>
              {getUniqueMonthsForYear(repairRequests, repairFilterYear).map(m => (
                <option key={m} value={m}>{TH_MONTHS[Number(m)]}</option>
              ))}
            </select>
            {/* วัน */}
            <select
              value={repairFilterDay}
              onChange={(e) => setRepairFilterDay(e.target.value)}
              className="bg-white ring-1 ring-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[13.5px] font-medium outline-none cursor-pointer hover:ring-slate-300 focus:ring-2 focus:ring-[#1E487A]/30 transition-colors"
            >
              <option value="ทั้งหมด">วัน: ทั้งหมด</option>
              {getUniqueDays(repairRequests, repairFilterYear, repairFilterMonth).map(d => (
                <option key={d} value={d}>{Number(d)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI strip — 4 cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <KpiCard label="รอดำเนินการ"    count={counts.pending}    color="amber"   />
          <KpiCard label="กำลังดำเนินการ" count={counts.inProgress} color="blue"    />
          <KpiCard label="ซ่อมเสร็จสิ้น"  count={counts.done}       color="emerald" />
          <KpiCard label="ยกเลิก"         count={counts.cancelled}  color="slate"   />
        </div>

        {/* status filter pills */}
        <div className="flex items-center gap-2 flex-wrap pb-4 border-b border-slate-100">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setRepairFilterStatus(f.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold ring-1 ring-inset transition-colors ${
                repairFilterStatus === f.value
                  ? 'bg-[#1E487A] text-white ring-[#1E487A] shadow-sm shadow-[#1E487A]/20'
                  : 'bg-white text-slate-500 ring-slate-200 hover:ring-slate-300 hover:text-slate-700'
              }`}
            >
              {f.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                repairFilterStatus === f.value
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ Body — Compact horizontal rows ══════════════════ */}
      <div className="flex-1 overflow-y-auto p-5">
        {currentRepairRequests.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center bg-slate-50/60 rounded-2xl ring-1 ring-dashed ring-slate-200">
            <CheckCircle2 className="h-9 w-9 text-emerald-400 mb-2" strokeWidth={1.5} />
            <p className="font-semibold text-slate-500 text-[14px]">ไม่มีคิวงานในสถานะนี้</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {pagedRequests.map((req, idx) => (
                <RepairRow
                  key={req.id}
                  req={req}
                  isFirst={idx === 0}
                  onUpdateStatus={handleUpdateRepairRequestStatus}
                  onDelete={handleDeleteRepairRequest}
                  canEdit={canEdit}
                />
              ))}
            </div>

            {/* Pagination */}
            {currentRepairRequests.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-3 mt-4">
                <p className="text-[12px] text-slate-500">
                  แสดง {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, currentRepairRequests.length)} จาก {currentRepairRequests.length} รายการ
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

/* ─── Compact Row ─────────────────────────────────────────── */
function RepairRow({ req, isFirst, onUpdateStatus, onDelete, canEdit }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS[req.status] ?? STATUS['รอดำเนินการ'];
  const StatusIcon = cfg.icon;
  const isPending    = req.status === 'รอดำเนินการ';
  const isInProgress = req.status === 'กำลังดำเนินการ';
  const initial = req.empName?.charAt(0) ?? '?';
  const dateStr = formatDateTimeShort(req.timestamp);
  const hasDetails = (req.issue && req.issue.length > 60) || req.evaluation;

  return (
    <div className={`${isFirst ? '' : 'border-t border-slate-100'} transition-colors ${expanded ? 'bg-slate-50/50' : 'hover:bg-slate-50/40'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status bar */}
        <div className={`w-1 h-10 rounded-full ${cfg.bar} shrink-0`} />

        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-[#1E487A] text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
          {initial}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-semibold text-slate-800 truncate">{req.empName}</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">·</span>
            <span className="text-[11.5px] text-slate-500 truncate hidden sm:inline">{req.empId}{req.department ? ` · ${req.department}` : ''}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Wrench className="h-3 w-3 text-slate-400 shrink-0" strokeWidth={2} />
            <span className="text-[12px] text-slate-700 truncate">{req.assetName || '—'}</span>
            {req.issue && (
              <span className="text-[11.5px] text-slate-500 truncate hidden md:inline">— {req.issue}</span>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
          <CalendarDays className="h-3 w-3" strokeWidth={2} />
          {dateStr}
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ring-1 ring-inset ${cfg.badge} shrink-0`}>
          <StatusIcon className={`h-3 w-3 ${isInProgress ? 'animate-spin' : ''}`} strokeWidth={2.4} />
          <span className="hidden sm:inline">{req.status}</span>
        </span>

        {/* Evaluation star */}
        {req.evaluation && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200 shrink-0">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" strokeWidth={1.6} />
            {Number(req.evaluation.overallRating || 0).toFixed(1)}
          </span>
        )}

        {/* Expand chevron */}
        {hasDetails && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-md transition shrink-0"
            title={expanded ? 'ย่อ' : 'ดูรายละเอียด'}
          >
            <svg className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {canEdit && isPending && (
            <button
              onClick={() => onUpdateStatus(req.id, 'กำลังดำเนินการ')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-semibold text-white bg-[#1E487A] hover:bg-[#133257] transition-colors"
            >
              <Play className="h-3 w-3" strokeWidth={2.4} />
              <span className="hidden sm:inline">เริ่มซ่อม</span>
            </button>
          )}
          {canEdit && isInProgress && (
            <button
              onClick={() => onUpdateStatus(req.id, 'ซ่อมเสร็จสิ้น')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <Check className="h-3 w-3" strokeWidth={2.4} />
              <span className="hidden sm:inline">ซ่อมเสร็จ</span>
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onDelete(req.id)}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
              title="ลบ"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100 bg-slate-50/40">
          {req.issue && (
            <p className="text-[12.5px] text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-500">ปัญหา:</span> {req.issue}
            </p>
          )}
          {req.evaluation && <EvaluationDetail evaluation={req.evaluation} />}
          {canEdit && (
            <select
              value={req.status}
              onChange={(e) => onUpdateStatus(req.id, e.target.value)}
              className={`px-2 py-1 rounded-md text-[11.5px] font-semibold ring-1 ring-inset outline-none cursor-pointer ${cfg.badge}`}
            >
              <option value="รอดำเนินการ">รอดำเนินการ</option>
              <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
              <option value="ซ่อมเสร็จสิ้น">ซ่อมเสร็จสิ้น</option>
              <option value="ยกเลิก">ยกเลิก</option>
            </select>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Repair Card ────────────────────────────────────────── */
function RepairCard({ req, onUpdateStatus, onDelete, canEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);

  const cfg        = STATUS[req.status] ?? STATUS['รอดำเนินการ'];
  const StatusIcon = cfg.icon;
  const isPending    = req.status === 'รอดำเนินการ';
  const isInProgress = req.status === 'กำลังดำเนินการ';
  const showQuick    = isPending || isInProgress;

  const initial = req.empName?.charAt(0) ?? '?';
  const dateStr = formatDateTimeShort(req.timestamp);

  return (
    <div className="relative bg-white rounded-2xl ring-1 ring-slate-200 hover:ring-[#1E487A]/40 shadow-sm transition-colors group flex flex-col overflow-hidden">

      {/* colored top bar */}
      <div className={`h-1 w-full shrink-0 ${cfg.bar}`} />

      {/* card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* employee row */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1E487A] text-white flex items-center justify-center text-sm font-bold shrink-0 select-none shadow-sm">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800 text-[14.5px] truncate group-hover:text-[#1E487A] transition-colors">
              {req.empName}
            </p>
            <p className="text-[12px] text-slate-400 truncate">
              {req.empId}{req.department ? ` · ${req.department}` : ''}
            </p>
          </div>
          {/* status badge */}
          <span className={`flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset shrink-0 ${cfg.badge}`}>
            <StatusIcon className={`h-3 w-3 ${req.status === 'กำลังดำเนินการ' ? 'animate-spin' : ''}`} strokeWidth={2.2} />
            {req.status}
          </span>
        </div>

        <div className="border-t border-slate-100" />

        {/* asset + issue */}
        <div className="space-y-2">
          {/* asset name */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Wrench className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.7} />
            </div>
            <p className="font-semibold text-slate-800 text-[14px] truncate flex-1">
              {req.assetName || '(ไม่ระบุอุปกรณ์)'}
            </p>
          </div>

          {/* issue */}
          {req.issue && (
            <div
              className="bg-slate-50 rounded-xl px-3 py-2.5 ring-1 ring-slate-100 cursor-pointer"
              onClick={() => setExpanded(v => !v)}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                <p className={`text-[13px] text-slate-600 leading-relaxed flex-1 ${expanded ? '' : 'line-clamp-2'}`}>
                  {req.issue}
                </p>
              </div>
              {req.issue.length > 80 && (
                <p className="text-[11.5px] text-[#1E487A] font-semibold mt-1 text-right">
                  {expanded ? 'ย่อ ▲' : 'อ่านเพิ่ม ▼'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* date */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          {dateStr}
        </div>

        {/* evaluation badge (ถ้ามี) */}
        {req.evaluation && (
          <button
            onClick={() => setEvalOpen(v => !v)}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 ring-1 ring-amber-200 hover:from-amber-100 hover:to-amber-100 transition-colors group/eval"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    className={`h-3 w-3 ${n <= Math.round(req.evaluation.overallRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 fill-slate-100'}`}
                    strokeWidth={1.6}
                  />
                ))}
              </div>
              <span className="text-[12px] font-bold text-amber-700 tabular-nums">
                {Number(req.evaluation.overallRating || 0).toFixed(2)}
                <span className="text-[10px] text-amber-500/70 ml-0.5">/5</span>
              </span>
            </div>
            <span className="text-[11px] text-amber-600/70 font-semibold group-hover/eval:text-amber-700">
              {evalOpen ? 'ซ่อน ▲' : 'รายละเอียด ▼'}
            </span>
          </button>
        )}

        {/* evaluation detail (expandable) */}
        {req.evaluation && evalOpen && (
          <EvaluationDetail evaluation={req.evaluation} />
        )}
      </div>

      {/* ── action footer ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {canEdit && showQuick ? (
            isPending ? (
              /* pending → เริ่มซ่อม */
              <button
                onClick={() => onUpdateStatus(req.id, 'กำลังดำเนินการ')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-[#1E487A] text-white hover:bg-[#133257] transition-colors shadow-sm shadow-[#1E487A]/30"
              >
                <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
                เริ่มซ่อม
              </button>
            ) : (
              /* in-progress → ซ่อมเสร็จ */
              <button
                onClick={() => onUpdateStatus(req.id, 'ซ่อมเสร็จสิ้น')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/30"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ซ่อมเสร็จ
              </button>
            )
          ) : null}

          {/* show status dropdown only if canEdit */}
          {canEdit && (
            <select
              value={req.status}
              onChange={(e) => onUpdateStatus(req.id, e.target.value)}
              className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ring-1 ring-inset outline-none cursor-pointer transition-colors ${cfg.badge}`}
            >
              <option value="รอดำเนินการ">รอดำเนินการ</option>
              <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
              <option value="ซ่อมเสร็จสิ้น">ซ่อมเสร็จสิ้น</option>
              <option value="ยกเลิก">ยกเลิก</option>
            </select>
          )}
        </div>

        {/* delete */}
        {canEdit && (
          <button
            onClick={() => onDelete(req.id)}
            className="inline-flex items-center justify-center w-7 h-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 ring-1 ring-inset ring-slate-200 hover:ring-rose-200 rounded-lg transition-colors"
            title="ลบ"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Evaluation Detail ──────────────────────────────────── */
function EvaluationDetail({ evaluation }) {
  const items = [
    { label: 'ความรวดเร็ว',          value: evaluation.speedRating   },
    { label: 'คุณภาพการแก้ปัญหา',     value: evaluation.qualityRating },
    { label: 'การให้บริการ/มารยาท',  value: evaluation.serviceRating },
  ];

  const dateStr = evaluation.evaluatedAt ? formatDateTimeShort(evaluation.evaluatedAt) : '';

  return (
    <div className="bg-slate-50 ring-1 ring-slate-100 rounded-xl px-3.5 py-3 space-y-2.5 animate-[fadeIn_0.18s_ease-out]">
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] text-slate-600 font-medium">{it.label}</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={`h-2.5 w-2.5 ${n <= Number(it.value || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'}`}
                  strokeWidth={1.6}
                />
              ))}
            </div>
            <span className="text-[12px] font-bold text-slate-700 tabular-nums w-3 text-right">
              {it.value || 0}
            </span>
          </div>
        </div>
      ))}

      {/* comment */}
      {evaluation.comment && (
        <div className="pt-2 border-t border-slate-200/60">
          <div className="flex items-start gap-1.5">
            <MessageSquare className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[12.5px] text-slate-600 leading-relaxed italic">
              "{evaluation.comment}"
            </p>
          </div>
        </div>
      )}

      {/* meta */}
      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <User className="h-2.5 w-2.5" strokeWidth={2} />
          {evaluation.evaluatedByName || evaluation.evaluatedBy || '—'}
        </span>
        <span>{dateStr}</span>
      </div>
    </div>
  );
}

/* ─── KPI Card ───────────────────────────────────────────── */
function KpiCard({ label, count, color }) {
  const cfg = {
    amber:   { bg: 'bg-amber-50',   ring: 'ring-amber-100',   dot: 'bg-amber-400',   text: 'text-amber-700',   num: 'text-amber-600'   },
    blue:    { bg: 'bg-blue-50',    ring: 'ring-blue-100',    dot: 'bg-blue-400',    text: 'text-[#1E487A]',   num: 'text-[#1E487A]'   },
    emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-100', dot: 'bg-emerald-400', text: 'text-emerald-700', num: 'text-emerald-600' },
    slate:   { bg: 'bg-slate-50',   ring: 'ring-slate-200',   dot: 'bg-slate-300',   text: 'text-slate-500',   num: 'text-slate-500'   },
  }[color];

  return (
    <div className={`flex items-center gap-2.5 px-3 py-3 rounded-xl ring-1 ring-inset ${cfg.bg} ${cfg.ring}`}>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[11.5px] font-semibold truncate leading-tight ${cfg.text}`}>{label}</p>
        <p className={`text-[21px] font-bold tabular-nums leading-tight ${cfg.num}`}>{count}</p>
      </div>
    </div>
  );
}
