import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase.js'; 
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

// 🟢 เรียกใช้งานไลบรารีส่งอีเมล
import emailjs from '@emailjs/browser';

import useFirebaseData from './hooks/useFirebaseData.jsx';
import Sidebar from './components/Sidebar.jsx';
import TopHeader from './components/TopHeader.jsx';
import DashboardStats from './components/DashboardStats.jsx';
import ActionBar from './components/ActionBar.jsx';
import CustomAlert from './components/CustomAlert.jsx';
import LoginView from './components/LoginView.jsx';
import StaffView from './components/StaffView.jsx';
import ModalsContainer from './components/ModalsContainer.jsx';

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
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('darkMode', 'true'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('darkMode', 'false'); }
  }, [isDarkMode]);

  const {
    assets, accessories, employees, deletedEmployees, licenses, 
    repairRequests, officeSupplies, supplyRequests, transactions, replacementRequests
  } = useFirebaseData();

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
  const [assetDepartment, setAssetDepartment] = useState('DX');

  const [sn, setSn] = useState('');
  const [company, setCompany] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [model, setModel] = useState('');
  const [vendor, setVendor] = useState('');
  const [assetDocument, setAssetDocument] = useState(null);

  const [empForm, setEmpForm] = useState({
    fullName: '', fullNameEng: '', empId: '', nationalId: '', department: '', email: '', 
    company: '', position: '', nickname: '', manager: '', phone: ''
  });
  const [licenseForm, setLicenseForm] = useState({
    name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: '', quantity: 1
  });

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
  const [repairModal, setRepairModal] = useState({ isOpen: false, assetId: null, assetName: null, maxRepair: 0, brokenIndex: undefined });
  const [repairQuantity, setRepairQuantity] = useState(1);
  const [repairRemarks, setRepairRemarks] = useState('');
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, id: null, collectionName: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'ยืนยัน', cancelText: 'ยกเลิก', icon: 'warning' });
  const [resetPasswordModal, setResetPasswordModal] = useState(false);

  const [visibleAssetColumns, setVisibleAssetColumns] = useState({
    name: true, type: true, department: true, cost: true, status: true,
    assetTag: false, sn: false, model: false, vendor: false, company: false,
    purchaseDate: false, warrantyDate: false, assignedName: false
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
  const [repairFilterMonth, setRepairFilterMonth] = useState('ทั้งหมด'); 
  const [supplyFilterDate, setSupplyFilterDate] = useState('ทั้งหมด');
  const [officeSupplyStockFilter, setOfficeSupplyStockFilter] = useState('ทั้งหมด');
  const [showDeletedEmployees, setShowDeletedEmployees] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email && user.email.toLowerCase().startsWith('hr@')) {
          setAuthRole('hr');
          setActiveMenu('office_supplies');
        } else {
          setAuthRole('admin');
        }
      } else {
        setAuthRole(prev => prev === 'staff' ? prev : null);
      }
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    setName(''); setCost(''); setPurchaseDate(''); setWarrantyDate(''); setQuantity(1); setUnit('ชิ้น'); setAssetImage(null); setAssetDepartment('DX');
    setSn(''); setCompany(''); setAssetTag(''); setModel(''); setVendor(''); setAssetDocument(null);
    setAccFilterType('ทั้งหมด'); setSearchTerm(''); setAssetFilterType('ทั้งหมด'); 
    setAssetFilterStatus('ทั้งหมด'); setRepairFilterStatus('ทั้งหมด'); setAssetFilterDepartment('ทั้งหมด'); setSupplyFilterStatus('ทั้งหมด');
    setRepairFilterMonth('ทั้งหมด'); setSupplyFilterDate('ทั้งหมด'); setOfficeSupplyStockFilter('ทั้งหมด');
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
    if (!staffEmpIdInput.trim() || !staffPasswordInput.trim()) return;
    const foundEmp = employees.find(emp => emp.empId.toLowerCase() === staffEmpIdInput.trim().toLowerCase() && emp.nationalId === staffPasswordInput.trim());
    if (foundEmp) { setCurrentStaff(foundEmp); setStaffEmpIdInput(''); setStaffPasswordInput(''); } 
    else { setCustomAlert({ isOpen: true, title: 'เข้าสู่ระบบไม่สำเร็จ!', message: 'รหัสพนักงาน หรือ รหัสบัตรประชาชน ไม่ถูกต้อง', type: 'error' }); }
  };

  // 🟢 ฟังก์ชันส่งแจ้งซ่อม + อีเมล
  const handleSubmitRepairRequest = async (e) => {
    e.preventDefault(); if (!staffRepairForm.assetName.trim() || !staffRepairForm.issue.trim()) return;
    try {
      await addDoc(collection(db, 'repair_requests'), { empId: currentStaff.empId, empName: currentStaff.fullName, department: currentStaff.department, assetName: staffRepairForm.assetName, issue: staffRepairForm.issue, status: 'รอดำเนินการ', timestamp: Date.now(), createdAt: serverTimestamp() });
      
      const managerData = employees.find(emp => emp.fullName === currentStaff.manager);
      const managerEmail = managerData?.email || '';

      if (managerEmail) {
        try {
          await emailjs.send(
            'service_ri3q4ss', 'template_qzzmkqo',
            {
              request_type: 'แจ้งปัญหา IT / แจ้งซ่อม',
              emp_name: currentStaff.fullName,
              emp_id: currentStaff.empId,
              department: currentStaff.department || '-',
              item_name: staffRepairForm.assetName,
              details: `อาการที่พบ/รายละเอียด: ${staffRepairForm.issue}`,
              to_email: managerEmail 
            },
            'Y8fj0JAEUhLQcq9ig'
          );
        } catch (emailError) {
          console.error("ส่งอีเมลแจ้งซ่อมไม่สำเร็จ:", emailError);
        }
      }

      setStaffRepairForm({ assetName: '', issue: '' }); 
      setCustomAlert({ isOpen: true, title: 'ส่งเรื่องสำเร็จ!', message: 'ระบบได้รับเรื่องแจ้งปัญหา และแจ้งเตือนผ่านอีเมลแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  // 🟢 ฟังก์ชันส่งคำขอเบิกอุปกรณ์สำนักงาน + อีเมล
  const handleStaffSubmitSupplyRequest = async (supplyId, supplyName, reqQty, note) => {
    try {
      await addDoc(collection(db, 'supply_requests'), { empId: currentStaff.empId, empName: currentStaff.fullName, department: currentStaff.department, supplyId: supplyId, supplyName: supplyName, requestedQty: Number(reqQty), note: note, status: 'รอดำเนินการ', timestamp: Date.now(), createdAt: serverTimestamp() });
      
      const managerData = employees.find(emp => emp.fullName === currentStaff.manager);
      const managerEmail = managerData?.email || '';

      if (managerEmail) {
        try {
          await emailjs.send(
            'service_ri3q4ss', 'template_qzzmkqo',
            {
              request_type: 'ขอเบิกอุปกรณ์สำนักงาน',
              emp_name: currentStaff.fullName,
              emp_id: currentStaff.empId,
              department: currentStaff.department || '-',
              item_name: supplyName,
              details: `จำนวนที่ต้องการเบิก: ${reqQty} \nเหตุผล/หมายเหตุ: ${note || '-'}`,
              to_email: managerEmail 
            },
            'Y8fj0JAEUhLQcq9ig'
          );
        } catch (emailError) {
          console.error("ส่งอีเมลเบิกอุปกรณ์ไม่สำเร็จ:", emailError);
        }
      }

      setCustomAlert({ isOpen: true, title: 'ส่งคำขอสำเร็จ!', message: 'ส่งคำขอเบิกอุปกรณ์ และแจ้งเตือนผ่านอีเมลเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  // 🟢 ฟังก์ชันส่งคำขอเปลี่ยนเครื่อง + อีเมล
  const handleStaffSubmitReplacement = async (currentStatus, reason) => {
    if (!currentStaff) return;
    try {
      const managerData = employees.find(e => e.fullName === currentStaff.manager);
      const managerEmail = managerData?.email || '';
      
      await addDoc(collection(db, 'replacement_requests'), {
        empId: currentStaff.empId,
        empName: currentStaff.fullName,
        department: currentStaff.department,
        managerName: currentStaff.manager || '-',
        managerEmail: managerEmail,
        currentStatus: currentStatus,
        reason: reason,
        status: 'รอดำเนินการ',
        timestamp: Date.now(),
        createdAt: serverTimestamp()
      });

      if (managerEmail) {
        try {
          await emailjs.send(
            'service_ri3q4ss', 'template_qzzmkqo',
            {
              request_type: 'ขอเปลี่ยนเครื่องโน๊ตบุ๊ค',
              emp_name: currentStaff.fullName,
              emp_id: currentStaff.empId,
              department: currentStaff.department || '-',
              item_name: 'เปลี่ยนเครื่องโน๊ตบุ๊ค',
              details: `สถานะปัจจุบัน: ${currentStatus} \nเหตุผลความต้องการ: ${reason}`,
              to_email: managerEmail
            },
            'Y8fj0JAEUhLQcq9ig'
          );
        } catch (emailError) {
          console.error("ส่งอีเมลแจ้งหัวหน้าไม่สำเร็จ:", emailError);
        }
      }

      setCustomAlert({ isOpen: true, title: 'ส่งคำขอสำเร็จ!', message: 'ระบบได้ส่งคำขอเปลี่ยนเครื่องและแจ้งเตือนหัวหน้างานเรียบร้อยแล้ว', type: 'success' });
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
  const handleUpdateRepairRequestStatus = async (id, newStatus) => { try { await updateDoc(doc(db, 'repair_requests', id), { status: newStatus }); } catch (error) { setCustomAlert({ isOpen: true, title: 'อัปเดตผิดพลาด', message: error.message, type: 'error' }); } };
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
      const qtyToSave = activeMenu === 'accessories' ? 0 : Number(quantity);
      if (activeMenu === 'office_supplies') {
        await addDoc(collection(db, 'office_supplies'), { name, type, quantity: qtyToSave, unit, status: 'พร้อมใช้งาน', image: assetImage || null, createdAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, collectionName), {
          name, type, cost, purchaseDate, warrantyDate, quantity: qtyToSave, brokenQuantity: 0, status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null, image: assetImage || null, department: activeMenu === 'assets' ? assetDepartment : null, sn: activeMenu === 'assets' ? sn : null, company: activeMenu === 'assets' ? company : null, assetTag: activeMenu === 'assets' ? assetTag : null, model: activeMenu === 'assets' ? model : null, vendor: activeMenu === 'assets' ? vendor : null, document: activeMenu === 'assets' ? assetDocument : null, createdAt: serverTimestamp()
        });
      }
      setName(''); setCost(''); setPurchaseDate(''); setWarrantyDate(''); setQuantity(1); setUnit('ชิ้น'); setAssetImage(null); setAssetDepartment('DX'); setSn(''); setCompany(''); setAssetTag(''); setModel(''); setVendor(''); setAssetDocument(null);
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
      setEmpForm({ fullName: '', fullNameEng: '', empId: '', nationalId: '', department: '', email: '', company: '', position: '', nickname: '', manager: '', phone: '' }); 
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
        status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null, createdAt: serverTimestamp() 
      });
      setLicenseForm({ name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: '', quantity: 1 });
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

  const handleExportEmployees = () => { /* ... */ };
  const handleExportAccessories = () => { /* ... */ };
  const handleExportLicenses = () => { /* ... */ };
  const handleDownloadTemplate = () => { /* ... */ };
  const handleImportEmployees = (e) => { /* ... */ };
  const handleExportAssets = () => { /* ... */ }; 
  
  const openEditEmpModal = (emp) => setEditEmpModal({ isOpen: true, data: { ...emp } });
  const handleEditEmpChange = (e) => setEditEmpModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateEmployee = async (e) => { e.preventDefault(); try { const updatedData = { ...editEmpModal.data }; delete updatedData.id; await updateDoc(doc(db, 'employees', editEmpModal.data.id), updatedData); if (selectedEmployee && selectedEmployee.id === editEmpModal.data.id) setSelectedEmployee({ ...selectedEmployee, ...updatedData, id: editEmpModal.data.id }); setEditEmpModal({ isOpen: false, data: null }); setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขข้อมูลเรียบร้อยแล้ว', type: 'success' }); } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); } };

  const openEditAssetModal = (asset, collectionName) => setEditAssetModal({ isOpen: true, data: { ...asset }, collectionName });
  const handleEditAssetChange = (e) => setEditAssetModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateAsset = async (e) => { e.preventDefault(); try { const updatedData = { ...editAssetModal.data }; delete updatedData.id; if (editAssetModal.collectionName === 'accessories' && updatedData.remainingQuantity !== undefined) { updatedData.quantity = Number(updatedData.remainingQuantity) + (updatedData.assignees?.length || 0) + Number(updatedData.brokenQuantity || 0); delete updatedData.remainingQuantity; } await updateDoc(doc(db, editAssetModal.collectionName, editAssetModal.data.id), updatedData); setEditAssetModal({ isOpen: false, data: null, collectionName: '' }); setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขเรียบร้อยแล้ว', type: 'success' }); } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); } };

  const openEditLicenseModal = (license) => setEditLicenseModal({ isOpen: true, data: { ...license } });
  const handleEditLicenseChange = (e) => setEditLicenseModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateLicense = async (e) => { e.preventDefault(); try { const updatedData = { ...editLicenseModal.data }; delete updatedData.id; if (updatedData.remainingQuantity !== undefined) { updatedData.quantity = Number(updatedData.remainingQuantity) + (updatedData.assignees?.length || 0); delete updatedData.remainingQuantity; } await updateDoc(doc(db, 'licenses', editLicenseModal.data.id), updatedData); setEditLicenseModal({ isOpen: false, data: null }); setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขเรียบร้อยแล้ว', type: 'success' }); } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); } };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutEmpId) return;
    const emp = employees.find(e => e.id === checkoutEmpId);
    if (!emp) return;

    try {
      if (checkoutModal.collectionName === 'accessories') {
        const item = accessories.find(a => a.id === checkoutModal.assetId);
        const remainingQty = item ? (item.quantity ? (Number(item.quantity) - (item.assignees?.length || 0)) : (1 - (item.assignees?.length || 0))) : 0;
        
        if (item && remainingQty > 0) {
          const newAssignees = item.assignees ? [...item.assignees] : [];
          newAssignees.push({ 
            checkoutId: Date.now().toString(), 
            empId: emp.id, 
            empName: `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`,
            serialNumber: checkoutModal.sn || '' 
          });

          const updateData = { assignees: newAssignees };
          
          if (checkoutModal.snIndex !== undefined && item.availableSNs) {
            const newAvailableSNs = [...item.availableSNs];
            newAvailableSNs.splice(checkoutModal.snIndex, 1);
            updateData.availableSNs = newAvailableSNs;
          }

          await updateDoc(doc(db, 'accessories', checkoutModal.assetId), updateData);
          await addDoc(collection(db, 'accessories_transactions'), {
            empId: emp.id, assetName: item.name, category: 'accessories', action: 'เบิกจ่าย', condition: 'ปกติ', remarks: `SN: ${checkoutModal.sn || '-'} | ${checkoutRemarks.trim() || '-'}`, timestamp: Date.now()
          });
        } else {
          return setCustomAlert({ isOpen: true, title: 'ข้อผิดพลาด', message: 'จำนวนอุปกรณ์ไม่เพียงพอ', type: 'error' });
        }
      } else {
        await updateDoc(doc(db, checkoutModal.collectionName, checkoutModal.assetId), {
          status: 'ถูกใช้งาน', assignedTo: emp.id, assignedName: `${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`
        });
        const itemArray = checkoutModal.collectionName === 'assets' ? assets : licenses;
        const itemToCheckout = itemArray.find(a => a.id === checkoutModal.assetId);
        const txCollection = checkoutModal.collectionName === 'assets' ? 'assets_transactions' : 'licenses_transactions';

        await addDoc(collection(db, txCollection), {
          empId: emp.id, assetName: itemToCheckout ? itemToCheckout.name : '-', category: checkoutModal.collectionName, action: 'เบิกจ่าย', condition: 'ปกติ', remarks: checkoutRemarks.trim() || '-', timestamp: Date.now()
        });
      }
      setCheckoutModal({ isOpen: false, assetId: null, collectionName: '', sn: '', snIndex: undefined }); 
      setCheckoutEmpId(''); setCheckoutSearchTerm(''); setCheckoutRemarks('');
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
             updateData.brokenQuantity = (Number(item.brokenQuantity) || 0) + 1;
             updateData.brokenSNs = [...(item.brokenSNs || []), returnedItem?.serialNumber || ''];
           } else {
             updateData.availableSNs = [...(item.availableSNs || []), returnedItem?.serialNumber || ''];
           }
        }

        updateData.status = 'พร้อมใช้งาน'; updateData.assignedTo = null; updateData.assignedName = null;
        await updateDoc(doc(db, collectionName, returnModal.assetId), updateData);
        const txCollection = collectionName === 'accessories' ? 'accessories_transactions' : 'licenses_transactions';
        await addDoc(collection(db, txCollection), { empId: returnModal.empId, empName: returnModal.empName, assetName: returnModal.assetName, category: collectionName, action: 'รับคืน', condition: returnCondition === 'broken' ? 'ชำรุด' : 'ปกติ', remarks: returnRemarks.trim() || '-', timestamp: Date.now() });

      } else {
        await updateDoc(doc(db, 'assets', returnModal.assetId), { status: returnCondition === 'broken' ? 'ชำรุดเสียหาย' : 'พร้อมใช้งาน', assignedTo: null, assignedName: null });
        await addDoc(collection(db, 'assets_transactions'), { empId: returnModal.empId, empName: returnModal.empName, assetName: returnModal.assetName, category: 'assets', action: 'รับคืน', condition: returnCondition === 'broken' ? 'ชำรุด' : 'ปกติ', remarks: returnRemarks.trim() || '-', timestamp: Date.now() });
      }

      setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
      setReturnCondition('good'); setReturnRemarks('');
      setCustomAlert({ isOpen: true, title: 'รับคืนสำเร็จ', message: 'รับคืนเข้าระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' }); }
  };

  const handleConfirmRepair = async (e) => { /* ... */ };

  const getUniqueMonths = (data) => { /* ... */ return []; };
  const formatMonthLabel = (monthStr) => { /* ... */ };
  const getUniqueDates = (data) => { /* ... */ return []; };
  const formatDateLabel = (dateStr) => { /* ... */ };

  let baseData = [];
  if (activeMenu === 'assets') baseData = assets.filter(item => (assetFilterType === 'ทั้งหมด' || item.type === assetFilterType) && (assetFilterStatus === 'ทั้งหมด' || (item.status || 'พร้อมใช้งาน') === assetFilterStatus) && (assetFilterDepartment === 'ทั้งหมด' || item.department === assetFilterDepartment));
  else if (activeMenu === 'licenses') baseData = licenses;
  else if (activeMenu === 'employees') baseData = showDeletedEmployees ? deletedEmployees : employees;
  else if (activeMenu === 'accessories') baseData = accessories.filter(item => accFilterType === 'ทั้งหมด' || item.type === accFilterType);
  else if (activeMenu === 'office_supplies') baseData = officeSupplies;

  let currentData = baseData;
  if (searchTerm.trim() !== '') {
    const lowerCaseTerm = searchTerm.toLowerCase();
    currentData = baseData.filter(item => {
      if (activeMenu === 'employees') return (item.fullName?.toLowerCase().includes(lowerCaseTerm) || item.fullNameEng?.toLowerCase().includes(lowerCaseTerm) || item.empId?.toLowerCase().includes(lowerCaseTerm) || item.nickname?.toLowerCase().includes(lowerCaseTerm));
      else return (item.name?.toLowerCase().includes(lowerCaseTerm) || item.type?.toLowerCase().includes(lowerCaseTerm));
    });
  }

  let currentRepairRequests = repairRequests; 
  let currentSupplyRequests = supplyRequests;

  const handleSelectEmployee = (e, id) => e.target.checked ? setSelectedEmployeeIds(prev => [...prev, id]) : setSelectedEmployeeIds(prev => prev.filter(empId => empId !== id));
  const handleSelectAllEmployees = (e) => e.target.checked ? setSelectedEmployeeIds(currentData.map(emp => emp.id)) : setSelectedEmployeeIds([]);
  const handleSelectAccessory = (e, id) => e.target.checked ? setSelectedAccessoryIds(prev => [...prev, id]) : setSelectedAccessoryIds(prev => prev.filter(itemId => itemId !== id));
  const handleSelectAllAccessories = (e) => e.target.checked ? setSelectedAccessoryIds(currentData.map(item => item.id)) : setSelectedAccessoryIds([]);
  const handleSelectOfficeSupply = (e, id) => e.target.checked ? setSelectedOfficeSupplyIds(prev => [...prev, id]) : setSelectedOfficeSupplyIds(prev => prev.filter(itemId => itemId !== id));
  const handleSelectAllOfficeSupplies = (e) => e.target.checked ? setSelectedOfficeSupplyIds(currentData.map(item => item.id)) : setSelectedOfficeSupplyIds([]);
  const handleSelectLicense = (e, id) => e.target.checked ? setSelectedLicenseIds(prev => [...prev, id]) : setSelectedLicenseIds(prev => prev.filter(itemId => itemId !== id));
  const handleSelectAllLicenses = (e) => e.target.checked ? setSelectedLicenseIds(currentData.map(item => item.id)) : setSelectedLicenseIds([]);

  const menuTitle = activeMenu === 'dashboard' ? 'ภาพรวมระบบ (Dashboard)' : 
                    activeMenu === 'assets' ? 'ทรัพย์สิน IT หลัก' : 
                    activeMenu === 'licenses' ? 'โปรแกรม/ใบอนุญาต' : 
                    activeMenu === 'accessories' ? 'อุปกรณ์เสริม (Accessories)' : 
                    activeMenu === 'repairs' ? 'แจ้งปัญหา IT' : 
                    activeMenu === 'office_supplies' ? 'คลังอุปกรณ์สำนักงาน' : 
                    activeMenu === 'supply_requests' ? 'คำขอเบิกอุปกรณ์' : 
                    activeMenu === 'replacement_requests' ? 'คำขอเปลี่ยนเครื่อง' : 'ข้อมูลพนักงาน';

  const checkLicenseExpiration = (expirationDate) => {
    if (!expirationDate) return { isExpiring: false, statusText: '', colorClass: '' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { isExpiring: true, statusText: 'หมดอายุแล้ว', colorClass: 'text-red-600 bg-red-50 border-red-200' };
    else if (diffDays <= 30) return { isExpiring: true, statusText: `เหลืออีก ${diffDays} วัน`, colorClass: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { isExpiring: false, statusText: '', colorClass: '' };
  };

  const pendingRepairsCount = authRole === 'admin' ? repairRequests.filter(req => req.status === 'รอดำเนินการ').length : 0;
  const pendingSuppliesCount = supplyRequests.filter(req => req.status === 'รอดำเนินการ').length;
  const expiringLicensesCount = authRole === 'admin' ? licenses.filter(lic => checkLicenseExpiration(lic.expirationDate).isExpiring).length : 0;
  
  const totalPendingCount = pendingRepairsCount + pendingSuppliesCount + expiringLicensesCount;
  const totalSystemItems = assets.length + licenses.length + accessories.length + employees.length;
  const currentDataLength = currentData.length;

  if (authLoading) return (<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#1E487A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div></div>);
  
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
      />
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
    </React.Fragment>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f4f7fe] text-slate-900 font-sans transition-colors duration-300" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onResetPassword={() => setResetPasswordModal(true)} authRole={authRole} />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-transparent">
        <TopHeader menuTitle={menuTitle} notifRef={notifRef} isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} totalPendingCount={totalPendingCount} pendingRepairsCount={pendingRepairsCount} pendingSuppliesCount={pendingSuppliesCount} expiringLicensesCount={expiringLicensesCount} setActiveMenu={setActiveMenu} activeMenu={activeMenu} totalSystemItems={totalSystemItems} currentDataLength={currentDataLength} handleLogout={handleLogout} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeMenu === 'dashboard' ? (
            <DashboardStats assets={assets} licenses={licenses} accessories={accessories} employees={employees} />
          ) : activeMenu === 'repairs' ? (
            <RepairTable repairRequests={repairRequests} currentRepairRequests={currentRepairRequests} repairFilterMonth={repairFilterMonth} setRepairFilterMonth={setRepairFilterMonth} repairFilterStatus={repairFilterStatus} setRepairFilterStatus={setRepairFilterStatus} getUniqueMonths={getUniqueMonths} formatMonthLabel={formatMonthLabel} handleUpdateRepairRequestStatus={handleUpdateRepairRequestStatus} handleDeleteRepairRequest={handleDeleteRepairRequest} />
          ) : activeMenu === 'supply_requests' ? (
            <SupplyRequestTable supplyRequests={supplyRequests} currentSupplyRequests={currentSupplyRequests} supplyFilterDate={supplyFilterDate} setSupplyFilterDate={setSupplyFilterDate} supplyFilterStatus={supplyFilterStatus} setSupplyFilterStatus={setSupplyFilterStatus} getUniqueDates={getUniqueDates} formatDateLabel={formatDateLabel} handleUpdateSupplyRequestStatus={handleUpdateSupplyRequestStatus} handleDelete={handleDelete} />
          ) : activeMenu === 'replacement_requests' ? (
            <ReplacementRequestTable 
              replacementRequests={replacementRequests}
              handleUpdateReplacementStatus={handleUpdateReplacementStatus}
              handleDeleteReplacement={handleDeleteReplacement}
            />
          ) : (
            <div className="h-full flex flex-col">
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col flex-1 transition-colors duration-300">
                <ActionBar 
                  menuTitle={menuTitle} activeMenu={activeMenu} searchTerm={searchTerm} setSearchTerm={setSearchTerm} showDeletedEmployees={showDeletedEmployees} setShowDeletedEmployees={setShowDeletedEmployees} setIsImportModalOpen={setIsImportModalOpen} handleExportEmployees={handleExportEmployees}
                  selectedEmployeeIds={selectedEmployeeIds} setConfirmDeleteModal={setConfirmDeleteModal} assetFilterDepartment={assetFilterDepartment} setAssetFilterDepartment={setAssetFilterDepartment} assetFilterType={assetFilterType} setAssetFilterType={setAssetFilterType} assetFilterStatus={assetFilterStatus} setAssetFilterStatus={setAssetFilterStatus} accFilterType={accFilterType} setAccFilterType={setAccFilterType}
                  handleExportAccessories={handleExportAccessories} selectedAccessoryIds={selectedAccessoryIds} officeSupplyStockFilter={officeSupplyStockFilter} setOfficeSupplyStockFilter={setOfficeSupplyStockFilter} selectedOfficeSupplyIds={selectedOfficeSupplyIds} setIsAddModalOpen={setIsAddModalOpen} handleExportAssets={handleExportAssets} visibleAssetColumns={visibleAssetColumns} setVisibleAssetColumns={setVisibleAssetColumns}
                  handleExportLicenses={handleExportLicenses} selectedLicenseIds={selectedLicenseIds}
                />
                
                {currentData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12"><span className="text-5xl mb-4 opacity-50 drop-shadow-sm">📂</span><p className="font-bold text-lg text-slate-500">ไม่พบข้อมูลที่ค้นหา</p></div>
                ) : (
                  <div className="overflow-x-auto flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors duration-300">
                    {activeMenu === 'employees' ? (
                      <EmployeeTable currentData={currentData} selectedEmployeeIds={selectedEmployeeIds} handleSelectAllEmployees={handleSelectAllEmployees} handleSelectEmployee={handleSelectEmployee} setSelectedEmployee={setSelectedEmployee} setEmpModalTab={setEmpModalTab} showDeletedEmployees={showDeletedEmployees} handleRestoreEmployee={handleRestoreEmployee} openEditEmpModal={openEditEmpModal} setConfirmDeleteModal={setConfirmDeleteModal} />
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
                        openEditLicenseModal={openEditLicenseModal}
                        setConfirmDeleteModal={setConfirmDeleteModal}
                      />
                    ) : activeMenu === 'office_supplies' ? (
                      <OfficeSupplyTable currentData={currentData} selectedOfficeSupplyIds={selectedOfficeSupplyIds} handleSelectAllOfficeSupplies={handleSelectAllOfficeSupplies} handleSelectOfficeSupply={handleSelectOfficeSupply} openEditAssetModal={openEditAssetModal} setConfirmDeleteModal={setConfirmDeleteModal} activeMenu={activeMenu} />
                    ) : activeMenu === 'accessories' ? (
                      <AccessoryTable currentData={currentData} selectedAccessoryIds={selectedAccessoryIds} handleSelectAllAccessories={handleSelectAllAccessories} handleSelectAccessory={handleSelectAccessory} setSelectedAssetDetail={setSelectedAssetDetail} setSelectedAssetCategory={setSelectedAssetCategory} setCheckoutModal={setCheckoutModal} openEditAssetModal={openEditAssetModal} setConfirmDeleteModal={setConfirmDeleteModal} />
                    ) : activeMenu === 'assets' ? (
                      <AssetTable currentData={currentData} setSelectedAssetDetail={setSelectedAssetDetail} setSelectedAssetCategory={setSelectedAssetCategory} setCheckoutModal={setCheckoutModal} handleCheckin={handleCheckin} openEditAssetModal={openEditAssetModal} setConfirmDeleteModal={setConfirmDeleteModal} visibleAssetColumns={visibleAssetColumns} />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <ModalsContainer 
        isAddModalOpen={isAddModalOpen} setIsAddModalOpen={setIsAddModalOpen} activeMenu={activeMenu} handleAddEmployee={handleAddEmployee} empForm={empForm} handleEmpChange={handleEmpChange} handleAddLicense={handleAddLicense} licenseForm={licenseForm} handleLicenseChange={handleLicenseChange} handleAdd={handleAdd} name={name} setName={setName} type={type} setType={setType} cost={cost} setCost={setCost} purchaseDate={purchaseDate} setPurchaseDate={setPurchaseDate} warrantyDate={warrantyDate} setWarrantyDate={setWarrantyDate} quantity={quantity} setQuantity={setQuantity} unit={unit} setUnit={setUnit} assetImage={assetImage} setAssetImage={setAssetImage} assetDepartment={assetDepartment} setAssetDepartment={setAssetDepartment} sn={sn} setSn={setSn} company={company} setCompany={setCompany} assetTag={assetTag} setAssetTag={setAssetTag} model={model} setModel={setModel} vendor={vendor} setVendor={setVendor} assetDocument={assetDocument} setAssetDocument={setAssetDocument}
        checkoutModal={checkoutModal} setCheckoutModal={setCheckoutModal} handleCheckout={handleCheckout} checkoutSearchTerm={checkoutSearchTerm} setCheckoutSearchTerm={setCheckoutSearchTerm} checkoutEmpId={checkoutEmpId} setCheckoutEmpId={setCheckoutEmpId} employees={employees} checkoutRemarks={checkoutRemarks} setCheckoutRemarks={setCheckoutRemarks}
        selectedEmployee={selectedEmployee} setSelectedEmployee={setSelectedEmployee} empModalTab={empModalTab} setEmpModalTab={setEmpModalTab} assets={assets} licenses={licenses} accessories={accessories} transactions={transactions} openEditEmpModal={openEditEmpModal} handleCheckin={handleCheckin} setReturnModal={setReturnModal}
        selectedAssetDetail={selectedAssetDetail} setSelectedAssetDetail={setSelectedAssetDetail} selectedAssetCategory={selectedAssetCategory} setSelectedAssetCategory={setSelectedAssetCategory} openEditLicenseModal={openEditLicenseModal} openEditAssetModal={openEditAssetModal} showConfirm={showConfirm} setCustomAlert={setCustomAlert}
        editEmpModal={editEmpModal} setEditEmpModal={setEditEmpModal} handleUpdateEmployee={handleUpdateEmployee} handleEditEmpChange={handleEditEmpChange}
        editAssetModal={editAssetModal} setEditAssetModal={setEditAssetModal} handleUpdateAsset={handleUpdateAsset} handleEditAssetChange={handleEditAssetChange}
        editLicenseModal={editLicenseModal} setEditLicenseModal={setEditLicenseModal} handleUpdateLicense={handleUpdateLicense} handleEditLicenseChange={handleEditLicenseChange}
        isImportModalOpen={isImportModalOpen} setIsImportModalOpen={setIsImportModalOpen} handleDownloadTemplate={handleDownloadTemplate} handleImportEmployees={handleImportEmployees}
        returnModal={returnModal} returnCondition={returnCondition} setReturnCondition={setReturnCondition} returnRemarks={returnRemarks} setReturnRemarks={setReturnRemarks} handleConfirmReturn={handleConfirmReturn}
        repairModal={repairModal} setRepairModal={setRepairModal} repairQuantity={repairQuantity} setRepairQuantity={setRepairQuantity} repairRemarks={repairRemarks} setRepairRemarks={setRepairRemarks} handleConfirmRepair={handleConfirmRepair}
        confirmDeleteModal={confirmDeleteModal} setConfirmDeleteModal={setConfirmDeleteModal} executeDelete={executeDelete}
        confirmModal={confirmModal} handleConfirmModalOk={handleConfirmModalOk} closeConfirmModal={closeConfirmModal}
        resetPasswordModal={resetPasswordModal} setResetPasswordModal={setResetPasswordModal}
      />
    </div>
  );
}

export default App;