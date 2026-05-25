import React, { useState } from 'react';
import { User, ArrowRight, ArrowLeft, Calendar, Camera, AlertTriangle, CheckCircle2, X, Clock, Pencil, Trash2, Save } from 'lucide-react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import ConditionCapture, {
  CHECKLIST_FIELDS, FIELD_STATUS_LABELS, EMPTY_FIELDS, flattenFields,
} from './ConditionCapture.jsx';

// helper: คืน label ของสถานะตามฟิลด์ (ถ้าไม่รู้จัก field ใช้ default)
const labelOf = (fieldKey, value) =>
  (FIELD_STATUS_LABELS[fieldKey] || FIELD_STATUS_LABELS.body)[value] || value;

const STATUS_COLOR = {
  normal:  'text-emerald-700 bg-emerald-50 ring-emerald-200',
  scratch: 'text-amber-700 bg-amber-50 ring-amber-200',
  broken:  'text-rose-700 bg-rose-50 ring-rose-200',
};

/* ── format duration as "X ปี Y เดือน Z วัน" (Thai friendly) ── */
function formatDuration(fromTs, toTs) {
  if (!fromTs) return '';
  const ms = (toTs || Date.now()) - fromTs;
  if (ms < 0) return '';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return hours <= 0 ? 'ไม่กี่นาที' : `${hours} ชั่วโมง`;
  }
  if (days < 30) return `${days} วัน`;
  const years  = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remDays = (days % 365) % 30;
  const parts = [];
  if (years)  parts.push(`${years} ปี`);
  if (months) parts.push(`${months} เดือน`);
  if (remDays && !years) parts.push(`${remDays} วัน`); // skip days when ≥ 1 year for compactness
  return parts.join(' ') || `${days} วัน`;
}

/* ── tx collection name from category ── */
const txCollectionOf = (category) =>
  category === 'accessories' ? 'accessories_transactions'
  : category === 'licenses' ? 'licenses_transactions'
  : 'assets_transactions';

/**
 * OwnershipHistory — แสดงประวัติการครอบครองทรัพย์สิน
 *
 * Props:
 * - assetId: string
 * - transactions: array of all transactions
 * - currentHolder: { empName } | null  (current assignee, optional)
 */
export default function OwnershipHistory({ assetId, transactions = [], currentHolder = null }) {
  const [viewerImage, setViewerImage] = useState(null);
  const [editPeriod, setEditPeriod] = useState(null);
  const [deletePeriod, setDeletePeriod] = useState(null);

  // กรอง transactions ของ asset นี้ เรียงใหม่ → เก่า
  const relevant = transactions
    .filter(t => t.assetId === assetId)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // จับคู่ checkout-return เป็น "ช่วงครอบครอง"
  const periods = [];
  const checkouts = relevant.filter(t => t.action === 'เบิกจ่าย');
  const returns   = relevant.filter(t => t.action === 'รับคืน');

  checkouts.forEach(co => {
    // หา return ที่ match (โดย checkoutId ถ้ามี, หรือ empId+timestamp หลัง checkout)
    const matchedReturn = returns.find(r =>
      (co.checkoutId && r.checkoutId === co.checkoutId) ||
      (!co.checkoutId && r.empId === co.empId && r.timestamp > co.timestamp)
    );
    periods.push({ checkout: co, return: matchedReturn });
  });

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <User className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">ยังไม่เคยส่งมอบให้พนักงานคนใด</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {periods.map((p, i) => {
          const isCurrent = !p.return;
          return (
            <PeriodCard
              key={p.checkout.id || i}
              period={p}
              isCurrent={isCurrent}
              onPhotoClick={setViewerImage}
              onEdit={() => setEditPeriod(p)}
              onDelete={() => setDeletePeriod(p)}
            />
          );
        })}
      </div>

      {/* Image viewer modal */}
      {viewerImage && (
        <div
          onClick={() => setViewerImage(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <button
            onClick={() => setViewerImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          <img
            src={viewerImage}
            alt="preview"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {/* Edit modal */}
      {editPeriod && (
        <EditPeriodModal
          period={editPeriod}
          onClose={() => setEditPeriod(null)}
        />
      )}

      {/* Delete confirm */}
      {deletePeriod && (
        <DeletePeriodConfirm
          period={deletePeriod}
          onClose={() => setDeletePeriod(null)}
        />
      )}
    </>
  );
}

/* ── Period Card ── */
function PeriodCard({ period, isCurrent, onPhotoClick, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const { checkout, return: ret } = period;

  const fmt = (ts) => ts ? new Date(ts).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const duration = formatDuration(checkout.timestamp, ret?.timestamp);

  // เช็คความเสียหาย: เทียบ checkout vs return checklist
  const damages = [];
  if (ret?.returnChecklist && checkout?.checkoutChecklist) {
    CHECKLIST_FIELDS.forEach(f => {
      const before = checkout.checkoutChecklist[f.key] || 'normal';
      const after  = ret.returnChecklist[f.key] || 'normal';
      const severity = { normal: 0, scratch: 1, broken: 2 };
      if (severity[after] > severity[before]) {
        damages.push({ field: f.label, fieldKey: f.key, before, after });
      }
    });
  }

  return (
    <div className={`rounded-xl ring-1 ring-inset overflow-hidden ${
      isCurrent ? 'ring-[#1E487A]/30 bg-blue-50/40' : damages.length > 0 ? 'ring-rose-200 bg-rose-50/30' : 'ring-slate-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isCurrent ? 'bg-[#1E487A] text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            <User className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-slate-800 truncate flex items-center gap-1.5 flex-wrap">
              {checkout.empName || '-'}
              {isCurrent && <span className="text-[11px] font-semibold text-[#1E487A] bg-[#1E487A]/10 px-1.5 py-0.5 rounded">ปัจจุบัน</span>}
            </p>
            {/* Date range */}
            <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Calendar className="h-3 w-3" strokeWidth={2} />
              <span>{fmt(checkout.timestamp)}</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className={ret ? '' : 'text-[#1E487A] font-semibold'}>
                {ret ? fmt(ret.timestamp) : 'ปัจจุบัน'}
              </span>
            </p>
            {/* Duration badge — NEW */}
            {duration && (
              <p className="text-[12px] mt-1 flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ring-1 ring-inset ${
                  isCurrent
                    ? 'bg-[#1E487A]/8 text-[#1E487A] ring-[#1E487A]/20'
                    : 'bg-slate-50 text-slate-700 ring-slate-200'
                }`}>
                  <Clock className="h-3 w-3" strokeWidth={2.4} />
                  {isCurrent ? 'ครอบครองมาแล้ว' : 'ระยะเวลาใช้งาน'} {duration}
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {damages.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200">
              <AlertTriangle className="h-3 w-3" strokeWidth={2.4} /> เสียหาย {damages.length} จุด
            </span>
          )}
          {!damages.length && ret && (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} /> คืนปกติ
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[12px] font-semibold text-[#1E487A] hover:underline shrink-0 px-1"
          >
            {expanded ? 'ย่อ' : 'รายละเอียด'}
          </button>
          {/* Edit / Delete buttons — NEW */}
          <button
            onClick={onEdit}
            title="แก้ไขวันที่ / หมายเหตุ"
            className="w-7 h-7 flex items-center justify-center rounded-md text-amber-600 hover:bg-amber-50 hover:text-amber-700 ring-1 ring-inset ring-slate-200 hover:ring-amber-300 bg-white transition"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            onClick={onDelete}
            title="ลบประวัติช่วงนี้"
            className="w-7 h-7 flex items-center justify-center rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-600 ring-1 ring-inset ring-slate-200 hover:ring-rose-300 bg-white transition"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-slate-200 p-4 space-y-4 bg-white">
          {/* Checkout snapshot */}
          <ConditionSnapshot
            label="ตอนส่งมอบ"
            Icon={ArrowRight}
            color="blue"
            fields={checkout.checkoutFields}
            photos={checkout.checkoutPhotos}
            checklist={checkout.checkoutChecklist}
            notes={checkout.checkoutNotes}
            onPhotoClick={onPhotoClick}
          />

          {/* Return snapshot (if returned) */}
          {ret && (
            <ConditionSnapshot
              label="ตอนรับคืน"
              Icon={ArrowLeft}
              color={damages.length > 0 ? 'rose' : 'emerald'}
              fields={ret.returnFields}
              photos={ret.returnPhotos}
              checklist={ret.returnChecklist}
              notes={ret.returnNotes}
              onPhotoClick={onPhotoClick}
            />
          )}

          {/* Damage summary */}
          {damages.length > 0 && (
            <div className="rounded-lg bg-rose-50 ring-1 ring-rose-200 p-3">
              <p className="text-[13px] font-bold text-rose-800 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                ความเสียหายที่พบเทียบกับตอนส่งมอบ
              </p>
              <ul className="space-y-1">
                {damages.map((d, i) => (
                  <li key={i} className="text-[12.5px] text-rose-700">
                    • <span className="font-semibold">{d.field}:</span> {labelOf(d.fieldKey, d.before)} → {labelOf(d.fieldKey, d.after)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Snapshot of one event (checkout or return) ── */
function ConditionSnapshot({ label, Icon, color, fields, photos = [], checklist = {}, notes, onPhotoClick }) {
  const colorCls = {
    blue:    'text-blue-700 bg-blue-50 ring-blue-200',
    emerald: 'text-emerald-700 bg-emerald-50 ring-emerald-200',
    rose:    'text-rose-700 bg-rose-50 ring-rose-200',
  }[color];

  // Detect new per-field shape; fall back to flat photos+checklist
  const hasFields = fields && typeof fields === 'object' && Object.keys(fields).length > 0;
  const totalFieldPhotos = hasFields
    ? CHECKLIST_FIELDS.reduce((n, f) => n + ((fields[f.key]?.photos || []).length), 0)
    : 0;

  const hasFlatPhotos = Array.isArray(photos) && photos.length > 0;
  const hasChecklist = checklist && Object.keys(checklist).length > 0;

  return (
    <div>
      <p className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 py-1 rounded-full ring-1 ring-inset mb-2 ${colorCls}`}>
        <Icon className="h-3 w-3" strokeWidth={2.4} />
        {label}
      </p>

      {/* NEW shape: photos grouped per field */}
      {hasFields ? (
        (() => {
          const fieldsWithPhotos    = CHECKLIST_FIELDS.filter(f => (fields[f.key]?.photos || []).length > 0);
          const fieldsWithoutPhotos = CHECKLIST_FIELDS.filter(f => !(fields[f.key]?.photos || []).length);

          if (totalFieldPhotos === 0) {
            // No photos at all → just the compact status pill row
            return (
              <div className="mb-3">
                <p className="text-[11.5px] text-slate-400 italic mb-2 flex items-center gap-1">
                  <Camera className="h-3 w-3" /> ไม่ได้แนบรูปใดๆ — แสดงเฉพาะสถานะ
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {fieldsWithoutPhotos.map(f => {
                    const v = fields[f.key]?.status || 'normal';
                    return (
                      <span
                        key={f.key}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${STATUS_COLOR[v]}`}
                      >
                        <span className="text-slate-700/70 mr-1">{f.label}:</span>
                        <span className="font-semibold">{labelOf(f.key, v)}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-3 mb-3">
              {/* ── Photo cards (2-col grid) ── */}
              {fieldsWithPhotos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fieldsWithPhotos.map(f => {
                    const cell = fields[f.key];
                    const v = cell.status || 'normal';
                    return (
                      <div
                        key={f.key}
                        className="flex gap-2.5 rounded-lg bg-white ring-1 ring-slate-200 p-2 hover:ring-[#1E487A]/30 hover:shadow-sm transition-all"
                      >
                        {/* Photo strip on left */}
                        <div className="flex gap-1 shrink-0">
                          {cell.photos.slice(0, 2).map((src, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => onPhotoClick(src)}
                              className="w-14 h-14 rounded-md overflow-hidden ring-1 ring-slate-200 hover:ring-[#1E487A] transition shrink-0 bg-slate-50"
                            >
                              <img src={src} alt={`${f.label}-${i}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                          {cell.photos.length > 2 && (
                            <button
                              type="button"
                              onClick={() => onPhotoClick(cell.photos[2])}
                              className="w-14 h-14 rounded-md ring-1 ring-slate-200 bg-slate-50 text-[10.5px] font-semibold text-slate-500 hover:ring-[#1E487A] hover:text-[#1E487A] transition flex items-center justify-center shrink-0"
                            >
                              +{cell.photos.length - 2}
                            </button>
                          )}
                        </div>
                        {/* Label + status on right */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <p className="text-[12.5px] font-semibold text-slate-800 leading-snug line-clamp-2" title={f.label}>
                            {f.label}
                          </p>
                          <span className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${STATUS_COLOR[v]}`}>
                            {labelOf(f.key, v)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Compact pills for fields without photos ── */}
              {fieldsWithoutPhotos.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.06em] mb-1.5 flex items-center gap-1">
                    <Camera className="h-3 w-3 opacity-60" /> จุดที่ไม่ได้แนบรูป
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {fieldsWithoutPhotos.map(f => {
                      const v = fields[f.key]?.status || 'normal';
                      return (
                        <span
                          key={f.key}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${STATUS_COLOR[v]}`}
                        >
                          <span className="text-slate-600 mr-1">{f.label}:</span>
                          <span className="font-semibold">{labelOf(f.key, v)}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <>
          {/* LEGACY shape: flat photos grid */}
          {hasFlatPhotos ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-3">
              {photos.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onPhotoClick(src)}
                  className="aspect-square rounded-md overflow-hidden ring-1 ring-slate-200 hover:ring-[#1E487A] transition"
                >
                  <img src={src} alt={`p-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-slate-400 italic mb-3 flex items-center gap-1">
              <Camera className="h-3 w-3" /> ไม่ได้บันทึกรูป
            </p>
          )}

          {/* Checklist mini badges (legacy only — new shape shows status inline above) */}
          {hasChecklist && (
            <div className="flex flex-wrap gap-1 mb-2">
              {CHECKLIST_FIELDS.map(f => {
                const v = checklist[f.key] || 'normal';
                return (
                  <span
                    key={f.key}
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded ring-1 ring-inset ${STATUS_COLOR[v]}`}
                  >
                    {f.label}: {labelOf(f.key, v)}
                  </span>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Notes */}
      {notes && (
        <p className="text-[12.5px] text-slate-600 bg-slate-50 ring-1 ring-slate-200 rounded px-2 py-1.5 mt-1">
          💬 {notes}
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Edit Period Modal — แก้ไขทุกอย่าง: วันที่/หมายเหตุ/สถานะรายจุด/
   รูปต่อหัวข้อ/ชื่อพนักงาน — ทั้ง checkout และ return
   ════════════════════════════════════════════════════════════════ */
function EditPeriodModal({ period, onClose }) {
  const { checkout, return: ret } = period;
  const toInputDate = (ts) => ts ? new Date(ts).toISOString().slice(0, 16) : '';

  // ── Build fields prop: prefer new shape, fall back to legacy checklist (no photos) ──
  const buildFieldsFromLegacy = (checklist) => {
    if (!checklist) return EMPTY_FIELDS;
    const out = {};
    CHECKLIST_FIELDS.forEach(f => {
      out[f.key] = { status: checklist[f.key] || 'normal', photos: [] };
    });
    return out;
  };

  // ── Active tab inside the modal ──
  const [activeTab, setActiveTab] = useState('checkout'); // 'checkout' | 'return'

  // ── Common fields ──
  const [empName, setEmpName] = useState(checkout.empName || '');

  // ── Checkout state ──
  const [checkoutDate,   setCheckoutDate]   = useState(toInputDate(checkout.timestamp));
  const [checkoutNotes,  setCheckoutNotes]  = useState(checkout.checkoutNotes || '');
  const [checkoutFields, setCheckoutFields] = useState(() =>
    checkout.checkoutFields || buildFieldsFromLegacy(checkout.checkoutChecklist)
  );

  // ── Return state (may be null) ──
  const [returnDate,   setReturnDate]   = useState(toInputDate(ret?.timestamp));
  const [returnNotes,  setReturnNotes]  = useState(ret?.returnNotes || '');
  const [returnFields, setReturnFields] = useState(() =>
    ret ? (ret.returnFields || buildFieldsFromLegacy(ret.returnChecklist)) : EMPTY_FIELDS
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      // ─── Update checkout ───
      const coCol = txCollectionOf(checkout.category);
      const coFlat = flattenFields(checkoutFields);
      const coUpdates = {
        timestamp:         new Date(checkoutDate).getTime(),
        empName:           empName,
        checkoutNotes:     checkoutNotes,
        checkoutFields:    checkoutFields,
        checkoutPhotos:    coFlat.photos,
        checkoutChecklist: coFlat.checklist,
      };
      await updateDoc(doc(db, coCol, checkout.id), coUpdates);

      // ─── Update return (if exists) ───
      if (ret) {
        const rCol = txCollectionOf(ret.category);
        const rFlat = flattenFields(returnFields);
        const rUpdates = {
          timestamp:       returnDate ? new Date(returnDate).getTime() : ret.timestamp,
          empName:         empName,
          returnNotes:     returnNotes,
          returnFields:    returnFields,
          returnPhotos:    rFlat.photos,
          returnChecklist: rFlat.checklist,
        };
        await updateDoc(doc(db, rCol, ret.id), rUpdates);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 w-full max-w-3xl max-h-[92vh] ring-1 ring-slate-200/60 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold text-slate-900">แก้ไขประวัติการครอบครอง</h3>
              <p className="text-[12.5px] text-slate-500 truncate">{checkout.empName || '-'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition shrink-0">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Tab bar — choose between checkout / return */}
        <div className="flex border-b border-slate-100 px-6 shrink-0 bg-white">
          <TabBtn active={activeTab === 'checkout'} onClick={() => setActiveTab('checkout')} color="blue" Icon={ArrowRight}>
            ตอนส่งมอบ
          </TabBtn>
          {ret ? (
            <TabBtn active={activeTab === 'return'} onClick={() => setActiveTab('return')} color="emerald" Icon={ArrowLeft}>
              ตอนรับคืน
            </TabBtn>
          ) : (
            <span className="py-3 px-1 ml-6 text-[13px] text-slate-400 italic flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> ยังไม่มีการรับคืน
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-slate-50/40">

          {/* Common: employee name */}
          <div className="bg-white ring-1 ring-slate-200 rounded-xl p-4">
            <label className="block text-[12.5px] font-medium text-slate-600 mb-1">ชื่อพนักงาน</label>
            <input
              type="text"
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
              placeholder="ชื่อ-นามสกุล (เปลี่ยนได้ทั้ง 2 ฝั่ง)"
            />
            <p className="text-[11px] text-slate-400 mt-1">การเปลี่ยนชื่อจะมีผลกับทั้งบันทึกส่งมอบและรับคืน</p>
          </div>

          {/* ─── TAB: Checkout ─── */}
          {activeTab === 'checkout' && (
            <>
              <div className="bg-white ring-1 ring-blue-200 rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} /> ข้อมูลการส่งมอบ
                </p>
                <div>
                  <label className="block text-[12.5px] font-medium text-slate-600 mb-1">วันและเวลา</label>
                  <input
                    type="datetime-local"
                    value={checkoutDate}
                    onChange={(e) => setCheckoutDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
                  />
                </div>
              </div>

              <ConditionCapture
                mode="checkout"
                fields={checkoutFields}
                setFields={setCheckoutFields}
                notes={checkoutNotes}
                setNotes={setCheckoutNotes}
              />
            </>
          )}

          {/* ─── TAB: Return ─── */}
          {activeTab === 'return' && ret && (
            <>
              <div className="bg-white ring-1 ring-emerald-200 rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} /> ข้อมูลการรับคืน
                </p>
                <div>
                  <label className="block text-[12.5px] font-medium text-slate-600 mb-1">วันและเวลา</label>
                  <input
                    type="datetime-local"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
                  />
                </div>
              </div>

              <ConditionCapture
                mode="return"
                fields={returnFields}
                setFields={setReturnFields}
                notes={returnNotes}
                setNotes={setReturnNotes}
              />
            </>
          )}

          {error && (
            <div className="text-[12.5px] text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 text-[13.5px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold text-white rounded-lg shadow-sm hover:shadow-md transition disabled:opacity-60"
            style={{ background: '#1E487A' }}
          >
            {saving ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังบันทึก...</>
            ) : (
              <><Save className="h-3.5 w-3.5" strokeWidth={2.2} /> บันทึกทุกการเปลี่ยนแปลง</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Tab button helper ── */
function TabBtn({ active, onClick, color, Icon, children }) {
  const colorCls = {
    blue:    active ? 'border-blue-500 text-blue-700'         : 'border-transparent text-slate-400 hover:text-slate-700',
    emerald: active ? 'border-emerald-500 text-emerald-700'   : 'border-transparent text-slate-400 hover:text-slate-700',
  }[color];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-3 px-1 mr-6 text-[13.5px] font-medium border-b-2 transition-colors whitespace-nowrap ${colorCls}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   Delete confirm — ลบทั้งคู่ (checkout + return)
   ════════════════════════════════════════════════════════════════ */
function DeletePeriodConfirm({ period, onClose }) {
  const { checkout, return: ret } = period;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setDeleting(true);
    try {
      await deleteDoc(doc(db, txCollectionOf(checkout.category), checkout.id));
      if (ret) await deleteDoc(doc(db, txCollectionOf(ret.category), ret.id));
      onClose();
    } catch (err) {
      setError(err.message || 'ลบไม่สำเร็จ');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 w-full max-w-md ring-1 ring-slate-200/60 overflow-hidden">
        <div className="px-6 py-5 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <Trash2 className="h-6 w-6" strokeWidth={2} />
          </div>
          <h3 className="text-[17px] font-semibold text-slate-900 mb-1.5">ลบประวัติการครอบครอง</h3>
          <p className="text-[13.5px] text-slate-500 leading-relaxed">
            ลบช่วงครอบครองของ <span className="font-semibold text-slate-700">{checkout.empName}</span>?<br/>
            {ret ? 'จะลบทั้งบันทึกการส่งมอบและการรับคืน' : 'จะลบบันทึกการส่งมอบ (ยังไม่มีการรับคืน)'}
          </p>
          <p className="text-[12px] text-rose-600 mt-2 font-medium">การลบไม่สามารถย้อนกลับได้</p>

          {error && (
            <div className="text-[12.5px] text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2 mt-3 text-left">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-5 py-2.5 text-[13.5px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm hover:shadow-md transition disabled:opacity-60"
          >
            {deleting ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังลบ...</>
            ) : (
              <><Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} /> ยืนยันลบ</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
