import React, { useState } from 'react';
import { User, ArrowRight, ArrowLeft, Calendar, Camera, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { CHECKLIST_FIELDS, FIELD_STATUS_LABELS } from './ConditionCapture.jsx';

// helper: คืน label ของสถานะตามฟิลด์ (ถ้าไม่รู้จัก field ใช้ default)
const labelOf = (fieldKey, value) =>
  (FIELD_STATUS_LABELS[fieldKey] || FIELD_STATUS_LABELS.body)[value] || value;

const STATUS_COLOR = {
  normal:  'text-emerald-700 bg-emerald-50 ring-emerald-200',
  scratch: 'text-amber-700 bg-amber-50 ring-amber-200',
  broken:  'text-rose-700 bg-rose-50 ring-rose-200',
};

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
    </>
  );
}

/* ── Period Card ── */
function PeriodCard({ period, isCurrent, onPhotoClick }) {
  const [expanded, setExpanded] = useState(false);
  const { checkout, return: ret } = period;

  const fmt = (ts) => ts ? new Date(ts).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

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
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isCurrent ? 'bg-[#1E487A] text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            <User className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-slate-800 truncate">
              {checkout.empName || '-'}
              {isCurrent && <span className="ml-1.5 text-[11px] font-semibold text-[#1E487A] bg-[#1E487A]/10 px-1.5 py-0.5 rounded">ปัจจุบัน</span>}
            </p>
            <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3 w-3" strokeWidth={2} />
              {fmt(checkout.timestamp)}
              {ret && <> <ArrowRight className="h-3 w-3" /> {fmt(ret.timestamp)}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
            className="text-[12px] font-semibold text-[#1E487A] hover:underline shrink-0"
          >
            {expanded ? 'ย่อ' : 'รายละเอียด'}
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
