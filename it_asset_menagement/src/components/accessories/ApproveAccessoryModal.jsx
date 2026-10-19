import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, Package, PlusCircle, RotateCcw } from 'lucide-react';
import DateField from '../DateField.jsx';
import { getAvailableItems } from '../../utils/accessoryItems.js';
import { formatDateShort } from '../../utils/formatDate.js';

/* ── หน้าต่างอนุมัติคำขออุปกรณ์เสริม — เลือกว่าจะให้ชิ้นไหนในสต็อก ──────────
   เดิมกดอนุมัติแล้วระบบหยิบชิ้นแรกในสต็อกให้เอง IT เลือก SN ที่จะส่งมอบจริงไม่ได้
   ตอนนี้เลือกชิ้นได้ (ครบตามจำนวนที่ขอ) · ยืม/เบิก สลับได้ · ยืมแก้วันคืนได้
   ส่ง pickedItems = [{ index, sn }] ให้ handleUpdateAccessoryRequestStatus
   (sn ไว้ตรวจซ้ำว่ายังเป็นชิ้นเดิม ถ้าระหว่างนั้นมีคนเบิกชิ้นอื่นไป — ดู takeItems) */
export default function ApproveAccessoryModal({ req, accessory, onClose, onConfirm }) {
  const qty = Math.max(1, Number(req?.quantity || 1));
  const items = useMemo(() => getAvailableItems(accessory), [accessory]);
  const isReplace = req?.requestType === 'replace';

  const [type, setType] = useState(req?.requestType === 'borrow' ? 'borrow' : 'request');
  const [returnDate, setReturnDate] = useState(req?.returnDate || '');
  const [picked, setPicked] = useState(() => items.slice(0, qty).map((_, i) => i));
  const [busy, setBusy] = useState(false);

  const toggle = (i) => setPicked((p) => {
    if (p.includes(i)) return p.filter((x) => x !== i);
    if (qty === 1) return [i];                 // ขอชิ้นเดียว = กดแล้วสลับเลย
    return p.length >= qty ? p : [...p, i];    // ครบแล้วต้องเอาออกก่อน
  });

  const short = items.length < qty;
  const ready = !short && picked.length === qty && !(type === 'borrow' && !returnDate);

  const confirm = async () => {
    if (!ready || busy) return;
    setBusy(true);
    const meta = isReplace
      ? { requestType: 'request' }   // คงพฤติกรรมเดิมของปุ่มอนุมัติกับคำขอเปลี่ยน
      : type === 'borrow' ? { requestType: 'borrow', returnDate } : { requestType: 'request' };
    meta.pickedItems = [...picked].sort((a, b) => a - b).map((i) => ({ index: i, sn: items[i]?.sn || '' }));
    try { await onConfirm(meta); } finally { setBusy(false); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-950/50 p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="approve-acc-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(22,32,36,0.20)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* หัว */}
        <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-5">
          {accessory?.image ? (
            <img src={accessory.image} alt="" className="size-11 shrink-0 rounded-xl border border-stone-200/60 bg-white object-contain p-1" />
          ) : (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-clay-600/[0.08] text-clay-600">
              <Package className="size-5" strokeWidth={2} />
            </div>
          )}
          <div className="min-w-0">
            <h3 id="approve-acc-title" className="truncate text-[15px] font-medium text-stone-800">
              อนุมัติ · {req?.accessoryName}{qty > 1 && <span className="text-stone-400"> × {qty}</span>}
            </h3>
            <p className="mt-0.5 truncate text-xs text-stone-500">
              ให้ {req?.empName}{req?.nickname ? ` (${req.nickname})` : ''}{req?.department ? ` · ${req.department}` : ''}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* เบิก / ยืม */}
          {!isReplace && (
            <div>
              <p className="mb-2 text-[13px] font-medium text-stone-500">รูปแบบ</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'request', label: 'เบิก', hint: 'ให้ถาวร', icon: PlusCircle },
                  { key: 'borrow', label: 'ยืม', hint: 'มีกำหนดคืน', icon: RotateCcw },
                ].map((o) => (
                  <button
                    key={o.key} type="button" onClick={() => setType(o.key)} aria-pressed={type === o.key}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      type === o.key ? 'border-clay-600 bg-clay-50 ring-2 ring-clay-600/10' : 'border-stone-200/60 hover:border-stone-300'}`}
                  >
                    <o.icon className={`size-4 shrink-0 ${type === o.key ? 'text-clay-600' : 'text-stone-400'}`} strokeWidth={2} />
                    <span>
                      <span className="block text-sm font-medium text-stone-800">{o.label}</span>
                      <span className="block text-[11px] text-stone-400">{o.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              {type === 'borrow' && (
                <div className="mt-3">
                  <label className="mb-1 block text-[13px] font-medium text-stone-500">วันที่ต้องคืน</label>
                  <DateField value={returnDate} onChange={setReturnDate}
                    inputClassName="w-full rounded-xl border border-stone-200/60 bg-white px-3 py-2 pr-9 text-sm outline-none focus:border-clay-600 focus:ring-2 focus:ring-clay-600/15" />
                  {!returnDate && <p className="mt-1 text-xs text-rose-700">ระบุวันที่ต้องคืนก่อนอนุมัติ</p>}
                </div>
              )}
            </div>
          )}

          {/* เลือกชิ้น */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-[13px] font-medium text-stone-500">
                เลือกชิ้นที่จะให้{qty > 1 && ` (${picked.length}/${qty})`}
              </p>
              <span className="text-xs text-stone-400">ในสต็อก {items.length} ชิ้น</span>
            </div>

            {items.length === 0 ? (
              <p className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2} /> ไม่มีของในสต็อก — เพิ่มสต็อกที่เมนูอุปกรณ์เสริมก่อน
              </p>
            ) : (
              <>
                {short && (
                  <p className="mb-2 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2} /> สต็อกมี {items.length} ชิ้น ไม่พอตามที่ขอ ({qty} ชิ้น)
                  </p>
                )}
                <ul className="space-y-2" role="listbox" aria-multiselectable={qty > 1}>
                  {items.map((it, i) => {
                    const on = picked.includes(i);
                    const full = !on && qty > 1 && picked.length >= qty;
                    return (
                      <li key={i}>
                        <button
                          type="button" role="option" aria-selected={on} disabled={full} onClick={() => toggle(i)}
                          className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            on ? 'border-clay-600 bg-clay-50/60' : 'border-stone-200/60 enabled:hover:border-stone-300 enabled:hover:bg-stone-50/60'}`}
                        >
                          <span className={`mt-0.5 flex size-[18px] shrink-0 items-center justify-center border transition-colors ${
                            qty === 1 ? 'rounded-full' : 'rounded-md'} ${on ? 'border-clay-600 bg-clay-600 text-white' : 'border-stone-300 bg-white'}`}>
                            {on && <Check className="size-3" strokeWidth={2} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-stone-800">
                              {it.sn ? <span className="font-mono">SN {it.sn}</span> : `ชิ้นที่ ${i + 1}`}
                              {!it.sn && <span className="ml-1.5 text-xs font-normal text-stone-400">ไม่มี SN</span>}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-stone-500">
                              {[it.model, it.purchaseDate && `ซื้อ ${formatDateShort(it.purchaseDate)}`,
                                it.warrantyDate && `ประกันถึง ${formatDateShort(it.warrantyDate)}`].filter(Boolean).join(' · ') || 'ไม่มีข้อมูลเพิ่มเติม'}
                            </span>
                          </span>
                          {it.cost && (
                            <span className="shrink-0 text-xs font-medium tabular-nums text-stone-500">฿{Number(it.cost).toLocaleString('th-TH')}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* ท้าย */}
        <div className="flex justify-end gap-2.5 border-t border-stone-100 bg-sand-50 px-6 py-4">
          <button onClick={onClose}
            className="rounded-xl border border-stone-200/60 bg-white px-4 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-50">
            ยกเลิก
          </button>
          <button onClick={confirm} disabled={!ready || busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-olive-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-olive-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
            <Check className="size-4" strokeWidth={2} /> {busy ? 'กำลังอนุมัติ...' : type === 'borrow' && !isReplace ? 'อนุมัติให้ยืม' : 'อนุมัติให้เบิก'}
          </button>
        </div>
      </div>
    </div>
  );
}
