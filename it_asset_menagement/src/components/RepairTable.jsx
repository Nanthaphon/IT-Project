import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2, Wrench, CheckCircle2, Clock, Loader2,
  XCircle, CalendarDays, Play, Check,
  Star, MessageSquare, User,
} from 'lucide-react';
import { formatDateTimeShort } from '../utils/formatDate.js';

/* ─── Staff-theme tokens ─────────────────────────────────── */
const CARD = 'bg-white rounded-2xl border border-stone-200/60/70 shadow-[0_1px_2px_rgba(74,43,41,0.04),0_10px_28px_-16px_rgba(74,43,41,0.12)]';
const LABEL = 'text-[11px] font-semibold text-stone-400';
const SELECT = 'bg-white border border-stone-200 text-stone-600 px-3 py-2 rounded-lg text-[13px] font-medium outline-none cursor-pointer hover:border-stone-300 focus:ring-2 focus:ring-clay-600/20 focus:border-clay-600 transition-colors';

/* ─── Status config ──────────────────────────────────────── */
const STATUS = {
  'รอดำเนินการ':    { bar: 'bg-clay-400',   badge: 'bg-ochre-50 text-ochre-700 border-ochre-200',     icon: Clock,       },
  'กำลังดำเนินการ': { bar: 'bg-stone-400',    badge: 'bg-ochre-50 text-ochre-700 border-ochre-200',        icon: Loader2,     },
  'ซ่อมเสร็จสิ้น':  { bar: 'bg-olive-400', badge: 'bg-olive-50 text-olive-700 border-olive-200', icon: CheckCircle2 },
  'ยกเลิก':         { bar: 'bg-stone-300',   badge: 'bg-stone-50 text-stone-500 border-stone-200',     icon: XCircle,     },
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
    <div className={`h-full flex flex-col overflow-hidden ${CARD}`}>

      {/* ══ Header ══════════════════════════════════════════ */}
      <div className="shrink-0">

        {/* title + date filter */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-clay-100 text-clay-600 flex items-center justify-center shrink-0">
              <Wrench className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-[15px] font-medium text-stone-800 tracking-tight">แจ้งซ่อม</p>
              <p className="text-[12px] text-stone-400 mt-0.5">
                {currentRepairRequests.length} รายการในมุมมองนี้
              </p>
            </div>
          </div>

          {/* date filters — ปี / เดือน / วัน */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={repairFilterYear}
              onChange={(e) => { setRepairFilterYear(e.target.value); setRepairFilterMonth('ทั้งหมด'); setRepairFilterDay('ทั้งหมด'); }}
              className={SELECT}
            >
              <option value="ทั้งหมด">ปี: ทั้งหมด</option>
              {getUniqueYears(repairRequests).map(y => (
                <option key={y} value={y}>พ.ศ. {Number(y) + 543}</option>
              ))}
            </select>
            <select
              value={repairFilterMonth}
              onChange={(e) => { setRepairFilterMonth(e.target.value); setRepairFilterDay('ทั้งหมด'); }}
              className={SELECT}
            >
              <option value="ทั้งหมด">เดือน: ทั้งหมด</option>
              {getUniqueMonthsForYear(repairRequests, repairFilterYear).map(m => (
                <option key={m} value={m}>{TH_MONTHS[Number(m)]}</option>
              ))}
            </select>
            <select
              value={repairFilterDay}
              onChange={(e) => setRepairFilterDay(e.target.value)}
              className={SELECT}
            >
              <option value="ทั้งหมด">วัน: ทั้งหมด</option>
              {getUniqueDays(repairRequests, repairFilterYear, repairFilterMonth).map(d => (
                <option key={d} value={d}>{Number(d)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* stat strip — จุดสี + ตัวเลข (ธีมพนักงาน) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-stone-100 border-b border-stone-100">
          <StatCell label="รอดำเนินการ"    count={counts.pending}    dot="bg-clay-400"   />
          <StatCell label="กำลังดำเนินการ" count={counts.inProgress} dot="bg-stone-400"    />
          <StatCell label="ซ่อมเสร็จสิ้น"  count={counts.done}       dot="bg-olive-400" />
          <StatCell label="ยกเลิก"         count={counts.cancelled}  dot="bg-stone-300"   />
        </div>

        {/* status filter pills */}
        <div className="px-5 pt-4 pb-4 border-b border-stone-100 flex items-center gap-1.5 flex-wrap">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setRepairFilterStatus(f.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                repairFilterStatus === f.value
                  ? 'bg-clay-600 text-white'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
              }`}
            >
              {f.label}
              <span className={`text-[11px] font-medium tabular-nums ${
                repairFilterStatus === f.value ? 'text-white/70' : 'text-stone-400'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ Body — Compact horizontal rows ══════════════════ */}
      <div className="flex-1 overflow-y-auto p-5 bg-sand-50">
        {currentRepairRequests.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-stone-200/70">
            <CheckCircle2 className="h-9 w-9 text-stone-300 mb-3" strokeWidth={1.5} />
            <p className="font-semibold text-stone-500 text-[14px]">ไม่มีคิวงานในสถานะนี้</p>
            <p className="text-[12.5px] text-stone-400 mt-1">ลองเปลี่ยนตัวกรองด้านบน</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-stone-200/60 rounded-2xl overflow-hidden">
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
                <p className="text-[12px] text-stone-500">
                  แสดง {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, currentRepairRequests.length)} จาก {currentRepairRequests.length} รายการ
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 text-[12px] font-medium text-stone-600 bg-white border border-stone-200/60 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && p - arr[i - 1] > 1 && (
                          <span className="px-1 text-stone-400 text-[12px]">…</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[32px] px-2 py-1.5 text-[12px] font-semibold rounded-lg transition ${
                            p === currentPage
                              ? 'bg-clay-600 text-white'
                              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 text-[12px] font-medium text-stone-600 bg-white border border-stone-200/60 rounded-lg hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
    <div className={`${isFirst ? '' : 'border-t border-stone-100'} transition-colors ${expanded ? 'bg-sand-50' : 'hover:bg-stone-50/40'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status bar */}
        <div className={`w-1 h-10 rounded-full ${cfg.bar} shrink-0`} />

        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-clay-600 text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
          {initial}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-semibold text-stone-800 truncate">{req.empName}</span>
            <span className="text-[11px] text-stone-400 hidden sm:inline">·</span>
            <span className="text-[11.5px] text-stone-500 truncate hidden sm:inline">{req.empId}{req.department ? ` · ${req.department}` : ''}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Wrench className="h-3 w-3 text-stone-400 shrink-0" strokeWidth={2} />
            <span className="text-[12px] text-stone-700 truncate">{req.assetName || '—'}</span>
            {req.issue && (
              <span className="text-[11.5px] text-stone-500 truncate hidden md:inline">— {req.issue}</span>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-stone-400 shrink-0">
          <CalendarDays className="h-3 w-3" strokeWidth={2} />
          {dateStr}
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${cfg.badge} shrink-0`}>
          <StatusIcon className={`h-3 w-3 ${isInProgress ? 'animate-spin' : ''}`} strokeWidth={2.2} />
          <span className="hidden sm:inline">{req.status}</span>
        </span>

        {/* Evaluation star */}
        {req.evaluation && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-clay-100 text-clay-600 border border-clay-200 shrink-0">
            <Star className="h-3 w-3 fill-clay-400 text-clay-400" strokeWidth={1.6} />
            {Number(req.evaluation.overallRating || 0).toFixed(1)}
          </span>
        )}

        {/* Expand chevron */}
        {hasDetails && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors shrink-0"
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-clay-600 hover:bg-clay-700 transition-colors"
            >
              <Play className="h-3 w-3" strokeWidth={2.4} />
              <span className="hidden sm:inline">เริ่มซ่อม</span>
            </button>
          )}
          {canEdit && isInProgress && (
            <button
              onClick={() => onUpdateStatus(req.id, 'ซ่อมเสร็จสิ้น')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-olive-600 bg-white border border-stone-200 hover:border-olive-300 hover:bg-olive-50 transition-colors"
            >
              <Check className="h-3 w-3" strokeWidth={2.4} />
              <span className="hidden sm:inline">ซ่อมเสร็จ</span>
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onDelete(req.id)}
              className="w-7 h-7 flex items-center justify-center bg-white border border-stone-200 text-stone-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-300 rounded-lg transition-colors"
              title="ลบ"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-stone-100 bg-stone-50/40">
          {req.issue && (
            <p className="text-[12.5px] text-stone-700 leading-relaxed">
              <span className="font-semibold text-stone-500">ปัญหา:</span> {req.issue}
            </p>
          )}
          {req.evaluation && <EvaluationDetail evaluation={req.evaluation} />}
          {canEdit && (
            <select
              value={req.status}
              onChange={(e) => onUpdateStatus(req.id, e.target.value)}
              className={`px-2 py-1 rounded-lg text-[11.5px] font-semibold border outline-none cursor-pointer ${cfg.badge}`}
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

/* ─── Evaluation Detail ──────────────────────────────────── */
function EvaluationDetail({ evaluation }) {
  const items = [
    { label: 'ความรวดเร็ว',          value: evaluation.speedRating   },
    { label: 'คุณภาพการแก้ปัญหา',     value: evaluation.qualityRating },
    { label: 'การให้บริการ/มารยาท',  value: evaluation.serviceRating },
  ];

  const dateStr = evaluation.evaluatedAt ? formatDateTimeShort(evaluation.evaluatedAt) : '';

  return (
    <div className="bg-stone-50 border border-stone-100 rounded-lg px-3.5 py-3 space-y-2.5 animate-[fadeIn_0.18s_ease-out]">
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] text-stone-600 font-medium">{it.label}</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={`h-2.5 w-2.5 ${n <= Number(it.value || 0) ? 'fill-clay-400 text-clay-400' : 'text-stone-200 fill-stone-100'}`}
                  strokeWidth={1.6}
                />
              ))}
            </div>
            <span className="text-[12px] font-medium text-stone-700 tabular-nums w-3 text-right">
              {it.value || 0}
            </span>
          </div>
        </div>
      ))}

      {/* comment */}
      {evaluation.comment && (
        <div className="pt-2 border-t border-stone-200/60">
          <div className="flex items-start gap-1.5">
            <MessageSquare className="h-3 w-3 text-stone-400 shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[12.5px] text-stone-600 leading-relaxed italic">
              "{evaluation.comment}"
            </p>
          </div>
        </div>
      )}

      {/* meta */}
      <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-400">
        <span className="flex items-center gap-1">
          <User className="h-2.5 w-2.5" strokeWidth={2} />
          {evaluation.evaluatedByName || evaluation.evaluatedBy || '—'}
        </span>
        <span>{dateStr}</span>
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
        <p className="text-[19px] font-medium text-stone-800 tabular-nums leading-tight">{count}</p>
      </div>
    </div>
  );
}
