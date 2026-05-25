import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { printHandoverForm } from '../utils/printHandoverForm.js';
import PreHandoverAssessmentModal from './PreHandoverAssessmentModal.jsx';
import PreReturnAssessmentModal from './PreReturnAssessmentModal.jsx';

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
}) {
  const [historyFilter, setHistoryFilter] = useState('all');
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [printReturnFor, setPrintReturnFor] = useState(null); // { period, asset } or null
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
  const empLicenses = licenses.filter(i => i.assignedTo === selectedEmployee.id);
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

  let empHistory = transactions
    .filter(t => t.empId === selectedEmployee.id)
    .filter(t => {
      if (historyFilter === 'all') return true;
      if (historyFilter === 'licenses') return t.category === 'licenses' || t.category === 'license';
      if (historyFilter === 'assets') return t.category === 'assets' || t.category === 'asset';
      if (historyFilter === 'accessories') return t.category === 'accessories' || t.category === 'accessory';
      return false;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const tabs = [
    { id: 'info',    label: 'ข้อมูลทั่วไป' },
    { id: 'assets',  label: 'ครอบครองปัจจุบัน', count: allHeld.length },
    { id: 'history', label: 'ประวัติเบิก-คืน',   count: empHistory.length },
  ];

  const initial = selectedEmployee.fullName?.charAt(0) || '?';

  // เปิด modal ให้ติ๊ก checklist + แนบรูปก่อนพิมพ์ (modal จะเรียก printHandoverForm เองเมื่อ submit)
  const handlePrint = () => setAssessmentOpen(true);

  return (
    <div
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
    >
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 w-full max-w-4xl flex flex-col h-[88vh] max-h-[88vh] ring-1 ring-slate-200/60 overflow-hidden">

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
                  <InfoItem label="เลขบัตรประชาชน"     value={selectedEmployee.nationalId} />
                  <InfoItem label="ตำแหน่ง"            value={selectedEmployee.position} />
                  <InfoItem label="แผนก"               value={selectedEmployee.department} />
                  <InfoItem label="บริษัท"             value={selectedEmployee.company} />
                </InfoGrid>
              </Section>

              <Section title="ข้อมูลการติดต่อ">
                <InfoGrid>
                  <InfoItem label="เบอร์โทรศัพท์" value={selectedEmployee.phone} />
                  <InfoItem label="หัวหน้างาน"   value={selectedEmployee.manager} />
                </InfoGrid>
              </Section>

              {(selectedEmployee.m365Email || selectedEmployee.m365Password) && (
                <Section title="บัญชี Microsoft 365">
                  <InfoGrid>
                    <InfoItem label="อีเมล Microsoft 365"    value={selectedEmployee.m365Email}    accent />
                    <InfoItem label="รหัสผ่าน Microsoft 365" value={selectedEmployee.m365Password} mono />
                  </InfoGrid>
                </Section>
              )}
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
                        className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-slate-200 hover:border-[#1E487A]/40 hover:bg-blue-50/40 hover:shadow-sm cursor-pointer transition-all group"
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
                                handleCheckin(item.id, category);
                              }
                            }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all flex items-center gap-1.5"
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
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all',         label: 'ทั้งหมด' },
                  { id: 'assets',      label: 'ทรัพย์สิน' },
                  { id: 'licenses',    label: 'License' },
                  { id: 'accessories', label: 'อุปกรณ์เสริม' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryFilter(f.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                      historyFilter === f.id
                        ? 'bg-[#1E487A] text-white border-[#1E487A]'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {empHistory.length === 0
                ? <EmptyState label="ไม่พบประวัติในหมวดหมู่นี้" />
                : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <Th>วันที่</Th>
                          <Th>รายการ</Th>
                          <Th center>ประเภทข้อมูล</Th>
                          <Th center>การดำเนินการ</Th>
                          <Th center>สภาพ</Th>
                          <Th>หมายเหตุ</Th>
                          <Th center>พิมพ์</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {empHistory.map(rec => {
                          const d = new Date(rec.timestamp);
                          const date = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
                          const isCheckout = rec.action?.includes('เบิกจ่าย');
                          const catNorm = (rec.category === 'assets' || rec.category === 'asset') ? 'ทรัพย์สิน'
                            : (rec.category === 'licenses' || rec.category === 'license') ? 'License'
                            : 'อุปกรณ์';

                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{date}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{rec.assetName}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                  {catNorm}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${
                                  isCheckout
                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                    : 'bg-teal-50 text-teal-600 border-teal-100'
                                }`}>
                                  {rec.action || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${
                                  rec.condition === 'ชำรุด'  ? 'bg-red-50 text-red-500 border-red-100'
                                  : rec.condition === 'ปกติ' ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}>
                                  {rec.condition || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-xs max-w-[160px] truncate" title={rec.remarks}>
                                {rec.remarks || '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {/* พิมพ์ใบรับคืน — เฉพาะแถวที่เป็น "รับคืน" และไม่ใช่ license */}
                                {!isCheckout && rec.category !== 'licenses' && rec.category !== 'license' ? (
                                  <button
                                    onClick={() => openPrintReturn(rec)}
                                    title="พิมพ์ใบรับคืน (IT-FORM-002)"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] font-semibold text-[#1E487A] ring-1 ring-inset ring-[#1E487A]/30 bg-white hover:bg-[#1E487A] hover:text-white hover:ring-[#1E487A] transition"
                                  >
                                    <Printer className="h-3.5 w-3.5" strokeWidth={2.2} />
                                    ใบรับคืน
                                  </button>
                                ) : (
                                  <span className="text-slate-300 text-[12px]">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0">

          {/* ปุ่มพิมพ์ใบส่งมอบ */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1E487A] border border-[#1E487A]/30 bg-blue-50 hover:bg-[#1E487A] hover:text-white rounded-lg transition group"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            พิมพ์ใบส่งมอบทรัพย์สิน
            <span className="text-[11px] font-semibold bg-[#1E487A]/10 group-hover:bg-white/20 text-[#1E487A] group-hover:text-white px-1.5 py-0.5 rounded-md transition">
              {allHeld.length} รายการ
            </span>
          </button>

          <div className="flex items-center gap-2">
            {!selectedEmployee.deletedAt && (
              <button
                onClick={() => openEditEmpModal(selectedEmployee)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                แก้ไขข้อมูล
              </button>
            )}
            <button
              onClick={() => setSelectedEmployee(null)}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#1E487A] hover:bg-[#133257] rounded-lg transition"
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
      />

      {/* ── Pre-Return Assessment Modal (พิมพ์ IT-FORM-002 จากแถว "รับคืน") ── */}
      {printReturnFor && (
        <PreReturnAssessmentModal
          isOpen={true}
          onClose={() => setPrintReturnFor(null)}
          employee={selectedEmployee}
          mainAsset={printReturnFor.asset}
          handoverDate={printReturnFor.period.checkout?.timestamp}
          returnDate={printReturnFor.period.return?.timestamp}
        />
      )}
    </div>
  );
}

/* ── Helper components ── */
function Section({ title, children }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="border border-slate-200 rounded-xl overflow-hidden">{children}</div>
    </div>
  );
}

function InfoGrid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x-0">{children}</div>;
}

function InfoItem({ label, value, accent, span2, mono }) {
  return (
    <div className={`flex flex-col px-4 py-3 border-b border-slate-100 last:border-b-0 ${span2 ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</span>
      <span className={`text-sm font-medium ${accent ? 'text-[#1E487A]' : 'text-slate-800'} ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-300">—</span>}
      </span>
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
