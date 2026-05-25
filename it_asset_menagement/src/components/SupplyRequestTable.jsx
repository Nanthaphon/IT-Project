import React from 'react';
import {
  Trash2, ClipboardList, CheckCircle2, XCircle,
  Clock, Package, Check, X, CalendarDays,
} from 'lucide-react';
import { BRAND } from '../ui/theme.js';

/* ─── Status config ─────────────────────────────────────── */
const STATUS = {
  'รอดำเนินการ': {
    bar:   'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon:  Clock,
  },
  'อนุมัติแล้ว': {
    bar:   'bg-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon:  CheckCircle2,
  },
  'ปฏิเสธคำขอ': {
    bar:   'bg-rose-400',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
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

  const statusFilters = [
    { value: 'ทั้งหมด',    label: 'ทั้งหมด',    count: supplyRequests.length },
    { value: 'รอดำเนินการ', label: 'รอดำเนินการ', count: counts.pending  },
    { value: 'อนุมัติแล้ว',  label: 'อนุมัติแล้ว',  count: counts.approved },
    { value: 'ปฏิเสธคำขอ',  label: 'ปฏิเสธคำขอ',  count: counts.rejected },
  ];

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">

      {/* ══ Header ══════════════════════════════════════════ */}
      <div className="px-6 pt-5 pb-0 shrink-0">

        {/* title + date filter */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${BRAND.primary}15`, color: BRAND.primary }}
            >
              <ClipboardList className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
                คิวขอเบิกอุปกรณ์สำนักงาน
              </h3>
              <p className="text-[12.5px] text-slate-400 mt-0.5">
                {currentSupplyRequests.length} รายการในมุมมองนี้
              </p>
            </div>
          </div>

          {/* date filters — ปี / เดือน / วัน */}
          <div className="flex items-center gap-2">
            <select
              value={supplyFilterYear}
              onChange={(e) => { setSupplyFilterYear(e.target.value); setSupplyFilterMonth('ทั้งหมด'); setSupplyFilterDay('ทั้งหมด'); }}
              className="bg-white ring-1 ring-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[13.5px] font-medium outline-none cursor-pointer hover:ring-slate-300 focus:ring-2 focus:ring-[#1E487A]/30 transition-colors"
            >
              <option value="ทั้งหมด">ปี: ทั้งหมด</option>
              {getUniqueYears(supplyRequests).map(y => (
                <option key={y} value={y}>พ.ศ. {Number(y) + 543}</option>
              ))}
            </select>
            <select
              value={supplyFilterMonth}
              onChange={(e) => { setSupplyFilterMonth(e.target.value); setSupplyFilterDay('ทั้งหมด'); }}
              className="bg-white ring-1 ring-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[13.5px] font-medium outline-none cursor-pointer hover:ring-slate-300 focus:ring-2 focus:ring-[#1E487A]/30 transition-colors"
            >
              <option value="ทั้งหมด">เดือน: ทั้งหมด</option>
              {getUniqueMonthsForYear(supplyRequests, supplyFilterYear).map(m => (
                <option key={m} value={m}>{TH_MONTHS[Number(m)]}</option>
              ))}
            </select>
            <select
              value={supplyFilterDay}
              onChange={(e) => setSupplyFilterDay(e.target.value)}
              className="bg-white ring-1 ring-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[13.5px] font-medium outline-none cursor-pointer hover:ring-slate-300 focus:ring-2 focus:ring-[#1E487A]/30 transition-colors"
            >
              <option value="ทั้งหมด">วัน: ทั้งหมด</option>
              {getUniqueDays(supplyRequests, supplyFilterYear, supplyFilterMonth).map(d => (
                <option key={d} value={d}>{Number(d)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <KpiCard label="รอดำเนินการ" count={counts.pending}  color="amber"   />
          <KpiCard label="อนุมัติแล้ว"  count={counts.approved} color="emerald" />
          <KpiCard label="ปฏิเสธคำขอ"  count={counts.rejected} color="rose"    />
        </div>

        {/* status filter pills */}
        <div className="flex items-center gap-2 flex-wrap pb-4 border-b border-slate-100">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setSupplyFilterStatus(f.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold ring-1 ring-inset transition-all ${
                supplyFilterStatus === f.value
                  ? 'bg-[#1E487A] text-white ring-[#1E487A] shadow-sm shadow-[#1E487A]/20'
                  : 'bg-white text-slate-500 ring-slate-200 hover:ring-slate-300 hover:text-slate-700'
              }`}
            >
              {f.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                supplyFilterStatus === f.value
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ Body ════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-5">

        {currentSupplyRequests.length === 0 ? (
          /* empty state */
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center bg-slate-50/60 rounded-2xl ring-1 ring-dashed ring-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center mb-3 shadow-sm">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-slate-500 text-[15px]">ไม่มีคำขอในสถานะนี้</p>
            <p className="text-[13px] text-slate-400 mt-1">ลองเปลี่ยนตัวกรองด้านบน</p>
          </div>
        ) : (
          /* card grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentSupplyRequests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onUpdateStatus={handleUpdateSupplyRequestStatus}
                onDelete={handleDelete}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Request Card ───────────────────────────────────────── */
function RequestCard({ req, onUpdateStatus, onDelete, canEdit }) {
  const cfg       = STATUS[req.status] ?? STATUS['รอดำเนินการ'];
  const StatusIcon = cfg.icon;
  const isPending  = req.status === 'รอดำเนินการ';
  const initial    = req.empName?.charAt(0) ?? '?';
  const dateStr    = new Date(req.timestamp).toLocaleString('th-TH', {
    dateStyle: 'short', timeStyle: 'short',
  });

  return (
    <div className="relative bg-white rounded-2xl ring-1 ring-slate-200 hover:ring-[#1E487A]/40 hover:shadow-lg shadow-sm transition-all duration-200 group flex flex-col overflow-hidden">

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
            <StatusIcon className="h-3 w-3" strokeWidth={2.2} />
            {req.status}
          </span>
        </div>

        <div className="border-t border-slate-100" />

        {/* supply info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-slate-500" strokeWidth={1.7} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-[14px] truncate">{req.supplyName}</p>
            {req.note && (
              <p className="text-[12.5px] text-slate-400 truncate mt-0.5">{req.note}</p>
            )}
          </div>
          {/* qty badge */}
          <div className="shrink-0 flex items-baseline gap-0.5 px-2.5 py-1 rounded-lg bg-blue-50 ring-1 ring-blue-100">
            <span className="text-[16px] font-bold text-[#1E487A] tabular-nums leading-none">
              {req.requestedQty}
            </span>
            <span className="text-[11px] text-slate-400 font-medium ml-0.5">ชิ้น</span>
          </div>
        </div>

        {/* date */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          {dateStr}
        </div>
      </div>

      {/* ── action footer ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {canEdit && isPending ? (
            /* quick approve / reject */
            <>
              <button
                onClick={() => onUpdateStatus(req, 'อนุมัติแล้ว')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-sm shadow-emerald-500/30"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                อนุมัติ
              </button>
              <button
                onClick={() => onUpdateStatus(req, 'ปฏิเสธคำขอ')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-500 hover:text-white hover:ring-rose-500 active:scale-95 transition-all"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                ปฏิเสธ
              </button>
            </>
          ) : canEdit && !isPending ? (
            /* change status dropdown */
            <select
              value={req.status}
              onChange={(e) => onUpdateStatus(req, e.target.value)}
              className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ring-1 ring-inset outline-none cursor-pointer transition-colors ${cfg.badge}`}
            >
              <option value="รอดำเนินการ">รอดำเนินการ</option>
              <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
              <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
            </select>
          ) : null}
        </div>

        {/* delete */}
        {canEdit && (
          <button
            onClick={() => onDelete(req.id, 'supply_requests')}
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

/* ─── KPI Card ───────────────────────────────────────────── */
function KpiCard({ label, count, color }) {
  const cfg = {
    amber:   { bg: 'bg-amber-50',   ring: 'ring-amber-100',   dot: 'bg-amber-400',   text: 'text-amber-700',   num: 'text-amber-600'   },
    emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-100', dot: 'bg-emerald-400', text: 'text-emerald-700', num: 'text-emerald-600' },
    rose:    { bg: 'bg-rose-50',    ring: 'ring-rose-100',    dot: 'bg-rose-400',    text: 'text-rose-700',    num: 'text-rose-600'    },
  }[color];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ring-1 ring-inset ${cfg.bg} ${cfg.ring}`}>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] font-semibold truncate ${cfg.text}`}>{label}</p>
        <p className={`text-[23px] font-bold tabular-nums leading-tight ${cfg.num}`}>{count}</p>
      </div>
    </div>
  );
}
