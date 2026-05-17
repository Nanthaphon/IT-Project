import React, { useState, useEffect } from 'react';
import { generateITReport } from '../utils/generateITReport.js';
import { FileDown, Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                   'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

const STATUS_OPTIONS = ['⏳ In Progress', '✓ Complete', '❌ Cancelled', '⏸ On Hold'];

const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A]';
const labelCls = 'block text-xs font-bold text-slate-600 mb-1';

function SectionHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-bold text-[#1E487A] flex items-center gap-2">{title}</h4>
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
        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Issue #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 transition-colors">
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
              <select value={row.status} onChange={e => update(i, 'status', e.target.value)} className={inputCls}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Due</label>
              <input type="date" value={row.due} onChange={e => update(i, 'due', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#1E487A] hover:text-[#133257] border border-dashed border-[#1E487A]/40 hover:border-[#1E487A] px-3 py-2 rounded-lg transition-all w-full justify-center">
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
        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">โปรเจค #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 transition-colors">
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
                <select value={row.status} onChange={e => update(i, 'status', e.target.value)} className={inputCls}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Due</label>
                <input type="date" value={row.due} onChange={e => update(i, 'due', e.target.value)} className={inputCls} />
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
        className="flex items-center gap-1.5 text-xs font-semibold text-[#1E487A] hover:text-[#133257] border border-dashed border-[#1E487A]/40 hover:border-[#1E487A] px-3 py-2 rounded-lg transition-all w-full justify-center">
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
        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">วาระ #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 transition-colors">
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
              <select value={row.status} onChange={e => update(i, 'status', e.target.value)} className={inputCls}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Due</label>
              <input type="date" value={row.due} onChange={e => update(i, 'due', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>หมายเหตุ</label>
              <input value={row.remarks} onChange={e => update(i, 'remarks', e.target.value)} className={inputCls} placeholder="หมายเหตุ..." />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#1E487A] hover:text-[#133257] border border-dashed border-[#1E487A]/40 hover:border-[#1E487A] px-3 py-2 rounded-lg transition-all w-full justify-center">
        <Plus className="h-3.5 w-3.5" /> เพิ่มวาระ
      </button>
    </div>
  );
}

/* ── Accordion Section ── */
function Section({ id, activeSection, setActiveSection, title, children }) {
  const open = activeSection === id;
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setActiveSection(open ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        <span className="text-sm font-bold text-slate-700">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

/* ── Data Preview Card ── */
function PreviewCard({ title, value, sub, color = '#1E487A' }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
      <div className="text-3xl font-black" style={{ color }}>{value}</div>
      <div className="text-xs font-bold text-slate-700 mt-1">{title}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
export default function ITReportModal({
  isOpen, onClose,
  employees = [], repairRequests = [], assets = [], accessories = [], licenses = [],
}) {
  const now = new Date();
  const [month, setMonth]         = useState(now.getMonth());
  const [year, setYear]           = useState(now.getFullYear());
  const [companyName, setCompanyName] = useState('Globe Syndicate (Thailand) Company Limited');
  const [bigIssues, setBigIssues]   = useState([]);
  const [rdProjects, setRdProjects] = useState([]);
  const [followUps, setFollowUps]   = useState([]);
  const [activeSection, setActiveSection] = useState('support'); // 'support' | 'rd' | 'followup'
  const [generating, setGenerating] = useState(false);

  // Derived stats
  const monthly = repairRequests.filter(r => {
    const d = new Date(r.timestamp);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const closedWon  = monthly.filter(r => ['เสร็จสิ้น','สำเร็จ','แก้ไขแล้ว','ปิดแล้ว'].includes(r.status)).length;
  const closedLose = monthly.filter(r => ['ยกเลิก','ไม่สำเร็จ'].includes(r.status)).length;

  // Hardware summary
  const hwGroups = {};
  assets.forEach(a => {
    const t = a.type || 'อื่นๆ';
    if (!hwGroups[t]) hwGroups[t] = { total: 0, inUse: 0, avail: 0, broken: 0 };
    hwGroups[t].total++;
    if (a.status === 'ถูกใช้งาน') hwGroups[t].inUse++;
    else if (a.status === 'ชำรุดเสียหาย') hwGroups[t].broken++;
    else hwGroups[t].avail++;
  });
  accessories.forEach(a => {
    const t = a.type || 'อุปกรณ์เสริม';
    const qty = Number(a.quantity || 0);
    const inUse = (a.assignees || []).length;
    const broken = Number(a.brokenQuantity || 0);
    if (!hwGroups[t]) hwGroups[t] = { total: 0, inUse: 0, avail: 0, broken: 0 };
    hwGroups[t].total  += qty;
    hwGroups[t].inUse  += inUse;
    hwGroups[t].avail  += Math.max(0, qty - inUse - broken);
    hwGroups[t].broken += broken;
  });

  // Software summary
  const swRows = licenses.map(l => ({
    name: l.name,
    stock: Number(l.quantity || 0),
    active: (l.assignees || []).length,
  }));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateITReport({
        month, year, companyName,
        employees, repairRequests, assets, accessories, licenses,
        bigIssues, rdProjects, followUps,
      });
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="bg-[#1E487A] text-white px-6 py-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg">📊</span> สร้าง IT Monthly Report
          </h3>
          <button onClick={onClose} className="text-blue-200 hover:text-white bg-[#133257]/50 hover:bg-[#133257] p-1.5 rounded-xl transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: Config form */}
          <div className="w-[55%] border-r border-slate-100 overflow-y-auto p-6 space-y-5">

            {/* Basic config */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-4">
              <h4 className="text-sm font-bold text-[#1E487A]">⚙️ ตั้งค่าทั่วไป</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>เดือน</label>
                  <select value={month} onChange={e => setMonth(Number(e.target.value))} className={inputCls}>
                    {TH_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>ปี (ค.ศ.)</label>
                  <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className={inputCls} min="2020" max="2050" />
                </div>
              </div>
              <div>
                <label className={labelCls}>ชื่อบริษัท (แสดงในไฟล์)</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Section 3: Big Issues (manual) */}
            <Section id="support" activeSection={activeSection} setActiveSection={setActiveSection} title="🔴 Big Issue Discussion (Slide 3)">
              <p className="text-xs text-slate-500">ข้อมูล Support (จำนวนพนักงาน/เคส) ดึงจากระบบอัตโนมัติ — กรอกเฉพาะ Big Issues</p>
              <BigIssuesEditor value={bigIssues} onChange={setBigIssues} />
            </Section>

            {/* Section 6: R&D */}
            <Section id="rd" activeSection={activeSection} setActiveSection={setActiveSection} title="🧪 R&D Projects (Slide 6)">
              <RDEditor value={rdProjects} onChange={setRdProjects} />
            </Section>

            {/* Section 7: Follow-up */}
            <Section id="followup" activeSection={activeSection} setActiveSection={setActiveSection} title="📌 วาระติดตาม Follow-up (Slide 7)">
              <FollowupEditor value={followUps} onChange={setFollowUps} />
            </Section>
          </div>

          {/* RIGHT: Data Preview */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-700">📋 ดูตัวอย่างข้อมูล (Auto จากระบบ)</h4>

            {/* Support stats */}
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Slide 3 — Support ({TH_MONTHS[month]})</p>
              <div className="grid grid-cols-2 gap-2">
                <PreviewCard title="พนักงานทั้งหมด" value={employees.length} sub="Employee" />
                <PreviewCard title="เคสทั้งหมด" value={monthly.length} sub={`เดือน${TH_MONTHS[month]}`} />
                <PreviewCard title="ปิดสำเร็จ" value={closedWon} sub="Close Won" color="#16a34a" />
                <PreviewCard title="ไม่สำเร็จ" value={closedLose} sub="Close Lose" color="#dc2626" />
              </div>
            </div>

            {/* Hardware */}
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Slide 4 — Hardware</p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#1E487A] text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">ประเภท</th>
                      <th className="px-2 py-2 text-center">รวม</th>
                      <th className="px-2 py-2 text-center">ใช้งาน</th>
                      <th className="px-2 py-2 text-center">ว่าง</th>
                      <th className="px-2 py-2 text-center text-red-300">ชำรุด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(hwGroups).length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-3 text-center text-slate-400">ไม่มีข้อมูล</td></tr>
                    ) : Object.entries(hwGroups).map(([type, g]) => (
                      <tr key={type} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-slate-700">{type}</td>
                        <td className="px-2 py-2 text-center font-bold text-[#1E487A]">{g.total}</td>
                        <td className="px-2 py-2 text-center text-slate-600">{g.inUse}</td>
                        <td className="px-2 py-2 text-center text-emerald-600">{g.avail}</td>
                        <td className="px-2 py-2 text-center text-red-500 font-semibold">{g.broken || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Software */}
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Slide 5 — Software ({licenses.length} รายการ)</p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#1E487A] text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">Software</th>
                      <th className="px-2 py-2 text-center">Stock</th>
                      <th className="px-2 py-2 text-center text-green-300">Active</th>
                      <th className="px-2 py-2 text-center text-amber-300">Inactive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {swRows.length === 0 ? (
                      <tr><td colSpan={4} className="px-3 py-3 text-center text-slate-400">ไม่มีข้อมูล</td></tr>
                    ) : swRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-slate-700">{r.name}</td>
                        <td className="px-2 py-2 text-center text-[#1E487A] font-bold">{r.stock}</td>
                        <td className="px-2 py-2 text-center text-emerald-600 font-semibold">{r.active}</td>
                        <td className="px-2 py-2 text-center text-amber-600">{Math.max(0, r.stock - r.active)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <p className="text-xs text-slate-500">
            รายงานจะสร้างเป็นไฟล์ <strong>.pptx</strong> — สามารถแก้ไขใน PowerPoint ได้ต่อ
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold text-sm transition-all">
              ยกเลิก
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${generating ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#1E487A] hover:bg-[#133257] text-white shadow-[#1E487A]/30'}`}
            >
              {generating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> กำลังสร้างไฟล์...</>
                : <><FileDown className="h-4 w-4" /> Export .pptx</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
