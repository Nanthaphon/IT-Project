import React, { useState, useMemo } from 'react';
import { Star, MessageSquare, Wrench, CalendarDays, Sparkles, CheckCircle2, X } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

/* ── Rating labels ─────────────────────────────────── */
const RATING_LABELS = {
  0: '',
  1: 'แย่มาก',
  2: 'พอใช้',
  3: 'ปานกลาง',
  4: 'ดี',
  5: 'ดีมาก',
};

const RATING_COLORS = {
  1: 'text-rose-500',
  2: 'text-orange-500',
  3: 'text-amber-500',
  4: 'text-lime-500',
  5: 'text-emerald-500',
};

const QUESTIONS = [
  {
    key:   'speedRating',
    label: 'ความรวดเร็วในการเข้าแก้ไขปัญหา',
    desc:  'ทีม IT ตอบสนองและเข้ามาแก้ไขทันเวลาหรือไม่',
  },
  {
    key:   'qualityRating',
    label: 'คุณภาพของการแก้ปัญหา',
    desc:  'ปัญหาได้รับการแก้ไขอย่างถูกต้องและครบถ้วนหรือไม่',
  },
  {
    key:   'serviceRating',
    label: 'การให้บริการและกิริยามารยาท',
    desc:  'ทีม IT ให้บริการด้วยความสุภาพและเป็นมิตรหรือไม่',
  },
];

/* ─── Main Modal ───────────────────────────────────── */
export default function SatisfactionSurveyModal({
  isOpen, onClose, repair, onSubmit,
}) {
  const [ratings, setRatings] = useState({ speedRating: 0, qualityRating: 0, serviceRating: 0 });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverState, setHoverState] = useState({ key: '', value: 0 });

  /* compute overall */
  const overall = useMemo(() => {
    const sum = ratings.speedRating + ratings.qualityRating + ratings.serviceRating;
    return sum > 0 ? +(sum / 3).toFixed(2) : 0;
  }, [ratings]);

  const allRated = ratings.speedRating > 0 && ratings.qualityRating > 0 && ratings.serviceRating > 0;

  const reset = () => {
    setRatings({ speedRating: 0, qualityRating: 0, serviceRating: 0 });
    setComment('');
    setHoverState({ key: '', value: 0 });
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRated || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...ratings,
        overallRating: overall,
        comment: comment.trim(),
      });
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !repair) return null;

  const dateStr = repair.timestamp
    ? new Date(repair.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-';

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[95]">
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-slate-950/30 max-w-lg w-full overflow-hidden ring-1 ring-slate-200/60 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header gradient ── */}
        <div
          className="relative px-6 pt-7 pb-5 text-white overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1E487A 0%, #2563EB 50%, #1E487A 100%)',
          }}
        >
          {/* decorative blobs */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
            title="ข้ามไปก่อน"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>

          <div className="relative flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/20">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[17px] font-bold tracking-tight">ประเมินความพึงพอใจ</h3>
              <p className="text-[12.5px] text-blue-100/90 mt-0.5">
                หลังการแก้ไขปัญหา IT — ใช้เวลาเพียงไม่กี่วินาที 🙏
              </p>
            </div>
          </div>
        </div>

        {/* ── Repair info ── */}
        <div className="px-6 py-3 bg-blue-50/40 border-b border-blue-100/60 flex items-center gap-3 text-[12.5px]">
          <Wrench className="h-3.5 w-3.5 text-[#1E487A] shrink-0" strokeWidth={2} />
          <span className="font-semibold text-slate-700 truncate">{repair.assetName || '(ไม่ระบุอุปกรณ์)'}</span>
          <span className="text-slate-300">·</span>
          <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={1.8} />
          <span className="text-slate-500 shrink-0">{dateStr}</span>
        </div>

        {/* ── Body / form ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* 3 questions */}
          {QUESTIONS.map((q, idx) => (
            <RatingQuestion
              key={q.key}
              index={idx + 1}
              label={q.label}
              desc={q.desc}
              value={ratings[q.key]}
              hoverValue={hoverState.key === q.key ? hoverState.value : 0}
              onChange={(v) => setRatings(prev => ({ ...prev, [q.key]: v }))}
              onHover={(v) => setHoverState({ key: q.key, value: v })}
              onLeave={() => setHoverState({ key: '', value: 0 })}
            />
          ))}

          {/* comment */}
          <div className="border-t border-slate-100 pt-5">
            <label className="block">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.9} />
                ความคิดเห็นเพิ่มเติม
                <span className="text-[10.5px] text-slate-400 font-normal">(ไม่บังคับ)</span>
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="เช่น ขอบคุณทีม IT ที่แก้ปัญหาเร็วครับ..."
                rows={3}
                maxLength={500}
                className="w-full bg-slate-50/70 border border-slate-200 px-3.5 py-2.5 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] outline-none transition-all text-[13px] text-slate-800 placeholder:text-slate-400 resize-none"
              />
              <p className="text-[10.5px] text-slate-400 mt-1 text-right">{comment.length}/500</p>
            </label>
          </div>

          {/* overall preview */}
          {allRated && (
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50/60 to-blue-50 ring-1 ring-blue-100 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11.5px] text-slate-500 font-medium">คะแนนเฉลี่ยรวม</p>
                <p className="text-[26px] font-black text-[#1E487A] leading-none mt-1 tabular-nums">
                  {overall.toFixed(2)} <span className="text-[14px] text-slate-400 font-medium">/ 5.00</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    className={`h-5 w-5 ${n <= Math.round(overall) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'}`}
                    strokeWidth={1.6}
                  />
                ))}
              </div>
            </div>
          )}
        </form>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-white">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-slate-100 transition-colors"
          >
            ข้ามไปก่อน
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allRated || isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95"
            style={{ background: BRAND.primary, boxShadow: `0 8px 20px ${BRAND.primary}40` }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
                ส่งแบบประเมิน
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Single Rating Question ───────────────────────── */
function RatingQuestion({ index, label, desc, value, hoverValue, onChange, onHover, onLeave }) {
  const displayValue = hoverValue || value;
  const labelText = displayValue > 0 ? RATING_LABELS[displayValue] : '';
  const labelColor = displayValue > 0 ? RATING_COLORS[displayValue] : 'text-slate-300';

  return (
    <div>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-6 h-6 rounded-full bg-[#1E487A]/10 text-[#1E487A] flex items-center justify-center text-[11.5px] font-bold shrink-0 mt-0.5">
          {index}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-slate-800 leading-snug">{label}</p>
          <p className="text-[11.5px] text-slate-400 mt-0.5 leading-snug">{desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-9">
        {/* star buttons */}
        <div className="flex items-center gap-1" onMouseLeave={onLeave}>
          {[1, 2, 3, 4, 5].map(n => {
            const filled = n <= displayValue;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                onMouseEnter={() => onHover(n)}
                className="p-0.5 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    filled
                      ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                      : 'text-slate-200 fill-slate-50 hover:fill-amber-100'
                  }`}
                  strokeWidth={1.6}
                />
              </button>
            );
          })}
        </div>

        {/* label */}
        <span className={`text-[12px] font-semibold transition-colors ${labelColor}`}>
          {labelText}
        </span>
      </div>
    </div>
  );
}
