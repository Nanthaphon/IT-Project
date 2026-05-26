import React, { useRef, useState } from 'react';
import { Camera, X, Plus, AlertCircle, ImagePlus } from 'lucide-react';
import { compressImages } from '../utils/compressImage.js';

/* ════════════════════════════════════════════════════════════════
   CHECKLIST_FIELDS — 6 หมวดใหญ่ ตรงกับ ASSESSMENT_SECTIONS ของฟอร์ม
   index 0-5 → map 1:1 กับ ASSESSMENT_SECTIONS ใน printHandoverForm.js
   ════════════════════════════════════════════════════════════════ */
export const CHECKLIST_FIELDS = [
  { key: 'case',        label: 'ตัวเครื่อง / เคส',          hint: 'ฝา, บานพับ, มุม, sticker' },
  { key: 'display',     label: 'จอภาพ',                    hint: 'กระจกจอ, Dead Pixel, ขอบจอ, Backlight' },
  { key: 'keyboard',    label: 'คีย์บอร์ด / Touchpad',      hint: 'ปุ่ม, Touchpad, ไฟ Backlit' },
  { key: 'software',    label: 'OS / ซอฟต์แวร์',             hint: 'Windows Activation, Software, Driver, ความสะอาดของระบบ' },
  { key: 'performance', label: 'ประสิทธิภาพ',                hint: 'ระบบระบายความร้อน, Boot Time, สุขภาพ Storage' },
  { key: 'accessories', label: 'อุปกรณ์เสริม / พอร์ต',      hint: 'พอร์ต USB/HDMI/USB-C, Charger, อุปกรณ์ตามรายการ' },
];

/* ── สถานะแยกตามฟิลด์ ── */
export const FIELD_STATUS_LABELS = {
  case:        { normal: 'ปกติ',          scratch: 'รอยขีดข่วน',              broken: 'แตก / บุบ' },
  display:     { normal: 'ปกติ',          scratch: 'มีรอย / Dead Pixel',     broken: 'แตก / ร้าว' },
  keyboard:    { normal: 'ปกติ',          scratch: 'ปุ่มสึก / Touchpad ช้า',  broken: 'ปุ่มหลุด / Touchpad เสีย' },
  software:    { normal: 'Activated ครบ', scratch: 'Software บางตัวหาย',     broken: 'ไม่ Activate / มี Malware' },
  performance: { normal: 'ปกติ',          scratch: 'พัดลมดัง / Boot ช้า',     broken: 'ร้อนจัด / ค้าง / SSD เสีย' },
  accessories: { normal: 'ครบ',           scratch: 'พอร์ต/Charger บางจุดเสีย', broken: 'หาย / หลายจุดเสีย' },
};

/* ── Legacy key map — สำหรับข้อมูลเก่าก่อน restructure ── */
export const LEGACY_KEY_MAP = {
  screen:     'display',     // หน้าจอ → จอภาพ
  body:       'case',        // บอดี้ → ตัวเครื่อง/เคส
  screenEdge: 'display',     // ขอบจอ → จอภาพ (รวม)
  ports:      'accessories', // พอร์ต → อุปกรณ์เสริม/พอร์ต
  battery:    'performance', // แบตเตอรี่ → ประสิทธิภาพ (ฟอร์มใหม่ลบ battery)
  // keyboard, accessories → key เดิม (ไม่เปลี่ยน)
};

const _SEV = { normal: 0, scratch: 1, broken: 2 };

/**
 * migrateFields — แปลง shape เก่า (มี key เก่า เช่น screen, body) → shape ใหม่
 * - ถ้าเป็น shape ใหม่อยู่แล้ว → return ตามเดิม (เติม key ที่ขาด)
 * - ถ้าเป็น shape เก่า → map ตาม LEGACY_KEY_MAP
 *   - ถ้า 2 key เก่า map เข้า key ใหม่เดียวกัน → รวมรูปและเลือกสถานะที่แย่กว่า
 */
export function migrateFields(fields = {}) {
  if (!fields || typeof fields !== 'object') return EMPTY_FIELDS;

  // ── สร้าง shape ใหม่เปล่าๆ ──
  const out = {};
  CHECKLIST_FIELDS.forEach(f => { out[f.key] = { status: 'normal', photos: [] }; });

  const newKeys = CHECKLIST_FIELDS.map(f => f.key);
  const hasNew  = newKeys.some(k => fields[k]);

  // ── ถ้ามี key ใหม่อยู่แล้ว → ใช้ตามนั้น (เติม key ที่ขาดเป็นค่าเริ่มต้น) ──
  if (hasNew) {
    newKeys.forEach(k => {
      if (fields[k]) out[k] = {
        status: fields[k].status || 'normal',
        photos: fields[k].photos || [],
      };
    });
    return out;
  }

  // ── shape เก่า → map ตาม LEGACY_KEY_MAP ──
  Object.entries(fields).forEach(([oldKey, val]) => {
    if (!val || typeof val !== 'object') return;
    const newKey = LEGACY_KEY_MAP[oldKey] || (newKeys.includes(oldKey) ? oldKey : null);
    if (!newKey) return;

    const cur = out[newKey];
    const curSev = _SEV[cur.status] ?? 0;
    const newSev = _SEV[val.status] ?? 0;
    out[newKey] = {
      // เลือกสถานะที่แย่กว่า (ถ้า 2 key เก่ารวมเข้า key ใหม่เดียวกัน)
      status: newSev > curSev ? val.status : cur.status,
      photos: [...(cur.photos || []), ...(val.photos || [])],
    };
  });

  return out;
}

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
    <div className="space-y-3 border border-slate-200 rounded-xl p-3.5 bg-slate-50/40">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
          <p className="text-[14.5px] font-semibold text-slate-700">
            {isCheckout ? 'ตรวจสภาพอุปกรณ์ตอนส่งมอบ' : 'ตรวจสภาพอุปกรณ์ตอนรับคืน'}
          </p>
        </div>
        <span className="text-[11.5px] text-slate-500 font-medium">
          แนบรูปแล้ว <span className="font-bold text-[#1E487A]">{totalPhotos}</span> รูป
        </span>
      </div>

      {/* Hint — compact */}
      <div className="flex items-start gap-2 px-3 py-1.5 bg-blue-50/60 ring-1 ring-inset ring-blue-200 rounded-lg">
        <AlertCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" strokeWidth={2} />
        <p className="text-[12px] text-blue-700 leading-snug">
          เลือกสถานะแต่ละจุด แล้วกดปุ่ม
          <span className="inline-flex items-center justify-center align-middle mx-1 w-5 h-5 rounded-md bg-white ring-1 ring-blue-300 text-blue-600">
            <ImagePlus className="h-3 w-3" strokeWidth={2.2} />
          </span>
          ที่ท้ายแถวเพื่อแนบรูป (สูงสุด {MAX_PHOTOS_PER_FIELD} รูป/จุด)
        </p>
      </div>

      {/* ── Per-field rows ── */}
      <div className="space-y-1.5">
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
        <label className="block text-[13px] font-medium text-slate-600 mb-1.5">
          📝 หมายเหตุเพิ่มเติม
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] resize-none"
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

  const hasPhotos = photos.length > 0;

  return (
    <div className={`rounded-lg ring-1 ring-slate-200 px-3 py-2 transition-colors ${tint}`}>
      {/* Single row: label + status pills + photo button */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13.5px] font-semibold text-slate-700 flex-1 min-w-[120px] truncate">
          {field.label}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {/* Status pills */}
          {STATUS_VALUES.map((value) => {
            const selected = status === value;
            const color = STATUS_COLOR_BY_VALUE[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => onStatusChange(value)}
                className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset transition whitespace-nowrap ${
                  selected
                    ? STATUS_COLOR_CLS[color] + ' ring-2 shadow-sm'
                    : 'bg-white ring-slate-200 text-slate-500 hover:ring-slate-300'
                }`}
              >
                {fieldLabels[value]}
              </button>
            );
          })}

          {/* Inline photo button — compact icon */}
          {slotsLeft > 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`ml-1 w-7 h-7 rounded-md transition flex items-center justify-center shrink-0 ${
                hasPhotos
                  ? 'ring-1 ring-inset ring-slate-200 text-slate-500 hover:ring-[#1E487A] hover:text-[#1E487A] bg-white'
                  : 'ring-1 ring-dashed ring-slate-300 text-slate-400 hover:ring-[#1E487A] hover:text-[#1E487A] hover:bg-blue-50/60 bg-white/50'
              }`}
              title={hasPhotos ? `เพิ่มรูป (เหลือ ${slotsLeft} รูป)` : `แนบรูปของ "${field.label}"`}
            >
              {uploading ? (
                <div className="w-3 h-3 border-2 border-[#1E487A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
              )}
            </button>
          )}

          {/* Photo count badge — only when has photos */}
          {hasPhotos && (
            <span className="text-[10.5px] font-bold text-[#1E487A] bg-[#1E487A]/10 px-1.5 py-0.5 rounded-full shrink-0 ml-0.5">
              {photos.length}/{MAX_PHOTOS_PER_FIELD}
            </span>
          )}
        </div>
      </div>

      {/* Thumbnails — only shown when there ARE photos */}
      {hasPhotos && (
        <div className="mt-2 flex items-center gap-1.5">
          {photos.map((src, i) => (
            <div
              key={i}
              className="relative w-14 h-14 rounded-md overflow-hidden ring-1 ring-slate-200 bg-white shrink-0 group"
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
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition"
                title="ลบรูป"
              >
                <X className="h-2.5 w-2.5" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

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
