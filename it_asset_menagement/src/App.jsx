import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

// ═══════════════════════════════════════════════════════════════
// 📧 ตั้งค่า Email Notification (กรอก 5 ค่าตรงนี้ ครั้งเดียวพอ)
// ═══════════════════════════════════════════════════════════════
// วิธีหา 3 ID แรก: สมัครฟรีที่ https://www.emailjs.com แล้วทำตามคู่มือ 4 ขั้น
const EMAILJS_SERVICE_ID  = 'service_yaix4t9';
const EMAILJS_TEMPLATE_ID = 'template_3aa0ng4';
const EMAILJS_PUBLIC_KEY  = 'Y8fJ0JAEUhLQcq9ig';

// Email ปลายทาง (ค่าเริ่มต้น — ใช้เมื่อยังไม่ได้ตั้งค่าใน "ตั้งค่าระบบ")
const DEFAULT_IT_EMAIL = 'Nanthaphon.nay@globesyndicate.co.th';
const DEFAULT_HR_EMAIL = 'Tanat.nai@globesyndicate.co.th';
// ═══════════════════════════════════════════════════════════════

async function sendNotification({ title, notifyType, facts, settings }) {
  const itEmail = settings?.itEmail?.trim() || DEFAULT_IT_EMAIL;
  const hrEmail = settings?.hrEmail?.trim() || DEFAULT_HR_EMAIL;
  const toEmail = notifyType === 'HR' ? hrEmail : itEmail;
  // จัดรูปแบบ facts ให้อ่านง่ายใน email
  const message = facts.map(f => `• ${f.label}: ${f.value}`).join('\n');

  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      to_email: toEmail,
      subject: title,
      message: message,
      timestamp: new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
    },
    EMAILJS_PUBLIC_KEY
  );
}

import useFirebaseData from './hooks/useFirebaseData.jsx';
import useAdminPermissions from './hooks/useAdminPermissions.jsx';
import UserManagementPage from './components/UserManagementPage.jsx';
import SystemSettingsPage from './components/SystemSettingsPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import { EMPTY_CHECKLIST, EMPTY_FIELDS, flattenFields } from './components/ConditionCapture.jsx';
import TopHeader from './components/TopHeader.jsx';
import DashboardStats from './components/DashboardStats.jsx';
import KpiDashboard from './components/KpiDashboard.jsx';
import ActionBar from './components/ActionBar.jsx';
import CustomAlert from './components/CustomAlert.jsx';
import LoginView from './components/LoginView.jsx';
import StaffView from './components/StaffView.jsx';
import ModalsContainer from './components/ModalsContainer.jsx';
import DropdownOptionsManager from './components/DropdownOptionsManager.jsx';
import ITReportModal from './components/ITReportModal.jsx';

import EmployeeTable from './components/EmployeeTable.jsx'; 
import LicenseTable from './components/LicenseTable.jsx';   
import OfficeSupplyTable from './components/OfficeSupplyTable.jsx';
import AssetTable from './components/AssetTable.jsx';       
import AccessoryTable from './components/AccessoryTable.jsx'; 
import RepairTable from './components/RepairTable.jsx';               
import SupplyRequestTable from './components/SupplyRequestTable.jsx'; 
import ReplacementRequestTable from './components/ReplacementRequestTable.jsx';

function App() {
  const [authRole, setAuthRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [staffEmpIdInput, setStaffEmpIdInput] = useState('');
  const [staffPasswordInput, setStaffPasswordInput] = useState(''); 
  const [currentStaff, setCurrentStaff] = useState(null);
  const [staffRepairForm, setStaffRepairForm] = useState({ assetName: '', issue: '' });
  const [editStaffRepairModal, setEditStaffRepairModal] = useState({ isOpen: false, data: null });

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar drawer
  const [pendingAssetId, setPendingAssetId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('asset') || null;
  });
  const [pendingAssetCat, setPendingAssetCat] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('cat') || 'assets';
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('darkMode', 'true'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('darkMode', 'false'); }
  }, [isDarkMode]);

  const {
    assets, accessories, employees, deletedEmployees, licenses,
    repairRequests, officeSupplies, supplyRequests, transactions, replacementRequests,
    fieldOptions,
  } = useFirebaseData();

  const { isSuperAdmin, adminPermissions, displayName: adminDisplayName, permLoading } = useAdminPermissions(currentUid, authRole);
  const canEdit = isSuperAdmin || adminPermissions?.level === 'full';

  // ─── ตั้งค่าอีเมลแจ้งเตือน (โหลดจาก Firestore — แก้ได้ในเมนู "ตั้งค่าระบบ") ───
  const [notifySettings, setNotifySettings] = useState({ itEmail: '', hrEmail: '' });
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'notifications'), (snap) => {
      if (snap.exists()) setNotifySettings(snap.data());
    });
    return unsub;
  }, []);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState([]); 
  const [selectedOfficeSupplyIds, setSelectedOfficeSupplyIds] = useState([]);
  const [selectedLicenseIds, setSelectedLicenseIds] = useState([]);

  const [name, setName] = useState('');
  const [type, setType] = useState('คอมพิวเตอร์');
  const [cost, setCost] = useState(''); 
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyDate, setWarrantyDate] = useState('');
  const [quantity, setQuantity] = useState(1); 
  const [unit, setUnit] = useState('ชิ้น'); 
  const [assetImage, setAssetImage] = useState(null); 
  const [assetDepartment, setAssetDepartment] = useState('');

  const [sn, setSn] = useState('');
  const [company, setCompany] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [model, setModel] = useState('');
  const [vendor, setVendor] = useState('');
  const [note, setNote] = useState('');
  const [assetDocument, setAssetDocument] = useState(null);

  const [empForm, setEmpForm] = useState({
    fullName: '', fullNameEng: '', empId: '', nationalId: '', department: '',
    company: '', position: '', nickname: '', manager: '', phone: '',
    m365Email: '', m365Password: ''
  });
  const [licenseForm, setLicenseForm] = useState({
    name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: '', quantity: 1
  });
  const [licenseImage, setLicenseImage] = useState(null);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empModalTab, setEmpModalTab] = useState('info');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, assetId: null, collectionName: '', sn: '', snIndex: undefined, itemCost: '', itemPurchaseDate: '', itemWarrantyDate: '' });
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);
  const [selectedAssetCategory, setSelectedAssetCategory] = useState('');
  const [editEmpModal, setEditEmpModal] = useState({ isOpen: false, data: null });
  const [editAssetModal, setEditAssetModal] = useState({ isOpen: false, data: null, collectionName: '' });
  const [editLicenseModal, setEditLicenseModal] = useState({ isOpen: false, data: null });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [checkoutEmpId, setCheckoutEmpId] = useState('');
  const [checkoutSearchTerm, setCheckoutSearchTerm] = useState('');
  const [checkoutRemarks, setCheckoutRemarks] = useState('');
  const [customAlert, setCustomAlert] = useState({ isOpen: false, title: '', message: '', type: 'error' });
  const [returnModal, setReturnModal] = useState({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnRemarks, setReturnRemarks] = useState('');
  // ─── หลักฐานสภาพอุปกรณ์ (รูปต่อหัวข้อ + checklist + หมายเหตุ) ───
  const [checkoutCondition, setCheckoutCondition] = useState({ fields: EMPTY_FIELDS, notes: '' });
  const [returnConditionData, setReturnConditionData] = useState({ fields: EMPTY_FIELDS, notes: '' });
  const [repairModal, setRepairModal] = useState({ isOpen: false, assetId: null, assetName: null, maxRepair: 0, brokenIndex: undefined });
  const [repairQuantity, setRepairQuantity] = useState(1);
  const [repairRemarks, setRepairRemarks] = useState('');
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, id: null, collectionName: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'ยืนยัน', cancelText: 'ยกเลิก', icon: 'warning' });
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);

  const [visibleAssetColumns, setVisibleAssetColumns] = useState({
    name: true, type: true, department: true, cost: true, status: true,
    assetTag: false, sn: false, model: false, vendor: false, company: false,
    purchaseDate: false, warrantyDate: false, assignedName: false
  });
  const [visibleLicenseColumns, setVisibleLicenseColumns] = useState({
    image: true, name: true, productKey: true, supplier: true,
    purchaseDate: false, expirationDate: true, cost: true, quantity: true, status: true,
  });

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) { if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const showConfirm = (title, message, onConfirm, opts = {}) => { setConfirmModal({ isOpen: true, title, message, onConfirm, confirmText: opts.confirmText || 'ยืนยัน', cancelText: opts.cancelText || 'ยกเลิก', icon: opts.icon || 'warning' }); };
  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  const handleConfirmModalOk = async () => { const fn = confirmModal.onConfirm; closeConfirmModal(); if (fn) await fn(); };

  const [accFilterType, setAccFilterType] = useState('ทั้งหมด');
  const [assetFilterType, setAssetFilterType] = useState('ทั้งหมด'); 
  const [assetFilterStatus, setAssetFilterStatus] = useState('ทั้งหมด'); 
  const [assetFilterDepartment, setAssetFilterDepartment] = useState('ทั้งหมด');
  const [repairFilterStatus, setRepairFilterStatus] = useState('ทั้งหมด'); 
  const [supplyFilterStatus, setSupplyFilterStatus] = useState('ทั้งหมด');
  const [repairFilterYear, setRepairFilterYear]   = useState('ทั้งหมด');
  const [repairFilterMonth, setRepairFilterMonth] = useState('ทั้งหมด');
  const [repairFilterDay, setRepairFilterDay]     = useState('ทั้งหมด');
  const [supplyFilterYear, setSupplyFilterYear]   = useState('ทั้งหมด');
  const [supplyFilterMonth, setSupplyFilterMonth] = useState('ทั้งหมด');
  const [supplyFilterDay, setSupplyFilterDay]     = useState('ทั้งหมด');
  const [officeSupplyStockFilter, setOfficeSupplyStockFilter] = useState('ทั้งหมด');
  const [showDeletedEmployees, setShowDeletedEmployees] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUid(user.uid);
        // ถ้า user มี doc ใน admin_users = เป็น admin ที่จัดการสิทธิ์ผ่านระบบ RBAC
        let isManagedAdmin = false;
        try {
          const adminSnap = await getDoc(doc(db, 'admin_users', user.uid));
          isManagedAdmin = adminSnap.exists();
        } catch (e) { /* ignore */ }
        if (!isManagedAdmin && user.email && user.email.toLowerCase().startsWith('hr@')) {
          setAuthRole('hr');
          setActiveMenu('office_supplies');
        } else {
          setAuthRole('admin');
        }
      } else {
        setCurrentUid(null);
        setAuthRole(prev => prev === 'staff' ? prev : null);
      }
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // ─── Redirect ออกจากเมนูที่ไม่ได้รับสิทธิ์ (กันค้างจาก session ก่อน) ───
  useEffect(() => {
    if (authRole !== 'admin' || permLoading) return;
    if (isSuperAdmin) return; // SuperAdmin เข้าได้ทุกเมนู
    const allowed = adminPermissions?.menus || [];
    const canResetPw = adminPermissions?.canManagePasswords === true;
    if (activeMenu === 'users') {
      // admin ที่มีสิทธิ์จัดการรหัสผ่านเข้าหน้านี้ได้
      if (!canResetPw) setActiveMenu(allowed[0] || 'dashboard');
      return;
    }
    if (allowed.length > 0 && !allowed.includes(activeMenu)) {
      setActiveMenu(allowed[0]);
    }
  }, [authRole, permLoading, isSuperAdmin, adminPermissions, activeMenu]);

  // ─── แจ้งเตือน License ใกล้หมดอายุ (ส่ง email ครั้งเดียวต่อวัน) ───
  useEffect(() => {
    if (authRole !== 'admin' || licenses.length === 0) return;
    // ต้องมีสิทธิ์เข้าถึงเมนู licenses เท่านั้นจึงจะส่ง email แจ้งเตือน
    const hasLicensesAccess = isSuperAdmin || (adminPermissions?.menus || []).includes('licenses');
    if (!hasLicensesAccess) return;
    const todayKey = new Date().toISOString().split('T')[0];
    const storageKey = `licenseExpiryAlertSent_${todayKey}`;
    if (localStorage.getItem(storageKey)) return;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expiringSoon = licenses.filter(lic => {
      if (!lic.expirationDate) return false;
      const diff = Math.ceil((new Date(lic.expirationDate) - today) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 90;
    });
    if (expiringSoon.length === 0) return;

    localStorage.setItem(storageKey, 'sent');
    const facts = expiringSoon.map(lic => {
      const diff = Math.ceil((new Date(lic.expirationDate) - today) / (1000 * 60 * 60 * 24));
      return { label: lic.name, value: `หมดอายุ ${lic.expirationDate} (อีก ${diff} วัน)` };
    });
    sendNotification({
      title: `⚠️ แจ้งเตือน: โปรแกรม/License ใกล้หมดอายุ ${expiringSoon.length} รายการ`,
      notifyType: 'IT',
      facts,
      settings: notifySettings,
    }).catch(err => console.error('License expiry email failed:', err));
  }, [authRole, licenses, isSuperAdmin, adminPermissions]);

  useEffect(() => {
    if (!pendingAssetId || !authRole || authRole === 'staff') return;
    const allItems = [...assets, ...accessories, ...licenses];
    const found = allItems.find(a => a.id === pendingAssetId);
    if (!found) return;
    const cat = pendingAssetCat || 'assets';
    setActiveMenu(cat === 'accessories' ? 'accessories' : cat === 'licenses' ? 'licenses' : 'assets');
    setSelectedAssetCategory(cat);
    setSelectedAssetDetail(found);
    setPendingAssetId(null);
    window.history.replaceState({}, '', window.location.pathname);
  }, [pendingAssetId, authRole, assets, accessories, licenses]);

  useEffect(() => {
    setName(''); setCost(''); setPurchaseDate(''); setWarrantyDate(''); setQuantity(1); setUnit('ชิ้น'); setAssetImage(null); setAssetDepartment('DX');
    setSn(''); setCompany(''); setAssetTag(''); setModel(''); setVendor(''); setNote(''); setAssetDocument(null);
    setAccFilterType('ทั้งหมด'); setSearchTerm(''); setAssetFilterType('ทั้งหมด');
    setAssetFilterStatus('ทั้งหมด'); setRepairFilterStatus('ทั้งหมด'); setAssetFilterDepartment('ทั้งหมด'); setSupplyFilterStatus('ทั้งหมด');
    setRepairFilterYear('ทั้งหมด'); setRepairFilterMonth('ทั้งหมด'); setRepairFilterDay('ทั้งหมด');
    setSupplyFilterYear('ทั้งหมด'); setSupplyFilterMonth('ทั้งหมด'); setSupplyFilterDay('ทั้งหมด');
    setOfficeSupplyStockFilter('ทั้งหมด');
    setShowDeletedEmployees(false); 
    setSelectedEmployeeIds([]); setSelectedAccessoryIds([]); setSelectedOfficeSupplyIds([]); setSelectedLicenseIds([]);
    if (activeMenu === 'assets') setType('คอมพิวเตอร์');
    else if (activeMenu === 'accessories') setType('เมาส์ (Mouse)');
    else if (activeMenu === 'office_supplies') setType('เครื่องเขียน');
  }, [activeMenu]);

  const handleAdminLogin = async (e) => {
    e.preventDefault(); setLoginError(''); setLoginLoading(true);
    try { await signInWithEmailAndPassword(auth, loginForm.username, loginForm.password); setShowAdminLogin(false); setLoginForm({ username: '', password: '' }); } 
    catch (error) { setLoginError('Email หรือ Password ไม่ถูกต้อง'); } 
    finally { setLoginLoading(false); }
  };

  const handleLogout = async () => { 
    if (authRole === 'admin' || authRole === 'hr') await signOut(auth); 
    setAuthRole(null); setCurrentStaff(null); 
  };

  const handleStaffLogin = (e) => {
    e.preventDefault();
    if (!staffEmpIdInput.trim()) return;
    const foundEmp = employees.find(emp => emp.empId.toLowerCase() === staffEmpIdInput.trim().toLowerCase());
    if (foundEmp) { setCurrentStaff(foundEmp); setStaffEmpIdInput(''); setStaffPasswordInput(''); }
    else { setCustomAlert({ isOpen: true, title: 'เข้าสู่ระบบไม่สำเร็จ!', message: 'ไม่พบรหัสพนักงานนี้ในระบบ', type: 'error' }); }
  };

  // 🟢 ฟังก์ชันส่งแจ้งซ่อม + อีเมล
  const handleSubmitRepairRequest = async (e) => {
    e.preventDefault(); if (!staffRepairForm.assetName.trim() || !staffRepairForm.issue.trim()) return;
    try {
      await addDoc(collection(db, 'repair_requests'), { empId: currentStaff.empId, empName: currentStaff.fullName, department: currentStaff.department, assetName: staffRepairForm.assetName, issue: staffRepairForm.issue, status: 'รอดำเนินการ', timestamp: Date.now(), createdAt: serverTimestamp() });
      
      try {
        await sendNotification({
          title: '🔧 แจ้งปัญหา IT / แจ้งซ่อม',
          notifyType: 'IT',
          settings: notifySettings,
          facts: [
            { label: 'พนักงาน', value: `${currentStaff.fullName} (${currentStaff.empId})` },
            { label: 'แผนก', value: currentStaff.department || '-' },
            { label: 'หัวหน้างาน', value: currentStaff.manager || '-' },
            { label: 'อุปกรณ์ / ปัญหา', value: staffRepairForm.assetName },
            { label: 'อาการที่พบ', value: staffRepairForm.issue },
          ]
        });
      } catch (notifyError) {
        console.error('แจ้งเตือนทาง email ไม่สำเร็จ:', notifyError);
      }

      setStaffRepairForm({ assetName: '', issue: '' });
      setCustomAlert({ isOpen: true, title: 'ส่งเรื่องสำเร็จ!', message: 'ระบบได้รับเรื่องแจ้งปัญหา และส่ง email แจ้งฝ่าย IT แล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  // 🟢 ฟังก์ชันส่งคำขอเบิกอุปกรณ์สำนักงาน + อีเมล
  const handleStaffSubmitSupplyRequest = async (supplyId, supplyName, reqQty, note) => {
    try {
      await addDoc(collection(db, 'supply_requests'), { empId: currentStaff.empId, empName: currentStaff.fullName, department: currentStaff.department, supplyId: supplyId, supplyName: supplyName, requestedQty: Number(reqQty), note: note, status: 'รอดำเนินการ', timestamp: Date.now(), createdAt: serverTimestamp() });
      
      try {
        await sendNotification({
          title: '📦 คำขอเบิกอุปกรณ์สำนักงาน',
          notifyType: 'HR',
          settings: notifySettings,
          facts: [
            { label: 'พนักงาน', value: `${currentStaff.fullName} (${currentStaff.empId})` },
            { label: 'แผนก', value: currentStaff.department || '-' },
            { label: 'หัวหน้างาน', value: currentStaff.manager || '-' },
            { label: 'อุปกรณ์ที่ขอเบิก', value: supplyName },
            { label: 'จำนวน', value: `${reqQty} ชิ้น` },
            { label: 'หมายเหตุ', value: note || '-' },
          ]
        });
      } catch (notifyError) {
        console.error('แจ้งเตือนทาง email ไม่สำเร็จ:', notifyError);
      }

      setCustomAlert({ isOpen: true, title: 'ส่งคำขอสำเร็จ!', message: 'ส่งคำขอเบิกอุปกรณ์ และส่ง email แจ้งฝ่าย HR เรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  // ฟังก์ชันบันทึกคำขอเปลี่ยนเครื่อง + ส่ง email แจ้ง IT
  const handleStaffSubmitReplacement = async (currentStatus, reason) => {
    if (!currentStaff) return;
    try {
      await addDoc(collection(db, 'replacement_requests'), {
        empId: currentStaff.empId,
        empName: currentStaff.fullName,
        department: currentStaff.department,
        managerName: currentStaff.manager || '-',
        currentStatus: currentStatus,
        reason: reason,
        status: 'รอดำเนินการ',
        timestamp: Date.now(),
        createdAt: serverTimestamp()
      });

      try {
        await sendNotification({
          title: '💻 คำขอเปลี่ยนเครื่อง',
          notifyType: 'IT',
          settings: notifySettings,
          facts: [
            { label: 'พนักงาน', value: `${currentStaff.fullName} (${currentStaff.empId})` },
            { label: 'แผนก', value: currentStaff.department || '-' },
            { label: 'หัวหน้างาน', value: currentStaff.manager || '-' },
            { label: 'สถานะเครื่องปัจจุบัน', value: currentStatus || '-' },
            { label: 'เหตุผลขอเปลี่ยน', value: reason || '-' },
          ]
        });
      } catch (notifyError) {
        console.error('แจ้งเตือนทาง email ไม่สำเร็จ:', notifyError);
      }

      setCustomAlert({ isOpen: true, title: 'บันทึกคำขอสำเร็จ!', message: 'บันทึกคำขอเปลี่ยนเครื่อง และส่ง email แจ้งฝ่าย IT เรียบร้อยแล้ว กรุณาพิมพ์ฟอร์มและนำไปให้หัวหน้าแผนกเซ็นต์อนุมัติ', type: 'success' });
    } catch (error) {
      setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' });
    }
  };

  const handleUpdateReplacementStatus = async (id, newStatus) => {
    try { await updateDoc(doc(db, 'replacement_requests', id), { status: newStatus }); } 
    catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

  const handleDeleteReplacement = (id) => {
    showConfirm('ยืนยันการลบ', 'คุณต้องการลบรายการนี้ออกจากระบบใช่หรือไม่?', async () => {
      try { await deleteDoc(doc(db, 'replacement_requests', id)); } 
      catch (error) { setCustomAlert({ isOpen: true, title: 'ลบผิดพลาด', message: error.message, type: 'error' }); }
    }, { confirmText: 'ยืนยันลบ', icon: 'trash' });
  };

  const handleStaffDeleteRepair = (id) => { showConfirm('ยืนยันการยกเลิก', 'คุณต้องการยกเลิกและลบรายการแจ้งปัญหานี้ใช่หรือไม่?', async () => { try { await deleteDoc(doc(db, 'repair_requests', id)); setCustomAlert({ isOpen: true, title: 'ยกเลิกสำเร็จ!', message: 'ลบรายการแจ้งปัญหาของคุณเรียบร้อยแล้ว', type: 'success' }); } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); } }, { confirmText: 'ยืนยันลบ', icon: 'trash' }); };
  const handleStaffUpdateRepair = async (e) => { e.preventDefault(); try { await updateDoc(doc(db, 'repair_requests', editStaffRepairModal.data.id), { assetName: editStaffRepairModal.data.assetName, issue: editStaffRepairModal.data.issue }); setEditStaffRepairModal({ isOpen: false, data: null }); setCustomAlert({ isOpen: true, title: 'แก้ไขสำเร็จ!', message: 'อัปเดตข้อมูลแจ้งปัญหาเรียบร้อยแล้ว', type: 'success' }); } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); } };
  const handleUpdateRepairRequestStatus = async (id, newStatus) => {
    try {
      const payload = { status: newStatus };
      // track lifecycle timestamps for KPI (response time / repair time)
      if (newStatus === 'กำลังซ่อม') {
        payload.startedAt = Date.now();
      } else if (newStatus === 'ซ่อมเสร็จสิ้น') {
        payload.completedAt = Date.now();
        // ถ้าไม่เคย "กำลังซ่อม" มาก่อน (เช่นปิดเคสเลย) ให้ set startedAt ด้วยเพื่อความสมบูรณ์
        const req = repairRequests.find(r => r.id === id);
        if (req && !req.startedAt) payload.startedAt = Date.now();
      }
      await updateDoc(doc(db, 'repair_requests', id), payload);
    } catch (error) {
      setCustomAlert({ isOpen: true, title: 'อัปเดตผิดพลาด', message: error.message, type: 'error' });
    }
  };

  const handleSubmitEvaluation = async (repairId, evaluation) => {
    if (!repairId || !evaluation || !currentStaff) return;
    try {
      await updateDoc(doc(db, 'repair_requests', repairId), {
        evaluation: {
          speedRating:   Number(evaluation.speedRating)   || 0,
          qualityRating: Number(evaluation.qualityRating) || 0,
          serviceRating: Number(evaluation.serviceRating) || 0,
          overallRating: Number(evaluation.overallRating) || 0,
          comment:       (evaluation.comment || '').trim(),
          evaluatedAt:   Date.now(),
          evaluatedBy:   currentStaff.empId,
          evaluatedByName: currentStaff.fullName,
        }
      });
      setCustomAlert({
        isOpen: true,
        title: 'ขอบคุณสำหรับการประเมิน! 🙏',
        message: 'ความคิดเห็นของคุณจะช่วยให้ทีม IT พัฒนาบริการให้ดียิ่งขึ้น',
        type: 'success',
      });
    } catch (error) {
      setCustomAlert({
        isOpen: true,
        title: 'บันทึกแบบประเมินผิดพลาด',
        message: error.message,
        type: 'error',
      });
      throw error;
    }
  };
  const handleDeleteRepairRequest = (id) => { showConfirm('ยืนยันการลบ', 'คุณต้องการลบรายการนี้ออกจากระบบใช่หรือไม่?', async () => { try { await deleteDoc(doc(db, 'repair_requests', id)); } catch (error) { setCustomAlert({ isOpen: true, title: 'ลบผิดพลาด', message: error.message, type: 'error' }); } }, { confirmText: 'ยืนยันลบ', icon: 'trash' }); };

  const handleUpdateSupplyRequestStatus = async (req, newStatus) => {
    try {
      if (newStatus === 'อนุมัติแล้ว' && req.status !== 'อนุมัติแล้ว') {
        const supplyItem = officeSupplies.find(s => s.id === req.supplyId);
        if (!supplyItem || Number(supplyItem.quantity) < Number(req.requestedQty)) { setCustomAlert({ isOpen: true, title: 'สต็อกไม่พอ!', message: 'อุปกรณ์ในคลังมีไม่พอให้เบิก กรุณาตรวจสอบสต็อก', type: 'error' }); return; }
        await updateDoc(doc(db, 'office_supplies', req.supplyId), { quantity: Number(supplyItem.quantity) - Number(req.requestedQty) });
      } else if (req.status === 'อนุมัติแล้ว' && newStatus !== 'อนุมัติแล้ว') {
         const supplyItem = officeSupplies.find(s => s.id === req.supplyId);
         if (supplyItem) await updateDoc(doc(db, 'office_supplies', req.supplyId), { quantity: Number(supplyItem.quantity) + Number(req.requestedQty) });
      }
      await updateDoc(doc(db, 'supply_requests', req.id), { status: newStatus });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

  const handleAdd = async (e) => {
    e.preventDefault(); if (!name.trim()) return;
    const collectionName = activeMenu === 'assets' ? 'assets' : activeMenu === 'office_supplies' ? 'office_supplies' : 'accessories';
    try {
      const qtyToSave = Number(quantity);
      if (activeMenu === 'office_supplies') {
        await addDoc(collection(db, 'office_supplies'), { name, type, quantity: qtyToSave, unit, status: 'พร้อมใช้งาน', image: assetImage || null, createdAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, collectionName), {
          name, type, cost, purchaseDate, warrantyDate, quantity: qtyToSave, brokenQuantity: 0, status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null, image: assetImage || null,
          assignees: activeMenu === 'accessories' ? [] : null,
          forDepartment: activeMenu === 'assets' ? assetDepartment : null, sn: activeMenu === 'assets' ? sn : null, company: activeMenu === 'assets' ? company : null, assetTag: activeMenu === 'assets' ? assetTag : null, model: activeMenu === 'assets' ? model : null, vendor: (activeMenu === 'assets' || activeMenu === 'accessories') ? vendor : null, note: activeMenu === 'accessories' ? note : null, document: activeMenu === 'assets' ? assetDocument : null, createdAt: serverTimestamp()
        });
      }
      setName(''); setCost(''); setPurchaseDate(''); setWarrantyDate(''); setQuantity(1); setUnit('ชิ้น'); setAssetImage(null); setAssetDepartment(''); setSn(''); setCompany(''); setAssetTag(''); setModel(''); setVendor(''); setNote(''); setAssetDocument(null);
      setIsAddModalOpen(false); setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'เพิ่มรายการใหม่ลงระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  const handleEmpChange = (e) => setEmpForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleLicenseChange = (e) => setLicenseForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const isDuplicate = employees.some(emp => String(emp.empId).toLowerCase() === empForm.empId.trim().toLowerCase() || String(emp.fullName).toLowerCase() === empForm.fullName.trim().toLowerCase());
    if (isDuplicate) return setCustomAlert({ isOpen: true, title: 'ข้อมูลซ้ำซ้อน!', message: `รหัสพนักงาน หรือ ชื่อ-นามสกุล นี้มีอยู่ในระบบแล้ว`, type: 'error' });
    try {
      await addDoc(collection(db, 'employees'), { ...empForm, createdAt: serverTimestamp() });
      setEmpForm({ fullName: '', fullNameEng: '', empId: '', nationalId: '', department: '', company: '', position: '', nickname: '', manager: '', phone: '', m365Email: '', m365Password: '' });
      setIsAddModalOpen(false); setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'เพิ่มข้อมูลพนักงานใหม่ลงระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  const handleAddLicense = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'licenses'), {
        ...licenseForm,
        quantity: Number(licenseForm.quantity || 1),
        assignees: [],
        image: licenseImage || null,
        status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null, createdAt: serverTimestamp()
      });
      setLicenseForm({ name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: '', quantity: 1 });
      setLicenseImage(null);
      setIsAddModalOpen(false); setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'เพิ่มข้อมูลโปรแกรม/ใบอนุญาต ใหม่ลงระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  const handleDelete = (id, collectionName) => setConfirmDeleteModal({ isOpen: true, id, collectionName });

  const executeDelete = async () => {
    const { id, collectionName } = confirmDeleteModal;
    if (!id || !collectionName) return;
    try {
      const idsToDelete = Array.isArray(id) ? id : [id];
      let deletedEmpStringIds = [];
      if (collectionName === 'employees') {
        const deletedEmps = employees.filter(emp => idsToDelete.includes(emp.id));
        deletedEmpStringIds = deletedEmps.map(emp => String(emp.empId).toLowerCase());
        for (const emp of deletedEmps) {
          const empData = { ...emp }; delete empData.id;
          await setDoc(doc(db, 'deleted_employees', emp.id), { ...empData, deletedAt: serverTimestamp() });
        }
      }
      for (const targetId of idsToDelete) { await deleteDoc(doc(db, collectionName, targetId)); }
      
      if (collectionName === 'employees') {
        const userAssets = assets.filter(item => idsToDelete.includes(item.assignedTo));
        for (const asset of userAssets) { await updateDoc(doc(db, 'assets', asset.id), { status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null }); }
        
        const userAccessories = accessories.filter(item => item.assignees && item.assignees.some(a => idsToDelete.includes(a.empId)));
        for (const acc of userAccessories) {
            const remainingAssignees = acc.assignees.filter(a => !idsToDelete.includes(a.empId));
            await updateDoc(doc(db, 'accessories', acc.id), { assignees: remainingAssignees });
        }
        const userLicenses = licenses.filter(item => item.assignees && item.assignees.some(a => idsToDelete.includes(a.empId)));
        for (const lic of userLicenses) {
            const remainingAssignees = lic.assignees.filter(a => !idsToDelete.includes(a.empId));
            await updateDoc(doc(db, 'licenses', lic.id), { assignees: remainingAssignees });
        }

        const reqsToDelete = repairRequests.filter(req => deletedEmpStringIds.includes(String(req.empId).toLowerCase()));
        for (const req of reqsToDelete) { await deleteDoc(doc(db, 'repair_requests', req.id)); }
      }
      setConfirmDeleteModal({ isOpen: false, id: null, collectionName: null });
      setSelectedEmployeeIds([]); setSelectedAccessoryIds([]); setSelectedOfficeSupplyIds([]); setSelectedLicenseIds([]);
      setCustomAlert({ isOpen: true, title: 'ลบสำเร็จ!', message: 'ลบรายการออกจากระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  const handleRestoreEmployee = async (emp) => {
    try {
      const empData = { ...emp }; delete empData.id; delete empData.deletedAt;
      await setDoc(doc(db, 'employees', emp.id), { ...empData, createdAt: serverTimestamp() });
      await deleteDoc(doc(db, 'deleted_employees', emp.id));
      setCustomAlert({ isOpen: true, title: 'กู้คืนสำเร็จ!', message: 'กู้คืนข้อมูลพนักงานกลับสู่ระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

  const handleExportEmployees = () => {
    const rows = [['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ชื่อภาษาอังกฤษ', 'ชื่อเล่น', 'แผนก', 'บริษัท', 'ตำแหน่ง', 'หัวหน้า', 'เบอร์โทร', 'M365 Email']];
    employees.forEach(emp => rows.push([
      emp.empId || '', emp.fullName || '', emp.fullNameEng || '', emp.nickname || '',
      emp.department || '', emp.company || '', emp.position || '', emp.manager || '',
      emp.phone || '', emp.m365Email || '',
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'employees.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const handleExportAccessories = () => {
    const filtered = accessories.filter(item => accFilterType === 'ทั้งหมด' || item.type === accFilterType);
    const rows = [['ชื่ออุปกรณ์', 'ประเภท', 'จำนวนทั้งหมด', 'ราคา', 'วันที่ซื้อ', 'วันหมด Warranty', 'ผู้จัดจำหน่าย', 'หมายเหตุ', 'สถานะ']];
    filtered.forEach(item => rows.push([
      item.name || '', item.type || '', item.quantity || '', item.cost || '',
      item.purchaseDate || '', item.warrantyDate || '', item.vendor || '',
      item.note || '', item.status || '',
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'accessories.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const handleExportOfficeSupplies = () => {
    const rows = [['ชื่ออุปกรณ์', 'ประเภท', 'จำนวน', 'หน่วยนับ', 'ราคา', 'วันที่ซื้อ', 'ผู้จัดจำหน่าย', 'หมายเหตุ', 'สถานะ']];
    officeSupplies.forEach(item => rows.push([
      item.name || '', item.type || '', item.quantity || 0, item.unit || 'ชิ้น',
      item.cost || '', item.purchaseDate || '', item.vendor || '',
      item.note || '', item.status || 'พร้อมใช้งาน',
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'office_supplies.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const handleExportLicenses = () => {
    // Export แบบ 1 บรรทัด = 1 สิทธิ์ (seat) — ข้อมูล license ใช้ซ้ำทุกบรรทัด
    // เพื่อให้ข้อมูล nested (assignees, per-seat keys, costs) ครบในไฟล์เดียว
    const rows = [[
      // ─── ข้อมูล License (ซ้ำทุกบรรทัด) ───
      'ชื่อโปรแกรม', 'Supplier', 'วันที่ซื้อ', 'วันหมดอายุ',
      'จำนวนสิทธิ์ทั้งหมด', 'ราคารวม (License)', 'สถานะ License',
      // ─── ข้อมูลสิทธิ์ (แต่ละบรรทัด) ───
      'ลำดับสิทธิ์', 'สถานะสิทธิ์', 'ผู้ใช้งาน', 'รหัสพนักงาน',
      'วันที่เบิก', 'Product Key (สิทธิ์)', 'รหัส Key (สิทธิ์)',
      'ราคา/สิทธิ์', 'หมายเหตุ',
    ]];

    licenses.forEach(l => {
      const totalSeats = Number(l.quantity || 0) || 1;
      const assignees = l.assignees || [];
      const availKeys = l.availableKeys || [];
      const availKeyCodes = l.availableKeyCodes || [];
      const availSeatCosts = l.availableSeatCosts || [];

      // ข้อมูล license ที่ใช้ซ้ำในทุกบรรทัด
      const licCommon = [
        l.name || '',
        l.supplier || '',
        l.purchaseDate || '',
        l.expirationDate || '',
        totalSeats,
        l.cost || '',
        l.status || '',
      ];

      let seatIdx = 0;

      // 1) บรรทัดสำหรับสิทธิ์ที่ "ใช้งานอยู่" (assigned)
      assignees.forEach(a => {
        seatIdx++;
        rows.push([
          ...licCommon,
          seatIdx,
          'ใช้งาน',
          a.empName || '',
          a.empId || '',
          a.checkoutDate || '',
          a.productKey || l.productKey || '',
          a.keyCode || l.keyCode || '',
          a.seatCost || '',
          a.remarks || '',
        ]);
      });

      // 2) บรรทัดสำหรับสิทธิ์ที่ "ว่าง" (available)
      const availCount = Math.max(0, totalSeats - assignees.length);
      for (let i = 0; i < availCount; i++) {
        seatIdx++;
        rows.push([
          ...licCommon,
          seatIdx,
          'ว่าง',
          '',
          '',
          '',
          availKeys[i] || l.productKey || '',
          availKeyCodes[i] || l.keyCode || '',
          availSeatCosts[i] || '',
          '',
        ]);
      }

      // 3) ถ้า license นี้ไม่มี seat เลย — ใส่ 1 บรรทัดเป็นข้อมูล license พื้นฐาน
      if (assignees.length === 0 && availCount === 0) {
        rows.push([
          ...licCommon,
          '',
          '',
          '',
          '',
          '',
          l.productKey || '',
          l.keyCode || '',
          l.cost || '',
          '',
        ]);
      }
    });

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'licenses.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const handleDownloadTemplate = () => {
    /* ── Template definition per entity ──
     * - headers: ชื่อคอลัมน์ที่ใช้ใน CSV (ตรงกับ MAP ด้านล่าง)
     * - example: แถวตัวอย่าง 1 แถว ช่วยให้ผู้ใช้เห็น format (ลบทิ้งก่อน import ก็ได้)
     */
    let headers, example, filename;

    if (activeMenu === 'assets') {
      headers = [
        'ชื่ออุปกรณ์', 'ประเภท', 'แผนก', 'รหัสทรัพย์สิน', 'Serial Number',
        'ยี่ห้อ/รุ่น', 'บริษัท', 'ผู้จัดจำหน่าย', 'วันที่ซื้อ', 'วันหมด Warranty',
        'ราคา', 'Tier', 'หมายเหตุ', 'สถานะ',
      ];
      example = [
        'Lenovo ThinkPad X1', 'คอมพิวเตอร์', 'Business Development', 'AST-001', 'SN12345',
        'T14 Gen 4', 'Globe Syndicate (Thailand) Co., Ltd.', 'IT CITY', '2026-01-15', '2027-01-15',
        '35000', 'Data', 'เครื่องตัวอย่าง — ลบแถวนี้ก่อน import จริง', 'พร้อมใช้งาน',
      ];
      filename = 'template_assets.csv';
    }
    else if (activeMenu === 'accessories') {
      headers = [
        'ชื่ออุปกรณ์', 'ประเภท', 'จำนวนทั้งหมด', 'ราคา',
        'วันที่ซื้อ', 'วันหมด Warranty', 'ผู้จัดจำหน่าย', 'หมายเหตุ',
      ];
      example = [
        'Logitech M170 Mouse', 'เมาส์ (Mouse)', '20', '300',
        '2026-01-15', '', 'IT CITY', 'อุปกรณ์ตัวอย่าง — ลบแถวนี้ก่อน import จริง',
      ];
      filename = 'template_accessories.csv';
    }
    else if (activeMenu === 'licenses') {
      headers = [
        'ชื่อโปรแกรม', 'Product Key', 'รหัส Key', 'Supplier',
        'วันที่ซื้อ', 'วันหมดอายุ', 'ราคา', 'จำนวนสิทธิ์', 'หมายเหตุ',
      ];
      example = [
        'Microsoft Office 2024', 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', 'KEY001', 'IT CITY',
        '2026-01-15', '2099-12-31', '12000', '5', 'License ตัวอย่าง — ลบแถวนี้ก่อน import จริง',
      ];
      filename = 'template_licenses.csv';
    }
    else if (activeMenu === 'office_supplies') {
      headers = [
        'ชื่ออุปกรณ์', 'ประเภท', 'จำนวน', 'หน่วยนับ',
        'ราคา', 'วันที่ซื้อ', 'ผู้จัดจำหน่าย', 'หมายเหตุ',
      ];
      example = [
        'ปากกาลูกลื่น สีน้ำเงิน', 'เครื่องเขียน', '50', 'ด้าม',
        '15', '2026-01-15', 'Officemate', 'อุปกรณ์ตัวอย่าง — ลบแถวนี้ก่อน import จริง',
      ];
      filename = 'template_office_supplies.csv';
    }
    else {
      headers = [
        'รหัสพนักงาน', 'รหัสบัตรประชาชน', 'ชื่อ-นามสกุล', 'ชื่อภาษาอังกฤษ', 'ชื่อเล่น',
        'แผนก', 'บริษัท', 'ตำแหน่ง', 'หัวหน้า', 'เบอร์โทร',
        'M365 Email', 'M365 Password',
      ];
      example = [
        'EMP001', '', 'นายตัวอย่าง ทดสอบ', 'Sample Test', 'ทอม',
        'IT', 'Globe Syndicate (Thailand) Co., Ltd.', 'IT Support', '', '081-234-5678',
        'sample@globesyndicate.com', '',
      ];
      filename = 'template_employees.csv';
    }

    const esc = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    const csv =
      headers.map(esc).join(',') + '\n' +
      example.map(esc).join(',') + '\n';
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const handleImportEmployees = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result.replace(/^﻿/, ''); // strip BOM
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          return setCustomAlert({ isOpen: true, title: 'ไฟล์ว่างเปล่า', message: 'ไม่พบข้อมูลในไฟล์ CSV', type: 'error' });
        }

        // ── CSV row parser — handles quoted fields with commas / newlines ──
        const parseRow = (line) => {
          const res = []; let cur = ''; let inQ = false;
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
              if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; }
            } else if (line[i] === ',' && !inQ) { res.push(cur.trim()); cur = ''; }
            else { cur += line[i]; }
          }
          res.push(cur.trim()); return res;
        };

        // ── Number parser — รองรับ "25,000" และ "12,345.67" ──
        const toNumber = (v) => {
          if (v == null || v === '') return null;
          const n = Number(String(v).replace(/,/g, '').trim());
          return isNaN(n) ? null : n;
        };

        const headers = parseRow(lines[0]);

        // ── Header → Firestore field mappings per collection ──
        const MAP = {
          assets: {
            'ชื่ออุปกรณ์': 'name', 'ประเภท': 'type', 'แผนก': 'department',
            'รหัสทรัพย์สิน': 'assetTag', 'Serial Number': 'sn', 'ยี่ห้อ/รุ่น': 'model',
            'บริษัท': 'company', 'ผู้จัดจำหน่าย': 'vendor',
            'วันที่ซื้อ': 'purchaseDate', 'วันหมด Warranty': 'warrantyDate',
            'ราคา': 'cost', 'Tier': 'tier', 'หมายเหตุ': 'note', 'สถานะ': 'status',
          },
          accessories: {
            'ชื่ออุปกรณ์': 'name', 'ประเภท': 'type', 'จำนวนทั้งหมด': 'quantity',
            'ราคา': 'cost', 'วันที่ซื้อ': 'purchaseDate', 'วันหมด Warranty': 'warrantyDate',
            'ผู้จัดจำหน่าย': 'vendor', 'หมายเหตุ': 'note',
          },
          licenses: {
            'ชื่อโปรแกรม': 'name', 'Product Key': 'productKey', 'รหัส Key': 'keyCode',
            'Supplier': 'supplier', 'วันที่ซื้อ': 'purchaseDate', 'วันหมดอายุ': 'expirationDate',
            'ราคา': 'cost', 'จำนวนสิทธิ์': 'quantity', 'หมายเหตุ': 'note',
          },
          office_supplies: {
            'ชื่ออุปกรณ์': 'name', 'ประเภท': 'type', 'จำนวน': 'quantity', 'หน่วยนับ': 'unit',
            'ราคา': 'cost', 'วันที่ซื้อ': 'purchaseDate', 'ผู้จัดจำหน่าย': 'vendor', 'หมายเหตุ': 'note',
          },
          employees: {
            'รหัสพนักงาน': 'empId', 'รหัสบัตรประชาชน': 'nationalId',
            'ชื่อ-นามสกุล': 'fullName', 'ชื่อภาษาอังกฤษ': 'fullNameEng',
            'ชื่อเล่น': 'nickname', 'แผนก': 'department', 'บริษัท': 'company',
            'ตำแหน่ง': 'position', 'หัวหน้า': 'manager', 'เบอร์โทร': 'phone',
            'M365 Email': 'm365Email', 'M365 Password': 'm365Password',
          },
        };

        const colName = activeMenu === 'assets'          ? 'assets'
                      : activeMenu === 'accessories'     ? 'accessories'
                      : activeMenu === 'licenses'        ? 'licenses'
                      : activeMenu === 'office_supplies' ? 'office_supplies'
                      : 'employees';
        const fieldMap = MAP[colName];

        // ── ตรวจสอบว่ามี header อย่างน้อย 1 อันที่ map ได้ — ป้องกัน import ผิด collection ──
        const recognizedHeaders = headers.filter(h => fieldMap[h]);
        if (recognizedHeaders.length === 0) {
          return setCustomAlert({
            isOpen: true,
            title: 'ไฟล์ผิดประเภท',
            message: `ไฟล์นี้ไม่มีคอลัมน์ที่ตรงกับเมนู "${colName}" — โปรดโหลด Template.csv ของเมนูนี้ก่อนกรอกข้อมูล`,
            type: 'error',
          });
        }

        let count = 0;
        const skipped = [];

        for (let i = 1; i < lines.length; i++) {
          const vals = parseRow(lines[i]);
          if (vals.every(v => !v)) continue; // skip blank rows

          const rec = {};
          headers.forEach((h, idx) => {
            const f = fieldMap[h];
            if (f) rec[f] = (vals[idx] || '').trim();
          });

          // ── Validate required ──
          const hasName = (rec.name || rec.fullName || '').trim();
          if (!hasName) { skipped.push(i + 1); continue; }

          // ── Defaults + type conversion per collection ──
          if (colName === 'assets') {
            rec.cost           = toNumber(rec.cost) || 0;
            rec.status         = rec.status || 'พร้อมใช้งาน';
            rec.tier           = rec.tier || 'General';
            rec.quantity       = 1;
            rec.brokenQuantity = 0;
            rec.assignedTo     = null;
            rec.assignedName   = null;
          }
          else if (colName === 'accessories') {
            rec.quantity       = toNumber(rec.quantity) || 1;
            rec.cost           = toNumber(rec.cost) || 0;
            rec.brokenQuantity = 0;
            rec.status         = 'พร้อมใช้งาน';
            rec.assignees      = [];
          }
          else if (colName === 'licenses') {
            rec.quantity       = toNumber(rec.quantity) || 1;
            rec.cost           = toNumber(rec.cost) || 0;
            rec.status         = 'พร้อมใช้งาน';
            rec.assignees      = [];
            rec.assignedTo     = null;
            rec.assignedName   = null;
          }
          else if (colName === 'office_supplies') {
            rec.quantity       = toNumber(rec.quantity) || 0;
            rec.cost           = toNumber(rec.cost) || 0;
            rec.unit           = rec.unit || 'ชิ้น';
            rec.status         = 'พร้อมใช้งาน';
          }

          rec.createdAt = serverTimestamp();
          await addDoc(collection(db, colName), rec);
          count++;
        }

        setIsImportModalOpen(false);
        const msgParts = [`นำเข้าข้อมูล ${count} รายการเรียบร้อยแล้ว`];
        if (skipped.length > 0) {
          msgParts.push(`(ข้ามแถวที่ไม่มีชื่อ: ${skipped.slice(0, 5).join(', ')}${skipped.length > 5 ? '...' : ''})`);
        }
        setCustomAlert({
          isOpen: true,
          title: count > 0 ? 'นำเข้าสำเร็จ!' : 'ไม่พบข้อมูลที่นำเข้าได้',
          message: msgParts.join('\n'),
          type: count > 0 ? 'success' : 'error',
        });
      } catch (err) {
        setCustomAlert({ isOpen: true, title: 'นำเข้าไม่สำเร็จ', message: err.message, type: 'error' });
      }
    };
    reader.readAsText(file, 'UTF-8');
  };
  const handleExportAssets = () => {
    const filtered = assets.filter(item =>
      (assetFilterType === 'ทั้งหมด' || item.type === assetFilterType) &&
      (assetFilterStatus === 'ทั้งหมด' || (item.status || 'พร้อมใช้งาน') === assetFilterStatus) &&
      (assetFilterDepartment === 'ทั้งหมด' || item.forDepartment === assetFilterDepartment)
    );
    const rows = [['ชื่ออุปกรณ์', 'ประเภท', 'แผนก', 'รหัสทรัพย์สิน', 'Serial Number', 'ยี่ห้อ/รุ่น', 'ผู้จัดจำหน่าย', 'บริษัท', 'วันที่ซื้อ', 'วันหมด Warranty', 'ราคา', 'ผู้ครอบครอง', 'สถานะ']];
    filtered.forEach(item => rows.push([
      item.name || '', item.type || '', item.department || '', item.assetTag || '',
      item.sn || '', item.model || '', item.vendor || '', item.company || '',
      item.purchaseDate || '', item.warrantyDate || '', item.cost || '',
      item.assignedName || '', item.status || 'พร้อมใช้งาน',
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'assets.csv'; a.click(); URL.revokeObjectURL(url);
  };
  
  const openEditEmpModal = (emp) => setEditEmpModal({ isOpen: true, data: { ...emp } });
  const handleEditEmpChange = (e) => setEditEmpModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateEmployee = async (e) => { e.preventDefault(); try { const updatedData = { ...editEmpModal.data }; delete updatedData.id; await updateDoc(doc(db, 'employees', editEmpModal.data.id), updatedData); if (selectedEmployee && selectedEmployee.id === editEmpModal.data.id) setSelectedEmployee({ ...selectedEmployee, ...updatedData, id: editEmpModal.data.id }); setEditEmpModal({ isOpen: false, data: null }); setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขข้อมูลเรียบร้อยแล้ว', type: 'success' }); } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); } };

  const openEditAssetModal = (asset, collectionName) => setEditAssetModal({ isOpen: true, data: { ...asset }, collectionName });
  const handleEditAssetChange = (e) => setEditAssetModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateAsset = async (e) => { e.preventDefault(); try { const updatedData = { ...editAssetModal.data }; delete updatedData.id; if (editAssetModal.collectionName === 'accessories' && updatedData.remainingQuantity !== undefined) { updatedData.quantity = Number(updatedData.remainingQuantity) + (updatedData.assignees?.length || 0) + Number(updatedData.brokenQuantity || 0); delete updatedData.remainingQuantity; } await updateDoc(doc(db, editAssetModal.collectionName, editAssetModal.data.id), updatedData); setEditAssetModal({ isOpen: false, data: null, collectionName: '' }); setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขเรียบร้อยแล้ว', type: 'success' }); } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); } };

  const openEditLicenseModal = (license) => setEditLicenseModal({ isOpen: true, data: { ...license } });
  const handleEditLicenseChange = (e) => setEditLicenseModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateLicense = async (e) => { e.preventDefault(); try { const updatedData = { ...editLicenseModal.data }; delete updatedData.id; if (updatedData.remainingQuantity !== undefined) { updatedData.quantity = Number(updatedData.remainingQuantity) + (updatedData.assignees?.length || 0); delete updatedData.remainingQuantity; } await updateDoc(doc(db, 'licenses', editLicenseModal.data.id), updatedData); setEditLicenseModal({ isOpen: false, data: null }); setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขเรียบร้อยแล้ว', type: 'success' }); } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); } };

  const [isITReportOpen, setIsITReportOpen] = useState(false);
  const [savingFieldOptions, setSavingFieldOptions] = useState(false);
  const handleSaveFieldOptions = async (data) => {
    setSavingFieldOptions(true);
    try {
      await setDoc(doc(db, 'settings', 'fieldOptions'), data);
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: err.message, type: 'error' });
    } finally {
      setSavingFieldOptions(false);
    }
  };

  // Normalize accessory item arrays to array-of-objects format (backward compat)
  const getAvailableItems = (acc) => {
    if (Array.isArray(acc.availableItems)) return [...acc.availableItems];
    const availCount = Math.max(0, Number(acc.quantity||0) - (acc.assignees?.length||0) - Number(acc.brokenQuantity||0));
    return Array.from({length: availCount}, (_, i) => ({
      sn: acc.availableSNs?.[i] || '',
      model: acc.availableModels?.[i] || '',
      cost: acc.availableCosts?.[i] || '',
      purchaseDate: acc.availablePurchaseDates?.[i] || '',
      warrantyDate: acc.availableWarrantyDates?.[i] || '',
    }));
  };
  const getBrokenItems = (acc) => {
    if (Array.isArray(acc.brokenItems)) return [...acc.brokenItems];
    const brokenCount = Number(acc.brokenQuantity||0);
    return Array.from({length: brokenCount}, (_, i) => ({
      sn: acc.brokenSNs?.[i] || '',
      model: acc.brokenModels?.[i] || '',
      cost: acc.brokenCosts?.[i] || '',
      purchaseDate: acc.brokenPurchaseDates?.[i] || '',
      warrantyDate: acc.brokenWarrantyDates?.[i] || '',
    }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutEmpId) return;
    const emp = employees.find(e => e.id === checkoutEmpId);
    if (!emp) return;

    try {
      if (checkoutModal.collectionName === 'accessories') {
        const item = accessories.find(a => a.id === checkoutModal.assetId);
        const remainingQty = item
          ? Math.max(0, Number(item.quantity||0) - (item.assignees?.length||0) - Number(item.brokenQuantity||0))
          : 0;

        if (item && remainingQty > 0) {
          const availItems = getAvailableItems(item);
          const idx = checkoutModal.snIndex ?? 0;
          const pickedItem = availItems[idx] || {};
          availItems.splice(idx, 1);

          const newAssignee = {
            checkoutId: Date.now().toString(),
            empId: emp.id,
            empName: `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`,
            serialNumber: pickedItem.sn || checkoutModal.sn || '',
            model: pickedItem.model || checkoutModal.itemModel || '',
            itemCost: pickedItem.cost || checkoutModal.itemCost || '',
            purchaseDate: pickedItem.purchaseDate || checkoutModal.itemPurchaseDate || '',
            warrantyDate: pickedItem.warrantyDate || checkoutModal.itemWarrantyDate || '',
          };

          await updateDoc(doc(db, 'accessories', checkoutModal.assetId), {
            assignees: [...(item.assignees || []), newAssignee],
            availableItems: availItems,
          });
          {
            const flat = flattenFields(checkoutCondition.fields);
            // NOTE: photos live in checkoutFields per-field; don't duplicate as flat
            // checkoutPhotos[] (would double doc size and hit Firestore's 1 MiB limit).
            // Only checklist (status-only, small) is kept for damage comparison.
            await addDoc(collection(db, 'accessories_transactions'), {
              empId: emp.id, empName: newAssignee.empName, assetId: checkoutModal.assetId, assetName: item.name, category: 'accessories', action: 'เบิกจ่าย',
              condition: 'ปกติ', remarks: `SN: ${newAssignee.serialNumber || '-'} | ${checkoutRemarks.trim() || '-'}`, timestamp: Date.now(),
              checkoutFields: checkoutCondition.fields,
              checkoutChecklist: flat.checklist,
              checkoutNotes: checkoutCondition.notes,
              checkoutId: newAssignee.checkoutId,
            });
          }
        } else {
          return setCustomAlert({ isOpen: true, title: 'ข้อผิดพลาด', message: 'จำนวนอุปกรณ์ไม่เพียงพอ', type: 'error' });
        }
      } else if (checkoutModal.collectionName === 'licenses') {
        const item = licenses.find(l => l.id === checkoutModal.assetId);
        if (!item) return;
        const totalQty = Number(item.quantity || 1);
        const currentAssignees = item.assignees || [];
        if (currentAssignees.length >= totalQty) {
          return setCustomAlert({ isOpen: true, title: 'ข้อผิดพลาด', message: 'สิทธิ์ License ถูกใช้งานครบแล้ว', type: 'error' });
        }
        // Transfer selected available slot's per-seat data to the new assignee
        const pickedIdx = checkoutModal.seatIndex ?? 0;
        const availableKeys = [...(item.availableKeys || [])];
        const availableKeyCodes = [...(item.availableKeyCodes || [])];
        const availableSeatCosts = [...(item.availableSeatCosts || [])];
        const oldDocMap = { ...(item.availableSeatDocs || {}) };
        const seatProductKey = availableKeys[pickedIdx] || '';
        const seatKeyCode = availableKeyCodes[pickedIdx] || '';
        const seatCost = availableSeatCosts[pickedIdx] || '';
        const seatDocuments = oldDocMap[String(pickedIdx)] || [];
        // Remove picked slot from arrays and re-index doc map
        availableKeys.splice(pickedIdx, 1);
        availableKeyCodes.splice(pickedIdx, 1);
        availableSeatCosts.splice(pickedIdx, 1);
        const totalAvailBefore = Math.max(0, totalQty - currentAssignees.length);
        const newDocMap = {};
        let newIdx = 0;
        for (let i = 0; i < totalAvailBefore; i++) {
          if (i === pickedIdx) continue;
          if (oldDocMap[String(i)]) newDocMap[String(newIdx)] = oldDocMap[String(i)];
          newIdx++;
        }
        const checkoutDate = new Date().toLocaleDateString('th-TH');
        const newAssignees = [...currentAssignees, {
          checkoutId: Date.now().toString(),
          empId: emp.id,
          empName: `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`,
          checkoutDate,
          remarks: checkoutRemarks.trim() || '',
          productKey: seatProductKey,
          keyCode: seatKeyCode,
          seatCost: seatCost,
          seatDocuments: seatDocuments,
        }];
        const newStatus = newAssignees.length >= totalQty ? 'ถูกใช้งาน' : 'พร้อมใช้งาน';
        await updateDoc(doc(db, 'licenses', checkoutModal.assetId), {
          assignees: newAssignees,
          status: newStatus,
          assignedTo: newAssignees.map(a => a.empId).join(','),
          assignedName: newAssignees.map(a => a.empName).join(', '),
          availableKeys,
          availableKeyCodes,
          availableSeatCosts,
          availableSeatDocs: newDocMap,
        });
        await addDoc(collection(db, 'licenses_transactions'), {
          empId: emp.id, assetName: item.name, category: 'licenses', action: 'เบิกจ่าย', condition: 'ปกติ', remarks: checkoutRemarks.trim() || '-', timestamp: Date.now()
        });
      } else {
        await updateDoc(doc(db, checkoutModal.collectionName, checkoutModal.assetId), {
          status: 'ถูกใช้งาน', assignedTo: emp.id, assignedName: `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`
        });
        const itemToCheckout = assets.find(a => a.id === checkoutModal.assetId);
        const empName = `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`;
        {
          const flat = flattenFields(checkoutCondition.fields);
          await addDoc(collection(db, 'assets_transactions'), {
            empId: emp.id, empName, assetId: checkoutModal.assetId, assetName: itemToCheckout ? itemToCheckout.name : '-', category: 'assets', action: 'เบิกจ่าย', condition: 'ปกติ', remarks: checkoutRemarks.trim() || '-', timestamp: Date.now(),
            checkoutFields: checkoutCondition.fields,
            checkoutChecklist: flat.checklist,
            checkoutNotes: checkoutCondition.notes,
          });
        }
      }
      setCheckoutModal({ isOpen: false, assetId: null, collectionName: '', sn: '', snIndex: undefined });
      setCheckoutEmpId(''); setCheckoutSearchTerm(''); setCheckoutRemarks('');
      setCheckoutCondition({ fields: EMPTY_FIELDS, notes: '' });
      setCustomAlert({ isOpen: true, title: 'สำเร็จ!', message: 'ทำรายการเบิกจ่ายเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

  const handleCheckin = (id, collectionName) => {
    showConfirm('ยืนยันการรับคืน', 'ต้องการรับคืนรายการนี้ใช่หรือไม่?', async () => {
        try {
          const itemArray = collectionName === 'assets' ? assets : licenses;
          const itemToReturn = itemArray.find(a => a.id === id);
          const empId = itemToReturn?.assignedTo;
          await updateDoc(doc(db, collectionName, id), { status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null });
          if (empId) {
            const txCollection = collectionName === 'assets' ? 'assets_transactions' : 'licenses_transactions';
            await addDoc(collection(db, txCollection), { empId: empId, assetName: itemToReturn ? itemToReturn.name : '-', category: collectionName, action: 'รับคืน', condition: 'ปกติ', remarks: '-', timestamp: Date.now() });
          }
        } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
      }, { confirmText: 'รับคืน', icon: 'return' }
    );
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    try {
      let collectionName = 'assets';
      let item = assets.find(a => a.id === returnModal.assetId);
      if (!item) { item = accessories.find(a => a.id === returnModal.assetId); collectionName = 'accessories'; }
      if (!item) { item = licenses.find(a => a.id === returnModal.assetId); collectionName = 'licenses'; }
      if (!item) return;

      if (collectionName === 'accessories' || collectionName === 'licenses') {
        const newAssignees = item.assignees ? item.assignees.filter(a => a.checkoutId !== returnModal.checkoutId) : [];
        const returnedItem = item.assignees ? item.assignees.find(a => a.checkoutId === returnModal.checkoutId) : null;
        const updateData = { assignees: newAssignees };

        if (collectionName === 'accessories') {
          if (returnCondition === 'broken') {
            const brokenItems = getBrokenItems(item);
            brokenItems.push({
              sn: returnedItem?.serialNumber || '',
              model: returnedItem?.model || '',
              cost: returnedItem?.itemCost || returnedItem?.customCost || '',
              purchaseDate: returnedItem?.purchaseDate || '',
              warrantyDate: returnedItem?.warrantyDate || '',
            });
            updateData.brokenQuantity = brokenItems.length;
            updateData.brokenItems = brokenItems;
          } else {
            const availItems = getAvailableItems(item);
            availItems.push({
              sn: returnedItem?.serialNumber || '',
              model: returnedItem?.model || '',
              cost: returnedItem?.itemCost || returnedItem?.customCost || '',
              purchaseDate: returnedItem?.purchaseDate || '',
              warrantyDate: returnedItem?.warrantyDate || '',
            });
            updateData.availableItems = availItems;
          }
        }

        if (collectionName === 'licenses') {
          const totalQty = Number(item.quantity || 1);
          updateData.status = newAssignees.length >= totalQty ? 'ถูกใช้งาน' : 'พร้อมใช้งาน';
          updateData.assignedTo = newAssignees.length > 0 ? newAssignees.map(a => a.empId).join(',') : null;
          updateData.assignedName = newAssignees.length > 0 ? newAssignees.map(a => a.empName).join(', ') : null;
          // Move returned assignee's per-seat data back to available arrays
          if (returnedItem) {
            const currentAvailCount = Math.max(0, totalQty - item.assignees.length);
            const newAvailCount = currentAvailCount + 1;
            updateData.availableKeys = [...(item.availableKeys || []), returnedItem.productKey || ''];
            updateData.availableKeyCodes = [...(item.availableKeyCodes || []), returnedItem.keyCode || ''];
            updateData.availableSeatCosts = [...(item.availableSeatCosts || []), returnedItem.seatCost || ''];
            const newDocMap = { ...(item.availableSeatDocs || {}) };
            if (returnedItem.seatDocuments?.length > 0) newDocMap[String(newAvailCount - 1)] = returnedItem.seatDocuments;
            updateData.availableSeatDocs = newDocMap;
          }
        } else {
          updateData.status = 'พร้อมใช้งาน'; updateData.assignedTo = null; updateData.assignedName = null;
        }
        await updateDoc(doc(db, collectionName, returnModal.assetId), updateData);
        const txCollection = collectionName === 'accessories' ? 'accessories_transactions' : 'licenses_transactions';
        {
          const flat = flattenFields(returnConditionData.fields);
          await addDoc(collection(db, txCollection), {
            empId: returnModal.empId, empName: returnModal.empName, assetId: returnModal.assetId, assetName: returnModal.assetName, category: collectionName, action: 'รับคืน',
            condition: returnCondition === 'broken' ? 'ชำรุด' : 'ปกติ',
            remarks: returnRemarks.trim() || '-', timestamp: Date.now(),
            returnFields: returnConditionData.fields,
            returnChecklist: flat.checklist,
            returnNotes: returnConditionData.notes,
            checkoutId: returnModal.checkoutId,
          });
        }

      } else {
        await updateDoc(doc(db, 'assets', returnModal.assetId), { status: returnCondition === 'broken' ? 'ชำรุดเสียหาย' : 'พร้อมใช้งาน', assignedTo: null, assignedName: null });
        {
          const flat = flattenFields(returnConditionData.fields);
          await addDoc(collection(db, 'assets_transactions'), {
            empId: returnModal.empId, empName: returnModal.empName, assetId: returnModal.assetId, assetName: returnModal.assetName, category: 'assets', action: 'รับคืน',
            condition: returnCondition === 'broken' ? 'ชำรุด' : 'ปกติ',
            remarks: returnRemarks.trim() || '-', timestamp: Date.now(),
            returnFields: returnConditionData.fields,
            returnChecklist: flat.checklist,
            returnNotes: returnConditionData.notes,
          });
        }
      }

      setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
      setReturnCondition('good'); setReturnRemarks('');
      setReturnConditionData({ fields: EMPTY_FIELDS, notes: '' });
      setCustomAlert({ isOpen: true, title: 'รับคืนสำเร็จ', message: 'รับคืนเข้าระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' }); }
  };

  const handleConfirmRepair = async (e) => {
    e.preventDefault();
    try {
      const { assetId, brokenIndex, brokenSN, brokenModel, brokenCost, brokenPurchaseDate, brokenWarrantyDate } = repairModal;
      const item = accessories.find(a => a.id === assetId);
      if (!item) return;

      const idx = brokenIndex ?? 0;
      const brokenItems = getBrokenItems(item);

      // Use data passed directly from modal (guaranteed correct), fallback to array
      const repairedItem = {
        sn: brokenSN ?? (brokenItems[idx]?.sn || ''),
        model: brokenModel ?? (brokenItems[idx]?.model || ''),
        cost: brokenCost ?? (brokenItems[idx]?.cost || ''),
        purchaseDate: brokenPurchaseDate ?? (brokenItems[idx]?.purchaseDate || ''),
        warrantyDate: brokenWarrantyDate ?? (brokenItems[idx]?.warrantyDate || ''),
      };

      brokenItems.splice(idx, 1);

      const availItems = getAvailableItems(item);
      availItems.push(repairedItem);

      const newBrokenQuantity = brokenItems.length;
      const newStatus = availItems.length > 0 ? 'พร้อมใช้งาน' : ((item.assignees?.length || 0) > 0 ? 'ถูกใช้งาน' : 'พร้อมใช้งาน');

      await updateDoc(doc(db, 'accessories', assetId), {
        brokenItems,
        brokenQuantity: newBrokenQuantity,
        availableItems: availItems,
        status: newStatus,
      });

      await addDoc(collection(db, 'accessories_transactions'), {
        assetId, assetName: item.name, category: 'accessories',
        action: 'ซ่อมเสร็จ/เข้าคลัง', condition: 'ปกติ',
        remarks: repairRemarks.trim() || '-', timestamp: Date.now(),
      });

      setRepairModal({ isOpen: false, assetId: null, assetName: null, maxRepair: 0, brokenIndex: undefined });
      setRepairQuantity(1); setRepairRemarks('');
      setCustomAlert({ isOpen: true, title: 'สำเร็จ!', message: 'นำอุปกรณ์กลับเข้าคลังเรียบร้อยแล้ว', type: 'success' });
    } catch (error) {
      setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' });
    }
  };

  // ── Helper: ชื่อเดือนภาษาไทยแบบสั้น ──
  const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  // ดึงรายการ "YYYY-MM" ที่ไม่ซ้ำ จากข้อมูล (เรียงใหม่→เก่า)
  const getUniqueMonths = (data) => {
    const set = new Set();
    (data || []).forEach(item => {
      if (!item.timestamp) return;
      const d = new Date(item.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      set.add(key);
    });
    return Array.from(set).sort().reverse();
  };

  // แปลง "2026-05" → "พ.ค. 2569"
  const formatMonthLabel = (monthStr) => {
    if (!monthStr || monthStr === 'ทั้งหมด') return monthStr || '';
    const [y, m] = monthStr.split('-');
    const year = Number(y) + 543; // ค.ศ. → พ.ศ.
    const monthName = TH_MONTHS_SHORT[Number(m) - 1] || '';
    return `${monthName} ${year}`;
  };

  // ดึงรายการ "YYYY-MM-DD" ที่ไม่ซ้ำ (เรียงใหม่→เก่า)
  const getUniqueDates = (data) => {
    const set = new Set();
    (data || []).forEach(item => {
      if (!item.timestamp) return;
      const d = new Date(item.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      set.add(key);
    });
    return Array.from(set).sort().reverse();
  };

  // แปลง "2026-05-21" → "21 พ.ค. 2569"
  const formatDateLabel = (dateStr) => {
    if (!dateStr || dateStr === 'ทั้งหมด') return dateStr || '';
    const [y, m, d] = dateStr.split('-');
    const year = Number(y) + 543;
    const monthName = TH_MONTHS_SHORT[Number(m) - 1] || '';
    return `${Number(d)} ${monthName} ${year}`;
  };

  let baseData = [];
  if (activeMenu === 'assets') baseData = assets.filter(item => (assetFilterType === 'ทั้งหมด' || item.type === assetFilterType) && (assetFilterStatus === 'ทั้งหมด' || (item.status || 'พร้อมใช้งาน') === assetFilterStatus) && (assetFilterDepartment === 'ทั้งหมด' || item.forDepartment === assetFilterDepartment));
  else if (activeMenu === 'licenses') baseData = licenses;
  else if (activeMenu === 'employees') baseData = showDeletedEmployees ? deletedEmployees : employees;
  else if (activeMenu === 'accessories') baseData = accessories.filter(item => accFilterType === 'ทั้งหมด' || item.type === accFilterType);
  else if (activeMenu === 'office_supplies') {
    baseData = officeSupplies.filter(item => {
      if (officeSupplyStockFilter === 'ทั้งหมด') return true;
      const qty = Number(item.quantity);
      if (officeSupplyStockFilter === 'หมดสต็อก') return qty <= 0;
      if (officeSupplyStockFilter === 'ใกล้หมด') return qty > 0 && qty <= 5;
      if (officeSupplyStockFilter === 'ปกติ') return qty > 5;
      return true;
    });
  }

  let currentData = baseData;
  if (searchTerm.trim() !== '') {
    const lowerCaseTerm = searchTerm.toLowerCase();
    currentData = baseData.filter(item => {
      if (activeMenu === 'employees') return (item.fullName?.toLowerCase().includes(lowerCaseTerm) || item.fullNameEng?.toLowerCase().includes(lowerCaseTerm) || item.empId?.toLowerCase().includes(lowerCaseTerm) || item.nickname?.toLowerCase().includes(lowerCaseTerm));
      else return (item.name?.toLowerCase().includes(lowerCaseTerm) || item.type?.toLowerCase().includes(lowerCaseTerm));
    });
  }

  // ── Filter repair requests ──
  let currentRepairRequests = repairRequests.filter(req => {
    if (repairFilterStatus !== 'ทั้งหมด' && req.status !== repairFilterStatus) return false;
    if (req.timestamp) {
      const d = new Date(req.timestamp);
      if (repairFilterYear  !== 'ทั้งหมด' && String(d.getFullYear()) !== repairFilterYear) return false;
      if (repairFilterMonth !== 'ทั้งหมด' && String(d.getMonth() + 1).padStart(2, '0') !== repairFilterMonth) return false;
      if (repairFilterDay   !== 'ทั้งหมด' && String(d.getDate()).padStart(2, '0') !== repairFilterDay) return false;
    }
    return true;
  });

  // ── Filter supply requests ──
  let currentSupplyRequests = supplyRequests.filter(req => {
    if (supplyFilterStatus !== 'ทั้งหมด' && req.status !== supplyFilterStatus) return false;
    if (req.timestamp) {
      const d = new Date(req.timestamp);
      if (supplyFilterYear  !== 'ทั้งหมด' && String(d.getFullYear()) !== supplyFilterYear) return false;
      if (supplyFilterMonth !== 'ทั้งหมด' && String(d.getMonth() + 1).padStart(2, '0') !== supplyFilterMonth) return false;
      if (supplyFilterDay   !== 'ทั้งหมด' && String(d.getDate()).padStart(2, '0') !== supplyFilterDay) return false;
    }
    return true;
  });

  const handleSelectEmployee = (e, id) => e.target.checked ? setSelectedEmployeeIds(prev => [...prev, id]) : setSelectedEmployeeIds(prev => prev.filter(empId => empId !== id));
  const handleSelectAllEmployees = (e) => e.target.checked ? setSelectedEmployeeIds(currentData.map(emp => emp.id)) : setSelectedEmployeeIds([]);
  const handleSelectAccessory = (e, id) => e.target.checked ? setSelectedAccessoryIds(prev => [...prev, id]) : setSelectedAccessoryIds(prev => prev.filter(itemId => itemId !== id));
  const handleSelectAllAccessories = (e) => e.target.checked ? setSelectedAccessoryIds(currentData.map(item => item.id)) : setSelectedAccessoryIds([]);
  const handleSelectOfficeSupply = (e, id) => e.target.checked ? setSelectedOfficeSupplyIds(prev => [...prev, id]) : setSelectedOfficeSupplyIds(prev => prev.filter(itemId => itemId !== id));
  const handleSelectAllOfficeSupplies = (e) => e.target.checked ? setSelectedOfficeSupplyIds(currentData.map(item => item.id)) : setSelectedOfficeSupplyIds([]);
  const handleSelectLicense = (e, id) => e.target.checked ? setSelectedLicenseIds(prev => [...prev, id]) : setSelectedLicenseIds(prev => prev.filter(itemId => itemId !== id));
  const handleSelectAllLicenses = (e) => e.target.checked ? setSelectedLicenseIds(currentData.map(item => item.id)) : setSelectedLicenseIds([]);

  const menuTitle = activeMenu === 'dashboard' ? 'ภาพรวมระบบ (Dashboard)' :
                    activeMenu === 'kpi_dashboard' ? 'รายงาน KPI งานซ่อม &amp; ความพึงพอใจ' :
                    activeMenu === 'assets' ? 'ทรัพย์สิน IT หลัก' :
                    activeMenu === 'licenses' ? 'โปรแกรม/ใบอนุญาต' : 
                    activeMenu === 'accessories' ? 'อุปกรณ์เสริม (Accessories)' : 
                    activeMenu === 'repairs' ? 'แจ้งปัญหา IT' : 
                    activeMenu === 'office_supplies' ? 'คลังอุปกรณ์สำนักงาน' : 
                    activeMenu === 'supply_requests' ? 'คำขอเบิกอุปกรณ์' : 
                    activeMenu === 'replacement_requests' ? 'คำขอเปลี่ยนเครื่อง' :
                    activeMenu === 'users' ? 'จัดการผู้ใช้งานระบบ' :
                    activeMenu === 'system_settings' ? 'ตั้งค่าระบบ' : 'ข้อมูลพนักงาน';

  const checkLicenseExpiration = (expirationDate) => {
    if (!expirationDate) return { isExpiring: false, statusText: '', colorClass: '' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)   return { isExpiring: true, statusText: 'หมดอายุแล้ว',              colorClass: 'text-red-600 bg-red-50 ring-red-200' };
    if (diffDays <= 30) return { isExpiring: true, statusText: `เหลืออีก ${diffDays} วัน`, colorClass: 'text-red-600 bg-red-50 ring-red-200' };
    if (diffDays <= 90) return { isExpiring: true, statusText: `เหลืออีก ${diffDays} วัน`, colorClass: 'text-amber-600 bg-amber-50 ring-amber-200' };
    return { isExpiring: false, statusText: '', colorClass: '' };
  };

  // เช็คสิทธิ์เข้าถึงเมนู — ใช้กรองการแจ้งเตือนตามสิทธิ์ของ user
  const hasRepairsMenuAccess  = isSuperAdmin || (adminPermissions?.menus || []).includes('repairs');
  const hasSuppliesMenuAccess = isSuperAdmin || (adminPermissions?.menus || []).includes('supply_requests');
  const hasLicensesMenuAccess = isSuperAdmin || (adminPermissions?.menus || []).includes('licenses');
  const pendingRepairsCount = (authRole === 'admin' && hasRepairsMenuAccess) ? repairRequests.filter(req => req.status === 'รอดำเนินการ').length : 0;
  const pendingSuppliesCount = (authRole !== 'admin' || hasSuppliesMenuAccess) ? supplyRequests.filter(req => req.status === 'รอดำเนินการ').length : 0;
  const expiringLicensesCount = (authRole === 'admin' && hasLicensesMenuAccess) ? licenses.filter(lic => checkLicenseExpiration(lic.expirationDate).isExpiring).length : 0;
  
  const totalPendingCount = pendingRepairsCount + pendingSuppliesCount + expiringLicensesCount;
  const totalSystemItems = assets.length + licenses.length + accessories.length + employees.length;
  const currentDataLength = currentData.length;

  if (authLoading || (authRole === 'admin' && permLoading)) return (<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#1E487A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div></div>);
  
  if (authRole === null) return (
    <React.Fragment>
      <LoginView showAdminLogin={showAdminLogin} setShowAdminLogin={setShowAdminLogin} setAuthRole={setAuthRole} loginForm={loginForm} setLoginForm={setLoginForm} handleAdminLogin={handleAdminLogin} loginError={loginError} setLoginError={setLoginError} loginLoading={loginLoading} />
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
    </React.Fragment>
  );
  
  if (authRole === 'staff') return (
    <React.Fragment>
      <StaffView 
        setAuthRole={setAuthRole} currentStaff={currentStaff} setCurrentStaff={setCurrentStaff} 
        staffEmpIdInput={staffEmpIdInput} setStaffEmpIdInput={setStaffEmpIdInput} 
        staffPasswordInput={staffPasswordInput} setStaffPasswordInput={setStaffPasswordInput} 
        handleStaffLogin={handleStaffLogin} 
        staffRepairForm={staffRepairForm} setStaffRepairForm={setStaffRepairForm} handleSubmitRepairRequest={handleSubmitRepairRequest} 
        repairRequests={repairRequests} editStaffRepairModal={editStaffRepairModal} setEditStaffRepairModal={setEditStaffRepairModal} 
        handleStaffUpdateRepair={handleStaffUpdateRepair} handleStaffDeleteRepair={handleStaffDeleteRepair} 
        officeSupplies={officeSupplies} supplyRequests={supplyRequests} handleStaffSubmitSupplyRequest={handleStaffSubmitSupplyRequest} 
        assets={assets} accessories={accessories} licenses={licenses} 
        replacementRequests={replacementRequests}
        handleStaffSubmitReplacement={handleStaffSubmitReplacement}
        handleSubmitEvaluation={handleSubmitEvaluation}
      />
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
    </React.Fragment>
  );

  return (
    <div className="flex h-screen bg-[#F1F5FA] text-slate-900 font-sans">
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        onChangePassword={() => setChangePasswordModal(true)}
        authRole={authRole}
        isSuperAdmin={isSuperAdmin}
        allowedMenus={isSuperAdmin ? null : adminPermissions?.menus || []}
        canManageUsers={isSuperAdmin || adminPermissions?.canManagePasswords === true}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-transparent min-w-0">
        <TopHeader menuTitle={menuTitle} notifRef={notifRef} isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} totalPendingCount={totalPendingCount} pendingRepairsCount={pendingRepairsCount} pendingSuppliesCount={pendingSuppliesCount} expiringLicensesCount={expiringLicensesCount} setActiveMenu={setActiveMenu} activeMenu={activeMenu} totalSystemItems={totalSystemItems} currentDataLength={currentDataLength} handleLogout={handleLogout} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} authRole={authRole} isSuperAdmin={isSuperAdmin} userName={adminDisplayName} onOpenSidebar={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-8">
          {activeMenu === 'field_options' ? (
            <DropdownOptionsManager
              fieldOptions={fieldOptions}
              onSave={handleSaveFieldOptions}
              saving={savingFieldOptions}
            />
          ) : activeMenu === 'it_report' ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center max-w-md">
                <div
                  className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg shadow-[#1E487A]/20 ring-1 ring-white/50"
                  style={{ background: 'linear-gradient(135deg, #1E487A 0%, #163963 100%)' }}
                >
                  <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h2 className="text-[23px] font-semibold text-slate-900 tracking-tight">สร้าง IT Monthly Report</h2>
                <p className="text-slate-500 mt-2 text-[14.5px] leading-relaxed">
                  ระบบจะดึงข้อมูล Hardware, Software, Support จากระบบโดยอัตโนมัติ และ Export เป็นไฟล์ .pptx พร้อม Present
                </p>
              </div>
              <button
                onClick={() => setIsITReportOpen(true)}
                className="flex items-center gap-2 px-7 py-3.5 bg-[#1E487A] hover:bg-[#163963] text-white rounded-xl font-semibold text-[15px] transition-all shadow-lg"
                style={{ boxShadow: '0 8px 20px rgba(30,72,122,0.30)' }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                สร้างไฟล์ Report
              </button>
            </div>
          ) : activeMenu === 'dashboard' ? (
            <DashboardStats assets={assets} licenses={licenses} accessories={accessories} employees={employees} />
          ) : activeMenu === 'kpi_dashboard' ? (
            <KpiDashboard repairRequests={repairRequests} />
          ) : activeMenu === 'repairs' ? (
            <RepairTable repairRequests={repairRequests} currentRepairRequests={currentRepairRequests} repairFilterYear={repairFilterYear} setRepairFilterYear={setRepairFilterYear} repairFilterMonth={repairFilterMonth} setRepairFilterMonth={setRepairFilterMonth} repairFilterDay={repairFilterDay} setRepairFilterDay={setRepairFilterDay} repairFilterStatus={repairFilterStatus} setRepairFilterStatus={setRepairFilterStatus} handleUpdateRepairRequestStatus={handleUpdateRepairRequestStatus} handleDeleteRepairRequest={handleDeleteRepairRequest} canEdit={canEdit} />
          ) : activeMenu === 'supply_requests' ? (
            <SupplyRequestTable supplyRequests={supplyRequests} currentSupplyRequests={currentSupplyRequests} supplyFilterYear={supplyFilterYear} setSupplyFilterYear={setSupplyFilterYear} supplyFilterMonth={supplyFilterMonth} setSupplyFilterMonth={setSupplyFilterMonth} supplyFilterDay={supplyFilterDay} setSupplyFilterDay={setSupplyFilterDay} supplyFilterStatus={supplyFilterStatus} setSupplyFilterStatus={setSupplyFilterStatus} handleUpdateSupplyRequestStatus={handleUpdateSupplyRequestStatus} handleDelete={handleDelete} canEdit={canEdit} />
          ) : activeMenu === 'replacement_requests' ? (
            <ReplacementRequestTable
              replacementRequests={replacementRequests}
              handleUpdateReplacementStatus={handleUpdateReplacementStatus}
              handleDeleteReplacement={handleDeleteReplacement}
            />
          ) : activeMenu === 'users' ? (
            <UserManagementPage
              isSuperAdmin={isSuperAdmin}
              canManagePasswords={adminPermissions?.canManagePasswords === true}
            />
          ) : activeMenu === 'system_settings' ? (
            <SystemSettingsPage isSuperAdmin={isSuperAdmin} />
          ) : (
            <div className="h-full flex flex-col">
              <div className="bg-white p-6 md:p-7 rounded-2xl shadow-sm ring-1 ring-slate-200/70 flex flex-col flex-1">
                <ActionBar
                  menuTitle={menuTitle} activeMenu={activeMenu} searchTerm={searchTerm} setSearchTerm={setSearchTerm} showDeletedEmployees={showDeletedEmployees} setShowDeletedEmployees={setShowDeletedEmployees} setIsImportModalOpen={setIsImportModalOpen} handleExportEmployees={handleExportEmployees}
                  selectedEmployeeIds={selectedEmployeeIds} setConfirmDeleteModal={setConfirmDeleteModal} assetFilterDepartment={assetFilterDepartment} setAssetFilterDepartment={setAssetFilterDepartment} assetFilterType={assetFilterType} setAssetFilterType={setAssetFilterType} assetFilterStatus={assetFilterStatus} setAssetFilterStatus={setAssetFilterStatus} accFilterType={accFilterType} setAccFilterType={setAccFilterType}
                  handleExportAccessories={handleExportAccessories} selectedAccessoryIds={selectedAccessoryIds} officeSupplyStockFilter={officeSupplyStockFilter} setOfficeSupplyStockFilter={setOfficeSupplyStockFilter} selectedOfficeSupplyIds={selectedOfficeSupplyIds} setIsAddModalOpen={setIsAddModalOpen} handleExportAssets={handleExportAssets} handleExportOfficeSupplies={handleExportOfficeSupplies} visibleAssetColumns={visibleAssetColumns} setVisibleAssetColumns={setVisibleAssetColumns}
                  handleExportLicenses={handleExportLicenses} selectedLicenseIds={selectedLicenseIds}
                  visibleLicenseColumns={visibleLicenseColumns} setVisibleLicenseColumns={setVisibleLicenseColumns}
                  canEdit={canEdit}
                />
                
                {currentData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center mb-3">
                      <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    </div>
                    <p className="font-medium text-[15px] text-slate-500">ไม่พบข้อมูลที่ค้นหา</p>
                    <p className="text-[13px] text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือปรับตัวกรอง</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1 rounded-xl ring-1 ring-slate-200 bg-white">
                    {activeMenu === 'employees' ? (
                      <EmployeeTable currentData={currentData} selectedEmployeeIds={selectedEmployeeIds} handleSelectAllEmployees={handleSelectAllEmployees} handleSelectEmployee={handleSelectEmployee} setSelectedEmployee={setSelectedEmployee} setEmpModalTab={setEmpModalTab} showDeletedEmployees={showDeletedEmployees} handleRestoreEmployee={handleRestoreEmployee} openEditEmpModal={openEditEmpModal} setConfirmDeleteModal={setConfirmDeleteModal} canEdit={canEdit} />
                    ) : activeMenu === 'licenses' ? (
                      <LicenseTable
                        currentData={currentData}
                        selectedLicenseIds={selectedLicenseIds}
                        handleSelectAllLicenses={handleSelectAllLicenses}
                        handleSelectLicense={handleSelectLicense}
                        setSelectedAssetDetail={setSelectedAssetDetail}
                        setSelectedAssetCategory={setSelectedAssetCategory}
                        checkLicenseExpiration={checkLicenseExpiration}
                        setCheckoutModal={setCheckoutModal}
                        handleCheckin={handleCheckin}
                        openEditLicenseModal={openEditLicenseModal}
                        setConfirmDeleteModal={setConfirmDeleteModal}
                        visibleLicenseColumns={visibleLicenseColumns}
                        canEdit={canEdit}
                      />
                    ) : activeMenu === 'office_supplies' ? (
                      <OfficeSupplyTable currentData={currentData} selectedOfficeSupplyIds={selectedOfficeSupplyIds} handleSelectAllOfficeSupplies={handleSelectAllOfficeSupplies} handleSelectOfficeSupply={handleSelectOfficeSupply} openEditAssetModal={openEditAssetModal} setConfirmDeleteModal={setConfirmDeleteModal} activeMenu={activeMenu} canEdit={canEdit} />
                    ) : activeMenu === 'accessories' ? (
                      <AccessoryTable currentData={currentData} selectedAccessoryIds={selectedAccessoryIds} handleSelectAllAccessories={handleSelectAllAccessories} handleSelectAccessory={handleSelectAccessory} setSelectedAssetDetail={setSelectedAssetDetail} setSelectedAssetCategory={setSelectedAssetCategory} setCheckoutModal={setCheckoutModal} openEditAssetModal={openEditAssetModal} setConfirmDeleteModal={setConfirmDeleteModal} canEdit={canEdit} />
                    ) : activeMenu === 'assets' ? (
                      <AssetTable currentData={currentData} setSelectedAssetDetail={setSelectedAssetDetail} setSelectedAssetCategory={setSelectedAssetCategory} setCheckoutModal={setCheckoutModal} setReturnModal={setReturnModal} openEditAssetModal={openEditAssetModal} setConfirmDeleteModal={setConfirmDeleteModal} visibleAssetColumns={visibleAssetColumns} canEdit={canEdit} />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <ModalsContainer 
        isAddModalOpen={isAddModalOpen} setIsAddModalOpen={setIsAddModalOpen} activeMenu={activeMenu} handleAddEmployee={handleAddEmployee} empForm={empForm} handleEmpChange={handleEmpChange} handleAddLicense={handleAddLicense} licenseForm={licenseForm} handleLicenseChange={handleLicenseChange} licenseImage={licenseImage} setLicenseImage={setLicenseImage} handleAdd={handleAdd} name={name} setName={setName} type={type} setType={setType} cost={cost} setCost={setCost} purchaseDate={purchaseDate} setPurchaseDate={setPurchaseDate} warrantyDate={warrantyDate} setWarrantyDate={setWarrantyDate} quantity={quantity} setQuantity={setQuantity} unit={unit} setUnit={setUnit} assetImage={assetImage} setAssetImage={setAssetImage} assetDepartment={assetDepartment} setAssetDepartment={setAssetDepartment} sn={sn} setSn={setSn} company={company} setCompany={setCompany} assetTag={assetTag} setAssetTag={setAssetTag} model={model} setModel={setModel} vendor={vendor} setVendor={setVendor} note={note} setNote={setNote} assetDocument={assetDocument} setAssetDocument={setAssetDocument} fieldOptions={fieldOptions}
        checkoutModal={checkoutModal} setCheckoutModal={setCheckoutModal} handleCheckout={handleCheckout} checkoutSearchTerm={checkoutSearchTerm} setCheckoutSearchTerm={setCheckoutSearchTerm} checkoutEmpId={checkoutEmpId} setCheckoutEmpId={setCheckoutEmpId} employees={employees} checkoutRemarks={checkoutRemarks} setCheckoutRemarks={setCheckoutRemarks} checkoutCondition={checkoutCondition} setCheckoutCondition={setCheckoutCondition}
        selectedEmployee={selectedEmployee} setSelectedEmployee={setSelectedEmployee} empModalTab={empModalTab} setEmpModalTab={setEmpModalTab} assets={assets} licenses={licenses} accessories={accessories} transactions={transactions} openEditEmpModal={openEditEmpModal} handleCheckin={handleCheckin} setReturnModal={setReturnModal}
        selectedAssetDetail={selectedAssetDetail} setSelectedAssetDetail={setSelectedAssetDetail} selectedAssetCategory={selectedAssetCategory} setSelectedAssetCategory={setSelectedAssetCategory} openEditLicenseModal={openEditLicenseModal} openEditAssetModal={openEditAssetModal} showConfirm={showConfirm} setCustomAlert={setCustomAlert}
        editEmpModal={editEmpModal} setEditEmpModal={setEditEmpModal} handleUpdateEmployee={handleUpdateEmployee} handleEditEmpChange={handleEditEmpChange}
        editAssetModal={editAssetModal} setEditAssetModal={setEditAssetModal} handleUpdateAsset={handleUpdateAsset} handleEditAssetChange={handleEditAssetChange}
        editLicenseModal={editLicenseModal} setEditLicenseModal={setEditLicenseModal} handleUpdateLicense={handleUpdateLicense} handleEditLicenseChange={handleEditLicenseChange}
        isImportModalOpen={isImportModalOpen} setIsImportModalOpen={setIsImportModalOpen} handleDownloadTemplate={handleDownloadTemplate} handleImportEmployees={handleImportEmployees} activeMenu={activeMenu}
        returnModal={returnModal} returnCondition={returnCondition} setReturnCondition={setReturnCondition} returnRemarks={returnRemarks} setReturnRemarks={setReturnRemarks} handleConfirmReturn={handleConfirmReturn} returnConditionData={returnConditionData} setReturnConditionData={setReturnConditionData}
        repairModal={repairModal} setRepairModal={setRepairModal} repairQuantity={repairQuantity} setRepairQuantity={setRepairQuantity} repairRemarks={repairRemarks} setRepairRemarks={setRepairRemarks} handleConfirmRepair={handleConfirmRepair}
        confirmDeleteModal={confirmDeleteModal} setConfirmDeleteModal={setConfirmDeleteModal} executeDelete={executeDelete}
        confirmModal={confirmModal} handleConfirmModalOk={handleConfirmModalOk} closeConfirmModal={closeConfirmModal}
        resetPasswordModal={resetPasswordModal} setResetPasswordModal={setResetPasswordModal}
        changePasswordModal={changePasswordModal} setChangePasswordModal={setChangePasswordModal}
      />
      <ITReportModal
        isOpen={isITReportOpen}
        onClose={() => setIsITReportOpen(false)}
        employees={employees}
        repairRequests={repairRequests}
        assets={assets}
        accessories={accessories}
        licenses={licenses}
      />
    </div>
  );
}

export default App;