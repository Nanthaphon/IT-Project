import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, Plus, X } from 'lucide-react';

/**
 * FieldOptionSelect — Beautiful combobox dropdown
 *
 * Drop-in replacement for <input list> + <datalist> และ <select>
 *
 * Props:
 * - value:        ค่าปัจจุบัน
 * - onChange:     (v: string) => void   หรือ  (e: { target: { name, value } }) => void
 * - options:      array of string  ['DX', 'HR', ...]
 * - placeholder:  ข้อความเมื่อยังไม่เลือก
 * - name:         (optional) ใช้กับ event-style onChange
 * - allowCustom:  ให้พิมพ์ค่าใหม่ได้ (default: true) — false = ต้องเลือกจาก options เท่านั้น
 * - required:     attribute สำหรับ form validation
 * - disabled:     disable ทั้ง field
 * - icon:         (optional) lucide icon component แสดงด้านซ้าย
 */
export default function FieldOptionSelect({
  value = '',
  onChange,
  options = [],
  placeholder = 'เลือก...',
  name,
  allowCustom = true,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  /* ── click outside ตั้งใจปิด ─────────────────────── */
  useEffect(() => {
    function onClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  /* ── focus search เมื่อเปิด ─────────────────────── */
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* ── กรอง options ตาม query ─────────────────────── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => String(o).toLowerCase().includes(q));
  }, [options, query]);

  /* ── exact match → ซ่อนปุ่ม "สร้างใหม่" ─────────── */
  const exactMatch = useMemo(() => {
    const q = query.trim();
    return q && options.some(o => String(o).toLowerCase() === q.toLowerCase());
  }, [options, query]);

  const emit = (v) => {
    if (typeof onChange === 'function') {
      // รองรับทั้ง 2 รูปแบบ
      if (name) {
        onChange({ target: { name, value: v } });
      } else {
        onChange(v);
      }
    }
  };

  const handleSelect = (v) => {
    emit(v);
    setOpen(false);
    setQuery('');
    setHighlight(-1);
  };

  const handleCreate = () => {
    const v = query.trim();
    if (v) handleSelect(v);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    emit('');
  };

  /* ── keyboard navigation ─────────────────────────── */
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight >= 0 && filtered[highlight]) {
        handleSelect(filtered[highlight]);
      } else if (allowCustom && query.trim() && !exactMatch) {
        handleCreate();
      } else if (filtered.length === 1) {
        handleSelect(filtered[0]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  /* ── scroll highlight into view ─────────────────── */
  useEffect(() => {
    if (highlight >= 0 && listRef.current) {
      const item = listRef.current.querySelector(`[data-idx="${highlight}"]`);
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlight]);

  const hasValue = value && String(value).length > 0;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`
          group w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm text-left
          transition-all duration-150 flex items-center gap-2
          ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' :
            open
              ? 'border-[#1E487A] ring-2 ring-[#1E487A]/15 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
          }
        `}
      >
        {Icon && (
          <Icon
            className={`h-4 w-4 shrink-0 ${open ? 'text-[#1E487A]' : 'text-slate-400'}`}
            strokeWidth={1.9}
          />
        )}

        <span className={`flex-1 truncate ${hasValue ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
          {hasValue ? value : placeholder}
        </span>

        {hasValue && !disabled && (
          <span
            onClick={handleClear}
            role="button"
            tabIndex={-1}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100"
            title="ล้างค่า"
          >
            <X className="h-3.5 w-3.5 text-slate-400 hover:text-rose-500" strokeWidth={2} />
          </span>
        )}

        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-[#1E487A]' : ''}`}
          strokeWidth={2}
        />
      </button>

      {/* hidden input สำหรับ form validation */}
      {required && (
        <input
          type="text"
          required
          value={value || ''}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
        />
      )}

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl shadow-slate-950/10 ring-1 ring-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Search input */}
          <div className="relative border-b border-slate-100">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" strokeWidth={2} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
              onKeyDown={handleKeyDown}
              placeholder={allowCustom ? 'ค้นหา หรือพิมพ์เพื่อสร้างใหม่...' : 'ค้นหา...'}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* List */}
          <div
            ref={listRef}
            className="max-h-56 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {filtered.length === 0 && !allowCustom && (
              <div className="px-3 py-6 text-center text-[12.5px] text-slate-400">
                ไม่พบรายการ
              </div>
            )}

            {filtered.length === 0 && allowCustom && !query.trim() && (
              <div className="px-3 py-6 text-center text-[12.5px] text-slate-400">
                ยังไม่มีตัวเลือก — พิมพ์เพื่อสร้างใหม่
              </div>
            )}

            {filtered.map((opt, idx) => {
              const isSelected = opt === value;
              const isHighlighted = idx === highlight;
              return (
                <button
                  key={opt}
                  type="button"
                  data-idx={idx}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => handleSelect(opt)}
                  className={`
                    w-full px-3 py-2 text-[13px] text-left flex items-center justify-between gap-2 transition-colors
                    ${isHighlighted ? 'bg-blue-50/70' : ''}
                    ${isSelected ? 'text-[#1E487A] font-semibold' : 'text-slate-700'}
                  `}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[#1E487A] shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}

            {/* Create new option */}
            {allowCustom && query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreate}
                onMouseEnter={() => setHighlight(-1)}
                className="w-full px-3 py-2 text-[13px] text-left flex items-center gap-2 text-emerald-700 hover:bg-emerald-50/60 border-t border-slate-100 mt-1 pt-2.5"
              >
                <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                  <Plus className="h-3 w-3 text-emerald-600" strokeWidth={2.5} />
                </div>
                <span className="truncate">
                  สร้างใหม่: <span className="font-semibold">"{query.trim()}"</span>
                </span>
              </button>
            )}
          </div>

          {/* Footer hint */}
          {filtered.length > 5 && (
            <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {filtered.length} รายการ
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">↑↓</kbd>
                เลื่อน
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">⏎</kbd>
                เลือก
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
