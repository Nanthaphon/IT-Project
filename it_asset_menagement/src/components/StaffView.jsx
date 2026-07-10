import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Star, Sparkles, User, Wrench, RefreshCw, Package, Laptop, ArrowRight, Pencil, Save, X, KeyRound, PlusCircle, Repeat, RotateCcw, ImageIcon, Check, Menu, LogOut, Building2 } from 'lucide-react';
import { useActiveTab } from '../hooks/useActiveTab.js';
import SatisfactionSurveyModal from './SatisfactionSurveyModal.jsx';
import StaffSetPasswordModal from './StaffSetPasswordModal.jsx';
import { e, safeUrl } from '../utils/htmlEscape.js';

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
   พิมพ์ฟอร์มขอเปลี่ยนเครื่อง
════════════════════════════════════════════════ */
function printReplacementForm({ staff, currentStatus, reason, myAssets, damagePhotos = [] }) {
  const logoUrl = getCompanyLogo(staff.company);
  const today = new Date();
  const thDate = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  /* ── คำนวณอายุการใช้งานจากวันที่ซื้อ (เป็น "X ปี Y เดือน") ── */
  const calcUsageAge = (purchaseDateStr) => {
    if (!purchaseDateStr) return '-';
    const pd = new Date(purchaseDateStr);
    if (isNaN(pd.getTime())) return '-';
    const now = today;
    let years = now.getFullYear() - pd.getFullYear();
    let months = now.getMonth() - pd.getMonth();
    if (now.getDate() < pd.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    if (years < 0) return '-'; // ซื้อในอนาคต
    if (years === 0 && months === 0) return 'น้อยกว่า 1 เดือน';
    const parts = [];
    if (years > 0) parts.push(`${years} ปี`);
    if (months > 0) parts.push(`${months} เดือน`);
    return parts.join(' ');
  };

  /* ── format วันที่เป็นภาษาไทย (สั้น) ── */
  const fmtThaiDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  /* ── แสดงสถานะ Warranty (เหลืออายุ / หมดแล้ว) ── */
  const warrantyStatus = (warrantyStr) => {
    if (!warrantyStr) return { date: '-', badge: '', color: '#000' };
    const w = new Date(warrantyStr);
    if (isNaN(w.getTime())) return { date: '-', badge: '', color: '#000' };
    const diffMs = w.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const dateText = fmtThaiDate(warrantyStr);
    if (diffDays < 0) return { date: dateText, badge: 'หมดแล้ว', color: '#b91c1c' };
    if (diffDays <= 30) return { date: dateText, badge: `เหลือ ${diffDays} วัน`, color: '#b45309' };
    return { date: dateText, badge: '', color: '#000' };
  };

  const assetRows = myAssets.length > 0
    ? myAssets.map((item, i) => {
        const ws = warrantyStatus(item.warrantyDate);
        return `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px;color:#000;text-align:center">${i + 1}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px;color:#000">${e(item.name) || '-'}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px;color:#000">${e(item.type) || '-'}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px;color:#000;font-family:monospace">${e(item.sn || item.serialNumber) || '-'}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px;color:#000;font-family:monospace">${e(item.assetTag) || '-'}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px;color:#000;text-align:center;white-space:nowrap">${e(fmtThaiDate(item.purchaseDate))}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px;color:#000;text-align:center;white-space:nowrap;font-weight:600">${e(calcUsageAge(item.purchaseDate))}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 6px;font-size:11px;color:${ws.color};text-align:center;line-height:1.4;font-weight:600">
            <div>${e(ws.date)}</div>
            ${ws.badge ? `<div style="font-size:10px;font-weight:500;margin-top:1px">(${e(ws.badge)})</div>` : ''}
          </td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="8" style="border:1px solid #cbd5e1;padding:10px;text-align:center;color:#64748b;font-size:12px">ไม่มีทรัพย์สินหลักในชื่อพนักงาน</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <title>ฟอร์มขอเปลี่ยนเครื่อง - ${e(staff.fullName)}</title>
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

  <!-- Header with company logo + title + date (compact one-line layout) -->
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px">
    <img src="${safeUrl(logoUrl)}" alt="logo" style="height:54px;width:auto;object-fit:contain;flex-shrink:0" />
    <div style="flex:1;text-align:center">
      <div style="font-size:18px;font-weight:700;color:#1E487A;line-height:1.1">ฟอร์มขอเปลี่ยนเครื่องคอมพิวเตอร์</div>
      <div style="font-size:11px;color:#000;margin-top:2px">Computer Replacement Request Form</div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:9.5px;color:#475569">วันที่ยื่นคำขอ</div>
      <div style="font-size:11px;font-weight:700;color:#000">${thDate}</div>
    </div>
  </div>
  <div style="border-top:2px solid #1E487A;margin-bottom:10px"></div>

  <!-- ข้อมูลพนักงาน -->
  <div style="font-size:12px;font-weight:700;color:#1E487A;margin-bottom:5px;display:flex;align-items:center;gap:5px">
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
    ข้อมูลผู้ยื่นคำขอ
  </div>
  <div style="border:1px solid #cbd5e1;border-radius:5px;padding:8px 12px;margin-bottom:10px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px">
      <div>
        <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">ชื่อ-นามสกุล</div>
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${e(staff.fullName) || '-'}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">รหัสพนักงาน</div>
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${e(staff.empId) || '-'}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">แผนก</div>
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${e(staff.department) || '-'}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">ตำแหน่ง</div>
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${e(staff.position) || '-'}</div>
      </div>
      <div style="grid-column:1 / -1">
        <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">หัวหน้างาน / ผู้บังคับบัญชา</div>
        <div style="font-size:13px;font-weight:700;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px">${e(staff.manager) || '-'}</div>
      </div>
    </div>
  </div>

  <!-- เครื่องที่ถือครองปัจจุบัน -->
  <div style="font-size:12px;font-weight:700;color:#1E487A;margin-bottom:5px;display:flex;align-items:center;gap:5px">
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
    ทรัพย์สินที่ถือครองปัจจุบัน
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:10px;table-layout:fixed">
    <thead>
      <tr>
        <th style="border:1px solid #94a3b8;padding:6px 4px;background:#e2e8f0;font-size:10.5px;font-weight:700;color:#000;text-align:center;width:24px">#</th>
        <th style="border:1px solid #94a3b8;padding:6px 6px;background:#e2e8f0;font-size:10.5px;font-weight:700;color:#000;text-align:center">ชื่ออุปกรณ์</th>
        <th style="border:1px solid #94a3b8;padding:6px 6px;background:#e2e8f0;font-size:10.5px;font-weight:700;color:#000;text-align:center;width:62px">ประเภท</th>
        <th style="border:1px solid #94a3b8;padding:6px 6px;background:#e2e8f0;font-size:10.5px;font-weight:700;color:#000;text-align:center;width:90px">Serial Number</th>
        <th style="border:1px solid #94a3b8;padding:6px 6px;background:#e2e8f0;font-size:10.5px;font-weight:700;color:#000;text-align:center;width:92px">รหัสทรัพย์สิน</th>
        <th style="border:1px solid #94a3b8;padding:6px 6px;background:#e2e8f0;font-size:10.5px;font-weight:700;color:#000;text-align:center;width:72px">วันที่ซื้อ</th>
        <th style="border:1px solid #94a3b8;padding:6px 6px;background:#e2e8f0;font-size:10.5px;font-weight:700;color:#000;text-align:center;width:78px">อายุการใช้งาน</th>
        <th style="border:1px solid #94a3b8;padding:6px 6px;background:#e2e8f0;font-size:10.5px;font-weight:700;color:#000;text-align:center;width:96px">วันหมด Warranty</th>
      </tr>
    </thead>
    <tbody>${assetRows}</tbody>
  </table>

  <!-- เหตุผลขอเปลี่ยน -->
  <div style="font-size:12px;font-weight:700;color:#1E487A;margin-bottom:5px;display:flex;align-items:center;gap:5px">
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    เหตุผลและรายละเอียดการขอเปลี่ยน
  </div>
  <div style="border:1px solid #cbd5e1;border-radius:5px;padding:8px 12px;margin-bottom:10px">
    <div style="margin-bottom:6px">
      <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:3px">สถานะเครื่องปัจจุบัน</div>
      <div style="font-size:13px;font-weight:700;color:#000">${e(currentStatus)}</div>
    </div>
    <div>
      <div style="font-size:11px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:3px">รายละเอียด / เหตุผล</div>
      <div style="font-size:13px;color:#000;line-height:1.7;min-height:40px;white-space:pre-wrap">${e(reason)}</div>
    </div>
  </div>

  ${damagePhotos.length > 0 ? `
  <!-- รูปสภาพเครื่องชำรุด -->
  <div style="font-size:12px;font-weight:700;color:#1E487A;margin-bottom:5px;display:flex;align-items:center;gap:5px">
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
    </svg>
    หลักฐานสภาพเครื่องชำรุด / เสียหาย (${damagePhotos.length} รูป)
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
    ${damagePhotos.map((p, i) => `
      <div style="border:1px solid #cbd5e1;border-radius:4px;padding:4px;background:#fff;page-break-inside:avoid">
        <div style="position:relative;width:100%;padding-top:75%;background:#f1f5f9;border-radius:3px;overflow:hidden">
          <img src="${p.data}" alt="รูปที่ ${i + 1}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain" />
        </div>
        <div style="font-size:9.5px;color:#000;margin-top:3px;text-align:center;font-weight:600">รูปที่ ${i + 1}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- เงื่อนไข -->
  <div style="font-size:12px;font-weight:700;color:#000;margin-bottom:4px">เงื่อนไขและข้อตกลง</div>
  <div style="font-size:11px;color:#000;line-height:1.7;margin-bottom:10px">
    <div>1. ผู้ยื่นคำขอยืนยันว่าข้อมูลที่กรอกทั้งหมดเป็นความจริง</div>
    <div>2. เครื่องเดิมที่ส่งคืนต้องอยู่ในสภาพสมบูรณ์ที่สุดเท่าที่จะทำได้</div>
    <div>3. การอนุมัติขึ้นอยู่กับดุลยพินิจของหัวหน้างานและฝ่าย IT</div>
    <div>4. ต้องผ่านการอนุมัติจากหัวหน้าแผนกก่อนนำมายื่นฝ่าย IT</div>
  </div>

  <!-- ลายเซ็น 3 ช่อง + footer (เก็บอยู่กลุ่มเดียวกัน ไม่ตกหน้า) -->
  <div style="page-break-inside:avoid">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
      <div style="border:1px solid #000;border-radius:5px;padding:8px 10px;text-align:center">
        <div style="font-size:12px;font-weight:700;color:#000;margin-bottom:3px">ผู้ยื่นคำขอ (พนักงาน)</div>
        <div style="border-bottom:1px solid #000;margin:26px 6px 6px"></div>
        <div style="font-size:12px;font-weight:700;color:#000">(${e(staff.fullName)})</div>
        <div style="font-size:11px;color:#000;margin-top:1px">${e(staff.position) || '............................'}</div>
        <div style="font-size:11px;color:#000;margin-top:3px">วันที่ ............................</div>
      </div>
      <div style="border:1px solid #000;border-radius:5px;padding:8px 10px;text-align:center">
        <div style="font-size:12px;font-weight:700;color:#000;margin-bottom:3px">หัวหน้าแผนก (ผู้อนุมัติ)</div>
        <div style="border-bottom:1px solid #000;margin:26px 6px 6px"></div>
        <div style="font-size:12px;font-weight:700;color:#000">(${e(staff.manager) || '............................'})</div>
        <div style="font-size:11px;color:#000;margin-top:1px">หัวหน้าแผนก ${e(staff.department) || ''}</div>
        <div style="font-size:11px;color:#000;margin-top:3px">วันที่ ............................</div>
      </div>
      <div style="border:1px solid #000;border-radius:5px;padding:8px 10px;text-align:center">
        <div style="font-size:12px;font-weight:700;color:#000;margin-bottom:3px">เจ้าหน้าที่ IT (รับเรื่อง)</div>
        <div style="border-bottom:1px solid #000;margin:26px 6px 6px"></div>
        <div style="font-size:12px;font-weight:700;color:#000">(.............................)</div>
        <div style="font-size:11px;color:#000;margin-top:1px">เจ้าหน้าที่ IT</div>
        <div style="font-size:11px;color:#000;margin-top:3px">วันที่ ............................</div>
      </div>
    </div>

    <div style="text-align:center;font-size:9.5px;color:#64748b;margin-top:6px">
      ออกโดยระบบ IT Asset Management · ${thDate}
    </div>
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
  handleLogout,
  staffMustChangePassword, setStaffMustChangePassword,
  staffRepairForm, setStaffRepairForm, handleSubmitRepairRequest, repairRequests, editStaffRepairModal, setEditStaffRepairModal, handleStaffUpdateRepair, handleStaffDeleteRepair,
  officeSupplies = [], supplyRequests = [], handleStaffSubmitSupplyRequest,
  assets = [], accessories = [], licenses = [],
  replacementRequests = [], handleStaffSubmitReplacement,
  accessoryRequests = [], handleStaffSubmitAccessoryRequest,
  handleSubmitEvaluation,
  handleStaffUpdateProfile,
}) {
  const [showM365Password, setShowM365Password] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ── Force change password state (legacy — flag จาก admin reset) ──
  const [changePwd, setChangePwd] = useState({ current: '', next: '', confirm: '' });
  const [changeError, setChangeError] = useState('');
  const [changeSubmitting, setChangeSubmitting] = useState(false);

  // ── Set password modal (optional — staff เลือกตั้งรหัสผ่านเองได้) ──
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [setPwdToast, setSetPwdToast] = useState('');

  const handleForceChangePassword = async (e) => {
    e.preventDefault();
    setChangeError('');
    if (changePwd.next.length < 6) { setChangeError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (changePwd.next !== changePwd.confirm) { setChangeError('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return; }
    if (changePwd.next === changePwd.current) { setChangeError('รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม'); return; }
    setChangeSubmitting(true);
    try {
      const { auth, VERCEL_API_BASE } = await import('../firebase.js');
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Session หมดอายุ — กรุณา login ใหม่');
      const resp = await fetch(`${VERCEL_API_BASE}/api/staff-change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          currentPassword: changePwd.current,
          newPassword: changePwd.next,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      setChangePwd({ current: '', next: '', confirm: '' });
      setStaffMustChangePassword?.(false);
    } catch (err) {
      setChangeError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setChangeSubmitting(false);
    }
  };
  /* ── satisfaction survey state ── */
  const [surveyModal, setSurveyModal] = useState({ isOpen: false, repair: null });
  const [autoPopupShown, setAutoPopupShown] = useState(false);
  const isActiveTab = useActiveTab(); // 🆕 กัน auto-popup เด้งซ้ำหลายแท็บ
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobile drawer
  const [supplyCart, setSupplyCart] = useState([]);
  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  const [isSupplyDropdownOpen, setIsSupplyDropdownOpen] = useState(false);
  const supplyDropdownRef = useRef(null);

  const [isSubmittingRepair, setIsSubmittingRepair] = useState(false);
  const [isSubmittingSupply, setIsSubmittingSupply] = useState(false);

  const [replaceStatusForm, setReplaceStatusForm] = useState('เครื่องช้า / ค้างบ่อย');
  const [replaceReasonForm, setReplaceReasonForm] = useState('');
  const [replaceDamagePhotos, setReplaceDamagePhotos] = useState([]); // [{ name, data (base64) }]
  const [isUploadingDamagePhoto, setIsUploadingDamagePhoto] = useState(false);
  const [isSubmittingReplace, setIsSubmittingReplace] = useState(false);

  const handleDamagePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';
    if (replaceDamagePhotos.length + files.length > 6) {
      alert('แนบรูปได้สูงสุด 6 รูป (ตอนนี้มี ' + replaceDamagePhotos.length + ' รูปแล้ว)');
      return;
    }
    const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      alert('ไฟล์ใหญ่เกิน 10MB: ' + oversized.map(f => f.name).join(', '));
      return;
    }
    setIsUploadingDamagePhoto(true);
    try {
      const { compressImage } = await import('../utils/compressImage.js');
      const compressed = await Promise.all(files.map(async (f) => ({
        name: f.name,
        data: await compressImage(f, { maxDim: 1000, quality: 0.7 }),
      })));
      setReplaceDamagePhotos(prev => [...prev, ...compressed]);
    } catch (err) {
      alert('แนบรูปไม่สำเร็จ: ' + err.message);
    } finally {
      setIsUploadingDamagePhoto(false);
    }
  };

  const handleRemoveDamagePhoto = (idx) => {
    setReplaceDamagePhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const [repairPage, setRepairPage] = useState(1);
  const [supplyPage, setSupplyPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const [rememberMe, setRememberMe] = useState(true);  // default = true (จดจำตลอด)

  /* ── Edit profile state ── */
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const startEditProfile = () => {
    // ❗ ไม่รวม manager — admin จัดการเท่านั้น
    setProfileForm({
      fullName:     currentStaff.fullName     || '',
      fullNameEng:  currentStaff.fullNameEng  || '',
      nickname:     currentStaff.nickname     || '',
      position:     currentStaff.position     || '',
      department:   currentStaff.department   || '',
      company:      currentStaff.company      || '',
      phone:        currentStaff.phone        || '',
      m365Email:    currentStaff.m365Email    || '',
      m365Password: currentStaff.m365Password || '',
    });
    setIsEditingProfile(true);
  };

  const cancelEditProfile = () => {
    setIsEditingProfile(false);
    setProfileForm({});
  };

  const saveProfile = async () => {
    if (!handleStaffUpdateProfile) return;
    setIsSavingProfile(true);
    try {
      await handleStaffUpdateProfile(profileForm);
      setIsEditingProfile(false);
    } catch (e) {
      // alert already shown by handler
    } finally {
      setIsSavingProfile(false);
    }
  };

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
          // จดจำตลอด — ไม่มี expiry (รองรับข้อมูลเก่าที่มี expiry ด้วย)
          if (!parsed.expiry || Date.now() < parsed.expiry) {
            setStaffEmpIdInput(parsed.empId || '');
            // ถอดรหัส password เก่า (base64 encode/decode — กัน shoulder-surfing เบื้องต้น)
            if (parsed.password) {
              try { setStaffPasswordInput(atob(parsed.password)); }
              catch { /* ignore */ }
            }
            setRememberMe(true);
          }
        } catch (e) {
          console.error('Error parsing stored login', e);
        }
      }
    }
  }, [currentStaff, setStaffEmpIdInput, setStaffPasswordInput]);

  // 🆕 hard-lock: กรองอุปกรณ์ตามบริษัทของพนักงานเสมอ (ไม่ให้เลือกเปลี่ยน)
  //    ถ้าพนักงานไม่ระบุบริษัท → แสดงทั้งหมด (fallback)
  const staffCompany = (currentStaff?.company || '').trim();

  const filteredSupplies = officeSupplies.filter(supply => {
    const matchName = supply.name?.toLowerCase().includes(supplySearchTerm.toLowerCase());
    if (!staffCompany) return matchName; // ไม่มีบริษัท → ไม่กรอง
    const company = (supply.company || '').trim();
    return matchName && company === staffCompany;
  });

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
        await handleStaffSubmitSupplyRequest(item.supplyId, item.name, item.quantity, item.note, item.company || '');
      }
      setSupplyCart([]); setSupplySearchTerm(''); setSupplyPage(1);
    } finally { setIsSubmittingSupply(false); }
  };

  const onReplacementSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReplace(true);
    try {
      if (handleStaffSubmitReplacement) {
        await handleStaffSubmitReplacement(replaceStatusForm, replaceReasonForm, replaceDamagePhotos);
        // พิมพ์ฟอร์มหลังบันทึกสำเร็จ
        const myAssets = assets.filter(item => item.assignedTo === currentStaff?.id);
        printReplacementForm({
          staff: currentStaff,
          currentStatus: replaceStatusForm,
          reason: replaceReasonForm,
          myAssets,
          damagePhotos: replaceDamagePhotos,
        });
        setReplaceStatusForm('เครื่องช้า / ค้างบ่อย');
        setReplaceReasonForm('');
        setReplaceDamagePhotos([]);
      }
    } finally {
      setIsSubmittingReplace(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (rememberMe) {
      // จดจำตลอด — encode password เบา ๆ (base64) กัน plaintext ใน localStorage
      localStorage.setItem('staffRemember', JSON.stringify({
        empId: staffEmpIdInput,
        password: btoa(staffPasswordInput || ''),
      }));
    } else {
      localStorage.removeItem('staffRemember');
    }
    setIsLoggingIn(true);
    try {
      await handleStaffLogin(e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const getMyAssets = () => {
    if (!currentStaff) return [];
    const empAssets = assets.filter(item => item.assignedTo === currentStaff.id);
    // แสดงเฉพาะ License ที่ assign ให้พนักงานโดยตรง
    // License ที่ผูกกับเครื่อง (device-bound) ให้ตามเครื่องไป — ไม่แสดงในครอบครอง
    const empLicenses = licenses.filter(item =>
      (item.assignees || []).some(a =>
        a.empId === currentStaff.id && !a.isAssetBound && !a.assignedAssetId
      )
    );
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
  const myAccessoryReqs = (accessoryRequests || []).filter(req => req.empId === currentStaff?.empId);

  /* ── repairs ที่ซ่อมเสร็จและรอประเมิน ── */
  const pendingEvaluations = myRequests.filter(
    req => req.status === 'ซ่อมเสร็จสิ้น' && !req.evaluation
  );

  /* ── auto-popup ครั้งแรก/session ── */
  useEffect(() => {
    if (autoPopupShown) return;
    if (!currentStaff) return;
    if (pendingEvaluations.length === 0) return;
    if (!isActiveTab) return; // 🆕 เด้งเฉพาะแท็บที่ active เท่านั้น
    // เด้งหลัง 800ms ให้ผู้ใช้ตั้งตัวก่อน
    const t = setTimeout(() => {
      setSurveyModal({ isOpen: true, repair: pendingEvaluations[0] });
      setAutoPopupShown(true);
    }, 800);
    return () => clearTimeout(t);
  }, [currentStaff, pendingEvaluations, autoPopupShown, isActiveTab]);

  const totalRepairPages = Math.ceil(myRequests.length / ITEMS_PER_PAGE);
  const currentRepairRequests = myRequests.slice((repairPage - 1) * ITEMS_PER_PAGE, repairPage * ITEMS_PER_PAGE);
  const totalSupplyPages = Math.ceil(mySupplyReqs.length / ITEMS_PER_PAGE);
  const currentSupplyRequests = mySupplyReqs.slice((supplyPage - 1) * ITEMS_PER_PAGE, supplyPage * ITEMS_PER_PAGE);

  const tabs = [
    { id: 'profile',           label: 'ข้อมูลของฉัน',     icon: User },
    { id: 'it_repair',         label: 'แจ้งปัญหา IT',     icon: Wrench,   count: myRequests.length,         color: 'rose' },
    { id: 'replacement',       label: 'ขอเปลี่ยนเครื่อง',  icon: RefreshCw, count: myReplacementReqs.length, color: 'amber' },
    { id: 'office_supplies',   label: 'เบิกอุปกรณ์ สนง.',   icon: Package,  count: mySupplyReqs.length,       color: 'emerald' },
    { id: 'accessory_request', label: 'ขออุปกรณ์เสริม',    icon: Sparkles, count: myAccessoryReqs.length,    color: 'cyan' },
    { id: 'my_assets',         label: 'ทรัพย์สินของฉัน',   icon: Laptop,   count: myAssetsList.length,       color: 'blue' },
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-[#1E487A]">
              <img src="/gb_icon.svg" alt="Logo" className="w-7 h-7 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <h1 className="text-[21px] font-semibold text-[#1E487A] tracking-tight">พนักงานทั่วไป</h1>
            <p className="text-[14px] text-slate-500 mt-1">ระบบจัดการทรัพย์สิน IT</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-7">
            <h2 className="text-[16px] font-semibold text-slate-800 mb-2 tracking-tight">เข้าสู่ระบบ</h2>
            <p className="text-[12.5px] text-slate-500 mb-5 leading-relaxed">
              💡 รหัสผ่านเริ่มต้น = <span className="font-semibold text-[#1E487A]">รหัสพนักงาน</span> ของคุณ — เปลี่ยนรหัสเองได้ภายในระบบ
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>รหัสพนักงาน</label>
                <input
                  type="text" value={staffEmpIdInput} onChange={e => setStaffEmpIdInput(e.target.value)}
                  className={inputCls} placeholder="เช่น EMP001" required autoFocus
                />
              </div>
              <div>
                <label className={labelCls}>รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={staffPasswordInput}
                    onChange={e => setStaffPasswordInput(e.target.value)}
                    className={`${inputCls} pr-10`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                    aria-label={showLoginPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showLoginPassword
                      ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.7 10.7a2.5 2.5 0 003.6 3.6M9.9 5.1A9.7 9.7 0 0112 5c4.4 0 8 3.5 9.4 7-.3.7-.8 1.7-1.5 2.7M6.4 6.4C4.4 7.9 2.9 10.2 2.6 12c1.4 3.5 5 7 9.4 7 1.4 0 2.8-.4 4-1"/></svg>
                      : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]" />
                <span className="text-[14px] text-slate-500">จดจำการเข้าสู่ระบบ</span>
              </label>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-[#1E487A] hover:bg-[#163963] text-white text-[14.5px] font-semibold rounded-lg transition-colors shadow-sm mt-1 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ boxShadow: '0 4px 14px rgba(30,72,122,0.25)' }}
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : 'เข้าสู่ระบบ'}
              </button>
            </form>
          </div>

          <button
            onClick={() => { setAuthRole(null); setStaffEmpIdInput(''); setStaffPasswordInput?.(''); }}
            className="w-full mt-5 text-[14px] text-slate-500 hover:text-[#1E487A] transition-colors text-center inline-flex items-center justify-center gap-1.5"
          >
            ← กลับไปหน้าเลือกบทบาท
          </button>
        </div>
      </div>
    );
  }

  /* ========================================
     FORCE CHANGE PASSWORD — legacy flow (เผื่อ admin reset แล้วยังตั้ง flag ไว้)
     ปกติ default จะไม่บังคับ — staff เลือกตั้งรหัสผ่านเองได้ในเมนู "จัดการรหัสผ่าน"
  ======================================== */
  if (staffMustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-amber-500">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-[21px] font-semibold text-slate-800 tracking-tight">ตั้งรหัสผ่านใหม่</h1>
            <p className="text-[13.5px] text-slate-500 mt-1.5 text-center px-4 leading-relaxed">
              สวัสดี <span className="font-semibold text-[#1E487A]">{currentStaff?.fullName}</span> —<br />
              กรุณาตั้งรหัสผ่านส่วนตัวเพื่อความปลอดภัย (เข้าใช้ครั้งแรก)
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-7">
            <form onSubmit={handleForceChangePassword} className="space-y-4">
              <div>
                <label className={labelCls}>รหัสผ่านเดิม</label>
                <input type="password" value={changePwd.current}
                  onChange={e => setChangePwd(p => ({ ...p, current: e.target.value }))}
                  className={inputCls} placeholder="รหัสพนักงานของคุณ (ครั้งแรก)" required autoFocus />
              </div>
              <div>
                <label className={labelCls}>รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)</label>
                <input type="password" value={changePwd.next}
                  onChange={e => setChangePwd(p => ({ ...p, next: e.target.value }))}
                  className={inputCls} placeholder="••••••••" required minLength={6} />
              </div>
              <div>
                <label className={labelCls}>ยืนยันรหัสผ่านใหม่</label>
                <input type="password" value={changePwd.confirm}
                  onChange={e => setChangePwd(p => ({ ...p, confirm: e.target.value }))}
                  className={inputCls} placeholder="พิมพ์รหัสผ่านอีกครั้ง" required minLength={6} />
              </div>
              {changeError && (
                <div className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {changeError}
                </div>
              )}
              <button type="submit" disabled={changeSubmitting}
                className="w-full py-3 bg-[#1E487A] hover:bg-[#163963] text-white text-[14.5px] font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                style={{ boxShadow: '0 4px 14px rgba(30,72,122,0.25)' }}>
                {changeSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : 'ตั้งรหัสผ่านใหม่'}
              </button>
              <button type="button" onClick={() => (handleLogout || (() => { setAuthRole(null); setCurrentStaff(null); }))()}
                className="w-full text-[13px] text-slate-500 hover:text-rose-600 transition-colors text-center">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================
     MAIN STAFF PORTAL
  ======================================== */
  const activeTabInfo = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Toast ── */}
      {setPwdToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-4 py-2.5 rounded-md font-medium text-[13.5px]">
          ✓ {setPwdToast}
        </div>
      )}

      {/* ── Set password modal ── */}
      <StaffSetPasswordModal
        isOpen={showSetPasswordModal}
        onClose={() => setShowSetPasswordModal(false)}
        empId={currentStaff?.empId || ''}
        vercelApiBase={(() => { try { return new URL(window.location.href).hostname.endsWith('.web.app') ? 'https://itassetmenagement.vercel.app' : ''; } catch { return ''; } })()}
        getIdToken={async () => {
          const { auth } = await import('../firebase.js');
          return auth.currentUser?.getIdToken();
        }}
        onSuccess={(msg) => {
          setSetPwdToast(msg);
          setTimeout(() => setSetPwdToast(''), 4500);
        }}
      />

      {/* ─────────────────────────────────────────────────────
          📐 Layout = Sidebar (left) + Main (right)
      ───────────────────────────────────────────────────── */}

      {/* ── Sidebar Overlay (mobile only) ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (White minimal — modern SaaS) ── */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>

        {/* Brand */}
        <div className="px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E487A] flex items-center justify-center shrink-0">
              <img src="/gb_icon.svg" alt="Logo" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <p className="text-[15px] font-semibold text-slate-900 tracking-tight">ระบบพนักงาน</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13.5px] rounded-lg transition-colors relative ${
                  isActive
                    ? 'bg-[#1E487A]/8 text-[#1E487A] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                {/* Active left bar indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#1E487A]" />
                )}
                {Icon && <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />}
                <span className="flex-1 text-left truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-3 mt-2 border-t border-slate-100 space-y-0.5">
          <button
            onClick={() => setShowSetPasswordModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <KeyRound className="h-[16px] w-[16px] shrink-0 text-slate-400" strokeWidth={1.8} />
            จัดการรหัสผ่าน
          </button>
          <button
            onClick={() => { (handleLogout || (() => { setAuthRole(null); setCurrentStaff(null); setStaffEmpIdInput(''); setStaffPasswordInput?.(''); }))(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="h-[16px] w-[16px] shrink-0" strokeWidth={1.8} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* ── Main content (with left padding for sidebar) ── */}
      <div className="lg:pl-64">

        {/* Top bar (mobile only — hamburger + current page) */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="h-6 w-6" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-slate-800 truncate">
              {activeTabInfo?.label || 'ระบบพนักงาน'}
            </p>
          </div>
        </div>

        {/* Page header (desktop) */}
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30">
          <p className="text-[18px] font-semibold text-slate-800 leading-tight tracking-tight">{activeTabInfo?.label}</p>
        </div>

        <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 space-y-4 max-w-[1400px] mx-auto">

        {/* ==================== TAB: ข้อมูลของฉัน ==================== */}
        {activeTab === 'profile' && (
          <>
          {/* ── Hero card ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1E487A] flex items-center justify-center text-white font-semibold text-[28px] sm:text-[32px] shrink-0">
                {currentStaff.fullName?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] sm:text-[19px] font-semibold text-slate-900 leading-tight break-words">
                  {currentStaff.fullName}
                  {currentStaff.nickname && (
                    <span className="text-slate-500 font-normal text-[15px] sm:text-[17px] ml-1">({currentStaff.nickname})</span>
                  )}
                </p>
                <p className="text-[13px] sm:text-[14px] text-slate-600 mt-1">
                  {currentStaff.position || '—'}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[12px] text-slate-500">
                  <span className="font-mono font-semibold text-slate-700">{currentStaff.empId}</span>
                  {currentStaff.department && <><span>·</span><span>{currentStaff.department}</span></>}
                  {currentStaff.company && <><span>·</span><span>{currentStaff.company}</span></>}
                </div>
              </div>
              <div className="w-full sm:w-auto sm:shrink-0">
                {!isEditingProfile ? (
                  <button
                    onClick={startEditProfile}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-[#1E487A] bg-[#1E487A]/8 hover:bg-[#1E487A]/15 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
                    แก้ไขข้อมูล
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={cancelEditProfile}
                      disabled={isSavingProfile}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.2} /> ยกเลิก
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={isSavingProfile}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-[#1E487A] hover:bg-[#163963] disabled:opacity-60"
                    >
                      {isSavingProfile
                        ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> กำลังบันทึก...</>
                        : <><Save className="h-3.5 w-3.5" strokeWidth={2.2} /> บันทึก</>
                      }
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── ข้อมูลทั่วไป ── */}
          {isEditingProfile ? (
            /* ── EDIT MODE — แสดงทุกฟิลด์เพื่อแก้ไข ── */
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 p-5">
                <EditableItem label="ชื่อ-นามสกุล (TH)"  name="fullName"     editing form={profileForm} setForm={setProfileForm} value={currentStaff.fullName} />
                <EditableItem label="ชื่อ-นามสกุล (EN)"  name="fullNameEng"  editing form={profileForm} setForm={setProfileForm} value={currentStaff.fullNameEng} />
                <EditableItem label="ชื่อเล่น"           name="nickname"     editing form={profileForm} setForm={setProfileForm} value={currentStaff.nickname} />
                <EditableItem label="ตำแหน่ง"           name="position"     editing form={profileForm} setForm={setProfileForm} value={currentStaff.position} />
                <EditableItem label="แผนก"              name="department"   editing form={profileForm} setForm={setProfileForm} value={currentStaff.department} />
                <EditableItem label="บริษัท"            name="company"      editing form={profileForm} setForm={setProfileForm} value={currentStaff.company} />
                <EditableItem label="เบอร์โทรศัพท์"     name="phone"        editing form={profileForm} setForm={setProfileForm} value={currentStaff.phone} />
                <EditableItem label="อีเมล Microsoft 365" name="m365Email"   editing form={profileForm} setForm={setProfileForm} value={currentStaff.m365Email} accent />
                <EditableItem label="รหัสผ่าน Microsoft 365" name="m365Password" editing form={profileForm} setForm={setProfileForm} value={currentStaff.m365Password} mono />
              </div>
            </div>
          ) : (
            /* ── VIEW MODE — ไม่ซ้ำกับ Hero card; แสดงเฉพาะข้อมูลที่ยังไม่มีบน hero ── */
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-slate-100">
                <CompactItem label="ชื่อ (EN)"       value={currentStaff.fullNameEng} />
                <CompactItem label="เบอร์โทรศัพท์"    value={currentStaff.phone} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-slate-100">
                <CompactItem label="หัวหน้างาน"      value={currentStaff.manager} />
                <CompactItem label="Microsoft 365"   value={currentStaff.m365Email} accent />
              </div>
              {currentStaff.m365Password && (
                <div className="px-5 py-3.5">
                  <CompactPassword label="รหัสผ่าน Microsoft 365" value={currentStaff.m365Password} show={showM365Password} setShow={setShowM365Password} />
                </div>
              )}
            </div>
          )}

          </>
        )}

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
                        <Th center>ประเมิน</Th>
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
                            <EvaluationCell req={req} onOpen={() => setSurveyModal({ isOpen: true, repair: req })} />
                          </td>
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
                              <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">ล็อคแล้ว</span>
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

                {/* ── รูปสภาพเครื่องชำรุด ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls + ' mb-0'}>
                      รูปสภาพเครื่องชำรุด <span className="text-slate-400 text-[11px] font-normal normal-case">(ไม่บังคับ · สูงสุด 6 รูป)</span>
                    </label>
                    {replaceDamagePhotos.length > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200 px-1.5 py-0.5 rounded">
                        {replaceDamagePhotos.length}/6
                      </span>
                    )}
                  </div>

                  {/* Photo grid */}
                  {replaceDamagePhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {replaceDamagePhotos.map((p, i) => (
                        <div key={i} className="relative group/photo aspect-square rounded-lg overflow-hidden ring-1 ring-slate-200 bg-slate-50">
                          <img src={p.data} alt={p.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveDamagePhoto(i)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs hover:bg-rose-600 transition-colors flex items-center justify-center"
                            title="ลบรูปนี้"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  {replaceDamagePhotos.length < 6 && (
                    <label className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-[13px] font-semibold ${
                      isUploadingDamagePhoto
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'text-[#1E487A] bg-white border border-dashed border-blue-300 hover:border-[#1E487A] hover:bg-blue-50'
                    }`}>
                      {isUploadingDamagePhoto ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-blue-200 border-t-[#1E487A] rounded-full animate-spin" />
                          กำลังประมวลผลรูป...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          เพิ่มรูปสภาพเครื่อง
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        onChange={handleDamagePhotoUpload}
                        disabled={isUploadingDamagePhoto}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    💡 ถ่ายรูปจุดที่ชำรุด จอ คีย์บอร์ด หรือส่วนที่เสียหาย — รูปจะถูกใส่ลงในฟอร์ม PDF
                  </p>
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
                                myAssets: assets.filter(a => a.assignedTo === currentStaff?.id),
                                damagePhotos: req.damagePhotos || [],
                              })}
                              title="พิมพ์ฟอร์มซ้ำ"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-100 hover:border-blue-600 px-2.5 py-1.5 rounded-lg transition-colors"
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
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">

            {/* ─── LEFT: Catalog ─── */}
            <div className="space-y-5">
              {/* Search bar + Company filter */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="ค้นหาอุปกรณ์..."
                    value={supplySearchTerm}
                    onChange={e => setSupplySearchTerm(e.target.value)}
                    className="w-full bg-transparent pl-10 pr-3 py-2 text-[14px] focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* 🆕 บอกบริษัทที่พนักงานสังกัด (fixed — ไม่ให้เลือกเปลี่ยน) */}
                {staffCompany && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    <Building2 className="h-3 w-3 text-[#1E487A] shrink-0" strokeWidth={2.4} />
                    <span>อุปกรณ์ของ</span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#1E487A] bg-blue-50 px-2 py-0.5 rounded-full ring-1 ring-blue-100">
                      {staffCompany}
                    </span>
                    <span className="text-slate-400">· {filteredSupplies.length} รายการ</span>
                  </div>
                )}
              </div>

              {/* Grid catalog */}
              {filteredSupplies.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
                  <Package className="h-10 w-10 mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
                  <p className="text-[13px] text-slate-500">
                    {supplySearchTerm ? 'ไม่พบอุปกรณ์ที่ค้นหา' : 'ยังไม่มีอุปกรณ์ในระบบ'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredSupplies.map(item => {
                    const inCart = supplyCart.some(c => c.supplyId === item.id);
                    const isOut  = item.quantity <= 0;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isOut}
                        onClick={() => {
                          if (inCart) {
                            setSupplyCart(supplyCart.filter(c => c.supplyId !== item.id));
                          } else if (!isOut) {
                            setSupplyCart([...supplyCart, { supplyId: item.id, name: item.name, maxQty: item.quantity, image: item.image, unit: item.unit, company: item.company || '', quantity: 1, note: '' }]);
                          }
                        }}
                        className={`text-left rounded-xl border transition-colors overflow-hidden bg-white ${
                          isOut
                            ? 'border-slate-200 opacity-50 cursor-not-allowed'
                            : inCart
                              ? 'border-[#1E487A] ring-1 ring-[#1E487A]/20'
                              : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="relative aspect-square bg-slate-50 flex items-center justify-center">
                          {item.image
                            ? <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" loading="lazy" />
                            : <Package className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
                          }
                          {inCart && (
                            <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#1E487A] text-white flex items-center justify-center shadow-sm">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                          )}
                          <span className={`absolute top-2 right-2 text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${
                            isOut
                              ? 'bg-rose-100 text-rose-700'
                              : item.quantity <= 5
                                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                          }`}>
                            {isOut ? 'หมด' : `เหลือ ${item.quantity}`}
                          </span>
                        </div>
                        <div className="p-3 border-t border-slate-100">
                          <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{item.name}</p>
                          {item.company ? (
                            <p className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#1E487A] bg-blue-50 px-1.5 py-0.5 rounded mt-1 max-w-full">
                              <Building2 className="h-2.5 w-2.5 shrink-0" strokeWidth={2.4} />
                              <span className="truncate">{item.company}</span>
                            </p>
                          ) : (
                            <p className="text-[10.5px] text-slate-400 italic mt-1">ไม่ระบุบริษัท</p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.unit || 'ชิ้น'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* History */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                  <p className="text-[14px] font-semibold text-slate-800">ประวัติคำขอ</p>
                  {totalSupplyPages > 1 && <span className="text-[11.5px] text-slate-400">หน้า {supplyPage} / {totalSupplyPages}</span>}
                </div>

                {currentSupplyRequests.length === 0 ? (
                  <div className="py-12 text-center text-[13px] text-slate-400">ยังไม่มีประวัติการเบิก</div>
                ) : (
                  <>
                    <div className="divide-y divide-slate-100">
                      {currentSupplyRequests.map(req => (
                        <div key={req.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-semibold text-slate-800 truncate">{req.supplyName}</p>
                            <p className="text-[11.5px] text-slate-400 mt-0.5">
                              {new Date(req.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <span className="text-[13px] font-semibold text-[#1E487A] tabular-nums">× {req.requestedQty}</span>
                          <span className={statusBadge(req.status)}>{req.status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100">
                      <Pagination page={supplyPage} total={totalSupplyPages} onChange={setSupplyPage} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ─── RIGHT: Cart panel (sticky on desktop) ─── */}
            <div className="lg:sticky lg:top-24">
              <form onSubmit={onSupplySubmit} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-[14.5px] font-semibold text-slate-800">รายการที่เลือก</p>
                  {supplyCart.length > 0 && (
                    <span className="text-[12px] font-semibold text-[#1E487A] bg-[#1E487A]/8 px-2 py-0.5 rounded">
                      {supplyCart.length}
                    </span>
                  )}
                </div>

                {supplyCart.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <Package className="h-9 w-9 mx-auto text-slate-300 mb-2" strokeWidth={1.5} />
                    <p className="text-[12.5px] text-slate-400">ยังไม่มีรายการที่เลือก</p>
                    <p className="text-[11px] text-slate-400 mt-1">คลิกที่อุปกรณ์เพื่อเพิ่ม</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                    {supplyCart.map((cartItem, index) => (
                      <div key={cartItem.supplyId} className="px-4 py-3 space-y-2">
                        <div className="flex items-start gap-2.5">
                          {cartItem.image
                            ? <img src={cartItem.image} alt={cartItem.name} className="w-9 h-9 rounded-md object-contain bg-slate-50 p-0.5 border border-slate-200 shrink-0" />
                            : <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shrink-0">📎</div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{cartItem.name}</p>
                            {cartItem.company && (
                              <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1E487A] bg-blue-50 px-1 py-0.5 rounded mt-0.5 max-w-full">
                                <Building2 className="h-2 w-2 shrink-0" strokeWidth={2.4} />
                                <span className="truncate">{cartItem.company}</span>
                              </p>
                            )}
                            <p className="text-[10.5px] text-slate-400 mt-0.5">สูงสุด {cartItem.maxQty} {cartItem.unit || ''}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSupplyCart(supplyCart.filter(c => c.supplyId !== cartItem.supplyId))}
                            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition shrink-0"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 pl-11">
                          <button
                            type="button"
                            onClick={() => { const nc = [...supplyCart]; nc[index].quantity = Math.max(1, Number(nc[index].quantity || 1) - 1); setSupplyCart(nc); }}
                            disabled={Number(cartItem.quantity) <= 1}
                            className="w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-semibold text-[13px]"
                          >−</button>
                          <input
                            type="number" min="1" max={cartItem.maxQty} value={cartItem.quantity}
                            onChange={e => { const nc = [...supplyCart]; nc[index].quantity = e.target.value; setSupplyCart(nc); }}
                            className="w-12 bg-white border border-slate-200 rounded-md px-1 py-1 text-[12.5px] text-center font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30 focus:border-[#1E487A]"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => { const nc = [...supplyCart]; nc[index].quantity = Math.min(nc[index].maxQty, Number(nc[index].quantity || 1) + 1); setSupplyCart(nc); }}
                            disabled={Number(cartItem.quantity) >= cartItem.maxQty}
                            className="w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-semibold text-[13px]"
                          >+</button>
                          <input
                            type="text" value={cartItem.note}
                            onChange={e => { const nc = [...supplyCart]; nc[index].note = e.target.value; setSupplyCart(nc); }}
                            placeholder="หมายเหตุ"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[11.5px] focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30 focus:border-[#1E487A] focus:bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40">
                  <button
                    type="submit"
                    disabled={supplyCart.length === 0 || isSubmittingSupply}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13.5px] font-semibold text-white bg-[#1E487A] hover:bg-[#163963] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingSupply
                      ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> กำลังส่ง...</>
                      : <>ส่งคำขอเบิก{supplyCart.length > 0 ? ` (${supplyCart.length})` : ''}</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== TAB: ขออุปกรณ์เสริม ==================== */}
        {activeTab === 'accessory_request' && (
          <AccessoryRequestSection
            accessories={accessories}
            currentStaff={currentStaff}
            myAccessoryReqs={myAccessoryReqs}
            handleStaffSubmitAccessoryRequest={handleStaffSubmitAccessoryRequest}
          />
        )}

        {/* ==================== TAB: ทรัพย์สินของฉัน ==================== */}
        {activeTab === 'my_assets' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">ทรัพย์สินของคุณ</h3>
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
                    <div key={item.uniqueKey || item.id} className="border border-slate-200 rounded-xl p-4 hover:border-[#1E487A]/30 transition-colors flex flex-col gap-3">
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
                        <span className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{catText}</span>
                        {item.sn && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md truncate max-w-[130px]" title={item.sn}>
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
      </div>

      {/* ==================== Modal: แก้ไขแจ้งปัญหา ==================== */}
      {editStaffRepairModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[80]">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden">
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

      {/* ── Satisfaction Survey Modal ── */}
      <SatisfactionSurveyModal
        isOpen={surveyModal.isOpen}
        onClose={() => setSurveyModal({ isOpen: false, repair: null })}
        repair={surveyModal.repair}
        onSubmit={async (evaluation) => {
          if (!surveyModal.repair) return;
          await handleSubmitEvaluation(surveyModal.repair.id, evaluation);
          setSurveyModal({ isOpen: false, repair: null });
        }}
      />
    </div>
  );
}

/* ─────── EvaluationCell — แสดงปุ่ม/คะแนน ในตาราง ─────── */
function EvaluationCell({ req, onOpen }) {
  // ถ้ายังไม่ซ่อมเสร็จ → ขีดกลาง
  if (req.status !== 'ซ่อมเสร็จสิ้น') {
    return <span className="text-[12px] text-slate-300">—</span>;
  }

  // ประเมินแล้ว → แสดงดาวคะแนน
  if (req.evaluation) {
    const score = Number(req.evaluation.overallRating) || 0;
    const rounded = Math.round(score);
    return (
      <button
        onClick={onOpen}
        title="ดูแบบประเมิน"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 ring-1 ring-amber-200 hover:bg-amber-100 transition cursor-pointer"
      >
        <Star className="h-3 w-3 fill-amber-400 text-amber-400" strokeWidth={1.6} />
        <span className="text-[12.5px] font-bold text-amber-700 tabular-nums">{score.toFixed(2)}</span>
        <span className="text-[11px] text-amber-500/70 font-medium">/{`5`}</span>
      </button>
    );
  }

  // ยังไม่ได้ประเมิน → ปุ่ม
  return (
    <button
      onClick={onOpen}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E487A] hover:bg-[#163963] text-white text-[11.5px] font-bold transition-colors"
    >
      <Sparkles className="h-3 w-3" strokeWidth={2.2} />
      ทำแบบประเมิน
    </button>
  );
}

/* ── Tiny helper components ── */

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="border border-slate-200 rounded-xl overflow-hidden">{children}</div>
    </div>
  );
}

function InfoGrid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2">{children}</div>;
}

function InfoItem({ label, value, accent, mono }) {
  return (
    <div className="flex flex-col px-4 py-3 border-b border-slate-100 last:border-b-0">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</span>
      <span className={`text-sm font-medium ${accent ? 'text-[#1E487A]' : 'text-slate-800'} ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

/* ─────── PasswordRevealItem — show •••• with eye icon ─────── */
function PasswordRevealItem({ label, value, show, setShow }) {
  const hasValue = value && String(value).length > 0;
  const [copied, setCopied] = useState(false);
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
          <button type="button" onClick={() => setShow(s => !s)}
            className="text-slate-400 hover:text-[#1E487A] transition-colors"
            title={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
            {show
              ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.7 10.7a2.5 2.5 0 003.6 3.6M9.9 5.1A9.7 9.7 0 0112 5c4.4 0 8 3.5 9.4 7-.3.7-.8 1.7-1.5 2.7M6.4 6.4C4.4 7.9 2.9 10.2 2.6 12c1.4 3.5 5 7 9.4 7 1.4 0 2.8-.4 4-1"/></svg>
              : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>}
          </button>
          <button type="button" onClick={handleCopy}
            className="text-slate-400 hover:text-[#1E487A] transition-colors"
            title="คัดลอก" aria-label="คัดลอก">
            {copied
              ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────── CompactItem — สำหรับ view mode ใหม่ (เรียบ ไม่ uppercase, label เล็ก) ─────── */
function CompactItem({ label, value, accent }) {
  return (
    <div className="px-5 py-3.5">
      <p className="text-[11.5px] text-slate-500 mb-0.5">{label}</p>
      <p className={`text-[14.5px] font-medium break-words ${accent ? 'text-[#1E487A]' : 'text-slate-800'}`}>
        {value || <span className="text-slate-300 font-normal">—</span>}
      </p>
    </div>
  );
}

/* ─────── CompactPassword — show •••• + reveal/copy ─────── */
function CompactPassword({ label, value, show, setShow }) {
  const hasValue = value && String(value).length > 0;
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!hasValue) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  return (
    <>
      <p className="text-[11.5px] text-slate-500 mb-0.5">{label}</p>
      {!hasValue ? (
        <p className="text-[14.5px] text-slate-300">—</p>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[14.5px] font-medium text-slate-800 font-mono select-all">
            {show ? value : '•'.repeat(Math.min(String(value).length, 12))}
          </span>
          <button type="button" onClick={() => setShow(s => !s)}
            className="text-slate-400 hover:text-[#1E487A] transition-colors"
            title={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
            {show
              ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.7 10.7a2.5 2.5 0 003.6 3.6M9.9 5.1A9.7 9.7 0 0112 5c4.4 0 8 3.5 9.4 7-.3.7-.8 1.7-1.5 2.7M6.4 6.4C4.4 7.9 2.9 10.2 2.6 12c1.4 3.5 5 7 9.4 7 1.4 0 2.8-.4 4-1"/></svg>
              : <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>}
          </button>
          <button type="button" onClick={handleCopy}
            className="text-slate-400 hover:text-[#1E487A] transition-colors" title="คัดลอก">
            {copied
              ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              : <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>}
          </button>
        </div>
      )}
    </>
  );
}

/* ─────── EditableItem — สลับระหว่าง view / edit mode ─────── */
function EditableItem({ label, name, value, accent, mono, editing, form, setForm }) {
  if (!editing) {
    return <InfoItem label={label} value={value} accent={accent} mono={mono} />;
  }
  return (
    <div className="py-2.5">
      <label className="block text-[11.5px] text-slate-500 mb-1">{label}</label>
      <input
        type="text"
        value={form[name] ?? ''}
        onChange={(e) => setForm(prev => ({ ...prev, [name]: e.target.value }))}
        className={`w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-[14px]
                    focus:outline-none focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] transition
                    ${accent ? 'text-[#1E487A] font-medium' : 'text-slate-800'}
                    ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

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
    <th className={`px-4 py-3 text-[12px] font-semibold text-slate-400 uppercase tracking-wider ${center ? 'text-center' : 'text-left'}`}>
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

/* ════════════════════════════════════════════════
   🆕 AccessoryRequestSection — ฟอร์มขออุปกรณ์เสริม + ประวัติ
════════════════════════════════════════════════ */
function AccessoryRequestSection({ accessories = [], currentStaff, myAccessoryReqs = [], handleStaffSubmitAccessoryRequest }) {
  const [accessoryId, setAccessoryId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAcc = accessories.find(a => a.id === accessoryId);
  const stockAvailable = selectedAcc
    ? Math.max(0, Number(selectedAcc.quantity || 0) - (selectedAcc.assignees?.length || 0) - Number(selectedAcc.brokenQuantity || 0))
    : 0;

  const filteredAccessories = useMemo(() => {
    // 🆕 กรองที่ admin ปิดการเบิกไว้ออก
    const enabled = accessories.filter(a => !a.requestDisabled);
    const term = searchTerm.trim().toLowerCase();
    if (!term) return enabled;
    return enabled.filter(a =>
      (a.name || '').toLowerCase().includes(term) ||
      (a.type || '').toLowerCase().includes(term)
    );
  }, [accessories, searchTerm]);

  const reset = () => {
    setAccessoryId(''); setQuantity(1); setReason(''); setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessoryId) { alert('กรุณาเลือกอุปกรณ์'); return; }
    if (!reason.trim()) { alert('กรุณากรอกเหตุผล'); return; }
    if (stockAvailable < quantity) { alert(`สต็อกไม่พอ (เหลือ ${stockAvailable} ชิ้น)`); return; }

    setIsSubmitting(true);
    try {
      await handleStaffSubmitAccessoryRequest({
        accessoryId,
        accessoryName: selectedAcc?.name || '',
        accessoryType: selectedAcc?.type || '',
        requestType: 'pending',
        quantity, reason,
      });
      reset();
    } finally { setIsSubmitting(false); }
  };

  const STATUS_BADGE = {
    'รอดำเนินการ':  'bg-amber-50 text-amber-700 ring-amber-200',
    'อนุมัติแล้ว':   'bg-emerald-50 text-emerald-700 ring-emerald-200',
    'ปฏิเสธคำขอ':   'bg-rose-50 text-rose-700 ring-rose-200',
    'คืนแล้ว':      'bg-slate-50 text-slate-700 ring-slate-200',
  };
  const REQ_LABEL = { pending: '—', new: 'เบิกใหม่', replace: 'ขอเปลี่ยน', add: 'ขอเพิ่ม', borrow: 'ขอยืม' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">

      {/* ─── LEFT: Catalog + History ─── */}
      <div className="space-y-5">
        {/* Search bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ค้นหาอุปกรณ์..."
              className="w-full bg-transparent pl-10 pr-3 py-2 text-[14px] focus:outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Grid catalog */}
        {filteredAccessories.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
            <Package className="h-10 w-10 mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="text-[13px] text-slate-500">
              {searchTerm ? 'ไม่พบอุปกรณ์ที่ค้นหา' : 'ยังไม่มีอุปกรณ์เสริมในระบบ'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredAccessories.map(acc => {
              const avail = Math.max(0, Number(acc.quantity || 0) - (acc.assignees?.length || 0) - Number(acc.brokenQuantity || 0));
              const isSelected = accessoryId === acc.id;
              const isDisabled = avail <= 0;
              return (
                <button
                  key={acc.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => { setAccessoryId(acc.id); setQuantity(1); }}
                  className={`text-left rounded-xl border transition-colors overflow-hidden bg-white ${
                    isDisabled
                      ? 'border-slate-200 opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'border-[#1E487A] ring-1 ring-[#1E487A]/20'
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="relative aspect-square bg-slate-50 flex items-center justify-center">
                    {acc.image
                      ? <img src={acc.image} alt={acc.name} className="w-full h-full object-contain p-2" loading="lazy" />
                      : <Package className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
                    }
                    {isSelected && (
                      <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#1E487A] text-white flex items-center justify-center shadow-sm">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                    <span className={`absolute top-2 right-2 text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${
                      isDisabled
                        ? 'bg-rose-100 text-rose-700'
                        : avail <= 3
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                    }`}>
                      {isDisabled ? 'หมด' : `เหลือ ${avail}`}
                    </span>
                  </div>
                  <div className="p-3 border-t border-slate-100">
                    <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{acc.name}</p>
                    {acc.type && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{acc.type}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* History */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
            <p className="text-[14px] font-semibold text-slate-800">ประวัติคำขอของฉัน</p>
            <span className="text-[11.5px] text-slate-400">{myAccessoryReqs.length} รายการ</span>
          </div>

          {myAccessoryReqs.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-slate-400">ยังไม่มีคำขอ</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {myAccessoryReqs.map(req => (
                <div key={req.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13.5px] font-semibold text-slate-800 truncate">{req.accessoryName}</p>
                      <span className="text-[12px] font-semibold text-[#1E487A] tabular-nums">× {req.quantity || 1}</span>
                    </div>
                    {req.reason && <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-2">{req.reason}</p>}
                    {req.status === 'ปฏิเสธคำขอ' && req.rejectReason && (
                      <p className="text-[11.5px] text-rose-600 mt-1">ปฏิเสธ: {req.rejectReason}</p>
                    )}
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      {req.timestamp ? new Date(req.timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <span className={`text-[10.5px] font-semibold px-2 py-1 rounded ring-1 ring-inset shrink-0 ${STATUS_BADGE[req.status] || ''}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Selected item panel (sticky) ─── */}
      <div className="lg:sticky lg:top-24">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[14.5px] font-semibold text-slate-800">รายการที่เลือก</p>
          </div>

          {!selectedAcc ? (
            <div className="px-5 py-12 text-center">
              <Package className="h-9 w-9 mx-auto text-slate-300 mb-2" strokeWidth={1.5} />
              <p className="text-[12.5px] text-slate-400">ยังไม่ได้เลือกอุปกรณ์</p>
              <p className="text-[11px] text-slate-400 mt-1">คลิกที่อุปกรณ์ในรายการ</p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-4">
              {/* Selected preview */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                {selectedAcc.image
                  ? <img src={selectedAcc.image} alt={selectedAcc.name} className="w-12 h-12 rounded-md object-contain bg-white p-0.5 border border-slate-200 shrink-0" />
                  : <div className="w-12 h-12 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-800 truncate">{selectedAcc.name}</p>
                  {selectedAcc.type && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{selectedAcc.type}</p>}
                  <p className="text-[11px] text-slate-500 mt-1">สต็อก <span className="font-semibold text-slate-700">{stockAvailable}</span> ชิ้น</p>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[12.5px] font-medium text-slate-600 mb-1.5">จำนวนที่ต้องการ</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-semibold"
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    max={stockAvailable || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-[13.5px] text-center font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30 focus:border-[#1E487A]"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(stockAvailable || 99, q + 1))}
                    disabled={quantity >= stockAvailable}
                    className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-semibold"
                  >+</button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[12.5px] font-medium text-slate-600 mb-1.5">
                  เหตุผล <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                  placeholder="เช่น เมาส์ใช้งานไม่ได้ ขอเปลี่ยน / เพิ่งเข้างานใหม่"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30 focus:border-[#1E487A] resize-none"
                />
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40">
            <button
              type="submit"
              disabled={isSubmitting || !accessoryId || !reason.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13.5px] font-semibold text-white bg-[#1E487A] hover:bg-[#163963] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> กำลังส่ง...</>
                : 'ส่งคำขอ'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
