import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

/*
 * DateField — ช่องกรอกวันที่ที่ "แสดงผลเป็น วว/ดด/ปปปป (DD/MM/YYYY)" เสมอ
 * ไม่ขึ้นกับ locale ของเบราว์เซอร์ (native <input type="date"> จะโชว์ MM/DD/YYYY
 * บนเครื่อง en-US ซึ่งบังคับด้วย attribute ไม่ได้)
 *
 * - value / onChange ยังเป็น ISO "YYYY-MM-DD" เหมือน <input type="date"> เดิม
 * - พิมพ์เองได้ (เติม / อัตโนมัติ) หรือกดปุ่มปฏิทินเพื่อเปิดตัวเลือกวันที่ของระบบ
 */

const pad2 = (n) => String(n).padStart(2, '0');

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

// เติม "/" ให้อัตโนมัติระหว่างพิมพ์ (dd/mm/yyyy)
function autoSlash(v) {
  const digits = v.replace(/\D/g, '').slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += '/' + digits.slice(2, 4);
  if (digits.length > 4) out += '/' + digits.slice(4, 8);
  return out;
}

export default function DateField({
  value = '',
  onChange,
  placeholder = 'วว/ดด/ปปปป',
  className = '',
  inputClassName,
}) {
  const [text, setText] = useState(isoToDMY(value));
  const nativeRef = useRef(null);

  // sync เมื่อ value ภายนอกเปลี่ยน (แต่ไม่ทับตอนกำลังพิมพ์ค่าที่ยังไม่ครบ)
  useEffect(() => { setText(isoToDMY(value)); }, [value]);

  const handleText = (e) => {
    const f = autoSlash(e.target.value);
    setText(f);
    if (f === '') { onChange?.(''); return; }
    const iso = dmyToISO(f);
    if (iso) onChange?.(iso);
  };

  const openPicker = () => {
    const el = nativeRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return; } catch { /* fallback */ }
    }
    el.focus();
    el.click();
  };

  const baseInput = 'w-full border border-slate-200 p-2 rounded-lg text-[13px] pr-9 focus:ring-2 focus:ring-[#1E487A]/30 focus:border-[#1E487A] outline-none';

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={handleText}
        placeholder={placeholder}
        className={inputClassName || baseInput}
      />
      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        aria-label="เลือกวันที่"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#1E487A] transition-colors"
      >
        <Calendar className="h-4 w-4" strokeWidth={2} />
      </button>
      {/* native date input ซ่อนไว้ ใช้เฉพาะเปิดปฏิทินของระบบ */}
      <input
        ref={nativeRef}
        type="date"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-0 h-0 opacity-0 pointer-events-none"
      />
    </div>
  );
}
