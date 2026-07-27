import React, { useState, useRef } from 'react';
import { Printer, X, Camera, ImagePlus, ClipboardCheck, AlertCircle, Trash2 } from 'lucide-react';
import {
  ASSESSMENT_SECTIONS,
  PHOTO_SLOTS,
  itemMaxScore,
  scoreFromStatus,
  buildEmptyAssessment,
  printHandoverForm,
} from '../utils/printHandoverForm.js';
import { compressAndUploadPhoto } from '../utils/uploadPhoto.js';

const STATUS_OPTIONS = [
  { value: 'normal',  label: 'ปกติ',  color: 'emerald' },
  { value: 'scratch', label: 'ตำหนิ', color: 'amber'   },
  { value: 'broken',  label: 'ชำรุด', color: 'rose'    },
];

const STATUS_COLOR_CLS = {
  emerald: 'bg-emerald-50 border-emerald-400 text-emerald-700',
  amber:   'bg-amber-50 border-amber-400 text-amber-700',
  rose:    'bg-rose-50 border-rose-400 text-rose-700',
};

export default function PreHandoverAssessmentModal({
  isOpen, onClose, employee, empAssets, empLicenses, empAccessories,
  bundledItems = [], handleAddBundledItem, handleDeleteBundledItem,
  transactions = [],
}) {
  // 🆕 กรองเหลือเฉพาะ notebook (ใบส่งมอบใช้ประเมิน 100 คะแนน = เฉพาะ notebook)
  const notebooks = React.useMemo(
    () => (empAssets || []).filter(a => {
      const t = String(a.type || '').toLowerCase();
      return t.includes('โน๊ตบุ๊ค') || t.includes('notebook') || t.includes('laptop');
    }),
    [empAssets]
  );

  // 🆕 asset picker — พนักงานอาจถือหลาย notebook
  const [selectedAssetId, setSelectedAssetId] = useState(
    notebooks.length === 1 ? notebooks[0].id : null
  );

  React.useEffect(() => {
    if (!isOpen) return;
    setSelectedAssetId(notebooks.length === 1 ? notebooks[0].id : null);
  }, [isOpen, employee?.id, notebooks.length]);

  const selectedAsset = React.useMemo(
    () => notebooks.find(a => a.id === selectedAssetId) || null,
    [notebooks, selectedAssetId]
  );

  // 🆕 หา checkout ของ asset ที่เลือก (ไม่ใช่ latest ทั้งหมด)
  const selectedCheckout = React.useMemo(() => {
    if (!employee?.id || !selectedAssetId) return null;
    return transactions
      .filter(t => t.action === 'เบิกจ่าย' && t.empId === employee.id && t.assetId === selectedAssetId)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0] || null;
  }, [employee?.id, selectedAssetId, transactions]);

  const [assessment,   setAssessment]   = useState(() => buildEmptyAssessment());
  const [photos,       setPhotos]       = useState({});
  const [defectsNote,  setDefectsNote]  = useState('');
  const [handoverDate, setHandoverDate] = useState(() => new Date().toISOString().slice(0, 10));

  // 🆕 sync assessment/photos/defects เมื่อเปลี่ยน asset ที่เลือก
  React.useEffect(() => {
    if (!isOpen) return;
    if (selectedCheckout) {
      setAssessment(selectedCheckout.checkoutAssessment || buildEmptyAssessment());
      setPhotos(selectedCheckout.checkoutPhotos || {});
      setDefectsNote(selectedCheckout.checkoutDefectsNote || '');
    } else if (selectedAssetId) {
      // เลือกเครื่องแล้วแต่ไม่มี transaction (เครื่องเก่าก่อนระบบ 100-point) → เริ่มจากว่าง
      setAssessment(buildEmptyAssessment());
      setPhotos({});
      setDefectsNote('');
    }
  }, [isOpen, selectedCheckout?.id, selectedAssetId]);
  // 🆕 รวม License + อุปกรณ์เสริมในใบส่งมอบหรือไม่ (default = ไม่รวม — กรณีเปลี่ยนเฉพาะเครื่อง)
  const [includeHoldings, setIncludeHoldings] = useState(false);

  // ── Bundled items (ของแถม) — เก็บ id ที่ติ๊กเลือก ──
  const [selectedBundleIds, setSelectedBundleIds] = useState([]);
  const [showAddBundleForm, setShowAddBundleForm] = useState(false);
  const [newBundle, setNewBundle] = useState({ name: '', type: 'กระเป๋า', model: '', note: '' });
  const [savingBundle, setSavingBundle] = useState(false);

  if (!isOpen) return null;

  const toggleBundle = (id) =>
    setSelectedBundleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSaveNewBundle = async () => {
    if (!newBundle.name.trim() || !handleAddBundledItem) return;
    setSavingBundle(true);
    try {
      const newId = await handleAddBundledItem(newBundle);
      if (newId) {
        setSelectedBundleIds(prev => [...prev, newId]);
        setShowAddBundleForm(false);
        setNewBundle({ name: '', type: 'กระเป๋า', model: '', note: '' });
      }
    } finally {
      setSavingBundle(false);
    }
  };

  const selectedBundles = bundledItems.filter(b => selectedBundleIds.includes(b.id));

  /* ── update item status + auto-set score from status ── */
  const setItemStatus = (no, status, sectionIdx) => {
    const max = itemMaxScore(sectionIdx);
    setAssessment(prev => ({
      ...prev,
      [no]: { status, score: scoreFromStatus(status, max) },
    }));
  };

  /* ── grand total calculation ── */
  const grandTotal = Object.values(assessment).reduce(
    (sum, cell) => sum + (cell?.score != null ? Number(cell.score) : 0),
    0
  );
  const grade = grandTotal >= 90 ? 'A' : grandTotal >= 75 ? 'B' : grandTotal >= 60 ? 'C' : 'D';
  const gradeColor = { A: 'text-emerald-600', B: 'text-blue-600', C: 'text-amber-600', D: 'text-rose-600' }[grade];

  const handlePrint = () => {
    if (!selectedAsset) return;   // ยังไม่เลือกเครื่อง — กันพิมพ์
    printHandoverForm({
      employee,
      empAssets: [selectedAsset],   // 🆕 พิมพ์เฉพาะเครื่องที่เลือก
      empLicenses:    includeHoldings ? empLicenses    : [],
      empAccessories: includeHoldings ? empAccessories : [],
      assessment, photos, defectsNote, handoverDate,
      bundledItems: selectedBundles,
    });
    onClose();
  };

  /* ── Set all items in one section to the same status (quick fill) ── */
  const setSectionStatus = (sectionIdx, status) => {
    const max = itemMaxScore(sectionIdx);
    const updates = {};
    ASSESSMENT_SECTIONS[sectionIdx].items.forEach(([no]) => {
      updates[no] = { status, score: scoreFromStatus(status, max) };
    });
    setAssessment(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)] w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200/60 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1E487A]/10 text-[#1E487A] flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-slate-900 leading-tight">เตรียมข้อมูลก่อนพิมพ์ใบส่งมอบ</h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                ติ๊กผลประเมินสภาพอุปกรณ์ + แนบรูปก่อนส่งมอบให้ <span className="font-semibold text-slate-700">{employee?.fullName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-6 bg-slate-50/40">

          {/* 🆕 Asset picker — เมื่อพนักงานถือหลาย notebook ต้องเลือกก่อน */}
          {notebooks.length > 1 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-3">
                <ClipboardCheck className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" strokeWidth={2} />
                <div>
                  <p className="text-[13.5px] font-bold text-amber-900">พนักงานถือโน๊ตบุ๊ค {notebooks.length} เครื่อง — เลือกเครื่องที่จะพิมพ์ใบส่งมอบ</p>
                  <p className="text-[12px] text-amber-700/80 mt-0.5">ใบส่งมอบต้องออกทีละเครื่อง เพื่อให้ข้อมูลประเมินตรงกับเครื่องนั้น</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notebooks.map(a => {
                  const isSelected = selectedAssetId === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAssetId(a.id)}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-white border border-[#1E487A] shadow-sm'
                          : 'bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border ${isSelected ? 'border-[#1E487A] bg-[#1E487A]' : 'border-slate-300 bg-white'} shrink-0`}>
                          {isSelected && (
                            <svg viewBox="0 0 20 20" className="w-full h-full text-white p-0.5" fill="currentColor">
                              <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold text-slate-800 truncate">{a.name}</p>
                          <p className="text-[11.5px] text-slate-500 truncate">
                            {[a.assetTag, a.sn].filter(Boolean).join(' · ') || (a.type || '-')}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top: handover date */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <label className="block text-[13px] font-medium text-slate-600 mb-1.5">
              วันที่รับมอบ
            </label>
            <input
              type="date"
              value={handoverDate}
              onChange={(e) => setHandoverDate(e.target.value)}
              className="w-full sm:w-72 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
            />
            {selectedAsset && (
              <p className="mt-2 text-[12px] text-slate-500">
                📄 พิมพ์สำหรับ: <span className="font-semibold text-slate-700">{selectedAsset.name}</span>
                {selectedCheckout ? (
                  <span className="ml-1.5 text-emerald-700 font-medium">· ✓ pre-fill จาก transaction</span>
                ) : (
                  <span className="ml-1.5 text-amber-700 font-medium">· ⚠ ไม่มี transaction — เริ่มประเมินใหม่</span>
                )}
              </p>
            )}
          </div>

          {/* Score banner */}
          <div className="bg-[#1E487A] text-white rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-[12px] opacity-80 font-medium">คะแนนรวม (100)</div>
              <div className="text-[34px] font-bold leading-none mt-1">{grandTotal % 1 === 0 ? grandTotal : grandTotal.toFixed(1)}</div>
            </div>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="text-[10.5px] opacity-80 font-semibold tracking-[0.14em] uppercase">เกรด</div>
              <div className={`w-14 h-14 rounded-xl bg-white shadow-sm border border-white/40 flex items-center justify-center text-[30px] font-extrabold leading-none ${gradeColor}`}>
                {grade}
              </div>
              <div className="text-[11px] opacity-90 font-medium leading-tight text-center max-w-[140px]">
                {grade === 'A' ? 'ดีเยี่ยม' : grade === 'B' ? 'ผ่าน (มีรอยเล็กน้อย)' : grade === 'C' ? 'ต้องซ่อม' : 'เสียหายหนัก'}
              </div>
            </div>
          </div>

          {/* ── 5. Assessment ── */}
          <Section title="5. แบบประเมินสภาพอุปกรณ์ (100 คะแนน)">
            <div className="space-y-4">
              {ASSESSMENT_SECTIONS.map((sec, si) => {
                const itemMax = itemMaxScore(si);
                const sectionScore = sec.items.reduce((s, [no]) => s + (assessment[no]?.score || 0), 0);
                return (
                  <div key={sec.title} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[14px] font-semibold text-[#1E487A] truncate">{sec.title}</span>
                        <span className="text-[12px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                          {sectionScore % 1 === 0 ? sectionScore : sectionScore.toFixed(1)} / {sec.max}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <QuickFillBtn onClick={() => setSectionStatus(si, 'normal')}  color="emerald">ทั้งหมดปกติ</QuickFillBtn>
                        <QuickFillBtn onClick={() => setSectionStatus(si, 'scratch')} color="amber">ทั้งหมดตำหนิ</QuickFillBtn>
                        <QuickFillBtn onClick={() => setSectionStatus(si, 'broken')}  color="rose">ทั้งหมดชำรุด</QuickFillBtn>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {sec.items.map(([no, name, criteria]) => {
                        const cell = assessment[no] || {};
                        return (
                          <div key={no} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/60">
                            <span className="text-[12px] font-mono text-slate-400 shrink-0 w-8">{no}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13.5px] font-semibold text-slate-700 truncate">{name}</div>
                              <div className="text-[11.5px] text-slate-500 truncate">{criteria}</div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {STATUS_OPTIONS.map(opt => {
                                const selected = cell.status === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setItemStatus(no, opt.value, si)}
                                    className={`text-[12px] font-semibold px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap ${
                                      selected
                                        ? STATUS_COLOR_CLS[opt.color] + ' ring-2 ring-current/30'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="w-14 shrink-0 text-right">
                              <span className="text-[13px] font-bold text-[#1E487A] tabular-nums">
                                {cell.score != null ? (cell.score % 1 === 0 ? cell.score : cell.score.toFixed(2)) : '-'}
                              </span>
                              <span className="text-[10px] text-slate-400">/{itemMax % 1 === 0 ? itemMax : itemMax.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── 6. Defects ── */}
          <Section title="6. บันทึกตำหนิที่มีอยู่แล้ว">
            <textarea
              value={defectsNote}
              onChange={(e) => setDefectsNote(e.target.value)}
              rows={3}
              placeholder='ระบุตำหนิ / รอย / Dead Pixel ที่มีอยู่แล้วก่อนส่งมอบ (ถ้าไม่มีให้ระบุ "ไม่มี")'
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] resize-none"
            />
          </Section>

          {/* ── 7. Photos ── */}
          <Section title="7. รูปภาพสภาพอุปกรณ์ก่อนส่งมอบ (6 มุม)">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PHOTO_SLOTS.map(slot => (
                <PhotoUploadSlot
                  key={slot.key}
                  label={slot.label}
                  src={photos[slot.key]}
                  onUpload={(src) => setPhotos(prev => ({ ...prev, [slot.key]: src }))}
                  onRemove={() => setPhotos(prev => { const n = { ...prev }; delete n[slot.key]; return n; })}
                />
              ))}
            </div>
            <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-blue-50/60 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" strokeWidth={2} />
              <p className="text-[12.5px] text-blue-700 leading-relaxed">
                แนะนำให้แนบครบทั้ง 6 มุม รูปจะถูกฝังลงในเอกสาร PDF ที่พิมพ์ออก
              </p>
            </div>
          </Section>

          {/* ── Section: ของแถม (กระเป๋า / สายชาร์จ / ฯลฯ) ── */}
          <Section title="ของแถม (กระเป๋า / สายชาร์จ ที่มอบให้พนักงาน)">
            <div className="space-y-3">
              {bundledItems.length === 0 && !showAddBundleForm ? (
                <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-[13.5px] text-slate-500 mb-2.5">ยังไม่มีของแถมในระบบ — กดปุ่มด้านล่างเพื่อเพิ่มเป็นรายการแรก</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bundledItems.map(item => {
                    const checked = selectedBundleIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors border ${
                          checked
                            ? 'bg-blue-50 border border-[#1E487A]'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleBundle(item.id)}
                          className="mt-1 w-4 h-4 text-[#1E487A] focus:ring-[#1E487A] border-slate-300 rounded shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13.5px] font-semibold text-slate-800 truncate">{item.name}</span>
                            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.type || 'อื่นๆ'}</span>
                          </div>
                          {(item.model || item.note) && (
                            <div className="mt-0.5 text-[12px] text-slate-500 truncate">
                              {item.model || ''}{item.model && item.note ? ' · ' : ''}{item.note || ''}
                            </div>
                          )}
                        </div>
                        {handleDeleteBundledItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              if (window.confirm(`ลบ "${item.name}" ออกจากระบบของแถม?`)) {
                                handleDeleteBundledItem(item.id);
                                setSelectedBundleIds(prev => prev.filter(x => x !== item.id));
                              }
                            }}
                            title="ลบออกจาก catalog"
                            className="text-slate-300 hover:text-rose-500 transition-colors shrink-0 p-0.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Add new bundle item form */}
              {showAddBundleForm ? (
                <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-3 space-y-2 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newBundle.name}
                      onChange={e => setNewBundle({ ...newBundle, name: e.target.value })}
                      placeholder="ชื่อ (เช่น Lenovo Bag, USB-C 65W)"
                      className="border border-slate-300 px-2.5 py-1.5 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30 focus:border-[#1E487A]"
                      autoFocus
                    />
                    <select
                      value={newBundle.type}
                      onChange={e => setNewBundle({ ...newBundle, type: e.target.value })}
                      className="border border-slate-300 px-2.5 py-1.5 rounded-md text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30"
                    >
                      <option>กระเป๋า</option>
                      <option>สายชาร์จ / Adapter</option>
                      <option>สาย HDMI</option>
                      <option>สาย LAN</option>
                      <option>อื่นๆ</option>
                    </select>
                    <input
                      type="text"
                      value={newBundle.model}
                      onChange={e => setNewBundle({ ...newBundle, model: e.target.value })}
                      placeholder="รุ่น / สี (ถ้ามี)"
                      className="border border-slate-300 px-2.5 py-1.5 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30"
                    />
                    <input
                      type="text"
                      value={newBundle.note}
                      onChange={e => setNewBundle({ ...newBundle, note: e.target.value })}
                      placeholder="หมายเหตุ (ถ้ามี)"
                      className="border border-slate-300 px-2.5 py-1.5 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowAddBundleForm(false); setNewBundle({ name: '', type: 'กระเป๋า', model: '', note: '' }); }}
                      className="px-3 py-1.5 text-[12.5px] text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewBundle}
                      disabled={!newBundle.name.trim() || savingBundle}
                      className="px-3 py-1.5 text-[12.5px] font-semibold text-white bg-[#1E487A] hover:bg-[#163963] rounded-md disabled:opacity-50"
                    >
                      {savingBundle ? 'กำลังเพิ่ม...' : 'เพิ่มเข้า Catalog + เลือก'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddBundleForm(true)}
                  className="w-full px-3 py-2 text-[13px] font-semibold text-[#1E487A] bg-white border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 hover:border-[#1E487A] transition-colors"
                >
                  + เพิ่มของแถมใหม่เข้า Catalog
                </button>
              )}

              {selectedBundles.length > 0 && (
                <div className="text-[12.5px] text-slate-600 bg-emerald-50/60 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="font-semibold text-emerald-700">เลือกแล้ว {selectedBundles.length} รายการ</span> — จะแสดงในส่วนที่ 4.1 ของใบส่งมอบ
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-white shrink-0 gap-3 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <div className="text-[12.5px] text-slate-500">
              แนบรูปแล้ว <span className="font-semibold text-slate-700">{Object.keys(photos).length}/6</span> รูป
              · คะแนนรวม <span className="font-semibold text-[#1E487A]">{grandTotal % 1 === 0 ? grandTotal : grandTotal.toFixed(1)}</span>/100
            </div>
            {/* 🆕 Toggle รวม License + อุปกรณ์เสริม */}
            {(empLicenses?.length > 0 || empAccessories?.length > 0) && (
              <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeHoldings}
                  onChange={(e) => setIncludeHoldings(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#1E487A] rounded border-slate-300 focus:ring-[#1E487A]/30"
                />
                รวม License/อุปกรณ์เสริมในใบนี้
                <span className="text-slate-400">({(empLicenses?.length || 0) + (empAccessories?.length || 0)} รายการ)</span>
              </label>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-[14px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handlePrint}
              disabled={!selectedAsset}
              title={!selectedAsset ? 'กรุณาเลือกเครื่องก่อน' : ''}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-semibold rounded-lg shadow-sm transition ${
                selectedAsset
                  ? 'text-white bg-[#1E487A] hover:bg-[#163963]'
                  : 'text-slate-400 bg-slate-200 cursor-not-allowed'
              }`}
              style={selectedAsset ? { boxShadow: '0 4px 14px rgba(30,72,122,0.30)' } : undefined}
            >
              <Printer className="h-4 w-4" strokeWidth={2.2} />
              พิมพ์เอกสาร / บันทึก PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ────────────────────────── Reusable bits ────────────────────────── */
function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-[13px] font-semibold tracking-[0.08em] text-slate-500 uppercase mb-2.5">{title}</h4>
      {children}
    </div>
  );
}

function QuickFillBtn({ onClick, color, children }) {
  const cls = {
    emerald: 'text-emerald-700 border-emerald-200 hover:bg-emerald-50',
    amber:   'text-amber-700 border-amber-200 hover:bg-amber-50',
    rose:    'text-rose-700 border-rose-200 hover:bg-rose-50',
  }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] font-semibold px-2 py-1 rounded-md border bg-white transition whitespace-nowrap ${cls}`}
    >
      {children}
    </button>
  );
}

function PhotoUploadSlot({ label, src, onUpload, onRemove }) {
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // 🆕 upload ไป Firebase Storage → save เฉพาะ URL
      const url = await compressAndUploadPhoto(file, 'assessment-photos');
      if (url) onUpload(url);
    } catch (err) {
      console.error('Compress image failed:', err);
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-semibold text-slate-700 truncate">{label}</span>
        {src && (
          <button
            type="button"
            onClick={onRemove}
            className="text-rose-500 hover:text-rose-600 p-1 rounded transition"
            title="ลบรูป"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="p-2">
        {src ? (
          <div className="relative h-32 rounded-lg overflow-hidden bg-slate-50 border border-slate-200">
            <img src={src} alt={label} className="w-full h-full object-cover" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-lg border border-dashed border-slate-300 hover:border-[#1E487A] hover:bg-blue-50/60 transition flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#1E487A]"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#1E487A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" strokeWidth={1.8} />
                <span className="text-[11.5px] font-medium">แนบรูป</span>
              </>
            )}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={handleSelect} className="hidden" />
    </div>
  );
}
