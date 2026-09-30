import React, { useState } from 'react';
import { Check, ChevronLeft, Copy, ExternalLink, Link2, Pencil, Plus, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { Popover } from '../../ui/earthUI.jsx';
import { normalizeUrl, hostOf, newLinkId, linkLabel, cleanLinks } from '../../utils/links.js';

/* ── ลิงก์ของพนักงาน (หน้ารายละเอียด แท็บภาพรวม) ─────────────────
   เลือกได้เฉพาะลิงก์ที่ตั้งไว้ในเมนู "ตัวเลือกฟิลด์" (fieldOptions.links)
   ตอนเลือกแก้ URL ได้ก่อนกดเพิ่ม — เผื่อเป็นลิงก์เฉพาะคน เช่นโฟลเดอร์ของคนนั้น
   บันทึกลง employees/{id}.links ทันที (ไม่มีปุ่มบันทึกแยก) — ฟิลด์เดียวกับที่พนักงานเห็น/แก้ในหน้า "ข้อมูลของฉัน"
   ลิงก์ที่พนักงานเพิ่มเองไม่มี id → อ้างแถวด้วยลำดับ (index) แทน

   @param {object} employee   เอกสารพนักงาน (ต้องเป็นตัวสดจาก snapshot ลิงก์ถึงอัปเดตตาม)
   @param {array}  options    fieldOptions.links = [{ id, name, url }]
   @param {func}   save       (optional) แทนการเขียน Firestore — ใช้ในหน้า preview */
export default function EmployeeLinks({ employee, options = [], save }) {
  const links = Array.isArray(employee?.links) ? employee.links : [];
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);   // ตัวเลือกที่กำลังจะเพิ่ม
  const [draftUrl, setDraftUrl] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editUrl, setEditUrl] = useState('');
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

  const closePicker = () => { setOpen(false); setPicked(null); setDraftUrl(''); setError(''); };
  const pick = (opt) => { setPicked(opt); setDraftUrl(opt.url || ''); setError(''); };

  const confirmAdd = async () => {
    const url = normalizeUrl(draftUrl);
    if (!url) { setError('URL ไม่ถูกต้อง'); return; }
    const ok = await write([...links, {
      id: newLinkId(), optionId: picked.id, label: picked.name, url, addedAt: Date.now(),
    }]);
    if (ok) closePicker();
  };

  const startEdit = (i) => { setEditingIdx(i); setEditUrl(links[i].url); setError(''); };
  const confirmEdit = async () => {
    const url = normalizeUrl(editUrl);
    if (!url) { setError('URL ไม่ถูกต้อง'); return; }
    const ok = await write(links.map((l, i) => (i === editingIdx ? { ...l, url } : l)));
    if (ok) setEditingIdx(null);
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
          {!picked ? (
            options.length === 0 ? (
              <p className="px-3 py-4 text-center text-[13px] text-stone-400">
                ยังไม่มีลิงก์ให้เลือก<br />เพิ่มได้ที่เมนู <span className="font-medium text-stone-600">ตัวเลือกฟิลด์</span>
              </p>
            ) : (
              <div role="listbox" className="max-h-72 overflow-y-auto">
                {options.map((opt) => {
                  const used = usedOptionIds.has(opt.id);
                  return (
                    <button key={opt.id} type="button" disabled={used} onClick={() => pick(opt)}
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
            )
          ) : (
            <div className="space-y-2.5 p-1.5">
              <button type="button" onClick={() => { setPicked(null); setError(''); }}
                className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700">
                <ChevronLeft className="size-3.5" strokeWidth={2} /> เลือกใหม่
              </button>
              <p className="text-sm font-medium text-stone-800">{picked.name}</p>
              <label className="block">
                <span className="text-[13px] font-medium text-stone-500">URL (แก้ได้ ถ้าเป็นลิงก์เฉพาะคนนี้)</span>
                <input autoFocus type="text" value={draftUrl}
                  onChange={(e) => { setDraftUrl(e.target.value); setError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmAdd(); } }}
                  className="mt-1 w-full rounded-xl border border-stone-200/60 px-3 py-2 text-sm outline-none transition-colors hover:border-stone-300 focus:border-clay-600 focus:ring-2 focus:ring-clay-600/15" />
              </label>
              {error && <p className="text-xs text-rose-700">{error}</p>}
              <button type="button" onClick={confirmAdd} disabled={busy || !draftUrl.trim()}
                className="w-full rounded-xl bg-clay-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
                {busy ? 'กำลังบันทึก...' : 'เพิ่มลิงก์'}
              </button>
            </div>
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
              {editingIdx === idx ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input autoFocus type="text" value={editUrl}
                    onChange={(e) => { setEditUrl(e.target.value); setError(''); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); confirmEdit(); }
                      if (e.key === 'Escape') setEditingIdx(null);
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-stone-200/60 px-3 py-1.5 text-sm outline-none focus:border-clay-600 focus:ring-2 focus:ring-clay-600/15" />
                  <IconBtn title="บันทึก" onClick={confirmEdit} disabled={busy}><Check className="size-3.5" strokeWidth={2} /></IconBtn>
                  <IconBtn title="ยกเลิก" onClick={() => { setEditingIdx(null); setError(''); }}><X className="size-3.5" strokeWidth={2} /></IconBtn>
                </div>
              ) : (
                <>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" title={l.url} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900 transition-colors group-hover:text-clay-600">{linkLabel(l)}</p>
                    <p className="truncate text-xs text-stone-400">{hostOf(l.url) || l.url}</p>
                  </a>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <CopyBtn text={l.url} />
                    <IconBtn title="แก้ URL" onClick={() => startEdit(idx)}><Pencil className="size-3.5" strokeWidth={2} /></IconBtn>
                    <IconBtn title="ลบลิงก์" tone="danger" onClick={() => remove(idx)} disabled={busy}><X className="size-3.5" strokeWidth={2} /></IconBtn>
                    {/* จอแคบซ่อนไว้ — แตะที่ชื่อก็เปิดลิงก์ได้อยู่แล้ว ชื่อจะได้ไม่ถูกบีบ */}
                    <a href={l.url} target="_blank" rel="noopener noreferrer" title="เปิดลิงก์"
                      className="ml-1 hidden items-center sm:inline-flex gap-1.5 rounded-lg border border-stone-200/60 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-clay-200 hover:bg-clay-50 hover:text-clay-700">
                      <ExternalLink className="size-3.5" strokeWidth={2} /> เปิด
                    </a>
                  </div>
                </>
              )}
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

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* เบราว์เซอร์ไม่อนุญาต — ปล่อยผ่าน */ }
  };
  return (
    <IconBtn title="คัดลอกลิงก์" onClick={doCopy}>
      {copied ? <Check className="size-3.5" strokeWidth={2} /> : <Copy className="size-3.5" strokeWidth={2} />}
    </IconBtn>
  );
}
