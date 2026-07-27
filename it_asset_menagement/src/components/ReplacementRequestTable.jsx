import React, { useState } from 'react';
import {
  Trash2, RefreshCw, Mail, CheckCircle2,
  Clock, XCircle, CalendarDays,
  Check, X, Monitor, User, Camera,
} from 'lucide-react';
import { formatDateTimeShort } from '../utils/formatDate.js';

/* ─── Staff-theme tokens (ให้ตรงกับฝั่ง user) ─────────────── */
const CARD = 'bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)]';
const LABEL = 'text-[11px] font-semibold text-slate-400 uppercase tracking-wide';

/* ─── Status config ──────────────────────────────────────── */
const STATUS = {
  'รอดำเนินการ': { badge: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400',   icon: Clock        },
  'อนุมัติแล้ว':  { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', icon: CheckCircle2 },
  'ปฏิเสธคำขอ':  { badge: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-400',    icon: XCircle      },
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
    <div className={`h-full flex flex-col overflow-hidden ${CARD}`}>

      {/* ══ Header ══════════════════════════════════════════ */}
      <div className="shrink-0">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1E487A]/8 text-[#1E487A] flex items-center justify-center shrink-0">
              <RefreshCw className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-800 tracking-tight">ขอเปลี่ยนเครื่อง</p>
              <p className="text-[12px] text-slate-400 mt-0.5">{filtered.length} รายการในมุมมองนี้</p>
            </div>
          </div>

          {/* status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors ${
                  filterStatus === f.value
                    ? 'bg-[#1E487A] text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {f.label}
                <span className={`text-[11px] font-bold tabular-nums ${
                  filterStatus === f.value ? 'text-white/70' : 'text-slate-400'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* stat strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          <StatCell label="รอดำเนินการ" count={counts.pending}  dot="bg-amber-400"   />
          <StatCell label="อนุมัติแล้ว"  count={counts.approved} dot="bg-emerald-400" />
          <StatCell label="ปฏิเสธคำขอ"  count={counts.rejected} dot="bg-rose-400"    />
        </div>
      </div>

      {/* ══ Body ════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
        {filtered.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="h-9 w-9 text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="font-semibold text-slate-500 text-[14px]">ไม่มีคำขอในสถานะนี้</p>
            <p className="text-[12.5px] text-slate-400 mt-1">ลองเปลี่ยนตัวกรองด้านบน</p>
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
  const [viewPhoto, setViewPhoto] = useState(null);

  const cfg        = STATUS[req.status] ?? STATUS['รอดำเนินการ'];
  const StatusIcon = cfg.icon;
  const isPending  = req.status === 'รอดำเนินการ';
  const initial    = req.empName?.charAt(0) ?? '?';
  const dateStr    = formatDateTimeShort(req.timestamp);

  return (
    <>
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(16,47,87,0.04)] hover:border-slate-300 transition-colors flex flex-col overflow-hidden">

      {/* card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* employee row */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1E487A] text-white flex items-center justify-center text-sm font-bold shrink-0 select-none">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800 text-[14px] truncate">
              {req.empName}
            </p>
            <p className="text-[11.5px] text-slate-400 truncate">
              {req.empId}{req.department ? ` · ${req.department}` : ''}
            </p>
          </div>
          {/* status badge — สไตล์เดียวกับฝั่ง user */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border shrink-0 ${cfg.badge}`}>
            <StatusIcon className="h-3 w-3" strokeWidth={2.2} />
            {req.status}
          </span>
        </div>

        <div className="border-t border-slate-100" />

        {/* machine status */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Monitor className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.7} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={LABEL}>สถานะเครื่องปัจจุบัน</p>
            <p className="font-semibold text-slate-800 text-[13.5px] truncate">
              {req.currentStatus || '(ไม่ระบุ)'}
            </p>
          </div>
        </div>

        {/* reason (expandable) */}
        {req.reason && (
          <div
            className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100 cursor-pointer"
            onClick={() => setExpanded(v => !v)}
          >
            <p className={`${LABEL} mb-1`}>เหตุผลการขอเปลี่ยน</p>
            <p className={`text-[13px] text-slate-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {req.reason}
            </p>
            {req.reason.length > 80 && (
              <p className="text-[11.5px] text-[#1E487A] font-semibold mt-1 text-right">
                {expanded ? 'ย่อ ▲' : 'อ่านเพิ่ม ▼'}
              </p>
            )}
          </div>
        )}

        {/* damage photos */}
        {(req.damagePhotos || []).length > 0 && (
          <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Camera className="h-3 w-3 text-slate-400" strokeWidth={2} />
              <span className={LABEL}>หลักฐานสภาพชำรุด · {req.damagePhotos.length} รูป</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {req.damagePhotos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setViewPhoto(p.data); }}
                  className="aspect-square rounded-md overflow-hidden border border-slate-200 hover:border-[#1E487A] transition-colors bg-white"
                  title="คลิกเพื่อขยาย"
                >
                  <img src={p.data} alt={p.name || `รูปที่ ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-slate-100" />

        {/* manager info */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
            <User className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={LABEL}>หัวหน้างาน</p>
            <p className="font-semibold text-slate-700 text-[13.5px] truncate">
              {req.managerName || '(ไม่ระบุ)'}
            </p>
            {req.managerEmail ? (
              <a
                href={`mailto:${req.managerEmail}`}
                className="flex items-center gap-1 text-[12px] text-[#1E487A] font-medium mt-0.5 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="h-3 w-3 shrink-0" strokeWidth={2} />
                {req.managerEmail}
              </a>
            ) : (
              <p className="text-[12px] text-slate-400 mt-0.5">ไม่มีข้อมูลอีเมล</p>
            )}
          </div>
        </div>

        {/* date */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          {dateStr}
        </div>
      </div>

      {/* ── action footer ── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {isPending ? (
            <>
              <button
                onClick={() => onUpdateStatus(req.id, 'อนุมัติแล้ว')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-[#1E487A] text-white hover:bg-[#163963] transition-colors"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                อนุมัติ
              </button>
              <button
                onClick={() => onUpdateStatus(req.id, 'ปฏิเสธคำขอ')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-white text-rose-600 border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                ปฏิเสธ
              </button>
            </>
          ) : (
            <select
              value={req.status}
              onChange={(e) => onUpdateStatus(req.id, e.target.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border outline-none cursor-pointer transition-colors ${cfg.badge}`}
            >
              <option value="รอดำเนินการ">รอดำเนินการ</option>
              <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
              <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
            </select>
          )}
        </div>

        <button
          onClick={() => onDelete(req.id)}
          className="inline-flex items-center justify-center w-7 h-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
          title="ลบ"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>

    {/* ── Lightbox ── */}
    {viewPhoto && (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
        onClick={() => setViewPhoto(null)}
      >
        <img src={viewPhoto} alt="damage preview" className="max-w-full max-h-full object-contain rounded-lg" />
        <button
          onClick={() => setViewPhoto(null)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl transition-colors"
        >
          ✕
        </button>
      </div>
    )}
    </>
  );
}

/* ─── Stat cell (minimal, ธีมเดียวกับฝั่ง user) ──────────── */
function StatCell({ label, count, dot }) {
  return (
    <div className="px-5 py-3 flex items-center gap-2.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">{label}</p>
        <p className="text-[19px] font-bold text-slate-800 tabular-nums leading-tight">{count}</p>
      </div>
    </div>
  );
}
