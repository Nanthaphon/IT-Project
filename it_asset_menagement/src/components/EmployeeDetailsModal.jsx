import React, { useState, useEffect } from 'react';
import { Printer, Key, Eye, EyeOff, Copy, CheckCircle2, RotateCcw, Shield } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, VERCEL_API_BASE } from '../firebase.js';
import { printHandoverForm } from '../utils/printHandoverForm.js';
import { formatDateShort, formatDateTimeShort } from '../utils/formatDate.js';
import PreHandoverAssessmentModal from './PreHandoverAssessmentModal.jsx';
import PreReturnAssessmentModal from './PreReturnAssessmentModal.jsx';
import PrintedDocumentsTab from './PrintedDocumentsTab.jsx';

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
  setSelectedAssetDetail, setSelectedAssetCategory,
  bundledItems = [], handleAddBundledItem, handleDeleteBundledItem,
}) {
  const [historyFilter, setHistoryFilter] = useState('all');
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [printReturnFor, setPrintReturnFor] = useState(null); // { period, asset } or null
  const [returnPickerOpen, setReturnPickerOpen] = useState(false); // เลือกเครื่องเมื่อมีหลายตัว

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

  // 🆕 lookup ทรัพย์สินปัจจุบันด้วย assetId → ดึง SN/Tag มาแสดง
  //    (transaction เก่าไม่ได้ store sn/assetTag — ต้อง lookup จาก assets ปัจจุบัน)
  const assetById = new Map(assets.map(a => [a.id, a]));
  let empHistory = transactions
    .filter(t => t.empId === selectedEmployee.id)
    .filter(t => {
      if (historyFilter === 'all') return true;
      if (historyFilter === 'licenses') return t.category === 'licenses' || t.category === 'license';
      if (historyFilter === 'assets') return t.category === 'assets' || t.category === 'asset';
      if (historyFilter === 'accessories') return t.category === 'accessories' || t.category === 'accessory';
      return false;
    })
    .map(t => {
      const isAssetCat = t.category === 'assets' || t.category === 'asset';
      if (!isAssetCat) return t;
      const a = assetById.get(t.assetId);
      return { ...t, _sn: a?.sn || '', _assetTag: a?.assetTag || '' };
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const tabs = [
    { id: 'info',    label: 'ข้อมูลทั่วไป' },
    { id: 'assets',  label: 'ครอบครองปัจจุบัน', count: allHeld.length },
    { id: 'history', label: 'ประวัติเบิก-คืน',   count: empHistory.length },
    { id: 'docs',    label: 'เอกสารที่พิมพ์' },
  ];

  const initial = selectedEmployee.fullName?.charAt(0) || '?';

  // เปิด modal ให้ติ๊ก checklist + แนบรูปก่อนพิมพ์ (modal จะเรียก printHandoverForm เองเมื่อ submit)
  // 🆕 นับ Notebook ที่พนักงานถือ — เฉพาะ notebook ที่ต้องประเมิน 100 คะแนน
  const empNotebooks = empAssets.filter(a => (a.type || '').toLowerCase().includes('โน๊ตบุ๊ค') || (a.type || '').toLowerCase().includes('notebook') || (a.type || '').toLowerCase().includes('laptop'));
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

  return (
    <div
      data-modal="employee-detail"
      className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-[60]"
    >
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)] w-full max-w-6xl flex flex-col h-[94vh] max-h-[94vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#1E487A] text-white flex items-center justify-center text-base font-bold shrink-0 select-none">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-slate-900 leading-tight">
                  {selectedEmployee.fullName}
                </h3>
                {selectedEmployee.nickname && (
                  <span className="text-sm text-slate-400">({selectedEmployee.nickname})</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedEmployee.empId}
                {selectedEmployee.department ? ` · ${selectedEmployee.department}` : ''}
                {selectedEmployee.position  ? ` · ${selectedEmployee.position}`   : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedEmployee(null)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-slate-100 px-6 shrink-0 bg-white">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setEmpModalTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                empModalTab === tab.id
                  ? 'border-[#1E487A] text-[#1E487A]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                  empModalTab === tab.id ? 'bg-[#1E487A]/10 text-[#1E487A]' : 'bg-slate-100 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ======= TAB: ข้อมูลทั่วไป ======= */}
          {empModalTab === 'info' && (
            <div className="space-y-6">
              <Section title="ข้อมูลส่วนตัวและตำแหน่ง">
                <InfoGrid>
                  <InfoItem label="ชื่อ-นามสกุล (TH)"  value={selectedEmployee.fullName} />
                  <InfoItem label="ชื่อ-นามสกุล (EN)"  value={selectedEmployee.fullNameEng} />
                  <InfoItem label="ตำแหน่ง"            value={selectedEmployee.position} />
                  <InfoItem label="แผนก"               value={selectedEmployee.department} />
                  <InfoItem label="บริษัท"             value={selectedEmployee.company} />
                </InfoGrid>
              </Section>

              <Section title="ข้อมูลการติดต่อ">
                <InfoGrid>
                  <InfoItem label="เบอร์โทรศัพท์" value={selectedEmployee.phone} />
                  <InfoItem label="หัวหน้างาน"   value={selectedEmployee.manager} />
                  <InfoItem label="วันที่เริ่มงาน" value={selectedEmployee.startDate
                    ? formatDateShort(selectedEmployee.startDate)
                    : ''} />
                </InfoGrid>
              </Section>

              {(selectedEmployee.m365Email || selectedEmployee.m365Password) && (
                <Section title="บัญชี Microsoft 365">
                  <InfoGrid>
                    <InfoItem label="อีเมล Microsoft 365" value={selectedEmployee.m365Email} accent />
                    <PasswordReveal
                      label="รหัสผ่าน Microsoft 365"
                      value={selectedEmployee.m365Password}
                    />
                  </InfoGrid>
                </Section>
              )}

              <Section title="รหัสผ่านเข้าใช้ระบบ (Staff Portal)">
                <SetStaffPasswordForm
                  empDocId={selectedEmployee.id}
                  empName={selectedEmployee.fullName}
                  empId={selectedEmployee.empId}
                />
              </Section>
            </div>
          )}

          {/* ======= TAB: ครอบครองปัจจุบัน ======= */}
          {empModalTab === 'assets' && (
            allHeld.length === 0
              ? <EmptyState label="ยังไม่มีทรัพย์สินที่ถือครอง" />
              : (
                <div className="space-y-2">
                  {allHeld.map(item => {
                    const isAsset     = assets.some(a => a.id === item.id);
                    const isAccessory = accessories.some(a => a.id === item.id);
                    const isLicense   = !isAsset && !isAccessory;
                    const category    = isAsset ? 'assets' : isAccessory ? 'accessories' : 'licenses';
                    const icon        = isAsset ? '🖥️' : isAccessory ? '🖱️' : '🔑';
                    const catLabel    = isAsset ? 'ทรัพย์สิน' : isAccessory ? 'อุปกรณ์เสริม' : 'License';
                    const catColor    = isAsset
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : isAccessory
                        ? 'bg-orange-50 text-orange-600 border-orange-100'
                        : 'bg-purple-50 text-purple-600 border-purple-100';

                    const openAssetDetail = () => {
                      if (!setSelectedAssetDetail || !setSelectedAssetCategory) return;
                      setSelectedAssetCategory(category);
                      setSelectedAssetDetail(item);
                    };

                    return (
                      <div
                        key={item.uniqueKey || item.id}
                        onClick={openAssetDetail}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAssetDetail(); } }}
                        className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-slate-200 hover:border-[#1E487A]/40 hover:bg-blue-50/40 hover:shadow-sm cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image
                            ? <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                            : <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 border ${catColor}`}>{icon}</div>
                          }
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#1E487A] transition-colors">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${catColor}`}>
                                {catLabel}
                              </span>
                              {item.type && (
                                <span className="text-[11px] text-slate-400">{item.type}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* hint icon (เห็นชัดตอน hover) */}
                          <svg className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#1E487A] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                          </svg>

                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // กันไม่ให้เปิด asset detail
                              if (isAccessory) {
                                setReturnModal({
                                  isOpen: true, assetId: item.id, checkoutId: item.checkoutId,
                                  empId: selectedEmployee.id, empName: selectedEmployee.fullName, assetName: item.name,
                                  collectionName: 'accessories',
                                });
                              } else if (isAsset) {
                                // asset — เปิด ReturnModal เพื่อกรอกรูป/checklist หลักฐานสภาพ
                                setReturnModal({
                                  isOpen: true, assetId: item.id, checkoutId: null,
                                  empId: selectedEmployee.id, empName: selectedEmployee.fullName, assetName: item.name,
                                  collectionName: 'assets',
                                });
                              } else {
                                // license — ไม่มีสภาพกายภาพ รับคืนทันที
                                handleCheckin(item.id, category, selectedEmployee.id);
                              }
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-colors flex items-center gap-1.5"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            รับคืน
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
          )}

          {/* ======= TAB: ประวัติเบิก-คืน ======= */}
          {empModalTab === 'history' && (
            <HistoryTimeline
              empHistory={empHistory}
              historyFilter={historyFilter}
              setHistoryFilter={setHistoryFilter}
              openPrintReturn={openPrintReturn}
            />
          )}

          {/* ======= TAB: เอกสารที่พิมพ์ ======= */}
          {empModalTab === 'docs' && (
            <PrintedDocumentsTab employeeId={selectedEmployee.id} employeeName={selectedEmployee.fullName} />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0">

          {/* 🆕 ปุ่ม Print — เรียบง่ายขึ้น */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={!hasNotebook}
              title={!hasNotebook ? 'พนักงานไม่มีโน๊ตบุ๊คในครอบครอง' : `${empNotebooks.length} เครื่อง`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={2} />
              ใบส่งมอบ
              {hasNotebook && <span className="text-[10.5px] font-bold text-slate-400 tabular-nums">{empNotebooks.length}</span>}
            </button>
            <button
              onClick={handlePrintReturn}
              disabled={allHeld.length === 0}
              title={allHeld.length === 0 ? 'พนักงานไม่มีทรัพย์สิน' : `${allHeld.length} รายการ`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={2} />
              ใบรับคืน
              {allHeld.length > 0 && <span className="text-[10.5px] font-bold text-slate-400 tabular-nums">{allHeld.length}</span>}
            </button>
            {/* 🆕 พิมพ์สรุปข้อมูลพนักงาน + รายการครอบครอง */}
            <button
              onClick={async () => {
                const { printEmployeeSummary } = await import('../utils/printEmployeeSummary.js');
                printEmployeeSummary({
                  employee: selectedEmployee,
                  empAssets,
                  empLicenses,
                  empAccessories,
                });
              }}
              title="พิมพ์สรุปข้อมูลพนักงาน + รายการครอบครอง"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-colors text-white bg-[#1E487A] hover:bg-[#163963]"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={2} />
              พิมพ์ PDF
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!selectedEmployee.deletedAt && (
              <button
                onClick={() => openEditEmpModal(selectedEmployee)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                แก้ไขข้อมูล
              </button>
            )}
            <button
              onClick={() => setSelectedEmployee(null)}
              className="px-4 py-2 text-[13px] font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition"
            >
              ปิด
            </button>
          </div>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setReturnPickerOpen(false)}>
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)] w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-slate-800">เลือกเครื่องที่ต้องการพิมพ์ใบรับคืน</h3>
              <button onClick={() => setReturnPickerOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <p className="text-[12.5px] text-slate-500 mb-3">
              พนักงานคนนี้ถือทรัพย์สินหลัก {empAssets.length} เครื่อง — เลือก 1 เครื่อง
            </p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {empAssets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => { openReturnFormFor(asset); setReturnPickerOpen(false); }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 border border-slate-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition text-left"
                >
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">{asset.name || '-'}</p>
                    <p className="text-[12px] text-slate-500 truncate">
                      {asset.model || '-'} · {asset.sn || asset.assetTag || '-'}
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
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
function Section({ title, children }) {
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">{title}</p>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">{children}</div>
    </div>
  );
}

function InfoGrid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2">{children}</div>;
}

function InfoItem({ label, value, accent, span2, mono }) {
  return (
    <div className={`px-4 py-2.5 ${span2 ? 'sm:col-span-2' : ''} border-b border-slate-100 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0`}>
      <span className="block text-[11px] text-slate-400 mb-0.5">{label}</span>
      <span className={`block text-[13.5px] ${accent ? 'text-[#1E487A] font-semibold' : 'text-slate-800 font-medium'} ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-300">—</span>}
      </span>
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

      {/* Info banner */}
      <div className="bg-blue-50/40 border border-blue-200 rounded-lg px-3 py-2 flex items-start gap-2">
        <Shield className="h-3.5 w-3.5 text-[#1E487A] shrink-0 mt-0.5" strokeWidth={2.2} />
        <p className="text-[11.5px] text-blue-900/85 leading-relaxed">
          ระบบเก็บทั้ง <strong>hash + salt</strong> (สำหรับ login) และ <strong>plaintext</strong> (visibility สำหรับ admin) —
          Firestore rules จำกัดให้เฉพาะ admin เท่านั้นที่อ่านได้
        </p>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2">
        {isUnset ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[11.5px] font-semibold">
            ยังไม่เคยตั้งรหัสผ่าน
          </span>
        ) : isDefault ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11.5px] font-semibold">
            🔓 ใช้รหัสพนักงานเป็นรหัสผ่าน
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11.5px] font-semibold">
            🔐 ตั้งรหัสผ่านส่วนตัว
          </span>
        )}
        {updatedAt && (
          <span className="text-[11px] text-slate-400">อัปเดตล่าสุด: {fmtTime(updatedAt)}</span>
        )}
      </div>

      {/* Password input */}
      <div>
        <label className="block text-[11.5px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
          รหัสผ่าน (Staff Portal)
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={pwd}
            onChange={e => handleChange(e.target.value)}
            placeholder={isUnset ? 'พนักงานยังไม่เคย login — รหัสจะเป็นรหัสพนักงานอัตโนมัติ' : 'รหัสผ่าน'}
            className="w-full bg-white border border-slate-200 pl-3 pr-24 py-2 rounded-lg text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30 focus:border-[#1E487A]"
            autoComplete="new-password"
            spellCheck={false}
          />
          <div className="absolute right-1 top-1 bottom-1 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              className="px-2 py-1 text-slate-400 hover:text-slate-600 transition-colors"
              title={show ? 'ซ่อน' : 'แสดง'}
            >
              {show ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.8} /> : <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!currentPlaintext}
              className="px-2 py-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
              title="คัดลอกรหัสผ่านปัจจุบัน"
            >
              {copied
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.2} />
                : <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />}
            </button>
          </div>
        </div>
        {isDirty && (
          <p className="text-[11.5px] text-amber-700 mt-1.5 flex items-center gap-1">
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-amber-700 bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={`รีเซ็ตเป็น "${empId}" (รหัสพนักงาน)`}
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
          {resetting ? 'กำลังรีเซ็ต...' : 'ใช้รหัสพนักงาน'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || resetting || !isDirty}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-white bg-[#1E487A] hover:bg-[#163963] rounded-md shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Key className="h-3.5 w-3.5" strokeWidth={2.2} />
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div className={`text-[12.5px] font-medium px-2.5 py-1.5 rounded-md ${
          msg.type === 'error'
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
    <div className="flex flex-col px-4 py-3 border-b border-slate-100 last:border-b-0">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</span>
      {!hasValue ? (
        <span className="text-sm text-slate-300">—</span>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 font-mono select-all">
            {show ? value : '•'.repeat(Math.min(String(value).length, 12))}
          </span>
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="text-slate-400 hover:text-[#1E487A] transition-colors"
            title={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          >
            {show
              ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.7 10.7a2.5 2.5 0 003.6 3.6M9.9 5.1A9.7 9.7 0 0112 5c4.4 0 8 3.5 9.4 7-.3.7-.8 1.7-1.5 2.7M6.4 6.4C4.4 7.9 2.9 10.2 2.6 12c1.4 3.5 5 7 9.4 7 1.4 0 2.8-.4 4-1"/></svg>
              : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="text-slate-400 hover:text-[#1E487A] transition-colors"
            title="คัดลอก"
            aria-label="คัดลอก"
          >
            {copied
              ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
          </button>
        </div>
      )}
    </div>
  );
}

function Th({ children, center }) {
  return (
    <th className={`px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${center ? 'text-center' : 'text-left'}`}>
      {children}
    </th>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
      <svg className="h-9 w-9 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════
   🆕 HistoryTimeline — ดีไซน์ใหม่: timeline + stats + filter
════════════════════════════════════════════════ */
function HistoryTimeline({ empHistory, historyFilter, setHistoryFilter, openPrintReturn }) {
  const TH_MONTHS = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const fmtDate = (ts) => formatDateShort(ts);
  const fmtTime = (ts) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const catLabel = (cat) => {
    if (cat === 'assets' || cat === 'asset') return 'ทรัพย์สิน';
    if (cat === 'licenses' || cat === 'license') return 'License';
    return 'อุปกรณ์';
  };

  return (
    <div className="space-y-3">

      {/* ── Filter — เรียบง่าย ── */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'all',         label: 'ทั้งหมด' },
          { id: 'assets',      label: 'ทรัพย์สิน' },
          { id: 'licenses',    label: 'License' },
          { id: 'accessories', label: 'อุปกรณ์' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setHistoryFilter(f.id)}
            className={`text-[12.5px] font-medium px-3 py-1.5 rounded-lg transition-colors ${
              historyFilter === f.id
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[12px] text-slate-400 self-center">{empHistory.length} รายการ</span>
      </div>

      {/* ── List — clean & simple ── */}
      {empHistory.length === 0 ? (
        <EmptyState label="ไม่มีประวัติ" />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {empHistory.map(rec => {
            const isCheckout = rec.action?.includes('เบิกจ่าย');
            const isBroken = rec.condition === 'ชำรุด';
            const canPrint = !isCheckout && (rec.category === 'assets' || rec.category === 'asset');
            return (
              <div key={rec.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">

                {/* Action dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${isCheckout ? 'bg-blue-500' : 'bg-teal-500'}`} />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {/* 🆕 License category — แสดงชื่อ License แทนชื่อทรัพย์สินที่ผูก */}
                    <span className="text-[13.5px] font-semibold text-slate-800 truncate">
                      {(rec.category === 'licenses' || rec.category === 'license')
                        ? (rec.licenseName || rec.assetName)
                        : rec.assetName}
                    </span>
                    <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded ${
                      isCheckout ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'
                    }`}>
                      {isCheckout ? 'เบิก' : 'คืน'}
                    </span>
                    <span className="text-[10.5px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {catLabel(rec.category)}
                    </span>
                    {isBroken && (
                      <span className="text-[10.5px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">ชำรุด</span>
                    )}
                  </div>
                  {/* 🆕 SN / Asset Tag — เฉพาะหมวดทรัพย์สิน */}
                  {(rec._sn || rec._assetTag) && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      {rec._assetTag && (
                        <span className="text-[11px] font-medium text-[#1E487A] bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                          {rec._assetTag}
                        </span>
                      )}
                      {rec._sn && (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md font-mono">
                          SN: {rec._sn}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11.5px] text-slate-400">
                    <span>{fmtDate(rec.timestamp)} · {fmtTime(rec.timestamp)}</span>
                    {rec.remarks && (
                      <>
                        <span>·</span>
                        <span className="truncate">{rec.remarks}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Print button */}
                {canPrint && (
                  <button
                    onClick={() => openPrintReturn(rec)}
                    className="shrink-0 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#1E487A] hover:bg-blue-50 px-2.5 py-1 rounded transition-colors"
                    title="พิมพ์ใบรับคืน"
                  >
                    <Printer className="h-3 w-3" strokeWidth={2.2} />
                    ใบรับคืน
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   StatTile — มินิการ์ดสำหรับ summary
════════════════════════════════════════════════ */
function StatTile({ label, value, color, bg }) {
  return (
    <div
      className="rounded-lg px-3.5 py-2.5 border transition-colors"
      style={{ background: bg, borderColor: 'transparent' }}
    >
      <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: `${color}AA` }}>{label}</p>
      <p className="text-[22px] font-bold tabular-nums leading-tight mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}
