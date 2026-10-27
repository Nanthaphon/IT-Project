import React, { useMemo, useState } from 'react';
import { FileText, Printer, Search } from 'lucide-react';
import { CheckMark, Checkbox } from '../../ui/earthUI.jsx';
import DateField from '../DateField.jsx';
import { licenseCoverItems, printLicenseCover } from '../../utils/printLicenseCover.js';

/* ── หน้าต่างพิมพ์ใบคลุมต่ออายุโปรแกรม ─────────────────────────────
   1 แถว = โปรแกรม + ผู้ถือครอง 1 คน · ติ๊กหลายแถว → พิมพ์รวมหน้าเดียวกัน (2 คอลัมน์)
   วันที่เริ่ม / หมดอายุ กรอกเองใต้แถวที่ติ๊ก (ไม่ดึงจากระบบ) — เว้นว่างได้ จะพิมพ์เป็นเส้นจุดไว้เขียนมือ
   เปิดจากแถวที่ติ๊กในตาราง → ติ๊กผู้ถือครองคนแรกของแต่ละโปรแกรมไว้ให้
   พิมพ์ผ่าน printViaIframe → กล่องพิมพ์ของเบราว์เซอร์เลือก "บันทึกเป็น PDF" ได้ */
const dateCls = 'w-full rounded-lg border border-stone-200/60 bg-white px-3 py-1.5 pr-9 text-sm outline-none focus:border-clay-600 focus:ring-2 focus:ring-clay-600/15';

export default function LicenseCoverModal({ licenses = [], employees = [], initialIds = [], onClose, onPrint = printLicenseCover }) {
  const items = useMemo(() => licenseCoverItems(
    [...licenses].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th')),
    employees,
  ), [licenses, employees]);

  const [picked, setPicked] = useState(() => {
    const first = new Set();
    initialIds.forEach((id) => { const it = items.find((x) => x.licenseId === id); if (it) first.add(it.key); });
    return first;
  });
  const [dates, setDates] = useState({});   // { [key]: { start, expiry } }
  const [q, setQ] = useState('');

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((it) => `${it.license.name || ''} ${it.license.supplier || ''} ${it.holder} ${it.holderSub}`.toLowerCase().includes(s)) : items;
  }, [items, q]);

  const toggle = (key) => setPicked((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const allShown = shown.length > 0 && shown.every((it) => picked.has(it.key));
  const someShown = shown.some((it) => picked.has(it.key));
  const toggleShown = (on) => setPicked((p) => {
    const n = new Set(p);
    shown.forEach((it) => (on ? n.add(it.key) : n.delete(it.key)));
    return n;
  });
  const setDate = (key, field, v) => setDates((d) => ({ ...d, [key]: { ...d[key], [field]: v } }));

  const chosen = items.filter((it) => picked.has(it.key));
  const print = () => {
    if (!chosen.length) return;
    onPrint({ items: chosen.map((it) => ({ ...it, start: dates[it.key]?.start || '', expiry: dates[it.key]?.expiry || '' })) });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-950/50 p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="lic-cover-title"
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(22,32,36,0.20)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-clay-600/[0.08] text-clay-600">
            <FileText className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 id="lic-cover-title" className="text-[15px] font-medium text-stone-800">พิมพ์ใบคลุมต่ออายุโปรแกรม</h3>
            <p className="mt-0.5 text-xs text-stone-500">เลือกหลายรายการ พิมพ์รวมในหน้าเดียวกัน · วันที่เว้นว่างได้</p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-3">
          <Checkbox checked={allShown} indeterminate={!allShown && someShown} onChange={toggleShown} label="เลือกทั้งหมด" />
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" strokeWidth={2} />
            <input
              type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาโปรแกรม / ผู้ถือครอง"
              className="w-full rounded-lg border border-stone-200/60 bg-white py-2 pl-9 pr-3 text-sm text-stone-700 outline-none placeholder:text-stone-400 focus:border-clay-600/40 focus:ring-2 focus:ring-clay-600/10"
            />
          </div>
        </div>

        <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto" aria-label="รายการใบคลุม">
          {shown.length === 0 && <li className="px-6 py-10 text-center text-sm text-stone-500">ไม่พบรายการ</li>}
          {shown.map((it) => {
            const on = picked.has(it.key);
            return (
              <li key={it.key} className={on ? 'bg-clay-50/60' : ''}>
                <button
                  type="button" role="checkbox" aria-checked={on} onClick={() => toggle(it.key)}
                  className={`flex w-full items-center gap-3 px-6 py-3 text-left transition-colors ${on ? '' : 'hover:bg-sand-50'}`}
                >
                  <CheckMark checked={on} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-stone-800">{it.license.name || '-'}</span>
                    <span className="block truncate text-xs text-stone-500">
                      {it.holder ? [it.holder, it.holderSub, it.department].filter(Boolean).join(' · ') : 'ยังไม่มีผู้ถือครอง'}
                    </span>
                  </span>
                </button>
                {on && (
                  <div className="grid grid-cols-2 gap-3 px-6 pb-3 pl-[54px]">
                    <label className="block">
                      <span className="mb-1 block text-xs text-stone-500">วันที่เริ่ม</span>
                      <DateField value={dates[it.key]?.start || ''} onChange={(v) => setDate(it.key, 'start', v)} inputClassName={dateCls} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-stone-500">วันหมดอายุ</span>
                      <DateField value={dates[it.key]?.expiry || ''} onChange={(v) => setDate(it.key, 'expiry', v)} inputClassName={dateCls} />
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end gap-2.5 border-t border-stone-100 bg-sand-50 px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-stone-200/60 bg-white px-4 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-50">
            ปิด
          </button>
          <button type="button" onClick={print} disabled={!chosen.length}
            className="inline-flex items-center gap-1.5 rounded-lg bg-clay-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500">
            <Printer className="size-4" strokeWidth={2} /> พิมพ์ / PDF{chosen.length > 0 && ` (${chosen.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
