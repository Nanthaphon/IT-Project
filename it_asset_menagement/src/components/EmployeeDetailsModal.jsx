import React, { useState, useEffect } from 'react';
import { Building2, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Copy, CornerUpLeft, Eye, EyeOff, FilePlus, Hash, Key, KeyRound, Lock, Monitor, Mouse, Printer, RotateCcw, Shield, SquarePen, Unlock, X } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, VERCEL_API_BASE } from '../firebase.js';
import { printHandoverForm } from '../utils/printHandoverForm.js';
import { formatDateShort, formatDateTimeShort } from '../utils/formatDate.js';
import { resolveName, initialOf } from '../utils/nameUtils.js';
import { Popover } from '../ui/earthUI.jsx';
import PreHandoverAssessmentModal from './PreHandoverAssessmentModal.jsx';
import PreReturnAssessmentModal from './PreReturnAssessmentModal.jsx';
import PrintedDocumentsTab from './PrintedDocumentsTab.jsx';
import Timeline from './timeline/Timeline.jsx';
import EmployeeLinks from './employees/EmployeeLinks.jsx';
import { buildEmployeeTimeline, spanLabel, toMillis, thaiDate } from './timeline/buildTimeline.js';

/* สีจุดของรายการในการ์ด "ความเคลื่อนไหวล่าสุด" — ตามชนิดเหตุการณ์ */
const KIND_DOT = {
  checkout: 'bg-clay-600', seatOn: 'bg-clay-600', licOn: 'bg-clay-600',
  checkin: 'bg-olive-500', seatOff: 'bg-olive-500', licOff: 'bg-stone-300',
  repair: 'bg-brick-500', purchase: 'bg-ochre-500',
};

/* ════════════════════════════════════════════════
   เลือก logo ตามบริษัทของพนักงาน
════════════════════════════════════════════════ */
function getCompanyLogo(company) {
  if (!company) return '/gb_logo.webp';
  const c = String(company).toLowerCase();
  if (c.includes('best') || c.includes('hrm')) return '/besthrm_logo.webp';
  return '/gb_logo.webp'; // default = Globe Syndicate
}


/* ════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════ */
export default function EmployeeDetailsModal({
  selectedEmployee, setSelectedEmployee, empModalTab, setEmpModalTab,
  assets, licenses, accessories, transactions, openEditEmpModal, handleCheckin, setReturnModal,
  repairRequests = [],   // 🆕 ใช้ประกอบไทม์ไลน์ (งานแจ้งซ่อมที่พนักงานคนนี้แจ้ง)
  setSelectedAssetDetail, setSelectedAssetCategory,
  bundledItems = [], handleAddBundledItem, handleDeleteBundledItem,
  asPage = false,        // true = แสดงเป็นหน้าเต็ม (URL /employees/:id) ไม่ใช่ modal
  onClosePage,           // callback ตอนกดปิดในโหมดหน้าเต็ม (navigate กลับ)
  linkOptions,           // fieldOptions.links — ลิงก์ที่ตั้งไว้ในเมนู "ตัวเลือกฟิลด์"
  saveLinks,             // (optional) แทนการเขียน Firestore — ใช้ในหน้า preview
  fieldOptions, employees, // โหมด modal (ผ่าน ModalsContainer) ได้ props ทั้งก้อน ใช้แทนสองตัวบน
}) {
  const linkChoices = linkOptions || fieldOptions?.links || [];
  const [historyFilter, setHistoryFilter] = useState('all');
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [printReturnFor, setPrintReturnFor] = useState(null); // { period, asset } or null
  const [returnPickerOpen, setReturnPickerOpen] = useState(false); // เลือกเครื่องเมื่อมีหลายตัว
  const [printOpen, setPrintOpen] = useState(false);               // เมนู "พิมพ์" บนหัวหน้า

  /* โหมดหน้าเต็มไม่มี state ให้ล้าง — ต้องถอยกลับด้วย router แทน */
  const closeView = () => { if (asPage) { onClosePage?.(); return; } setSelectedEmployee(null); };

  // 🔒 ล็อก scroll — ใช้ global observer ใน App.jsx แทนแล้ว

  if (!selectedEmployee) return null;

  /* ── Helper: open return-form pre-print modal for a given return-tx row ── */
  const openPrintReturn = (returnTx) => {
    // 1. Find the matching checkout transaction (by checkoutId, or fallback empId+earlier-timestamp)
    const allTx = transactions || [];
    const matchedCheckout = allTx.find(t =>
      t.action === 'เบิกจ่าย' && (
        (returnTx.checkoutId && t.checkoutId === returnTx.checkoutId) ||
        (!returnTx.checkoutId && t.empId === returnTx.empId &&
         t.assetId === returnTx.assetId && t.timestamp < returnTx.timestamp)
      )
    );
    // 2. Find the asset/accessory object (for Tier, model, etc.)
    const allItems = [...(assets || []), ...(accessories || [])];
    const matchedAsset = allItems.find(a => a.id === returnTx.assetId)
      || { name: returnTx.assetName };
    // 3. Open modal
    setPrintReturnFor({
      period: { checkout: matchedCheckout || returnTx, return: returnTx },
      asset:  matchedAsset,
    });
  };

  /* ── derived data ── */
  const empAssets = assets.filter(i => i.assignedTo === selectedEmployee.id);
  // License ที่แสดงในครอบครองพนักงาน = เฉพาะที่ assign ให้พนักงานโดยตรงเท่านั้น
  // License ที่ผูกกับเครื่อง (device-bound) ให้ตามเครื่องไป — ไม่แสดงในครอบครองพนักงาน
  // (seat ที่ผูกเครื่องจะมี isAssetBound=true หรือมี assignedAssetId)
  const empLicenses = licenses.reduce((acc, item) => {
    const matchedSeats = (item.assignees || []).filter(a =>
      a.empId === selectedEmployee.id && !a.isAssetBound && !a.assignedAssetId
    );
    matchedSeats.forEach((seat, idx) => {
      acc.push({
        ...item,
        uniqueKey:  seat.checkoutId || `${item.id}_${idx}`,
        checkoutId: seat.checkoutId,
      });
    });
    return acc;
  }, []);
  const empAccessories = accessories.reduce((acc, item) => {
    if (item.assignees) {
      item.assignees.filter(a => a.empId === selectedEmployee.id).forEach(co =>
        acc.push({ ...item, uniqueKey: co.checkoutId, checkoutId: co.checkoutId })
      );
    } else if (item.assignedTo === selectedEmployee.id) {
      acc.push({ ...item, uniqueKey: item.id });
    }
    return acc;
  }, []);
  const allHeld = [...empAssets, ...empLicenses, ...empAccessories];

  /* 🆕 ไทม์ไลน์ของพนักงาน — แทนรายการ "เบิก-คืน" แบบแบนเดิม
     นับแบบยังไม่กรองไว้ใช้กับป้ายบนแท็บ (ของเดิมใช้ค่าหลังกรอง
     เลขบนแท็บเลยเปลี่ยนไปมาตามตัวกรอง ซึ่งอ่านแล้วสับสน) */
  const empTimeline = buildEmployeeTimeline(selectedEmployee, transactions || [], assets || [], repairRequests || []);
  const timelineCounts = {
    all: empTimeline.length,
    assets: empTimeline.filter(e => e.cat === 'assets').length,
    licenses: empTimeline.filter(e => e.cat === 'licenses').length,
    accessories: empTimeline.filter(e => e.cat === 'accessories').length,
    repair: empTimeline.filter(e => e.cat === 'repair').length,
  };
  const shownTimeline = historyFilter === 'all'
    ? empTimeline
    : empTimeline.filter(e => e.cat === historyFilter);


  /* ชื่ออังกฤษรวมเป็นบรรทัดเดียว — เดิมแยกเป็นช่อง "ชื่อจริง"/"นามสกุล" สองช่อง
     ทั้งที่อ่านคู่กันเสมอ */
  const engParts = resolveName(selectedEmployee.firstNameEng, selectedEmployee.lastNameEng, selectedEmployee.fullNameEng);
  const engFullName = [engParts.first, engParts.last].filter(Boolean).join(' ');

  /* อายุงาน — เดิมต้องเอาวันที่เริ่มงานไปคิดเองทุกครั้ง */
  const startMs = toMillis(selectedEmployee.startDate);
  const tenure = startMs ? `ทำงานมาแล้ว ${spanLabel(startMs, Date.now())}` : '';

  // เปิด modal ให้ติ๊ก checklist + แนบรูปก่อนพิมพ์ (modal จะเรียก printHandoverForm เองเมื่อ submit)
  // 🆕 นับ Notebook ที่พนักงานถือ — เฉพาะ notebook ที่ต้องประเมิน 100 คะแนน
  /* สะกดได้หลายแบบในข้อมูลจริง: โน๊ตบุ๊ค (ไม้ตรี) / โน้ตบุ๊ค (ไม้โท) / โน้ตบุ๊ก
     ของเดิมเช็คแค่ "โน๊ตบุ๊ค" — เครื่องที่ตั้งประเภทว่า "โน้ตบุ๊ค" จึงพิมพ์ใบส่งมอบไม่ได้ */
  const NOTEBOOK_RE = /โน.?ตบุ.?[คก]|notebook|laptop/i;
  const empNotebooks = empAssets.filter(a => NOTEBOOK_RE.test(a.type || ''));
  const hasNotebook  = empNotebooks.length > 0;
  const handlePrint = () => {
    if (!hasNotebook) {
      alert('ใบส่งมอบพร้อมการประเมินสภาพเครื่อง ใช้เฉพาะพนักงานที่ถือครองโน๊ตบุ๊คเท่านั้น');
      return;
    }
    setAssessmentOpen(true);
  };

  /* ── Helper: เปิด PreReturnAssessmentModal สำหรับทรัพย์สินที่กำลังถือครอง ── */
  const openReturnFormFor = (asset) => {
    if (!asset) return;
    // หาประวัติเบิกจ่ายล่าสุดของ asset นี้ + พนักงานคนนี้
    const allTx = transactions || [];
    const matchedCheckout = allTx
      .filter(t => t.assetId === asset.id && t.empId === selectedEmployee.id && t.action === 'เบิกจ่าย')
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
    setPrintReturnFor({
      period: { checkout: matchedCheckout || null, return: null },
      asset,
      includeHoldings: true,   // flag: ใบรับคืนแบบรวม (มี License + อุปกรณ์เสริม)
    });
  };

  const handlePrintReturn = () => {
    if (empAssets.length === 0) {
      // ไม่มี Notebook/คอมพิวเตอร์หลัก → ใบรับคืนต้องผูกกับ "mainAsset" จึงพิมพ์ไม่ได้
      // ถ้ามีแค่ License/อุปกรณ์เสริม ให้รับคืนทีละรายการผ่านปุ่ม "รับคืน" ในแต่ละบรรทัด
      alert(
        allHeld.length > 0
          ? 'ใบรับคืน (IT-FORM-002) ต้องผูกกับ Notebook/Computer หลัก\n\nLicense และอุปกรณ์เสริม ให้รับคืนผ่านปุ่ม "รับคืน" ในแต่ละบรรทัด ไม่ต้องใช้ใบฟอร์ม'
          : 'พนักงานคนนี้ไม่มีทรัพย์สินที่ต้องรับคืน'
      );
      return;
    }
    if (empAssets.length === 1) {
      openReturnFormFor(empAssets[0]);
      return;
    }
    // มีหลายเครื่อง → เปิด picker
    setReturnPickerOpen(true);
  };

  /* ── ออกแบบใหม่ ─────────────────────────────────────────────
     ของเดิม: หัวบาง ๆ บรรทัดเดียว · แท็บแรกเป็นข้อมูล HR · "ถือครองอะไรอยู่"
     ซ่อนอยู่แท็บที่สอง · ปุ่ม 5 ตัวกองอยู่แถบล่างสุดห่างจากเนื้อหา
     · ครึ่งล่างของจอว่าง

     ระบบนี้คือระบบทรัพย์สิน IT — คำถามแรกเมื่อเปิดดูพนักงานคือ
     "คนนี้ถืออะไรอยู่" จึงยกขึ้นมาเป็นเนื้อหาหลักของแท็บแรก
     รวมกับข้อมูลติดต่อไว้หน้าเดียว (ภาพรวม) และย้ายปุ่มทั้งหมดขึ้นหัวหน้า */
  const OVERVIEW = empModalTab === 'info' || empModalTab === 'assets';
  const tabs2 = [
    { id: 'info',    label: 'ภาพรวม' },
    { id: 'history', label: 'ไทม์ไลน์', count: empTimeline.length },
    { id: 'docs',    label: 'เอกสารที่พิมพ์' },
  ];
  const byCat = {
    assets: empAssets.length, licenses: empLicenses.length, accessories: empAccessories.length,
  };
  const CAT_CHIPS = [
    ['assets', 'ทรัพย์สิน', Monitor],
    ['licenses', 'License', KeyRound],
    ['accessories', 'อุปกรณ์เสริม', Mouse],
  ];

  /* ถือมาตั้งแต่เมื่อไร — ดูจากรายการเบิกจ่ายล่าสุดของชิ้นนั้นให้คนนี้ */
  const sinceOf = (item) => {
    const hit = (transactions || [])
      .filter((t) => t.action === 'เบิกจ่าย' && t.empId === selectedEmployee.id && (
        (item.checkoutId && t.checkoutId === item.checkoutId) ||
        (!item.checkoutId && (t.assetId === item.id || t.licenseId === item.id))
      ))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
    return hit?.timestamp || null;
  };

  const printMenu = [
    { key: 'handover', label: 'ใบส่งมอบ', hint: hasNotebook ? `${empNotebooks.length} เครื่อง` : 'ไม่มีโน้ตบุ๊ค',
      disabled: !hasNotebook, onSelect: handlePrint },
    { key: 'return', label: 'ใบรับคืน', hint: allHeld.length ? `${allHeld.length} รายการ` : 'ไม่มีของถือครอง',
      disabled: allHeld.length === 0, onSelect: handlePrintReturn },
    { key: 'summary', label: 'สรุปพนักงาน (PDF)', hint: 'ข้อมูล + รายการถือครอง', onSelect: async () => {
      const { printEmployeeSummary } = await import('../utils/printEmployeeSummary.js');
      printEmployeeSummary({ employee: selectedEmployee, empAssets, empLicenses, empAccessories });
    } },
  ];

  return (
    <div
      data-modal="employee-detail"
      className={asPage
        ? 'h-full'
        : 'fixed inset-0 bg-stone-950/50 flex items-center justify-center p-4 z-[60]'}
    >
      <div className={asPage
        ? 'bg-sand-50 w-full h-full flex flex-col overflow-hidden'
        : 'bg-sand-50 rounded-lg border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(22,32,36,0.20)] w-full max-w-6xl flex flex-col h-[94vh] max-h-[94vh] overflow-hidden'}>

        {/* ── หัวหน้า: ตัวตน + ปุ่มทั้งหมด ── */}
        <div className="shrink-0 border-b border-stone-200/60 bg-white px-6 pt-5">
          {asPage && (
            <button onClick={closeView}
              className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-stone-400 transition-colors hover:text-clay-600">
              <ChevronLeft className="size-4" strokeWidth={2} /> พนักงานทั้งหมด
            </button>
          )}

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-14 shrink-0 select-none items-center justify-center rounded-xl bg-clay-600 text-[22px] font-medium text-white">
                {initialOf(selectedEmployee.fullName, selectedEmployee.nickname)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[22px] font-medium tracking-tight text-stone-900">
                  {selectedEmployee.fullName}
                  {selectedEmployee.nickname && (
                    <span className="ml-2 text-[15px] font-normal text-stone-400">({selectedEmployee.nickname})</span>
                  )}
                </h1>
                <p className="mt-0.5 truncate text-sm text-stone-600">
                  {[selectedEmployee.position, selectedEmployee.department].filter(Boolean).join(' · ') || '—'}
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
                  <span className="inline-flex items-center gap-1.5 tabular-nums"><Hash className="size-3.5" strokeWidth={2} />{selectedEmployee.empId || '—'}</span>
                  {selectedEmployee.company && (
                    <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" strokeWidth={2} />{selectedEmployee.company}</span>
                  )}
                  {tenure && (
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" strokeWidth={2} />{tenure}</span>
                  )}
                  {selectedEmployee.deletedAt && (
                    <span className="rounded-lg bg-rose-50 px-2 py-0.5 font-medium text-rose-700">ลบออกจากระบบแล้ว</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {!selectedEmployee.deletedAt && (
                <button onClick={() => openEditEmpModal(selectedEmployee)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/60 bg-white px-3.5 py-2 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50">
                  <SquarePen className="size-4" strokeWidth={2} /> แก้ไข
                </button>
              )}
              <Popover
                open={printOpen} onClose={() => setPrintOpen(false)} width="w-64"
                trigger={
                  <button onClick={() => setPrintOpen((v) => !v)} aria-expanded={printOpen}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-clay-700">
                    <Printer className="size-4" strokeWidth={2} /> พิมพ์
                    <ChevronDown className="size-3.5 opacity-80" strokeWidth={2} />
                  </button>
                }
              >
                {printMenu.map((m) => (
                  <button key={m.key} disabled={m.disabled}
                    onClick={() => { setPrintOpen(false); m.onSelect(); }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
                    <span className="text-sm text-stone-700">{m.label}</span>
                    <span className="text-xs text-stone-400">{m.hint}</span>
                  </button>
                ))}
              </Popover>
              {!asPage && (
                <button onClick={closeView} aria-label="ปิด"
                  className="flex size-9 items-center justify-center rounded-xl text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700">
                  <X className="size-4" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {/* แท็บ */}
          <div className="mt-4 flex gap-6">
            {tabs2.map((tab) => {
              const on = tab.id === 'info' ? OVERVIEW : empModalTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setEmpModalTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-0.5 pb-3 text-sm font-medium transition-colors ${
                    on ? 'border-clay-600 text-clay-600' : 'border-transparent text-stone-400 hover:text-stone-700'}`}>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`rounded-lg px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${
                      on ? 'bg-clay-600/10 text-clay-600' : 'bg-stone-100 text-stone-400'}`}>{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── เนื้อหา ── */}
        <div className="flex-1 overflow-y-auto p-5">

          {OVERVIEW && (
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">

              {/* ซ้าย: ของที่ถืออยู่ + ความเคลื่อนไหวล่าสุด */}
              <div className="space-y-5 lg:col-span-2">
                <section className="overflow-hidden rounded-2xl border border-stone-200/60 bg-white">
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                    <h2 className="text-[15px] font-medium text-stone-800">
                      ถือครองอยู่ตอนนี้ <span className="tabular-nums text-stone-400">{allHeld.length}</span>
                    </h2>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {CAT_CHIPS.filter(([k]) => byCat[k] > 0).map(([k, label, Icon]) => (
                        <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-sand-100 px-2 py-1 font-medium text-stone-600">
                          <Icon className="size-3.5" strokeWidth={2} /> {label} {byCat[k]}
                        </span>
                      ))}
                    </div>
                  </header>

                  {allHeld.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-stone-400">ยังไม่มีทรัพย์สินที่ถือครอง</p>
                  ) : (
                    <ul>
                      {allHeld.map((item) => {
                        const isAsset     = assets.some((a) => a.id === item.id);
                        const isAccessory = accessories.some((a) => a.id === item.id);
                        const category    = isAsset ? 'assets' : isAccessory ? 'accessories' : 'licenses';
                        const ItemIcon    = isAsset ? Monitor : isAccessory ? Mouse : KeyRound;
                        const catLabel    = isAsset ? 'ทรัพย์สิน' : isAccessory ? 'อุปกรณ์เสริม' : 'License';
                        const since       = sinceOf(item);
                        const idLine      = [catLabel, item.type, isAsset ? item.assetTag : null, isAsset && item.sn ? `SN ${item.sn}` : null]
                          .filter(Boolean).join(' · ');

                        const openAssetDetail = () => {
                          if (!setSelectedAssetDetail || !setSelectedAssetCategory) return;
                          setSelectedAssetCategory(category);
                          setSelectedAssetDetail(item);
                        };
                        const doReturn = (e) => {
                          e.stopPropagation();
                          if (isAccessory) {
                            setReturnModal({ isOpen: true, assetId: item.id, checkoutId: item.checkoutId,
                              empId: selectedEmployee.id, empName: selectedEmployee.fullName, assetName: item.name,
                              collectionName: 'accessories' });
                          } else if (isAsset) {
                            setReturnModal({ isOpen: true, assetId: item.id, checkoutId: null,
                              empId: selectedEmployee.id, empName: selectedEmployee.fullName, assetName: item.name,
                              collectionName: 'assets' });
                          } else {
                            handleCheckin(item.id, category, selectedEmployee.id);
                          }
                        };

                        return (
                          <li key={item.uniqueKey || item.id}
                            onClick={openAssetDetail} role="button" tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAssetDetail(); } }}
                            className="group flex cursor-pointer items-center gap-4 border-t border-stone-100 px-5 py-3.5 transition-colors first:border-t-0 hover:bg-stone-50/60">
                            {item.image ? (
                              <img src={item.image} alt={item.name} loading="lazy"
                                className="size-11 shrink-0 rounded-xl border border-stone-200/60 bg-white object-cover" />
                            ) : (
                              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-clay-600/[0.08] text-clay-600">
                                <ItemIcon className="size-5" strokeWidth={2} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-stone-900 transition-colors group-hover:text-clay-600">{item.name}</p>
                              <p className="mt-0.5 truncate text-xs text-stone-400">{idLine}</p>
                            </div>
                            {since && (
                              <span className="hidden shrink-0 text-xs tabular-nums text-stone-400 sm:block">
                                ตั้งแต่ {formatDateShort(since)}
                              </span>
                            )}
                            <button onClick={doReturn}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200/60 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-olive-200 hover:bg-olive-50 hover:text-olive-700">
                              <CornerUpLeft className="size-3.5" strokeWidth={2} /> รับคืน
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                {/* โหมด modal ถือ selectedEmployee เป็นสำเนาเก่า — หาตัวสดจาก employees ให้ลิงก์อัปเดตทันทีหลังบันทึก */}
                <EmployeeLinks
                  employee={employees?.find((e) => e.id === selectedEmployee.id) || selectedEmployee}
                  options={linkChoices} save={saveLinks} />

                {/* ความเคลื่อนไหวล่าสุด — ไม่ต้องสลับแท็บก็เห็นว่าเพิ่งเกิดอะไรขึ้น */}
                <section className="overflow-hidden rounded-2xl border border-stone-200/60 bg-white">
                  <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                    <h2 className="text-[15px] font-medium text-stone-800">ความเคลื่อนไหวล่าสุด</h2>
                    {empTimeline.length > 5 && (
                      <button onClick={() => setEmpModalTab('history')}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-clay-600 hover:underline">
                        ดูทั้งหมด {empTimeline.length} <ChevronRight className="size-3.5" strokeWidth={2} />
                      </button>
                    )}
                  </header>
                  {empTimeline.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-stone-400">ยังไม่มีประวัติ</p>
                  ) : (
                    <ol className="px-5 py-3">
                      {empTimeline.slice(0, 5).map((ev, i) => (
                        <li key={`${ev.kind}-${ev.ms}-${i}`} className="flex items-start gap-3 py-2">
                          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${KIND_DOT[ev.kind] || 'bg-stone-300'}`} />
                          <p className="min-w-0 flex-1 truncate text-[13px] text-stone-700">
                            <span className="font-medium">{ev.title}</span>
                            {ev.by && <span className="text-stone-500"> · {ev.by}</span>}
                          </p>
                          <span className="shrink-0 text-xs tabular-nums text-stone-400">{thaiDate(ev.ms)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>

              {/* ขวา: ข้อมูลติดต่อ + บัญชี */}
              <div className="space-y-5">
                <DetailCard title="ข้อมูลติดต่อ">
                  <DetailRow label="ชื่อ (EN)"      value={engFullName} />
                  <DetailRow label="เบอร์โทรศัพท์"  value={selectedEmployee.phone} copy />
                  <DetailRow label="หัวหน้างาน"    value={selectedEmployee.manager} />
                  <DetailRow label="เริ่มงาน"
                    value={selectedEmployee.startDate ? formatDateShort(selectedEmployee.startDate) : ''} />
                </DetailCard>

                {(selectedEmployee.m365Email || selectedEmployee.m365Password) && (
                  <DetailCard title="บัญชี Microsoft 365">
                    <DetailRow label="อีเมล" value={selectedEmployee.m365Email} accent copy />
                    <PasswordReveal label="รหัสผ่าน" value={selectedEmployee.m365Password} />
                  </DetailCard>
                )}

                <DetailCard title="รหัสผ่านเข้าใช้ระบบ" desc="Staff Portal">
                  <div className="p-4">
                    <SetStaffPasswordForm
                      empDocId={selectedEmployee.id}
                      empName={selectedEmployee.fullName}
                      empId={selectedEmployee.empId}
                    />
                  </div>
                </DetailCard>
              </div>
            </div>
          )}

          {empModalTab === 'history' && (
            <EmployeeTimelineTab
              events={shownTimeline}
              counts={timelineCounts}
              filter={historyFilter}
              setFilter={setHistoryFilter}
              openPrintReturn={openPrintReturn}
            />
          )}

          {empModalTab === 'docs' && (
            <PrintedDocumentsTab employeeId={selectedEmployee.id} employeeName={selectedEmployee.fullName} />
          )}
        </div>
      </div>


      {/* ── Pre-Handover Assessment Modal (เปิดก่อนพิมพ์) ── */}
      <PreHandoverAssessmentModal
        isOpen={assessmentOpen}
        onClose={() => setAssessmentOpen(false)}
        employee={selectedEmployee}
        empAssets={empAssets}
        empLicenses={empLicenses}
        empAccessories={empAccessories}
        bundledItems={bundledItems}
        handleAddBundledItem={handleAddBundledItem}
        handleDeleteBundledItem={handleDeleteBundledItem}
        transactions={transactions}
      />

      {/* ── Picker เลือกเครื่องที่จะพิมพ์ใบรับคืน (เมื่อพนักงานถือหลายเครื่อง) ── */}
      {returnPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/50 p-4" onClick={() => setReturnPickerOpen(false)}>
          <div className="bg-white rounded-lg border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(22,32,36,0.20)] w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-medium text-stone-800">เลือกเครื่องที่ต้องการพิมพ์ใบรับคืน</h3>
              <button onClick={() => setReturnPickerOpen(false)} className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              พนักงานคนนี้ถือทรัพย์สินหลัก {empAssets.length} เครื่อง — เลือก 1 เครื่อง
            </p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {empAssets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => { openReturnFormFor(asset); setReturnPickerOpen(false); }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 border border-stone-200 rounded-xl hover:border-olive-400 hover:bg-olive-50 transition text-left"
                >
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-stone-800 truncate">{asset.name || '-'}</p>
                    <p className="text-xs text-stone-500 truncate">
                      {asset.model || '-'} · {asset.sn || asset.assetTag || '-'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Pre-Return Assessment Modal (พิมพ์ IT-FORM-002 จากแถว "รับคืน") ── */}
      {printReturnFor && (
        <PreReturnAssessmentModal
          isOpen={true}
          onClose={() => setPrintReturnFor(null)}
          employee={selectedEmployee}
          mainAsset={printReturnFor.asset}
          handoverDate={printReturnFor.period.checkout?.timestamp}
          returnDate={printReturnFor.period.return?.timestamp}
          // Pre-fill 18 sub-items จาก 6 หมวด in-app
          inAppFieldsReturn={printReturnFor.period.return?.returnFields}
          inAppFieldsHandover={printReturnFor.period.checkout?.checkoutFields}
          // 🆕 100-point assessment + photos + defects — pre-fill จาก transactions
          checkoutAssessment={printReturnFor.period.checkout?.checkoutAssessment}
          checkoutPhotos={printReturnFor.period.checkout?.checkoutPhotos}
          checkoutDefectsNote={printReturnFor.period.checkout?.checkoutDefectsNote}
          returnAssessment={printReturnFor.period.return?.returnAssessment}
          returnPhotos={printReturnFor.period.return?.returnPhotos}
          returnDefectsNote={printReturnFor.period.return?.returnDefectsNote}
          // ใบรับคืนรวม → ส่ง License + อุปกรณ์เสริมทั้งหมดของพนักงาน
          empLicenses={printReturnFor.includeHoldings ? empLicenses : []}
          empAccessories={printReturnFor.includeHoldings ? empAccessories : []}
        />
      )}
    </div>
  );
}

/* ── Helper components ── */
/* ── การ์ดข้อมูล — หัวเรื่องบาง ๆ แล้วไล่แถวลงมา ── */
function DetailCard({ title, desc, className = '', children }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-stone-200/60 bg-white ${className}`}>
      <div className="flex items-baseline gap-2 border-b border-stone-100 px-4 py-3">
        <div className="h-3.5 w-1 shrink-0 self-center rounded-full bg-clay-600" />
        <h4 className="text-[13px] font-medium text-stone-600">{title}</h4>
        {desc && <span className="text-[11px] text-stone-400">{desc}</span>}
      </div>
      {children}
    </section>
  );
}

/* แถวป้าย/ค่า — ป้ายซ้ายกว้างคงที่ ค่าจึงเรียงตรงกันทุกแถว กวาดตาอ่านลงมาได้
   ต่างจากของเดิมที่เป็นช่องมีกรอบเรียงในกริด ซึ่งกรอบดังกว่าตัวข้อมูลเอง */
function DetailRow({ label, value, hint, accent, mono, copy }) {
  const [copied, setCopied] = useState(false);
  const text = value == null || value === '' ? '' : String(value);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* เบราว์เซอร์ไม่อนุญาต — ปล่อยผ่าน */ }
  };

  return (
    <div className="flex items-start gap-4 border-b border-stone-100 px-4 py-2.5 last:border-b-0">
      <span className="w-[132px] shrink-0 pt-px text-[13px] text-stone-400">{label}</span>
      <div className="min-w-0 flex-1">
        {text ? (
          <div className="flex items-center gap-1.5">
            <span className={`break-words text-[13px] font-medium ${accent ? 'text-clay-600' : 'text-stone-800'} ${mono ? 'font-mono' : ''}`}>
              {text}
            </span>
            {copy && (
              <button
                type="button"
                onClick={doCopy}
                className="shrink-0 rounded-lg p-1 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-600"
                title={`คัดลอก${label}`}
              >
                {copied ? <Check className="size-3" strokeWidth={2} /> : <Copy className="size-3" strokeWidth={2} />}
              </button>
            )}
          </div>
        ) : (
          <span className="text-[13px] text-stone-300">—</span>
        )}
        {hint && <p className="mt-0.5 text-[11px] text-stone-400">{hint}</p>}
      </div>
    </div>
  );
}

/* ── SetStaffPasswordForm — admin ดู / แก้ / รีเซ็ต รหัสผ่าน Staff Portal
       - แสดงรหัสผ่านปัจจุบัน (sync real-time จาก Firestore)
       - admin แก้ + กด "บันทึก" → API hash + เก็บ plaintext กลับ
       - มีปุ่ม "ใช้รหัสพนักงาน" รีเซ็ตเร็วๆ ── */
function SetStaffPasswordForm({ empDocId, empName, empId }) {
  const [snapshot, setSnapshot] = useState(null);     // current data from Firestore
  const [pwd, setPwd] = useState('');                 // input value (admin editing)
  const [isDirty, setIsDirty] = useState(false);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  // ── Live sync รหัสผ่านปัจจุบันจาก Firestore ──
  useEffect(() => {
    if (!empDocId) return;
    const unsub = onSnapshot(doc(db, 'staff_passwords', empDocId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSnapshot(data);
        if (!isDirty) setPwd(data.plaintext || '');
      } else {
        setSnapshot(null);
        if (!isDirty) setPwd('');
      }
    });
    return unsub;
  }, [empDocId, isDirty]);

  const currentPlaintext = snapshot?.plaintext || '';
  const isDefault = snapshot?.isDefault === true;
  const isUnset = !snapshot;
  const updatedAt = snapshot?.updatedAt?.toDate?.();

  const handleChange = (v) => { setPwd(v); setIsDirty(true); setMsg(null); };

  const handleSave = async () => {
    setMsg(null);
    if (pwd.length < 6) { setMsg({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }); return; }
    try {
      setSaving(true);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('ต้อง login admin ก่อน');
      const resp = await fetch(`${VERCEL_API_BASE}/api/set-staff-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ empDocId, newPassword: pwd }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      setMsg({ type: 'success', text: `บันทึกรหัสผ่านสำหรับ ${empName || 'พนักงาน'} เรียบร้อยแล้ว` });
      setIsDirty(false);
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToEmpId = async () => {
    if (!empId) { setMsg({ type: 'error', text: 'ไม่พบรหัสพนักงาน' }); return; }
    setMsg(null);
    try {
      setResetting(true);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('ต้อง login admin ก่อน');
      const resp = await fetch(`${VERCEL_API_BASE}/api/set-staff-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ empDocId, newPassword: empId }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'รีเซ็ตไม่สำเร็จ');
      setMsg({ type: 'success', text: `รีเซ็ตรหัสผ่านเป็น "${empId}" (รหัสพนักงาน) เรียบร้อย` });
      setIsDirty(false);
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setResetting(false);
    }
  };

  const handleCopy = async () => {
    if (!currentPlaintext) return;
    try {
      await navigator.clipboard.writeText(currentPlaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const fmtTime = (d) => d ? formatDateTimeShort(d) : '-';

  return (
    <div className="px-4 py-3 space-y-3">


      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2">
        {isUnset ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 text-stone-600 text-[11px] font-medium">
            ยังไม่เคยตั้งรหัสผ่าน
          </span>
        ) : isDefault ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-clay-100 text-clay-600 border border-clay-200 text-[11px] font-medium">
            <Unlock className="inline h-3.5 w-3.5 -mt-0.5" strokeWidth={2} /> ใช้รหัสพนักงานเป็นรหัสผ่าน
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-olive-50 text-olive-700 border border-olive-200 text-[11px] font-medium">
            <Lock className="inline h-3.5 w-3.5 -mt-0.5" strokeWidth={2} /> ตั้งรหัสผ่านส่วนตัว
          </span>
        )}
        {updatedAt && (
          <span className="text-[11px] text-stone-400">อัปเดตล่าสุด: {fmtTime(updatedAt)}</span>
        )}
      </div>

      {/* Password input */}
      <div>
        <label className="block text-[11px] font-medium text-stone-500 mb-1.5">
          รหัสผ่าน (Staff Portal)
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={pwd}
            onChange={e => handleChange(e.target.value)}
            placeholder={isUnset ? 'พนักงานยังไม่เคย login — รหัสจะเป็นรหัสพนักงานอัตโนมัติ' : 'รหัสผ่าน'}
            className="w-full bg-white border border-stone-200 pl-3 pr-24 py-2.5 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-clay-600/30 focus:border-clay-600"
            autoComplete="new-password"
            spellCheck={false}
          />
          <div className="absolute right-1 top-1 bottom-1 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              className="px-2 py-1 text-stone-400 hover:text-stone-600 transition-colors"
              title={show ? 'ซ่อน' : 'แสดง'}
            >
              {show ? <EyeOff className="h-3.5 w-3.5" strokeWidth={2} /> : <Eye className="h-3.5 w-3.5" strokeWidth={2} />}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!currentPlaintext}
              className="px-2 py-1 text-stone-400 hover:text-stone-600 disabled:opacity-30 transition-colors"
              title="คัดลอกรหัสผ่านปัจจุบัน"
            >
              {copied
                ? <CheckCircle2 className="h-3.5 w-3.5 text-olive-500" strokeWidth={2} />
                : <Copy className="h-3.5 w-3.5" strokeWidth={2} />}
            </button>
          </div>
        </div>
        {isDirty && (
          <p className="text-[11px] text-clay-600 mt-1.5 flex items-center gap-1">
            ● มีการแก้ไข — กด "บันทึก" เพื่อยืนยัน
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={handleResetToEmpId}
          disabled={resetting || saving || !empId || (isDefault && !isDirty)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-clay-600 bg-white border border-stone-200/60 hover:bg-clay-100 hover:border-clay-300 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={`รีเซ็ตเป็น "${empId}" (รหัสพนักงาน)`}
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          {resetting ? 'กำลังรีเซ็ต...' : 'ใช้รหัสพนักงาน'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || resetting || !isDirty}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-clay-600 hover:bg-clay-700 rounded-xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Key className="h-3.5 w-3.5" strokeWidth={2} />
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div className={`text-xs font-medium px-2.5 py-1.5 rounded-lg ${
          msg.type === 'error'
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-olive-50 text-olive-700 border border-olive-200'
        }`}>{msg.text}</div>
      )}
    </div>
  );
}

/* ── PasswordReveal — แสดง •••• และมีปุ่มกดเพื่อดูรหัสผ่าน ── */
function PasswordReveal({ label, value }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasValue = value && String(value).length > 0;

  const handleCopy = async () => {
    if (!hasValue) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex items-start gap-4 border-b border-stone-100 px-4 py-2.5 last:border-b-0">
      <span className="w-[132px] shrink-0 pt-px text-[13px] text-stone-400">{label}</span>
      {!hasValue ? (
        <span className="text-[13px] text-stone-300">—</span>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="select-all font-mono text-[13px] font-medium text-stone-800">
            {show ? value : '•'.repeat(Math.min(String(value).length, 12))}
          </span>
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="text-stone-400 hover:text-clay-600 transition-colors"
            title={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            {show
              ? <EyeOff className="h-4 w-4" strokeWidth={2} />
              : <Eye className="h-4 w-4" strokeWidth={2} />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="text-stone-400 hover:text-clay-600 transition-colors"
            title="คัดลอก"
            aria-label="คัดลอก"
          >
            {copied
              ? <Check className="h-4 w-4" strokeWidth={2} />
              : <Copy className="h-4 w-4" strokeWidth={2} />}
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   🆕 EmployeeTimelineTab — ไทม์ไลน์ของพนักงาน

   ของเดิมเป็นรายการเบิก-คืนแบน ๆ เรียงตามเวลา แต่ไม่เห็นว่าแต่ละครั้ง
   ห่างกันแค่ไหน ถือไว้นานเท่าไหร่ และไม่รวมงานแจ้งซ่อมที่คนนี้แจ้งเอง
   จึงย้ายมาใช้ Timeline ตัวเดียวกับหน้าทรัพย์สิน / License
   ปุ่มพิมพ์ใบรับคืนยังอยู่ครบ — ย้ายไปอยู่มุมขวาของแถวที่เป็นการคืนทรัพย์สิน
════════════════════════════════════════════════ */
function EmployeeTimelineTab({ events, counts, filter, setFilter, openPrintReturn }) {
  const FILTERS = [
    { id: 'all',         label: 'ทั้งหมด' },
    { id: 'assets',      label: 'ทรัพย์สิน' },
    { id: 'licenses',    label: 'License' },
    { id: 'accessories', label: 'อุปกรณ์เสริม' },
    { id: 'repair',      label: 'แจ้งซ่อม' },
  ];

  return (
    <div className="space-y-4">
      {/* ตัวกรองหมวด — ซ่อนหมวดที่ไม่มีข้อมูลเลย */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.filter(f => f.id === 'all' || counts[f.id] > 0).map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === f.id
                ? 'bg-clay-600 text-white'
                : 'bg-sand-100 text-stone-600 hover:bg-sand-200'
            }`}
          >
            {f.label} <span className="tabular-nums opacity-70">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <Timeline
        events={events}
        holderLabel="รายการที่เกี่ยวข้อง"
        holderKinds={['checkout', 'seatOn', 'licOn']}
        assignLabel="เบิก / รับสิทธิ์"
        ageLabel="ประวัติย้อนหลัง"
        emptyHint={filter === 'all'
          ? 'ยังไม่มีประวัติของพนักงานคนนี้'
          : 'ไม่มีประวัติในหมวดนี้'}
        renderAction={(e) => (e.kind === 'checkin' && e.cat === 'assets' ? (
          <button
            onClick={() => openPrintReturn(e.tx)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-clay-600 transition-colors hover:bg-stone-100"
            title="พิมพ์ใบรับคืน"
          >
            <Printer className="size-3" strokeWidth={2} />
            ใบรับคืน
          </button>
        ) : null)}
      />
    </div>
  );
}
