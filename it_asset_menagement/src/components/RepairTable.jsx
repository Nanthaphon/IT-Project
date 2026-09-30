import React, { useState, useEffect, useMemo } from 'react';
import { Check, CheckCircle2, ChevronDown, Clock, Hammer, MessageSquare, Play, Star, Trash2, User, Wrench, XCircle } from 'lucide-react';
import { formatDateShort, formatDateTimeShort } from '../utils/formatDate.js';
import { stripTitle, initialOf } from '../utils/nameUtils.js';
import { filterByDate } from '../utils/dateFilter.js';

/* ─── Staff-theme tokens ─────────────────────────────────── */
const CARD = 'bg-white rounded-2xl border border-stone-200/60 shadow-[0_1px_2px_rgba(22,32,36,0.04),0_10px_28px_-16px_rgba(22,32,36,0.12)]';
const LABEL = 'text-[11px] font-medium text-stone-400';
const SELECT = 'bg-white border border-stone-200 text-stone-600 px-3 py-2 rounded-xl text-[13px] font-medium outline-none cursor-pointer hover:border-stone-300 focus:ring-2 focus:ring-clay-600/20 focus:border-clay-600 transition-colors';

/* ─── Status config ──────────────────────────────────────── */
const STATUS = {
  'รอดำเนินการ':    { bar: 'bg-ochre-600/70',   badge: 'bg-ochre-50 text-ochre-700',     icon: Clock,       },
  'กำลังดำเนินการ': { bar: 'bg-clay-500',        badge: 'bg-clay-50 text-clay-700',          icon: Hammer,      },
  'ซ่อมเสร็จสิ้น':  { bar: 'bg-olive-600/70', badge: 'bg-olive-50 text-olive-700', icon: CheckCircle2 },
  'ยกเลิก':         { bar: 'bg-sand-300',   badge: 'bg-sand-100 text-stone-500',     icon: XCircle,     },
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
  employees = [],          // ใช้ดึงชื่อเล่น — งานแจ้งซ่อมไม่ได้เก็บไว้
}) {
  /* ตัวเลขสรุปต้องนับตามช่วงวันที่ที่เลือก (แต่ไม่ตามแท็บสถานะ เพราะมันคือตัวแยกสถานะเอง) */
  const inRange = useMemo(
    () => filterByDate(repairRequests, repairFilterYear, repairFilterMonth, repairFilterDay),
    [repairRequests, repairFilterYear, repairFilterMonth, repairFilterDay],
  );
  const counts = {
    pending:    inRange.filter(r => r.status === 'รอดำเนินการ').length,
    inProgress: inRange.filter(r => r.status === 'กำลังดำเนินการ').length,
    done:       inRange.filter(r => r.status === 'ซ่อมเสร็จสิ้น').length,
    cancelled:  inRange.filter(r => r.status === 'ยกเลิก').length,
  };
  /* งานแจ้งซ่อมเก็บ empId เป็นรหัสพนักงาน (เช่น 1010093) ไม่ใช่ doc id */
  const empByCode = useMemo(() => new Map(employees.map((e) => [String(e.empId || ''), e])), [employees]);

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
    { value: 'ทั้งหมด',       label: 'ทั้งหมด',       count: inRange.length },
    { value: 'รอดำเนินการ',    label: 'รอดำเนินการ',    count: counts.pending    },
    { value: 'กำลังดำเนินการ', label: 'กำลังดำเนินการ', count: counts.inProgress },
    { value: 'ซ่อมเสร็จสิ้น',  label: 'ซ่อมเสร็จสิ้น',  count: counts.done       },
    { value: 'ยกเลิก',         label: 'ยกเลิก',         count: counts.cancelled  },
  ];

  return (
    <div className="bg-sand-50 h-full overflow-y-auto">

      {/* ══ Header ══════════════════════════════════════════ */}
      <div className="space-y-4 px-4 pt-4 lg:px-5 lg:pt-5">

        {/* หัวหน้า + ตัวกรองวันที่ */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[22px] font-medium tracking-tight text-stone-900">แจ้งซ่อม</h1>
            <p className="mt-1 text-sm text-stone-500">
              {currentRepairRequests.length} รายการในมุมมองนี้
            </p>
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
        <div className={`${CARD} grid grid-cols-2 sm:grid-cols-4 divide-x divide-stone-100`}>
          <StatCell label="รอดำเนินการ"    count={counts.pending}    dot="bg-ochre-600" />
          <StatCell label="กำลังดำเนินการ" count={counts.inProgress} dot="bg-clay-500"  />
          <StatCell label="ซ่อมเสร็จสิ้น"  count={counts.done}       dot="bg-olive-600" />
          <StatCell label="ยกเลิก"         count={counts.cancelled}  dot="bg-sand-300"  />
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
      <div className="px-4 py-4 lg:px-5 lg:pb-5">
        {currentRepairRequests.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-stone-200/70">
            <CheckCircle2 className="h-9 w-9 text-stone-300 mb-3" strokeWidth={2} />
            <p className="font-medium text-stone-500 text-sm">ไม่มีคิวงานในสถานะนี้</p>
            <p className="text-xs text-stone-400 mt-1">ลองเปลี่ยนตัวกรองด้านบน</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-stone-200/60 rounded-2xl overflow-hidden">
              <RepairRowHeader />
              {pagedRequests.map((req) => (
                <RepairRow
                  key={req.id}
                  req={req}
                  employee={empByCode.get(String(req.empId || ''))}
                  onUpdateStatus={handleUpdateRepairRequestStatus}
                  onDelete={handleDeleteRepairRequest}
                  canEdit={canEdit}
                />
              ))}
            </div>

            {/* Pagination */}
            {currentRepairRequests.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-3 mt-4">
                <p className="text-xs text-stone-500">
                  แสดง {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, currentRepairRequests.length)} จาก {currentRepairRequests.length} รายการ
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 text-xs font-medium text-stone-600 bg-white border border-stone-200/60 rounded-xl hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && p - arr[i - 1] > 1 && (
                          <span className="px-1 text-stone-400 text-xs">…</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[32px] px-2 py-1.5 text-xs font-medium rounded-xl transition ${
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
                    className="px-2.5 py-1.5 text-xs font-medium text-stone-600 bg-white border border-stone-200/60 rounded-xl hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

/* ─── แถวงานแจ้งซ่อม ───────────────────────────────────────
   ของเดิม: ข้อมูลกองซ้าย วันที่/สถานะ/ปุ่มชิดขวาแบบไม่มีคอลัมน์ แถวที่มีคะแนน
   หรือปุ่มลูกศรจึงเหลื่อมกับแถวที่ไม่มี · อวาตาร์ได้ "น" ทุกแถว (นาย/นาง/นางสาว)
   · ไม่มีชื่อเล่น · ปัญหายาว ๆ ดันแถวสูงไม่เท่ากัน

   ใหม่: คอลัมน์ตรงกันทุกแถว (ผู้แจ้ง / อุปกรณ์ + ปัญหา / วันที่ / สถานะ / คะแนน / ปุ่ม)
   สถานะ = ป้ายที่กดเปลี่ยนได้ · ปุ่มขั้นถัดไป (เริ่มซ่อม / ซ่อมเสร็จ) อยู่คอลัมน์ขวา
   แถบสีซ้ายเฉพาะงานที่ยังต้องทำ · ปัญหาแสดงบรรทัดเดียว กดที่แถวเพื่อดูเต็ม + ผลประเมิน
   ชื่อ + ชื่อเล่นดึงจากทะเบียนพนักงาน (งานแจ้งซ่อมไม่ได้เก็บชื่อเล่นไว้)        */
const ROW_GRID = 'md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_6rem_10rem_3.5rem_10.5rem] md:items-center md:gap-4';

function RepairRowHeader() {
  return (
    <div className={`hidden border-b border-stone-100 px-5 pb-2.5 pt-3.5 text-xs font-medium text-stone-400 ${ROW_GRID}`}>
      <span className="pl-11">ผู้แจ้ง</span>
      <span>อุปกรณ์ / ปัญหา</span>
      <span>วันที่แจ้ง</span>
      <span>สถานะ</span>
      <span>คะแนน</span>
      <span />
    </div>
  );
}

const NEXT_STEP = {
  'รอดำเนินการ':    { to: 'กำลังดำเนินการ', label: 'เริ่มซ่อม', icon: Play,
    cls: 'bg-clay-600 text-white hover:bg-clay-700' },
  'กำลังดำเนินการ': { to: 'ซ่อมเสร็จสิ้น', label: 'ซ่อมเสร็จ', icon: Check,
    cls: 'border border-stone-200/60 bg-white text-olive-700 hover:border-olive-200 hover:bg-olive-50' },
};

function RepairRow({ req, employee, onUpdateStatus, onDelete, canEdit }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS[req.status] ?? STATUS['รอดำเนินการ'];
  const StatusIcon = cfg.icon;
  const next = NEXT_STEP[req.status];
  const NextIcon = next?.icon;

  /* ชื่อจากทะเบียนก่อน (ไม่มีคำนำหน้า + สะท้อนการเปลี่ยนชื่อ) หาไม่เจอค่อยใช้ชื่อในงานแจ้งซ่อม */
  const name = employee?.fullName || stripTitle(req.empName) || '-';
  const nickname = employee?.nickname || '';
  const dept = employee?.department || req.department || '';
  const d = req.timestamp ? new Date(req.timestamp) : null;
  const hasDetails = !!(req.issue || req.evaluation);
  const toggle = () => { if (hasDetails) setExpanded((v) => !v); };
  const stop = (e) => e.stopPropagation();

  return (
    <div className={`relative border-t border-stone-100 transition-colors first:border-t-0 ${expanded ? 'bg-sand-50' : 'hover:bg-stone-50/60'}`}>
      {next && (
        <span className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${req.status === 'รอดำเนินการ' ? 'bg-ochre-500' : 'bg-clay-500'}`} aria-hidden />
      )}

      <div
        onClick={toggle}
        role={hasDetails ? 'button' : undefined}
        tabIndex={hasDetails ? 0 : undefined}
        aria-expanded={hasDetails ? expanded : undefined}
        onKeyDown={(e) => {
          if (hasDetails && (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); toggle(); }
        }}
        className={`relative px-5 py-3.5 ${ROW_GRID} ${hasDetails ? 'cursor-pointer' : ''}`}
      >
        {/* ── ผู้แจ้ง ── */}
        <div className="flex min-w-0 items-center gap-3 pr-10 md:pr-0">
          <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-clay-100 text-[13px] font-medium text-clay-700">
            {initialOf(name, nickname)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] text-stone-800" title={nickname ? `${name} (${nickname})` : name}>
              <span className="font-medium">{name}</span>
              {nickname && <span className="text-stone-400"> ({nickname})</span>}
            </p>
            <p className="mt-0.5 truncate text-xs text-stone-400">
              {[req.empId, dept].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {/* ── อุปกรณ์ + ปัญหา ── */}
        <div className="mt-2.5 min-w-0 pl-11 md:mt-0 md:pl-0">
          <p className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-stone-800">
            <Wrench className="size-3.5 shrink-0 text-stone-400" strokeWidth={2} />
            <span className="truncate">{req.assetName || '—'}</span>
          </p>
          {req.issue && (
            <p className={`mt-0.5 text-xs text-stone-500 ${expanded ? 'whitespace-pre-line break-words' : 'truncate'}`}
              title={expanded ? undefined : req.issue}>
              {req.issue}
            </p>
          )}
        </div>

        {/* ── วันที่ ── */}
        <div className="mt-2 pl-11 text-xs tabular-nums text-stone-500 md:mt-0 md:pl-0">
          {d ? (
            <>
              <span className="md:block">{formatDateShort(d)}</span>
              <span className="text-stone-400 md:block">
                <span className="md:hidden"> · </span>
                {String(d.getHours()).padStart(2, '0')}:{String(d.getMinutes()).padStart(2, '0')} น.
              </span>
            </>
          ) : '-'}
        </div>

        {/* ── สถานะ: ป้ายที่กดเปลี่ยนได้ ── */}
        <div className="mt-3 flex items-center gap-2 pl-11 md:mt-0 md:pl-0" onClick={stop}>
          {canEdit ? (
            <label className={`relative inline-flex max-w-full cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg py-1 pl-2 pr-6 text-xs font-medium ${cfg.badge}`}>
              <StatusIcon className="size-3.5 shrink-0" strokeWidth={2} />
              {req.status}
              <ChevronDown className="pointer-events-none absolute right-1.5 size-3 opacity-60" strokeWidth={2} />
              <select
                value={req.status}
                onChange={(e) => onUpdateStatus(req.id, e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="เปลี่ยนสถานะงานซ่อม"
              >
                <option value="รอดำเนินการ">รอดำเนินการ</option>
                <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                <option value="ซ่อมเสร็จสิ้น">ซ่อมเสร็จสิ้น</option>
                <option value="ยกเลิก">ยกเลิก</option>
              </select>
            </label>
          ) : (
            <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium ${cfg.badge}`}>
              <StatusIcon className="size-3.5" strokeWidth={2} /> {req.status}
            </span>
          )}
          {/* จอแคบ: คะแนนมาต่อท้ายสถานะ */}
          {req.evaluation && <Rating value={req.evaluation.overallRating} className="md:hidden" />}
        </div>

        {/* ── คะแนน ── */}
        <div className="hidden md:block">
          {req.evaluation ? <Rating value={req.evaluation.overallRating} /> : <span className="text-xs text-stone-300">—</span>}
        </div>

        {/* ── ปุ่ม: ขั้นถัดไป / ดูรายละเอียด / ลบ ── */}
        <div className="absolute right-4 top-3 flex items-center justify-end gap-1 md:static" onClick={stop}>
          {canEdit && next && (
            <button
              onClick={() => onUpdateStatus(req.id, next.to)}
              className={`mr-1 hidden items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors md:inline-flex ${next.cls}`}
            >
              <NextIcon className="size-3.5" strokeWidth={2} /> {next.label}
            </button>
          )}
          {hasDetails && (
            <button
              onClick={toggle}
              className="hidden size-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 md:flex"
              title={expanded ? 'ย่อ' : 'ดูรายละเอียด'} aria-label={expanded ? 'ย่อ' : 'ดูรายละเอียด'}
            >
              <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} strokeWidth={2} />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onDelete(req.id)}
              className="flex size-8 items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
              title="ลบ" aria-label="ลบงานแจ้งซ่อม"
            >
              <Trash2 className="size-4" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* จอแคบ: ปุ่มขั้นถัดไปอยู่แถวล่างสุด กดง่ายกว่า */}
        {canEdit && next && (
          <div className="mt-3 pl-11 md:hidden" onClick={stop}>
            <button
              onClick={() => onUpdateStatus(req.id, next.to)}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${next.cls}`}
            >
              <NextIcon className="size-3.5" strokeWidth={2} /> {next.label}
            </button>
          </div>
        )}
      </div>

      {/* ผลประเมินจากพนักงาน — ปัญหาเต็มแสดงในแถวแล้วตอนกางออก */}
      {expanded && req.evaluation && (
        <div className="px-5 pb-4 pl-16">
          <div className="max-w-md">
            <EvaluationDetail evaluation={req.evaluation} />
          </div>
        </div>
      )}
    </div>
  );
}

function Rating({ value, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg bg-ochre-50 px-2 py-1 text-xs font-medium tabular-nums text-ochre-700 ${className}`}>
      <Star className="size-3 fill-current" strokeWidth={2} />
      {Number(value || 0).toFixed(1)}
    </span>
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
          <span className="text-xs text-stone-600 font-medium">{it.label}</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={`h-2.5 w-2.5 ${n <= Number(it.value || 0) ? 'fill-clay-400 text-clay-400' : 'text-stone-200 fill-stone-100'}`}
                  strokeWidth={2}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-stone-700 tabular-nums w-3 text-right">
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
            <p className="text-xs text-stone-600 leading-relaxed italic">
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
    <div className="px-6 py-5 flex items-center gap-3">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div className="min-w-0">
        <p className={`${LABEL} truncate`}>{label}</p>
        <p className="mt-0.5 text-3xl font-medium text-stone-900 tabular-nums leading-none">{count}</p>
      </div>
    </div>
  );
}
