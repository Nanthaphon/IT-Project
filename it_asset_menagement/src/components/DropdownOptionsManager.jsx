import React, { useState } from 'react';
import { Building2, Truck, LayoutList, UserCheck, MapPin, Plus, X, Save, CheckCircle2, AlertTriangle, SlidersHorizontal, Info, Briefcase } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

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
  blue:    { tint: '#EFF6FF', icon: 'text-blue-600',    chip: 'bg-blue-50 text-blue-700 ring-blue-200',       btn: 'bg-blue-600 hover:bg-blue-700' },
  violet:  { tint: '#F5F3FF', icon: 'text-violet-600',  chip: 'bg-violet-50 text-violet-700 ring-violet-200', btn: 'bg-violet-600 hover:bg-violet-700' },
  emerald: { tint: '#ECFDF5', icon: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  amber:   { tint: '#FFFBEB', icon: 'text-amber-600',   chip: 'bg-amber-50 text-amber-700 ring-amber-200',    btn: 'bg-amber-600 hover:bg-amber-700' },
  rose:    { tint: '#FFF1F2', icon: 'text-rose-600',    chip: 'bg-rose-50 text-rose-700 ring-rose-200',       btn: 'bg-rose-600 hover:bg-rose-700' },
};

function CategoryCard({ category, values, onAdd, onRemove, saving }) {
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
    <div className="rounded-2xl ring-1 ring-slate-200/70 bg-white p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: c.tint }}
        >
          <Icon className={`h-5 w-5 ${c.icon}`} strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-[15.5px] leading-tight tracking-tight">{category.label}</h3>
          <p className="text-[12.5px] text-slate-500 mt-0.5">{category.description}</p>
        </div>
        <span className="text-[12px] font-semibold text-slate-600 bg-slate-100 ring-1 ring-inset ring-slate-200 px-2 py-0.5 rounded-full shrink-0">
          {values.length} รายการ
        </span>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {values.length === 0 && (
          <p className="text-[13px] text-slate-400 italic">ยังไม่มีตัวเลือก กรอกด้านล่างเพื่อเพิ่ม</p>
        )}
        {values.map((val) => (
          <span
            key={val}
            className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ${c.chip}`}
          >
            {val}
            <button
              type="button"
              onClick={() => onRemove(category.key, val)}
              className="hover:text-rose-600 transition-colors focus:outline-none"
              title="ลบ"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
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
          className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-lg text-[14px] outline-none transition-colors hover:border-slate-300 focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-[14px] font-semibold transition-colors ${input.trim() ? `${c.btn} shadow-sm` : 'bg-slate-200 cursor-not-allowed text-slate-400'}`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} /> เพิ่ม
        </button>
      </div>
    </div>
  );
}

export default function DropdownOptionsManager({ fieldOptions, onSave, saving }) {
  // Local state: a copy we can mutate before saving
  const [local, setLocal] = useState(() => {
    const init = {};
    CATEGORIES.forEach(c => { init[c.key] = [...(fieldOptions[c.key] || [])]; });
    return init;
  });
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Sync when parent fieldOptions prop changes (e.g. first load from Firestore)
  React.useEffect(() => {
    setLocal(() => {
      const init = {};
      CATEGORIES.forEach(c => { init[c.key] = [...(fieldOptions[c.key] || [])]; });
      return init;
    });
    setDirty(false);
  }, [JSON.stringify(fieldOptions)]);

  const handleAdd = (key, value) => {
    setLocal(prev => ({ ...prev, [key]: [...prev[key], value] }));
    setDirty(true);
  };

  const handleRemove = (key, value) => {
    setLocal(prev => ({ ...prev, [key]: prev[key].filter(v => v !== value) }));
    setDirty(true);
  };

  const handleSave = async () => {
    await onSave(local);
    setDirty(false);
    setSavedAt(new Date());
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
          >
            <SlidersHorizontal className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[23px] font-semibold text-slate-900 tracking-tight leading-tight">ตั้งค่าตัวเลือกฟิลด์</h1>
            <p className="text-sm text-slate-500 mt-1">จัดการรายการตัวเลือกที่จะแสดงใน Dropdown ของฟอร์มต่างๆ</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {savedAt && !dirty && (
            <span className="text-[13px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
              บันทึกแล้ว
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[14.5px] transition-colors ${dirty && !saving ? 'text-white shadow-sm hover:shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            style={dirty && !saving ? { background: BRAND.primary, boxShadow: `0 4px 12px ${BRAND.primary}33` } : {}}
            onMouseEnter={(e) => dirty && !saving && (e.currentTarget.style.background = BRAND.primaryDark)}
            onMouseLeave={(e) => dirty && !saving && (e.currentTarget.style.background = BRAND.primary)}
          >
            <Save className="h-4 w-4" strokeWidth={2} />
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* Unsaved banner */}
      {dirty && (
        <div className="mb-5 bg-amber-50 ring-1 ring-inset ring-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-amber-700 text-[14px] font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก กด "บันทึก" เพื่อใช้งาน
        </div>
      )}

      {/* How to use */}
      <div className="mb-6 bg-blue-50/60 ring-1 ring-inset ring-blue-200 rounded-xl px-4 py-3 text-blue-800 text-[13.5px] leading-relaxed flex items-start gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
        <div>
          <span className="font-semibold">วิธีใช้:</span> เพิ่มตัวเลือกในแต่ละหมวด กด{' '}
          <kbd className="bg-white ring-1 ring-blue-300 px-1.5 py-0.5 rounded font-mono text-[12px]">Enter</kbd> หรือปุ่ม "เพิ่ม" แล้วกด "บันทึก"
          — ตัวเลือกจะปรากฏใน Dropdown ของฟอร์มเพิ่ม/แก้ไขรายการ (ยังพิมพ์เองได้เสมอ)
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
            saving={saving}
          />
        ))}
      </div>
    </div>
  );
}
