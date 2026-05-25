import React, { useState, useRef } from 'react';
import { Printer, X, Camera, ImagePlus, ClipboardCheck, AlertCircle, Trash2 } from 'lucide-react';
import {
  ASSESSMENT_SECTIONS,
  PHOTO_SLOTS,
  itemMaxScore,
  scoreFromStatus,
  buildEmptyAssessment,
  printHandoverForm,
} from '../utils/printHandoverForm.js';
import { compressImages } from '../utils/compressImage.js';

const STATUS_OPTIONS = [
  { value: 'normal',  label: 'ปกติ',  color: 'emerald' },
  { value: 'scratch', label: 'ตำหนิ', color: 'amber'   },
  { value: 'broken',  label: 'ชำรุด', color: 'rose'    },
];

const STATUS_COLOR_CLS = {
  emerald: 'bg-emerald-50 ring-emerald-400 text-emerald-700',
  amber:   'bg-amber-50 ring-amber-400 text-amber-700',
  rose:    'bg-rose-50 ring-rose-400 text-rose-700',
};

export default function PreHandoverAssessmentModal({
  isOpen, onClose, employee, empAssets, empLicenses, empAccessories,
}) {
  const [assessment,   setAssessment]   = useState(() => buildEmptyAssessment());
  const [photos,       setPhotos]       = useState({}); // { topLid, base, left, right, screenKeyboard, existingDefect }
  const [defectsNote,  setDefectsNote]  = useState('');
  const [handoverDate, setHandoverDate] = useState(() => new Date().toISOString().slice(0, 10));

  if (!isOpen) return null;

  /* ── update item status + auto-set score from status ── */
  const setItemStatus = (no, status, sectionIdx) => {
    const max = itemMaxScore(sectionIdx);
    setAssessment(prev => ({
      ...prev,
      [no]: { status, score: scoreFromStatus(status, max) },
    }));
  };

  /* ── grand total calculation ── */
  const grandTotal = Object.values(assessment).reduce(
    (sum, cell) => sum + (cell?.score != null ? Number(cell.score) : 0),
    0
  );
  const grade = grandTotal >= 90 ? 'A' : grandTotal >= 75 ? 'B' : grandTotal >= 60 ? 'C' : 'D';
  const gradeColor = { A: 'text-emerald-600', B: 'text-blue-600', C: 'text-amber-600', D: 'text-rose-600' }[grade];

  const handlePrint = () => {
    printHandoverForm({
      employee, empAssets, empLicenses, empAccessories,
      assessment, photos, defectsNote, handoverDate,
    });
    onClose();
  };

  /* ── Set all items in one section to the same status (quick fill) ── */
  const setSectionStatus = (sectionIdx, status) => {
    const max = itemMaxScore(sectionIdx);
    const updates = {};
    ASSESSMENT_SECTIONS[sectionIdx].items.forEach(([no]) => {
      updates[no] = { status, score: scoreFromStatus(status, max) };
    });
    setAssessment(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 w-full max-w-5xl max-h-[92vh] flex flex-col ring-1 ring-slate-200/60 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1E487A]/10 text-[#1E487A] flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-slate-900 leading-tight">เตรียมข้อมูลก่อนพิมพ์ใบส่งมอบ</h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                ติ๊กผลประเมินสภาพอุปกรณ์ + แนบรูปก่อนส่งมอบให้ <span className="font-semibold text-slate-700">{employee?.fullName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-6 bg-slate-50/40">

          {/* Top: handover date */}
          <div className="bg-white ring-1 ring-slate-200 rounded-xl p-4">
            <label className="block text-[13px] font-medium text-slate-600 mb-1.5">
              วันที่รับมอบ
            </label>
            <input
              type="date"
              value={handoverDate}
              onChange={(e) => setHandoverDate(e.target.value)}
              className="w-full sm:w-72 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
            />
          </div>

          {/* Score banner */}
          <div className="bg-gradient-to-r from-[#1E487A] to-[#163963] text-white rounded-xl p-4 flex items-center justify-between shadow-md">
            <div>
              <div className="text-[12px] opacity-80 font-medium">คะแนนรวม (100)</div>
              <div className="text-[34px] font-bold leading-none mt-1">{grandTotal % 1 === 0 ? grandTotal : grandTotal.toFixed(1)}</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] opacity-80 font-medium">เกรด</div>
              <div className={`text-[34px] font-extrabold leading-none mt-1 bg-white rounded-lg px-4 py-1 inline-block ${gradeColor}`}>
                {grade}
              </div>
              <div className="text-[11px] opacity-80 mt-1">
                {grade === 'A' ? 'ดีเยี่ยม' : grade === 'B' ? 'ผ่าน (มีรอยเล็กน้อย)' : grade === 'C' ? 'ต้องซ่อม' : 'เสียหายหนัก'}
              </div>
            </div>
          </div>

          {/* ── 5. Assessment ── */}
          <Section title="5. แบบประเมินสภาพอุปกรณ์ (100 คะแนน)">
            <div className="space-y-4">
              {ASSESSMENT_SECTIONS.map((sec, si) => {
                const itemMax = itemMaxScore(si);
                const sectionScore = sec.items.reduce((s, [no]) => s + (assessment[no]?.score || 0), 0);
                return (
                  <div key={sec.title} className="ring-1 ring-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[14px] font-semibold text-[#1E487A] truncate">{sec.title}</span>
                        <span className="text-[12px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md ring-1 ring-slate-200 shrink-0">
                          {sectionScore % 1 === 0 ? sectionScore : sectionScore.toFixed(1)} / {sec.max}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <QuickFillBtn onClick={() => setSectionStatus(si, 'normal')}  color="emerald">ทั้งหมดปกติ</QuickFillBtn>
                        <QuickFillBtn onClick={() => setSectionStatus(si, 'scratch')} color="amber">ทั้งหมดตำหนิ</QuickFillBtn>
                        <QuickFillBtn onClick={() => setSectionStatus(si, 'broken')}  color="rose">ทั้งหมดชำรุด</QuickFillBtn>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {sec.items.map(([no, name, criteria]) => {
                        const cell = assessment[no] || {};
                        return (
                          <div key={no} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/60">
                            <span className="text-[12px] font-mono text-slate-400 shrink-0 w-8">{no}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13.5px] font-semibold text-slate-700 truncate">{name}</div>
                              <div className="text-[11.5px] text-slate-500 truncate">{criteria}</div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {STATUS_OPTIONS.map(opt => {
                                const selected = cell.status === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setItemStatus(no, opt.value, si)}
                                    className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset transition whitespace-nowrap ${
                                      selected
                                        ? STATUS_COLOR_CLS[opt.color] + ' ring-2'
                                        : 'bg-white ring-slate-200 text-slate-500 hover:ring-slate-300'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="w-14 shrink-0 text-right">
                              <span className="text-[13px] font-bold text-[#1E487A] tabular-nums">
                                {cell.score != null ? (cell.score % 1 === 0 ? cell.score : cell.score.toFixed(2)) : '-'}
                              </span>
                              <span className="text-[10px] text-slate-400">/{itemMax % 1 === 0 ? itemMax : itemMax.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── 6. Defects ── */}
          <Section title="6. บันทึกตำหนิที่มีอยู่แล้ว">
            <textarea
              value={defectsNote}
              onChange={(e) => setDefectsNote(e.target.value)}
              rows={3}
              placeholder='ระบุตำหนิ / รอย / Dead Pixel ที่มีอยู่แล้วก่อนส่งมอบ (ถ้าไม่มีให้ระบุ "ไม่มี")'
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] resize-none"
            />
          </Section>

          {/* ── 7. Photos ── */}
          <Section title="7. รูปภาพสภาพอุปกรณ์ก่อนส่งมอบ (6 มุม)">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PHOTO_SLOTS.map(slot => (
                <PhotoUploadSlot
                  key={slot.key}
                  label={slot.label}
                  src={photos[slot.key]}
                  onUpload={(src) => setPhotos(prev => ({ ...prev, [slot.key]: src }))}
                  onRemove={() => setPhotos(prev => { const n = { ...prev }; delete n[slot.key]; return n; })}
                />
              ))}
            </div>
            <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-blue-50/60 ring-1 ring-inset ring-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" strokeWidth={2} />
              <p className="text-[12.5px] text-blue-700 leading-relaxed">
                แนะนำให้แนบครบทั้ง 6 มุม รูปจะถูกฝังลงในเอกสาร PDF ที่พิมพ์ออก
              </p>
            </div>
          </Section>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-white shrink-0 gap-3">
          <div className="text-[12.5px] text-slate-500">
            แนบรูปแล้ว <span className="font-semibold text-slate-700">{Object.keys(photos).length}/6</span> รูป
            · คะแนนรวม <span className="font-semibold text-[#1E487A]">{grandTotal % 1 === 0 ? grandTotal : grandTotal.toFixed(1)}</span>/100
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-[14px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-semibold text-white rounded-lg shadow-sm hover:shadow-md transition"
              style={{ background: '#1E487A', boxShadow: '0 4px 14px rgba(30,72,122,0.30)' }}
            >
              <Printer className="h-4 w-4" strokeWidth={2.2} />
              พิมพ์เอกสาร / บันทึก PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ────────────────────────── Reusable bits ────────────────────────── */
function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-[13px] font-semibold tracking-[0.08em] text-slate-500 uppercase mb-2.5">{title}</h4>
      {children}
    </div>
  );
}

function QuickFillBtn({ onClick, color, children }) {
  const cls = {
    emerald: 'text-emerald-700 ring-emerald-200 hover:bg-emerald-50',
    amber:   'text-amber-700 ring-amber-200 hover:bg-amber-50',
    rose:    'text-rose-700 ring-rose-200 hover:bg-rose-50',
  }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] font-semibold px-2 py-1 rounded-md ring-1 ring-inset bg-white transition whitespace-nowrap ${cls}`}
    >
      {children}
    </button>
  );
}

function PhotoUploadSlot({ label, src, onUpload, onRemove }) {
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImages([file]);
      onUpload(compressed[0]);
    } catch (err) {
      console.error('Compress image failed:', err);
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div className="rounded-xl ring-1 ring-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-semibold text-slate-700 truncate">{label}</span>
        {src && (
          <button
            type="button"
            onClick={onRemove}
            className="text-rose-500 hover:text-rose-600 p-1 rounded transition"
            title="ลบรูป"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="p-2">
        {src ? (
          <div className="relative h-32 rounded-lg overflow-hidden bg-slate-50 ring-1 ring-slate-200">
            <img src={src} alt={label} className="w-full h-full object-cover" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-lg ring-1 ring-dashed ring-slate-300 hover:ring-[#1E487A] hover:bg-blue-50/60 transition flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#1E487A]"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#1E487A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" strokeWidth={1.8} />
                <span className="text-[11.5px] font-medium">แนบรูป</span>
              </>
            )}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={handleSelect} className="hidden" />
    </div>
  );
}
