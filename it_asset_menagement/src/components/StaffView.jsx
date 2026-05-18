import React, { useState, useRef, useEffect } from 'react';

/* ════════════════════════════════════════════════
   พิมพ์ฟอร์มขอเปลี่ยนเครื่อง
════════════════════════════════════════════════ */
function printReplacementForm({ staff, currentStatus, reason, myAssets }) {
  const today = new Date();
  const thDate = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  const assetRows = myAssets.length > 0
    ? myAssets.map((item, i) => `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;color:#000;text-align:center">${i + 1}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;color:#000">${item.name || '-'}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;color:#000">${item.type || '-'}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;color:#000;font-family:monospace">${item.sn || item.serialNumber || '-'}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:12px;color:#000;font-family:monospace">${item.assetTag || '-'}</td>
        </tr>`).join('')
    : `<tr><td colspan="5" style="border:1px solid #cbd5e1;padding:10px;text-align:center;color:#64748b;font-size:12px">ไม่มีทรัพย์สินหลักในชื่อพนักงาน</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <title>ฟอร์มขอเปลี่ยนเครื่อง - ${staff.fullName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Sarabun',sans-serif; font-size:13px; color:#000; background:#fff; padding:24px 32px; }
    @media print {
      body { padding:0; }
      .no-print { display:none !important; }
      @page { size:A4 portrait; margin:12mm 14mm; }
    }
  </style>
</head>
<body>

  <button class="no-print" onclick="window.print()"
    style="display:block;margin:0 auto 20px;padding:8px 32px;background:#1E487A;color:#fff;
    border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
    🖨️ พิมพ์ / บันทึก PDF
  </button>

  <!-- Header -->
  <div style="text-align:center;margin-bottom:12px">
    <div style="font-size:20px;font-weight:700;color:#1E487A">ฟอร์มขอเปลี่ยนเครื่องคอมพิวเตอร์</div>
    <div style="font-size:13px;color:#000;margin-top:3px">Computer Replacement Request Form</div>
  </div>
  <div style="border-top:2px solid #1E487A;margin-bottom:14px"></div>

  <!-- วันที่ -->
  <div style="text-align:right;font-size:12px;color:#000;margin-bottom:12px">
    วันที่ยื่นคำขอ: <strong>${thDate}</strong>
  </div>

  <!-- ข้อมูลพนักงาน -->
  <div style="font-size:13px;font-weight:700;color:#1E487A;margin-bottom:7px;display:flex;align-items:center;gap:5px">
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
    ข้อมูลผู้ยื่นคำขอ
  </div>
  <div style="border:1px solid #cbd5e1;border-radius:5px;padding:10px 14px;margin-bottom:14px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px">
      <div>
        <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">ชื่อ-นามสกุล</div>
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${staff.fullName || '-'}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">รหัสพนักงาน</div>
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${staff.empId || '-'}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">แผนก</div>
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${staff.department || '-'}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">ตำแหน่ง</div>
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${staff.position || '-'}</div>
      </div>
      <div style="grid-column:1 / -1">
        <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">หัวหน้างาน / ผู้บังคับบัญชา</div>
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${staff.manager || '-'}</div>
      </div>
    </div>
  </div>

  <!-- เครื่องที่ถือครองปัจจุบัน -->
  <div style="font-size:13px;font-weight:700;color:#1E487A;margin-bottom:7px;display:flex;align-items:center;gap:5px">
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
    เครื่องคอมพิวเตอร์ที่ถือครองปัจจุบัน
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
    <thead>
      <tr>
        <th style="border:1px solid #94a3b8;padding:7px 10px;background:#e2e8f0;font-size:12px;font-weight:700;color:#000;text-align:center;white-space:nowrap">#</th>
        <th style="border:1px solid #94a3b8;padding:7px 10px;background:#e2e8f0;font-size:12px;font-weight:700;color:#000;text-align:center">ชื่ออุปกรณ์</th>
        <th style="border:1px solid #94a3b8;padding:7px 10px;background:#e2e8f0;font-size:12px;font-weight:700;color:#000;text-align:center">ประเภท</th>
        <th style="border:1px solid #94a3b8;padding:7px 10px;background:#e2e8f0;font-size:12px;font-weight:700;color:#000;text-align:center">Serial Number</th>
        <th style="border:1px solid #94a3b8;padding:7px 10px;background:#e2e8f0;font-size:12px;font-weight:700;color:#000;text-align:center">รหัสทรัพย์สิน</th>
      </tr>
    </thead>
    <tbody>${assetRows}</tbody>
  </table>

  <!-- เหตุผลขอเปลี่ยน -->
  <div style="font-size:13px;font-weight:700;color:#1E487A;margin-bottom:7px;display:flex;align-items:center;gap:5px">
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    เหตุผลและรายละเอียดการขอเปลี่ยน
  </div>
  <div style="border:1px solid #cbd5e1;border-radius:5px;padding:10px 14px;margin-bottom:14px">
    <div style="margin-bottom:8px">
      <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:3px">สถานะเครื่องปัจจุบัน</div>
      <div style="font-size:13px;font-weight:700;color:#000">${currentStatus}</div>
    </div>
    <div>
      <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:3px">รายละเอียด / เหตุผล</div>
      <div style="font-size:13px;color:#000;line-height:1.7;min-height:40px;white-space:pre-wrap">${reason}</div>
    </div>
  </div>

  <!-- เงื่อนไข -->
  <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:6px">เงื่อนไขและข้อตกลง</div>
  <div style="font-size:12px;color:#000;line-height:1.9;margin-bottom:16px">
    <div>1. ผู้ยื่นคำขอยืนยันว่าข้อมูลที่กรอกทั้งหมดเป็นความจริง</div>
    <div>2. เครื่องเดิมที่ส่งคืนต้องอยู่ในสภาพสมบูรณ์ที่สุดเท่าที่จะทำได้</div>
    <div>3. การอนุมัติขึ้นอยู่กับดุลยพินิจของหัวหน้างานและฝ่าย IT</div>
    <div>4. ต้องผ่านการอนุมัติจากหัวหน้าแผนกก่อนนำมายื่นฝ่าย IT</div>
  </div>

  <!-- ลายเซ็น 3 ช่อง -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
    <div style="border:1px solid #000;border-radius:5px;padding:12px 14px;text-align:center">
      <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:4px">ผู้ยื่นคำขอ (พนักงาน)</div>
      <div style="border-bottom:1px solid #000;margin:36px 6px 8px"></div>
      <div style="font-size:13px;font-weight:700;color:#000">(${staff.fullName})</div>
      <div style="font-size:12px;color:#000;margin-top:2px">${staff.position || '............................'}</div>
      <div style="font-size:12px;color:#000;margin-top:4px">วันที่ ............................</div>
    </div>
    <div style="border:1px solid #000;border-radius:5px;padding:12px 14px;text-align:center">
      <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:4px">หัวหน้าแผนก (ผู้อนุมัติ)</div>
      <div style="border-bottom:1px solid #000;margin:36px 6px 8px"></div>
      <div style="font-size:13px;font-weight:700;color:#000">(${staff.manager || '............................'})</div>
      <div style="font-size:12px;color:#000;margin-top:2px">หัวหน้าแผนก ${staff.department || ''}</div>
      <div style="font-size:12px;color:#000;margin-top:4px">วันที่ ............................</div>
    </div>
    <div style="border:1px solid #000;border-radius:5px;padding:12px 14px;text-align:center">
      <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:4px">เจ้าหน้าที่ IT (รับเรื่อง)</div>
      <div style="border-bottom:1px solid #000;margin:36px 6px 8px"></div>
      <div style="font-size:13px;font-weight:700;color:#000">(.............................)</div>
      <div style="font-size:12px;color:#000;margin-top:2px">เจ้าหน้าที่ IT</div>
      <div style="font-size:12px;color:#000;margin-top:4px">วันที่ ............................</div>
    </div>
  </div>

  <div style="text-align:center;font-size:10px;color:#64748b;margin-top:12px">
    ออกโดยระบบ IT Asset Management · ${thDate}
  </div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=750');
  win.document.write(html);
  win.document.close();
}

export default function StaffView({
  setAuthRole, currentStaff, setCurrentStaff,
  staffEmpIdInput, setStaffEmpIdInput, staffPasswordInput, setStaffPasswordInput, handleStaffLogin,
  staffRepairForm, setStaffRepairForm, handleSubmitRepairRequest, repairRequests, editStaffRepairModal, setEditStaffRepairModal, handleStaffUpdateRepair, handleStaffDeleteRepair,
  officeSupplies = [], supplyRequests = [], handleStaffSubmitSupplyRequest,
  assets = [], accessories = [], licenses = [],
  replacementRequests = [], handleStaffSubmitReplacement
}) {
  const [activeTab, setActiveTab] = useState('it_repair');
  const [supplyCart, setSupplyCart] = useState([]);
  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  const [isSupplyDropdownOpen, setIsSupplyDropdownOpen] = useState(false);
  const supplyDropdownRef = useRef(null);

  const [isSubmittingRepair, setIsSubmittingRepair] = useState(false);
  const [isSubmittingSupply, setIsSubmittingSupply] = useState(false);

  const [replaceStatusForm, setReplaceStatusForm] = useState('เครื่องช้า / ค้างบ่อย');
  const [replaceReasonForm, setReplaceReasonForm] = useState('');
  const [isSubmittingReplace, setIsSubmittingReplace] = useState(false);

  const [repairPage, setRepairPage] = useState(1);
  const [supplyPage, setSupplyPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (supplyDropdownRef.current && !supplyDropdownRef.current.contains(event.target)) {
        setIsSupplyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [supplyDropdownRef]);

  useEffect(() => {
    setRepairPage(1);
    setSupplyPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (!currentStaff) {
      const savedData = localStorage.getItem('staffRemember');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (Date.now() < parsed.expiry) {
            setStaffEmpIdInput(parsed.empId || '');
            if (setStaffPasswordInput) setStaffPasswordInput(parsed.password || '');
            setRememberMe(true);
          } else {
            localStorage.removeItem('staffRemember');
          }
        } catch (e) {
          console.error('Error parsing stored login', e);
        }
      }
    }
  }, [currentStaff, setStaffEmpIdInput, setStaffPasswordInput]);

  const filteredSupplies = officeSupplies.filter(supply =>
    supply.name?.toLowerCase().includes(supplySearchTerm.toLowerCase())
  );

  const onRepairSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingRepair(true);
    try { await handleSubmitRepairRequest(e); setRepairPage(1); }
    finally { setIsSubmittingRepair(false); }
  };

  const onSupplySubmit = async (e) => {
    e.preventDefault();
    if (supplyCart.length === 0) return alert('กรุณาเลือกอุปกรณ์ที่ต้องการเบิกอย่างน้อย 1 รายการ');
    setIsSubmittingSupply(true);
    try {
      for (const item of supplyCart) {
        await handleStaffSubmitSupplyRequest(item.supplyId, item.name, item.quantity, item.note);
      }
      setSupplyCart([]); setSupplySearchTerm(''); setSupplyPage(1);
    } finally { setIsSubmittingSupply(false); }
  };

  const onReplacementSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReplace(true);
    try {
      if (handleStaffSubmitReplacement) {
        await handleStaffSubmitReplacement(replaceStatusForm, replaceReasonForm);
        // พิมพ์ฟอร์มหลังบันทึกสำเร็จ
        const myAssets = assets.filter(item => item.assignedTo === currentStaff?.id && item.type === 'คอมพิวเตอร์');
        printReplacementForm({
          staff: currentStaff,
          currentStatus: replaceStatusForm,
          reason: replaceReasonForm,
          myAssets
        });
        setReplaceStatusForm('เครื่องช้า / ค้างบ่อย');
        setReplaceReasonForm('');
      }
    } finally {
      setIsSubmittingReplace(false);
    }
  };

  const handleLoginSubmit = (e) => {
    if (rememberMe) {
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('staffRemember', JSON.stringify({ empId: staffEmpIdInput, password: staffPasswordInput, expiry }));
    } else {
      localStorage.removeItem('staffRemember');
    }
    handleStaffLogin(e);
  };

  const getMyAssets = () => {
    if (!currentStaff) return [];
    const empAssets = assets.filter(item => item.assignedTo === currentStaff.id);
    const empLicenses = licenses.filter(item => item.assignedTo === currentStaff.id);
    const empAccessories = accessories.reduce((accList, acc) => {
      if (acc.assignees) {
        acc.assignees.filter(a => a.empId === currentStaff.id).forEach(checkout => {
          accList.push({ ...acc, uniqueKey: checkout.checkoutId, checkoutId: checkout.checkoutId, sn: checkout.serialNumber });
        });
      } else if (acc.assignedTo === currentStaff.id) {
        accList.push({ ...acc, uniqueKey: acc.id });
      }
      return accList;
    }, []);
    return [...empAssets, ...empLicenses, ...empAccessories];
  };

  const myAssetsList = getMyAssets();
  const myRequests = repairRequests.filter(req => req.empId === currentStaff?.empId);
  const mySupplyReqs = supplyRequests.filter(req => req.empId === currentStaff?.empId);
  const myReplacementReqs = replacementRequests.filter(req => req.empId === currentStaff?.empId);

  const totalRepairPages = Math.ceil(myRequests.length / ITEMS_PER_PAGE);
  const currentRepairRequests = myRequests.slice((repairPage - 1) * ITEMS_PER_PAGE, repairPage * ITEMS_PER_PAGE);
  const totalSupplyPages = Math.ceil(mySupplyReqs.length / ITEMS_PER_PAGE);
  const currentSupplyRequests = mySupplyReqs.slice((supplyPage - 1) * ITEMS_PER_PAGE, supplyPage * ITEMS_PER_PAGE);

  const tabs = [
    { id: 'it_repair',       label: 'แจ้งปัญหา IT',     count: myRequests.length },
    { id: 'replacement',     label: 'ขอเปลี่ยนเครื่อง',  count: myReplacementReqs.length },
    { id: 'office_supplies', label: 'เบิกอุปกรณ์',       count: mySupplyReqs.length },
    { id: 'my_assets',       label: 'ทรัพย์สินของฉัน',   count: myAssetsList.length },
  ];

  const statusBadge = (status) => {
    const map = {
      'รอดำเนินการ':   'bg-amber-50  text-amber-700  border-amber-200',
      'กำลังดำเนินการ':'bg-blue-50   text-blue-700   border-blue-200',
      'ซ่อมเสร็จสิ้น': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'อนุมัติแล้ว':   'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return `inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${map[status] || 'bg-red-50 text-red-700 border-red-200'}`;
  };

  /* ---------- shared input class ---------- */
  const inputCls = 'w-full border border-slate-200 bg-white px-3 py-2.5 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30 focus:border-[#1E487A] transition';
  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';
  const primaryBtn = (disabled) =>
    `w-full py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
      disabled
        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
        : 'bg-[#1E487A] hover:bg-[#133257] text-white active:scale-[0.98]'
    }`;

  /* ========================================
     LOGIN VIEW
  ======================================== */
  if (!currentStaff) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(30,72,122,0.10) 0%, rgba(30,72,122,0) 60%), linear-gradient(180deg, #F8FAFC 0%, #EEF2F8 100%)',
        }}
      >
        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-[#1E487A]/25 ring-1 ring-white/50"
              style={{ background: 'linear-gradient(135deg, #1E487A 0%, #163963 100%)' }}
            >
              <img src="/gb_icon.svg" alt="Logo" className="w-7 h-7 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <h1 className="text-[20px] font-semibold text-[#1E487A] tracking-tight">พนักงานทั่วไป</h1>
            <p className="text-[13px] text-slate-500 mt-1">ระบบจัดการทรัพย์สิน IT</p>
          </div>

          <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-7 shadow-xl shadow-slate-950/5">
            <h2 className="text-[15px] font-semibold text-slate-800 mb-5 tracking-tight">เข้าสู่ระบบ</h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>รหัสพนักงาน</label>
                <input
                  type="text" value={staffEmpIdInput} onChange={e => setStaffEmpIdInput(e.target.value)}
                  className={inputCls} placeholder="เช่น EMP001" required
                />
              </div>
              <div>
                <label className={labelCls}>รหัสผ่าน (เลขบัตรประชาชน)</label>
                <input
                  type="password" maxLength="13" value={staffPasswordInput || ''} onChange={e => setStaffPasswordInput?.(e.target.value)}
                  className={inputCls} placeholder="13 หลัก" required
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]" />
                <span className="text-[13px] text-slate-500">จดจำฉันไว้ 30 วัน</span>
              </label>
              <button
                type="submit"
                className="w-full py-3 bg-[#1E487A] hover:bg-[#163963] text-white text-[13.5px] font-semibold rounded-lg transition-colors shadow-sm mt-1"
                style={{ boxShadow: '0 4px 14px rgba(30,72,122,0.25)' }}
              >
                เข้าสู่ระบบ
              </button>
            </form>
          </div>

          <button
            onClick={() => { setAuthRole(null); setStaffEmpIdInput(''); setStaffPasswordInput?.(''); }}
            className="w-full mt-5 text-[13px] text-slate-500 hover:text-[#1E487A] transition-colors text-center inline-flex items-center justify-center gap-1.5"
          >
            ← กลับไปหน้าเลือกบทบาท
          </button>
        </div>
      </div>
    );
  }

  /* ========================================
     MAIN STAFF PORTAL
  ======================================== */
  return (
    <div className="min-h-screen bg-[#F1F5FA] flex flex-col">

      {/* ── Header ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-[#1E487A]/20"
            style={{ background: 'linear-gradient(135deg, #1E487A 0%, #163963 100%)' }}
          >
            <img src="/gb_icon.svg" alt="Logo" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <span className="text-[13.5px] font-semibold text-slate-700 hidden sm:block tracking-tight">ระบบพนักงาน</span>
        </div>
        <button
          onClick={() => { setAuthRole(null); setCurrentStaff(null); setStaffEmpIdInput(''); setStaffPasswordInput?.(''); }}
          className="text-[12.5px] font-medium text-slate-600 hover:text-rose-600 ring-1 ring-slate-200 hover:ring-rose-300 hover:bg-rose-50 px-3.5 py-1.5 rounded-lg transition-colors"
        >
          ออกจากระบบ
        </button>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-8 py-7 space-y-5">

        {/* ── Profile bar ── */}
        <div
          className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden shadow-lg shadow-[#1E487A]/15"
          style={{ background: 'radial-gradient(100% 80% at 0% 0%, #2A5896 0%, #1E487A 50%, #163963 100%)' }}
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-white font-semibold text-[18px] shrink-0">
              {currentStaff.fullName?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-white font-semibold text-[15px] leading-tight tracking-tight">
                {currentStaff.fullName}{currentStaff.nickname ? ` (${currentStaff.nickname})` : ''}
              </p>
              <p className="text-blue-200/85 text-[12px] mt-0.5">
                {currentStaff.empId} · {currentStaff.department || 'ไม่ระบุแผนก'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setCurrentStaff(null); setStaffEmpIdInput(''); setStaffPasswordInput?.(''); }}
            className="text-[12.5px] text-blue-200 hover:text-white ring-1 ring-white/20 hover:ring-white/40 hover:bg-white/10 px-3.5 py-1.5 rounded-lg transition-colors relative"
          >
            เปลี่ยนผู้ใช้
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-white rounded-xl ring-1 ring-slate-200/70 shadow-sm px-2 flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1E487A] text-[#1E487A]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums ${
                activeTab === tab.id ? 'bg-[#1E487A]/10 text-[#1E487A]' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ==================== TAB: แจ้งปัญหา IT ==================== */}
        {activeTab === 'it_repair' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 h-fit space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3">เปิดใบแจ้งปัญหาใหม่</h3>
              <form onSubmit={onRepairSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>อุปกรณ์ / ปัญหา <span className="text-red-500 normal-case">*</span></label>
                  <select
                    value={staffRepairForm.assetName}
                    onChange={e => setStaffRepairForm({ ...staffRepairForm, assetName: e.target.value })}
                    className={inputCls} required
                  >
                    <option value="" disabled>-- เลือกประเภทปัญหา --</option>
                    <option value="โน๊ตบุ๊ค/คอมพิวเตอร์">โน๊ตบุ๊ค / คอมพิวเตอร์</option>
                    <option value="โปรแกรม">โปรแกรม</option>
                    <option value="ปริ้นท์เตอร์">ปริ้นท์เตอร์</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>รายละเอียดอาการ <span className="text-red-500 normal-case">*</span></label>
                  <textarea
                    value={staffRepairForm.issue}
                    onChange={e => setStaffRepairForm({ ...staffRepairForm, issue: e.target.value })}
                    className={inputCls} rows="4"
                    placeholder="อธิบายอาการที่พบ..."
                    required
                  />
                </div>
                <button type="submit" disabled={isSubmittingRepair} className={primaryBtn(isSubmittingRepair)}>
                  {isSubmittingRepair
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> กำลังส่ง...</>
                    : 'ส่งเรื่องให้ IT'}
                </button>
              </form>
            </div>

            {/* History */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-800">ประวัติการแจ้งปัญหา</h3>
                {totalRepairPages > 1 && (
                  <span className="text-xs text-slate-400">หน้า {repairPage} / {totalRepairPages}</span>
                )}
              </div>

              {currentRepairRequests.length === 0 ? (
                <EmptyState label="ยังไม่มีประวัติการแจ้งปัญหา" />
              ) : (
                <div className="overflow-x-auto flex-1 rounded-xl border border-slate-100">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <Th>วันที่แจ้ง</Th>
                        <Th>อุปกรณ์</Th>
                        <Th>รายละเอียด</Th>
                        <Th center>สถานะ</Th>
                        <Th center>จัดการ</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentRepairRequests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                          <Td>{new Date(req.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</Td>
                          <Td bold>{req.assetName}</Td>
                          <Td muted truncate>{req.issue}</Td>
                          <td className="px-4 py-3 text-center"><span className={statusBadge(req.status)}>{req.status}</span></td>
                          <td className="px-4 py-3 text-center">
                            {req.status === 'รอดำเนินการ' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <IconBtn onClick={() => setEditStaffRepairModal({ isOpen: true, data: req })} label="แก้ไข">
                                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </IconBtn>
                                <IconBtn onClick={() => handleStaffDeleteRepair(req.id)} label="ลบ" danger>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </IconBtn>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">ล็อคแล้ว</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination page={repairPage} total={totalRepairPages} onChange={setRepairPage} />
            </div>
          </div>
        )}

        {/* ==================== TAB: ขอเปลี่ยนเครื่อง ==================== */}
        {activeTab === 'replacement' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="bg-white rounded-2xl border border-slate-200 p-6 h-fit space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3">ฟอร์มขอเปลี่ยนเครื่อง</h3>
              <form onSubmit={onReplacementSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>สถานะเครื่องปัจจุบัน <span className="text-red-500 normal-case">*</span></label>
                  <select value={replaceStatusForm} onChange={e => setReplaceStatusForm(e.target.value)} className={inputCls} required>
                    <option value="เครื่องช้า / ค้างบ่อย">เครื่องช้า / ค้างบ่อย</option>
                    <option value="เปิดไม่ติด / ชำรุดหนัก">เปิดไม่ติด / ชำรุดหนัก</option>
                    <option value="แบตเตอรี่เสื่อมสภาพ">แบตเตอรี่เสื่อมสภาพ</option>
                    <option value="จอแสดงผลมีปัญหา">จอแสดงผลมีปัญหา</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>เหตุผลขอเปลี่ยน <span className="text-red-500 normal-case">*</span></label>
                  <textarea
                    value={replaceReasonForm} onChange={e => setReplaceReasonForm(e.target.value)}
                    className={inputCls} rows="4"
                    placeholder="อธิบายเพิ่มเติม..."
                    required
                  />
                </div>
                <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 leading-relaxed flex items-start gap-2">
                  <svg className="h-3.5 w-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>ระบบจะบันทึกคำขอและ<span className="font-semibold"> เปิดหน้าพิมพ์ฟอร์มให้อัตโนมัติ</span> — นำฟอร์มให้หัวหน้าแผนกเซ็นต์แล้วส่งให้ IT</span>
                </div>
                <button type="submit" disabled={isSubmittingReplace} className={primaryBtn(isSubmittingReplace)}>
                  {isSubmittingReplace
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> กำลังบันทึก...</>
                    : <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        บันทึก + พิมพ์ฟอร์ม
                      </>
                  }
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">ประวัติคำขอเปลี่ยนเครื่อง</h3>
              {myReplacementReqs.length === 0 ? (
                <EmptyState label="ยังไม่มีประวัติการขอเปลี่ยนเครื่อง" />
              ) : (
                <div className="overflow-x-auto flex-1 rounded-xl border border-slate-100">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <Th>วันที่ขอ</Th>
                        <Th>สถานะเครื่อง</Th>
                        <Th>เหตุผล</Th>
                        <Th center>สถานะคำขอ</Th>
                        <Th center>พิมพ์ฟอร์ม</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {myReplacementReqs.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                          <Td>{new Date(req.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</Td>
                          <Td bold>{req.currentStatus}</Td>
                          <Td muted truncate>{req.reason}</Td>
                          <td className="px-4 py-3 text-center"><span className={statusBadge(req.status)}>{req.status}</span></td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => printReplacementForm({
                                staff: currentStaff,
                                currentStatus: req.currentStatus,
                                reason: req.reason,
                                myAssets: assets.filter(a => a.assignedTo === currentStaff?.id && a.type === 'คอมพิวเตอร์')
                              })}
                              title="พิมพ์ฟอร์มซ้ำ"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-100 hover:border-blue-600 px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              พิมพ์
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: เบิกอุปกรณ์ ==================== */}
        {activeTab === 'office_supplies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="bg-white rounded-2xl border border-slate-200 p-6 h-fit space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3">ฟอร์มขอเบิกอุปกรณ์</h3>
              <form onSubmit={onSupplySubmit} className="space-y-4">
                <div ref={supplyDropdownRef} className="relative">
                  <label className={labelCls}>ค้นหาอุปกรณ์ <span className="text-red-500 normal-case">*</span></label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="พิมพ์ชื่ออุปกรณ์..."
                      value={supplySearchTerm}
                      onChange={e => { setSupplySearchTerm(e.target.value); setIsSupplyDropdownOpen(true); }}
                      onFocus={() => setIsSupplyDropdownOpen(true)}
                      className={`${inputCls} pl-9`}
                    />
                  </div>

                  {isSupplyDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                      {filteredSupplies.length > 0 ? filteredSupplies.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.quantity > 0 && !supplyCart.some(c => c.supplyId === item.id)) {
                              setSupplyCart([...supplyCart, { supplyId: item.id, name: item.name, maxQty: item.quantity, image: item.image, unit: item.unit, quantity: 1, note: '' }]);
                            }
                            setSupplySearchTerm(''); setIsSupplyDropdownOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${item.quantity <= 0 ? 'opacity-40 cursor-not-allowed' : ''} ${supplyCart.some(c => c.supplyId === item.id) ? 'bg-blue-50/60' : ''}`}
                        >
                          {item.image
                            ? <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                            : <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0">📎</div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                            <p className="text-xs mt-0.5">
                              {item.quantity <= 0
                                ? <span className="text-red-500 font-semibold">หมดสต็อก</span>
                                : <span className="text-emerald-600 font-semibold">คงเหลือ {item.quantity} {item.unit}</span>
                              }
                            </p>
                          </div>
                          {supplyCart.some(c => c.supplyId === item.id) && (
                            <svg className="h-4 w-4 text-[#1E487A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )) : (
                        <p className="p-4 text-sm text-center text-slate-500">ไม่พบอุปกรณ์ที่ค้นหา</p>
                      )}
                    </div>
                  )}
                </div>

                {supplyCart.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">รายการที่เลือก ({supplyCart.length})</p>
                    {supplyCart.map((cartItem, index) => (
                      <div key={cartItem.supplyId} className="border border-slate-200 rounded-xl p-4 space-y-3 relative group bg-slate-50/50">
                        <button
                          type="button"
                          onClick={() => setSupplyCart(supplyCart.filter(c => c.supplyId !== cartItem.supplyId))}
                          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="flex items-center gap-3 pr-6">
                          {cartItem.image
                            ? <img src={cartItem.image} alt={cartItem.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                            : <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg shrink-0 border border-slate-200">📎</div>
                          }
                          <div>
                            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{cartItem.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">สูงสุด {cartItem.maxQty} {cartItem.unit}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 uppercase mb-1 block">จำนวน *</label>
                            <input
                              type="number" min="1" max={cartItem.maxQty} value={cartItem.quantity}
                              onChange={e => { const nc = [...supplyCart]; nc[index].quantity = e.target.value; setSupplyCart(nc); }}
                              className={inputCls} required
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase mb-1 block">หมายเหตุ</label>
                            <input
                              type="text" value={cartItem.note}
                              onChange={e => { const nc = [...supplyCart]; nc[index].note = e.target.value; setSupplyCart(nc); }}
                              className={inputCls} placeholder="เช่น สำหรับโปรเจค A..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button type="submit" disabled={supplyCart.length === 0 || isSubmittingSupply} className={primaryBtn(supplyCart.length === 0 || isSubmittingSupply)}>
                  {isSubmittingSupply
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> กำลังส่ง...</>
                    : `ส่งคำขอเบิก${supplyCart.length > 0 ? ` (${supplyCart.length} รายการ)` : ''}`
                  }
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-800">ประวัติคำขอเบิกอุปกรณ์</h3>
                {totalSupplyPages > 1 && <span className="text-xs text-slate-400">หน้า {supplyPage} / {totalSupplyPages}</span>}
              </div>

              {currentSupplyRequests.length === 0 ? (
                <EmptyState label="ยังไม่มีประวัติการเบิกอุปกรณ์" />
              ) : (
                <div className="overflow-x-auto flex-1 rounded-xl border border-slate-100">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <Th>วันที่ขอ</Th>
                        <Th>อุปกรณ์</Th>
                        <Th center>จำนวน</Th>
                        <Th center>สถานะ</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentSupplyRequests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                          <Td>{new Date(req.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</Td>
                          <Td bold>{req.supplyName}</Td>
                          <td className="px-4 py-3 text-center font-semibold text-[#1E487A]">{req.requestedQty}</td>
                          <td className="px-4 py-3 text-center"><span className={statusBadge(req.status)}>{req.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination page={supplyPage} total={totalSupplyPages} onChange={setSupplyPage} />
            </div>
          </div>
        )}

        {/* ==================== TAB: ทรัพย์สินของฉัน ==================== */}
        {activeTab === 'my_assets' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">ทรัพย์สินที่อยู่ในการดูแลของคุณ</h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{myAssetsList.length} รายการ</span>
            </div>

            {myAssetsList.length === 0 ? (
              <EmptyState label="คุณยังไม่มีทรัพย์สินในชื่อของคุณ" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {myAssetsList.map(item => {
                  const isAsset = assets.some(a => a.id === item.id);
                  const isAccessory = accessories.some(a => a.id === item.id);
                  const catText = isAsset ? 'ทรัพย์สินหลัก' : isAccessory ? 'อุปกรณ์เสริม' : 'License';
                  const icon = isAsset ? '🖥️' : isAccessory ? '🖱️' : '🔑';

                  return (
                    <div key={item.uniqueKey || item.id} className="border border-slate-200 rounded-xl p-4 hover:border-[#1E487A]/30 hover:shadow-sm transition-all flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                          : <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl shrink-0 border border-slate-200">{icon}</div>
                        }
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="font-semibold text-slate-800 text-sm truncate" title={item.name}>{item.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.type || 'License'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{catText}</span>
                        {item.sn && (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md truncate max-w-[130px]" title={item.sn}>
                            {item.sn}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ==================== Modal: แก้ไขแจ้งปัญหา ==================== */}
      {editStaffRepairModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">แก้ไขรายการแจ้งปัญหา</h3>
              <button
                onClick={() => setEditStaffRepairModal({ isOpen: false, data: null })}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleStaffUpdateRepair} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>อุปกรณ์ / ปัญหา *</label>
                <select
                  value={editStaffRepairModal.data.assetName}
                  onChange={e => setEditStaffRepairModal(prev => ({ ...prev, data: { ...prev.data, assetName: e.target.value } }))}
                  className={inputCls} required
                >
                  <option value="" disabled>-- เลือกประเภทปัญหา --</option>
                  <option value="โน๊ตบุ๊ค/คอมพิวเตอร์">โน๊ตบุ๊ค / คอมพิวเตอร์</option>
                  <option value="โปรแกรม">โปรแกรม</option>
                  <option value="ปริ้นท์เตอร์">ปริ้นท์เตอร์</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>รายละเอียดอาการ *</label>
                <textarea
                  value={editStaffRepairModal.data.issue}
                  onChange={e => setEditStaffRepairModal(prev => ({ ...prev, data: { ...prev.data, issue: e.target.value } }))}
                  className={inputCls} rows="4" required
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#1E487A] hover:bg-[#133257] text-white text-sm font-semibold rounded-lg transition">
                บันทึกการแก้ไข
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tiny helper components ── */

function EmptyState({ label }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
      <svg className="h-10 w-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

function Th({ children, center }) {
  return (
    <th className={`px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${center ? 'text-center' : 'text-left'}`}>
      {children}
    </th>
  );
}

function Td({ children, bold, muted, truncate, center }) {
  return (
    <td className={`px-4 py-3 ${bold ? 'font-semibold text-slate-800' : muted ? 'text-slate-500' : 'text-slate-600'} ${truncate ? 'truncate max-w-[180px]' : ''} ${center ? 'text-center' : ''}`}>
      {children}
    </td>
  );
}

function IconBtn({ children, onClick, label, danger }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-7 h-7 flex items-center justify-center rounded-lg border transition ${
        danger
          ? 'text-red-400 border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500'
          : 'text-slate-400 border-slate-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500'
      }`}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {children}
      </svg>
    </button>
  );
}

function Pagination({ page, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-1 mt-4 pt-4 border-t border-slate-100">
      <button
        onClick={() => onChange(p => Math.max(1, p - 1))} disabled={page === 1}
        className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-30 transition"
      >
        ← ก่อนหน้า
      </button>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i} onClick={() => onChange(i + 1)}
          className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${page === i + 1 ? 'bg-[#1E487A] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onChange(p => Math.min(total, p + 1))} disabled={page === total}
        className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-30 transition"
      >
        ถัดไป →
      </button>
    </div>
  );
}
