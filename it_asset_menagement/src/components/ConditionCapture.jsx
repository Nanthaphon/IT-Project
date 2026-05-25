import React, { useRef, useState } from 'react';
import { Camera, X, Plus, AlertCircle, ImagePlus } from 'lucide-react';
import { compressImages } from '../utils/compressImage.js';

/* ── รายการ checklist สภาพอุปกรณ์ ── */
export const CHECKLIST_FIELDS = [
  { key: 'screen',     label: 'หน้าจอภาพ' },
  { key: 'body',       label: 'บอดี้ / ตัวเครื่อง' },
  { key: 'screenEdge', label: 'ขอบจอภาพ' },
  { key: 'keyboard',   label: 'คีย์บอร์ด' },
  { key: 'ports',      label: 'พอร์ตเชื่อมต่อ' },
  { key: 'battery',    label: 'แบตเตอรี่' },
  { key: 'accessories',label: 'อุปกรณ์ที่ติดมา (Charger, ฯลฯ)' },
];

/* ── สถานะแยกตามฟิลด์ ── */
export const FIELD_STATUS_LABELS = {
  screen:      { normal: 'ปกติ',  scratch: 'มีรอย',      broken: 'แตก / ร้าว' },
  body:        { normal: 'ปกติ',  scratch: 'รอยขีด',     broken: 'บุบ / แตก' },
  screenEdge:  { normal: 'ปกติ',  scratch: 'มีช่อง',     broken: 'อ้า / แยก' },
  keyboard:    { normal: 'ปกติ',  scratch: 'ปุ่มสึก',    broken: 'ปุ่มหลุด' },
  ports:       { normal: 'ปกติ',  scratch: 'หลวม',       broken: 'ใช้ไม่ได้' },
  battery:     { normal: 'ปกติ',  scratch: 'เสื่อม',     broken: 'บวม / ใช้ไม่ได้' },
  accessories: { normal: 'ครบ',   scratch: 'ขาดบางชิ้น', broken: 'ชำรุด / หาย' },
};

const STATUS_VALUES = ['normal', 'scratch', 'broken'];
const STATUS_COLOR_BY_VALUE = {
  normal:  'emerald',
  scratch: 'amber',
  broken:  'rose',
};

const STATUS_COLOR_CLS = {
  emerald: 'bg-emerald-50 ring-emerald-400 text-emerald-700',
  amber:   'bg-amber-50 ring-amber-400 text-amber-700',
  rose:    'bg-rose-50 ring-rose-400 text-rose-700',
};

const ROW_TINT_BY_STATUS = {
  normal:  'bg-white',
  scratch: 'bg-amber-50/40',
  broken:  'bg-rose-50/40',
};

const MAX_PHOTOS_PER_FIELD = 2;

/* ── Helpers ─────────────────────────────────────────── */
export const EMPTY_CHECKLIST = CHECKLIST_FIELDS.reduce((acc, f) => {
  acc[f.key] = 'normal';
  return acc;
}, {});

export const EMPTY_FIELDS = CHECKLIST_FIELDS.reduce((acc, f) => {
  acc[f.key] = { status: 'normal', photos: [] };
  return acc;
}, {});

/** Flatten new per-field shape → backward-compat (photos[], checklist{}) */
export function flattenFields(fields = EMPTY_FIELDS) {
  const photos = [];
  const checklist = {};
  CHECKLIST_FIELDS.forEach((f) => {
    const cell = fields[f.key] || { status: 'normal', photos: [] };
    checklist[f.key] = cell.status || 'normal';
    (cell.photos || []).forEach((p) => photos.push(p));
  });
  return { photos, checklist };
}

/**
 * ConditionCapture — แต่ละหัวข้อ checklist มีปุ่มอัปโหลดรูปของตัวเอง
 *
 * Props:
 * - fields: { [fieldKey]: { status, photos: [] } }
 * - setFields: setter
 * - notes, setNotes, mode
 */
export default function ConditionCapture({
  fields = EMPTY_FIELDS,
  setFields,
  notes = '',
  setNotes,
  mode = 'checkout',
}) {
  const isCheckout = mode === 'checkout';
  const [viewerImage, setViewerImage] = useState(null);

  const updateField = (key, patch) => {
    setFields({
      ...fields,
      [key]: { ...(fields[key] || { status: 'normal', photos: [] }), ...patch },
    });
  };

  const totalPhotos = CHECKLIST_FIELDS.reduce(
    (n, f) => n + ((fields[f.key]?.photos || []).length),
    0
  );

  return (
    <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/40">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
          <p className="text-[15px] font-semibold text-slate-700">
            {isCheckout ? 'ตรวจสภาพอุปกรณ์ตอนส่งมอบ' : 'ตรวจสภาพอุปกรณ์ตอนรับคืน'}
          </p>
        </div>
        <span className="text-[12px] text-slate-500 font-medium">
          แนบรูปแล้ว {totalPhotos} รูป
        </span>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-2 px-3 py-2 bg-blue-50/60 ring-1 ring-inset ring-blue-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" strokeWidth={2} />
        <p className="text-[13px] text-blue-700 leading-relaxed">
          เลือกสถานะของแต่ละจุด แล้วกดปุ่ม <Camera className="inline h-3.5 w-3.5 align-text-bottom" strokeWidth={2} /> เพื่อแนบรูปยืนยันสภาพของจุดนั้นโดยตรง (สูงสุด {MAX_PHOTOS_PER_FIELD} รูป/จุด)
        </p>
      </div>

      {/* ── Per-field rows ── */}
      <div className="space-y-2">
        {CHECKLIST_FIELDS.map((field) => {
          const cell = fields[field.key] || { status: 'normal', photos: [] };
          return (
            <FieldRow
              key={field.key}
              field={field}
              status={cell.status}
              photos={cell.photos}
              onStatusChange={(status) => updateField(field.key, { status })}
              onPhotosChange={(photos) => updateField(field.key, { photos })}
              onPhotoClick={setViewerImage}
            />
          );
        })}
      </div>

      {/* ── Notes ── */}
      <div>
        <label className="block text-[14px] font-medium text-slate-600 mb-2">
          📝 หมายเหตุเพิ่มเติม
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] resize-none"
          placeholder={isCheckout ? 'เช่น มีรอยขีดเล็กที่ฝาหลัง...' : 'เช่น พบรอยใหม่บริเวณบอดี้...'}
          rows="2"
        />
      </div>

      {/* Fullscreen image viewer */}
      {viewerImage && (
        <div
          onClick={() => setViewerImage(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
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
    </div>
  );
}

/* ────────────────────────── Per-field row ────────────────────────── */
function FieldRow({ field, status, photos = [], onStatusChange, onPhotosChange, onPhotoClick }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const fieldLabels = FIELD_STATUS_LABELS[field.key] || FIELD_STATUS_LABELS.body;
  const tint = ROW_TINT_BY_STATUS[status] || ROW_TINT_BY_STATUS.normal;
  const slotsLeft = MAX_PHOTOS_PER_FIELD - photos.length;

  const handleSelectFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || slotsLeft <= 0) return;
    setUploading(true);
    try {
      const toProcess = files.slice(0, slotsLeft);
      const compressed = await compressImages(toProcess);
      onPhotosChange([...photos, ...compressed]);
    } catch (err) {
      console.error('Compress image failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (i) => {
    onPhotosChange(photos.filter((_, idx) => idx !== i));
  };

  return (
    <div className={`rounded-xl ring-1 ring-slate-200 p-3 transition-colors ${tint}`}>
      {/* Top row: label + status pills */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-[14px] font-semibold text-slate-700 sm:flex-1 sm:min-w-0 sm:truncate">
          {field.label}
        </span>
        <div className="flex gap-1 flex-wrap">
          {STATUS_VALUES.map((value) => {
            const selected = status === value;
            const color = STATUS_COLOR_BY_VALUE[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => onStatusChange(value)}
                className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset transition whitespace-nowrap ${
                  selected
                    ? STATUS_COLOR_CLS[color] + ' ring-2'
                    : 'bg-white ring-slate-200 text-slate-500 hover:ring-slate-300'
                }`}
              >
                {fieldLabels[value]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom row: photo thumbnails + add button */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        {photos.map((src, i) => (
          <div
            key={i}
            className="relative w-16 h-16 rounded-lg overflow-hidden ring-1 ring-slate-200 bg-white shrink-0 group"
          >
            <button
              type="button"
              onClick={() => onPhotoClick(src)}
              className="w-full h-full"
            >
              <img src={src} alt={`${field.label}-${i + 1}`} className="w-full h-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition"
              title="ลบรูป"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </div>
        ))}

        {slotsLeft > 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 rounded-lg ring-1 ring-dashed ring-slate-300 hover:ring-[#1E487A] hover:bg-blue-50/60 transition flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-[#1E487A] shrink-0"
            title={`แนบรูปของ "${field.label}"`}
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-[#1E487A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-4 w-4" strokeWidth={1.8} />
                <span className="text-[10px] font-medium leading-none">เพิ่มรูป</span>
              </>
            )}
          </button>
        )}

        {photos.length === 0 && (
          <span className="text-[12px] text-slate-400 italic">— ยังไม่ได้แนบรูปจุดนี้</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelectFiles}
        className="hidden"
      />
    </div>
  );
}
