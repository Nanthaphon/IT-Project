import React, { useMemo, useState } from 'react';
import { FileText, Printer, Search } from 'lucide-react';
import { CheckMark, Checkbox } from '../../ui/earthUI.jsx';
import { formatDateShort } from '../../utils/formatDate.js';
import { printLicenseCover } from '../../utils/printLicenseCover.js';

/* ── หน้าต่างพิมพ์ใบคลุมต่ออายุโปรแกรม ─────────────────────────────
   ติ๊กโปรแกรมที่จะพิมพ์ (ตั้งต้นจากที่ติ๊กไว้ในตาราง หรือว่างถ้าเปิดจากปุ่มบนแถบ)
   1 โปรแกรม = 1 หน้า · เลือก ≥ 2 มีหน้าสรุปรวมด้านหน้า (ปิดได้)
   พิมพ์ผ่าน printViaIframe → กล่องพิมพ์ของเบราว์เซอร์เลือก "บันทึกเป็น PDF" ได้ */
export default function LicenseCoverModal({ licenses = [], employees = [], initialIds = [], onClose, onPrint = printLicenseCover }) {
  const sorted = useMemo(() => [...licenses].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'th')), [licenses]);
  const [picked, setPicked] = useState(() => new Set(initialIds.filter((id) => licenses.some((l) => l.id === id))));
  const [q, setQ] = useState('');
  const [withSummary, setWithSummary] = useState(true);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? sorted.filter((l) => `${l.name || ''} ${l.supplier || ''}`.toLowerCase().includes(s)) : sorted;
  }, [sorted, q]);

  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allShown = shown.length > 0 && shown.every((l) => picked.has(l.id));
  const someShown = shown.some((l) => picked.has(l.id));
  const toggleShown = (on) => setPicked((p) => {
    const n = new Set(p);
    shown.forEach((l) => (on ? n.add(l.id) : n.delete(l.id)));
    return n;
  });

  const chosen = sorted.filter((l) => picked.has(l.id));
  const print = () => {
    if (!chosen.length) return;
    onPrint({ licenses: chosen, employees, withSummary: withSummary && chosen.length > 1 });
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
            <p className="mt-0.5 text-xs text-stone-500">1 โปรแกรมต่อหน้า · ผู้ใช้งาน วันที่เริ่ม วันหมดอายุ ราคา</p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-3">
          <Checkbox checked={allShown} indeterminate={!allShown && someShown} onChange={toggleShown} label="เลือกทั้งหมด" />
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" strokeWidth={2} />
            <input
              type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาโปรแกรม / Supplier"
              className="w-full rounded-lg border border-stone-200/60 bg-white py-2 pl-9 pr-3 text-sm text-stone-700 outline-none placeholder:text-stone-400 focus:border-clay-600/40 focus:ring-2 focus:ring-clay-600/10"
            />
          </div>
        </div>

        <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto" aria-label="รายการโปรแกรม">
          {shown.length === 0 && <li className="px-6 py-10 text-center text-sm text-stone-500">ไม่พบโปรแกรม</li>}
          {shown.map((l) => {
            const on = picked.has(l.id);
            const users = (l.assignees || []).length;
            return (
              <li key={l.id}>
                <button
                  type="button" role="checkbox" aria-checked={on} onClick={() => toggle(l.id)}
                  className={`flex w-full items-center gap-3 px-6 py-3 text-left transition-colors ${on ? 'bg-clay-50/60' : 'hover:bg-sand-50'}`}
                >
                  <CheckMark checked={on} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-stone-800">{l.name || '-'}</span>
                    <span className="block truncate text-xs text-stone-500">
                      {[l.supplier, `ผู้ใช้ ${users} คน`].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs tabular-nums text-stone-500">
                    {l.expirationDate ? `หมด ${formatDateShort(l.expirationDate)}` : 'ไม่ระบุวันหมดอายุ'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 bg-sand-50 px-6 py-4">
          {chosen.length > 1 && (
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-stone-600">
              <input type="checkbox" checked={withSummary} onChange={(e) => setWithSummary(e.target.checked)} className="size-4 accent-clay-600" />
              หน้าสรุปรวม
            </label>
          )}
          <div className="ml-auto flex gap-2.5">
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
    </div>
  );
}
