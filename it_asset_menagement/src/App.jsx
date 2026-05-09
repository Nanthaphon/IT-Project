import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase'; 
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser'; 

// Hooks
import useFirebaseData from './hooks/useFirebaseData'; // ✅ โหลดข้อมูลจากโฟลเดอร์ hooks

// Components หลัก
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import DashboardStats from './components/DashboardStats';
import ActionBar from './components/ActionBar';

// Modals & Views
import CustomAlert from './components/CustomAlert';
import AddModal from './components/AddModal';
import CheckoutModal from './components/CheckoutModal';
import EmployeeDetailsModal from './components/EmployeeDetailsModal';
import AssetDetailsModal from './components/AssetDetailsModal';
import EditEmpModal from './components/EditEmpModal';
import EditAssetModal from './components/EditAssetModal';
import EditLicenseModal from './components/EditLicenseModal';
import ImportModal from './components/ImportModal';
import ReturnModal from './components/ReturnModal';
import RepairModal from './components/RepairModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ConfirmModal from './components/ConfirmModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import LoginView from './components/LoginView';
import StaffView from './components/StaffView';

// Tables Components (แยกส่วนตารางทั้งหมด)
import EmployeeTable from './components/EmployeeTable'; 
import LicenseTable from './components/LicenseTable';   
import OfficeSupplyTable from './components/OfficeSupplyTable';
import AssetTable from './components/AssetTable';       
import AccessoryTable from './components/AccessoryTable'; 
import RepairTable from './components/RepairTable';               
import SupplyRequestTable from './components/SupplyRequestTable'; 

function App() {
  const [authRole, setAuthRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [staffEmpIdInput, setStaffEmpIdInput] = useState('');
  const [currentStaff, setCurrentStaff] = useState(null);
  const [staffRepairForm, setStaffRepairForm] = useState({ assetName: '', issue: '' });
  const [editStaffRepairModal, setEditStaffRepairModal] = useState({ isOpen: false, data: null });

  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  // ✅ ใช้ Custom Hook โหลดข้อมูลทั้งหมดมาจาก Firebase ภายในบรรทัดเดียว!
  const {
    assets, accessories, employees, deletedEmployees, licenses, 
    repairRequests, officeSupplies, supplyRequests, transactions
  } = useFirebaseData();

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState([]); 
  const [selectedOfficeSupplyIds, setSelectedOfficeSupplyIds] = useState([]);

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
    fullName: '', fullNameEng: '', empId: '', department: '', email: '',
    company: '', position: '', nickname: '', manager: '', phone: ''
  });
  const [licenseForm, setLicenseForm] = useState({
    name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: ''
  });

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empModalTab, setEmpModalTab] = useState('info');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState({ 
    isOpen: false, assetId: null, collectionName: '', sn: '', snIndex: undefined, itemCost: '', itemPurchaseDate: '', itemWarrantyDate: ''
  });
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

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const showConfirm = (title, message, onConfirm, opts = {}) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, confirmText: opts.confirmText || 'ยืนยัน', cancelText: opts.cancelText || 'ยกเลิก', icon: opts.icon || 'warning' });
  };
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
        setAuthRole('admin');
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
    setRepairFilterMonth('ทั้งหมด'); 
    setSupplyFilterDate('ทั้งหมด'); 
    setOfficeSupplyStockFilter('ทั้งหมด');
    setShowDeletedEmployees(false); 
    setSelectedEmployeeIds([]); setSelectedAccessoryIds([]); setSelectedOfficeSupplyIds([]);
    
    if (activeMenu === 'assets') setType('คอมพิวเตอร์');
    else if (activeMenu === 'accessories') setType('เมาส์ (Mouse)');
    else if (activeMenu === 'office_supplies') setType('เครื่องเขียน');
  }, [activeMenu]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginForm.username, loginForm.password);
      setShowAdminLogin(false);
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      setLoginError('Email หรือ Password ไม่ถูกต้อง');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (authRole === 'admin') await signOut(auth);
    setAuthRole(null);
    setCurrentStaff(null);
  };

  const handleStaffLogin = (e) => {
    e.preventDefault();
    if (!staffEmpIdInput.trim()) return;
    const foundEmp = employees.find(emp => emp.empId.toLowerCase() === staffEmpIdInput.trim().toLowerCase());
    if (foundEmp) { setCurrentStaff(foundEmp); setStaffEmpIdInput(''); } 
    else setCustomAlert({ isOpen: true, title: 'ไม่พบข้อมูล!', message: 'รหัสพนักงานนี้ไม่มีอยู่ในระบบ กรุณาตรวจสอบอีกครั้ง', type: 'error' });
  };

  const handleSubmitRepairRequest = async (e) => {
    e.preventDefault();
    if (!staffRepairForm.assetName.trim() || !staffRepairForm.issue.trim()) return;
    try {
      await addDoc(collection(db, 'repair_requests'), {
        empId: currentStaff.empId, empName: currentStaff.fullName, department: currentStaff.department,
        assetName: staffRepairForm.assetName, issue: staffRepairForm.issue, status: 'รอดำเนินการ', timestamp: Date.now(), createdAt: serverTimestamp()
      });

      try {
        await emailjs.send(
          'service_ri3q4ss',
          'template_qzzmkqo',
          {
            request_type: 'แจ้งปัญหา IT',
            emp_name: currentStaff.fullName,
            emp_id: currentStaff.empId,
            department: currentStaff.department || '-',
            item_name: staffRepairForm.assetName,
            details: staffRepairForm.issue,
          },
          'Y8fj0JAEUhLQcq9ig'
        );
      } catch (emailError) {
        console.error("ส่งอีเมลไม่สำเร็จ:", emailError);
      }

      setStaffRepairForm({ assetName: '', issue: '' });
      setCustomAlert({ isOpen: true, title: 'ส่งเรื่องสำเร็จ!', message: 'ระบบได้รับเรื่องแจ้งปัญหาของคุณแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  const handleStaffSubmitSupplyRequest = async (supplyId, supplyName, reqQty, note) => {
    try {
      await addDoc(collection(db, 'supply_requests'), {
        empId: currentStaff.empId, 
        empName: currentStaff.fullName, 
        department: currentStaff.department,
        supplyId: supplyId,
        supplyName: supplyName, 
        requestedQty: Number(reqQty),
        note: note, 
        status: 'รอดำเนินการ', 
        timestamp: Date.now(), 
        createdAt: serverTimestamp()
      });

      try {
        await emailjs.send(
          'service_ri3q4ss',
          'template_qzzmkqo',
          {
            request_type: 'ขอเบิกอุปกรณ์สำนักงาน',
            emp_name: currentStaff.fullName,
            emp_id: currentStaff.empId,
            department: currentStaff.department || '-',
            item_name: supplyName,
            details: `จำนวน: ${reqQty} \nหมายเหตุ: ${note || '-'}`,
          },
          'Y8fj0JAEUhLQcq9ig'
        );
      } catch (emailError) {
        console.error("ส่งอีเมลไม่สำเร็จ:", emailError);
      }

      setCustomAlert({ isOpen: true, title: 'ส่งคำขอสำเร็จ!', message: 'ส่งคำขอเบิกอุปกรณ์สำนักงานเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  const handleStaffDeleteRepair = (id) => {
    showConfirm(
      'ยืนยันการยกเลิก', 'คุณต้องการยกเลิกและลบรายการแจ้งปัญหานี้ใช่หรือไม่?',
      async () => {
        try { await deleteDoc(doc(db, 'repair_requests', id)); setCustomAlert({ isOpen: true, title: 'ยกเลิกสำเร็จ!', message: 'ลบรายการแจ้งปัญหาของคุณเรียบร้อยแล้ว', type: 'success' }); }
        catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
      },
      { confirmText: 'ยืนยันลบ', icon: 'trash' }
    );
  };

  const handleStaffUpdateRepair = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'repair_requests', editStaffRepairModal.data.id), { assetName: editStaffRepairModal.data.assetName, issue: editStaffRepairModal.data.issue });
      setEditStaffRepairModal({ isOpen: false, data: null });
      setCustomAlert({ isOpen: true, title: 'แก้ไขสำเร็จ!', message: 'อัปเดตข้อมูลแจ้งปัญหาเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

  const handleUpdateRepairRequestStatus = async (id, newStatus) => {
    try { await updateDoc(doc(db, 'repair_requests', id), { status: newStatus }); } 
    catch (error) { setCustomAlert({ isOpen: true, title: 'อัปเดตผิดพลาด', message: error.message, type: 'error' }); }
  };

  const handleDeleteRepairRequest = (id) => {
    showConfirm(
      'ยืนยันการลบ', 'คุณต้องการลบรายการนี้ออกจากระบบใช่หรือไม่?',
      async () => {
        try { await deleteDoc(doc(db, 'repair_requests', id)); }
        catch (error) { setCustomAlert({ isOpen: true, title: 'ลบผิดพลาด', message: error.message, type: 'error' }); }
      },
      { confirmText: 'ยืนยันลบ', icon: 'trash' }
    );
  };

  const handleUpdateSupplyRequestStatus = async (req, newStatus) => {
    try {
      if (newStatus === 'อนุมัติแล้ว' && req.status !== 'อนุมัติแล้ว') {
        const supplyItem = officeSupplies.find(s => s.id === req.supplyId);
        if (!supplyItem || Number(supplyItem.quantity) < Number(req.requestedQty)) {
          setCustomAlert({ isOpen: true, title: 'สต็อกไม่พอ!', message: 'อุปกรณ์ในคลังมีไม่พอให้เบิก กรุณาตรวจสอบสต็อก', type: 'error' });
          return;
        }
        await updateDoc(doc(db, 'office_supplies', req.supplyId), {
          quantity: Number(supplyItem.quantity) - Number(req.requestedQty)
        });
      } else if (req.status === 'อนุมัติแล้ว' && newStatus !== 'อนุมัติแล้ว') {
         const supplyItem = officeSupplies.find(s => s.id === req.supplyId);
         if (supplyItem) {
           await updateDoc(doc(db, 'office_supplies', req.supplyId), {
             quantity: Number(supplyItem.quantity) + Number(req.requestedQty)
           });
         }
      }
      await updateDoc(doc(db, 'supply_requests', req.id), { status: newStatus });
    } catch (error) {
      setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' });
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const collectionName = activeMenu === 'assets' ? 'assets' : activeMenu === 'office_supplies' ? 'office_supplies' : 'accessories';
    try {
      const qtyToSave = activeMenu === 'accessories' ? 0 : Number(quantity);

      if (activeMenu === 'office_supplies') {
        await addDoc(collection(db, 'office_supplies'), {
          name, type, quantity: qtyToSave, unit, status: 'พร้อมใช้งาน', image: assetImage || null, createdAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, collectionName), {
          name, type, cost, purchaseDate, warrantyDate, quantity: qtyToSave, brokenQuantity: 0, status: 'พร้อมใช้งาน', 
          assignedTo: null, assignedName: null, image: assetImage || null,
          department: activeMenu === 'assets' ? assetDepartment : null,
          sn: activeMenu === 'assets' ? sn : null,
          company: activeMenu === 'assets' ? company : null,
          assetTag: activeMenu === 'assets' ? assetTag : null,
          model: activeMenu === 'assets' ? model : null,
          vendor: activeMenu === 'assets' ? vendor : null,
          document: activeMenu === 'assets' ? assetDocument : null,
          createdAt: serverTimestamp()
        });
      }
      setName(''); setCost(''); setPurchaseDate(''); setWarrantyDate(''); setQuantity(1); setUnit('ชิ้น'); setAssetImage(null); setAssetDepartment('DX');
      setSn(''); setCompany(''); setAssetTag(''); setModel(''); setVendor(''); setAssetDocument(null);
      setIsAddModalOpen(false);
      setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'เพิ่มรายการใหม่ลงระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) {
      setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' });
    }
  };

  const handleEmpChange = (e) => setEmpForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleLicenseChange = (e) => setLicenseForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const isDuplicate = employees.some(emp => String(emp.empId).toLowerCase() === empForm.empId.trim().toLowerCase() || String(emp.fullName).toLowerCase() === empForm.fullName.trim().toLowerCase());
    if (isDuplicate) return setCustomAlert({ isOpen: true, title: 'ข้อมูลซ้ำซ้อน!', message: `รหัสพนักงาน หรือ ชื่อ-นามสกุล นี้มีอยู่ในระบบแล้ว`, type: 'error' });
    try {
      await addDoc(collection(db, 'employees'), { ...empForm, createdAt: serverTimestamp() });
      setEmpForm({ fullName: '', fullNameEng: '', empId: '', department: '', email: '', company: '', position: '', nickname: '', manager: '', phone: '' });
      setIsAddModalOpen(false); setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'เพิ่มข้อมูลพนักงานใหม่ลงระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  const handleAddLicense = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'licenses'), { ...licenseForm, status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null, createdAt: serverTimestamp() });
      setLicenseForm({ name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: '' });
      setIsAddModalOpen(false); setCustomAlert({ isOpen: true, title: 'บันทึกสำเร็จ!', message: 'เพิ่มข้อมูลโปรแกรม/License ใหม่ลงระบบเรียบร้อยแล้ว', type: 'success' });
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
          const empData = { ...emp };
          delete empData.id;
          await setDoc(doc(db, 'deleted_employees', emp.id), { ...empData, deletedAt: serverTimestamp() });
        }
      }
      for (const targetId of idsToDelete) { await deleteDoc(doc(db, collectionName, targetId)); }
      
      if (collectionName === 'employees') {
        const userAssets = assets.filter(item => idsToDelete.includes(item.assignedTo));
        for (const asset of userAssets) { await updateDoc(doc(db, 'assets', asset.id), { status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null }); }
        const userAccessories = accessories.filter(item => idsToDelete.includes(item.assignedTo) || (item.assignees && item.assignees.some(a => idsToDelete.includes(a.empId))));
        for (const acc of userAccessories) {
          if (acc.assignees) {
            const remainingAssignees = acc.assignees.filter(a => !idsToDelete.includes(a.empId));
            await updateDoc(doc(db, 'accessories', acc.id), { assignees: remainingAssignees });
          } else { await updateDoc(doc(db, 'accessories', acc.id), { status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null }); }
        }
        const userLicenses = licenses.filter(item => idsToDelete.includes(item.assignedTo));
        for (const lic of userLicenses) { await updateDoc(doc(db, 'licenses', lic.id), { status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null }); }

        const reqsToDelete = repairRequests.filter(req => deletedEmpStringIds.includes(String(req.empId).toLowerCase()));
        for (const req of reqsToDelete) {
          await deleteDoc(doc(db, 'repair_requests', req.id));
        }
      }
      setConfirmDeleteModal({ isOpen: false, id: null, collectionName: null });
      setSelectedEmployeeIds([]); setSelectedAccessoryIds([]); setSelectedOfficeSupplyIds([]);
      setCustomAlert({ isOpen: true, title: 'ลบสำเร็จ!', message: 'ลบรายการออกจากระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  const handleRestoreEmployee = async (emp) => {
    try {
      const empData = { ...emp };
      delete empData.id;
      delete empData.deletedAt;
      await setDoc(doc(db, 'employees', emp.id), { ...empData, createdAt: serverTimestamp() });
      await deleteDoc(doc(db, 'deleted_employees', emp.id));
      setCustomAlert({ isOpen: true, title: 'กู้คืนสำเร็จ!', message: 'กู้คืนข้อมูลพนักงานกลับสู่ระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) {
      setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' });
    }
  };

  const handleExportEmployees = () => {
    if (employees.length === 0) return setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: 'ไม่มีข้อมูลพนักงานให้ส่งออก', type: 'error' });
    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล(TH)', 'ชื่อ(EN)', 'ชื่อเล่น', 'เบอร์โทร', 'อีเมล', 'บริษัท', 'แผนก', 'ตำแหน่ง', 'หัวหน้างาน'];
    const rows = employees.map(emp => [
      emp.empId || '', emp.fullName || '', emp.fullNameEng || '', emp.nickname || '',
      emp.phone || '', emp.email || '', emp.company || '', emp.department || '',
      emp.position || '', emp.manager || ''
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "employees_export.csv";
    link.click();
  };

  const handleExportAccessories = () => {
    if (accessories.length === 0) return setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: 'ไม่มีข้อมูลอุปกรณ์ให้ส่งออก', type: 'error' });
    const headers = ['ชื่ออุปกรณ์', 'ประเภท', 'รวมทั้งหมดในระบบ', 'คงเหลือ', 'ใช้งานไป', 'ชำรุด/พัง'];
    const rows = accessories.map(item => {
       const total = Number(item.quantity || 0);
       const used = item.assignees?.length || 0;
       const broken = Number(item.brokenQuantity || 0);
       const remain = total - used - broken;
       return [item.name || '', item.type || '', total, remain, used, broken];
    });
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "accessories_export.csv";
    link.click();
  };

  const handleDownloadTemplate = () => {
    let headers = [], row = [], filename = "template.csv";
    if (activeMenu === 'employees') {
      headers = ['empId', 'fullName', 'fullNameEng', 'nickname', 'phone', 'email', 'company', 'department', 'position', 'manager'];
      row = ['EMP001', 'สมชาย ใจดี', 'Somchai Jaidee', 'ชาย', '0812345678', 'somchai@email.com', 'Company A', 'IT', 'Support', 'หัวหน้า A'];
      filename = "template_employees.csv";
    } else if (activeMenu === 'assets') {
      headers = ['name', 'type', 'assetTag', 'sn', 'model', 'company', 'department', 'vendor', 'cost', 'purchaseDate', 'warrantyDate'];
      row = ['Dell Latitude', 'คอมพิวเตอร์', 'AST-001', 'SN123456', 'Latitude 5420', 'Company A', 'DX', 'Vendor A', '35000', '2023-01-01', '2026-01-01'];
      filename = "template_assets.csv";
    } else if (activeMenu === 'licenses') {
      headers = ['name', 'productKey', 'keyCode', 'supplier', 'cost', 'purchaseDate', 'expirationDate'];
      row = ['Windows 11', 'XXXX-XXXX-XXXX-XXXX', 'REF-001', 'Supplier A', '5000', '2023-01-01', '2024-01-01'];
      filename = "template_licenses.csv";
    } else if (activeMenu === 'accessories') {
      headers = ['name', 'type', 'quantity'];
      row = ['Logitech Mouse', 'เมาส์ (Mouse)', '10'];
      filename = "template_accessories.csv";
    }
    const csvContent = "\uFEFF" + [headers.join(','), row.map(v => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleImportEmployees = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      if (rows.length <= 1) {
        setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: 'ไม่พบข้อมูลในไฟล์ CSV (กรุณาใส่ข้อมูลใต้หัวข้อ)', type: 'error' });
        e.target.value = null; return;
      }
      const dataRows = rows.slice(1);
      showConfirm(
        'ยืนยันการนำเข้าข้อมูล',
        `พบข้อมูลจำนวน ${dataRows.length} รายการ ต้องการนำเข้าใช่หรือไม่?`,
        async () => {
          try {
            for (let i = 0; i < dataRows.length; i++) {
              const cols = dataRows[i].split(',').map(col => col.replace(new RegExp('"', 'g'), '').trim());
              if (activeMenu === 'employees') {
                await addDoc(collection(db, 'employees'), { empId: cols[0]||'', fullName: cols[1]||'', fullNameEng: cols[2]||'', nickname: cols[3]||'', phone: cols[4]||'', email: cols[5]||'', company: cols[6]||'', department: cols[7]||'', position: cols[8]||'', manager: cols[9]||'', createdAt: serverTimestamp() });
              } else if (activeMenu === 'assets') {
                await addDoc(collection(db, 'assets'), { name: cols[0]||'', type: cols[1]||'คอมพิวเตอร์', assetTag: cols[2]||'', sn: cols[3]||'', model: cols[4]||'', company: cols[5]||'', department: cols[6]||'DX', vendor: cols[7]||'', cost: cols[8]||'', purchaseDate: cols[9]||'', warrantyDate: cols[10]||'', status: 'พร้อมใช้งาน', createdAt: serverTimestamp() });
              } else if (activeMenu === 'licenses') {
                await addDoc(collection(db, 'licenses'), { name: cols[0]||'', productKey: cols[1]||'', keyCode: cols[2]||'', supplier: cols[3]||'', cost: cols[4]||'', purchaseDate: cols[5]||'', expirationDate: cols[6]||'', status: 'พร้อมใช้งาน', createdAt: serverTimestamp() });
              } else if (activeMenu === 'accessories') {
                await addDoc(collection(db, 'accessories'), { name: cols[0]||'', type: cols[1]||'อื่นๆ', quantity: Number(cols[2]||0), brokenQuantity: 0, status: 'พร้อมใช้งาน', createdAt: serverTimestamp() });
              }
            }
            setIsImportModalOpen(false);
            setCustomAlert({ isOpen: true, title: 'นำเข้าสำเร็จ!', message: 'เพิ่มข้อมูลเข้าระบบเรียบร้อยแล้ว', type: 'success' });
          } catch (err) {
            setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: err.message, type: 'error' });
          }
        },
        { confirmText: 'นำเข้า', icon: 'import' }
      );
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const openEditEmpModal = (emp) => setEditEmpModal({ isOpen: true, data: { ...emp } });
  const handleEditEmpChange = (e) => setEditEmpModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      const updatedData = { ...editEmpModal.data }; delete updatedData.id; 
      await updateDoc(doc(db, 'employees', editEmpModal.data.id), updatedData);
      if (selectedEmployee && selectedEmployee.id === editEmpModal.data.id) setSelectedEmployee({ ...selectedEmployee, ...updatedData, id: editEmpModal.data.id });
      setEditEmpModal({ isOpen: false, data: null }); setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขข้อมูลเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

  const openEditAssetModal = (asset, collectionName) => setEditAssetModal({ isOpen: true, data: { ...asset }, collectionName });
  const handleEditAssetChange = (e) => setEditAssetModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    try {
      const updatedData = { ...editAssetModal.data }; delete updatedData.id; 
      if (editAssetModal.collectionName === 'accessories' && updatedData.remainingQuantity !== undefined) {
        updatedData.quantity = Number(updatedData.remainingQuantity) + (updatedData.assignees?.length || 0); delete updatedData.remainingQuantity; 
      }
      await updateDoc(doc(db, editAssetModal.collectionName, editAssetModal.data.id), updatedData);
      setEditAssetModal({ isOpen: false, data: null, collectionName: '' }); setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

  const openEditLicenseModal = (license) => setEditLicenseModal({ isOpen: true, data: { ...license } });
  const handleEditLicenseChange = (e) => setEditLicenseModal(prev => ({ ...prev, data: { ...prev.data, [e.target.name]: e.target.value } }));
  const handleUpdateLicense = async (e) => {
    e.preventDefault();
    try {
      const updatedData = { ...editLicenseModal.data }; delete updatedData.id; 
      await updateDoc(doc(db, 'licenses', editLicenseModal.data.id), updatedData);
      setEditLicenseModal({ isOpen: false, data: null }); setCustomAlert({ isOpen: true, title: 'อัปเดตสำเร็จ!', message: 'แก้ไขเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

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
            serialNumber: checkoutModal.sn || '',
            model: checkoutModal.model || '',
            customCost: checkoutModal.itemCost || '',
            purchaseDate: checkoutModal.itemPurchaseDate || '',
            warrantyDate: checkoutModal.itemWarrantyDate || ''
          });

          const updateData = { assignees: newAssignees };

          if (checkoutModal.snIndex !== undefined && item.availableSNs) {
            const newAvailableSNs = [...item.availableSNs];
            newAvailableSNs.splice(checkoutModal.snIndex, 1);
            updateData.availableSNs = newAvailableSNs;

            if (item.availableModels) {
              const newAvailableModels = [...item.availableModels];
              newAvailableModels.splice(checkoutModal.snIndex, 1);
              updateData.availableModels = newAvailableModels;
            }
            if (item.availableCosts) {
              const newAvailableCosts = [...item.availableCosts];
              newAvailableCosts.splice(checkoutModal.snIndex, 1);
              updateData.availableCosts = newAvailableCosts;
            }
            if (item.availablePurchaseDates) {
              const newAvailablePurchaseDates = [...item.availablePurchaseDates];
              newAvailablePurchaseDates.splice(checkoutModal.snIndex, 1);
              updateData.availablePurchaseDates = newAvailablePurchaseDates;
            }
            if (item.availableWarrantyDates) {
              const newAvailableWarrantyDates = [...item.availableWarrantyDates];
              newAvailableWarrantyDates.splice(checkoutModal.snIndex, 1);
              updateData.availableWarrantyDates = newAvailableWarrantyDates;
            }
          }

          await updateDoc(doc(db, 'accessories', checkoutModal.assetId), updateData);

          await addDoc(collection(db, 'accessories_transactions'), {
            empId: emp.id, 
            assetName: item.name, 
            category: 'accessories', action: 'เบิกจ่าย', condition: 'ปกติ', 
            remarks: `SN: ${checkoutModal.sn || '-'} | ${checkoutRemarks.trim() || '-'}`, 
            timestamp: Date.now()
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
      setCheckoutModal({ isOpen: false, assetId: null, collectionName: '', sn: '', snIndex: undefined, itemCost: '', itemPurchaseDate: '', itemWarrantyDate: '' }); 
      setCheckoutEmpId(''); setCheckoutSearchTerm(''); setCheckoutRemarks('');
      setCustomAlert({ isOpen: true, title: 'สำเร็จ!', message: 'ทำรายการเบิกจ่ายเรียบร้อยแล้ว', type: 'success' });
    } catch (error) {
      setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' });
    }
  };

  const handleCheckin = (id, collectionName) => {
    showConfirm(
      'ยืนยันการรับคืน', 'ต้องการรับคืนรายการนี้ใช่หรือไม่?',
      async () => {
        try {
          const itemArray = collectionName === 'assets' ? assets : licenses;
          const itemToReturn = itemArray.find(a => a.id === id);
          const empId = itemToReturn?.assignedTo;
          await updateDoc(doc(db, collectionName, id), { status: 'พร้อมใช้งาน', assignedTo: null, assignedName: null });
          if (empId) {
            const txCollection = collectionName === 'assets' ? 'assets_transactions' : 'licenses_transactions';
            await addDoc(collection(db, txCollection), {
              empId: empId, assetName: itemToReturn ? itemToReturn.name : '-', category: collectionName, action: 'รับคืน', condition: 'ปกติ', remarks: '-', timestamp: Date.now()
            });
          }
        } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
      },
      { confirmText: 'รับคืน', icon: 'return' }
    );
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    try {
      let collectionName = 'assets';
      let item = assets.find(a => a.id === returnModal.assetId);
      
      if (!item) {
        item = accessories.find(a => a.id === returnModal.assetId);
        collectionName = 'accessories';
      }

      if (!item) return;

      if (collectionName === 'accessories') {
        const newAssignees = item.assignees ? item.assignees.filter(a => a.checkoutId !== returnModal.checkoutId) : [];
        const returnedItem = item.assignees ? item.assignees.find(a => a.checkoutId === returnModal.checkoutId) : null;

        const updateData = { assignees: newAssignees };

        if (returnCondition === 'broken') {
          updateData.brokenQuantity = (Number(item.brokenQuantity) || 0) + 1;
          updateData.brokenSNs = [...(item.brokenSNs || []), returnedItem?.serialNumber || ''];
          updateData.brokenModels = [...(item.brokenModels || []), returnedItem?.model || ''];
          updateData.brokenCosts = [...(item.brokenCosts || []), returnedItem?.customCost || ''];
          updateData.brokenPurchaseDates = [...(item.brokenPurchaseDates || []), returnedItem?.purchaseDate || ''];
          updateData.brokenWarrantyDates = [...(item.brokenWarrantyDates || []), returnedItem?.warrantyDate || ''];
        } else {
          updateData.availableSNs = [...(item.availableSNs || []), returnedItem?.serialNumber || ''];
          updateData.availableModels = [...(item.availableModels || []), returnedItem?.model || ''];
          updateData.availableCosts = [...(item.availableCosts || []), returnedItem?.customCost || ''];
          updateData.availablePurchaseDates = [...(item.availablePurchaseDates || []), returnedItem?.purchaseDate || ''];
          updateData.availableWarrantyDates = [...(item.availableWarrantyDates || []), returnedItem?.warrantyDate || ''];
        }

        await updateDoc(doc(db, 'accessories', returnModal.assetId), updateData);

        await addDoc(collection(db, 'accessories_transactions'), {
          empId: returnModal.empId, empName: returnModal.empName, assetName: returnModal.assetName,
          category: 'accessories', action: 'รับคืน', condition: returnCondition === 'broken' ? 'ชำรุด' : 'ปกติ',
          remarks: returnRemarks.trim() || '-', timestamp: Date.now()
        });

      } else {
        await updateDoc(doc(db, 'assets', returnModal.assetId), {
          status: returnCondition === 'broken' ? 'ชำรุดเสียหาย' : 'พร้อมใช้งาน',
          assignedTo: null, assignedName: null
        });

        await addDoc(collection(db, 'assets_transactions'), {
          empId: returnModal.empId, empName: returnModal.empName, assetName: returnModal.assetName,
          category: 'assets', action: 'รับคืน', condition: returnCondition === 'broken' ? 'ชำรุด' : 'ปกติ',
          remarks: returnRemarks.trim() || '-', timestamp: Date.now()
        });
      }

      setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
      setReturnCondition('good'); setReturnRemarks('');
      setCustomAlert({ isOpen: true, title: 'รับคืนสำเร็จ', message: 'รับคืนอุปกรณ์เข้าคลังเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' }); }
  };

  const handleConfirmRepair = async (e) => {
    e.preventDefault();
    const qtyToRepair = parseInt(repairQuantity, 10);
    if (qtyToRepair < 1 || qtyToRepair > repairModal.maxRepair) {
      setCustomAlert({ isOpen: true, title: 'ข้อผิดพลาด', message: 'จำนวนที่ส่งกลับเข้าคลังไม่ถูกต้อง', type: 'error' });
      return;
    }
    try {
      const item = accessories.find(a => a.id === repairModal.assetId);
      if (item) {
        const newBrokenQty = Number(item.brokenQuantity || 0) - qtyToRepair;
        
        const currentBrokenSNs = [...(item.brokenSNs || [])];
        const newAvailableSNs = [...(item.availableSNs || [])];
        const currentBrokenModels = [...(item.brokenModels || [])];
        const newAvailableModels = [...(item.availableModels || [])];
        const currentBrokenCosts = [...(item.brokenCosts || [])]; 
        const newAvailableCosts = [...(item.availableCosts || [])]; 
        const currentBrokenPurchaseDates = [...(item.brokenPurchaseDates || [])];
        const newAvailablePurchaseDates = [...(item.availablePurchaseDates || [])];
        const currentBrokenWarrantyDates = [...(item.brokenWarrantyDates || [])];
        const newAvailableWarrantyDates = [...(item.availableWarrantyDates || [])];

        if (repairModal.brokenIndex !== undefined) {
          newAvailableSNs.push(currentBrokenSNs.splice(repairModal.brokenIndex, 1)[0] || '');
          newAvailableModels.push(currentBrokenModels.splice(repairModal.brokenIndex, 1)[0] || '');
          newAvailableCosts.push(currentBrokenCosts.splice(repairModal.brokenIndex, 1)[0] || '');
          newAvailablePurchaseDates.push(currentBrokenPurchaseDates.splice(repairModal.brokenIndex, 1)[0] || '');
          newAvailableWarrantyDates.push(currentBrokenWarrantyDates.splice(repairModal.brokenIndex, 1)[0] || '');
        } else {
          for (let i = 0; i < qtyToRepair; i++) {
            if (currentBrokenSNs.length > 0) newAvailableSNs.push(currentBrokenSNs.shift() || ''); else newAvailableSNs.push('');
            if (currentBrokenModels.length > 0) newAvailableModels.push(currentBrokenModels.shift() || ''); else newAvailableModels.push('');
            if (currentBrokenCosts.length > 0) newAvailableCosts.push(currentBrokenCosts.shift() || ''); else newAvailableCosts.push('');
            if (currentBrokenPurchaseDates.length > 0) newAvailablePurchaseDates.push(currentBrokenPurchaseDates.shift() || ''); else newAvailablePurchaseDates.push('');
            if (currentBrokenWarrantyDates.length > 0) newAvailableWarrantyDates.push(currentBrokenWarrantyDates.shift() || ''); else newAvailableWarrantyDates.push('');
          }
        }

        await updateDoc(doc(db, 'accessories', repairModal.assetId), { 
          brokenQuantity: newBrokenQty, 
          brokenSNs: currentBrokenSNs, availableSNs: newAvailableSNs,
          brokenModels: currentBrokenModels, availableModels: newAvailableModels,
          brokenCosts: currentBrokenCosts, availableCosts: newAvailableCosts,
          brokenPurchaseDates: currentBrokenPurchaseDates, availablePurchaseDates: newAvailablePurchaseDates,
          brokenWarrantyDates: currentBrokenWarrantyDates, availableWarrantyDates: newAvailableWarrantyDates
        });
        
        await addDoc(collection(db, 'accessories_transactions'), {
          empId: 'SYSTEM', assetName: item.name, category: 'accessories', action: 'ซ่อมเสร็จ/เข้าคลัง', condition: 'ปกติ', remarks: repairRemarks.trim() || '-', timestamp: Date.now()
        });
        setRepairModal({ isOpen: false, assetId: null, assetName: null, maxRepair: 0, brokenIndex: undefined });
        setRepairQuantity(1); setRepairRemarks('');
        setCustomAlert({ isOpen: true, title: 'นำกลับเข้าคลังสำเร็จ', message: `นำอุปกรณ์กลับเข้าคลังเรียบร้อยแล้ว`, type: 'success' });
      }
    } catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
  };

  let baseData = [];
  if (activeMenu === 'assets') {
    baseData = assets.filter(item => {
      return (assetFilterType === 'ทั้งหมด' || item.type === assetFilterType) && 
             (assetFilterStatus === 'ทั้งหมด' || (item.status || 'พร้อมใช้งาน') === assetFilterStatus) &&
             (assetFilterDepartment === 'ทั้งหมด' || item.department === assetFilterDepartment);
    });
  }
  else if (activeMenu === 'licenses') baseData = licenses;
  else if (activeMenu === 'employees') baseData = showDeletedEmployees ? deletedEmployees : employees;
  else if (activeMenu === 'accessories') baseData = accessories.filter(item => accFilterType === 'ทั้งหมด' || item.type === accFilterType);
  else if (activeMenu === 'office_supplies') {
    baseData = officeSupplies.filter(item => {
      if (officeSupplyStockFilter === 'ทั้งหมด') return true;
      const qty = Number(item.quantity) || 0;
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

  const getUniqueMonths = (data) => {
    const months = new Set();
    data.forEach(item => {
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthStr);
      }
    });
    return Array.from(months).sort().reverse();
  };

  const formatMonthLabel = (monthStr) => {
    if (!monthStr || monthStr === 'ทั้งหมด') return 'ทั้งหมด';
    const [year, month] = monthStr.split('-');
    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(year, 10) + 543}`;
  };

  const getUniqueDates = (data) => {
    const dates = new Set();
    data.forEach(item => {
      if (item.timestamp) {
        const dateObj = new Date(item.timestamp);
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        dates.add(dateStr);
      }
    });
    return Array.from(dates).sort().reverse(); 
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr || dateStr === 'ทั้งหมด') return 'ทั้งหมด';
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${parseInt(year, 10) + 543}`;
  };

  let currentRepairRequests = repairRequests.filter(req => {
    const matchStatus = repairFilterStatus === 'ทั้งหมด' || req.status === repairFilterStatus;
    let matchMonth = true;
    if (repairFilterMonth !== 'ทั้งหมด') {
      const date = new Date(req.timestamp);
      const reqMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      matchMonth = reqMonthStr === repairFilterMonth;
    }
    return matchStatus && matchMonth;
  });

  let currentSupplyRequests = supplyRequests.filter(req => {
    const matchStatus = supplyFilterStatus === 'ทั้งหมด' || req.status === supplyFilterStatus;
    let matchDate = true;
    if (supplyFilterDate !== 'ทั้งหมด') {
      const dateObj = new Date(req.timestamp);
      const reqDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      matchDate = reqDateStr === supplyFilterDate;
    }
    return matchStatus && matchDate;
  });

  const handleSelectEmployee = (e, id) => e.target.checked ? setSelectedEmployeeIds(prev => [...prev, id]) : setSelectedEmployeeIds(prev => prev.filter(empId => empId !== id));
  const handleSelectAllEmployees = (e) => e.target.checked ? setSelectedEmployeeIds(currentData.map(emp => emp.id)) : setSelectedEmployeeIds([]);
  const handleSelectAccessory = (e, id) => e.target.checked ? setSelectedAccessoryIds(prev => [...prev, id]) : setSelectedAccessoryIds(prev => prev.filter(itemId => itemId !== id));
  const handleSelectAllAccessories = (e) => e.target.checked ? setSelectedAccessoryIds(currentData.map(item => item.id)) : setSelectedAccessoryIds([]);
  const handleSelectOfficeSupply = (e, id) => e.target.checked ? setSelectedOfficeSupplyIds(prev => [...prev, id]) : setSelectedOfficeSupplyIds(prev => prev.filter(itemId => itemId !== id));
  const handleSelectAllOfficeSupplies = (e) => e.target.checked ? setSelectedOfficeSupplyIds(currentData.map(item => item.id)) : setSelectedOfficeSupplyIds([]);

  const menuTitle = activeMenu === 'dashboard' ? 'ภาพรวมระบบ (Dashboard)' :
                    activeMenu === 'assets' ? 'ทรัพย์สิน IT หลัก' : 
                    activeMenu === 'licenses' ? 'โปรแกรม/License' : 
                    activeMenu === 'accessories' ? 'อุปกรณ์เสริม (Accessories)' : 
                    activeMenu === 'repairs' ? 'แจ้งปัญหา IT' : 
                    activeMenu === 'office_supplies' ? 'คลังอุปกรณ์สำนักงาน' : 
                    activeMenu === 'supply_requests' ? 'คำขอเบิกอุปกรณ์' : 'ข้อมูลพนักงาน';

  const checkLicenseExpiration = (expirationDate) => {
    if (!expirationDate) return { isExpiring: false, statusText: '', colorClass: '' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { isExpiring: true, statusText: 'หมดอายุแล้ว', colorClass: 'text-red-600 bg-red-50 border-red-200' };
    } else if (diffDays <= 30) {
      return { isExpiring: true, statusText: `เหลืออีก ${diffDays} วัน`, colorClass: 'text-amber-600 bg-amber-50 border-amber-200' };
    }
    return { isExpiring: false, statusText: '', colorClass: '' };
  };

  const pendingRepairsCount = repairRequests.filter(req => req.status === 'รอดำเนินการ').length;
  const pendingSuppliesCount = supplyRequests.filter(req => req.status === 'รอดำเนินการ').length;
  const expiringLicensesCount = licenses.filter(lic => checkLicenseExpiration(lic.expirationDate).isExpiring).length;
  
  const totalPendingCount = pendingRepairsCount + pendingSuppliesCount + expiringLicensesCount;

  const totalSystemItems = assets.length + licenses.length + accessories.length + employees.length;
  const currentDataLength = currentData.length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (authRole === null) {
    return (
      <React.Fragment>
        <LoginView
          showAdminLogin={showAdminLogin}
          setShowAdminLogin={setShowAdminLogin}
          setAuthRole={setAuthRole}
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          handleAdminLogin={handleAdminLogin}
          loginError={loginError}
          setLoginError={setLoginError}
          loginLoading={loginLoading} 
        />
        <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
      </React.Fragment>
    );
  }

  if (authRole === 'staff') {
    return (
      <React.Fragment>
        <StaffView 
          setAuthRole={setAuthRole} currentStaff={currentStaff} setCurrentStaff={setCurrentStaff} 
          staffEmpIdInput={staffEmpIdInput} setStaffEmpIdInput={setStaffEmpIdInput} handleStaffLogin={handleStaffLogin} 
          staffRepairForm={staffRepairForm} setStaffRepairForm={setStaffRepairForm} handleSubmitRepairRequest={handleSubmitRepairRequest} 
          repairRequests={repairRequests} editStaffRepairModal={editStaffRepairModal} setEditStaffRepairModal={setEditStaffRepairModal} 
          handleStaffUpdateRepair={handleStaffUpdateRepair} handleStaffDeleteRepair={handleStaffDeleteRepair}
          officeSupplies={officeSupplies} supplyRequests={supplyRequests} handleStaffSubmitSupplyRequest={handleStaffSubmitSupplyRequest}
          assets={assets} accessories={accessories} licenses={licenses} 
        />
        <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
      </React.Fragment>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');`}</style>
      
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onResetPassword={() => setResetPasswordModal(true)} authRole={authRole} />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        
        <TopHeader 
          menuTitle={menuTitle}
          notifRef={notifRef}
          isNotifOpen={isNotifOpen}
          setIsNotifOpen={setIsNotifOpen}
          totalPendingCount={totalPendingCount}
          pendingRepairsCount={pendingRepairsCount}
          pendingSuppliesCount={pendingSuppliesCount}
          expiringLicensesCount={expiringLicensesCount}
          setActiveMenu={setActiveMenu}
          activeMenu={activeMenu}
          totalSystemItems={totalSystemItems}
          currentDataLength={currentDataLength}
          handleLogout={handleLogout}
        />

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeMenu === 'dashboard' ? (
            <DashboardStats assets={assets} licenses={licenses} accessories={accessories} employees={employees} />
          ) : activeMenu === 'repairs' ? (
            <RepairTable 
              repairRequests={repairRequests}
              currentRepairRequests={currentRepairRequests}
              repairFilterMonth={repairFilterMonth}
              setRepairFilterMonth={setRepairFilterMonth}
              repairFilterStatus={repairFilterStatus}
              setRepairFilterStatus={setRepairFilterStatus}
              getUniqueMonths={getUniqueMonths}
              formatMonthLabel={formatMonthLabel}
              handleUpdateRepairRequestStatus={handleUpdateRepairRequestStatus}
              handleDeleteRepairRequest={handleDeleteRepairRequest}
            />
          ) : activeMenu === 'supply_requests' ? (
            <SupplyRequestTable 
              supplyRequests={supplyRequests}
              currentSupplyRequests={currentSupplyRequests}
              supplyFilterDate={supplyFilterDate}
              setSupplyFilterDate={setSupplyFilterDate}
              supplyFilterStatus={supplyFilterStatus}
              setSupplyFilterStatus={setSupplyFilterStatus}
              getUniqueDates={getUniqueDates}
              formatDateLabel={formatDateLabel}
              handleUpdateSupplyRequestStatus={handleUpdateSupplyRequestStatus}
              handleDelete={handleDelete}
            />
          ) : (
            <div className="h-full flex flex-col">
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col flex-1">
                
                <ActionBar 
                  menuTitle={menuTitle}
                  activeMenu={activeMenu}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  showDeletedEmployees={showDeletedEmployees}
                  setShowDeletedEmployees={setShowDeletedEmployees}
                  setIsImportModalOpen={setIsImportModalOpen}
                  handleExportEmployees={handleExportEmployees}
                  selectedEmployeeIds={selectedEmployeeIds}
                  setConfirmDeleteModal={setConfirmDeleteModal}
                  assetFilterDepartment={assetFilterDepartment}
                  setAssetFilterDepartment={setAssetFilterDepartment}
                  assetFilterType={assetFilterType}
                  setAssetFilterType={setAssetFilterType}
                  assetFilterStatus={assetFilterStatus}
                  setAssetFilterStatus={setAssetFilterStatus}
                  accFilterType={accFilterType}
                  setAccFilterType={setAccFilterType}
                  handleExportAccessories={handleExportAccessories}
                  selectedAccessoryIds={selectedAccessoryIds}
                  officeSupplyStockFilter={officeSupplyStockFilter}
                  setOfficeSupplyStockFilter={setOfficeSupplyStockFilter}
                  selectedOfficeSupplyIds={selectedOfficeSupplyIds}
                  setIsAddModalOpen={setIsAddModalOpen}
                />
                
                {currentData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
                    <span className="text-5xl mb-4 opacity-50 drop-shadow-sm">📂</span>
                    <p className="font-bold text-lg text-slate-500">ไม่พบข้อมูลที่ค้นหา</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {activeMenu === 'employees' ? (
                      <EmployeeTable 
                        currentData={currentData}
                        selectedEmployeeIds={selectedEmployeeIds}
                        handleSelectAllEmployees={handleSelectAllEmployees}
                        handleSelectEmployee={handleSelectEmployee}
                        setSelectedEmployee={setSelectedEmployee}
                        setEmpModalTab={setEmpModalTab}
                        showDeletedEmployees={showDeletedEmployees}
                        handleRestoreEmployee={handleRestoreEmployee}
                        openEditEmpModal={openEditEmpModal}
                        setConfirmDeleteModal={setConfirmDeleteModal}
                      />
                    ) : activeMenu === 'licenses' ? (
                      <LicenseTable 
                        currentData={currentData}
                        setSelectedAssetDetail={setSelectedAssetDetail}
                        setSelectedAssetCategory={setSelectedAssetCategory}
                        checkLicenseExpiration={checkLicenseExpiration}
                        setCheckoutModal={setCheckoutModal}
                        handleCheckin={handleCheckin}
                        openEditLicenseModal={openEditLicenseModal}
                        setConfirmDeleteModal={setConfirmDeleteModal}
                      />
                    ) : activeMenu === 'office_supplies' ? (
                      <OfficeSupplyTable 
                        currentData={currentData}
                        selectedOfficeSupplyIds={selectedOfficeSupplyIds}
                        handleSelectAllOfficeSupplies={handleSelectAllOfficeSupplies}
                        handleSelectOfficeSupply={handleSelectOfficeSupply}
                        openEditAssetModal={openEditAssetModal}
                        setConfirmDeleteModal={setConfirmDeleteModal}
                        activeMenu={activeMenu}
                      />
                    ) : activeMenu === 'accessories' ? (
                      <AccessoryTable 
                        currentData={currentData}
                        selectedAccessoryIds={selectedAccessoryIds}
                        handleSelectAllAccessories={handleSelectAllAccessories}
                        handleSelectAccessory={handleSelectAccessory}
                        setSelectedAssetDetail={setSelectedAssetDetail}
                        setSelectedAssetCategory={setSelectedAssetCategory}
                        setCheckoutModal={setCheckoutModal}
                        openEditAssetModal={openEditAssetModal}
                        setConfirmDeleteModal={setConfirmDeleteModal}
                      />
                    ) : activeMenu === 'assets' ? (
                      <AssetTable 
                        currentData={currentData}
                        setSelectedAssetDetail={setSelectedAssetDetail}
                        setSelectedAssetCategory={setSelectedAssetCategory}
                        setCheckoutModal={setCheckoutModal}
                        handleCheckin={handleCheckin}
                        openEditAssetModal={openEditAssetModal}
                        setConfirmDeleteModal={setConfirmDeleteModal}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Modals ทั้งหมด */}
      <AddModal isAddModalOpen={isAddModalOpen} setIsAddModalOpen={setIsAddModalOpen} activeMenu={activeMenu} handleAddEmployee={handleAddEmployee} empForm={empForm} handleEmpChange={handleEmpChange} handleAddLicense={handleAddLicense} licenseForm={licenseForm} handleLicenseChange={handleLicenseChange} handleAdd={handleAdd} name={name} setName={setName} type={type} setType={setType} cost={cost} setCost={setCost} purchaseDate={purchaseDate} setPurchaseDate={setPurchaseDate} warrantyDate={warrantyDate} setWarrantyDate={setWarrantyDate} quantity={quantity} setQuantity={setQuantity} unit={unit} setUnit={setUnit} assetImage={assetImage} setAssetImage={setAssetImage} assetDepartment={assetDepartment} setAssetDepartment={setAssetDepartment} sn={sn} setSn={setSn} company={company} setCompany={setCompany} assetTag={assetTag} setAssetTag={setAssetTag} model={model} setModel={setModel} vendor={vendor} setVendor={setVendor} assetDocument={assetDocument} setAssetDocument={setAssetDocument} />
      <CheckoutModal checkoutModal={checkoutModal} setCheckoutModal={setCheckoutModal} handleCheckout={handleCheckout} checkoutSearchTerm={checkoutSearchTerm} setCheckoutSearchTerm={setCheckoutSearchTerm} checkoutEmpId={checkoutEmpId} setCheckoutEmpId={setCheckoutEmpId} employees={employees} checkoutRemarks={checkoutRemarks} setCheckoutRemarks={setCheckoutRemarks} />
      <EmployeeDetailsModal selectedEmployee={selectedEmployee} setSelectedEmployee={setSelectedEmployee} empModalTab={empModalTab} setEmpModalTab={setEmpModalTab} assets={assets} licenses={licenses} accessories={accessories} transactions={transactions} openEditEmpModal={openEditEmpModal} handleCheckin={handleCheckin} setReturnModal={setReturnModal} />
      <AssetDetailsModal selectedAssetDetail={selectedAssetDetail} setSelectedAssetDetail={setSelectedAssetDetail} selectedAssetCategory={selectedAssetCategory} setSelectedAssetCategory={setSelectedAssetCategory} accessories={accessories} assets={assets} licenses={licenses} setCheckoutModal={setCheckoutModal} setReturnModal={setReturnModal} handleCheckin={handleCheckin} openEditLicenseModal={openEditLicenseModal} openEditAssetModal={openEditAssetModal} setRepairModal={setRepairModal} setRepairQuantity={setRepairQuantity} setRepairRemarks={setRepairRemarks} showConfirm={showConfirm} setCustomAlert={setCustomAlert} />
      <EditEmpModal editEmpModal={editEmpModal} setEditEmpModal={setEditEmpModal} handleUpdateEmployee={handleUpdateEmployee} handleEditEmpChange={handleEditEmpChange} />
      <EditAssetModal editAssetModal={editAssetModal} setEditAssetModal={setEditAssetModal} handleUpdateAsset={handleUpdateAsset} handleEditAssetChange={handleEditAssetChange} />
      <EditLicenseModal editLicenseModal={editLicenseModal} setEditLicenseModal={setEditLicenseModal} handleUpdateLicense={handleUpdateLicense} handleEditLicenseChange={handleEditLicenseChange} />
      <ImportModal isImportModalOpen={isImportModalOpen} setIsImportModalOpen={setIsImportModalOpen} handleDownloadTemplate={handleDownloadTemplate} handleImportEmployees={handleImportEmployees} activeMenu={activeMenu} />
      <ReturnModal returnModal={returnModal} setReturnModal={setReturnModal} returnCondition={returnCondition} setReturnCondition={setReturnCondition} returnRemarks={returnRemarks} setReturnRemarks={setReturnRemarks} handleConfirmReturn={handleConfirmReturn} />
      <RepairModal repairModal={repairModal} setRepairModal={setRepairModal} repairQuantity={repairQuantity} setRepairQuantity={setRepairQuantity} repairRemarks={repairRemarks} setRepairRemarks={setRepairRemarks} handleConfirmRepair={handleConfirmRepair} />
      <ConfirmDeleteModal confirmDeleteModal={confirmDeleteModal} setConfirmDeleteModal={setConfirmDeleteModal} executeDelete={executeDelete} />
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} confirmText={confirmModal.confirmText} cancelText={confirmModal.cancelText} icon={confirmModal.icon} onConfirm={handleConfirmModalOk} onCancel={closeConfirmModal} />
      <ResetPasswordModal isOpen={resetPasswordModal} onClose={() => setResetPasswordModal(false)} onSuccess={(msg) => setCustomAlert({ isOpen: true, title: 'สำเร็จ!', message: msg, type: 'success' })} onError={(msg) => setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: msg, type: 'error' })} />
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
    </div>
  );
}

export default App;