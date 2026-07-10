import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import {
  ASSESSMENT_SECTIONS,
  PHOTO_SLOTS,
  itemMaxScore,
  scoreFromStatus,
} from '../utils/printHandoverForm.js';
import { compressAndUploadPhoto } from '../utils/uploadPhoto.js';

/* ════════════════════════════════════════════════════════════════════════
   AssetAssessmentSection — 100-point checklist ใช้ร่วมกันในหลาย modal
   ── Checkout, Return, PreHandover, PreReturn ────────────────────────────
   Props:
     assessment       {[itemNo]: { status, score }}
     setAssessment
     photos           {[slotKey]: base64}
     setPhotos
     defectsNote      string
     setDefectsNote
     compact          boolean — ย่อขนาดลง (ใช้ใน Modal ปกติ)
   ════════════════════════════════════════════════════════════════════════ */

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

export default function AssetAssessmentSection({
  assessment = {},
  setAssessment,
  photos = {},
  setPhotos,
  defectsNote = '',
  setDefectsNote,
  compact = false,
}) {
  /* ── update item status + auto-set score from status ── */
  const setItemStatus = (no, status, sectionIdx) => {
    const max = itemMaxScore(sectionIdx);
    setAssessment(prev => ({
      ...prev,
      [no]: { status, score: scoreFromStatus(status, max) },
    }));
  };

  const setSectionStatus = (sectionIdx, status) => {
    const max = itemMaxScore(sectionIdx);
    const updates = {};
    ASSESSMENT_SECTIONS[sectionIdx].items.forEach(([no]) => {
      updates[no] = { status, score: scoreFromStatus(status, max) };
    });
    setAssessment(prev => ({ ...prev, ...updates }));
  };

  /* ── grand total calculation ── */
  const grandTotal = Object.values(assessment).reduce(
    (sum, cell) => sum + (cell?.score != null ? Number(cell.score) : 0),
    0
  );
  const grade = grandTotal >= 90 ? 'A' : grandTotal >= 75 ? 'B' : grandTotal >= 60 ? 'C' : 'D';
  const gradeColor = { A: 'text-emerald-600', B: 'text-blue-600', C: 'text-amber-600', D: 'text-rose-600' }[grade];
  const gradeLabel = grade === 'A' ? 'ดีเยี่ยม' : grade === 'B' ? 'ผ่าน' : grade === 'C' ? 'ต้องซ่อม' : 'เสียหายหนัก';

  return (
    <div className="space-y-4">
      {/* ── Score banner ── */}
      <div className="bg-gradient-to-r from-[#1E487A] to-[#163963] text-white rounded-xl p-3.5 flex items-center justify-between shadow-md">
        <div>
          <div className="text-[11.5px] opacity-80 font-medium">คะแนนรวม (100)</div>
          <div className="text-[28px] font-bold leading-none mt-0.5">{grandTotal % 1 === 0 ? grandTotal : grandTotal.toFixed(1)}</div>
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="text-[9.5px] opacity-80 font-semibold tracking-[0.14em] uppercase">เกรด</div>
          <div className={`w-12 h-12 rounded-xl bg-white shadow-sm ring-1 ring-white/40 flex items-center justify-center text-[26px] font-extrabold leading-none ${gradeColor}`}>
            {grade}
          </div>
          <div className="text-[10.5px] opacity-90 font-medium leading-tight">{gradeLabel}</div>
        </div>
      </div>

      {/* ── Assessment sections ── */}
      <div>
        <h4 className="text-[12.5px] font-semibold tracking-[0.06em] text-slate-500 uppercase mb-2">แบบประเมินสภาพอุปกรณ์ (100 คะแนน)</h4>
        <div className="space-y-3">
          {ASSESSMENT_SECTIONS.map((sec, si) => {
            const itemMax = itemMaxScore(si);
            const sectionScore = sec.items.reduce((s, [no]) => s + (assessment[no]?.score || 0), 0);
            return (
              <div key={sec.title} className="ring-1 ring-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 border-b border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-semibold text-[#1E487A] truncate">{sec.title}</span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded-md ring-1 ring-slate-200 shrink-0">
                      {sectionScore % 1 === 0 ? sectionScore : sectionScore.toFixed(1)}/{sec.max}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <QuickFillBtn onClick={() => setSectionStatus(si, 'normal')}  color="emerald">ปกติ</QuickFillBtn>
                    <QuickFillBtn onClick={() => setSectionStatus(si, 'scratch')} color="amber">ตำหนิ</QuickFillBtn>
                    <QuickFillBtn onClick={() => setSectionStatus(si, 'broken')}  color="rose">ชำรุด</QuickFillBtn>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {sec.items.map(([no, name, criteria]) => {
                    const cell = assessment[no] || {};
                    return (
                      <div key={no} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50/60">
                        <span className="text-[11px] font-mono text-slate-400 shrink-0 w-7">{no}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-semibold text-slate-700 truncate">{name}</div>
                          <div className="text-[10.5px] text-slate-500 truncate">{criteria}</div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {STATUS_OPTIONS.map(opt => {
                            const selected = cell.status === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setItemStatus(no, opt.value, si)}
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset transition whitespace-nowrap ${
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
                        <div className="w-11 shrink-0 text-right">
                          <span className="text-[12px] font-bold text-[#1E487A] tabular-nums">
                            {cell.score != null ? (cell.score % 1 === 0 ? cell.score : cell.score.toFixed(1)) : '-'}
                          </span>
                          <span className="text-[9.5px] text-slate-400">/{itemMax}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Defects note ── */}
      <div>
        <h4 className="text-[12.5px] font-semibold tracking-[0.06em] text-slate-500 uppercase mb-2">บันทึกตำหนิที่มีอยู่แล้ว</h4>
        <textarea
          value={defectsNote}
          onChange={(e) => setDefectsNote(e.target.value)}
          rows={2}
          placeholder='ระบุตำหนิ / รอย / Dead Pixel ที่มีอยู่แล้ว (ถ้าไม่มีให้ระบุ "ไม่มี")'
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13.5px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] resize-none"
        />
      </div>

      {/* ── Photos ── */}
      <div>
        <h4 className="text-[12.5px] font-semibold tracking-[0.06em] text-slate-500 uppercase mb-2">
          รูปภาพสภาพอุปกรณ์ ({Object.keys(photos).length}/6 มุม)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
      </div>
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
      className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md ring-1 ring-inset bg-white transition whitespace-nowrap ${cls}`}
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
      // 🆕 upload ไป Firebase Storage → save เฉพาะ URL
      const url = await compressAndUploadPhoto(file, 'assessment-photos');
      if (url) onUpload(url);
    } catch (err) {
      console.error('Compress image failed:', err);
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div className="rounded-lg ring-1 ring-slate-200 bg-white overflow-hidden">
      <div className="px-2 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-semibold text-slate-700 truncate">{label}</span>
        {src && (
          <button
            type="button"
            onClick={onRemove}
            className="text-rose-500 hover:text-rose-600 p-0.5 rounded transition"
            title="ลบรูป"
          >
            <Trash2 className="h-3 w-3" strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="p-1.5">
        {src ? (
          <div className="relative h-24 rounded overflow-hidden bg-slate-50 ring-1 ring-slate-200">
            <img src={src} alt={label} className="w-full h-full object-cover" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="w-full h-24 rounded ring-1 ring-dashed ring-slate-300 hover:ring-[#1E487A] hover:bg-blue-50/60 transition flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-[#1E487A]"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-[#1E487A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" strokeWidth={1.8} />
                <span className="text-[10.5px] font-medium">แนบรูป</span>
              </>
            )}
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          onChange={handleSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
