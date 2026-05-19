import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * ComboBox — searchable dropdown that also accepts free-text input.
 *
 * Props:
 *   value       {string}   controlled value
 *   onChange    {fn}       called as onChange({ target: { name, value } })
 *   options     {string[]} list of suggestions
 *   name        {string}   form field name (forwarded in synthetic events)
 *   placeholder {string}
 *   className   {string}   applied to the <input> (pass your existing inputCls)
 */
export default function ComboBox({
  value = '',
  onChange,
  options = [],
  name = '',
  placeholder = 'เลือกหรือพิมพ์ใหม่',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* filtered list while user types */
  const query = value ?? '';
  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  /* select an option from the dropdown */
  const handleSelect = (opt) => {
    onChange({ target: { name, value: opt } });
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === 'ArrowDown' && !isOpen) setIsOpen(true);
    if (e.key === 'Enter' && isOpen && filtered.length > 0) {
      handleSelect(filtered[0]);
      e.preventDefault();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* ── Input row ── */}
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
        style={{ paddingRight: '2.25rem' }}
      />

      {/* ── Chevron button ── */}
      <button
        type="button"
        tabIndex={-1}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsOpen((prev) => !prev);
          inputRef.current?.focus();
        }}
        className="absolute inset-y-0 right-0 w-9 flex items-center justify-center text-slate-400 hover:text-[#1E487A] transition-colors"
      >
        <ChevronDown
          size={15}
          strokeWidth={2.2}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Dropdown panel ── */}
      {isOpen && options.length > 0 && (
        <div className="absolute z-[200] top-[calc(100%+4px)] left-0 right-0 bg-white rounded-xl shadow-xl shadow-slate-950/10 ring-1 ring-slate-200 overflow-hidden">
          <div className="max-h-52 overflow-y-auto scrollbar-hide py-1">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors ${
                    opt === value
                      ? 'bg-[#1E487A]/[.07] text-[#1E487A] font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {/* checkmark column — fixed width so text stays aligned */}
                  <span className="w-3.5 shrink-0 flex items-center justify-center">
                    {opt === value && (
                      <Check size={13} strokeWidth={2.5} className="text-[#1E487A]" />
                    )}
                  </span>
                  {opt}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-[12px] text-slate-400 text-center italic">
                ไม่พบตัวเลือก — พิมพ์เพื่อเพิ่มใหม่
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
