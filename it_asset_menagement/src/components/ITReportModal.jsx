import React, { useState, useEffect, useMemo } from 'react';
import { generateITReport, getHardwareSummary, getSoftwareSummary } from '../utils/generateITReport.js';
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

/* ── ตัวแก้ไขตาราง (การ์ดต่อแถว) — ใช้กับ ฮาร์ดแวร์ / ซอฟต์แวร์ ── */
function DataRowsEditor({ rows, onChange, columns, makeEmpty, addLabel, itemLabel }) {
  const num = (v) => (v === '' || isNaN(Number(v)) ? 0 : Number(v));
  const update = (i, k, v) => onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([...rows, makeEmpty()]);
  return (
    <div className="space-y-2.5">
      {rows.length === 0 && <p className="text-[13px] text-stone-400 text-center py-3">ยังไม่มีข้อมูล — กดปุ่มด้านล่างเพื่อเพิ่ม</p>}
      {rows.map((r, i) => (
        <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-stone-400">{itemLabel} #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-stone-300 hover:text-rose-500 transition-colors" aria-label="ลบแถว">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {columns.map((c) => (
              <div key={c.key} className={c.span === 'full' ? 'col-span-2' : ''}>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">{c.label}</label>
                {c.type === 'number'
                  ? <input type="number" value={r[c.key] ?? 0} onChange={e => update(i, c.key, num(e.target.value))} className={inputCls} />
                  : <input value={r[c.key] ?? ''} onChange={e => update(i, c.key, e.target.value)} className={inputCls} placeholder={c.ph} />}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-medium text-clay-600 hover:text-clay-800 border border-dashed border-clay-600/40 hover:border-clay-600 px-3 py-2.5 rounded-xl transition-colors w-full justify-center">
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
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

  // ── ร่างรายงาน: เก็บ "แยกรายเดือน" ──────────────────────────────
  // เดิมใช้คีย์เดียวทั้งระบบ ทำให้ (1) ตัวเลขที่แก้เองของเดือนก่อนไหลมาเดือนใหม่
  // และ (2) หน้าเปิดค้างอยู่ที่เดือนเก่าตลอด เพราะ month/year ถูกกู้จากร่าง
  const DRAFT_PREFIX = 'it_report_draft';
  const LEGACY_KEY = 'it_report_draft';   // คีย์เดิม ก่อนแยกรายเดือน
  const draftKey = (m, y) => `${DRAFT_PREFIX}:${y}-${String(m + 1).padStart(2, '0')}`;

  const readDraft = (m, y) => {
    const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
    const own = read(draftKey(m, y));
    if (own) return own;
    // ย้ายร่างเก่า (คีย์รวม) มาให้เดือนที่มันระบุไว้ — ข้อมูลเดิมของผู้ใช้ไม่หาย
    const legacy = read(LEGACY_KEY);
    if (legacy && legacy.month === m && legacy.year === y) return legacy;
    return {};
  };

  // เปิดหน้าที่เดือนปัจจุบันเสมอ (ไม่กู้จากร่าง) — กันรายงานผิดเดือนโดยไม่รู้ตัว
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
  // null = ยังไม่เคยแก้ -> ใช้ค่าจากระบบ  ·  มีค่า = ผู้ใช้กำหนดเอง
  // เก็บเป็น derived state แทน useEffect คอยซิงก์ ทำให้ไม่มีจังหวะที่ค่าระบบ
  // เขียนทับค่าที่ผู้ใช้เพิ่งแก้ (บั๊กเดิมของโครงแบบ effect)
  const [statsEdit, setStatsEdit] = useState(null);
  const [hwEdit, setHwEdit]       = useState(null);
  const [swEdit, setSwEdit]       = useState(null);

  const stats = statsEdit ?? autoStats;
  const hw    = hwEdit ?? autoHw;
  const sw    = swEdit ?? autoSw;

  /* 🆕 ค่าบนหน้าจอตอนนี้เป็นของร่างเดือนไหน (null = ยังไม่ได้โหลด)
     ใช้กันไม่ให้ autosave เขียนทับร่างด้วยค่าว่าง

     บั๊กเดิม: ตอน mount เอฟเฟกต์ autosave ทำงานต่อจากเอฟเฟกต์โหลดร่าง "ในคอมมิตเดียวกัน"
     จึงยังเห็นค่าเริ่มต้น (ว่าง) ของเรนเดอร์แรก แล้วเขียนทับ localStorage ทันที
     พอ StrictMode รันเอฟเฟกต์ซ้ำรอบสอง เอฟเฟกต์โหลดร่างก็อ่านได้แต่ค่าว่างที่เพิ่งถูกทับ
     -> ทุกอย่างที่กรอกไว้ (รวมช่องหมายเหตุ) หายทุกครั้งที่เปิดหน้านี้ใหม่
     กรณีเปลี่ยนเดือนก็กันด้วยตัวเดียวกัน ไม่ให้ข้อมูลเดือนเก่าไหลไปทับคีย์เดือนใหม่ */
  const [loadedKey, setLoadedKey] = useState(null);

  // โหลดร่างของเดือนที่เลือก (รวมตัวเลขที่เคยแก้เอง) ทุกครั้งที่เปลี่ยนเดือน/ปี
  useEffect(() => {
    const d = readDraft(month, year);
    setCompanyName(d.companyName ?? DEFAULT_COMPANY);
    setBigIssues(d.bigIssues ?? []);
    setRdProjects(d.rdProjects ?? []);
    setFollowUps(d.followUps ?? []);
    setStatsEdit(d.stats ?? null);
    setHwEdit(d.hw ?? null);
    setSwEdit(d.sw ?? null);
    setSaved(false);
    setLoadedKey(draftKey(month, year));
  }, [month, year]); // eslint-disable-line

  // ร่างที่จะเขียนลง localStorage — ทุกอย่างที่หน้านี้แก้ได้ ต้องอยู่ในนี้ครบ
  const buildDraft = () => ({
    month, year, companyName, bigIssues, rdProjects, followUps,
    stats: statsEdit, hw: hwEdit, sw: swEdit,
  });

  // บันทึกร่างอัตโนมัติ กันข้อมูลหายระหว่างพิมพ์
  useEffect(() => {
    // เขียนเฉพาะเมื่อค่าบนหน้าจอเป็นของเดือนนี้จริง ๆ แล้วเท่านั้น
    if (loadedKey !== draftKey(month, year)) return;
    try { localStorage.setItem(draftKey(month, year), JSON.stringify(buildDraft())); }
    catch { /* ข้าม */ }
  }, [loadedKey, month, year, companyName, bigIssues, rdProjects, followUps, statsEdit, hwEdit, swEdit]); // eslint-disable-line

  const reportDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  const editStat = (k, v) => { setStatsEdit({ ...stats, [k]: v }); setSaved(false); };
  const editHw   = (rows) => { setHwEdit(rows); setSaved(false); };
  const editSw   = (rows) => { setSwEdit(rows); setSaved(false); };

  // ข้อมูลที่ส่งให้ preview + generator (แหล่งเดียว)
  const previewData = {
    company: companyName, month, year, reportDate,
    stats, hwSummary: hw, swSummary: sw, bigIssues, rdProjects, followUps,
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
      localStorage.setItem(draftKey(month, year), JSON.stringify(buildDraft()));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch { alert('บันทึกไม่สำเร็จ — พื้นที่จัดเก็บเต็ม'); }
  };

  const clearDraft = () => {
    if (!window.confirm('ล้างข้อมูลที่กรอกของเดือนนี้ทั้งหมด (Issue / Project / Follow-up / ตัวเลขที่แก้เอง) ใช่หรือไม่?')) return;
    setBigIssues([]); setRdProjects([]); setFollowUps([]);
    setStatsEdit(null); setHwEdit(null); setSwEdit(null);
    try { localStorage.removeItem(draftKey(month, year)); } catch {}
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 p-6 lg:p-8">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${BRAND.primary}0F`, color: BRAND.primary }}>
            <BarChart3 className="h-[22px] w-[22px]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-medium tracking-tight text-stone-900">สร้าง IT Monthly Report</h1>
            <p className="text-stone-500 text-[13px] mt-1">
              แก้ไขข้อมูลทุกสไลด์ได้ในหน้านี้ · กด <span className="font-medium text-stone-600">บันทึก</span> เพื่อจำข้อมูล แล้ว Export เป็น <span className="font-medium text-stone-600">.pptx</span>
            </p>
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

      {/* ── Body grid — แก้ไขได้ครบทุกสไลด์ในที่เดียว ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">

        {/* LEFT */}
        <div className="xl:col-span-3 space-y-5">

          <PanelCard icon={Settings} title="ตั้งค่ารายงาน" desc="เดือน / ปี / ชื่อบริษัทที่แสดงในไฟล์ (ปก + ทุกสไลด์)">
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

          <PanelCard icon={BarChart3} title="สรุปฝ่ายสนับสนุน" desc="สไลด์ 3 — ตัวเลขภาพรวม (แก้ไขได้)"
            right={<RefreshBtn onClick={() => { setStatsEdit(null); setSaved(false); }} />}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <StatInput label="พนักงานทั้งหมด" value={stats.employees}  onChange={v => editStat('employees', v)} />
              <StatInput label="เคสทั้งหมด"      value={stats.monthly}    onChange={v => editStat('monthly', v)} />
              <StatInput label="ปิดสำเร็จ"       value={stats.closedWon}  onChange={v => editStat('closedWon', v)}  color="#2c5d53" />
              <StatInput label="ไม่สำเร็จ"       value={stats.closedLose} onChange={v => editStat('closedLose', v)} color="#B0453C" />
            </div>
          </PanelCard>

          <PanelCard icon={AlertCircle} tint="#FBEAE8" color="#B0453C" title="ประเด็นสำคัญ (Big Issues)" desc="สไลด์ 3 — ตารางประเด็นสำคัญ" right={<CountBadge n={bigIssues.length} />}>
            <BigIssuesEditor value={bigIssues} onChange={setBigIssues} />
          </PanelCard>

          <PanelCard icon={FlaskConical} tint="#DFEAEF" color="#225462" title="R&D Projects" desc="สไลด์ 6 — สถานะโปรเจค" right={<CountBadge n={rdProjects.length} />}>
            <RDEditor value={rdProjects} onChange={setRdProjects} />
          </PanelCard>

          <PanelCard icon={Pin} tint="#FBF4E6" color="#A87A2C" title="วาระติดตาม (Follow-up)" desc="สไลด์ 7 — รายการติดตามงาน" right={<CountBadge n={followUps.length} />}>
            <FollowupEditor value={followUps} onChange={setFollowUps} />
          </PanelCard>
        </div>

        {/* RIGHT — hardware / software (แก้ไขได้) */}
        <div className="xl:col-span-2 space-y-5">
          <PanelCard icon={Monitor} tint="#EAF5F2" color="#2C5D53" title="ฮาร์ดแวร์" desc="สไลด์ 4 — แก้ไข / เพิ่มแถวได้"
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
                { key: 'note', label: 'หมายเหตุ', span: 'full', ph: '–' },
              ]}
            />
          </PanelCard>

          <PanelCard icon={Package} tint="#DFEAEF" color="#225462" title="ซอฟต์แวร์ / ลิขสิทธิ์" desc="สไลด์ 5 — แก้ไข / เพิ่มแถวได้"
            right={<RefreshBtn onClick={() => { setSwEdit(null); setSaved(false); }} />}>
            <DataRowsEditor
              rows={sw} onChange={editSw} itemLabel="ซอฟต์แวร์" addLabel="เพิ่มซอฟต์แวร์"
              makeEmpty={() => ({ name: '', stock: 0, active: 0, inactive: 0, note: '–' })}
              columns={[
                { key: 'name', label: 'ซอฟต์แวร์', span: 'full', ph: 'เช่น Microsoft 365' },
                { key: 'stock', label: 'จำนวน', type: 'number' },
                { key: 'active', label: 'ใช้งาน', type: 'number' },
                { key: 'inactive', label: 'คงเหลือ', type: 'number' },
                { key: 'note', label: 'หมายเหตุ', span: 'full', ph: '–' },
              ]}
            />
          </PanelCard>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-stone-400">ตัวเลขจากระบบรีเฟรชทุกครั้งที่เปิดหน้านี้</span>
            <button onClick={clearDraft} className="text-xs font-medium text-stone-500 hover:text-rose-600 transition-colors">
              ล้างข้อมูลที่กรอก
            </button>
          </div>
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
