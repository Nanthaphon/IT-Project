import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

/*
 * DateField — ช่องกรอกวันที่ของทั้งระบบ แสดงผลเป็น วว/ดด/ปปปป (DD/MM/YYYY ค.ศ.) เสมอ
 *
 * - value / onChange เป็น ISO "YYYY-MM-DD" (เหมือน <input type="date"> เดิม — หน้าที่เรียกใช้ไม่ต้องแก้)
 * - พิมพ์เองได้ (เติม / อัตโนมัติ) หรือกดไอคอนปฏิทิน / ดับเบิลคลิกช่อง เพื่อเปิดปฏิทิน
 *
 * ปฏิทินทำเอง (เดิมเปิดปฏิทินของเบราว์เซอร์ ซึ่งตัวเล็ก ภาษาอังกฤษ ปรับธีมไม่ได้)
 * - render ผ่าน portal ลอยเหนือ modal (ไม่ถูก overflow ของ modal ตัด) และพลิกขึ้นบนเองถ้าที่ด้านล่างไม่พอ
 * - คลิกหัวเดือน → ตารางเลือกเดือน/ปี กระโดดไปปีเก่าได้เร็ว (เช่นวันที่ซื้อหลายปีก่อน)
 */

const pad2 = (n) => String(n).padStart(2, '0');
const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const POP_W = 320;   // ความกว้างปฏิทิน (px)
const POP_H = 410;   // ความสูงโดยประมาณ (วัดจริง ~402) — ใช้ตัดสินว่าจะเปิดลงล่างหรือขึ้นบน

function isoToDMY(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function dmyToISO(s) {
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const d = +m[1], mo = +m[2], y = +m[3];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return '';
  return `${y}-${pad2(mo)}-${pad2(d)}`;
}

const toISO = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

function parseISO(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
}

// เติม "/" ให้อัตโนมัติระหว่างพิมพ์ (dd/mm/yyyy)
function autoSlash(v) {
  const digits = v.replace(/\D/g, '').slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += '/' + digits.slice(2, 4);
  if (digits.length > 4) out += '/' + digits.slice(4, 8);
  return out;
}

/* ── ปฏิทิน (popover) ─────────────────────────────────────────────── */
function CalendarPopover({ anchorRef, value, onPick, onClear, onClose }) {
  const sel = parseISO(value);
  const now = new Date();
  const todayISO = toISO(now.getFullYear(), now.getMonth(), now.getDate());

  const [view, setView] = useState(() => ({
    y: sel ? sel.y : now.getFullYear(),
    m: sel ? sel.m : now.getMonth(),
  }));
  const [mode, setMode] = useState('days');   // 'days' | 'months'
  const [pos, setPos] = useState(null);
  const popRef = useRef(null);

  // วางตำแหน่งใต้ช่องกรอก ชิดซ้าย — ที่ล่างไม่พอพลิกขึ้นบน · ไม่ล้นขอบจอ
  const place = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const below = window.innerHeight - r.bottom;
    const top = below >= POP_H + gap || below >= r.top ? r.bottom + gap : r.top - POP_H - gap;
    // ชิดซ้ายของช่องกรอก แต่ไม่ล้นขอบขวา — จอแคบกว่าปฏิทินก็ยังไม่หลุดขอบซ้าย (max ทำทีหลังสุด)
    const left = Math.max(8, Math.min(r.left, window.innerWidth - POP_W - 8));
    setPos({ top: Math.max(8, top), left });
  }, [anchorRef]);

  useLayoutEffect(() => { place(); }, [place]);

  useEffect(() => {
    const onScrollResize = () => place();
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('scroll', onScrollResize, true);
      window.removeEventListener('resize', onScrollResize);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [place, onClose, anchorRef]);

  const shiftMonth = (delta) => setView(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  // ตาราง 6 แถว × 7 วัน เริ่มวันอาทิตย์ — รวมวันของเดือนก่อน/ถัดไปให้เต็มกริด
  const first = new Date(view.y, view.m, 1);
  const start = new Date(view.y, view.m, 1 - first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), iso: toISO(d.getFullYear(), d.getMonth(), d.getDate()) };
  });

  const navBtn = 'flex size-9 items-center justify-center rounded-xl text-stone-500 transition-colors hover:bg-sand-100 hover:text-stone-800';

  if (!pos) return null;
  return createPortal(
    <div
      ref={popRef}
      role="dialog"
      aria-label="เลือกวันที่"
      style={{ top: pos.top, left: pos.left, width: POP_W }}
      className="fixed z-[300] rounded-2xl border border-stone-200/60 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_24px_48px_-12px_rgba(22,32,36,0.22)]"
      onMouseDown={(e) => e.preventDefault()}   /* กันช่องกรอกเสียโฟกัสตอนคลิกในปฏิทิน */
    >
      {/* หัว: เดือน ปี + เลื่อน */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" onClick={() => (mode === 'days' ? shiftMonth(-1) : setView((v) => ({ ...v, y: v.y - 1 })))}
          className={navBtn} aria-label={mode === 'days' ? 'เดือนก่อน' : 'ปีก่อน'}>
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <button type="button" onClick={() => setMode((m) => (m === 'days' ? 'months' : 'days'))}
          className="rounded-xl px-3 py-1.5 text-[15px] font-medium text-stone-800 transition-colors hover:bg-sand-100"
          aria-label="เลือกเดือนและปี">
          {mode === 'days' ? `${TH_MONTHS[view.m]} ${view.y}` : view.y}
        </button>
        <button type="button" onClick={() => (mode === 'days' ? shiftMonth(1) : setView((v) => ({ ...v, y: v.y + 1 })))}
          className={navBtn} aria-label={mode === 'days' ? 'เดือนถัดไป' : 'ปีถัดไป'}>
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {mode === 'days' ? (
        <>
          <div className="grid grid-cols-7">
            {TH_WEEKDAYS.map((w, i) => (
              <div key={w} className={`flex h-8 items-center justify-center text-xs font-medium ${i === 0 ? 'text-rose-400' : 'text-stone-400'}`}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((c) => {
              const inMonth = c.m === view.m;
              const isSel = value && c.iso === value;
              const isToday = c.iso === todayISO;
              return (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => onPick(c.iso)}
                  aria-label={`${c.d} ${TH_MONTHS[c.m]} ${c.y}`}
                  aria-pressed={!!isSel}
                  className={`mx-auto flex size-10 items-center justify-center rounded-xl text-sm tabular-nums transition-colors ${
                    isSel ? 'bg-clay-600 font-medium text-white hover:bg-clay-700'
                    : isToday ? 'font-medium text-clay-700 ring-1 ring-inset ring-clay-600/40 hover:bg-clay-50'
                    : inMonth ? 'text-stone-800 hover:bg-sand-100'
                    : 'text-stone-300 hover:bg-sand-100 hover:text-stone-500'
                  }`}
                >
                  {c.d}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 py-1">
          {TH_MONTHS_SHORT.map((label, m) => {
            const isCur = sel && sel.y === view.y && sel.m === m;
            return (
              <button
                key={label}
                type="button"
                onClick={() => { setView((v) => ({ ...v, m })); setMode('days'); }}
                className={`h-14 rounded-xl text-sm transition-colors ${
                  isCur ? 'bg-clay-600 font-medium text-white hover:bg-clay-700' : 'text-stone-700 hover:bg-sand-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ท้าย: ล้าง / วันนี้ */}
      <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2.5">
        <button type="button" onClick={onClear}
          className="rounded-xl px-3 py-1.5 text-[13px] font-medium text-stone-500 transition-colors hover:bg-sand-100 hover:text-stone-800">
          ล้าง
        </button>
        <button type="button" onClick={() => onPick(todayISO)}
          className="rounded-xl px-3 py-1.5 text-[13px] font-medium text-clay-600 transition-colors hover:bg-clay-50">
          วันนี้
        </button>
      </div>
    </div>,
    document.body,
  );
}

/* ── ช่องกรอก ─────────────────────────────────────────────────────── */
export default function DateField({
  value = '',
  onChange,
  placeholder = 'วว/ดด/ปปปป',
  className = '',
  inputClassName,
}) {
  const [text, setText] = useState(isoToDMY(value));
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // sync เมื่อ value ภายนอกเปลี่ยน
  useEffect(() => { setText(isoToDMY(value)); }, [value]);

  const handleText = (e) => {
    const f = autoSlash(e.target.value);
    setText(f);
    if (f === '') { onChange?.(''); return; }
    const iso = dmyToISO(f);
    if (iso) onChange?.(iso);
  };

  const close = useCallback(() => setOpen(false), []);

  const baseInput = 'w-full border border-stone-200 p-2 rounded-lg text-[13px] pr-9 focus:ring-2 focus:ring-clay-600/30 focus:border-clay-600 outline-none';

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={handleText}
        onDoubleClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); setOpen(true); } }}
        placeholder={placeholder}
        className={inputClassName || baseInput}
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        tabIndex={-1}
        aria-label="เลือกวันที่"
        aria-expanded={open}
        className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-colors ${
          open ? 'bg-clay-50 text-clay-600' : 'text-stone-400 hover:text-clay-600'}`}
      >
        <Calendar className="h-4 w-4" strokeWidth={2} />
      </button>
      {open && (
        <CalendarPopover
          anchorRef={wrapRef}
          value={value}
          onPick={(iso) => { onChange?.(iso); setOpen(false); }}
          onClear={() => { setText(''); onChange?.(''); setOpen(false); }}
          onClose={close}
        />
      )}
    </div>
  );
}
