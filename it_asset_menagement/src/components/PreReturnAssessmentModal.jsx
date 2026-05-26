import React, { useState, useRef } from 'react';
import {
  Printer, X, AlertCircle, ImagePlus, ClipboardCheck, Trash2, Plus,
} from 'lucide-react';
import {
  ASSESSMENT_SECTIONS, itemMaxScore, scoreFromStatus, buildEmptyAssessment,
} from '../utils/printHandoverForm.js';
import { DAMAGE_FEE_TABLE } from '../utils/printHandoverForm.js';
import { RETURN_PHOTO_SLOTS, DAMAGE_PHOTO_SLOTS, printReturnForm } from '../utils/printReturnForm.js';
import { compressImages } from '../utils/compressImage.js';
import { migrateFields } from './ConditionCapture.jsx';

/* ── Pre-fill 18 sub-items จาก 6 หมวด in-app
 * แต่ละ in-app key (index 0-5) ตรงกับ ASSESSMENT_SECTIONS index 0-5
 * ── */
const IN_APP_KEY_BY_SECTION = ['case', 'display', 'keyboard', 'software', 'performance', 'accessories'];

function inAppFieldsToAssessment(inAppFields) {
  if (!inAppFields || typeof inAppFields !== 'object') return buildEmptyAssessment();
  // migrate ก่อน เผื่อเป็น shape เก่า
  const fields = migrateFields(inAppFields);
  const a = {};
  ASSESSMENT_SECTIONS.forEach((sec, si) => {
    const key    = IN_APP_KEY_BY_SECTION[si];
    const status = fields[key]?.status || 'normal';
    const max    = itemMaxScore(si);
    sec.items.forEach(([no]) => {
      a[no] = { status, score: scoreFromStatus(status, max) };
    });
  });
  return a;
}

const STATUS_OPTIONS = [
  { value: 'normal',  label: 'ปกติ',  color: 'emerald' },
  { value: 'scratch', label: 'ตำหนิ', color: 'amber'   },
  { value: 'broken',  label: 'ชำรุด', color: 'rose'    },
];

const STATUS_COLOR_CLS = {
  emerald: 'bg-emerald-50 ring-emerald-400 text-emerald-700',
  amber:   'bg-amber-50 ring-amber-400 text-amber-700',
  rose:    'bg-rose-50 ring-rose-400 text-rose-700',
};

// ── flatten DAMAGE_FEE_TABLE to data rows only (skip { group } headers) ──
const DAMAGE_ITEMS = DAMAGE_FEE_TABLE.filter(r => Array.isArray(r));
//  Each row: [no, name, gen, data, gx, note]

const tierColIdx = (tier = 'General') => {
  const t = String(tier).toLowerCase();
  if (t.includes('graphic') || t.includes('dx')) return 4;
  if (t.includes('data')) return 3;
  return 2; // default General
};

const feeFor = (damageRow, tier) => {
  if (!damageRow) return 0;
  const idx = tierColIdx(tier);
  const v = damageRow[idx];
  return typeof v === 'number' ? v : 0;
};

export default function PreReturnAssessmentModal({
  isOpen, onClose,
  employee, mainAsset,
  handoverDate,   // ISO string or '' (from checkout transaction)
  returnDate,     // ISO string or '' (from return transaction)
  // optional pre-fill from saved data
  presetAssessment = null,
  // ── Pre-fill 18 sub-items จาก 6 หมวด in-app (Option B mapping) ──
  inAppFieldsReturn   = null,  // returnFields ของ tx รับคืน
  inAppFieldsHandover = null,  // checkoutFields ของ tx เบิกจ่าย
}) {
  const [assessmentReturn,   setAssessmentReturn]   = useState(() =>
    presetAssessment || inAppFieldsToAssessment(inAppFieldsReturn)
  );
  const [assessmentHandover, setAssessmentHandover] = useState(() =>
    inAppFieldsToAssessment(inAppFieldsHandover)
  );
  // เปิดแท็บ "ขา 1" อัตโนมัติถ้ามีข้อมูล in-app ของ handover
  const [showHandover, setShowHandover] = useState(!!inAppFieldsHandover);
  const [photosReturn, setPhotosReturn] = useState({});
  const [photosDamage, setPhotosDamage] = useState({});
  const [damages, setDamages] = useState([]); // [{ name, fee }]
  const [notes, setNotes] = useState('');
  const [tier, setTier] = useState(mainAsset?.tier || 'General');

  const [editableHandoverDate, setEditableHandoverDate] = useState(
    handoverDate ? new Date(handoverDate).toISOString().slice(0, 10) : ''
  );
  const [editableReturnDate, setEditableReturnDate] = useState(
    returnDate ? new Date(returnDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );

  if (!isOpen) return null;

  /* ── Score helpers ── */
  const setItemStatus = (assessmentSetter, no, status, sectionIdx) => {
    const max = itemMaxScore(sectionIdx);
    assessmentSetter(prev => ({ ...prev, [no]: { status, score: scoreFromStatus(status, max) } }));
  };

  const setSectionStatus = (assessmentSetter, sectionIdx, status) => {
    const max = itemMaxScore(sectionIdx);
    const updates = {};
    ASSESSMENT_SECTIONS[sectionIdx].items.forEach(([no]) => {
      updates[no] = { status, score: scoreFromStatus(status, max) };
    });
    assessmentSetter(prev => ({ ...prev, ...updates }));
  };

  const grandTotal = Object.values(assessmentReturn).reduce(
    (sum, cell) => sum + (cell?.score != null ? Number(cell.score) : 0), 0
  );
  const grade = grandTotal >= 90 ? 'A' : grandTotal >= 75 ? 'B' : grandTotal >= 60 ? 'C' : 'D';
  const gradeColor = { A: 'text-emerald-600', B: 'text-blue-600', C: 'text-amber-600', D: 'text-rose-600' }[grade];

  /* ── Damages with fee calculation per Tier ── */
  const addDamage = () => setDamages(prev => [...prev, { name: '', fee: 0 }]);
  const updateDamage = (i, patch) => setDamages(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  const removeDamage = (i) => setDamages(prev => prev.filter((_, idx) => idx !== i));
  const pickDamageTemplate = (i, refNo) => {
    const row = DAMAGE_ITEMS.find(r => r[0] === Number(refNo));
    if (!row) return;
    updateDamage(i, { name: row[1], fee: feeFor(row, tier) });
  };
  const totalFee = damages.reduce((s, d) => s + (Number(d.fee) || 0), 0);

  /* ── Print ── */
  const handlePrint = () => {
    printReturnForm({
      employee, mainAsset,
      handoverDate: editableHandoverDate,
      returnDate:   editableReturnDate,
      assessmentReturn,
      assessmentHandover: showHandover ? assessmentHandover : null,
      photosReturn, photosDamage,
      damages, notes, tier,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 w-full max-w-5xl max-h-[92vh] flex flex-col ring-1 ring-slate-200/60 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[18px] font-semibold text-slate-900 leading-tight">เตรียมข้อมูลก่อนพิมพ์ใบรับคืน</h3>
              <p className="text-[13px] text-slate-500 mt-0.5 truncate">
                ติ๊กผลประเมิน + แนบรูป + ระบุค่าปรับ ก่อนพิมพ์เอกสารให้ <span className="font-semibold text-slate-700">{employee?.fullName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition shrink-0">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-6 bg-slate-50/40">

          {/* Dates + Tier */}
          <div className="bg-white ring-1 ring-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-600 mb-1.5">วันที่รับมอบ (ขา 1)</label>
              <input type="date" value={editableHandoverDate}
                onChange={(e) => setEditableHandoverDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"/>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-600 mb-1.5">วันที่คืน (ขา 2)</label>
              <input type="date" value={editableReturnDate}
                onChange={(e) => setEditableReturnDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"/>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-600 mb-1.5">Tier (อัตราค่าปรับ)</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]">
                <option value="General">General (~25K)</option>
                <option value="Data">Data (~35K)</option>
                <option value="Graphic/DX">Graphic/DX (~55K)</option>
              </select>
            </div>
          </div>

          {/* Score banner */}
          <div className="bg-gradient-to-r from-[#1E487A] to-[#163963] text-white rounded-xl p-4 flex items-center justify-between shadow-md">
            <div>
              <div className="text-[12px] opacity-80 font-medium">คะแนนรับคืน (ขา 2) /100</div>
              <div className="text-[34px] font-bold leading-none mt-1">{grandTotal % 1 === 0 ? grandTotal : grandTotal.toFixed(1)}</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] opacity-80 font-medium">เกรด</div>
              <div className={`text-[34px] font-extrabold leading-none mt-1 bg-white rounded-lg px-4 py-1 inline-block ${gradeColor}`}>
                {grade}
              </div>
              <div className="text-[11px] opacity-80 mt-1">
                {grade === 'A' ? 'ดีเยี่ยม' : grade === 'B' ? 'ผ่าน (มีรอยเล็กน้อย)' : grade === 'C' ? 'ต้องซ่อม' : 'เสียหายหนัก'}
              </div>
            </div>
          </div>

          {/* Assessment ขา 2 */}
          <Section title="ผลการประเมินรับคืน (ขา 2) — 100 คะแนน">
            <AssessmentEditor
              assessment={assessmentReturn}
              setItemStatus={(no, status, si) => setItemStatus(setAssessmentReturn, no, status, si)}
              setSectionStatus={(si, status) => setSectionStatus(setAssessmentReturn, si, status)}
            />
          </Section>

          {/* Optional: ขา 1 fill (collapsible) */}
          <div className="bg-white ring-1 ring-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHandover(!showHandover)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left"
            >
              <div>
                <p className="text-[13.5px] font-semibold text-slate-700">📋 กรอกคะแนนตอนส่งมอบ (ขา 1) เพื่อเปรียบเทียบ</p>
                <p className="text-[11.5px] text-slate-500 mt-0.5">ถ้ามี IT-FORM-001 ฉบับเดิม ก็คัดลอกคะแนนมาเพื่อให้ตารางเปรียบเทียบในเอกสารแสดงครบ</p>
              </div>
              <span className="text-[12px] font-semibold text-[#1E487A]">{showHandover ? 'ซ่อน' : 'แสดง'}</span>
            </button>
            {showHandover && (
              <div className="px-4 pb-4 border-t border-slate-100">
                <AssessmentEditor
                  assessment={assessmentHandover}
                  setItemStatus={(no, status, si) => setItemStatus(setAssessmentHandover, no, status, si)}
                  setSectionStatus={(si, status) => setSectionStatus(setAssessmentHandover, si, status)}
                />
              </div>
            )}
          </div>

          {/* Damages — รายการ + คำนวณค่าปรับตาม Tier */}
          <Section title="รายการความเสียหายและค่าปรับ">
            <div className="bg-white ring-1 ring-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-blue-50/60 border-b border-blue-200">
                <p className="text-[12.5px] text-blue-700 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  เลือกจากตารางอ้างอิง <b>ค่าปรับจะ auto-fill ตาม Tier "{tier}"</b> — แก้ตัวเลขในช่องได้ถ้าจริงต่างจากตาราง
                </p>
              </div>
              {damages.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-[13px]">
                  — ยังไม่มีรายการ — กดปุ่มด้านล่างเพื่อเพิ่ม
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-[12px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-2 w-12">ลำดับ</th>
                      <th className="text-left text-[12px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">รายละเอียดความเสียหาย</th>
                      <th className="text-left text-[12px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-2 w-36">ค่าปรับ (THB)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {damages.map((d, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-[13px] font-mono text-slate-500 text-center">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <select
                              value=""
                              onChange={(e) => pickDamageTemplate(i, e.target.value)}
                              className="text-[12px] bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none hover:border-slate-300 focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
                            >
                              <option value="">เลือกจากตารางอ้างอิง...</option>
                              {DAMAGE_ITEMS.map(row => (
                                <option key={row[0]} value={row[0]}>{row[0]}. {row[1]} — {typeof row[tierColIdx(tier)] === 'number' ? Number(row[tierColIdx(tier)]).toLocaleString('th-TH') + ' ฿' : row[tierColIdx(tier)]}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={d.name}
                              onChange={(e) => updateDamage(i, { name: e.target.value })}
                              placeholder="หรือพิมพ์รายละเอียดเอง"
                              className="w-full text-[14px] bg-white border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min="0" step="any"
                            value={d.fee}
                            onChange={(e) => updateDamage(i, { fee: e.target.value })}
                            className="w-full text-[14px] bg-white border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] tabular-nums text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeDamage(i)}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded transition"
                            title="ลบรายการ"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50">
                      <td colSpan={2} className="px-3 py-2.5 text-right text-[13.5px] font-bold text-slate-700">รวมค่าปรับทั้งหมด</td>
                      <td className="px-3 py-2.5 text-right text-[15px] font-bold text-rose-600 tabular-nums">{Number(totalFee).toLocaleString('th-TH')} ฿</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
              <div className="px-3 py-2.5 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={addDamage}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1E487A] hover:bg-blue-50 px-2.5 py-1 rounded transition"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.2} /> เพิ่มรายการ
                </button>
              </div>
            </div>
          </Section>

          {/* Notes */}
          <Section title="หมายเหตุเพิ่มเติม">
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="หมายเหตุ / เงื่อนไขพิเศษ (ถ้ามี)"
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] resize-none"
            />
          </Section>

          {/* Photos — 6 angles */}
          <Section title="รูปภาพรับคืน 6 มุม">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {RETURN_PHOTO_SLOTS.map(slot => (
                <PhotoUploadSlot key={slot.key} label={slot.label} src={photosReturn[slot.key]}
                  onUpload={(s) => setPhotosReturn(prev => ({ ...prev, [slot.key]: s }))}
                  onRemove={() => setPhotosReturn(prev => { const n = { ...prev }; delete n[slot.key]; return n; })}/>
              ))}
            </div>
          </Section>

          {/* Damage photos */}
          <Section title="รูปภาพความเสียหาย (ถ้ามี)">
            <div className="grid grid-cols-2 gap-3">
              {DAMAGE_PHOTO_SLOTS.map(slot => (
                <PhotoUploadSlot key={slot.key} label={slot.label} src={photosDamage[slot.key]} large
                  onUpload={(s) => setPhotosDamage(prev => ({ ...prev, [slot.key]: s }))}
                  onRemove={() => setPhotosDamage(prev => { const n = { ...prev }; delete n[slot.key]; return n; })}/>
              ))}
            </div>
            <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-blue-50/60 ring-1 ring-inset ring-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" strokeWidth={2} />
              <p className="text-[12.5px] text-blue-700 leading-relaxed">
                แนบรูปได้ถึง 4 รูป — ใช้ถ่ายความเสียหายเป็นหลักฐาน ภาพจะถูกฝังลง PDF ที่พิมพ์ออก
              </p>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-white shrink-0 gap-3">
          <div className="text-[12.5px] text-slate-500">
            แนบรูปทั่วไป <b>{Object.keys(photosReturn).length}/6</b> · ความเสียหาย <b>{Object.keys(photosDamage).length}/4</b>
            &nbsp;·&nbsp; ค่าปรับรวม <b className="text-rose-600">{Number(totalFee).toLocaleString('th-TH')} ฿</b>
          </div>
          <div className="flex gap-2.5">
            <button onClick={onClose} className="px-5 py-2.5 text-[14px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              ยกเลิก
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-semibold text-white rounded-lg shadow-sm hover:shadow-md transition"
              style={{ background: '#1E487A', boxShadow: '0 4px 14px rgba(30,72,122,0.30)' }}
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
    emerald: 'text-emerald-700 ring-emerald-200 hover:bg-emerald-50',
    amber:   'text-amber-700 ring-amber-200 hover:bg-amber-50',
    rose:    'text-rose-700 ring-rose-200 hover:bg-rose-50',
  }[color];
  return (
    <button type="button" onClick={onClick}
      className={`text-[11px] font-semibold px-2 py-1 rounded-md ring-1 ring-inset bg-white transition whitespace-nowrap ${cls}`}
    >
      {children}
    </button>
  );
}

function AssessmentEditor({ assessment, setItemStatus, setSectionStatus }) {
  return (
    <div className="space-y-4">
      {ASSESSMENT_SECTIONS.map((sec, si) => {
        const itemMax = itemMaxScore(si);
        const sectionScore = sec.items.reduce((s, [no]) => s + (assessment[no]?.score || 0), 0);
        return (
          <div key={sec.title} className="ring-1 ring-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] font-semibold text-[#1E487A] truncate">{sec.title}</span>
                <span className="text-[12px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md ring-1 ring-slate-200 shrink-0">
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
                            className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset transition whitespace-nowrap ${
                              selected
                                ? STATUS_COLOR_CLS[opt.color] + ' ring-2'
                                : 'bg-white ring-slate-200 text-slate-500 hover:ring-slate-300'
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
  );
}

function PhotoUploadSlot({ label, src, onUpload, onRemove, large = false }) {
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImages([file]);
      onUpload(compressed[0]);
    } catch (err) {
      console.error('Compress image failed:', err);
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  };

  const h = large ? 'h-44' : 'h-32';
  return (
    <div className="rounded-xl ring-1 ring-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-semibold text-slate-700 truncate">{label}</span>
        {src && (
          <button type="button" onClick={onRemove}
            className="text-rose-500 hover:text-rose-600 p-1 rounded transition" title="ลบรูป">
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
      <div className="p-2">
        {src ? (
          <div className={`relative ${h} rounded-lg overflow-hidden bg-slate-50 ring-1 ring-slate-200`}>
            <img src={src} alt={label} className="w-full h-full object-cover" />
          </div>
        ) : (
          <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
            className={`w-full ${h} rounded-lg ring-1 ring-dashed ring-slate-300 hover:ring-[#1E487A] hover:bg-blue-50/60 transition flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#1E487A]`}>
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
