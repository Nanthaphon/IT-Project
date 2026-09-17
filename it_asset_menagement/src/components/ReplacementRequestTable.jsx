import React, { useState } from 'react';
import {
  Trash2, RefreshCw, Mail, CheckCircle2,
  Clock, XCircle, CalendarDays,
  Check, X, Monitor, User, Camera,
} from 'lucide-react';
import { formatDateTimeShort } from '../utils/formatDate.js';

/* ─── Staff-theme tokens (ให้ตรงกับฝั่ง user) ─────────────── */
const CARD = 'bg-white rounded-2xl border border-stone-200/60 shadow-[0_1px_2px_rgba(74,43,41,0.04),0_10px_28px_-16px_rgba(74,43,41,0.12)]';
const LABEL = 'text-[11px] font-medium text-stone-400';

/* ─── Status config ──────────────────────────────────────── */
const STATUS = {
  'รอดำเนินการ': { badge: 'bg-ochre-50 text-ochre-700',       dot: 'bg-ochre-600',   icon: Clock        },
  'อนุมัติแล้ว':  { badge: 'bg-olive-50 text-olive-700', dot: 'bg-olive-600', icon: CheckCircle2 },
  'ปฏิเสธคำขอ':  { badge: 'bg-rose-50 text-rose-700',          dot: 'bg-brick-500',    icon: XCircle      },
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
    <div className="bg-sand-50 h-full overflow-y-auto">

      {/* ══ Header ══════════════════════════════════════════ */}
      <div className="mx-auto max-w-[1360px] space-y-6 px-6 pt-6 lg:px-8 lg:pt-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[22px] font-medium tracking-tight text-stone-900">ขอเปลี่ยนเครื่อง</h1>
            <p className="mt-1 text-sm text-stone-500">{filtered.length} รายการในมุมมองนี้</p>
          </div>

          {/* status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                  filterStatus === f.value
                    ? 'bg-clay-600 text-white'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                }`}
              >
                {f.label}
                <span className={`text-[11px] font-medium tabular-nums ${
                  filterStatus === f.value ? 'text-white/70' : 'text-stone-400'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* แถบสถิติ — การ์ดของตัวเอง */}
        <div className={`${CARD} grid grid-cols-3 divide-x divide-stone-100`}>
          <StatCell label="รอดำเนินการ" count={counts.pending}  dot="bg-ochre-600" />
          <StatCell label="อนุมัติแล้ว"  count={counts.approved} dot="bg-olive-600" />
          <StatCell label="ปฏิเสธคำขอ"  count={counts.rejected} dot="bg-brick-500"  />
        </div>
      </div>

      {/* ══ Body ════════════════════════════════════════════ */}
      <div className="mx-auto max-w-[1360px] px-6 py-6 lg:px-8 lg:pb-8">
        {filtered.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-stone-200/70">
            <CheckCircle2 className="h-9 w-9 text-stone-300 mb-3" strokeWidth={1.5} />
            <p className="font-medium text-stone-500 text-sm">ไม่มีคำขอในสถานะนี้</p>
            <p className="text-xs text-stone-400 mt-1">ลองเปลี่ยนตัวกรองด้านบน</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
    <div className="bg-white rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-stone-300 transition-colors flex flex-col overflow-hidden">

      {/* card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* employee row */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-clay-600 text-white flex items-center justify-center text-sm font-medium shrink-0 select-none">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-stone-800 text-sm truncate">
              {req.empName}
            </p>
            <p className="text-[11px] text-stone-400 truncate">
              {req.empId}{req.department ? ` · ${req.department}` : ''}
            </p>
          </div>
          {/* status badge — สไตล์เดียวกับฝั่ง user */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 ${cfg.badge}`}>
            <StatusIcon className="h-3 w-3" strokeWidth={2.2} />
            {req.status}
          </span>
        </div>

        <div className="border-t border-stone-100" />

        {/* machine status */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
            <Monitor className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.7} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={LABEL}>สถานะเครื่องปัจจุบัน</p>
            <p className="font-medium text-stone-800 text-[13px] truncate">
              {req.currentStatus || '(ไม่ระบุ)'}
            </p>
          </div>
        </div>

        {/* reason (expandable) */}
        {req.reason && (
          <div
            className="bg-stone-50 rounded-lg px-3 py-2.5 border border-stone-100 cursor-pointer"
            onClick={() => setExpanded(v => !v)}
          >
            <p className={`${LABEL} mb-1`}>เหตุผลการขอเปลี่ยน</p>
            <p className={`text-[13px] text-stone-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {req.reason}
            </p>
            {req.reason.length > 80 && (
              <p className="text-[11px] text-clay-600 font-medium mt-1 text-right">
                {expanded ? 'ย่อ ▲' : 'อ่านเพิ่ม ▼'}
              </p>
            )}
          </div>
        )}

        {/* damage photos */}
        {(req.damagePhotos || []).length > 0 && (
          <div className="bg-stone-50 rounded-lg px-3 py-2.5 border border-stone-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Camera className="h-3 w-3 text-stone-400" strokeWidth={2} />
              <span className={LABEL}>หลักฐานสภาพชำรุด · {req.damagePhotos.length} รูป</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {req.damagePhotos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setViewPhoto(p.data); }}
                  className="aspect-square rounded-lg overflow-hidden border border-stone-200 hover:border-clay-600 transition-colors bg-white"
                  title="คลิกเพื่อขยาย"
                >
                  <img src={p.data} alt={p.name || `รูปที่ ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-stone-100" />

        {/* manager info */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 mt-0.5">
            <User className="h-3.5 w-3.5 text-stone-500" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={LABEL}>หัวหน้างาน</p>
            <p className="font-medium text-stone-700 text-[13px] truncate">
              {req.managerName || '(ไม่ระบุ)'}
            </p>
            {req.managerEmail ? (
              <a
                href={`mailto:${req.managerEmail}`}
                className="flex items-center gap-1 text-xs text-clay-600 font-medium mt-0.5 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="h-3 w-3 shrink-0" strokeWidth={2} />
                {req.managerEmail}
              </a>
            ) : (
              <p className="text-xs text-stone-400 mt-0.5">ไม่มีข้อมูลอีเมล</p>
            )}
          </div>
        </div>

        {/* date */}
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
          {dateStr}
        </div>
      </div>

      {/* ── action footer ── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100">
        <div className="flex items-center gap-1.5">
          {isPending ? (
            <>
              <button
                onClick={() => onUpdateStatus(req.id, 'อนุมัติแล้ว')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-clay-600 text-white hover:bg-clay-700 transition-colors"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                อนุมัติ
              </button>
              <button
                onClick={() => onUpdateStatus(req.id, 'ปฏิเสธคำขอ')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-rose-600 border border-stone-200 hover:border-rose-300 hover:bg-rose-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                ปฏิเสธ
              </button>
            </>
          ) : (
            <select
              value={req.status}
              onChange={(e) => onUpdateStatus(req.id, e.target.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium outline-none cursor-pointer transition-colors ${cfg.badge}`}
            >
              <option value="รอดำเนินการ">รอดำเนินการ</option>
              <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
              <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
            </select>
          )}
        </div>

        <button
          onClick={() => onDelete(req.id)}
          className="inline-flex items-center justify-center w-7 h-7 text-stone-400 hover:text-rose-500 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 rounded-lg transition-colors"
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
    <div className="px-6 py-5 flex items-center gap-3">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div className="min-w-0">
        <p className="text-[13px] text-stone-500 truncate">{label}</p>
        <p className="mt-0.5 text-3xl font-medium text-stone-900 tabular-nums leading-none">{count}</p>
      </div>
    </div>
  );
}
