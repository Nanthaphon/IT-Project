import React, { useRef, useState } from 'react';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
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

/* ── สถานะแยกตามฟิลด์ — ใช้คำที่ตรงกับความเสียหายจริงของแต่ละจุด ──
   ใต้ฉาก: เก็บ severity เป็น 3 ระดับเหมือนเดิม ('normal', 'scratch', 'broken')
   เพื่อให้เปรียบเทียบ before/after ได้ (โค้ดเก่ายังใช้ได้)
*/
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

export const EMPTY_CHECKLIST = CHECKLIST_FIELDS.reduce((acc, f) => {
  acc[f.key] = 'normal';
  return acc;
}, {});

/**
 * ConditionCapture — บันทึกหลักฐานสภาพทรัพย์สิน
 *
 * Props:
 * - photos: array of base64 strings
 * - setPhotos: setter
 * - checklist: { screen, body, ... } each 'normal' | 'scratch' | 'broken'
 * - setChecklist: setter
 * - notes: string
 * - setNotes: setter
 * - mode: 'checkout' | 'return'
 * - maxPhotos: number (default 6)
 */
export default function ConditionCapture({
  photos = [],
  setPhotos,
  checklist = EMPTY_CHECKLIST,
  setChecklist,
  notes = '',
  setNotes,
  mode = 'checkout',
  maxPhotos = 6,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const isCheckout = mode === 'checkout';

  const handleSelectFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const slotsLeft = maxPhotos - photos.length;
    if (slotsLeft <= 0) return;
    const toProcess = files.slice(0, slotsLeft);
    setUploading(true);
    try {
      const compressed = await compressImages(toProcess);
      setPhotos([...photos, ...compressed]);
    } catch (err) {
      console.error('Compress image failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (i) => {
    setPhotos(photos.filter((_, idx) => idx !== i));
  };

  const updateChecklist = (key, value) => {
    setChecklist({ ...checklist, [key]: value });
  };

  return (
    <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/40">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <Camera className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
        <p className="text-[14px] font-semibold text-slate-700">
          {isCheckout ? 'หลักฐานสภาพอุปกรณ์ตอนส่งมอบ' : 'หลักฐานสภาพอุปกรณ์ตอนรับคืน'}
        </p>
      </div>

      {/* ── Photos ── */}
      <div>
        <label className="block text-[13px] font-medium text-slate-600 mb-2">
          📸 รูปภาพ ({photos.length}/{maxPhotos})
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((src, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-slate-200 bg-white"
            >
              <img src={src} alt={`photo-${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
          ))}

          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-lg ring-1 ring-dashed ring-slate-300 hover:ring-[#1E487A] hover:bg-blue-50/40 transition flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#1E487A]"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-[#1E487A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5" strokeWidth={1.8} />
                  <span className="text-[11px] font-medium">เพิ่มรูป</span>
                </>
              )}
            </button>
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

        <p className="text-[11.5px] text-slate-400 mt-1.5">
          แนะนำ: ถ่ายอย่างน้อย 4 รูป (หน้า, หลัง, ด้านข้าง, จอ/อุปกรณ์)
        </p>
      </div>

      {/* ── Checklist ── */}
      <div>
        <label className="block text-[13px] font-medium text-slate-600 mb-2">
          ✅ Checklist สภาพ
        </label>
        <div className="space-y-1.5">
          {CHECKLIST_FIELDS.map((field) => {
            const fieldLabels = FIELD_STATUS_LABELS[field.key] || FIELD_STATUS_LABELS.body;
            return (
              <div
                key={field.key}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2.5 py-1.5 bg-white rounded-lg ring-1 ring-slate-200"
              >
                <span className="text-[13.5px] text-slate-700 sm:flex-1 sm:truncate">{field.label}</span>
                <div className="flex gap-1 flex-wrap">
                  {STATUS_VALUES.map((value) => {
                    const selected = checklist[field.key] === value;
                    const color = STATUS_COLOR_BY_VALUE[value];
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateChecklist(field.key, value)}
                        className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset transition whitespace-nowrap ${
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
            );
          })}
        </div>
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

      {/* ── Hint banner สำหรับ return ── */}
      {!isCheckout && (
        <div className="flex items-start gap-2 px-3 py-2 bg-blue-50/60 ring-1 ring-inset ring-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" strokeWidth={2} />
          <p className="text-[12.5px] text-blue-700 leading-relaxed">
            กรุณาตรวจสภาพอุปกรณ์ให้ครบทุกจุด ถ้าพบความเสียหายที่ไม่มีตอนส่งมอบ ให้ระบุในหมายเหตุ
          </p>
        </div>
      )}
    </div>
  );
}
