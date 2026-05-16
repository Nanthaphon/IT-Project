import React, { useState } from 'react';

/* ════════════════════════════════════════════════
   ฟังก์ชันพิมพ์ใบส่งมอบทรัพย์สิน
════════════════════════════════════════════════ */
function printTransferDoc({ employee, empAssets, empLicenses, empAccessories }) {
  const today = new Date();
  const thDate = today.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  /* ── table helpers ── */
  const row = (cells, isHeader = false) =>
    `<tr>${cells.map(c => isHeader
      ? `<th style="border:1px solid #94a3b8;padding:6px 10px;background:#e2e8f0;font-weight:700;font-size:12px;text-align:center;white-space:nowrap;color:#000">${c}</th>`
      : `<td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;vertical-align:top;color:#000">${c ?? '-'}</td>`
    ).join('')}</tr>`;

  const table = (headers, rows, emptyText) => `
    <table style="width:100%;border-collapse:collapse;margin-bottom:2px">
      <thead>${row(headers, true)}</thead>
      <tbody>
        ${rows.length > 0
          ? rows.join('')
          : `<tr><td colspan="${headers.length}" style="border:1px solid #cbd5e1;padding:10px;text-align:center;color:#64748b;font-size:12px">${emptyText}</td></tr>`
        }
      </tbody>
    </table>`;

  /* ── section title helper ── */
  const sectionTitle = (iconPath, label, count) =>
    `<div style="font-size:13px;font-weight:700;color:#fff;background:#1E487A;padding:5px 12px;
      border-radius:3px;margin-bottom:6px;display:flex;align-items:center;gap:6px">
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">${iconPath}</svg>
      ${label}
      <span style="margin-left:auto;background:rgba(255,255,255,0.2);border-radius:3px;padding:1px 8px;font-size:11px">${count} รายการ</span>
    </div>`;

  /* ── rows ── */
  const assetRows = empAssets.map((item, i) => row([
    i + 1, item.name || '-', item.type || '-', item.model || '-',
    item.assetTag || '-', item.sn || '-', item.status || 'พร้อมใช้งาน',
  ]));
  const licenseRows = empLicenses.map((item, i) => row([
    i + 1, item.name || '-', item.type || '-',
    item.licenseKey || item.productKey || '-', item.vendor || '-',
    item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('th-TH') : 'ไม่มีวันหมดอายุ',
  ]));
  const accessoryRows = empAccessories.map((item, i) => row([
    i + 1, item.name || '-', item.type || '-',
    item.sn || item.serialNumber || '-', item.brand || '-', '1',
  ]));

  /* ── info cell (ใช้ใน 2-col grid) ── */
  const cell = (label, value) =>
    `<div style="padding:4px 0">
      <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">${label}</div>
      <div style="font-size:13px;font-weight:600;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${value || '-'}</div>
    </div>`;

  const totalItems = empAssets.length + empLicenses.length + empAccessories.length;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <title>ใบส่งมอบทรัพย์สิน - ${employee.fullName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
    *  { box-sizing:border-box; margin:0; padding:0; }
    body {
      font-family:'Sarabun','Prompt',sans-serif;
      font-size:13px; color:#000; background:#fff;
      padding:20px 28px;
    }
    @media print {
      body { padding:0; }
      .no-print { display:none !important; }
      @page { size:A4 portrait; margin:10mm 12mm 10mm 12mm; }
    }
  </style>
</head>
<body>

  <!-- ปุ่มพิมพ์ (ไม่แสดงตอนปริ้น) -->
  <button class="no-print" onclick="window.print()"
    style="display:block;margin:0 auto 16px;padding:8px 28px;background:#1E487A;color:#fff;
    border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
    🖨️ พิมพ์เอกสาร / บันทึก PDF
  </button>

  <!-- ════ HEADER ════ -->
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:6px">
    <div>
      <div style="font-size:19px;font-weight:700;color:#1E487A;line-height:1.2">ใบส่งมอบทรัพย์สิน IT</div>
      <div style="font-size:12px;color:#000;margin-top:2px">IT Asset Transfer Document</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#000">วันที่ออกเอกสาร</div>
      <div style="font-size:13px;font-weight:700;color:#000">${thDate}</div>
      <div style="margin-top:3px;background:#eff6ff;color:#1E487A;border:1px solid #bfdbfe;
        border-radius:3px;padding:2px 10px;font-size:12px;font-weight:700;display:inline-block">
        รวม ${totalItems} รายการ
      </div>
    </div>
  </div>
  <div style="border-top:2px solid #1E487A;margin-bottom:10px"></div>

  <!-- ════ ข้อมูลพนักงาน (2 columns) ════ -->
  <div style="font-size:13px;font-weight:700;color:#1E487A;margin-bottom:6px;
    display:flex;align-items:center;gap:6px">
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
    ข้อมูลผู้รับมอบ
  </div>

  <div style="border:1px solid #e2e8f0;border-radius:5px;padding:8px 10px;margin-bottom:8px">
    <!-- แถว 1: ชื่อ TH | ชื่อ EN -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:4px">
      ${cell('ชื่อ-นามสกุล (TH)', employee.fullName)}
      ${cell('ชื่อ-นามสกุล (EN)', employee.fullNameEng)}
    </div>
    <!-- แถว 2: รหัสพนักงาน | ตำแหน่ง -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:4px">
      ${cell('รหัสพนักงาน', employee.empId)}
      ${cell('ตำแหน่ง', employee.position)}
    </div>
    <!-- แถว 3: แผนก | บริษัท -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:4px">
      ${cell('แผนก / ฝ่าย', employee.department)}
      ${cell('บริษัท', employee.company)}
    </div>
    <!-- แถว 4: เบอร์โทร | หัวหน้างาน -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:4px">
      ${cell('เบอร์โทรศัพท์', employee.phone)}
      ${cell('หัวหน้างาน / ผู้บังคับบัญชา', employee.manager)}
    </div>
    ${(employee.m365Email || employee.m365Password) ? `
    <!-- แถว 6: Microsoft 365 -->
    <div style="border-top:1px dashed #cbd5e1;margin-top:4px;padding-top:6px">
      <div style="font-size:11px;font-weight:700;color:#1E487A;margin-bottom:5px;display:flex;align-items:center;gap:4px">
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
        </svg>
        บัญชี Microsoft 365
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px">
        ${cell('อีเมล Microsoft 365', employee.m365Email || '-')}
        ${cell('รหัสผ่าน Microsoft 365', employee.m365Password || '-')}
      </div>
    </div>` : ''}
  </div>

  <!-- ════ ทรัพย์สินหลัก ════ -->
  ${sectionTitle(
    '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>',
    'ทรัพย์สินหลัก (Computers / Hardware)', empAssets.length
  )}
  ${table(
    ['#', 'ชื่ออุปกรณ์', 'ประเภท', 'ยี่ห้อ / รุ่น', 'รหัสทรัพย์สิน', 'Serial Number', 'สถานะ'],
    assetRows, 'ไม่มีทรัพย์สินหลัก'
  )}

  <div style="margin-top:7px"></div>

  <!-- ════ โปรแกรม/ใบอนุญาต ════ -->
  ${sectionTitle(
    '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
    'โปรแกรม / ใบอนุญาต (Licenses)', empLicenses.length
  )}
  ${table(
    ['#', 'ชื่อโปรแกรม', 'ประเภท', 'License Key', 'ผู้จัดจำหน่าย', 'วันหมดอายุ'],
    licenseRows, 'ไม่มีโปรแกรม / ใบอนุญาต'
  )}

  <div style="margin-top:7px"></div>

  <!-- ════ อุปกรณ์เสริม ════ -->
  ${sectionTitle(
    '<path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>',
    'อุปกรณ์เสริม (Accessories)', empAccessories.length
  )}
  ${table(
    ['#', 'ชื่ออุปกรณ์', 'ประเภท', 'Serial Number', 'ยี่ห้อ', 'จำนวน'],
    accessoryRows, 'ไม่มีอุปกรณ์เสริม'
  )}

  <div style="border-top:1px solid #000;margin:10px 0"></div>

  <!-- ════ เงื่อนไขการรับมอบ ════ -->
  <div style="margin-bottom:12px">
    <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:6px">เงื่อนไขการรับมอบทรัพย์สิน</div>
    <div style="font-size:13px;color:#000;line-height:1.9">
      <div>1. ผู้รับมอบยืนยันว่าได้รับทรัพย์สินครบถ้วนและอยู่ในสภาพสมบูรณ์</div>
      <div>2. ต้องดูแลรักษาทรัพย์สินและใช้งานตามวัตถุประสงค์ที่กำหนดเท่านั้น</div>
      <div>3. หากเกิดความเสียหายจากการใช้งานที่ไม่เหมาะสม ผู้รับมอบรับผิดชอบค่าทดแทน</div>
      <div>4. เมื่อสิ้นสุดการใช้งาน ต้องส่งคืนทรัพย์สินในสภาพเรียบร้อยแก่ฝ่าย IT</div>
    </div>
  </div>

  <!-- ════ ลายเซ็น (ใต้กฏ) ════ -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:4px">
    <div style="border:1px solid #000;border-radius:5px;padding:12px 16px;text-align:center">
      <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:4px">ผู้รับมอบ (พนักงาน)</div>
      <div style="border-bottom:1px solid #000;margin:36px 8px 8px"></div>
      <div style="font-size:13px;font-weight:700;color:#000">(${employee.fullName})</div>
      <div style="font-size:12px;color:#000;margin-top:2px">${employee.position || '.....................................'}</div>
      <div style="font-size:12px;color:#000;margin-top:4px">วันที่ .....................................</div>
    </div>
    <div style="border:1px solid #000;border-radius:5px;padding:12px 16px;text-align:center">
      <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:4px">ผู้ส่งมอบ (เจ้าหน้าที่ IT)</div>
      <div style="border-bottom:1px solid #000;margin:36px 8px 8px"></div>
      <div style="font-size:13px;font-weight:700;color:#000">(.....................................)</div>
      <div style="font-size:12px;color:#000;margin-top:2px">เจ้าหน้าที่ IT</div>
      <div style="font-size:12px;color:#000;margin-top:4px">วันที่ .....................................</div>
    </div>
  </div>

  <div style="text-align:center;font-size:10px;color:#64748b;margin-top:10px">
    ออกโดยระบบ IT Asset Management · ${thDate}
  </div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
}

/* ════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════ */
export default function EmployeeDetailsModal({
  selectedEmployee, setSelectedEmployee, empModalTab, setEmpModalTab,
  assets, licenses, accessories, transactions, openEditEmpModal, handleCheckin, setReturnModal
}) {
  const [historyFilter, setHistoryFilter] = useState('all');
  if (!selectedEmployee) return null;

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

  const handlePrint = () => {
    printTransferDoc({
      employee: selectedEmployee,
      empAssets,
      empLicenses,
      empAccessories,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');`}</style>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden">

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
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
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

                    return (
                      <div
                        key={item.uniqueKey || item.id}
                        className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-slate-200 hover:border-[#1E487A]/30 hover:bg-slate-50/60 transition-all group"
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
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${catColor}`}>
                                {catLabel}
                              </span>
                              {item.type && (
                                <span className="text-[10px] text-slate-400">{item.type}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (isAccessory) {
                              setReturnModal({
                                isOpen: true, assetId: item.id, checkoutId: item.checkoutId,
                                empId: selectedEmployee.id, empName: selectedEmployee.fullName, assetName: item.name
                              });
                            } else {
                              handleCheckin(item.id, category);
                            }
                          }}
                          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all flex items-center gap-1.5"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          รับคืน
                        </button>
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
                                <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                  {catNorm}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${
                                  isCheckout
                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                    : 'bg-teal-50 text-teal-600 border-teal-100'
                                }`}>
                                  {rec.action || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${
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
            <span className="text-[10px] font-semibold bg-[#1E487A]/10 group-hover:bg-white/20 text-[#1E487A] group-hover:text-white px-1.5 py-0.5 rounded-md transition">
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
    </div>
  );
}

/* ── Helper components ── */
function Section({ title, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</p>
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
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</span>
      <span className={`text-sm font-medium ${accent ? 'text-[#1E487A]' : 'text-slate-800'} ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

function Th({ children, center }) {
  return (
    <th className={`px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider ${center ? 'text-center' : 'text-left'}`}>
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
