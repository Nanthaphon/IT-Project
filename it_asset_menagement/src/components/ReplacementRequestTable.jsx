import React, { useState } from 'react';
import {
  Trash2, RefreshCw, Mail, CheckCircle2,
  Clock, XCircle, CalendarDays,
  Check, X, Monitor, User,
} from 'lucide-react';
import { BRAND } from '../ui/theme.js';

/* ─── Status config ──────────────────────────────────────── */
const STATUS = {
  'รอดำเนินการ': { bar: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200',     icon: Clock        },
  'อนุมัติแล้ว':  { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  'ปฏิเสธคำขอ':  { bar: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-700 ring-rose-200',         icon: XCircle      },
};

/* ─── Main component ─────────────────────────────────────── */
export default function ReplacementRequestTable({
  replacementRequests,
  handleUpdateReplacementStatus,
  handleDeleteReplacement,
}) {
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');

  const counts = {
    pending:  replacementRequests.filter(r => r.status === 'รอดำเนินการ').length,
    approved: replacementRequests.filter(r => r.status === 'อนุมัติแล้ว').length,
    rejected: replacementRequests.filter(r => r.status === 'ปฏิเสธคำขอ').length,
  };

  const filtered = filterStatus === 'ทั้งหมด'
    ? replacementRequests
    : replacementRequests.filter(r => r.status === filterStatus);

  const statusFilters = [
    { value: 'ทั้งหมด',    label: 'ทั้งหมด',    count: replacementRequests.length },
    { value: 'รอดำเนินการ', label: 'รอดำเนินการ', count: counts.pending  },
    { value: 'อนุมัติแล้ว',  label: 'อนุมัติแล้ว',  count: counts.approved },
    { value: 'ปฏิเสธคำขอ',  label: 'ปฏิเสธคำขอ',  count: counts.rejected },
  ];

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">

      {/* ══ Header ══════════════════════════════════════════ */}
      <div className="px-6 pt-5 pb-0 shrink-0">

        {/* title */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${BRAND.primary}15`, color: BRAND.primary }}
          >
            <RefreshCw className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">
              คิวคำขอเปลี่ยนเครื่องโน๊ตบุ๊ค
            </h3>
            <p className="text-[11.5px] text-slate-400 mt-0.5">
              {filtered.length} รายการในมุมมองนี้
            </p>
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
              onClick={() => setFilterStatus(f.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold ring-1 ring-inset transition-all ${
                filterStatus === f.value
                  ? 'bg-[#1E487A] text-white ring-[#1E487A] shadow-sm shadow-[#1E487A]/20'
                  : 'bg-white text-slate-500 ring-slate-200 hover:ring-slate-300 hover:text-slate-700'
              }`}
            >
              {f.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filterStatus === f.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ Body ════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center bg-slate-50/60 rounded-2xl ring-1 ring-dashed ring-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center mb-3 shadow-sm">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-slate-500 text-[14px]">ไม่มีคำขอในสถานะนี้</p>
            <p className="text-[12px] text-slate-400 mt-1">ลองเปลี่ยนตัวกรองด้านบน</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((req) => (
              <ReplacementCard
                key={req.id}
                req={req}
                onUpdateStatus={handleUpdateReplacementStatus}
                onDelete={handleDeleteReplacement}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Replacement Card ───────────────────────────────────── */
function ReplacementCard({ req, onUpdateStatus, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const cfg        = STATUS[req.status] ?? STATUS['รอดำเนินการ'];
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
            <p className="font-semibold text-slate-800 text-[13.5px] truncate group-hover:text-[#1E487A] transition-colors">
              {req.empName}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {req.empId}{req.department ? ` · ${req.department}` : ''}
            </p>
          </div>
          {/* status badge */}
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset shrink-0 ${cfg.badge}`}>
            <StatusIcon className="h-3 w-3" strokeWidth={2.2} />
            {req.status}
          </span>
        </div>

        <div className="border-t border-slate-100" />

        {/* machine status + reason */}
        <div className="space-y-2">
          {/* current machine condition */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Monitor className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.7} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] text-slate-400 font-medium">สถานะเครื่องปัจจุบัน</p>
              <p className="font-semibold text-slate-800 text-[13px] truncate">
                {req.currentStatus || '(ไม่ระบุ)'}
              </p>
            </div>
          </div>

          {/* reason (expandable) */}
          {req.reason && (
            <div
              className="bg-slate-50 rounded-xl px-3 py-2.5 ring-1 ring-slate-100 cursor-pointer"
              onClick={() => setExpanded(v => !v)}
            >
              <div className="flex items-start gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-[#1E487A] shrink-0 mt-0.5" strokeWidth={2} />
                <p className={`text-[12px] text-slate-600 leading-relaxed flex-1 ${expanded ? '' : 'line-clamp-2'}`}>
                  {req.reason}
                </p>
              </div>
              {req.reason.length > 80 && (
                <p className="text-[10.5px] text-[#1E487A] font-semibold mt-1 text-right">
                  {expanded ? 'ย่อ ▲' : 'อ่านเพิ่ม ▼'}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* manager info */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
            <User className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] text-slate-400 font-medium">หัวหน้างาน</p>
            <p className="font-semibold text-slate-700 text-[12.5px] truncate">
              {req.managerName || '(ไม่ระบุ)'}
            </p>
            {req.managerEmail ? (
              <a
                href={`mailto:${req.managerEmail}`}
                className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="h-3 w-3 shrink-0" strokeWidth={2} />
                {req.managerEmail}
              </a>
            ) : (
              <p className="text-[11px] text-slate-400 mt-0.5">ไม่มีข้อมูลอีเมล</p>
            )}
          </div>
        </div>

        {/* date */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          {dateStr}
        </div>
      </div>

      {/* ── action footer ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {isPending ? (
            <>
              <button
                onClick={() => onUpdateStatus(req.id, 'อนุมัติแล้ว')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-sm shadow-emerald-500/30"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                อนุมัติ
              </button>
              <button
                onClick={() => onUpdateStatus(req.id, 'ปฏิเสธคำขอ')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-500 hover:text-white hover:ring-rose-500 active:scale-95 transition-all"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                ปฏิเสธ
              </button>
            </>
          ) : (
            <select
              value={req.status}
              onChange={(e) => onUpdateStatus(req.id, e.target.value)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset outline-none cursor-pointer transition-colors ${cfg.badge}`}
            >
              <option value="รอดำเนินการ">รอดำเนินการ</option>
              <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
              <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
            </select>
          )}
        </div>

        <button
          onClick={() => onDelete(req.id)}
          className="inline-flex items-center justify-center w-7 h-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 ring-1 ring-inset ring-slate-200 hover:ring-rose-200 rounded-lg transition-colors"
          title="ลบ"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
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
        <p className={`text-[11px] font-semibold truncate ${cfg.text}`}>{label}</p>
        <p className={`text-[22px] font-bold tabular-nums leading-tight ${cfg.num}`}>{count}</p>
      </div>
    </div>
  );
}
