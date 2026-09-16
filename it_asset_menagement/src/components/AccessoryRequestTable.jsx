import React, { useState, useMemo, useEffect } from 'react';
import {
  Trash2, ClipboardList, CheckCircle2, XCircle, Clock,
  Package, Check, X, CalendarDays, RotateCcw, PlusCircle, Repeat, ImageIcon,
} from 'lucide-react';
import { BRAND } from '../ui/theme.js';
import { formatDateShort } from '../utils/formatDate.js';

/* ─── Status config ─────────────────────────────────────── */
const STATUS = {
  'รอดำเนินการ': { bar: 'bg-clay-400',   badge: 'bg-ochre-50 text-ochre-700 border-ochre-200',     icon: Clock },
  'อนุมัติแล้ว':  { bar: 'bg-olive-400', badge: 'bg-olive-50 text-olive-700 border-olive-200', icon: CheckCircle2 },
  'ปฏิเสธคำขอ':  { bar: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-700 border-rose-200',         icon: XCircle },
  'คืนแล้ว':     { bar: 'bg-stone-400',   badge: 'bg-stone-50 text-stone-700 border-stone-200',      icon: RotateCcw },
};

/* ─── Request type config ─── */
const REQUEST_TYPE = {
  pending: { label: 'รอ IT พิจารณา', icon: Clock,       color: '#64748B', bg: '#F1F5F9' },
  request: { label: 'เบิก / เพิ่ม',   icon: PlusCircle,  color: '#A65F3C', bg: '#EFF6FF' },
  // legacy aliases
  new:     { label: 'เบิก / เพิ่ม',   icon: PlusCircle,  color: '#A65F3C', bg: '#EFF6FF' },
  add:     { label: 'เบิก / เพิ่ม',   icon: PlusCircle,  color: '#A65F3C', bg: '#EFF6FF' },
  replace: { label: 'ขอเปลี่ยน',      icon: Repeat,      color: '#B45309', bg: '#FFFBEB' },
  borrow:  { label: 'ขอยืม',          icon: RotateCcw,   color: '#7C3AED', bg: '#F5F3FF' },
};

/* ─── Date helpers ───────────────────────────────────────── */
const TH_MONTHS = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const formatDate = (ts) => formatDateShort(ts);
const formatTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function AccessoryRequestTable({
  accessoryRequests = [],
  accessories = [],
  handleUpdateAccessoryRequestStatus,
  handleDeleteAccessoryRequest,
  canEdit,
}) {
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [typeFilter, setTypeFilter] = useState('ทั้งหมด');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, req: null, reason: '' });

  const filtered = useMemo(() => {
    return accessoryRequests.filter(r => {
      if (statusFilter !== 'ทั้งหมด' && r.status !== statusFilter) return false;
      if (typeFilter !== 'ทั้งหมด' && r.requestType !== typeFilter) return false;
      return true;
    });
  }, [accessoryRequests, statusFilter, typeFilter]);

  // 🆕 Pagination — 10 รายการ/หน้า
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { setCurrentPage(1); }, [statusFilter, typeFilter]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages, currentPage]);
  const pagedRequests = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const counts = useMemo(() => ({
    all: accessoryRequests.length,
    pending: accessoryRequests.filter(r => r.status === 'รอดำเนินการ').length,
    approved: accessoryRequests.filter(r => r.status === 'อนุมัติแล้ว').length,
    rejected: accessoryRequests.filter(r => r.status === 'ปฏิเสธคำขอ').length,
  }), [accessoryRequests]);

  const openRejectModal = (req) => setRejectModal({ open: true, req, reason: '' });
  const confirmReject = () => {
    if (rejectModal.req) {
      handleUpdateAccessoryRequestStatus(rejectModal.req, 'ปฏิเสธคำขอ', rejectModal.reason || '');
    }
    setRejectModal({ open: false, req: null, reason: '' });
  };

  return (
    <div className="bg-sand-50 h-full overflow-y-auto">
      <div className="mx-auto max-w-[1360px] space-y-6 p-6 lg:p-8">

      <div>
        <h1 className="text-[22px] font-medium tracking-tight text-stone-900">คำขออุปกรณ์เสริม</h1>
        <p className="mt-1 text-sm text-stone-500">{counts.all} รายการในระบบ</p>
      </div>

      {/* ── ชิปสรุป + ตัวกรอง ── */}
      <div className="flex flex-wrap items-center gap-2">
        <SummaryChip label="ทั้งหมด" value={counts.all} active={statusFilter === 'ทั้งหมด'}    onClick={() => setStatusFilter('ทั้งหมด')} />
        <SummaryChip label="รอดำเนินการ" value={counts.pending} color="var(--color-ochre-600)" active={statusFilter === 'รอดำเนินการ'} onClick={() => setStatusFilter('รอดำเนินการ')} />
        <SummaryChip label="อนุมัติแล้ว" value={counts.approved} color="var(--color-olive-600)" active={statusFilter === 'อนุมัติแล้ว'} onClick={() => setStatusFilter('อนุมัติแล้ว')} />
        <SummaryChip label="ปฏิเสธ" value={counts.rejected} color="var(--color-rose-500)" active={statusFilter === 'ปฏิเสธคำขอ'} onClick={() => setStatusFilter('ปฏิเสธคำขอ')} />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12.5px] text-stone-500 font-medium">ประเภท:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-clay-600/25"
          >
            <option value="ทั้งหมด">ทุกประเภท</option>
            <option value="pending">รอ IT พิจารณา</option>
            <option value="request">เบิก / เพิ่ม</option>
            <option value="replace">ขอเปลี่ยน</option>
            <option value="borrow">ขอยืม</option>
          </select>
        </div>
      </div>

      {/* ── List — Compact row layout ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/60 p-12 text-center">
          <ClipboardList className="h-10 w-10 text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-stone-500">ไม่มีคำขอ</p>
          <p className="text-[12.5px] text-stone-400 mt-1">รายการคำขออุปกรณ์เสริมจะปรากฏที่นี่</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-[0_1px_2px_rgba(74,43,41,0.04),0_10px_28px_-16px_rgba(74,43,41,0.12)] overflow-hidden">
          {pagedRequests.map((req, idx) => {
            const status = STATUS[req.status] || STATUS['รอดำเนินการ'];
            const reqType = REQUEST_TYPE[req.requestType] || REQUEST_TYPE.new;
            const TypeIcon = reqType.icon;
            const StatusIcon = status.icon;
            const isPending = req.status === 'รอดำเนินการ';
            const isExpanded = expandedId === req.id;
            const acc = accessories.find(a => a.id === req.accessoryId);
            const hasDetails = req.reason || req.damagePhoto || req.rejectReason ||
              (req.requestType === 'replace' && req.oldAccessoryName) ||
              (req.requestType === 'borrow' && req.returnDate);

            return (
              <div
                key={req.id}
                className={`${idx > 0 ? 'border-t border-stone-100' : ''} transition-colors ${isExpanded ? 'bg-sand-50' : 'hover:bg-stone-50/40'}`}
              >
                {/* Compact row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Status bar (vertical) */}
                  <div className={`w-1 h-10 rounded-full ${status.bar} shrink-0`} />

                  {/* Item image */}
                  {acc?.image ? (
                    <img src={acc.image} alt="" className="w-10 h-10 rounded-lg object-contain border border-stone-200 shrink-0 bg-stone-50 p-1" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
                      <Package className="h-4 w-4 text-stone-400" strokeWidth={2} />
                    </div>
                  )}

                  {/* Main info — flex column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13.5px] font-medium text-stone-800 truncate">
                        {req.empName}
                        {req.nickname && <span className="text-stone-500 font-medium ml-1">({req.nickname})</span>}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">#{req.id?.slice(-6)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[12px] text-stone-600 truncate">
                        {req.accessoryName}
                        <span className="text-stone-400 ml-1">× {req.quantity || 1}</span>
                      </span>
                      <span className="text-[11px] text-stone-400">·</span>
                      <span className="text-[11px] text-stone-400">
                        {formatDate(req.timestamp)} {formatTime(req.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Type badge */}
                  <span
                    className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0"
                    style={{ background: reqType.bg, color: reqType.color }}
                  >
                    <TypeIcon className="h-3 w-3" strokeWidth={2.4} />
                    {reqType.label}
                  </span>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${status.badge} shrink-0`}>
                    <StatusIcon className="h-3 w-3" strokeWidth={2.4} />
                    <span className="hidden sm:inline">{req.status}</span>
                  </span>

                  {/* Expand chevron (if has details) */}
                  {hasDetails && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-100 rounded-lg transition shrink-0"
                      title={isExpanded ? 'ย่อ' : 'ดูรายละเอียด'}
                    >
                      <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPending && canEdit ? (
                      <>
                        <button
                          onClick={() => handleUpdateAccessoryRequestStatus(req, 'อนุมัติแล้ว', '', { requestType: 'request' })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-olive-600 hover:bg-olive-700 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                          <span className="hidden sm:inline">อนุมัติ</span>
                        </button>
                        <button
                          onClick={() => openRejectModal(req)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                          <span className="hidden sm:inline">ปฏิเสธ</span>
                        </button>
                      </>
                    ) : !isPending && canEdit ? (
                      <button
                        onClick={() => handleDeleteAccessoryRequest(req.id)}
                        className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="ลบรายการ"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && hasDetails && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t border-stone-100 bg-stone-50/40">
                    {req.requestType === 'replace' && req.oldAccessoryName && (
                      <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                        <p className="text-[11px] font-semibold text-stone-500 mb-0.5">ของเดิมที่ต้องการเปลี่ยน</p>
                        <p className="text-[12.5px] font-semibold text-stone-800">
                          {req.oldAccessoryName}
                          {req.oldAccessoryModel && <span className="text-stone-500 font-normal ml-1">(รุ่น: {req.oldAccessoryModel})</span>}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11.5px] text-stone-500">
                          {req.oldPurchaseDate && <span>ซื้อ: {req.oldPurchaseDate}</span>}
                          {req.oldAge && <span>อายุ: {req.oldAge}</span>}
                          {req.oldWarranty && <span>{req.oldWarranty}</span>}
                        </div>
                      </div>
                    )}
                    {req.reason && (
                      <p className="text-[12.5px] text-stone-700">
                        <span className="font-semibold text-stone-500">เหตุผล:</span> {req.reason}
                      </p>
                    )}
                    {req.requestType === 'borrow' && req.returnDate && (
                      <div className="inline-flex items-center gap-1.5 text-[12px] text-stone-700 bg-white px-2 py-1 rounded-lg border border-stone-200">
                        <CalendarDays className="h-3 w-3" strokeWidth={2.2} />
                        กำหนดคืน: <span className="font-semibold">{req.returnDate}</span>
                      </div>
                    )}
                    {req.damagePhoto && (
                      <button
                        onClick={() => setPreviewPhoto(req.damagePhoto)}
                        className="inline-flex items-center gap-1.5 text-[12px] text-stone-700 hover:text-clay-600 bg-white hover:bg-stone-50 px-2 py-1 rounded-lg border border-stone-200 transition-colors"
                      >
                        <ImageIcon className="h-3 w-3" strokeWidth={2.2} />
                        ดูรูปอุปกรณ์ที่ชำรุด
                      </button>
                    )}
                    {req.status === 'ปฏิเสธคำขอ' && req.rejectReason && (
                      <p className="text-[12px] text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                        <span className="font-semibold">เหตุผลปฏิเสธ:</span> {req.rejectReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[12px] text-stone-500">
            แสดง {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
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

      {/* ── Photo preview modal ── */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-stone-950/50 z-[95] flex items-center justify-center p-6"
          onClick={() => setPreviewPhoto(null)}
        >
          <img src={previewPhoto} alt="damage" className="max-w-full max-h-full rounded-xl" />
          <button
            onClick={() => setPreviewPhoto(null)}
            className="fixed top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
          >
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
      )}


      {/* ── Reject reason modal ── */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-stone-950/50 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(74,43,41,0.20)] max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100">
              <h3 className="text-[16px] font-medium text-stone-800">เหตุผลในการปฏิเสธคำขอ</h3>
              <p className="text-[12.5px] text-stone-500 mt-0.5">{rejectModal.req?.empName} · {rejectModal.req?.accessoryName}</p>
            </div>
            <div className="px-6 py-5">
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(m => ({ ...m, reason: e.target.value }))}
                rows={4}
                autoFocus
                placeholder="เช่น: เพิ่งเปลี่ยนเมื่อ 2 สัปดาห์ที่แล้ว / ยังมีของเก่าอยู่ในสต็อก"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-stone-100 bg-sand-50 flex justify-end gap-2.5">
              <button
                onClick={() => setRejectModal({ open: false, req: null, reason: '' })}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-brick-600 hover:bg-brick-700"
              >
                ยืนยันปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function SummaryChip({ label, value, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
        active
          ? 'bg-clay-600 text-white shadow-sm'
          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
      }`}
    >
      <span>{label}</span>
      <span
        className="px-1.5 py-0.5 rounded text-[11px] tabular-nums font-medium"
        style={
          active
            ? { background: 'rgba(255,255,255,0.18)' }
            : color ? { background: `${color}15`, color } : { background: '#F1F5F9', color: '#64748B' }
        }
      >
        {value}
      </span>
    </button>
  );
}
