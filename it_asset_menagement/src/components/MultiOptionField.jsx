import React from 'react';
import { X } from 'lucide-react';
import FieldOptionSelect from './FieldOptionSelect.jsx';
import { toBrands } from '../utils/brands.js';

/* เลือกได้หลายค่า (เช่น แบรนด์ที่ดูแล) — ค่าที่เลือกเป็นชิป กด × เอาออก · ช่องด้านล่างเลือก/พิมพ์เพิ่ม
   onChange คืนอาร์เรย์ใหม่ทั้งชุด */
export default function MultiOptionField({ value, onChange, options = [], placeholder = 'เลือกเพิ่ม...' }) {
  const list = toBrands(value);
  const add = (v) => {
    const t = String(v || '').trim();
    if (t && !list.includes(t)) onChange([...list, t]);
  };
  return (
    <div className="space-y-2">
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {list.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 rounded-lg bg-clay-50 py-1 pl-2.5 pr-1 text-[13px] font-medium text-clay-700">
              {b}
              <button type="button" onClick={() => onChange(list.filter((x) => x !== b))} aria-label={`เอา ${b} ออก`}
                className="flex size-5 items-center justify-center rounded-md text-clay-600 transition-colors hover:bg-clay-100">
                <X className="size-3.5" strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}
      <FieldOptionSelect value="" onChange={add} options={options.filter((o) => !list.includes(o))} placeholder={placeholder} />
    </div>
  );
}
