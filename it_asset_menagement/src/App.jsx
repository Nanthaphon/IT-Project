import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { db, auth, VERCEL_API_BASE } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════
// 📱 LINE Notification ผ่าน serverless endpoint /api/staff-notify
// (รองรับทั้ง staff submit และ admin event เช่น license expiry)
// ═══════════════════════════════════════════════════════════════
async function sendLineNotification({ kind, facts }) {
  const user = auth.currentUser;
  if (!user) {
    console.warn('sendLineNotification: ไม่มี user login — ข้ามการแจ้งเตือน');
    return;
  }
  const idToken = await user.getIdToken();

  const resp = await fetch(`${VERCEL_API_BASE}/api/staff-notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ kind, facts }),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`LINE notify failed (${resp.status}): ${errText}`);
  }
}

import useFirebaseData from './hooks/useFirebaseData.jsx';
import useAdminPermissions from './hooks/useAdminPermissions.jsx';
import useGlobalLoading from './hooks/useGlobalLoading.jsx';
import GlobalLoadingOverlay from './components/GlobalLoadingOverlay.jsx';
import Sidebar from './components/Sidebar.jsx';
import { formatDateShort } from './utils/formatDate.js';
import { useActiveTab } from './hooks/useActiveTab.js';
import { EMPTY_CHECKLIST, EMPTY_FIELDS, flattenFields } from './components/ConditionCapture.jsx';
import TopHeader from './components/TopHeader.jsx';
import DashboardStats from './components/DashboardStats.jsx';
import ActionBar from './components/ActionBar.jsx';
import CustomAlert from './components/CustomAlert.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import LoginView from './components/LoginView.jsx';
import ModalsContainer from './components/ModalsContainer.jsx';

// 🆕 Lazy load — โหลดเมื่อจำเป็นเท่านั้น เพื่อลด initial bundle size
const StaffView             = lazy(() => import('./components/StaffView.jsx'));
const KpiDashboard          = lazy(() => import('./components/KpiDashboard.jsx'));
const ITReportModal         = lazy(() => import('./components/ITReportModal.jsx'));
const DropdownOptionsManager = lazy(() => import('./components/DropdownOptionsManager.jsx'));
const UserManagementPage    = lazy(() => import('./components/UserManagementPage.jsx'));
const SnipeITImportModal    = lazy(() => import('./components/SnipeITImportModal.jsx'));

import EmployeeTable from './components/EmployeeTable.jsx';
import LicenseTable from './components/LicenseTable.jsx';
import OfficeSupplyTable from './components/OfficeSupplyTable.jsx';
import AssetTable from './components/AssetTable.jsx';
import AccessoryTable from './components/AccessoryTable.jsx';
import RepairTable from './components/RepairTable.jsx';
import SupplyRequestTable from './components/SupplyRequestTable.jsx';
import ReplacementRequestTable from './components/ReplacementRequestTable.jsx';
import AccessoryRequestTable from './components/AccessoryRequestTable.jsx';
import TablePagination from './components/TablePagination.jsx';

// Fallback spinner สำหรับ lazy-loaded routes
const LazyFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-3 border-slate-200 border-t-[#1E487A] rounded-full animate-spin" />
  </div>
);

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
  const [staffMustChangePassword, setStaffMustChangePassword] = useState(false);
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
  
  // 🆕 active tab guard — เปิดหลายแท็บแล้วเฉพาะแท็บที่โฟกัสล่าสุดจะทำ side-effect (toast/popup/LINE)
  const isActiveTab = useActiveTab();

  const {
    assets, accessories, employees, deletedEmployees, licenses,
    repairRequests, officeSupplies, supplyRequests, transactions, replacementRequests,
    accessoryRequests,
    fieldOptions, bundledItems,
  } = useFirebaseData(authRole);

  const { isSuperAdmin, adminPermissions, displayName: adminDisplayName, permLoading } = useAdminPermissions(currentUid, authRole);
  const canEdit = isSuperAdmin || adminPermissions?.level === 'full';

  // ── Global loading overlay (สำหรับ async operations ทั้งระบบ) ──
  const { isLoading: globalLoading, message: globalLoadingMsg, withLoading } = useGlobalLoading();

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState([]);
  const [selectedOfficeSupplyIds, setSelectedOfficeSupplyIds] = useState([]);
  const [selectedLicenseIds, setSelectedLicenseIds] = useState([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState([]); // 🆕 เลือกทรัพย์สินรายตัวเพื่อพิมพ์ PDF (คงอยู่ข้ามการค้นหา)

  const [name, setName] = useState('');
  const [type, setType] = useState('คอมพิวเตอร์');
  const [cost, setCost] = useState('');
  const [scrapValue, setScrapValue] = useState('');  // 🆕 ราคาขายซาก
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
  const [remark, setRemark] = useState('');
  const [assetDocument, setAssetDocument] = useState(null);
  const [purchaseCondition, setPurchaseCondition] = useState('new'); // 'new' | 'used'

  const [empForm, setEmpForm] = useState({
    fullName: '', fullNameEng: '', empId: '', department: '',
    company: '', position: '', nickname: '', manager: '', phone: '',
    m365Email: '', m365Password: '', startDate: ''
  });
  const [licenseForm, setLicenseForm] = useState({
    name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: '', quantity: 1, note: ''
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
  const [isSnipeITImportOpen, setIsSnipeITImportOpen] = useState(false);
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

  // 🆕 localStorage helper (ต้องประกาศก่อน useState ที่เรียกใช้)
  //    type-check ค่าที่ load มา ต้องตรงกับ shape ของ fallback (Array/Object)
  //    เพื่อป้องกัน legacy data ที่อาจเป็น string เก่า "ทั้งหมด" ทำให้ MultiSelect crash
  const loadLS = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      if (!v) return fallback;
      const parsed = JSON.parse(v);
      // ถ้า fallback เป็น array แต่ parsed ไม่ใช่ → ใช้ fallback
      if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
      // ถ้า fallback เป็น object (column visibility) แต่ parsed ไม่ใช่ → ใช้ fallback
      if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)
          && (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))) return fallback;
      return parsed;
    } catch { return fallback; }
  };

  const [visibleAssetColumns, setVisibleAssetColumns] = useState(() => loadLS('cols:asset', {
    name: true, type: true, forDepartment: false, cost: true, status: true,
    assetTag: false, sn: false, model: false, vendor: false, company: false,
    purchaseDate: false, warrantyDate: false, assignedName: false,
    note: false, age: false, scrapValue: false, remark: false,  // 🆕
  }));
  const [visibleLicenseColumns, setVisibleLicenseColumns] = useState(() => loadLS('cols:license', {
    image: true, name: true, productKey: true, supplier: true,
    purchaseDate: false, expirationDate: true, cost: true, quantity: true, status: true,
  }));

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) { if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  // 🆕 Global Modal Scroll Lock — กันการเลื่อน/กระทำกับพื้นหลังเมื่อมี overlay ใดๆ เปิด
  // - ใช้ querySelector `[class*="fixed"][class*="inset-0"]` ตรวจเฉพาะ tailwind overlay → เร็ว
  // - throttle observer ด้วย requestAnimationFrame
  // - ครอบคลุม custom modal ที่ไม่ใช้ Modal primitive ทุกตัว
  useEffect(() => {
    let savedStyles = null;
    let scanScheduled = false;

    const isOverlay = (el) => {
      const cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
      const z = parseInt(cs.zIndex, 10);
      if (isNaN(z) || z < 40) return false;
      const bg = cs.backgroundColor;
      if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return false;
      return true;
    };

    const setLock = (shouldLock) => {
      const scrollContainer = document.getElementById('main-scroll-container');
      if (shouldLock && !savedStyles) {
        const sbw = window.innerWidth - document.documentElement.clientWidth;
        savedStyles = {
          bodyOverflow: document.body.style.overflow,
          htmlOverflow: document.documentElement.style.overflow,
          bodyPadR:     document.body.style.paddingRight,
          mainOverflow: scrollContainer?.style.overflow ?? null,
        };
        if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        if (scrollContainer) scrollContainer.style.overflow = 'hidden';
      } else if (!shouldLock && savedStyles) {
        document.body.style.overflow = savedStyles.bodyOverflow;
        document.documentElement.style.overflow = savedStyles.htmlOverflow;
        document.body.style.paddingRight = savedStyles.bodyPadR;
        if (scrollContainer && savedStyles.mainOverflow !== null) {
          scrollContainer.style.overflow = savedStyles.mainOverflow;
        }
        savedStyles = null;
      }
    };

    const scan = () => {
      scanScheduled = false;
      // 🆕 ข้าม overlay ที่ tag ด้วย data-no-scroll-lock (loading/sidebar drawer ที่ไม่อยากให้ lock)
      const candidates = document.querySelectorAll('[class*="fixed"][class*="inset-0"]:not([data-no-scroll-lock])');
      let hasActive = false;
      for (const el of candidates) {
        if (isOverlay(el)) { hasActive = true; break; }
      }
      setLock(hasActive);
    };
    const schedule = () => {
      if (scanScheduled) return;
      scanScheduled = true;
      requestAnimationFrame(scan);
    };

    scan();
    const observer = new MutationObserver(schedule);
    // 🆕 ลด overhead — ดูแค่ childList (modal เข้า/ออก DOM) ไม่ดู attributes ทำให้ทุก transition ไม่ trigger observer
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      setLock(false);
    };
  }, []);

  const showConfirm = (title, message, onConfirm, opts = {}) => { setConfirmModal({ isOpen: true, title, message, onConfirm, confirmText: opts.confirmText || 'ยืนยัน', cancelText: opts.cancelText || 'ยกเลิก', icon: opts.icon || 'warning' }); };
  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  const handleConfirmModalOk = async () => { const fn = confirmModal.onConfirm; closeConfirmModal(); if (fn) await fn(); };

  // 🆕 Multi-select: array ของค่าที่เลือก (empty = ทั้งหมด) — persist ใน localStorage
  const [accFilterType, setAccFilterType]               = useState(() => loadLS('filter:accType', []));
  const [assetFilterType, setAssetFilterType]           = useState(() => loadLS('filter:assetType', []));
  const [assetFilterStatus, setAssetFilterStatus]       = useState(() => loadLS('filter:assetStatus', []));
  const [assetFilterDepartment, setAssetFilterDepartment] = useState(() => loadLS('filter:assetDept', []));
  const [repairFilterStatus, setRepairFilterStatus] = useState('ทั้งหมด'); 
  const [supplyFilterStatus, setSupplyFilterStatus] = useState('ทั้งหมด');
  const [repairFilterYear, setRepairFilterYear]   = useState('ทั้งหมด');
  const [repairFilterMonth, setRepairFilterMonth] = useState('ทั้งหมด');
  const [repairFilterDay, setRepairFilterDay]     = useState('ทั้งหมด');
  const [supplyFilterYear, setSupplyFilterYear]   = useState('ทั้งหมด');
  const [supplyFilterMonth, setSupplyFilterMonth] = useState('ทั้งหมด');
  const [supplyFilterDay, setSupplyFilterDay]     = useState('ทั้งหมด');
  const [officeSupplyStockFilter, setOfficeSupplyStockFilter] = useState('ทั้งหมด');
  // 🆕 Multi-select: array ของค่า ['หมดอายุแล้ว','30','60','90','ไม่ระบุ'] — persist
  const [licenseExpFilter, setLicenseExpFilter] = useState(() => loadLS('filter:licenseExp', []));
  const [showDeletedEmployees, setShowDeletedEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 🆕 Sync filters + columns ลง localStorage ทุกครั้งที่เปลี่ยน
  useEffect(() => { try { localStorage.setItem('filter:assetType',   JSON.stringify(assetFilterType)); } catch {} }, [assetFilterType]);
  useEffect(() => { try { localStorage.setItem('filter:assetStatus', JSON.stringify(assetFilterStatus)); } catch {} }, [assetFilterStatus]);
  useEffect(() => { try { localStorage.setItem('filter:assetDept',   JSON.stringify(assetFilterDepartment)); } catch {} }, [assetFilterDepartment]);
  useEffect(() => { try { localStorage.setItem('filter:accType',     JSON.stringify(accFilterType)); } catch {} }, [accFilterType]);
  useEffect(() => { try { localStorage.setItem('filter:licenseExp',  JSON.stringify(licenseExpFilter)); } catch {} }, [licenseExpFilter]);
  useEffect(() => { try { localStorage.setItem('cols:asset',         JSON.stringify(visibleAssetColumns)); } catch {} }, [visibleAssetColumns]);
  useEffect(() => { try { localStorage.setItem('cols:license',       JSON.stringify(visibleLicenseColumns)); } catch {} }, [visibleLicenseColumns]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUid(user.uid);
        // เช็ค custom claim จาก ID token — staff login จะมี role: 'staff'
        let role = null;
        let tokenResult = null;
        try {
          tokenResult = await user.getIdTokenResult();
          role = tokenResult.claims?.role || null;
        } catch (e) { /* ignore */ }

        if (role === 'staff') {
          // Staff signed in via custom token — set role + try to restore currentStaff จาก claim
          setAuthRole('staff');
          try {
            // ใช้ token เดิมที่ดึงมาแล้ว — ไม่ต้องเรียก getIdTokenResult ซ้ำ
            const empDocId = tokenResult?.claims?.empDocId;
            if (empDocId) {
              const empSnap = await getDoc(doc(db, 'employees', empDocId));
              if (empSnap.exists()) {
                setCurrentStaff({ id: empSnap.id, ...empSnap.data() });
              }
            }
          } catch (e) { /* ignore */ }
        } else {
          // Admin/HR — อ่าน admin_users เฉพาะเมื่อ email ขึ้นต้น hr@ เท่านั้น
          //   (isManagedAdmin มีผลต่อการแยก hr/admin เฉพาะเคส hr@ — admin ปกติไม่ต้องอ่าน → ลด 1 round trip)
          const isHrEmail = !!user.email && user.email.toLowerCase().startsWith('hr@');
          let isManagedAdmin = false;
          if (isHrEmail) {
            try {
              const adminSnap = await getDoc(doc(db, 'admin_users', user.uid));
              isManagedAdmin = adminSnap.exists();
            } catch (e) { /* ignore */ }
          }
          if (!isManagedAdmin && isHrEmail) {
            setAuthRole('hr');
            setActiveMenu('office_supplies');
          } else {
            setAuthRole('admin');
          }
        }
      } else {
        setCurrentUid(null);
        setAuthRole(null);
        setCurrentStaff(null);
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
    // 🆕 guard — เฉพาะแท็บที่ active เท่านั้น (กันส่ง notify 2 ครั้งเมื่อเปิดหลายแท็บ)
    if (!isActiveTab) return;
    // ต้องมีสิทธิ์เข้าถึงเมนู licenses เท่านั้นจึงจะส่ง email แจ้งเตือน
    const hasLicensesAccess = isSuperAdmin || (adminPermissions?.menus || []).includes('licenses');
    if (!hasLicensesAccess) return;
    const todayKey = new Date().toISOString().split('T')[0];
    const storageKey = `licenseExpiryAlertSent_${todayKey}`;
    if (localStorage.getItem(storageKey)) return;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysUntil = (d) => Math.ceil((new Date(d) - today) / (1000 * 60 * 60 * 24));
    const isExpSoon = (d) => {
      if (!d) return false;
      const diff = daysUntil(d);
      return diff >= 0 && diff <= 90;
    };

    // 🆕 Helper: สร้างชื่อ seat โดยไม่ให้ซ้ำกับ lic.name
    //    เช่น lic.name = "Corona Solo", label = "Corona Solo Subscription #A-S01046464"
    //    ก่อน: "Corona Solo — Corona Solo Subscription #A-S01046464"  (ซ้ำ)
    //    หลัง: "Corona Solo Subscription #A-S01046464"                 (ใช้ label ตรงๆ)
    const buildSeatName = (licName, seatLabel) => {
      const l = String(seatLabel || '').trim();
      const n = String(licName || '').trim();
      if (!l) return n;
      if (!n) return l;
      // ถ้า label ขึ้นต้นด้วย license name อยู่แล้ว → ใช้ label ตรงๆ
      if (l.toLowerCase().startsWith(n.toLowerCase())) return l;
      return `${n} — ${l}`;
    };

    // 🆕 รวบรวมทั้ง parent + per-seat + dedupe entry ซ้ำ (name+date เดียวกัน)
    const seenKeys = new Set();
    const expiringEntries = [];
    const pushEntry = (entry) => {
      const key = `${entry.name}|${entry.date}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      expiringEntries.push(entry);
    };

    // Normalize date เป็น YYYY-MM-DD สำหรับเปรียบเทียบ (กันปัญหา format ต่างกัน)
    const normDate = (d) => {
      if (!d) return '';
      if (typeof d === 'string') return d.split('T')[0];
      try { return new Date(d).toISOString().split('T')[0]; } catch { return String(d); }
    };

    licenses.forEach(lic => {
      // 🆕 dedupe ต่อ license — ถ้ามีหลาย seat หมดวันเดียวกันในไลเซนส์เดียวกัน
      //    จะรวมเป็น 1 entry (แสดงจำนวน seat แทน)
      const dateGroup = new Map(); // key: normDate → { name, count, firstLabel }
      const licParentDate = normDate(lic.expirationDate);

      const addSeat = (date, seatLabel) => {
        const d = normDate(date);
        if (!d) return;
        // ข้ามถ้า seat หมดวันเดียวกับ parent (parent จะ alert อยู่แล้ว)
        if (d === licParentDate) return;
        if (!isExpSoon(date)) return;
        if (dateGroup.has(d)) {
          const g = dateGroup.get(d);
          g.count++;
        } else {
          dateGroup.set(d, { count: 1, firstLabel: seatLabel, rawDate: date });
        }
      };

      // Per-seat available
      (lic.availableSeatExpirationDates || []).forEach((d, i) => {
        const label = lic.availableSeatLabels?.[i] || `สิทธิ์ #${i + 1}`;
        addSeat(d, label);
      });
      // Per-seat assigned
      (lic.assignees || []).forEach((a, i) => {
        const label = a.seatLabel || a.empName || `สิทธิ์ #${i + 1}`;
        addSeat(a.seatExpirationDate, label);
      });

      // Parent level
      if (isExpSoon(lic.expirationDate)) {
        // นับจำนวน seat ที่หมดวันเดียวกับ parent (จะรวมใน parent entry)
        const sameAsParent = [
          ...(lic.availableSeatExpirationDates || []),
          ...(lic.assignees || []).map(a => a.seatExpirationDate),
        ].filter(d => normDate(d) === licParentDate).length;

        pushEntry({
          name: sameAsParent > 0 ? `${lic.name} (${sameAsParent + 1} สิทธิ์)` : lic.name,
          date: lic.expirationDate,
          days: daysUntil(lic.expirationDate),
          source: 'หลัก',
        });
      }

      // Emit 1 entry per unique seat date
      dateGroup.forEach((g, d) => {
        const displayName = g.count > 1
          ? `${lic.name} (${g.count} สิทธิ์)`
          : buildSeatName(lic.name, g.firstLabel);
        pushEntry({
          name: displayName,
          date: g.rawDate,
          days: daysUntil(g.rawDate),
          source: 'seat',
        });
      });
    });

    if (expiringEntries.length === 0) return;

    // 🆕 เรียงตามวันที่ใกล้หมดอายุก่อน
    expiringEntries.sort((a, b) => a.days - b.days);

    localStorage.setItem(storageKey, 'sent');
    // 🆕 แปลงวันที่เป็นรูปแบบไทย DD/MM/YYYY (พ.ศ.)
    const facts = expiringEntries.map(e => ({
      label: e.name,
      value: `${formatDateShort(e.date)} · อีก ${e.days} วัน`,
    }));
    sendLineNotification({
      kind: 'license',
      facts: [{ label: 'จำนวนรายการ', value: `${expiringEntries.length} รายการ` }, ...facts],
    }).catch(err => console.error('License expiry LINE notify failed:', err));
  }, [authRole, licenses, isSuperAdmin, adminPermissions, isActiveTab]);

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
    // Reset form state (สำหรับ AddModal) เมื่อเปลี่ยนเมนู
    setName(''); setCost(''); setPurchaseDate(''); setWarrantyDate(''); setQuantity(1); setUnit('ชิ้น'); setAssetImage(null); setAssetDepartment('');
    setSn(''); setCompany(''); setAssetTag(''); setModel(''); setVendor(''); setNote(''); setRemark(''); setAssetDocument(null);
    setSearchTerm('');
    // Reset single-select filters เก่า (ที่ยังเป็น string)
    setRepairFilterStatus('ทั้งหมด'); setSupplyFilterStatus('ทั้งหมด');
    setRepairFilterYear('ทั้งหมด'); setRepairFilterMonth('ทั้งหมด'); setRepairFilterDay('ทั้งหมด');
    setSupplyFilterYear('ทั้งหมด'); setSupplyFilterMonth('ทั้งหมด'); setSupplyFilterDay('ทั้งหมด');
    setOfficeSupplyStockFilter('ทั้งหมด');
    setShowDeletedEmployees(false);
    setSelectedEmployeeIds([]); setSelectedAccessoryIds([]); setSelectedOfficeSupplyIds([]); setSelectedLicenseIds([]);
    // 🆕 ไม่ reset multi-select filters (assetFilterType/Status/Department, accFilterType, licenseExpFilter)
    //    เพื่อให้ persistence ใน localStorage ทำงานได้ + เก็บค่าที่ user เลือกข้าม session
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
    // ทุก role ที่ใช้ Firebase auth (admin/hr/staff) ให้ signOut
    if (authRole === 'admin' || authRole === 'hr' || authRole === 'staff') {
      try { await signOut(auth); } catch (e) { /* ignore */ }
    }
    setAuthRole(null); setCurrentStaff(null);
    setStaffEmpIdInput(''); setStaffPasswordInput('');
    setStaffMustChangePassword(false);
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    const empId    = staffEmpIdInput.trim();
    const password = staffPasswordInput;
    if (!empId)    return;
    if (!password) {
      setCustomAlert({ isOpen: true, title: 'เข้าสู่ระบบไม่สำเร็จ!', message: 'กรุณากรอกรหัสผ่าน', type: 'error' });
      return;
    }
    try {
      // เรียก Vercel API /api/staff-login เพื่อรับ Firebase custom token
      const resp = await fetch(`${VERCEL_API_BASE}/api/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId, password }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      const { token, empDocId, mustChangePassword } = data;
      if (!token) throw new Error('ระบบไม่ได้คืน token');

      // Sign in ด้วย custom token → request.auth.token.role === 'staff'
      await signInWithCustomToken(auth, token);

      // ดึง employee doc มา set currentStaff
      const foundEmp = employees.find(emp => emp.id === empDocId);
      if (foundEmp) setCurrentStaff(foundEmp);
      setStaffEmpIdInput('');
      setStaffPasswordInput('');

      // ถ้าต้องเปลี่ยนรหัสผ่าน → set flag
      setStaffMustChangePassword(!!mustChangePassword);
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'เข้าสู่ระบบไม่สำเร็จ!', message: err?.message || 'เกิดข้อผิดพลาด', type: 'error' });
    }
  };

  // 🟢 ฟังก์ชันส่งแจ้งซ่อม + อีเมล
  const handleSubmitRepairRequest = async (e) => {
    e.preventDefault(); if (!staffRepairForm.assetName.trim() || !staffRepairForm.issue.trim()) return;
    await withLoading(async () => {
    try {
      await addDoc(collection(db, 'repair_requests'), { empId: currentStaff.empId, empName: currentStaff.fullName, department: currentStaff.department, assetName: staffRepairForm.assetName, issue: staffRepairForm.issue, status: 'รอดำเนินการ', timestamp: Date.now(), createdAt: serverTimestamp() });
      // ── ส่ง Teams + email แจ้ง IT (ผ่าน Vercel API) ──
      let notifyOk = false; let notifyErrMsg = '';
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) { notifyErrMsg = 'ไม่มี idToken — auth.currentUser เป็น null'; }
        else {
          const resp = await fetch(`${VERCEL_API_BASE}/api/staff-notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({
              kind: 'repair',
              facts: [
                { label: '👤 ชื่อ-นามสกุล', value: currentStaff.fullName || '-' },
                ...(currentStaff.nickname ? [{ label: '🏷 ชื่อเล่น', value: currentStaff.nickname }] : []),
                { label: '🆔 รหัสพนักงาน', value: currentStaff.empId || '-' },
                { label: '🏢 แผนก', value: currentStaff.department || '-' },
                { label: '👔 หัวหน้างาน', value: currentStaff.manager || '-' },
                { label: '💻 อุปกรณ์', value: staffRepairForm.assetName },
                { label: '⚠️ อาการที่พบ', value: staffRepairForm.issue },
              ],
            }),
          });
          if (resp.ok) notifyOk = true;
          else notifyErrMsg = `HTTP ${resp.status}: ${await resp.text().catch(() => '')}`;
        }
      } catch (notifyErr) { notifyErrMsg = notifyErr?.message || String(notifyErr); console.error('staff-notify failed:', notifyErr); }

      setStaffRepairForm({ assetName: '', issue: '' });
      if (notifyOk) {
        setCustomAlert({ isOpen: true, title: 'ส่งเรื่องสำเร็จ!', message: 'ระบบได้รับเรื่องแจ้งปัญหา และแจ้งฝ่าย IT ทาง Teams แล้ว', type: 'success' });
      } else {
        setCustomAlert({ isOpen: true, title: 'บันทึกแล้ว แต่ส่ง Teams ไม่สำเร็จ', message: `ระบบบันทึกเรื่องแจ้งซ่อมเรียบร้อย แต่ไม่สามารถส่ง Teams แจ้ง IT ได้\n\nสาเหตุ: ${notifyErrMsg || 'ไม่ทราบ'}\n\nกรุณาแจ้ง IT ตรวจสอบการตั้งค่า Teams webhook`, type: 'warning' });
      }
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
    }, 'กำลังส่งคำขอ...');
  };

  // 🟢 ฟังก์ชันส่งคำขอเบิกอุปกรณ์สำนักงาน + อีเมล
  const handleStaffSubmitSupplyRequest = async (supplyId, supplyName, reqQty, note, supplyCompany = '') => {
    await withLoading(async () => {
    try {
      await addDoc(collection(db, 'supply_requests'), { empId: currentStaff.empId, empName: currentStaff.fullName, department: currentStaff.department, supplyId: supplyId, supplyName: supplyName, supplyCompany: supplyCompany || '', requestedQty: Number(reqQty), note: note, status: 'รอดำเนินการ', timestamp: Date.now(), createdAt: serverTimestamp() });
      let notifyOk = false; let notifyErrMsg = '';
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) { notifyErrMsg = 'ไม่มี idToken — auth.currentUser เป็น null'; }
        else {
          const resp = await fetch(`${VERCEL_API_BASE}/api/staff-notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({
              kind: 'supply',
              facts: [
                { label: '👤 ชื่อ-นามสกุล', value: currentStaff.fullName || '-' },
                ...(currentStaff.nickname ? [{ label: '🏷 ชื่อเล่น', value: currentStaff.nickname }] : []),
                { label: '🆔 รหัสพนักงาน', value: currentStaff.empId || '-' },
                { label: '🏢 แผนก', value: currentStaff.department || '-' },
                { label: '👔 หัวหน้างาน', value: currentStaff.manager || '-' },
                { label: '📦 อุปกรณ์ที่ขอเบิก', value: supplyName },
                ...(supplyCompany ? [{ label: '🏢 บริษัทที่จัดหา', value: supplyCompany }] : []),
                { label: '🔢 จำนวน', value: `${reqQty} ชิ้น` },
                { label: '📝 หมายเหตุ', value: note || '-' },
              ],
            }),
          });
          if (resp.ok) notifyOk = true;
          else notifyErrMsg = `HTTP ${resp.status}: ${await resp.text().catch(() => '')}`;
        }
      } catch (notifyErr) { notifyErrMsg = notifyErr?.message || String(notifyErr); console.error('staff-notify failed:', notifyErr); }

      if (notifyOk) {
        setCustomAlert({ isOpen: true, title: 'ส่งคำขอสำเร็จ!', message: 'ส่งคำขอเบิกอุปกรณ์ และแจ้งฝ่าย HR ทาง Teams เรียบร้อยแล้ว', type: 'success' });
      } else {
        setCustomAlert({ isOpen: true, title: 'บันทึกแล้ว แต่ส่ง Teams ไม่สำเร็จ', message: `ระบบบันทึกคำขอเบิกอุปกรณ์เรียบร้อย แต่ไม่สามารถส่ง Teams แจ้ง HR ได้\n\nสาเหตุ: ${notifyErrMsg || 'ไม่ทราบ'}\n\nกรุณาแจ้ง IT ตรวจสอบการตั้งค่า Teams webhook`, type: 'warning' });
      }
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
    }, 'กำลังส่งคำขอ...');
  };

  // ฟังก์ชันบันทึกคำขอเปลี่ยนเครื่อง + ส่ง email แจ้ง IT
  const handleStaffSubmitReplacement = async (currentStatus, reason, damagePhotos = []) => {
    if (!currentStaff) return;
    await withLoading(async () => {
    try {
      await addDoc(collection(db, 'replacement_requests'), {
        empId: currentStaff.empId,
        empName: currentStaff.fullName,
        department: currentStaff.department,
        managerName: currentStaff.manager || '-',
        currentStatus: currentStatus,
        reason: reason,
        damagePhotos: damagePhotos || [],  // [{ name, data(base64) }] — max 6 รูป compressed
        status: 'รอดำเนินการ',
        timestamp: Date.now(),
        createdAt: serverTimestamp()
      });
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (idToken) {
          await fetch(`${VERCEL_API_BASE}/api/staff-notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({
              kind: 'replacement',
              facts: [
                { label: '👤 ชื่อ-นามสกุล', value: currentStaff.fullName || '-' },
                ...(currentStaff.nickname ? [{ label: '🏷 ชื่อเล่น', value: currentStaff.nickname }] : []),
                { label: '🆔 รหัสพนักงาน', value: currentStaff.empId || '-' },
                { label: '🏢 แผนก', value: currentStaff.department || '-' },
                { label: '👔 หัวหน้างาน', value: currentStaff.manager || '-' },
                { label: '💻 สถานะเครื่องปัจจุบัน', value: currentStatus || '-' },
                { label: '📝 เหตุผลขอเปลี่ยน', value: reason || '-' },
              ],
            }),
          });
        }
      } catch (notifyErr) { console.error('staff-notify failed:', notifyErr); }

      setCustomAlert({ isOpen: true, title: 'บันทึกคำขอสำเร็จ!', message: 'บันทึกคำขอเปลี่ยนเครื่อง และแจ้งฝ่าย IT ทาง Teams เรียบร้อยแล้ว กรุณาพิมพ์ฟอร์มและนำไปให้หัวหน้าแผนกเซ็นต์อนุมัติ', type: 'success' });
    } catch (error) {
      setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' });
    }
    }, 'กำลังส่งคำขอ...');
  };

  const handleUpdateReplacementStatus = async (id, newStatus) => {
    try { await updateDoc(doc(db, 'replacement_requests', id), { status: newStatus }); }
    catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

  /* ════════════════════════════════════════════════
     คำขออุปกรณ์เสริม (เบิกใหม่ / ขอเปลี่ยน / ขอเพิ่ม / ขอยืม)
  ════════════════════════════════════════════════ */
  // 🟢 พนักงานส่งคำขอ
  const handleStaffSubmitAccessoryRequest = async (payload) => {
    if (!currentStaff) return;
    await withLoading(async () => {
    try {
      const REQUEST_LABEL = {
        new: 'เบิกใหม่', replace: 'ขอเปลี่ยน', add: 'ขอเพิ่ม', borrow: 'ขอยืม',
      };
      const requestTypeLabel = REQUEST_LABEL[payload.requestType] || payload.requestType;

      const doc = {
        empId: currentStaff.empId,
        empName: currentStaff.fullName,
        nickname: currentStaff.nickname || '',
        department: currentStaff.department || '',
        manager: currentStaff.manager || '',
        accessoryId: payload.accessoryId,
        accessoryName: payload.accessoryName,
        accessoryType: payload.accessoryType || '',
        requestType: payload.requestType,
        quantity: Number(payload.quantity || 1),
        reason: payload.reason || '',
        damagePhoto: payload.damagePhoto || null,
        returnDate: payload.returnDate || null,
        // 🆕 ข้อมูลของเก่า (เฉพาะ replace)
        oldAccessoryId: payload.oldAccessoryId || null,
        oldAccessoryName: payload.oldAccessoryName || null,
        oldAccessoryModel: payload.oldAccessoryModel || null,
        oldPurchaseDate: payload.oldPurchaseDate || null,
        oldAssignedAt: payload.oldAssignedAt || null,
        oldAge: payload.oldAge || null,
        oldWarranty: payload.oldWarranty || null,
        status: 'รอดำเนินการ',
        timestamp: Date.now(),
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'accessory_requests'), doc);

      // LINE notify IT
      let notifyOk = false; let notifyErrMsg = '';
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) { notifyErrMsg = 'ไม่มี idToken'; }
        else {
          const facts = [
            { label: '👤 ชื่อ-นามสกุล', value: currentStaff.fullName || '-' },
            ...(currentStaff.nickname ? [{ label: '🏷 ชื่อเล่น', value: currentStaff.nickname }] : []),
            { label: '🆔 รหัสพนักงาน', value: currentStaff.empId || '-' },
            { label: '🏢 แผนก', value: currentStaff.department || '-' },
            { label: '📋 ประเภทคำขอ', value: requestTypeLabel },
            { label: '📦 อุปกรณ์', value: payload.accessoryName },
            { label: '🔢 จำนวน', value: `${payload.quantity || 1} ชิ้น` },
            // 🆕 ของเก่า (เฉพาะ replace)
            ...(payload.oldAccessoryName ? [
              { label: '🔧 ของเก่า', value: `${payload.oldAccessoryName}${payload.oldAccessoryModel ? ` (${payload.oldAccessoryModel})` : ''}` },
              ...(payload.oldAge ? [{ label: '⏱ อายุของเก่า', value: payload.oldAge }] : []),
              ...(payload.oldWarranty ? [{ label: '🛡 สถานะประกัน', value: payload.oldWarranty }] : []),
            ] : []),
            { label: '📝 เหตุผล', value: payload.reason || '-' },
            ...(payload.returnDate ? [{ label: '📅 กำหนดคืน', value: payload.returnDate }] : []),
          ];
          const resp = await fetch(`${VERCEL_API_BASE}/api/staff-notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ kind: 'accessory_request', facts }),
          });
          if (resp.ok) notifyOk = true;
          else notifyErrMsg = `HTTP ${resp.status}`;
        }
      } catch (notifyErr) { notifyErrMsg = notifyErr?.message || String(notifyErr); }

      if (notifyOk) {
        setCustomAlert({ isOpen: true, title: 'ส่งคำขอสำเร็จ!', message: `ส่งคำขอ ${requestTypeLabel}: ${payload.accessoryName} เรียบร้อย — IT จะดำเนินการให้เร็วที่สุด`, type: 'success' });
      } else {
        setCustomAlert({ isOpen: true, title: 'บันทึกแล้ว แต่ส่ง Teams ไม่สำเร็จ', message: `ระบบบันทึกคำขอเรียบร้อย แต่ส่ง Teams ไม่ได้\n\nสาเหตุ: ${notifyErrMsg}`, type: 'warning' });
      }
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
    }, 'กำลังส่งคำขอ...');
  };

  // 🟢 Admin อนุมัติ / ปฏิเสธ + auto stock update
  // approvalMeta = { requestType, returnDate, borrowNote, oldAccessoryId, newAccessoryId }
  const handleUpdateAccessoryRequestStatus = async (req, newStatus, rejectReason = '', approvalMeta = {}) => {
    try {
      const payload = { status: newStatus };
      if (newStatus === 'ปฏิเสธคำขอ') payload.rejectReason = rejectReason;
      if (newStatus === 'อนุมัติแล้ว') {
        payload.approvedAt = Date.now();
        if (approvalMeta.requestType) payload.requestType = approvalMeta.requestType;
        if (approvalMeta.returnDate) payload.returnDate = approvalMeta.returnDate;
        if (approvalMeta.borrowNote) payload.borrowNote = approvalMeta.borrowNote;
        if (approvalMeta.oldAccessoryId) payload.oldAccessoryId = approvalMeta.oldAccessoryId;
        if (approvalMeta.newAccessoryId) payload.newAccessoryId = approvalMeta.newAccessoryId;
      }

      // ── ถ้าอนุมัติ → update stock + auto-assign เข้าครอบครองพนักงาน ──
      if (newStatus === 'อนุมัติแล้ว') {
        const qty = Number(req.quantity || 1);
        const finalType = approvalMeta.requestType || req.requestType || 'request';
        const finalReturnDate = approvalMeta.returnDate || null;
        const borrowNote = approvalMeta.borrowNote || '';

        // 🆕 resolve employee Firestore doc id จากรหัสพนักงาน
        // (req.empId เก็บเป็นรหัสพนักงาน เช่น "99999" — ต้องแปลงเป็น Firestore doc id)
        const matchedEmp = employees.find(e => e.empId === req.empId || e.id === req.empId);
        const empDocId  = matchedEmp?.id || req.empId;
        const empFullName = matchedEmp?.fullName || req.empName;

        // helper — สร้าง assignee object ที่ครบ field (match กับ handleCheckout)
        const buildAssignee = (picked, noteText, isBorrow) => ({
          checkoutId:   `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          empId:        empDocId,    // ✅ ใช้ Firestore doc id เพื่อให้กรองเจอในหน้าพนักงาน
          empName:      empFullName,
          serialNumber: picked?.sn           || '',
          model:        picked?.model        || '',
          itemCost:     picked?.cost         || '',
          purchaseDate: picked?.purchaseDate || '',
          warrantyDate: picked?.warrantyDate || '',
          assignedAt:   Date.now(),
          note:         noteText,
          isBorrow,
          returnDate:   isBorrow ? finalReturnDate : null,
        });

        if (finalType === 'replace') {
          // ════ REPLACE MODE: รับของเก่า → ของเสีย, ให้ของใหม่ ════
          const oldAccId = approvalMeta.oldAccessoryId;
          const newAccId = approvalMeta.newAccessoryId;

          // 1️⃣ รับของเก่า — ดึง assignee พนักงานออก + ย้ายชิ้นไป brokenItems (เก็บ SN/Model)
          if (oldAccId) {
            const oldAcc = accessories.find(a => a.id === oldAccId);
            if (oldAcc) {
              const oldAssignees = [...(oldAcc.assignees || [])];
              // ✅ match ทั้ง doc id และ human code (รองรับข้อมูลเก่า)
              const idx = oldAssignees.findIndex(a => a.empId === empDocId || a.empId === req.empId);
              const removedAssignee = idx !== -1 ? oldAssignees.splice(idx, 1)[0] : null;
              const brokenItems = getBrokenItems(oldAcc);
              brokenItems.push({
                sn:           removedAssignee?.serialNumber || '',
                model:        removedAssignee?.model        || '',
                cost:         removedAssignee?.itemCost     || '',
                purchaseDate: removedAssignee?.purchaseDate || '',
                warrantyDate: removedAssignee?.warrantyDate || '',
              });
              await updateDoc(doc(db, 'accessories', oldAccId), {
                assignees:      oldAssignees,
                brokenItems,
                brokenQuantity: brokenItems.length,
              });
              await addDoc(collection(db, 'accessories_transactions'), {
                empId:        empDocId,
                empName:      empFullName,
                assetId:      oldAccId,
                assetName:    oldAcc.name,
                category:     'accessories',
                action:       'รับคืน',
                condition:    'broken',
                remarks:      `ขอเปลี่ยน (auto): ${req.reason || '-'}`,
                timestamp:    Date.now(),
                checkoutId:   removedAssignee?.checkoutId || '',
              });
            }
          }

          // 2️⃣ ให้ของใหม่ — ดึงชิ้นจาก availableItems + สร้าง assignee ครบ field
          if (newAccId) {
            const newAcc = accessories.find(a => a.id === newAccId);
            if (newAcc) {
              const items = getAvailableItems(newAcc);
              const assigneesToAdd = [];
              for (let i = 0; i < qty; i++) {
                const picked = items.shift() || {};
                const assignee = buildAssignee(picked, `ขอเปลี่ยน: ${req.reason || ''}`, false);
                assigneesToAdd.push(assignee);
                await addDoc(collection(db, 'accessories_transactions'), {
                  empId:      empDocId,
                  empName:    empFullName,
                  assetId:    newAccId,
                  assetName:  newAcc.name,
                  category:   'accessories',
                  action:     'เบิกจ่าย',
                  condition:  'ปกติ',
                  remarks:    `SN: ${assignee.serialNumber || '-'} | ขอเปลี่ยน: ${req.reason || '-'}`,
                  timestamp:  Date.now(),
                  checkoutId: assignee.checkoutId,
                });
              }
              await updateDoc(doc(db, 'accessories', newAccId), {
                assignees:      [...(newAcc.assignees || []), ...assigneesToAdd],
                availableItems: items,
              });
            }
          }
        } else if (req.accessoryId) {
          // ════ REQUEST / BORROW MODE: ให้ของจาก pool ที่ขอ ════
          const acc = accessories.find(a => a.id === req.accessoryId);
          if (acc) {
            const items = getAvailableItems(acc);
            const assigneesToAdd = [];
            for (let i = 0; i < qty; i++) {
              const picked = items.shift() || {};
              const noteText = `${finalType === 'borrow' ? 'ยืม' : 'เบิก'}: ${req.reason || ''}${borrowNote ? ' | ' + borrowNote : ''}`;
              const assignee = buildAssignee(picked, noteText, finalType === 'borrow');
              assigneesToAdd.push(assignee);
              await addDoc(collection(db, 'accessories_transactions'), {
                empId:      empDocId,
                empName:    empFullName,
                assetId:    req.accessoryId,
                assetName:  acc.name,
                category:   'accessories',
                action:     'เบิกจ่าย',
                condition:  'ปกติ',
                remarks:    `SN: ${assignee.serialNumber || '-'} | ${finalType === 'borrow' ? 'ยืม' : 'เบิก'}: ${req.reason || '-'}`,
                timestamp:  Date.now(),
                checkoutId: assignee.checkoutId,
              });
            }
            await updateDoc(doc(db, 'accessories', req.accessoryId), {
              assignees:      [...(acc.assignees || []), ...assigneesToAdd],
              availableItems: items,
            });
          }
        }
      }

      await updateDoc(doc(db, 'accessory_requests', req.id), payload);
      setCustomAlert({
        isOpen: true,
        title: newStatus === 'อนุมัติแล้ว' ? 'อนุมัติเรียบร้อย!' : 'ปฏิเสธเรียบร้อย',
        message: newStatus === 'อนุมัติแล้ว'
          ? `อนุมัติคำขอ ${req.accessoryName} ของ ${req.empName} — Stock อัปเดตอัตโนมัติ`
          : `ปฏิเสธคำขอ ${req.accessoryName} เรียบร้อย`,
        type: 'success',
      });
    } catch (error) {
      setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' });
    }
  };

  // 🟢 ลบคำขอ (เฉพาะ admin)
  const handleDeleteAccessoryRequest = (id) => {
    showConfirm('ยืนยันการลบ', 'คุณต้องการลบรายการคำขอนี้ใช่หรือไม่?', async () => {
      try { await deleteDoc(doc(db, 'accessory_requests', id)); }
      catch (error) { setCustomAlert({ isOpen: true, title: 'ลบผิดพลาด', message: error.message, type: 'error' }); }
    }, { confirmText: 'ยืนยันลบ', icon: 'trash' });
  };

  // พนักงานแก้ไขข้อมูลส่วนตัวของตัวเอง
  const handleStaffUpdateProfile = async (updates) => {
    if (!currentStaff) return;
    await withLoading(async () => {
    try {
      // ✅ Whitelist เฉพาะ field ที่ staff อนุญาตให้แก้ (ตรงกับ Firestore rules)
      // ❌ ไม่รวม manager — เฉพาะ admin จัดการ
      const ALLOWED = ['fullName','fullNameEng','nickname','position','department','company','phone','m365Email','m365Password'];
      const safe = {};
      for (const k of ALLOWED) {
        if (k in updates) safe[k] = updates[k];
      }
      safe.updatedAt = serverTimestamp();
      await updateDoc(doc(db, 'employees', currentStaff.id), safe);
      setCurrentStaff(prev => ({ ...prev, ...safe }));
      setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว — ข้อมูลในระบบ admin จะอัปเดตทันที', type: 'success' });
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: err.message, type: 'error' });
      throw err;
    }
    }, 'กำลังบันทึก...');
  };

  const handleDeleteReplacement = (id) => {
    showConfirm('ยืนยันการลบ', 'คุณต้องการลบรายการนี้ออกจากระบบใช่หรือไม่?', async () => {
      try { await deleteDoc(doc(db, 'replacement_requests', id)); } 
      catch (error) { setCustomAlert({ isOpen: true, title: 'ลบผิดพลาด', message: error.message, type: 'error' }); }
    }, { confirmText: 'ยืนยันลบ', icon: 'trash' });
  };

  const handleStaffDeleteRepair = (id) => { showConfirm('ยืนยันการยกเลิก', 'คุณต้องการยกเลิกและลบรายการแจ้งปัญหานี้ใช่หรือไม่?', async () => { try { await deleteDoc(doc(db, 'repair_requests', id)); setCustomAlert({ isOpen: true, title: 'ยกเลิกสำเร็จ!', message: 'ลบรายการแจ้งปัญหาของคุณเรียบร้อยแล้ว', type: 'success' }); } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); } }, { confirmText: 'ยืนยันลบ', icon: 'trash' }); };
  const handleStaffUpdateRepair = async (e) => { e.preventDefault(); try { await updateDoc(doc(db, 'repair_requests', editStaffRepairModal.data.id), { assetName: editStaffRepairModal.data.assetName, issue: editStaffRepairModal.data.issue }); setEditStaffRepairModal({ isOpen: false, data: null }); setCustomAlert({ isOpen: true, title: 'แก้ไขสำเร็จ!', message: 'อัปเดตข้อมูลแจ้งปัญหาเรียบร้อยแล้ว', type: 'success' }); } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); } };

  // 🆕 Staff ยกเลิกคำขอเบิกอุปกรณ์ของตัวเอง (เฉพาะที่ยัง "รอดำเนินการ" — เบิกผิด)
  const handleStaffCancelSupplyRequest = (req) => {
    if (req.status !== 'รอดำเนินการ') {
      setCustomAlert({ isOpen: true, title: 'ยกเลิกไม่ได้', message: 'ยกเลิกได้เฉพาะคำขอที่ยังรอดำเนินการเท่านั้น หากอนุมัติแล้วโปรดติดต่อฝ่ายที่เกี่ยวข้อง', type: 'error' });
      return;
    }
    showConfirm('ยืนยันยกเลิกคำขอ', `ต้องการยกเลิกคำขอเบิก "${req.supplyName}" × ${req.requestedQty} ใช่หรือไม่?`, async () => {
      try {
        await deleteDoc(doc(db, 'supply_requests', req.id));
        setCustomAlert({ isOpen: true, title: 'ยกเลิกสำเร็จ!', message: 'ลบคำขอเบิกอุปกรณ์เรียบร้อยแล้ว', type: 'success' });
      } catch (error) {
        setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' });
      }
    }, { confirmText: 'ยืนยันยกเลิก', icon: 'trash' });
  };
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
    await withLoading(async () => {
      try {
        const qtyToSave = Number(quantity);
        if (activeMenu === 'office_supplies') {
          await addDoc(collection(db, 'office_supplies'), { name, type, quantity: qtyToSave, unit, company: company || null, status: 'พร้อมใช้งาน', image: assetImage || null, createdAt: serverTimestamp() });
        } else {
          await addDoc(collection(db, collectionName), {
            name, type, cost, purchaseDate, warrantyDate, quantity: qtyToSave, brokenQuantity: 0, status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null, image: assetImage || null,
            assignees: activeMenu === 'accessories' ? [] : null,
            forDepartment: activeMenu === 'assets' ? assetDepartment : null, sn: activeMenu === 'assets' ? sn : null, company: activeMenu === 'assets' ? company : null, assetTag: activeMenu === 'assets' ? assetTag : null, model: activeMenu === 'assets' ? model : null, vendor: (activeMenu === 'assets' || activeMenu === 'accessories') ? vendor : null, note: (activeMenu === 'assets' || activeMenu === 'accessories') ? note : null, remark: activeMenu === 'assets' ? remark : null, document: activeMenu === 'assets' ? assetDocument : null,
            purchaseCondition: activeMenu === 'assets' ? purchaseCondition : null,
            scrapValue: activeMenu === 'assets' ? scrapValue : null,  // 🆕 ราคาขายซาก (เฉพาะ asset)
            createdAt: serverTimestamp(),
            createdTs: Date.now()  // client time — ใช้จัดเรียงทันทีก่อน serverTimestamp จะกลับมา
          });
        }
        setName(''); setCost(''); setScrapValue(''); setPurchaseDate(''); setWarrantyDate(''); setQuantity(1); setUnit('ชิ้น'); setAssetImage(null); setAssetDepartment(''); setSn(''); setCompany(''); setAssetTag(''); setModel(''); setVendor(''); setNote(''); setRemark(''); setAssetDocument(null); setPurchaseCondition('new');
        setIsAddModalOpen(false); setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'เพิ่มรายการใหม่ลงระบบเรียบร้อยแล้ว', type: 'success' });
      } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
    }, 'กำลังบันทึก...');
  };

  const handleEmpChange = (e) => setEmpForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleLicenseChange = (e) => setLicenseForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const isDuplicate = employees.some(emp => String(emp.empId).toLowerCase() === empForm.empId.trim().toLowerCase() || String(emp.fullName).toLowerCase() === empForm.fullName.trim().toLowerCase());
    if (isDuplicate) return setCustomAlert({ isOpen: true, title: 'ข้อมูลซ้ำซ้อน!', message: `รหัสพนักงาน หรือ ชื่อ-นามสกุล นี้มีอยู่ในระบบแล้ว`, type: 'error' });
    await withLoading(async () => {
      try {
        await addDoc(collection(db, 'employees'), { ...empForm, createdAt: serverTimestamp() });
        setEmpForm({ fullName: '', fullNameEng: '', empId: '', department: '', company: '', position: '', nickname: '', manager: '', phone: '', m365Email: '', m365Password: '', startDate: '' });
        setIsAddModalOpen(false); setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'เพิ่มข้อมูลพนักงานใหม่ลงระบบเรียบร้อยแล้ว', type: 'success' });
      } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
    }, 'กำลังบันทึก...');
  };

  const handleAddLicense = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      try {
        await addDoc(collection(db, 'licenses'), {
          ...licenseForm,
          quantity: Number(licenseForm.quantity || 1),
          assignees: [],
          image: licenseImage || null,
          status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null, createdAt: serverTimestamp()
        });
        setLicenseForm({ name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: '', quantity: 1, note: '' });
        setLicenseImage(null);
        setIsAddModalOpen(false); setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'เพิ่มข้อมูลโปรแกรม/ใบอนุญาต ใหม่ลงระบบเรียบร้อยแล้ว', type: 'success' });
      } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
    }, 'กำลังบันทึก...');
  };

  /* ── Bundled Items (ของแถม: กระเป๋า/สายชาร์จ) — no stock tracking ── */
  const handleAddBundledItem = async ({ name, type, model = '', note = '' }) => {
    if (!name?.trim()) return;
    return await withLoading(async () => {
      try {
        const ref = await addDoc(collection(db, 'bundled_items'), {
          name: name.trim(),
          type: type || 'อื่นๆ',
          model: model.trim(),
          note: note.trim(),
          createdAt: serverTimestamp(),
        });
        return ref.id;
      } catch (err) {
        setCustomAlert({ isOpen: true, title: 'เพิ่มไม่สำเร็จ', message: err.message, type: 'error' });
        return null;
      }
    }, 'กำลังบันทึก...');
  };

  const handleDeleteBundledItem = async (id) => {
    if (!id) return;
    await withLoading(async () => {
      try { await deleteDoc(doc(db, 'bundled_items', id)); }
      catch (err) { setCustomAlert({ isOpen: true, title: 'ลบไม่สำเร็จ', message: err.message, type: 'error' }); }
    }, 'กำลังลบ...');
  };

  const handleDelete = (id, collectionName) => setConfirmDeleteModal({ isOpen: true, id, collectionName });

  const executeDelete = async () => {
    const { id, collectionName } = confirmDeleteModal;
    if (!id || !collectionName) return;
    await withLoading(async () => {
      try {
      const idsToDelete = Array.isArray(id) ? id : [id];
      let deletedEmpStringIds = [];
      let deletedEmpsForCascade = [];
      if (collectionName === 'employees') {
        const deletedEmps = employees.filter(emp => idsToDelete.includes(emp.id));
        deletedEmpStringIds = deletedEmps.map(emp => String(emp.empId).toLowerCase());
        deletedEmpsForCascade = deletedEmps.map(e => ({ id: e.id, empId: e.empId }));
        for (const emp of deletedEmps) {
          const empData = { ...emp }; delete empData.id;
          await setDoc(doc(db, 'deleted_employees', emp.id), { ...empData, deletedAt: serverTimestamp() });
        }
      }
      for (const targetId of idsToDelete) { await deleteDoc(doc(db, collectionName, targetId)); }

      // ── เรียก Vercel API /api/cascade-delete เพื่อลบ orphan data ที่ผูกอยู่ ──
      const cascadeKindMap = { employees: 'employee', assets: 'asset', licenses: 'license', accessories: 'accessory' };
      const cascadeKind = cascadeKindMap[collectionName];
      if (cascadeKind) {
        try {
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
            if (cascadeKind === 'employee') {
              for (const emp of deletedEmpsForCascade) {
                await fetch(`${VERCEL_API_BASE}/api/cascade-delete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                  body: JSON.stringify({ kind: 'employee', id: emp.id, empId: emp.empId }),
                });
              }
            } else {
              for (const targetId of idsToDelete) {
                await fetch(`${VERCEL_API_BASE}/api/cascade-delete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                  body: JSON.stringify({ kind: cascadeKind, id: targetId }),
                });
              }
            }
          }
        } catch (cascadeErr) { console.error('cascade-delete failed:', cascadeErr); }
      }

      if (collectionName === 'employees') {
        // unassign asset/accessory/license ที่ผูกกับพนักงานที่ถูกลบ (client-side fallback)
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
      }
      setConfirmDeleteModal({ isOpen: false, id: null, collectionName: null });
      setSelectedEmployeeIds([]); setSelectedAccessoryIds([]); setSelectedOfficeSupplyIds([]); setSelectedLicenseIds([]);
      setCustomAlert({ isOpen: true, title: 'ลบสำเร็จ!', message: 'ลบรายการออกจากระบบเรียบร้อยแล้ว', type: 'success' });
      } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
    }, 'กำลังลบรายการ...');
  };

  const handleRestoreEmployee = async (emp) => {
    try {
      const empData = { ...emp }; delete empData.id; delete empData.deletedAt;
      await setDoc(doc(db, 'employees', emp.id), { ...empData, createdAt: serverTimestamp() });
      await deleteDoc(doc(db, 'deleted_employees', emp.id));
      setCustomAlert({ isOpen: true, title: 'กู้คืนสำเร็จ!', message: 'กู้คืนข้อมูลพนักงานกลับสู่ระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

  // 🆕 ลบถาวรจากถังขยะ — หายไปเลย ไม่เก็บประวัติ
  const handlePermanentDeleteEmployee = (emp) => {
    showConfirm(
      'ลบถาวร',
      `ลบ "${emp.fullName || emp.id}" ออกจากถังขยะถาวร?\n\nข้อมูลจะหายไปทั้งหมด ไม่สามารถกู้คืนได้`,
      async () => {
        try {
          await deleteDoc(doc(db, 'deleted_employees', emp.id));
          setCustomAlert({ isOpen: true, title: 'ลบสำเร็จ!', message: 'ลบข้อมูลถาวรเรียบร้อยแล้ว', type: 'success' });
        } catch (error) {
          setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' });
        }
      },
      { confirmText: 'ลบถาวร', icon: 'trash' }
    );
  };

  const handleExportEmployees = () => {
    const rows = [[
      'บริษัท', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'M365 Email', 'เบอร์โทร',
      'ชื่อเล่น', 'รหัสพนักงาน', 'แผนก', 'หัวหน้า', 'ชื่อภาษาอังกฤษ', 'วันที่เริ่มงาน',
    ]];
    employees.forEach(emp => rows.push([
      emp.company || '', emp.fullName || '', emp.position || '', emp.m365Email || '', emp.phone || '',
      emp.nickname || '', emp.empId || '', emp.department || '', emp.manager || '', emp.fullNameEng || '', emp.startDate || '',
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'employees.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const handleExportAccessories = () => {
    const filtered = accessories.filter(item => _inArr(accFilterType, item.type));
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
    const rows = [['ชื่ออุปกรณ์', 'ประเภท', 'จำนวน', 'หน่วยนับ', 'บริษัท', 'ราคา', 'วันที่ซื้อ', 'ผู้จัดจำหน่าย', 'หมายเหตุ', 'สถานะ']];
    officeSupplies.forEach(item => rows.push([
      item.name || '', item.type || '', item.quantity || 0, item.unit || 'ชิ้น',
      item.company || '', item.cost || '', item.purchaseDate || '', item.vendor || '',
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
    // 🆕 ถ้าผู้ใช้ติ๊กเลือก row บางรายการ → export เฉพาะที่เลือก
    //    ถ้าไม่ติ๊กเลย → export ทั้งหมดที่ตรงกับ filter ปัจจุบัน
    const sourceList = (selectedLicenseIds?.length > 0)
      ? licenses.filter(l => selectedLicenseIds.includes(l.id))
      : currentData;  // currentData = ผ่าน filter ใกล้หมดอายุ + search แล้ว
    const rows = [[
      // ─── ข้อมูล License (ซ้ำทุกบรรทัด) ───
      'ชื่อโปรแกรม', 'Supplier', 'วันที่ซื้อ', 'วันหมดอายุ',
      'จำนวนสิทธิ์ทั้งหมด', 'ราคารวม (License)', 'สถานะ License',
      // ─── ข้อมูลสิทธิ์ (แต่ละบรรทัด) ───
      'ลำดับสิทธิ์', 'สถานะสิทธิ์', 'ผู้ใช้งาน', 'รหัสพนักงาน',
      'วันที่เบิก', 'Product Key (สิทธิ์)', 'รหัส Key (สิทธิ์)',
      'ราคา/สิทธิ์', 'หมายเหตุ',
    ]];

    sourceList.forEach(l => {
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
        'ชื่ออุปกรณ์', 'ประเภท', 'จำนวน', 'หน่วยนับ', 'บริษัท',
        'ราคา', 'วันที่ซื้อ', 'ผู้จัดจำหน่าย', 'หมายเหตุ',
      ];
      example = [
        'ปากกาลูกลื่น สีน้ำเงิน', 'เครื่องเขียน', '50', 'ด้าม', 'Globe Syndicate',
        '15', '2026-01-15', 'Officemate', 'อุปกรณ์ตัวอย่าง — ลบแถวนี้ก่อน import จริง',
      ];
      filename = 'template_office_supplies.csv';
    }
    else {
      headers = [
        'บริษัท', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'M365 Email', 'เบอร์โทร',
        'ชื่อเล่น', 'รหัสพนักงาน', 'แผนก', 'หัวหน้า', 'ชื่อภาษาอังกฤษ',
        'วันที่เริ่มงาน', 'M365 Password',
      ];
      example = [
        'Globe Syndicate (Thailand) Co., Ltd.', 'นายตัวอย่าง ทดสอบ', 'IT Support', 'sample@globesyndicate.com', '081-234-5678',
        'ทอม', 'EMP001', 'IT', '', 'Sample Test',
        '2024-01-15', '',
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
            'บริษัท': 'company',
            'ราคา': 'cost', 'วันที่ซื้อ': 'purchaseDate', 'ผู้จัดจำหน่าย': 'vendor', 'หมายเหตุ': 'note',
          },
          employees: {
            'รหัสพนักงาน': 'empId',
            'ชื่อ-นามสกุล': 'fullName', 'ชื่อภาษาอังกฤษ': 'fullNameEng',
            'ชื่อเล่น': 'nickname', 'แผนก': 'department', 'บริษัท': 'company',
            'ตำแหน่ง': 'position', 'หัวหน้า': 'manager', 'เบอร์โทร': 'phone',
            'M365 Email': 'm365Email', 'M365 Password': 'm365Password',
            'วันที่เริ่มงาน': 'startDate',
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
        const skippedNoName = [];
        const skippedDuplicate = [];

        // ── สร้าง index ของข้อมูลที่มีอยู่แล้ว เพื่อตรวจ duplicate ──
        // (ใช้ snapshot ปัจจุบันที่ subscribe ผ่าน useFirebaseData → ไม่ต้อง re-read Firestore)
        const existingEmpIds = new Set(
          (employees || []).map(e => String(e.empId || '').trim().toLowerCase()).filter(Boolean)
        );
        const existingAssetTags = new Set(
          (assets || []).map(a => String(a.assetTag || '').trim().toLowerCase()).filter(Boolean)
        );
        const existingAssetSNs = new Set(
          (assets || []).map(a => String(a.sn || '').trim().toLowerCase()).filter(Boolean)
        );
        const existingLicenseKeys = new Set(
          (licenses || []).map(l =>
            `${String(l.name || '').trim().toLowerCase()}|${String(l.productKey || '').trim().toLowerCase()}`
          ).filter(k => k !== '|')
        );
        const existingSupplyNames = new Set(
          (officeSupplies || []).map(s => String(s.name || '').trim().toLowerCase()).filter(Boolean)
        );

        // ── เก็บ key ของรายการที่เพิ่งนำเข้าใน batch นี้ — ป้องกัน duplicate ภายในไฟล์เดียวกัน ──
        const seenInBatch = new Set();

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
          if (!hasName) { skippedNoName.push(i + 1); continue; }

          // ── Duplicate check ──
          let dupKey = null;
          let dupReason = '';
          if (colName === 'employees') {
            const empId = (rec.empId || '').trim().toLowerCase();
            if (empId) {
              dupKey = `emp:${empId}`;
              if (existingEmpIds.has(empId)) dupReason = `รหัสพนักงาน "${rec.empId}" มีอยู่ในระบบแล้ว`;
              else if (seenInBatch.has(dupKey)) dupReason = `รหัสพนักงาน "${rec.empId}" ซ้ำในไฟล์`;
            }
          } else if (colName === 'assets') {
            const tag = (rec.assetTag || '').trim().toLowerCase();
            const sn  = (rec.sn       || '').trim().toLowerCase();
            if (tag && existingAssetTags.has(tag)) { dupKey = `tag:${tag}`; dupReason = `Asset Tag "${rec.assetTag}" มีอยู่แล้ว`; }
            else if (sn  && existingAssetSNs.has(sn))   { dupKey = `sn:${sn}`;  dupReason = `Serial Number "${rec.sn}" มีอยู่แล้ว`; }
            else if (tag && seenInBatch.has(`tag:${tag}`)) { dupKey = `tag:${tag}`; dupReason = `Asset Tag "${rec.assetTag}" ซ้ำในไฟล์`; }
            else if (sn  && seenInBatch.has(`sn:${sn}`))   { dupKey = `sn:${sn}`;  dupReason = `SN "${rec.sn}" ซ้ำในไฟล์`; }
            else if (tag) dupKey = `tag:${tag}`;
            else if (sn)  dupKey = `sn:${sn}`;
          } else if (colName === 'licenses') {
            const key = `${(rec.name || '').trim().toLowerCase()}|${(rec.productKey || '').trim().toLowerCase()}`;
            if (key !== '|') {
              dupKey = `lic:${key}`;
              if (existingLicenseKeys.has(key)) dupReason = `License "${rec.name}" + Product Key มีอยู่แล้ว`;
              else if (seenInBatch.has(dupKey)) dupReason = `License "${rec.name}" + Product Key ซ้ำในไฟล์`;
            }
          } else if (colName === 'office_supplies') {
            const name = (rec.name || '').trim().toLowerCase();
            if (name) {
              dupKey = `sup:${name}`;
              if (existingSupplyNames.has(name)) dupReason = `อุปกรณ์ "${rec.name}" มีอยู่แล้ว (ใช้แก้ไขจำนวนแทน)`;
              else if (seenInBatch.has(dupKey)) dupReason = `อุปกรณ์ "${rec.name}" ซ้ำในไฟล์`;
            }
          }

          if (dupReason) {
            skippedDuplicate.push({ row: i + 1, reason: dupReason });
            continue;
          }
          if (dupKey) seenInBatch.add(dupKey);

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
        const msgParts = [`✅ นำเข้าสำเร็จ ${count} รายการ`];
        if (skippedDuplicate.length > 0) {
          const examples = skippedDuplicate.slice(0, 3).map(s => `แถวที่ ${s.row}: ${s.reason}`).join('\n');
          const more = skippedDuplicate.length > 3 ? `\n...และอีก ${skippedDuplicate.length - 3} แถว` : '';
          msgParts.push(`\n⚠️ ข้ามรายการซ้ำ ${skippedDuplicate.length} แถว:\n${examples}${more}`);
        }
        if (skippedNoName.length > 0) {
          msgParts.push(`\nℹ️ ข้ามแถวที่ไม่มีชื่อ ${skippedNoName.length} แถว: ${skippedNoName.slice(0, 5).join(', ')}${skippedNoName.length > 5 ? '...' : ''}`);
        }
        setCustomAlert({
          isOpen: true,
          title: count > 0 ? 'นำเข้าเสร็จสิ้น' : 'ไม่มีข้อมูลใหม่ถูกนำเข้า',
          message: msgParts.join('\n'),
          type: count > 0 ? 'success' : (skippedDuplicate.length > 0 ? 'warning' : 'error'),
        });
      } catch (err) {
        setCustomAlert({ isOpen: true, title: 'นำเข้าไม่สำเร็จ', message: err.message, type: 'error' });
      }
    };
    reader.readAsText(file, 'UTF-8');
  };
  // 🆕 multi-select helper
  const _inArr = (arr, val) => !arr || arr.length === 0 || arr.includes(val);
  const _filterText = (arr) => (!arr || arr.length === 0) ? 'ทั้งหมด' : arr.join(', ');

  // 🆕 ส่งออก PDF — รายงานทรัพย์สินพร้อมรูปเอกสารแนบ (ใช้ browser print → save as PDF)
  const handleExportAssetsPDF = async () => {
    const filtered = assets.filter(item =>
      _inArr(assetFilterType, item.type) &&
      _inArr(assetFilterStatus, item.status || 'พร้อมใช้งาน') &&
      _inArr(assetFilterDepartment, item.forDepartment)
    );
    const { printAssetReport } = await import('./utils/printAssetReport.js');
    printAssetReport({
      assets: filtered,
      visibleColumns: visibleAssetColumns,
      filters: { type: _filterText(assetFilterType), status: _filterText(assetFilterStatus), department: _filterText(assetFilterDepartment) },
    });
  };

  // 🆕 พิมพ์ PDF เฉพาะทรัพย์สินที่ติ๊กเลือก (ตามลำดับที่แสดงในตาราง)
  const handleExportSelectedAssetsPDF = async () => {
    if (selectedAssetIds.length === 0) {
      setCustomAlert({ isOpen: true, title: 'ยังไม่ได้เลือก', message: 'กรุณาติ๊กเลือกทรัพย์สินที่ต้องการพิมพ์อย่างน้อย 1 รายการ', type: 'error' });
      return;
    }
    const idSet = new Set(selectedAssetIds);
    const picked = assets.filter(a => idSet.has(a.id));
    const { printAssetReport } = await import('./utils/printAssetReport.js');
    printAssetReport({
      assets: picked,
      visibleColumns: visibleAssetColumns,
      filters: { type: `เลือกเฉพาะ ${picked.length} รายการ` },
    });
  };

  const handleExportAssets = () => {
    const filtered = assets.filter(item =>
      _inArr(assetFilterType, item.type) &&
      _inArr(assetFilterStatus, item.status || 'พร้อมใช้งาน') &&
      _inArr(assetFilterDepartment, item.forDepartment)
    );

    // 🆕 Map ของแต่ละคอลัมน์ → header label + value getter (ตามที่ user เลือกใน "คอลัมน์")
    const COL_MAP = {
      name:          { label: 'ชื่ออุปกรณ์',   get: a => a.name },
      type:          { label: 'ประเภท',        get: a => a.type },
      forDepartment: { label: 'สำหรับแผนก',   get: a => a.forDepartment || a.department },
      assetTag:      { label: 'รหัสทรัพย์สิน', get: a => a.assetTag },
      sn:            { label: 'Serial Number', get: a => a.sn },
      model:         { label: 'ยี่ห้อ/รุ่น',  get: a => a.model },
      vendor:        { label: 'ผู้จัดจำหน่าย', get: a => a.vendor },
      company:       { label: 'บริษัท',        get: a => a.company },
      purchaseDate:  { label: 'วันที่ซื้อ',    get: a => a.purchaseDate },
      warrantyDate:  { label: 'วันหมด Warranty', get: a => a.warrantyDate },
      cost:          { label: 'ราคา',          get: a => a.cost },
      scrapValue:    { label: 'ราคาปัจจุบัน',    get: a => a.scrapValue },
      assignedName:  { label: 'ผู้ครอบครอง',  get: a => a.assignedName },
      note:          { label: 'หมายเหตุ',      get: a => a.note },
      remark:        { label: 'Remark',        get: a => a.remark },
      age:           { label: 'อายุการใช้งาน', get: a => {
        if (!a.purchaseDate) return '';
        const d = new Date(a.purchaseDate); if (isNaN(d)) return '';
        const now = new Date();
        let y = now.getFullYear() - d.getFullYear();
        let m = now.getMonth() - d.getMonth();
        if (m < 0) { y--; m += 12; }
        return y > 0 ? `${y} ปี ${m} ด.` : `${m} ด.`;
      }},
      status:        { label: 'สถานะ',         get: a => a.status || 'พร้อมใช้งาน' },
    };
    const selectedCols = Object.keys(COL_MAP).filter(k => visibleAssetColumns?.[k]);
    const cols = selectedCols.length > 0 ? selectedCols : ['name', 'type', 'status'];

    const rows = [cols.map(k => COL_MAP[k].label)];
    filtered.forEach(item => rows.push(cols.map(k => COL_MAP[k].get(item) ?? '')));

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'assets.csv'; a.click(); URL.revokeObjectURL(url);
  };
  
  const openEditEmpModal = (emp) => setEditEmpModal({ isOpen: true, data: { ...emp } });
  const handleEditEmpChange = (e) => setEditEmpModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      try {
        const updatedData = { ...editEmpModal.data }; delete updatedData.id;
        await updateDoc(doc(db, 'employees', editEmpModal.data.id), updatedData);
        if (selectedEmployee && selectedEmployee.id === editEmpModal.data.id) setSelectedEmployee({ ...selectedEmployee, ...updatedData, id: editEmpModal.data.id });
        setEditEmpModal({ isOpen: false, data: null });
        setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขข้อมูลเรียบร้อยแล้ว', type: 'success' });
      } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
    }, 'กำลังบันทึก...');
  };

  const openEditAssetModal = (asset, collectionName) => setEditAssetModal({ isOpen: true, data: { ...asset }, collectionName });
  const handleEditAssetChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEditAssetModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: val } }));
  };

  /* ── Clone Asset — สร้างทรัพย์สินใหม่จากต้นแบบ (ไม่คัดลอกสถานะ assigned/transactions) ── */
  const handleCloneAsset = (sourceAsset) => {
    if (!sourceAsset) return;
    // 🆕 ถามยืนยันก่อน clone
    showConfirm(
      'ยืนยันการคัดลอก',
      `ต้องการคัดลอกข้อมูลจากทรัพย์สิน "${sourceAsset.name}" หรือไม่?\n\nระบบจะ:\n• สร้างทรัพย์สินใหม่ที่ใช้ข้อมูลเดียวกัน\n• รีเซ็ต Serial Number / Asset Tag ให้ว่าง\n• ไม่คัดลอกประวัติการเบิก-คืน\n• เปิดฟอร์มแก้ไขให้กรอกข้อมูลเพิ่ม`,
      async () => {
        await withLoading(async () => {
          try {
            const clone = { ...sourceAsset };
            delete clone.id;
            delete clone.assignedTo;
            delete clone.assignedName;
            delete clone.assignees;
            delete clone.purchaseHistoryLog;
            delete clone.createdAt;
            clone.name      = `${sourceAsset.name || 'ทรัพย์สิน'} (Clone)`;
            clone.assetTag  = '';
            clone.sn        = '';
            clone.status    = 'พร้อมใช้งาน';
            clone.createdAt = serverTimestamp();
            clone.createdTs = Date.now();

            const ref = await addDoc(collection(db, 'assets'), clone);
            setCustomAlert({
              isOpen: true,
              title: 'คัดลอกสำเร็จ!',
              message: `สร้างทรัพย์สินใหม่จาก "${sourceAsset.name}" เรียบร้อย — กรุณากำหนด Serial Number / Asset Tag ใหม่`,
              type: 'success',
            });
            const newDocSnap = await getDoc(ref);
            if (newDocSnap.exists()) openEditAssetModal({ id: ref.id, ...newDocSnap.data() }, 'assets');
          } catch (err) {
            setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: err.message, type: 'error' });
          }
        }, 'กำลังคัดลอก...');
      },
      { confirmText: 'ยืนยันคัดลอก', icon: 'copy' }
    );
  };
  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      try {
        const updatedData = { ...editAssetModal.data }; delete updatedData.id;
        if (editAssetModal.collectionName === 'accessories' && updatedData.remainingQuantity !== undefined) {
          updatedData.quantity = Number(updatedData.remainingQuantity) + (updatedData.assignees?.length || 0) + Number(updatedData.brokenQuantity || 0);
          delete updatedData.remainingQuantity;
        }
        await updateDoc(doc(db, editAssetModal.collectionName, editAssetModal.data.id), updatedData);
        setEditAssetModal({ isOpen: false, data: null, collectionName: '' });
        setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขเรียบร้อยแล้ว', type: 'success' });
      } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
    }, 'กำลังบันทึก...');
  };

  const openEditLicenseModal = (license) => setEditLicenseModal({ isOpen: true, data: { ...license } });
  const handleEditLicenseChange = (e) => setEditLicenseModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateLicense = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      try {
        const updatedData = { ...editLicenseModal.data }; delete updatedData.id;
        if (updatedData.remainingQuantity !== undefined) {
          updatedData.quantity = Number(updatedData.remainingQuantity) + (updatedData.assignees?.length || 0);
          delete updatedData.remainingQuantity;
        }
        await updateDoc(doc(db, 'licenses', editLicenseModal.data.id), updatedData);
        setEditLicenseModal({ isOpen: false, data: null });
        setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขเรียบร้อยแล้ว', type: 'success' });
      } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
    }, 'กำลังบันทึก...');
  };

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

    await withLoading(async () => {
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
          // อุปกรณ์เสริมไม่ต้องเก็บ ConditionCapture fields (ไม่มี 100-point checklist)
          await addDoc(collection(db, 'accessories_transactions'), {
            empId: emp.id, empName: newAssignee.empName, assetId: checkoutModal.assetId, assetName: item.name, category: 'accessories', action: 'เบิกจ่าย',
            condition: 'ปกติ', remarks: `SN: ${newAssignee.serialNumber || '-'} | ${checkoutRemarks.trim() || '-'}`, timestamp: Date.now(),
            checkoutId: newAssignee.checkoutId,
          });
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
        const checkoutDate = formatDateShort(new Date());
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
        const itemToCheckout = assets.find(a => a.id === checkoutModal.assetId);
        const empName = `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`;
        await updateDoc(doc(db, checkoutModal.collectionName, checkoutModal.assetId), {
          status: 'ถูกใช้งาน', assignedTo: emp.id, assignedName: empName,
        });
        {
          const flat = flattenFields(checkoutCondition.fields);
          await addDoc(collection(db, 'assets_transactions'), {
            empId: emp.id, empName, assetId: checkoutModal.assetId, assetName: itemToCheckout ? itemToCheckout.name : '-', category: 'assets', action: 'เบิกจ่าย', condition: 'ปกติ', remarks: checkoutRemarks.trim() || '-', timestamp: Date.now(),
            checkoutFields: checkoutCondition.fields,
            checkoutChecklist: flat.checklist,
            checkoutNotes: checkoutCondition.notes,
            // 🆕 100-point checklist + photos + defects note (ใช้ตอนพิมพ์ใบส่งมอบ + ประวัติครอบครอง)
            checkoutAssessment: checkoutCondition.assessment || null,
            checkoutPhotos:     checkoutCondition.photos     || null,
            checkoutDefectsNote: checkoutCondition.defectsNote || '',
          });
        }

        // ── Auto-assign device-bound licenses กับพนักงานที่รับเครื่องนี้ ──
        const deviceBoundLics = licenses.filter(lic =>
          (lic.assignees || []).some(a => a.isAssetBound && a.assignedAssetId === checkoutModal.assetId)
        );
        for (const lic of deviceBoundLics) {
          const updatedAssignees = (lic.assignees || []).map(a =>
            (a.isAssetBound && a.assignedAssetId === checkoutModal.assetId)
              ? { ...a, empId: emp.id, empName }
              : a
          );
          await updateDoc(doc(db, 'licenses', lic.id), {
            assignees:    updatedAssignees,
            assignedTo:   updatedAssignees.filter(a => a.empId).map(a => a.empId).join(',') || null,
            assignedName: updatedAssignees.map(a => a.empName || a.assignedAssetName || '-').join(', '),
          });
        }
      }
      setCheckoutModal({ isOpen: false, assetId: null, collectionName: '', sn: '', snIndex: undefined });
      setCheckoutEmpId(''); setCheckoutSearchTerm(''); setCheckoutRemarks('');
      setCheckoutCondition({ fields: EMPTY_FIELDS, notes: '' });
      setCustomAlert({ isOpen: true, title: 'สำเร็จ!', message: 'ทำรายการเบิกจ่ายเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
    }, 'กำลังเบิกจ่าย...');
  };

  /* ══════════════════════════════════════════════════════════
     handleAssignLicenseToAsset — ผูก License seat กับ asset
     (device-bound: empId = null, isAssetBound = true)
     ══════════════════════════════════════════════════════════ */
  const handleAssignLicenseToAsset = async (licenseId, seatIndex, assetId, assetName, remarks = '') => {
    await withLoading(async () => {
    try {
      const item = licenses.find(l => l.id === licenseId);
      if (!item) return;
      const totalQty        = Number(item.quantity || 1);
      const currentAssignees = item.assignees || [];
      if (currentAssignees.length >= totalQty) {
        setCustomAlert({ isOpen: true, title: 'ข้อผิดพลาด', message: 'สิทธิ์ License ถูกใช้งานครบแล้ว', type: 'error' });
        return;
      }
      const availableKeys      = [...(item.availableKeys || [])];
      const availableKeyCodes  = [...(item.availableKeyCodes || [])];
      const availableSeatCosts = [...(item.availableSeatCosts || [])];
      const oldDocMap          = { ...(item.availableSeatDocs || {}) };
      const seatProductKey     = availableKeys[seatIndex]      || '';
      const seatKeyCode        = availableKeyCodes[seatIndex]  || '';
      const seatCost           = availableSeatCosts[seatIndex] || '';
      const seatDocuments      = oldDocMap[String(seatIndex)]  || [];

      availableKeys.splice(seatIndex, 1);
      availableKeyCodes.splice(seatIndex, 1);
      availableSeatCosts.splice(seatIndex, 1);

      const totalAvailBefore = Math.max(0, totalQty - currentAssignees.length);
      const newDocMap = {};
      let newIdx = 0;
      for (let i = 0; i < totalAvailBefore; i++) {
        if (i === seatIndex) continue;
        if (oldDocMap[String(i)]) newDocMap[String(newIdx)] = oldDocMap[String(i)];
        newIdx++;
      }

      // ── ถ้า asset นั้นถูก checkout อยู่แล้ว ให้ใส่ empId/empName ทันที ──
      const currentAsset   = assets.find(a => a.id === assetId);
      const currentEmpId   = currentAsset?.assignedTo   || null;
      const currentEmpName = currentAsset?.assignedName || null;

      const newAssignee = {
        checkoutId:        Date.now().toString(),
        empId:             currentEmpId,
        empName:           currentEmpName,
        isAssetBound:      true,
        assignedAssetId:   assetId,
        assignedAssetName: assetName,
        checkoutDate:      formatDateShort(new Date()),
        remarks:           remarks.trim(),
        productKey:        seatProductKey,
        keyCode:           seatKeyCode,
        seatCost,
        seatDocuments,
      };
      const newAssignees = [...currentAssignees, newAssignee];
      const newStatus    = newAssignees.length >= totalQty ? 'ถูกใช้งาน' : 'พร้อมใช้งาน';

      await updateDoc(doc(db, 'licenses', licenseId), {
        assignees:         newAssignees,
        status:            newStatus,
        assignedTo:        newAssignees.filter(a => a.empId).map(a => a.empId).join(',') || null,
        assignedName:      newAssignees.filter(a => a.empName || a.assignedAssetName)
                             .map(a => a.empName || a.assignedAssetName).join(', ') || null,
        availableKeys,
        availableKeyCodes,
        availableSeatCosts,
        availableSeatDocs: newDocMap,
      });
      await addDoc(collection(db, 'licenses_transactions'), {
        // 🆕 ใส่ empId ของผู้ถือเครื่อง ณ ตอนผูก เพื่อให้ขึ้นใน history พนักงาน
        empId: currentEmpId, empName: currentEmpName,
        assetId, assetName, licenseName: item.name,
        category: 'licenses', action: 'เบิกจ่าย', condition: 'ปกติ',
        remarks: remarks.trim() || '-', timestamp: Date.now(), isAssetBound: true,
      });
      setCustomAlert({ isOpen: true, title: 'สำเร็จ!', message: `ผูก ${item.name} กับ ${assetName} เรียบร้อยแล้ว`, type: 'success' });
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: err.message, type: 'error' });
    }
    }, 'กำลังผูก License...');
  };

  /* ══════════════════════════════════════════════════════════
     handleRevokeLicenseFromAsset — ยกเลิกการผูก License seat
     ══════════════════════════════════════════════════════════ */
  const handleRevokeLicenseFromAsset = async (licenseId, checkoutId) => {
    await withLoading(async () => {
    try {
      const item = licenses.find(l => l.id === licenseId);
      if (!item) return;
      const seat = (item.assignees || []).find(a => a.checkoutId === checkoutId);
      if (!seat) return;

      const newAssignees       = (item.assignees || []).filter(a => a.checkoutId !== checkoutId);
      const totalQty           = Number(item.quantity || 1);
      const newAvailableKeys   = [...(item.availableKeys || []),      seat.productKey || ''];
      const newAvailKeyCodes   = [...(item.availableKeyCodes || []),  seat.keyCode    || ''];
      const newAvailSeatCosts  = [...(item.availableSeatCosts || []), seat.seatCost   || ''];
      const newDocMap          = { ...(item.availableSeatDocs || {}) };
      if (seat.seatDocuments?.length > 0)
        newDocMap[String(newAvailableKeys.length - 1)] = seat.seatDocuments;

      const newStatus = newAssignees.length >= totalQty ? 'ถูกใช้งาน' : 'พร้อมใช้งาน';
      await updateDoc(doc(db, 'licenses', licenseId), {
        assignees:         newAssignees,
        status:            newStatus,
        assignedTo:        newAssignees.filter(a => a.empId).map(a => a.empId).join(',') || null,
        assignedName:      newAssignees.map(a => a.empName || a.assignedAssetName || '-').join(', '),
        availableKeys:     newAvailableKeys,
        availableKeyCodes: newAvailKeyCodes,
        availableSeatCosts:newAvailSeatCosts,
        availableSeatDocs: newDocMap,
      });
      await addDoc(collection(db, 'licenses_transactions'), {
        empId: null, assetId: seat.assignedAssetId, assetName: seat.assignedAssetName,
        licenseName: item.name, category: 'licenses', action: 'รับคืน', condition: 'ปกติ',
        remarks: '-', timestamp: Date.now(), isAssetBound: true,
      });
      setCustomAlert({ isOpen: true, title: 'สำเร็จ!', message: `ยกเลิกการผูก ${item.name} เรียบร้อยแล้ว`, type: 'success' });
    } catch (err) {
      setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: err.message, type: 'error' });
    }
    }, 'กำลังยกเลิกการผูก...');
  };

  /* handleCheckin — รับ optional empId เพื่อให้รู้ว่าพนักงานคนไหนคืน license */
  const handleCheckin = (id, collectionName, callerEmpId = null) => {
    showConfirm('ยืนยันการรับคืน', 'ต้องการรับคืนรายการนี้ใช่หรือไม่?', async () => {
      try {
        if (collectionName === 'licenses') {
          // ── License: ต้องอัปเดต assignees[] และคืน seat data กลับ available pool ──
          const item = licenses.find(l => l.id === id);
          if (!item) return;

          // หา seats ของพนักงานคนนี้
          const empSeats = (item.assignees || []).filter(a =>
            callerEmpId ? a.empId === callerEmpId : (a.empId && !a.isAssetBound)
          );
          // แยก seats เป็น 2 กลุ่ม:
          //   regular  — ผูกกับพนักงานโดยตรง → ลบ seat ทิ้ง + คืน key เข้า pool
          //   asset-bound — ผูกกับเครื่อง → เก็บ seat ไว้ (เครื่องยังถือ license) แค่ clear empId/empName
          const regularToRemove    = empSeats.filter(a => !a.isAssetBound);
          const assetBoundToClear  = empSeats.filter(a =>  a.isAssetBound);

          // สร้าง assignees ใหม่:
          //  - ลบ regular ของพนักงานคนนี้ออก
          //  - asset-bound ของพนักงานคนนี้ → เก็บไว้แต่ clear empId/empName
          const newAssignees = (item.assignees || [])
            .filter(a => !regularToRemove.some(r => r.checkoutId === a.checkoutId))
            .map(a => {
              if (assetBoundToClear.some(b => b.checkoutId === a.checkoutId)) {
                return { ...a, empId: null, empName: null };
              }
              return a;
            });

          // คืน seat data กลับ available pools (เฉพาะ regular)
          const newKeys      = [...(item.availableKeys      || [])];
          const newKeyCodes  = [...(item.availableKeyCodes  || [])];
          const newSeatCosts = [...(item.availableSeatCosts || [])];
          const newDocMap    = { ...(item.availableSeatDocs || {}) };

          for (const a of regularToRemove) {
            const idx = newKeys.length;
            newKeys.push(a.productKey || '');
            newKeyCodes.push(a.keyCode || '');
            newSeatCosts.push(a.seatCost || '');
            if (a.seatDocuments?.length > 0) newDocMap[String(idx)] = a.seatDocuments;

            await addDoc(collection(db, 'licenses_transactions'), {
              empId: a.empId, assetName: item.name,
              category: 'licenses', action: 'รับคืน', condition: 'ปกติ',
              remarks: '-', timestamp: Date.now(), checkoutId: a.checkoutId,
            });
          }
          // log asset-bound returns ด้วย แต่ mark isAssetBound เพื่อไม่ขึ้นใน OwnershipHistory
          for (const a of assetBoundToClear) {
            await addDoc(collection(db, 'licenses_transactions'), {
              empId: a.empId, assetName: item.name,
              category: 'licenses', action: 'รับคืน', condition: 'ปกติ',
              remarks: '-', timestamp: Date.now(), checkoutId: a.checkoutId,
              isAssetBound: true,
            });
          }

          const totalQty  = Number(item.quantity || 1);
          const newStatus = newAssignees.length >= totalQty ? 'ถูกใช้งาน' : 'พร้อมใช้งาน';
          await updateDoc(doc(db, 'licenses', id), {
            assignees:         newAssignees,
            status:            newStatus,
            assignedTo:        newAssignees.filter(a => a.empId).map(a => a.empId).join(',') || null,
            assignedName:      newAssignees.filter(a => a.empName || a.assignedAssetName)
                                 .map(a => a.empName || a.assignedAssetName).join(', ') || null,
            availableKeys:      newKeys,
            availableKeyCodes:  newKeyCodes,
            availableSeatCosts: newSeatCosts,
            availableSeatDocs:  newDocMap,
          });

        } else {
          // ── Assets / Accessories: logic เดิม ──
          const itemArray   = collectionName === 'assets' ? assets : accessories;
          const itemToReturn = itemArray.find(a => a.id === id);
          const empId       = itemToReturn?.assignedTo;
          await updateDoc(doc(db, collectionName, id), { status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null });
          if (empId) {
            const txCollection = collectionName === 'assets' ? 'assets_transactions' : 'accessories_transactions';
            await addDoc(collection(db, txCollection), {
              empId, assetName: itemToReturn?.name || '-',
              category: collectionName, action: 'รับคืน', condition: 'ปกติ',
              remarks: '-', timestamp: Date.now(),
            });
          }
        }
      } catch (error) {
        setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' });
      }
    }, { confirmText: 'รับคืน', icon: 'return' });
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
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
        // อุปกรณ์เสริม / License ไม่เก็บ returnFields (ไม่มี 100-point checklist)
        await addDoc(collection(db, txCollection), {
          empId: returnModal.empId, empName: returnModal.empName, assetId: returnModal.assetId, assetName: returnModal.assetName, category: collectionName, action: 'รับคืน',
          condition: returnCondition === 'broken' ? 'ชำรุด' : 'ปกติ',
          remarks: returnRemarks.trim() || '-', timestamp: Date.now(),
          checkoutId: returnModal.checkoutId,
        });

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
            // 🆕 100-point checklist + photos + defects note ตอนรับคืน (ใช้ตอนพิมพ์ใบรับคืน + ประวัติ)
            returnAssessment:  returnConditionData.assessment  || null,
            returnPhotos:      returnConditionData.photos      || null,
            returnDefectsNote: returnConditionData.defectsNote || '',
          });
        }

        // Auto-unassign device-bound licenses when asset is returned
        const deviceBoundLicsForReturn = licenses.filter(lic =>
          (lic.assignees || []).some(a =>
            a.isAssetBound && a.assignedAssetId === returnModal.assetId && a.empId
          )
        );
        for (const lic of deviceBoundLicsForReturn) {
          const updatedAssignees = (lic.assignees || []).map(a =>
            (a.isAssetBound && a.assignedAssetId === returnModal.assetId)
              ? { ...a, empId: null, empName: null }
              : a
          );
          await updateDoc(doc(db, 'licenses', lic.id), {
            assignees:    updatedAssignees,
            assignedTo:   updatedAssignees.filter(a => a.empId).map(a => a.empId).join(',') || null,
            assignedName: updatedAssignees.filter(a => a.empName || a.assignedAssetName)
                            .map(a => a.empName || a.assignedAssetName).join(', ') || null,
          });
        }
      }

      setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
      setReturnCondition('good'); setReturnRemarks('');
      setReturnConditionData({ fields: EMPTY_FIELDS, notes: '' });
      setCustomAlert({ isOpen: true, title: 'รับคืนสำเร็จ', message: 'รับคืนเข้าระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' }); }
    }, 'กำลังรับคืน...');
  };

  const handleConfirmRepair = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
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
    }, 'กำลังบันทึก...');
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

  // ⚡ Debounced search — ค้นหาช้าลง 250ms กันแลคตอนพิมพ์ในข้อมูลใหญ่ ⚡
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ⚡ Memoize filtered/searched/sorted data — re-compute เฉพาะตอน dep เปลี่ยน ⚡
  const currentData = useMemo(() => {
    let baseData = [];
    // 🆕 multi-select helper: empty array = no filter (ทั้งหมด)
    const inFilter = (arr, val) => !arr || arr.length === 0 || arr.includes(val);
    if (activeMenu === 'assets') baseData = assets.filter(item =>
      inFilter(assetFilterType, item.type) &&
      inFilter(assetFilterStatus, item.status || 'พร้อมใช้งาน') &&
      inFilter(assetFilterDepartment, item.forDepartment)
    );
    else if (activeMenu === 'licenses') {
      baseData = licenses.filter(item => {
        if (!licenseExpFilter || licenseExpFilter.length === 0) return true;
        const dates = [
          item.expirationDate,
          ...(item.availableSeatExpirationDates || []),
          ...((item.assignees || []).map(a => a.seatExpirationDate)),
        ].filter(Boolean);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const daysUntil = (d) => Math.ceil((new Date(d) - today) / (1000 * 60 * 60 * 24));
        const minDays = dates.length > 0 ? Math.min(...dates.map(daysUntil)) : null;
        // OR logic — ตรงกับตัวเลือกใดตัวหนึ่งก็ผ่าน
        return licenseExpFilter.some(opt => {
          if (opt === 'ไม่ระบุ')       return dates.length === 0;
          if (minDays === null)         return false;
          if (opt === 'หมดอายุแล้ว') return minDays < 0;
          if (opt === '30')             return minDays >= 0 && minDays <= 30;
          if (opt === '60')             return minDays >= 0 && minDays <= 60;
          if (opt === '90')             return minDays >= 0 && minDays <= 90;
          return false;
        });
      });
    }
    else if (activeMenu === 'employees') baseData = showDeletedEmployees ? deletedEmployees : employees;
    else if (activeMenu === 'accessories') baseData = accessories.filter(item => inFilter(accFilterType, item.type));
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

    let result = baseData;
    if (debouncedSearch.trim() !== '') {
      const lowerCaseTerm = debouncedSearch.toLowerCase();
      const matchAny = (...vals) => vals.some(v => String(v || '').toLowerCase().includes(lowerCaseTerm));
      result = baseData.filter(item => {
        if (activeMenu === 'employees') {
          return matchAny(
            item.fullName, item.fullNameEng, item.empId,
            item.nickname, item.department, item.position,
          );
        }
        // 🆕 License — รวมค้นหารายการย่อย (productKey, seat label, assignee, supplier)
        if (activeMenu === 'licenses') {
          const parentMatch = matchAny(
            item.name, item.type, item.supplier, item.productKey, item.keyCode,
            item.vendor, item.company, item.assignedName, item.note,
          );
          if (parentMatch) return true;
          const availSeatsMatch =
            (item.availableKeys || []).some(k => matchAny(k)) ||
            (item.availableKeyCodes || []).some(k => matchAny(k)) ||
            (item.availableSeatLabels || []).some(l => matchAny(l)) ||
            (item.availableSeatSuppliers || []).some(s => matchAny(s)) ||
            (item.availableSeatNotes || []).some(n => matchAny(n));
          if (availSeatsMatch) return true;
          const assignedSeatsMatch = (item.assignees || []).some(a =>
            matchAny(a.empName, a.empId, a.productKey, a.keyCode, a.seatLabel,
                     a.seatSupplier, a.seatNote, a.assignedAssetName, a.remarks)
          );
          return assignedSeatsMatch;
        }
        return matchAny(
          item.name, item.type, item.sn, item.assetTag, item.model,
          item.vendor, item.company, item.assignedName, item.note, item.remark,
        );
      });
    }

    // ── จัดเรียงทรัพย์สิน: สร้างใหม่สุดอยู่บนสุด ──
    if (activeMenu === 'assets') {
      const millisOf = (item) => {
        const t = item.createdAt;
        const server = t?.toMillis?.() ?? (t?.seconds ? t.seconds * 1000 : 0);
        // serverTimestamp ยังไม่กลับมา (pending write) → ใช้เวลาฝั่ง client แทน
        return server || item.createdTs || 0;
      };
      result = [...result].sort((a, b) => {
        const ta = millisOf(a);
        const tb = millisOf(b);
        if (ta !== tb) return tb - ta;
        // ยังไม่มี createdAt (ข้อมูลเก่า) — เรียงตาม doc id ใหม่→เก่า
        return (b.id || '').localeCompare(a.id || '');
      });
    }

    return result;
  }, [
    activeMenu, assets, accessories, employees, deletedEmployees, licenses, officeSupplies,
    assetFilterType, assetFilterStatus, assetFilterDepartment,
    accFilterType, showDeletedEmployees, officeSupplyStockFilter, licenseExpFilter,
    debouncedSearch,
  ]);

  // ⚡ Pagination — render แค่ 50 แถวต่อหน้า เพื่อให้ DOM ไม่หนัก ⚡
  const TABLE_ITEMS_PER_PAGE = 50;
  const [tablePage, setTablePage] = useState(1);
  // reset page เมื่อ menu / filter / search เปลี่ยน
  useEffect(() => {
    setTablePage(1);
  }, [activeMenu, debouncedSearch, assetFilterType, assetFilterStatus, assetFilterDepartment, accFilterType, showDeletedEmployees, officeSupplyStockFilter, licenseExpFilter]);
  const tableTotalPages = Math.max(1, Math.ceil(currentData.length / TABLE_ITEMS_PER_PAGE));
  // ป้องกัน page เกิน
  useEffect(() => {
    if (tablePage > tableTotalPages) setTablePage(tableTotalPages);
  }, [tablePage, tableTotalPages]);
  const paginatedTableData = useMemo(() => {
    const start = (tablePage - 1) * TABLE_ITEMS_PER_PAGE;
    return currentData.slice(start, start + TABLE_ITEMS_PER_PAGE);
  }, [currentData, tablePage]);

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
  // 🆕 เลือกทรัพย์สินรายตัว — เก็บเป็น id จึงคงอยู่แม้ค้นหา/กรองเปลี่ยน
  const handleSelectAsset = (e, id) => e.target.checked ? setSelectedAssetIds(prev => prev.includes(id) ? prev : [...prev, id]) : setSelectedAssetIds(prev => prev.filter(itemId => itemId !== id));
  // เลือก/ยกเลิก "ทั้งหมดในผลค้นหาปัจจุบัน" โดยไม่แตะรายการที่เลือกไว้นอกผลค้นหา
  const handleSelectAllAssets = (e) => {
    const idsInView = currentData.map(item => item.id);
    if (e.target.checked) setSelectedAssetIds(prev => [...new Set([...prev, ...idsInView])]);
    else setSelectedAssetIds(prev => prev.filter(id => !idsInView.includes(id)));
  };
  const clearSelectedAssets = () => setSelectedAssetIds([]);

  const menuTitle = activeMenu === 'dashboard' ? 'ภาพรวม' :
                    activeMenu === 'kpi_dashboard' ? 'รายงาน KPI' :
                    activeMenu === 'assets' ? 'ทรัพย์สิน' :
                    activeMenu === 'licenses' ? 'โปรแกรม / License' :
                    activeMenu === 'accessories' ? 'อุปกรณ์เสริม' :
                    activeMenu === 'repairs' ? 'แจ้งปัญหา IT' :
                    activeMenu === 'office_supplies' ? 'อุปกรณ์สำนักงาน' :
                    activeMenu === 'supply_requests' ? 'คำขอเบิกอุปกรณ์' :
                    activeMenu === 'replacement_requests' ? 'คำขอเปลี่ยนเครื่อง' :
                    activeMenu === 'accessory_requests' ? 'คำขออุปกรณ์เสริม' :
                    activeMenu === 'users' ? 'จัดการผู้ใช้' : 'พนักงาน';

  const checkLicenseExpiration = (expirationDate) => {
    if (!expirationDate) return { isExpiring: false, statusText: '', colorClass: '' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)   return { isExpiring: true, statusText: 'หมดอายุแล้ว',              colorClass: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (diffDays <= 30) return { isExpiring: true, statusText: `เหลืออีก ${diffDays} วัน`, colorClass: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (diffDays <= 90) return { isExpiring: true, statusText: `เหลืออีก ${diffDays} วัน`, colorClass: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { isExpiring: false, statusText: '', colorClass: '' };
  };

  // เช็คสิทธิ์เข้าถึงเมนู — ใช้กรองการแจ้งเตือนตามสิทธิ์ของ user
  const hasRepairsMenuAccess  = isSuperAdmin || (adminPermissions?.menus || []).includes('repairs');
  const hasSuppliesMenuAccess = isSuperAdmin || (adminPermissions?.menus || []).includes('supply_requests');
  const hasLicensesMenuAccess = isSuperAdmin || (adminPermissions?.menus || []).includes('licenses');
  const hasReplacementsMenuAccess = isSuperAdmin || (adminPermissions?.menus || []).includes('replacement_requests');
  const hasAccessoryReqMenuAccess = isSuperAdmin || (adminPermissions?.menus || []).includes('accessory_requests');
  const pendingRepairsCount = (authRole === 'admin' && hasRepairsMenuAccess) ? repairRequests.filter(req => req.status === 'รอดำเนินการ').length : 0;
  const pendingSuppliesCount = (authRole !== 'admin' || hasSuppliesMenuAccess) ? supplyRequests.filter(req => req.status === 'รอดำเนินการ').length : 0;
  // 🆕 เช็ค expiration ทั้ง parent + per-seat
  // ถ้า parent หมดอายุ → นับ 1
  // ถ้า seat ไหนหมดอายุ → นับเพิ่ม
  const expiringLicensesCount = (authRole === 'admin' && hasLicensesMenuAccess)
    ? licenses.reduce((sum, lic) => {
        let count = 0;
        // เช็ค parent
        if (checkLicenseExpiration(lic.expirationDate).isExpiring) count += 1;
        // เช็ค per-seat — available seats
        (lic.availableSeatExpirationDates || []).forEach(d => {
          if (d && d !== lic.expirationDate && checkLicenseExpiration(d).isExpiring) count += 1;
        });
        // เช็ค per-seat — assigned seats
        (lic.assignees || []).forEach(a => {
          if (a.seatExpirationDate && a.seatExpirationDate !== lic.expirationDate && checkLicenseExpiration(a.seatExpirationDate).isExpiring) count += 1;
        });
        return sum + count;
      }, 0)
    : 0;
  const pendingReplacementsCount = (authRole === 'admin' && hasReplacementsMenuAccess) ? replacementRequests.filter(req => req.status === 'รอดำเนินการ').length : 0;
  const pendingAccessoryReqCount = (authRole === 'admin' && hasAccessoryReqMenuAccess) ? (accessoryRequests || []).filter(req => req.status === 'รอดำเนินการ').length : 0;

  const totalPendingCount = pendingRepairsCount + pendingSuppliesCount + expiringLicensesCount + pendingReplacementsCount + pendingAccessoryReqCount;
  const totalSystemItems = assets.length + licenses.length + accessories.length + employees.length;
  const currentDataLength = currentData.length;

  if (authLoading || (authRole === 'admin' && permLoading)) return (<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#1E487A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div></div>);
  
  if (authRole === null) return (
    <React.Fragment>
      <GlobalLoadingOverlay show={globalLoading} message={globalLoadingMsg} />
      <LoginView showAdminLogin={showAdminLogin} setShowAdminLogin={setShowAdminLogin} setAuthRole={setAuthRole} loginForm={loginForm} setLoginForm={setLoginForm} handleAdminLogin={handleAdminLogin} loginError={loginError} setLoginError={setLoginError} loginLoading={loginLoading} />
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
    </React.Fragment>
  );

  if (authRole === 'staff') return (
    <React.Fragment>
      <GlobalLoadingOverlay show={globalLoading} message={globalLoadingMsg} />
      <Suspense fallback={<LazyFallback />}>
      <StaffView
        setAuthRole={setAuthRole} currentStaff={currentStaff} setCurrentStaff={setCurrentStaff}
        staffEmpIdInput={staffEmpIdInput} setStaffEmpIdInput={setStaffEmpIdInput} 
        staffPasswordInput={staffPasswordInput} setStaffPasswordInput={setStaffPasswordInput} 
        handleStaffLogin={handleStaffLogin} handleLogout={handleLogout}
        staffMustChangePassword={staffMustChangePassword} setStaffMustChangePassword={setStaffMustChangePassword}
        staffRepairForm={staffRepairForm} setStaffRepairForm={setStaffRepairForm} handleSubmitRepairRequest={handleSubmitRepairRequest} 
        repairRequests={repairRequests} editStaffRepairModal={editStaffRepairModal} setEditStaffRepairModal={setEditStaffRepairModal} 
        handleStaffUpdateRepair={handleStaffUpdateRepair} handleStaffDeleteRepair={handleStaffDeleteRepair} 
        officeSupplies={officeSupplies} supplyRequests={supplyRequests} handleStaffSubmitSupplyRequest={handleStaffSubmitSupplyRequest} handleStaffCancelSupplyRequest={handleStaffCancelSupplyRequest}
        assets={assets} accessories={accessories} licenses={licenses} 
        replacementRequests={replacementRequests}
        handleStaffSubmitReplacement={handleStaffSubmitReplacement}
        accessoryRequests={accessoryRequests}
        handleStaffSubmitAccessoryRequest={handleStaffSubmitAccessoryRequest}
        handleSubmitEvaluation={handleSubmitEvaluation}
        handleStaffUpdateProfile={handleStaffUpdateProfile}
      />
      </Suspense>
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
      <ConfirmModal
        isOpen={confirmModal?.isOpen}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmText={confirmModal?.confirmText}
        cancelText={confirmModal?.cancelText}
        icon={confirmModal?.icon}
        onConfirm={handleConfirmModalOk}
        onCancel={closeConfirmModal}
      />
    </React.Fragment>
  );

  return (
    <div className="flex h-screen bg-[#F1F5FA] text-slate-900 font-sans">
      <GlobalLoadingOverlay show={globalLoading} message={globalLoadingMsg} />
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
        menuCounts={{
          repairs: pendingRepairsCount,
          supply_requests: pendingSuppliesCount,
          accessory_requests: pendingAccessoryReqCount,
          replacement_requests: pendingReplacementsCount,
          licenses: expiringLicensesCount,
        }}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-transparent min-w-0">
        <TopHeader menuTitle={menuTitle} notifRef={notifRef} isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} totalPendingCount={totalPendingCount} pendingRepairsCount={pendingRepairsCount} pendingSuppliesCount={pendingSuppliesCount} pendingReplacementsCount={pendingReplacementsCount} pendingAccessoryReqCount={pendingAccessoryReqCount} expiringLicensesCount={expiringLicensesCount} setActiveMenu={setActiveMenu} activeMenu={activeMenu} totalSystemItems={totalSystemItems} currentDataLength={currentDataLength} handleLogout={handleLogout} authRole={authRole} isSuperAdmin={isSuperAdmin} userName={adminDisplayName} onOpenSidebar={() => setSidebarOpen(true)} />

        <div id="main-scroll-container" className="flex-1 overflow-auto p-3 sm:p-4 md:p-5">
          {activeMenu === 'field_options' ? (
            <Suspense fallback={<LazyFallback />}>
              <DropdownOptionsManager
                fieldOptions={fieldOptions}
                onSave={handleSaveFieldOptions}
                saving={savingFieldOptions}
              />
            </Suspense>
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
                className="flex items-center gap-2 px-7 py-3.5 bg-[#1E487A] hover:bg-[#163963] text-white rounded-xl font-semibold text-[15px] transition-colors shadow-lg"
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
            <Suspense fallback={<LazyFallback />}>
              <KpiDashboard repairRequests={repairRequests} />
            </Suspense>
          ) : activeMenu === 'repairs' ? (
            <RepairTable repairRequests={repairRequests} currentRepairRequests={currentRepairRequests} repairFilterYear={repairFilterYear} setRepairFilterYear={setRepairFilterYear} repairFilterMonth={repairFilterMonth} setRepairFilterMonth={setRepairFilterMonth} repairFilterDay={repairFilterDay} setRepairFilterDay={setRepairFilterDay} repairFilterStatus={repairFilterStatus} setRepairFilterStatus={setRepairFilterStatus} handleUpdateRepairRequestStatus={handleUpdateRepairRequestStatus} handleDeleteRepairRequest={handleDeleteRepairRequest} canEdit={canEdit} />
          ) : activeMenu === 'supply_requests' ? (
            <SupplyRequestTable supplyRequests={supplyRequests} currentSupplyRequests={currentSupplyRequests} officeSupplies={officeSupplies} supplyFilterYear={supplyFilterYear} setSupplyFilterYear={setSupplyFilterYear} supplyFilterMonth={supplyFilterMonth} setSupplyFilterMonth={setSupplyFilterMonth} supplyFilterDay={supplyFilterDay} setSupplyFilterDay={setSupplyFilterDay} supplyFilterStatus={supplyFilterStatus} setSupplyFilterStatus={setSupplyFilterStatus} handleUpdateSupplyRequestStatus={handleUpdateSupplyRequestStatus} handleDelete={handleDelete} canEdit={canEdit} />
          ) : activeMenu === 'replacement_requests' ? (
            <ReplacementRequestTable
              replacementRequests={replacementRequests}
              handleUpdateReplacementStatus={handleUpdateReplacementStatus}
              handleDeleteReplacement={handleDeleteReplacement}
            />
          ) : activeMenu === 'accessory_requests' ? (
            <AccessoryRequestTable
              accessoryRequests={accessoryRequests}
              accessories={accessories}
              handleUpdateAccessoryRequestStatus={handleUpdateAccessoryRequestStatus}
              handleDeleteAccessoryRequest={handleDeleteAccessoryRequest}
              canEdit={canEdit}
            />
          ) : activeMenu === 'users' ? (
            <Suspense fallback={<LazyFallback />}>
              <UserManagementPage
                isSuperAdmin={isSuperAdmin}
                canManagePasswords={adminPermissions?.canManagePasswords === true}
              />
            </Suspense>
          ) : (
            <div className="h-full flex flex-col max-w-[1400px] w-full mx-auto">
              {/* 🆕 v2 page header */}
              <div className="mb-3.5 shrink-0">
                <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">{menuTitle}</h1>
                <p className="text-[13px] text-slate-400 mt-0.5">
                  {currentData.length.toLocaleString()} รายการในระบบ
                  {showDeletedEmployees ? ' · กำลังดูถังขยะ' : ''}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(16,47,87,0.03),0_14px_36px_-20px_rgba(16,47,87,0.14)] flex flex-col flex-1 overflow-hidden">
                <div className="px-5 md:px-6 pt-5">
                <ActionBar
                  menuTitle={menuTitle} activeMenu={activeMenu} searchTerm={searchTerm} setSearchTerm={setSearchTerm} showDeletedEmployees={showDeletedEmployees} setShowDeletedEmployees={setShowDeletedEmployees} setIsImportModalOpen={setIsImportModalOpen} handleExportEmployees={handleExportEmployees}
                  selectedEmployeeIds={selectedEmployeeIds} setConfirmDeleteModal={setConfirmDeleteModal} assetFilterDepartment={assetFilterDepartment} setAssetFilterDepartment={setAssetFilterDepartment} assetFilterType={assetFilterType} setAssetFilterType={setAssetFilterType} assetFilterStatus={assetFilterStatus} setAssetFilterStatus={setAssetFilterStatus} accFilterType={accFilterType} setAccFilterType={setAccFilterType}
                  handleExportAccessories={handleExportAccessories} selectedAccessoryIds={selectedAccessoryIds} officeSupplyStockFilter={officeSupplyStockFilter} setOfficeSupplyStockFilter={setOfficeSupplyStockFilter} selectedOfficeSupplyIds={selectedOfficeSupplyIds} setIsAddModalOpen={setIsAddModalOpen} handleExportAssets={handleExportAssets} handleExportAssetsPDF={handleExportAssetsPDF} handleExportOfficeSupplies={handleExportOfficeSupplies} visibleAssetColumns={visibleAssetColumns} setVisibleAssetColumns={setVisibleAssetColumns}
                  handleExportLicenses={handleExportLicenses} selectedLicenseIds={selectedLicenseIds}
                  visibleLicenseColumns={visibleLicenseColumns} setVisibleLicenseColumns={setVisibleLicenseColumns}
                  licenseExpFilter={licenseExpFilter} setLicenseExpFilter={setLicenseExpFilter}
                  setIsSnipeITImportOpen={setIsSnipeITImportOpen}
                  canEdit={canEdit}
                  fieldOptions={fieldOptions}
                  selectedAssetIds={selectedAssetIds}
                  handleExportSelectedAssetsPDF={handleExportSelectedAssetsPDF}
                  clearSelectedAssets={clearSelectedAssets}
                />
                </div>

                {currentData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                      <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                    </div>
                    <p className="font-medium text-[15px] text-slate-500">ไม่พบข้อมูลที่ค้นหา</p>
                    <p className="text-[13px] text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือปรับตัวกรอง</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1 border-t border-slate-100 bg-white">
                    {activeMenu === 'employees' ? (
                      <EmployeeTable currentData={paginatedTableData} selectedEmployeeIds={selectedEmployeeIds} handleSelectAllEmployees={handleSelectAllEmployees} handleSelectEmployee={handleSelectEmployee} setSelectedEmployee={setSelectedEmployee} setEmpModalTab={setEmpModalTab} showDeletedEmployees={showDeletedEmployees} handleRestoreEmployee={handleRestoreEmployee} handlePermanentDeleteEmployee={handlePermanentDeleteEmployee} openEditEmpModal={openEditEmpModal} setConfirmDeleteModal={setConfirmDeleteModal} canEdit={canEdit} />
                    ) : activeMenu === 'licenses' ? (
                      <LicenseTable
                        currentData={paginatedTableData}
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
                      <OfficeSupplyTable currentData={paginatedTableData} selectedOfficeSupplyIds={selectedOfficeSupplyIds} handleSelectAllOfficeSupplies={handleSelectAllOfficeSupplies} handleSelectOfficeSupply={handleSelectOfficeSupply} openEditAssetModal={openEditAssetModal} setConfirmDeleteModal={setConfirmDeleteModal} activeMenu={activeMenu} canEdit={canEdit} />
                    ) : activeMenu === 'accessories' ? (
                      <AccessoryTable currentData={paginatedTableData} selectedAccessoryIds={selectedAccessoryIds} handleSelectAllAccessories={handleSelectAllAccessories} handleSelectAccessory={handleSelectAccessory} setSelectedAssetDetail={setSelectedAssetDetail} setSelectedAssetCategory={setSelectedAssetCategory} setCheckoutModal={setCheckoutModal} openEditAssetModal={openEditAssetModal} setConfirmDeleteModal={setConfirmDeleteModal} canEdit={canEdit} />
                    ) : activeMenu === 'assets' ? (
                      <AssetTable currentData={paginatedTableData} setSelectedAssetDetail={setSelectedAssetDetail} setSelectedAssetCategory={setSelectedAssetCategory} setCheckoutModal={setCheckoutModal} setReturnModal={setReturnModal} openEditAssetModal={openEditAssetModal} setConfirmDeleteModal={setConfirmDeleteModal} handleCloneAsset={handleCloneAsset} visibleAssetColumns={visibleAssetColumns} canEdit={canEdit} selectedAssetIds={selectedAssetIds} handleSelectAsset={handleSelectAsset} handleSelectAllAssets={handleSelectAllAssets} />
                    ) : null}
                  </div>
                )}

                {/* ── Pagination footer (โชว์เมื่อ ≥ 2 หน้า) ── */}
                {currentData.length > 0 && tableTotalPages > 1 && (
                  <div className="px-5 md:px-6 pb-4 pt-1">
                    <TablePagination
                      currentPage={tablePage}
                      totalPages={tableTotalPages}
                      totalItems={currentData.length}
                      itemsPerPage={TABLE_ITEMS_PER_PAGE}
                      onPageChange={setTablePage}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <ModalsContainer 
        isAddModalOpen={isAddModalOpen} setIsAddModalOpen={setIsAddModalOpen} activeMenu={activeMenu} handleAddEmployee={handleAddEmployee} empForm={empForm} handleEmpChange={handleEmpChange} handleAddLicense={handleAddLicense} licenseForm={licenseForm} handleLicenseChange={handleLicenseChange} licenseImage={licenseImage} setLicenseImage={setLicenseImage} handleAdd={handleAdd} name={name} setName={setName} type={type} setType={setType} cost={cost} setCost={setCost} purchaseDate={purchaseDate} setPurchaseDate={setPurchaseDate} warrantyDate={warrantyDate} setWarrantyDate={setWarrantyDate} quantity={quantity} setQuantity={setQuantity} unit={unit} setUnit={setUnit} assetImage={assetImage} setAssetImage={setAssetImage} assetDepartment={assetDepartment} setAssetDepartment={setAssetDepartment} sn={sn} setSn={setSn} company={company} setCompany={setCompany} assetTag={assetTag} setAssetTag={setAssetTag} model={model} setModel={setModel} vendor={vendor} setVendor={setVendor} note={note} setNote={setNote} remark={remark} setRemark={setRemark} assetDocument={assetDocument} setAssetDocument={setAssetDocument} purchaseCondition={purchaseCondition} setPurchaseCondition={setPurchaseCondition} scrapValue={scrapValue} setScrapValue={setScrapValue} fieldOptions={fieldOptions}
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
        handleAssignLicenseToAsset={handleAssignLicenseToAsset}
        handleRevokeLicenseFromAsset={handleRevokeLicenseFromAsset}
        bundledItems={bundledItems} handleAddBundledItem={handleAddBundledItem} handleDeleteBundledItem={handleDeleteBundledItem}
      />
      {/* 🆕 โหลด modal เฉพาะตอนเปิด — ลด initial bundle */}
      {isITReportOpen && (
        <Suspense fallback={null}>
          <ITReportModal
            isOpen={isITReportOpen}
            onClose={() => setIsITReportOpen(false)}
            employees={employees}
            repairRequests={repairRequests}
            assets={assets}
            accessories={accessories}
            licenses={licenses}
          />
        </Suspense>
      )}
      {isSnipeITImportOpen && (
        <Suspense fallback={null}>
          <SnipeITImportModal
            isOpen={isSnipeITImportOpen}
            onClose={() => setIsSnipeITImportOpen(false)}
            onSuccess={(count) => {
              setCustomAlert({ isOpen: true, title: 'Import สำเร็จ!', message: `นำเข้า ${count} license จาก Snipe-IT เรียบร้อย`, type: 'success' });
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;