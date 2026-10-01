import React, { useState } from 'react';
import { ExternalLink, Link2, Plus, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { Popover } from '../../ui/earthUI.jsx';
import { normalizeUrl, hostOf, newLinkId, linkLabel, cleanLinks } from '../../utils/links.js';

/* ── ลิงก์ของพนักงาน (หน้ารายละเอียด แท็บภาพรวม) ─────────────────
   เลือกได้เฉพาะลิงก์ที่ตั้งไว้ในเมนู "ตัวเลือกฟิลด์" (fieldOptions.links)
   คลิกเลือกตัวเลือก = เพิ่มทันที (ใช้ URL ของตัวเลือกนั้น ไม่ต้องยืนยันซ้ำ)
   บันทึกลง employees/{id}.links ทันที (ไม่มีปุ่มบันทึกแยก) — ฟิลด์เดียวกับที่พนักงานเห็น/แก้ในหน้า "ข้อมูลของฉัน"
   ลิงก์ที่พนักงานเพิ่มเองไม่มี id → อ้างแถวด้วยลำดับ (index) แทน

   @param {object} employee   เอกสารพนักงาน (ต้องเป็นตัวสดจาก snapshot ลิงก์ถึงอัปเดตตาม)
   @param {array}  options    fieldOptions.links = [{ id, name, url }]
   @param {func}   save       (optional) แทนการเขียน Firestore — ใช้ในหน้า preview */
export default function EmployeeLinks({ employee, options = [], save }) {
  const links = Array.isArray(employee?.links) ? employee.links : [];
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const write = async (next) => {
    setBusy(true); setError('');
    try {
      if (save) await save(next);
      else await updateDoc(doc(db, 'employees', employee.id), { links: cleanLinks(next) });
      return true;
    } catch (err) {
      setError(err?.message || 'บันทึกไม่สำเร็จ');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const closePicker = () => { setOpen(false); setError(''); };

  // เลือกตัวเลือก = เพิ่มลิงก์ทันที
  const pick = async (opt) => {
    const url = normalizeUrl(opt.url || '');
    if (!url) { setError('ลิงก์นี้ยังไม่ได้ตั้ง URL'); return; }
    const ok = await write([...links, {
      id: newLinkId(), optionId: opt.id, label: opt.name, url, addedAt: Date.now(),
    }]);
    if (ok) closePicker();
  };

  const remove = (idx) => write(links.filter((_, i) => i !== idx));

  const usedOptionIds = new Set(links.map((l) => l.optionId));

  return (
    <section className="rounded-2xl border border-stone-200/60 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5">
        <h2 className="text-[15px] font-medium text-stone-800">
          ลิงก์ {links.length > 0 && <span className="tabular-nums text-stone-400">{links.length}</span>}
        </h2>
        <Popover
          open={open} onClose={closePicker} width="w-80"
          trigger={
            <button type="button" onClick={() => (open ? closePicker() : setOpen(true))}
              aria-haspopup="dialog" aria-expanded={open}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200/60 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-clay-200 hover:bg-clay-50 hover:text-clay-700">
              <Plus className="size-3.5" strokeWidth={2} /> เพิ่มลิงก์
            </button>
          }
        >
          {options.length === 0 ? (
            <p className="px-3 py-4 text-center text-[13px] text-stone-400">
              ยังไม่มีลิงก์ให้เลือก<br />เพิ่มได้ที่เมนู <span className="font-medium text-stone-600">ตัวเลือกฟิลด์</span>
            </p>
          ) : (
            <>
              <div role="listbox" className="max-h-72 overflow-y-auto">
                {options.map((opt) => {
                  const used = usedOptionIds.has(opt.id);
                  return (
                    <button key={opt.id} type="button" disabled={used || busy} onClick={() => pick(opt)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors enabled:hover:bg-stone-50 disabled:cursor-default">
                      <Link2 className={`size-4 shrink-0 ${used ? 'text-stone-300' : 'text-stone-400'}`} strokeWidth={2} />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${used ? 'text-stone-400' : 'text-stone-800'}`}>{opt.name}</span>
                        <span className="block truncate text-[11px] text-stone-400">{hostOf(opt.url)}</span>
                      </span>
                      {used && <span className="shrink-0 text-[11px] text-stone-400">เพิ่มแล้ว</span>}
                    </button>
                  );
                })}
              </div>
              {error && <p className="px-3 pb-2 pt-1 text-xs text-rose-700">{error}</p>}
            </>
          )}
        </Popover>
      </header>

      {links.length === 0 ? (
        <p className="px-5 py-4 text-[13px] text-stone-400">ยังไม่มีลิงก์</p>
      ) : (
        <ul>
          {links.map((l, idx) => (
            <li key={l.id || `${idx}-${l.url}`} className="group flex items-center gap-3 border-t border-stone-100 px-5 py-3 first:border-t-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-clay-600/[0.08] text-clay-600">
                <Link2 className="size-4" strokeWidth={2} />
              </div>
              <a href={l.url} target="_blank" rel="noopener noreferrer" title={l.url} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900 transition-colors group-hover:text-clay-600">{linkLabel(l)}</p>
                <p className="truncate text-xs text-stone-400">{hostOf(l.url) || l.url}</p>
              </a>
              <div className="flex shrink-0 items-center gap-0.5">
                <IconBtn title="ลบลิงก์" tone="danger" onClick={() => remove(idx)} disabled={busy}><X className="size-3.5" strokeWidth={2} /></IconBtn>
                {/* จอแคบซ่อนไว้ — แตะที่ชื่อก็เปิดลิงก์ได้อยู่แล้ว ชื่อจะได้ไม่ถูกบีบ */}
                <a href={l.url} target="_blank" rel="noopener noreferrer" title="เปิดลิงก์"
                  className="ml-1 hidden items-center sm:inline-flex gap-1.5 rounded-lg border border-stone-200/60 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-clay-200 hover:bg-clay-50 hover:text-clay-700">
                  <ExternalLink className="size-3.5" strokeWidth={2} /> เปิด
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && !open && <p className="border-t border-stone-100 px-5 py-2 text-xs text-rose-700">{error}</p>}
    </section>
  );
}

function IconBtn({ title, onClick, disabled, tone, children }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled}
      className={`rounded-lg p-1.5 text-stone-300 transition-colors disabled:opacity-50 ${
        tone === 'danger' ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-stone-100 hover:text-stone-600'}`}>
      {children}
    </button>
  );
}
