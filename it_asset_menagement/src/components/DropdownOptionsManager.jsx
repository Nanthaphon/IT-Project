import React, { useState } from 'react';
import { Building2, Truck, LayoutList, UserCheck, MapPin, Plus, X, Save } from 'lucide-react';

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
  blue:    { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-600',   chip: 'bg-blue-100 text-blue-800 border-blue-200',  btn: 'bg-blue-600 hover:bg-blue-700' },
  violet:  { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600', chip: 'bg-violet-100 text-violet-800 border-violet-200', btn: 'bg-violet-600 hover:bg-violet-700' },
  emerald: { bg: 'bg-emerald-50',border: 'border-emerald-200',icon: 'text-emerald-600',chip: 'bg-emerald-100 text-emerald-800 border-emerald-200', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  amber:   { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'text-amber-600',  chip: 'bg-amber-100 text-amber-800 border-amber-200',  btn: 'bg-amber-600 hover:bg-amber-700' },
  rose:    { bg: 'bg-rose-50',   border: 'border-rose-200',   icon: 'text-rose-600',   chip: 'bg-rose-100 text-rose-800 border-rose-200',   btn: 'bg-rose-600 hover:bg-rose-700' },
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
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-5 flex flex-col gap-4`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl bg-white border ${c.border} shrink-0`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-base leading-tight">{category.label}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{category.description}</p>
        </div>
        <span className="ml-auto text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
          {values.length} รายการ
        </span>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 min-h-[36px]">
        {values.length === 0 && (
          <p className="text-xs text-slate-400 italic">ยังไม่มีตัวเลือก กรอกด้านล่างเพื่อเพิ่ม</p>
        )}
        {values.map((val) => (
          <span
            key={val}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${c.chip}`}
          >
            {val}
            <button
              type="button"
              onClick={() => onRemove(category.key, val)}
              className="hover:text-red-600 transition-colors focus:outline-none"
              title="ลบ"
            >
              <X className="h-3 w-3" />
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
          className="flex-1 border border-slate-300 bg-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] shadow-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-semibold transition-all ${input.trim() ? `${c.btn} shadow-sm` : 'bg-slate-200 cursor-not-allowed text-slate-400'}`}
        >
          <Plus className="h-4 w-4" /> เพิ่ม
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">🗂️</span> ตั้งค่าตัวเลือกฟิลด์
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการรายการตัวเลือกที่จะแสดงใน Dropdown ของฟอร์มต่างๆ
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {savedAt && !dirty && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              บันทึกแล้ว
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${dirty && !saving ? 'bg-[#1E487A] hover:bg-[#133257] text-white shadow-[#1E487A]/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
          >
            <Save className="h-4 w-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* Unsaved banner */}
      {dirty && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-amber-700 text-sm font-medium">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก กด "บันทึก" เพื่อใช้งาน
        </div>
      )}

      {/* How to use */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-700 text-xs leading-relaxed">
        <span className="font-bold">วิธีใช้:</span> เพิ่มตัวเลือกในแต่ละหมวด กด <kbd className="bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded font-mono">Enter</kbd> หรือปุ่ม "เพิ่ม" แล้วกด "บันทึก"
        — ตัวเลือกจะปรากฏใน Dropdown ของฟอร์มเพิ่ม/แก้ไขรายการ (ยังพิมพ์เองได้เสมอ)
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
