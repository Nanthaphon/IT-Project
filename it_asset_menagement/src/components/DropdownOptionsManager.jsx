import React, { useState } from 'react';
import { Building2, Truck, LayoutList, UserCheck, MapPin, Plus, X, CheckCircle2, Loader2, Briefcase, Link2, ExternalLink } from 'lucide-react';
import { normalizeUrl, hostOf, newLinkId } from '../utils/links.js';

const CATEGORIES = [
  {
    key: 'companies',
    label: 'บริษัท / ผู้ผลิต',
    icon: Building2,
    color: 'blue',
    description: 'ใช้ในฟอร์มทรัพย์สินหลัก และพนักงาน',
    placeholder: 'เช่น Apple, Dell, HP, Lenovo...',
  },
  {
    key: 'vendors',
    label: 'ผู้จัดจำหน่าย (Vendor)',
    icon: Truck,
    color: 'violet',
    description: 'ใช้ในฟอร์มทรัพย์สินหลัก',
    placeholder: 'เช่น บริษัท ABC จำกัด, iStudio...',
  },
  {
    key: 'departments',
    label: 'แผนก',
    icon: LayoutList,
    color: 'emerald',
    description: 'ใช้ในฟอร์มทรัพย์สินและพนักงาน',
    placeholder: 'เช่น DX, BD, IT, HR, Finance...',
  },
  {
    key: 'forDepartments',
    label: 'สำหรับแผนก',
    icon: Briefcase,
    color: 'blue',
    description: 'ใช้ในฟอร์มทรัพย์สินหลัก (ระบุว่าทรัพย์สินสำหรับแผนกใด)',
    placeholder: 'เช่น General, Design Experience, Business Development...',
  },
  {
    key: 'positions',
    label: 'ตำแหน่งงาน',
    icon: UserCheck,
    color: 'amber',
    description: 'ใช้ในฟอร์มพนักงาน',
    placeholder: 'เช่น Developer, Designer, Manager...',
  },
  {
    key: 'locations',
    label: 'สถานที่ / ตำแหน่งจัดเก็บ',
    icon: MapPin,
    color: 'rose',
    description: 'ใช้ในฟอร์มทรัพย์สินหลัก',
    placeholder: 'เช่น สำนักงานใหญ่, ห้อง Server, ชั้น 3...',
  },
];

const COLOR_MAP = {
  blue:    { tint: '#DFEAEF', icon: 'text-stone-600',    chip: 'bg-stone-50 text-stone-700 border-stone-200',       btn: 'bg-stone-600 hover:bg-stone-700' },
  violet:  { tint: '#FBF4E6', icon: 'text-clay-600',  chip: 'bg-ochre-50 text-ochre-700 border-ochre-200', btn: 'bg-clay-600 hover:bg-clay-600' },
  emerald: { tint: '#EAF5F2', icon: 'text-olive-600', chip: 'bg-olive-50 text-olive-700 border-olive-200', btn: 'bg-olive-600 hover:bg-olive-700' },
  amber:   { tint: '#FBF4E6', icon: 'text-clay-600',   chip: 'bg-ochre-50 text-ochre-700 border-ochre-200',    btn: 'bg-clay-600 hover:bg-clay-600' },
  rose:    { tint: '#FBEAE8', icon: 'text-rose-600',    chip: 'bg-rose-50 text-rose-700 border-rose-200',       btn: 'bg-brick-600 hover:bg-brick-700' },
};

function CategoryCard({ category, values, onAdd, onRemove }) {
  const [input, setInput] = useState('');
  const c = COLOR_MAP[category.color];
  const Icon = category.icon;

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) { setInput(''); return; }
    onAdd(category.key, trimmed);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  };

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-6 flex flex-col gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-stone-300 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: c.tint }}
        >
          <Icon className={`h-5 w-5 ${c.icon}`} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-stone-900 text-[15px] leading-tight tracking-tight">{category.label}</h3>
          <p className="text-xs text-stone-500 mt-0.5">{category.description}</p>
        </div>
        <span className="text-xs font-medium text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full shrink-0">
          {values.length} รายการ
        </span>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {values.length === 0 && (
          <p className="text-[13px] text-stone-400 italic">ยังไม่มีตัวเลือก</p>
        )}
        {values.map((val) => (
          <span
            key={val}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${c.chip}`}
          >
            {val}
            <button
              type="button"
              onClick={() => onRemove(category.key, val)}
              className="hover:text-rose-600 transition-colors focus:outline-none"
              title="ลบ"
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={category.placeholder}
          className="flex-1 bg-white border border-stone-200/60 px-3 py-2 rounded-xl text-sm outline-none transition-colors hover:border-stone-300 focus:ring-2 focus:ring-clay-600/15 focus:border-clay-600"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${input.trim() ? `${c.btn} shadow-sm` : 'bg-stone-200 cursor-not-allowed text-stone-400'}`}
        >
          <Plus className="h-4 w-4" strokeWidth={2} /> เพิ่ม
        </button>
      </div>
    </div>
  );
}

/* ── ลิงก์ — ต่างจากหมวดอื่นตรงที่แต่ละรายการมี 2 ค่า (ชื่อ + URL)
   ตั้งไว้ที่นี่ที่เดียว แล้วไปเลือกใส่ให้พนักงานในหน้ารายละเอียดพนักงาน ── */
function LinksCard({ links, onAdd, onRemove }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const n = name.trim();
    const u = normalizeUrl(url);
    if (!n || !url.trim()) return;
    if (!u) { setError('URL ไม่ถูกต้อง'); return; }
    if (links.some((l) => l.name.toLowerCase() === n.toLowerCase())) { setError('มีชื่อนี้แล้ว'); return; }
    onAdd({ id: newLinkId(), name: n, url: u });
    setName(''); setUrl(''); setError('');
  };
  const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } };
  const ready = name.trim() && url.trim();

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-6 flex flex-col gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-stone-300 transition-colors md:col-span-2">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-clay-600/[0.08]">
          <Link2 className="h-5 w-5 text-clay-600" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-stone-900 text-[15px] leading-tight tracking-tight">ลิงก์</h3>
          <p className="text-xs text-stone-500 mt-0.5">เลือกใส่ให้พนักงานได้ในหน้ารายละเอียดพนักงาน</p>
        </div>
        <span className="text-xs font-medium text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full shrink-0">
          {links.length} รายการ
        </span>
      </div>

      {links.length === 0 ? (
        <p className="text-[13px] text-stone-400 italic">ยังไม่มีลิงก์</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((l) => (
            <li key={l.id} className="group flex items-center gap-3 rounded-xl border border-stone-200/60 px-3 py-2.5">
              <Link2 className="h-4 w-4 shrink-0 text-stone-400" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">{l.name}</p>
                <a href={l.url} target="_blank" rel="noopener noreferrer" title={l.url}
                  className="inline-flex max-w-full items-center gap-1 text-xs text-stone-400 hover:text-clay-600">
                  <span className="truncate">{hostOf(l.url) || l.url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={2} />
                </a>
              </div>
              <button type="button" onClick={() => onRemove(l.id)} title="ลบ"
                className="shrink-0 rounded-lg p-1 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-600">
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="text" value={name} onKeyDown={onKey} placeholder="ชื่อ เช่น แบบฟอร์มลาออก, Google Drive"
          onChange={(e) => { setName(e.target.value); setError(''); }}
          className="sm:w-64 bg-white border border-stone-200/60 px-3 py-2 rounded-xl text-sm outline-none transition-colors hover:border-stone-300 focus:ring-2 focus:ring-clay-600/15 focus:border-clay-600" />
        <input type="text" value={url} onKeyDown={onKey} placeholder="https://..."
          onChange={(e) => { setUrl(e.target.value); setError(''); }}
          className="flex-1 min-w-0 bg-white border border-stone-200/60 px-3 py-2 rounded-xl text-sm outline-none transition-colors hover:border-stone-300 focus:ring-2 focus:ring-clay-600/15 focus:border-clay-600" />
        <button type="button" onClick={handleAdd} disabled={!ready}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${ready ? 'bg-clay-600 text-white hover:bg-clay-700 shadow-sm' : 'bg-stone-200 cursor-not-allowed text-stone-400'}`}>
          <Plus className="h-4 w-4" strokeWidth={2} /> เพิ่ม
        </button>
      </div>
      {error && <p className="-mt-2 text-xs text-rose-700">{error}</p>}
    </div>
  );
}

/* ทุก key ที่อยู่ใน settings/fieldOptions ต้องอยู่ในก้อนนี้ — onSave ใช้ setDoc เขียนทับทั้งเอกสาร */
const toLocal = (fieldOptions = {}) => {
  const init = {};
  CATEGORIES.forEach(c => { init[c.key] = [...(fieldOptions[c.key] || [])]; });
  init.links = [...(fieldOptions.links || [])];
  return init;
};

/* บันทึกทันทีที่กดเพิ่ม/ลบ — ไม่มีปุ่ม "บันทึก" แยก (เดิมผู้ใช้กดเพิ่มแล้วลืมกดบันทึก ตัวเลือกหาย)
   onSave คืน false ถ้าบันทึกไม่สำเร็จ (App แจ้ง error เอง) → ย้อนกลับเป็นค่าล่าสุดจาก Firestore */
export default function DropdownOptionsManager({ fieldOptions, onSave }) {
  const [local, setLocal] = useState(() => toLocal(fieldOptions));
  /* ค่าล่าสุดแบบ synchronous — กดเพิ่มติดกันเร็ว ๆ ก่อน state อัปเดต จะได้ไม่เขียนทับกันเอง */
  const localRef = React.useRef(local);
  const [status, setStatus] = useState('idle'); // idle | saving | saved
  const pending = React.useRef(0);
  const savedTimer = React.useRef(null);

  // Firestore เปลี่ยน (โหลดครั้งแรก / แท็บอื่นแก้) → ตามค่าจริง
  React.useEffect(() => {
    const next = toLocal(fieldOptions);
    localRef.current = next;
    setLocal(next);
  }, [JSON.stringify(fieldOptions)]);

  React.useEffect(() => () => clearTimeout(savedTimer.current), []);

  const commit = async (update) => {
    const next = update(localRef.current);
    localRef.current = next;
    setLocal(next);
    pending.current += 1;
    setStatus('saving');
    clearTimeout(savedTimer.current);
    const ok = await onSave(next);
    pending.current -= 1;
    if (ok === false) {
      const back = toLocal(fieldOptions);
      localRef.current = back;
      setLocal(back);
      setStatus('idle');
      return;
    }
    if (pending.current === 0) {
      setStatus('saved');
      savedTimer.current = setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const handleAdd = (key, value) => commit(prev => ({ ...prev, [key]: [...prev[key], value] }));
  const handleRemove = (key, value) => commit(prev => ({ ...prev, [key]: prev[key].filter(v => v !== value) }));
  const handleAddLink = (link) => commit(prev => ({ ...prev, links: [...prev.links, link] }));
  const handleRemoveLink = (id) => commit(prev => ({ ...prev, links: prev.links.filter(l => l.id !== id) }));

  return (
    <div className="bg-sand-50 min-h-full">
      <div className="space-y-4 p-4 lg:p-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-medium tracking-tight text-stone-900">ตั้งค่าตัวเลือกฟิลด์</h1>
          <p className="mt-1 text-sm text-stone-500">ตัวเลือกใน Dropdown ของฟอร์ม · เพิ่มหรือลบแล้วบันทึกทันที</p>
        </div>
        <div className="flex h-9 items-center shrink-0" aria-live="polite">
          {status === 'saving' && (
            <span className="text-[13px] text-stone-400 font-medium flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              กำลังบันทึก...
            </span>
          )}
          {status === 'saved' && (
            <span className="text-[13px] text-olive-700 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
              บันทึกแล้ว
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.key}
            category={cat}
            values={local[cat.key] || []}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        ))}
        <LinksCard links={local.links || []} onAdd={handleAddLink} onRemove={handleRemoveLink} />
      </div>
      </div>
    </div>
  );
}
