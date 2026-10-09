import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Check, CheckCircle2, ChevronDown, ClipboardList, Clock, ImageIcon, Package, PlusCircle, Repeat, RotateCcw, Trash2, X, XCircle } from 'lucide-react';
import { BRAND } from '../ui/theme.js';
import { formatDateShort } from '../utils/formatDate.js';

/* ─── Status config ─────────────────────────────────────── */
const STATUS = {
  'รอดำเนินการ': { bar: 'bg-ochre-600/70',   badge: 'bg-ochre-50 text-ochre-700',     icon: Clock },
  'อนุมัติแล้ว':  { bar: 'bg-olive-600/70', badge: 'bg-olive-50 text-olive-700', icon: CheckCircle2 },
  'ปฏิเสธคำขอ':  { bar: 'bg-brick-600/70',    badge: 'bg-rose-50 text-rose-700',         icon: XCircle },
  'คืนแล้ว':     { bar: 'bg-stone-500/60',   badge: 'bg-sand-100 text-stone-600',      icon: RotateCcw },
};

/* ─── Request type config ─── */
const REQUEST_TYPE = {
  pending: { label: 'รอ IT พิจารณา', icon: Clock,       color: '#64757D', bg: '#F2F2F2' },
  request: { label: 'เบิก',   icon: PlusCircle,  color: '#2B6777', bg: '#DFEAEF' },
  // legacy aliases
  new:     { label: 'เบิก',   icon: PlusCircle,  color: '#2B6777', bg: '#DFEAEF' },
  add:     { label: 'เบิก',   icon: PlusCircle,  color: '#2B6777', bg: '#DFEAEF' },
  replace: { label: 'ขอเปลี่ยน',      icon: Repeat,      color: '#A87A2C', bg: '#FBF4E6' },
  borrow:  { label: 'ยืม',          icon: RotateCcw,   color: '#225462', bg: '#DFEAEF' },
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
      // "เบิก" รวมค่าเก่าทั้งหมด (new จากฟอร์มพนักงาน · request/add จากการอนุมัติ/ข้อมูลเดิม)
      const typeKey = ['new', 'add', 'request'].includes(r.requestType) ? 'request' : r.requestType;
      if (typeFilter !== 'ทั้งหมด' && typeKey !== typeFilter) return false;
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
      <div className="space-y-4 p-4 lg:p-5">

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
          <span className="text-xs text-stone-500 font-medium">ประเภท:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-stone-200/60 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-clay-600/25"
          >
            <option value="ทั้งหมด">ทุกประเภท</option>
            <option value="pending">รอ IT พิจารณา</option>
            <option value="request">เบิก</option>
            <option value="borrow">ยืม</option>
            <option value="replace">ขอเปลี่ยน</option>
          </select>
        </div>
      </div>

      {/* ── ตาราง — แบ่งคอลัมน์เต็มความกว้าง (เดิมชื่อชิดซ้าย ป้าย/ปุ่มชิดขวา ตรงกลางโล่ง)
          ใช้ <table> จริง: คอลัมน์สั้นกว้างตามเนื้อหา · "เหตุผล" กินที่ที่เหลือ · จอแคบเลื่อนแนวนอน */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/60 p-12 text-center">
          <ClipboardList className="h-10 w-10 text-stone-300 mx-auto mb-3" strokeWidth={2} />
          <p className="text-sm font-medium text-stone-500">ไม่มีคำขอ</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="text-left text-xs font-medium text-stone-400">
                <th className="py-3 pl-5 pr-4 font-medium">อุปกรณ์</th>
                <th className="py-3 pr-4 font-medium">ผู้ขอ</th>
                <th className="py-3 pr-4 font-medium">ประเภท</th>
                <th className="py-3 pr-4 font-medium w-full">เหตุผล</th>
                <th className="py-3 pr-4 font-medium">วันที่ขอ</th>
                <th className="py-3 pr-4 font-medium">สถานะ</th>
                <th className="py-3 pr-5 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pagedRequests.map((req) => {
                const status = STATUS[req.status] || STATUS['รอดำเนินการ'];
                const reqType = REQUEST_TYPE[req.requestType] || REQUEST_TYPE.new;
                const TypeIcon = reqType.icon;
                const StatusIcon = status.icon;
                const isPending = req.status === 'รอดำเนินการ';
                const isExpanded = expandedId === req.id;
                const acc = accessories.find(a => a.id === req.accessoryId);
                // เหตุผล/วันคืน/เหตุผลปฏิเสธ อยู่ในแถวแล้ว — ปุ่มขยายเหลือไว้สำหรับรายละเอียดเสริมเท่านั้น
                const hasExtra = !!req.damagePhoto || (req.requestType === 'replace' && !!req.oldAccessoryName);

                return (
                  <React.Fragment key={req.id}>
                    <tr className={`border-t border-stone-100 align-middle transition-colors ${isExpanded ? 'bg-sand-50' : 'hover:bg-sand-50/60'}`}>

                      {/* อุปกรณ์ */}
                      <td className="py-3.5 pl-5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-10 rounded-full ${status.bar} shrink-0`} />
                          {acc?.image ? (
                            <img src={acc.image} alt="" className="w-10 h-10 rounded-lg object-contain border border-stone-200 shrink-0 bg-white p-1" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-sand-100 flex items-center justify-center shrink-0 border border-stone-200">
                              <Package className="h-4 w-4 text-stone-400" strokeWidth={2} />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[220px]">
                            <p className="truncate text-[13px] font-medium text-stone-800" title={req.accessoryName}>{req.accessoryName}</p>
                            <p className="text-[11px] text-stone-400 tabular-nums whitespace-nowrap">× {req.quantity || 1} · #{req.id?.slice(-6)}</p>
                          </div>
                        </div>
                      </td>

                      {/* ผู้ขอ */}
                      <td className="py-3.5 pr-4">
                        <div className="max-w-[220px]">
                          <p className="truncate text-[13px] text-stone-800" title={req.empName}>
                            {req.empName}{req.nickname && <span className="text-stone-500"> ({req.nickname})</span>}
                          </p>
                          {req.department && <p className="truncate text-[11px] text-stone-400">{req.department}</p>}
                        </div>
                      </td>

                      {/* ประเภท (+ วันคืนถ้ายืม) */}
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium" style={{ background: reqType.bg, color: reqType.color }}>
                          <TypeIcon className="h-3 w-3" strokeWidth={2} /> {reqType.label}
                        </span>
                        {req.requestType === 'borrow' && req.returnDate && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-500">
                            <CalendarDays className="h-3 w-3" strokeWidth={2} /> คืน {formatDate(req.returnDate)}
                          </p>
                        )}
                      </td>

                      {/* เหตุผล — กินที่ที่เหลือ */}
                      <td className="py-3.5 pr-4 min-w-[180px]">
                        {req.reason
                          ? <p className="line-clamp-2 text-[13px] text-stone-600" title={req.reason}>{req.reason}</p>
                          : <span className="text-[13px] text-stone-300">—</span>}
                        {req.status === 'ปฏิเสธคำขอ' && req.rejectReason && (
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-rose-700" title={req.rejectReason}>ปฏิเสธ: {req.rejectReason}</p>
                        )}
                      </td>

                      {/* วันที่ขอ */}
                      <td className="py-3.5 pr-4 whitespace-nowrap text-[13px] tabular-nums text-stone-600">
                        {formatDate(req.timestamp)}
                        <p className="text-[11px] text-stone-400">{formatTime(req.timestamp)}</p>
                      </td>

                      {/* สถานะ */}
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${status.badge}`}>
                          <StatusIcon className="h-3 w-3" strokeWidth={2} /> {req.status}
                        </span>
                      </td>

                      {/* จัดการ */}
                      <td className="py-3.5 pr-5">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {hasExtra && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : req.id)}
                              className="w-7 h-7 flex items-center justify-center text-stone-400 hover:bg-stone-100 rounded-lg transition"
                              title={isExpanded ? 'ย่อ' : 'ดูรายละเอียดเพิ่ม'}
                              aria-expanded={isExpanded}
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={2} />
                            </button>
                          )}
                          {isPending && canEdit ? (
                            <>
                              <button
                                /* คงประเภทที่พนักงานเลือก — ยืมต้องส่งวันคืนต่อ ไม่งั้นอนุมัติแล้วกลายเป็นเบิกถาวร */
                                onClick={() => handleUpdateAccessoryRequestStatus(req, 'อนุมัติแล้ว', '',
                                  req.requestType === 'borrow'
                                    ? { requestType: 'borrow', returnDate: req.returnDate || null }
                                    : { requestType: 'request' })}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-olive-600 hover:bg-olive-700 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" strokeWidth={2} /> อนุมัติ
                              </button>
                              <button
                                onClick={() => openRejectModal(req)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-300 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" strokeWidth={2} /> ปฏิเสธ
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
                      </td>
                    </tr>

                    {/* รายละเอียดเสริม (ของเก่าที่ขอเปลี่ยน / รูปชำรุด) */}
                    {isExpanded && hasExtra && (
                      <tr className="bg-sand-50">
                        <td colSpan={7} className="px-5 pb-4 pl-[4.75rem]">
                          <div className="flex flex-wrap items-start gap-2">
                            {req.requestType === 'replace' && req.oldAccessoryName && (
                              <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                                <p className="text-[11px] font-medium text-stone-500 mb-0.5">ของเดิมที่ต้องการเปลี่ยน</p>
                                <p className="text-xs font-medium text-stone-800">
                                  {req.oldAccessoryName}
                                  {req.oldAccessoryModel && <span className="text-stone-500 font-normal ml-1">(รุ่น: {req.oldAccessoryModel})</span>}
                                </p>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-stone-500">
                                  {req.oldPurchaseDate && <span>ซื้อ: {req.oldPurchaseDate}</span>}
                                  {req.oldAge && <span>อายุ: {req.oldAge}</span>}
                                  {req.oldWarranty && <span>{req.oldWarranty}</span>}
                                </div>
                              </div>
                            )}
                            {req.damagePhoto && (
                              <button
                                onClick={() => setPreviewPhoto(req.damagePhoto)}
                                className="inline-flex items-center gap-1.5 text-xs text-stone-700 hover:text-clay-600 bg-white hover:bg-stone-50 px-2 py-1 rounded-lg border border-stone-200 transition-colors"
                              >
                                <ImageIcon className="h-3 w-3" strokeWidth={2} /> ดูรูปอุปกรณ์ที่ชำรุด
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-stone-500">
            แสดง {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
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
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      )}


      {/* ── Reject reason modal ── */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-stone-950/50 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(22,32,36,0.20)] max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100">
              <h3 className="text-[15px] font-medium text-stone-800">เหตุผลในการปฏิเสธคำขอ</h3>
              <p className="text-xs text-stone-500 mt-0.5">{rejectModal.req?.empName} · {rejectModal.req?.accessoryName}</p>
            </div>
            <div className="px-6 py-5">
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(m => ({ ...m, reason: e.target.value }))}
                rows={4}
                autoFocus
                placeholder="เช่น: เพิ่งเปลี่ยนเมื่อ 2 สัปดาห์ที่แล้ว / ยังมีของเก่าอยู่ในสต็อก"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 resize-none"
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
            : color ? { background: `${color}15`, color } : { background: '#F2F2F2', color: '#64757D' }
        }
      >
        {value}
      </span>
    </button>
  );
}
