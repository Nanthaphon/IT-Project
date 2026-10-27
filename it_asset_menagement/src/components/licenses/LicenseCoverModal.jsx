import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Printer, Search } from 'lucide-react';
import { CheckMark, Checkbox } from '../../ui/earthUI.jsx';
import DateField from '../DateField.jsx';
import { formatDateShort } from '../../utils/formatDate.js';
import { licenseCoverItems, printLicenseCover } from '../../utils/printLicenseCover.js';
import { firestoreLicenseCoverStore } from '../../utils/licenseCoverStore.js';

/* ── หน้าต่างพิมพ์ใบคลุมต่ออายุโปรแกรม ─────────────────────────────
   1 แถว = โปรแกรม + ผู้ถือครอง 1 คน · ติ๊กหลายแถว → พิมพ์รวมหน้าเดียวกัน (2 คอลัมน์)
   ติ๊กแล้วกรอก วันที่เริ่ม / วันหมดอายุ / ราคา ได้ — ตั้งต้นราคาจากระบบ วันที่ว่าง (พิมพ์เป็นเส้นจุด)
   ค่าที่กรอกบันทึกอัตโนมัติไว้ที่ store แยก (it_report/license_cover) ไม่แตะข้อมูล License
   โหลดไม่ได้ (ไม่ใช่แอดมิน / ออฟไลน์) → ยังกรอก+พิมพ์ได้ แต่ไม่บันทึก (กันเขียนทับของเดิมด้วยค่าว่าง)
   เปิดจากแถวที่ติ๊กในตาราง → ติ๊กผู้ถือครองคนแรกของแต่ละโปรแกรมไว้ให้ */
const inputCls = 'w-full rounded-lg border border-stone-200/60 bg-white px-3 py-1.5 text-sm outline-none focus:border-clay-600 focus:ring-2 focus:ring-clay-600/15';
const SAVE_DELAY_MS = 800;

const toNum = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(/[,฿\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const SAVE_TEXT = {
  loading: { text: 'กำลังโหลดข้อมูลที่บันทึกไว้…', cls: 'text-stone-500' },
  saving: { text: 'กำลังบันทึก…', cls: 'text-stone-500' },
  saved: { text: 'บันทึกแล้ว', cls: 'text-olive-700' },
  error: { text: 'บันทึกไม่สำเร็จ', cls: 'text-rose-700' },
  readonly: { text: 'บันทึกไม่ได้ (เฉพาะแอดมิน)', cls: 'text-rose-700' },
};

export default function LicenseCoverModal({
  licenses = [], employees = [], initialIds = [], onClose,
  onPrint = printLicenseCover, store = firestoreLicenseCoverStore,
}) {
  const items = useMemo(() => licenseCoverItems(
    [...licenses].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th')),
    employees,
  ), [licenses, employees]);

  const [picked, setPicked] = useState(() => {
    const first = new Set();
    initialIds.forEach((id) => { const it = items.find((x) => x.licenseId === id); if (it) first.add(it.key); });
    return first;
  });
  const [entries, setEntries] = useState({});   // { [key]: { start, expiry, cost } }
  const [saveState, setSaveState] = useState('loading');
  const [q, setQ] = useState('');

  /* โหลดค่าที่เคยกรอก · บันทึกอัตโนมัติหลังหยุดพิมพ์ · ปิดหน้าต่างระหว่างรอ → บันทึกทันที */
  const [loaded, setLoaded] = useState(false);   // false = ห้ามบันทึก (ยังไม่รู้ของเดิม)
  const dirty = useRef(false);
  const latest = useRef(entries);
  const loadedRef = useRef(false);
  useEffect(() => { latest.current = entries; loadedRef.current = loaded; }, [entries, loaded]);

  useEffect(() => {
    let alive = true;
    store.load()
      .then((saved) => { if (!alive) return; setEntries((cur) => ({ ...saved, ...cur })); setLoaded(true); setSaveState('saved'); })
      .catch((err) => { console.warn('[license cover] load failed:', err); if (alive) setSaveState('readonly'); });
    return () => { alive = false; };
  }, [store]);

  useEffect(() => {
    if (!loaded || !dirty.current) return undefined;
    const save = () => {
      dirty.current = false;
      return store.save(latest.current)
        .then(() => setSaveState('saved'))
        .catch((err) => { console.warn('[license cover] save failed:', err); setSaveState('error'); });
    };
    const timer = setTimeout(save, SAVE_DELAY_MS);
    // ปิดหน้าต่าง/แก้ต่อก่อนครบเวลา: ล้าง timer · ถ้ายัง dirty ตอนปิดจริง unmount effect ด้านล่างจะบันทึกให้
    return () => clearTimeout(timer);
  }, [entries, loaded, store]);

  useEffect(() => () => { if (dirty.current && loadedRef.current) store.save(latest.current).catch(() => {}); }, [store]);

  const update = (key, field, value) => {
    dirty.current = true;
    if (loaded) setSaveState('saving');
    setEntries((cur) => ({ ...cur, [key]: { ...cur[key], [field]: value } }));
  };

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

  /* ราคาที่แสดง/พิมพ์: ที่กรอกไว้ก่อน (ลบจนว่าง = ไม่ระบุราคา) ไม่เคยกรอกใช้ราคาจากระบบ */
  const costOf = (it) => (entries[it.key]?.cost !== undefined ? entries[it.key].cost : (it.cost ?? ''));

  const chosen = items.filter((it) => picked.has(it.key));
  const print = () => {
    if (!chosen.length) return;
    onPrint({ items: chosen.map((it) => ({
      ...it,
      start: entries[it.key]?.start || '',
      expiry: entries[it.key]?.expiry || '',
      cost: toNum(costOf(it)),
    })) });
  };

  const status = SAVE_TEXT[saveState];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-950/50 p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="lic-cover-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(22,32,36,0.20)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-clay-600/[0.08] text-clay-600">
            <FileText className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 id="lic-cover-title" className="text-[15px] font-medium text-stone-800">พิมพ์ใบคลุมต่ออายุโปรแกรม</h3>
            <p className="mt-0.5 text-xs text-stone-500">ค่าที่กรอกบันทึกอัตโนมัติ แยกจากข้อมูล License · วันที่เว้นว่างได้</p>
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
            const saved = entries[it.key] || {};
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
                  {!on && saved.expiry && (
                    <span className="shrink-0 text-xs tabular-nums text-stone-500">หมด {formatDateShort(saved.expiry)}</span>
                  )}
                </button>
                {on && (
                  <div className="grid grid-cols-2 gap-3 px-6 pb-3 sm:grid-cols-3 sm:pl-[54px]">
                    <label className="block">
                      <span className="mb-1 block text-xs text-stone-500">วันที่เริ่ม</span>
                      <DateField value={saved.start || ''} onChange={(v) => update(it.key, 'start', v)} inputClassName={`${inputCls} pr-9`} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-stone-500">วันหมดอายุ</span>
                      <DateField value={saved.expiry || ''} onChange={(v) => update(it.key, 'expiry', v)} inputClassName={`${inputCls} pr-9`} />
                    </label>
                    <label className="col-span-2 block sm:col-span-1">
                      <span className="mb-1 block text-xs text-stone-500">ราคา (บาท)</span>
                      <input
                        type="text" inputMode="decimal" value={costOf(it)} placeholder="ไม่ระบุ"
                        onChange={(e) => update(it.key, 'cost', e.target.value.replace(/[^\d.,]/g, ''))}
                        className={`${inputCls} text-right tabular-nums`}
                      />
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2.5 border-t border-stone-100 bg-sand-50 px-6 py-4">
          <span className={`mr-auto text-xs ${status.cls}`} role="status">{status.text}</span>
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
