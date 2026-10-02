import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateITReport, getHardwareSummary, getSoftwareSummary, getRepairSummary } from '../utils/generateITReport.js';
import { FileDown, Plus, Trash2, ChevronDown, ChevronUp, Loader2, BarChart3, Settings, AlertCircle, FlaskConical, Pin, Eye, Save, Check, RotateCcw, Monitor, Package } from 'lucide-react';
import { BRAND } from '../ui/theme.js';
import DateField from './DateField.jsx';
import ITReportPreview from './ITReportPreview.jsx';

const TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                   'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

const STATUS_OPTIONS = ['⏳ In Progress', '✓ Complete', '❌ Cancelled', '⏸ On Hold'];

const DEFAULT_COMPANY = 'Globe Syndicate (Thailand) Company Limited';

const inputCls = 'w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors hover:border-stone-300 focus:ring-2 focus:ring-clay-600/15 focus:border-clay-600';
// select เพิ่ม pr-8 ให้ไม่ทับลูกศร native ของ browser
const selectCls = inputCls + ' pr-8 truncate';
const labelCls = 'block text-[13px] font-medium text-stone-600 mb-1';

function SectionHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-medium text-clay-600 flex items-center gap-2">{title}</h4>
      {children}
    </div>
  );
}

function TableRow({ children }) {
  return <div className="grid gap-2 items-start">{children}</div>;
}

/* ── Big Issues Editor ── */
function BigIssuesEditor({ value, onChange }) {
  const add = () => onChange([...value, { issue: '', raiseBy: 'All', status: '⏳ In Progress', due: '' }]);
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i, field, val) => {
    const next = [...value];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-stone-500">Issue #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-rose-400 hover:text-rose-600 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <label className={labelCls}>รายละเอียด Issue</label>
            <textarea value={row.issue} onChange={e => update(i, 'issue', e.target.value)} className={inputCls} rows="2" placeholder="อธิบาย issue..." />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Raise by</label>
              <input value={row.raiseBy} onChange={e => update(i, 'raiseBy', e.target.value)} className={inputCls} placeholder="All / ชื่อ" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={row.status} onChange={e => update(i, 'status', e.target.value)} className={selectCls}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Due</label>
              <DateField value={row.due} onChange={v => update(i, 'due', v)} inputClassName={inputCls + ' pr-9'} />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-medium text-clay-600 hover:text-clay-800 border border-dashed border-clay-600/40 hover:border-clay-600 px-3 py-2.5 rounded-xl transition-colors w-full justify-center">
        <Plus className="h-3.5 w-3.5" /> เพิ่ม Issue
      </button>
    </div>
  );
}

/* ── R&D Projects Editor ── */
function RDEditor({ value, onChange }) {
  const add = () => onChange([...value, { project: '', details: '', status: '⏳ In Progress', due: '', remarks: '' }]);
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i, field, val) => {
    const next = [...value];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-stone-500">โปรเจค #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-rose-400 hover:text-rose-600 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>ชื่อโปรเจค</label>
              <input value={row.project} onChange={e => update(i, 'project', e.target.value)} className={inputCls} placeholder="ชื่อโปรเจค..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Status</label>
                <select value={row.status} onChange={e => update(i, 'status', e.target.value)} className={selectCls}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Due</label>
                <DateField value={row.due} onChange={v => update(i, 'due', v)} inputClassName={inputCls + ' pr-9'} />
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>รายละเอียด</label>
            <textarea value={row.details} onChange={e => update(i, 'details', e.target.value)} className={inputCls} rows="2" placeholder="รายละเอียดโปรเจค..." />
          </div>
          <div>
            <label className={labelCls}>หมายเหตุ</label>
            <input value={row.remarks} onChange={e => update(i, 'remarks', e.target.value)} className={inputCls} placeholder="หมายเหตุเพิ่มเติม..." />
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-medium text-clay-600 hover:text-clay-800 border border-dashed border-clay-600/40 hover:border-clay-600 px-3 py-2.5 rounded-xl transition-colors w-full justify-center">
        <Plus className="h-3.5 w-3.5" /> เพิ่มโปรเจค
      </button>
    </div>
  );
}

/* ── Follow-up Editor ── */
function FollowupEditor({ value, onChange }) {
  const add = () => onChange([...value, { details: '', status: '⏳ In Progress', due: '', remarks: '' }]);
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i, field, val) => {
    const next = [...value];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-stone-500">วาระ #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-rose-400 hover:text-rose-600 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <label className={labelCls}>รายละเอียด</label>
            <textarea value={row.details} onChange={e => update(i, 'details', e.target.value)} className={inputCls} rows="2" placeholder="รายละเอียดวาระติดตาม..." />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Status</label>
              <select value={row.status} onChange={e => update(i, 'status', e.target.value)} className={selectCls}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Due</label>
              <DateField value={row.due} onChange={v => update(i, 'due', v)} inputClassName={inputCls + ' pr-9'} />
            </div>
            <div>
              <label className={labelCls}>หมายเหตุ</label>
              <input value={row.remarks} onChange={e => update(i, 'remarks', e.target.value)} className={inputCls} placeholder="หมายเหตุ..." />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-medium text-clay-600 hover:text-clay-800 border border-dashed border-clay-600/40 hover:border-clay-600 px-3 py-2.5 rounded-xl transition-colors w-full justify-center">
        <Plus className="h-3.5 w-3.5" /> เพิ่มวาระ
      </button>
    </div>
  );
}

/* ── Accordion Section ── */
function Section({ id, activeSection, setActiveSection, title, children }) {
  const open = activeSection === id;
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setActiveSection(open ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors text-left">
        <span className="text-sm font-medium text-stone-700">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

/* ── Data Preview Card ── */
function PreviewCard({ title, value, sub, color = '#2B6777' }) {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
      <div className="text-3xl font-medium tabular-nums" style={{ color }}>{value}</div>
      <div className="text-xs font-medium text-stone-700 mt-1">{title}</div>
      {sub && <div className="text-xs text-stone-400">{sub}</div>}
    </div>
  );
}

/* ── ช่องกรอกตัวเลขสถิติ (แก้ไขได้) ── */
function StatInput({ label, value, onChange, color = '#2B6777' }) {
  const num = (v) => (v === '' || isNaN(Number(v)) ? 0 : Number(v));
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl px-2 py-2.5 text-center focus-within:border-clay-600 focus-within:ring-2 focus-within:ring-clay-600/15 transition-colors">
      <input
        type="number" value={value} onChange={e => onChange(num(e.target.value))}
        className="w-full bg-transparent text-center text-2xl font-medium tabular-nums outline-none"
        style={{ color }}
      />
      <div className="text-[11px] font-medium text-stone-500 mt-0.5">{label}</div>
    </div>
  );
}

/* ── ปุ่มดึงค่าจากระบบใหม่ ── */
function RefreshBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-clay-600 transition-colors shrink-0">
      <RotateCcw className="h-3.5 w-3.5" /> ดึงจากระบบ
    </button>
  );
}

/* ── ช่องข้อความยาวในตาราง (หมายเหตุ) ──────────────────────────────
   ปกติสูงบรรทัดเดียวให้แถวเตี้ย แต่ค่าจริงยาวหลายสิบตัวอักษร
   เช่น "ทีวีห้องประชุม : 1. LG ห้องพี่แมน 2.Sharp ..." กรอกแล้วมองไม่เห็นว่าพิมพ์อะไรไป

   ทำเป็น textarea ที่โฟกัสแล้วสูงขึ้นตามเนื้อหา (ตัดคำลงบรรทัดใหม่ให้เห็นครบ)
   แล้วยุบกลับเป็นบรรทัดเดียวตอนออกจากช่อง
   ไม่ใช้กล่องลอยทับ เพราะ PanelCard เป็น overflow-hidden กล่องลอยจะถูกตัด */
function GrowCell({ value, onChange, placeholder, className }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  /* ปรับความสูงตามเนื้อหา — จำกัดไว้ 5 บรรทัด กันแถวสูงเกินจอ */
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 5 * 22 + 12) + 'px';
  };

  useEffect(() => { if (open) fit(); }, [open, value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setOpen(true)}
      onBlur={() => { setOpen(false); if (ref.current) ref.current.style.height = ''; }}
      className={`${className} resize-none leading-[22px] ${
        open ? 'relative z-10 whitespace-pre-wrap shadow-[0_2px_8px_rgba(22,32,36,0.10)]'
             : 'h-[34px] overflow-hidden whitespace-nowrap'
      }`}
    />
  );
}

/* ── ตัวแก้ไขตาราง — ใช้กับ ฮาร์ดแวร์ / ซอฟต์แวร์ ──────────────────

   ของเดิมทำเป็น "การ์ดใบใหญ่ต่อ 1 รายการ" ช่องกรอกเรียงลงมา 6 ช่อง
   สูงราว 400px ต่อรายการ ข้อมูลจริงมี ~7 ประเภทฮาร์ดแวร์ + ~14 License
   หน้านี้จึงยาวเกือบหมื่นพิกเซล ต้องเลื่อนหาช่องที่จะกรอกไปเรื่อย ๆ

   ข้อมูลชุดนี้หน้าตาเป็นตารางอยู่แล้ว (ลงสไลด์ก็เป็นตาราง)
   จึงทำเป็นตารางจริง 1 แถว = 1 รายการ สูงราว 44px
   จอแคบ (< md) ถอยไปใช้การ์ดเหมือนเดิม เพราะตาราง 7 คอลัมน์ไม่พอที่ */
function DataRowsEditor({ rows, onChange, columns, makeEmpty, addLabel, itemLabel }) {
  const num = (v) => (v === '' || isNaN(Number(v)) ? 0 : Number(v));
  const update = (i, k, v) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([...rows, makeEmpty()]);

  /* ช่องกรอกในตาราง — ไม่มีกรอบ ให้เส้นของตารางทำหน้าที่แทน
     โฟกัสแล้วค่อยขึ้นพื้นขาว + ring ให้รู้ว่าอยู่ช่องไหน */
  const cellInput = 'w-full rounded-lg bg-transparent px-2 py-1.5 text-sm text-stone-800 outline-none transition-colors hover:bg-white focus:bg-white focus:ring-2 focus:ring-clay-600/20';

  const field = (r, i, c) => {
    if (c.type === 'number') {
      return <input type="number" value={r[c.key] ?? 0}
        onChange={e => update(i, c.key, num(e.target.value))}
        className={`${cellInput} text-center tabular-nums`} />;
    }
    /* ช่องข้อความยาว — โฟกัสแล้วขยายให้เห็นค่าทั้งหมด */
    if (c.grow) {
      return <GrowCell value={r[c.key]} onChange={v => update(i, c.key, v)}
        placeholder={c.ph} className={cellInput} />;
    }
    return <input value={r[c.key] ?? ''} onChange={e => update(i, c.key, e.target.value)}
      placeholder={c.ph} className={cellInput} />;
  };

  const addBtn = (
    <button type="button" onClick={add}
      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-clay-600/40 px-3 py-2.5 text-xs font-medium text-clay-600 transition-colors hover:border-clay-600 hover:text-clay-800">
      <Plus className="h-3.5 w-3.5" /> {addLabel}
    </button>
  );

  if (rows.length === 0) {
    return (
      <div className="space-y-2.5">
        {addBtn}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* ── จอกว้าง: ตาราง 1 แถว = 1 รายการ ── */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-stone-200/60">
              <th className="w-9 pb-2 pl-1 text-xs font-medium text-stone-400">#</th>
              {columns.map(c => (
                <th key={c.key}
                  className={`whitespace-nowrap px-1 pb-2 text-xs font-medium text-stone-400 ${
                    c.type === 'number' ? 'w-[68px] text-center' : ''}`}>
                  {c.label}
                </th>
              ))}
              <th className="w-9 pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-stone-100 last:border-0">
                <td className="pl-1 pt-3 align-top text-center text-xs tabular-nums text-stone-400">{i + 1}</td>
                {columns.map(c => <td key={c.key} className="px-1 py-1 align-top">{field(r, i, c)}</td>)}
                <td className="py-1 pt-2 align-top text-center">
                  <button type="button" onClick={() => remove(i)}
                    className="rounded-lg p-1 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    title={`ลบ${itemLabel}นี้`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── จอแคบ: การ์ดต่อรายการ ── */}
      <div className="space-y-2.5 md:hidden">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium text-stone-400">{itemLabel} #{i + 1}</span>
              <button type="button" onClick={() => remove(i)}
                className="text-stone-300 transition-colors hover:text-rose-500" aria-label="ลบแถว">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {columns.map(c => (
                <div key={c.key} className={c.span === 'full' ? 'col-span-2' : ''}>
                  <label className="mb-1 block text-[11px] font-medium text-stone-500">{c.label}</label>
                  {c.type === 'number'
                    ? <input type="number" value={r[c.key] ?? 0} onChange={e => update(i, c.key, num(e.target.value))} className={inputCls} />
                    : <input value={r[c.key] ?? ''} onChange={e => update(i, c.key, e.target.value)} className={inputCls} placeholder={c.ph} />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {addBtn}
    </div>
  );
}

/* ── Count badge ── */
function CountBadge({ n }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${n > 0 ? 'bg-clay-600/8 text-clay-600' : 'bg-stone-100 text-stone-400'}`}>
      {n} รายการ
    </span>
  );
}

/* ── Panel card (v2 minimal) ── */
function PanelCard({ icon: Icon, tint = '#DFEAEF', color = '#2B6777', title, desc, right, children }) {
  return (
    <section className="bg-white rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(22,32,36,0.20)] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint, color }}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium text-stone-800 leading-tight">{title}</h3>
          {desc && <p className="text-xs text-stone-400 mt-0.5 truncate">{desc}</p>}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
export default function ITReportPage({
  employees = [], repairRequests = [], assets = [], accessories = [], licenses = [],
}) {
  const now = new Date();

  // ── ร่างรายงาน: ใช้ "ชุดเดียว" ร่วมทุกเดือน ──────────────────────
  // ผู้ใช้ย้ำว่าข้อมูล (บริษัท/สถิติ/ฮาร์ดแวร์/ซอฟต์แวร์) เหมือนกันทุกเดือน
  // ต่างแค่ปัญหา/โปรเจค/วาระ จึงเก็บร่าง "คีย์เดียว" แล้วเอาไปใช้กับทุกเดือน
  // และเดือนต่อ ๆ ไป — กรอกครั้งเดียว เดือนหน้าค่อยปรับเฉพาะที่เปลี่ยน
  const SHARED_KEY = 'it_report_shared';

  // อ่านร่าง: คีย์รวม > ร่างรายเดือน "ล่าสุด" (ของระบบเดิม) > คีย์เดี่ยวเก่าสุด
  // -> ของที่เคยกรอกไว้เดือนล่าสุดถูกย้ายมาเป็นชุดร่วมอัตโนมัติ ไม่ต้องกรอกใหม่
  const readDraft = () => {
    const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
    const shared = read(SHARED_KEY);
    if (shared) return shared;
    let best = null, bestKey = '';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('it_report_draft:') && k > bestKey) {
        const v = read(k); if (v) { best = v; bestKey = k; }
      }
    }
    return best || read('it_report_draft') || {};
  };

  // เปิดหน้าที่เดือนปัจจุบันเสมอ (ไม่กู้เดือนจากร่าง) — กันรายงานผิดเดือนโดยไม่รู้ตัว
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear]   = useState(now.getFullYear());
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY);
  const [bigIssues, setBigIssues]   = useState([]);
  const [rdProjects, setRdProjects] = useState([]);
  const [followUps, setFollowUps]   = useState([]);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved]           = useState(false);   // ✓ แสดงผลหลังกดบันทึก

  // ── ค่าจากระบบ (คำนวณสด) ──
  const monthly = useMemo(() => repairRequests.filter(r => {
    const d = new Date(r.timestamp);
    return d.getMonth() === month && d.getFullYear() === year;
  }), [repairRequests, month, year]);

  const autoStats = useMemo(() => ({
    employees: employees.length,
    monthly: monthly.length,
    closedWon:  monthly.filter(r => ['เสร็จสิ้น','สำเร็จ','แก้ไขแล้ว','ปิดแล้ว'].includes(r.status)).length,
    closedLose: monthly.filter(r => ['ยกเลิก','ไม่สำเร็จ'].includes(r.status)).length,
  }), [employees.length, monthly]);
  const autoHw = useMemo(() => getHardwareSummary(assets, accessories), [assets, accessories]);
  const autoSw = useMemo(() => getSoftwareSummary(licenses), [licenses]);

  // ── ตัวเลขที่ผู้ใช้แก้เอง ──────────────────────────────────────
  // null = ยังไม่เคยแก้ -> ใช้ค่าจากระบบ  ·  มีค่า = ผู้ใช้กำหนดเอง (ใช้ร่วมทุกเดือน)
  const [statsEdit, setStatsEdit] = useState(null);
  const [hwEdit, setHwEdit]       = useState(null);
  const [swEdit, setSwEdit]       = useState(null);

  const stats = statsEdit ?? autoStats;
  const hw    = hwEdit ?? autoHw;
  const sw    = swEdit ?? autoSw;

  /* โหลดร่างชุดร่วม "ครั้งเดียว" ตอนเปิดหน้า — ไม่โหลดใหม่ตอนเปลี่ยนเดือน
     เพื่อให้ข้อมูลที่กรอกไว้คงอยู่กับทุกเดือน · loaded กัน autosave เขียนทับด้วยค่าว่าง
     (บั๊กเดิม: autosave รันในคอมมิตเดียวกับโหลด เห็นค่าว่างของเรนเดอร์แรกแล้วทับทิ้ง) */
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const d = readDraft();
    setCompanyName(d.companyName ?? DEFAULT_COMPANY);
    setBigIssues(d.bigIssues ?? []);
    setRdProjects(d.rdProjects ?? []);
    setFollowUps(d.followUps ?? []);
    setStatsEdit(d.stats ?? null);
    setHwEdit(d.hw ?? null);
    setSwEdit(d.sw ?? null);
    setLoaded(true);
  }, []); // eslint-disable-line

  // ร่างที่จะเขียน — ไม่เก็บ month/year (เปิดที่เดือนปัจจุบันเสมอ) จึงใช้ร่วมได้ทุกเดือน
  const buildDraft = () => ({
    companyName, bigIssues, rdProjects, followUps,
    stats: statsEdit, hw: hwEdit, sw: swEdit,
  });

  // บันทึกร่างอัตโนมัติ กันข้อมูลหายระหว่างพิมพ์ (เริ่มหลังโหลดเสร็จ)
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(SHARED_KEY, JSON.stringify(buildDraft())); }
    catch { /* ข้าม */ }
  }, [loaded, companyName, bigIssues, rdProjects, followUps, statsEdit, hwEdit, swEdit]); // eslint-disable-line

  const reportDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  const editStat = (k, v) => { setStatsEdit({ ...stats, [k]: v }); setSaved(false); };
  const editHw   = (rows) => { setHwEdit(rows); setSaved(false); };
  const editSw   = (rows) => { setSwEdit(rows); setSaved(false); };

  // ข้อมูลที่ส่งให้ preview + generator (แหล่งเดียว)
  /* 🆕 สรุปเคสแจ้งซ่อมของเดือนนั้น — ดึงจากระบบตรง ๆ ไม่มีช่องให้กรอก */
  const repair = useMemo(() => getRepairSummary(repairRequests, month, year),
    [repairRequests, month, year]);

  const previewData = {
    company: companyName, month, year, reportDate,
    stats, hwSummary: hw, swSummary: sw, bigIssues, rdProjects, followUps,
    repair,
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateITReport({
        month, year, companyName,
        employees, repairRequests, assets, accessories, licenses,
        bigIssues, rdProjects, followUps,
        supportStats: stats, hardwareSummary: hw, softwareSummary: sw,
      });
      setShowPreview(false);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem(SHARED_KEY, JSON.stringify(buildDraft()));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch { alert('บันทึกไม่สำเร็จ — พื้นที่จัดเก็บเต็ม'); }
  };

  const clearDraft = () => {
    if (!window.confirm('ล้างข้อมูลที่กรอกทั้งหมด (Issue / Project / Follow-up / ตัวเลขที่แก้เอง) ใช่หรือไม่?')) return;
    setBigIssues([]); setRdProjects([]); setFollowUps([]);
    setStatsEdit(null); setHwEdit(null); setSwEdit(null);
    try { localStorage.removeItem(SHARED_KEY); } catch {}
  };

  return (
    <div className="space-y-4 p-4 lg:p-5">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${BRAND.primary}0F`, color: BRAND.primary }}>
            <BarChart3 className="h-[22px] w-[22px]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-medium tracking-tight text-stone-900">สร้าง IT Monthly Report</h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors ${saved ? 'bg-olive-50 border-olive-200 text-olive-700' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'}`}
          >
            {saved ? <><Check className="h-4 w-4" strokeWidth={2} /> บันทึกแล้ว</> : <><Save className="h-4 w-4" strokeWidth={2} /> บันทึก</>}
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-clay-600 rounded-xl hover:bg-stone-50 hover:border-clay-600/40 font-medium text-sm transition-colors"
          >
            <Eye className="h-4 w-4" strokeWidth={2} /> ดูตัวอย่าง
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white transition-colors ${generating ? 'bg-stone-300 cursor-not-allowed' : 'bg-clay-600 hover:bg-clay-700'}`}
          >
            {generating
              ? <><Loader2 className="h-4 w-4 animate-spin" /> กำลังสร้าง...</>
              : <><FileDown className="h-4 w-4" strokeWidth={2} /> Export .pptx</>}
          </button>
        </div>
      </div>

      {/* ── Body — เรียงตามลำดับที่กรอกจริง
          ของเดิมแบ่งซ้าย 3 / ขวา 2 ตารางฮาร์ดแวร์กับซอฟต์แวร์จึงอยู่ในคอลัมน์แคบ
          พอมีหลายรายการก็ยาวลงไปเรื่อย ๆ ต้องเลื่อนหาช่องที่จะกรอก
          จัดใหม่: ของสั้นวางคู่กัน ตารางยาวกินความกว้างเต็ม ── */}
      <div className="space-y-5">

        {/* ตั้งค่า + ตัวเลขภาพรวม — สั้นทั้งคู่ */}
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          <PanelCard icon={Settings} title="ตั้งค่ารายงาน" desc="สไลด์ 1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>เดือน</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className={selectCls}>
                  {TH_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>ปี (ค.ศ.)</label>
                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className={inputCls} min="2020" max="2050" />
              </div>
              <div className="sm:col-span-1">
                <label className={labelCls}>ชื่อบริษัท</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputCls} />
              </div>
            </div>
          </PanelCard>

          <PanelCard icon={BarChart3} title="สรุปฝ่ายสนับสนุน" desc="สไลด์ 3"
            right={<RefreshBtn onClick={() => { setStatsEdit(null); setSaved(false); }} />}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <StatInput label="พนักงานทั้งหมด" value={stats.employees}  onChange={v => editStat('employees', v)} />
              <StatInput label="เคสทั้งหมด"      value={stats.monthly}    onChange={v => editStat('monthly', v)} />
              <StatInput label="ปิดสำเร็จ"       value={stats.closedWon}  onChange={v => editStat('closedWon', v)}  color="#2c5d53" />
              <StatInput label="ไม่สำเร็จ"       value={stats.closedLose} onChange={v => editStat('closedLose', v)} color="#B0453C" />
            </div>
          </PanelCard>
        </div>

        {/* ตารางฮาร์ดแวร์ / ซอฟต์แวร์ — เต็มความกว้าง ตารางจึงไม่ถูกบีบ */}
        <PanelCard icon={Monitor} tint="#EAF5F2" color="#2C5D53" title="ฮาร์ดแวร์" desc="สไลด์ 4"
          right={<RefreshBtn onClick={() => { setHwEdit(null); setSaved(false); }} />}>
          <DataRowsEditor
            rows={hw} onChange={editHw} itemLabel="อุปกรณ์" addLabel="เพิ่มประเภทอุปกรณ์"
            makeEmpty={() => ({ type: '', total: 0, inUse: 0, avail: 0, broken: 0, note: '–' })}
            columns={[
              { key: 'type', label: 'ประเภทอุปกรณ์', span: 'full', ph: 'เช่น โน้ตบุ๊ค' },
              { key: 'total', label: 'รวม', type: 'number' },
              { key: 'inUse', label: 'ใช้งาน', type: 'number' },
              { key: 'avail', label: 'พร้อมส่งมอบ', type: 'number' },
              { key: 'broken', label: 'ชำรุด', type: 'number' },
              { key: 'note', label: 'หมายเหตุ', span: 'full', grow: true, ph: '–' },
            ]}
          />
        </PanelCard>

        <PanelCard icon={Package} tint="#DFEAEF" color="#225462" title="ซอฟต์แวร์ / ลิขสิทธิ์" desc="สไลด์ 5"
          right={<RefreshBtn onClick={() => { setSwEdit(null); setSaved(false); }} />}>
          <DataRowsEditor
            rows={sw} onChange={editSw} itemLabel="ซอฟต์แวร์" addLabel="เพิ่มซอฟต์แวร์"
            makeEmpty={() => ({ name: '', stock: 0, active: 0, inactive: 0, note: '–' })}
            columns={[
              { key: 'name', label: 'ซอฟต์แวร์', span: 'full', ph: 'เช่น Microsoft 365' },
              { key: 'stock', label: 'จำนวน', type: 'number' },
              { key: 'active', label: 'ใช้งาน', type: 'number' },
              { key: 'inactive', label: 'คงเหลือ', type: 'number' },
              { key: 'note', label: 'หมายเหตุ', span: 'full', grow: true, ph: '–' },
            ]}
          />
        </PanelCard>

        {/* สามรายการที่เป็นข้อความยาว — ปกติมีไม่กี่แถว วางเรียงกัน */}
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
          <PanelCard icon={AlertCircle} tint="#FBEAE8" color="#B0453C" title="ประเด็นสำคัญ (Big Issues)" desc="สไลด์ 3" right={<CountBadge n={bigIssues.length} />}>
            <BigIssuesEditor value={bigIssues} onChange={setBigIssues} />
          </PanelCard>

          <PanelCard icon={FlaskConical} tint="#DFEAEF" color="#225462" title="R&D Projects" desc="สไลด์ 6" right={<CountBadge n={rdProjects.length} />}>
            <RDEditor value={rdProjects} onChange={setRdProjects} />
          </PanelCard>

          <PanelCard icon={Pin} tint="#FBF4E6" color="#A87A2C" title="วาระติดตาม (Follow-up)" desc="สไลด์ 7" right={<CountBadge n={followUps.length} />}>
            <FollowupEditor value={followUps} onChange={setFollowUps} />
          </PanelCard>
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-stone-400">ข้อมูลที่กรอกถูกจำไว้ใช้กับทุกเดือน — เดือนหน้าปรับเฉพาะปัญหา/โปรเจค</p>
          <button onClick={clearDraft} className="text-xs font-medium text-stone-500 hover:text-rose-600 transition-colors shrink-0">
            ล้างข้อมูลที่กรอก
          </button>
        </div>
      </div>

      {/* ตัวอย่างสไลด์ PowerPoint + แก้ไข ก่อน Export */}
      <ITReportPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onExport={handleGenerate}
        exporting={generating}
        data={previewData}
      />
    </div>
  );
}
