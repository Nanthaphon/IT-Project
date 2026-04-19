import { useState, useEffect } from 'react'
import { db } from './firebase' 
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

// นำเข้า Components ทั้งหมด
import Sidebar from './components/Sidebar'
import DashboardStats from './components/DashboardStats'
import CustomAlert from './components/CustomAlert'
import AddModal from './components/AddModal'
import CheckoutModal from './components/CheckoutModal'
import EmployeeDetailsModal from './components/EmployeeDetailsModal'
import AssetDetailsModal from './components/AssetDetailsModal'
import EditEmpModal from './components/EditEmpModal'
import EditAssetModal from './components/EditAssetModal'
import EditLicenseModal from './components/EditLicenseModal'
import ImportModal from './components/ImportModal'
import ReturnModal from './components/ReturnModal'
import RepairModal from './components/RepairModal'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'

import LoginView from './components/LoginView'
import StaffView from './components/StaffView'

function App() {
  const [authRole, setAuthRole] = useState(null); 
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const [staffEmpIdInput, setStaffEmpIdInput] = useState('');
  const [currentStaff, setCurrentStaff] = useState(null);
  const [staffRepairForm, setStaffRepairForm] = useState({ assetName: '', issue: '' });
  const [editStaffRepairModal, setEditStaffRepairModal] = useState({ isOpen: false, data: null });

  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  const [assets, setAssets] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [licenses, setLicenses] = useState([]); 
  const [repairRequests, setRepairRequests] = useState([]); 

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState([]); 

  const [name, setName] = useState('');
  const [type, setType] = useState('คอมพิวเตอร์');
  const [cost, setCost] = useState(''); 
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyDate, setWarrantyDate] = useState('');
  const [quantity, setQuantity] = useState(1); 
  const [assetImage, setAssetImage] = useState(null); 
  const [assetDepartment, setAssetDepartment] = useState('DX');

  const [empForm, setEmpForm] = useState({
    fullName: '', fullNameEng: '', empId: '', department: '', email: '',
    company: '', position: '', nickname: '', manager: '', phone: ''
  });
  const [licenseForm, setLicenseForm] = useState({
    name: '', productKey: '', keyCode: '', supplier: '', purchaseDate: '', expirationDate: '', cost: ''
  });

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empModalTab, setEmpModalTab] = useState('info');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState({ 
    isOpen: false, assetId: null, collectionName: '', sn: '', snIndex: undefined, itemCost: '' 
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
  const [repairModal, setRepairModal] = useState({ isOpen: false, assetId: null, assetName: null, maxRepair: 0 });
  const [repairQuantity, setRepairQuantity] = useState(1);
  const [repairRemarks, setRepairRemarks] = useState('');
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, id: null, collectionName: null });

  const [accFilterType, setAccFilterType] = useState('ทั้งหมด');
  const [assetFilterType, setAssetFilterType] = useState('ทั้งหมด'); 
  const [assetFilterStatus, setAssetFilterStatus] = useState('ทั้งหมด'); 
  const [assetFilterDepartment, setAssetFilterDepartment] = useState('ทั้งหมด');
  const [repairFilterStatus, setRepairFilterStatus] = useState('ทั้งหมด'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const unsubAssets = onSnapshot(collection(db, 'assets'), (snapshot) => setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubAccessories = onSnapshot(collection(db, 'accessories'), (snapshot) => setAccessories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubLicenses = onSnapshot(collection(db, 'licenses'), (snapshot) => setLicenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    const unsubRepairReqs = onSnapshot(collection(db, 'repair_requests'), (snapshot) => setRepairRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.timestamp - a.timestamp)));

    let accData = []; let assetData = []; let licData = [];
    const updateTransactionsState = () => {
      const combined = [...accData, ...assetData, ...licData];
      combined.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(combined);
    };

    const unsubAccTx = onSnapshot(collection(db, 'accessories_transactions'), (snapshot) => { accData = snapshot.docs.map(doc => ({ id: doc.id, category: 'accessories', ...doc.data() })); updateTransactionsState(); });
    const unsubAssetTx = onSnapshot(collection(db, 'assets_transactions'), (snapshot) => { assetData = snapshot.docs.map(doc => ({ id: doc.id, category: 'assets', ...doc.data() })); updateTransactionsState(); });
    const unsubLicTx = onSnapshot(collection(db, 'licenses_transactions'), (snapshot) => { licData = snapshot.docs.map(doc => ({ id: doc.id, category: 'licenses', ...doc.data() })); updateTransactionsState(); });

    return () => { unsubAssets(); unsubAccessories(); unsubEmployees(); unsubLicenses(); unsubRepairReqs(); unsubAccTx(); unsubAssetTx(); unsubLicTx(); };
  }, []);

  useEffect(() => {
    setName(''); setCost(''); setPurchaseDate(''); setWarrantyDate(''); setQuantity(1); setAssetImage(null); setAssetDepartment('DX');
    setAccFilterType('ทั้งหมด'); setSearchTerm(''); setAssetFilterType('ทั้งหมด'); 
    setAssetFilterStatus('ทั้งหมด'); setRepairFilterStatus('ทั้งหมด'); setAssetFilterDepartment('ทั้งหมด');
    setSelectedEmployeeIds([]); setSelectedAccessoryIds([]); 
    if (activeMenu === 'assets') setType('คอมพิวเตอร์');
    else if (activeMenu === 'accessories') setType('เมาส์ (Mouse)');
  }, [activeMenu]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'Admin@GB') {
      setAuthRole('admin'); setShowAdminLogin(false); setLoginForm({ username: '', password: '' });
    } else alert('Username หรือ Password ไม่ถูกต้อง!');
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
      setStaffRepairForm({ assetName: '', issue: '' });
      setCustomAlert({ isOpen: true, title: 'ส่งเรื่องสำเร็จ!', message: 'ระบบได้รับเรื่องแจ้งปัญหาของคุณแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  const handleStaffDeleteRepair = async (id) => {
    if (window.confirm('คุณต้องการยกเลิกและลบรายการแจ้งปัญหานี้ใช่หรือไม่?')) {
      try { await deleteDoc(doc(db, 'repair_requests', id)); setCustomAlert({ isOpen: true, title: 'ยกเลิกสำเร็จ!', message: 'ลบรายการแจ้งปัญหาของคุณเรียบร้อยแล้ว', type: 'success' }); } 
      catch (error) { setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' }); }
    }
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

  const handleDeleteRepairRequest = async (id) => {
    if (window.confirm('คุณต้องการลบรายการนี้ออกจากระบบใช่หรือไม่?')) {
      try { await deleteDoc(doc(db, 'repair_requests', id)); } 
      catch (error) { setCustomAlert({ isOpen: true, title: 'ลบผิดพลาด', message: error.message, type: 'error' }); }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const collectionName = activeMenu === 'assets' ? 'assets' : 'accessories';
    try {
      const qtyToSave = activeMenu === 'accessories' ? parseInt(quantity) || 1 : 1;

      await addDoc(collection(db, collectionName), {
        name, type, cost, purchaseDate, warrantyDate, quantity: qtyToSave, brokenQuantity: 0, status: 'พร้อมใช้งาน', 
        assignedTo: null, assignedName: null, image: assetImage || null,
        department: activeMenu === 'assets' ? assetDepartment : null,
        createdAt: serverTimestamp()
      });
      setName(''); setCost(''); setPurchaseDate(''); setWarrantyDate(''); setQuantity(1); setAssetImage(null); setAssetDepartment('DX'); setIsAddModalOpen(false);
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
      }
      setConfirmDeleteModal({ isOpen: false, id: null, collectionName: null });
      setSelectedEmployeeIds([]); setSelectedAccessoryIds([]); 
      setCustomAlert({ isOpen: true, title: 'ลบสำเร็จ!', message: 'ลบรายการออกจากระบบเรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด!', message: error.message, type: 'error' }); }
  };

  const handleExportEmployees = () => { /* ส่งออกพนักงาน */ };
  const handleExportAccessories = () => { /* ส่งออกอุปกรณ์ */ };
  const handleDownloadTemplate = () => { /* โหลด Template */ };
  const handleImportEmployees = (e) => { /* Import CSV */ };

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
            customCost: checkoutModal.itemCost || '' 
          });

          const updateData = { assignees: newAssignees };

          // ลบราคา/SN เฉพาะชิ้นออกจากคลังเครื่องว่าง
          if (checkoutModal.snIndex !== undefined && item.availableSNs) {
            const newAvailableSNs = [...item.availableSNs];
            newAvailableSNs.splice(checkoutModal.snIndex, 1);
            updateData.availableSNs = newAvailableSNs;

            if (item.availableCosts) {
              const newAvailableCosts = [...item.availableCosts];
              newAvailableCosts.splice(checkoutModal.snIndex, 1);
              updateData.availableCosts = newAvailableCosts;
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
      setCheckoutModal({ isOpen: false, assetId: null, collectionName: '', sn: '', snIndex: undefined, itemCost: '' }); 
      setCheckoutEmpId(''); setCheckoutSearchTerm(''); setCheckoutRemarks('');
      setCustomAlert({ isOpen: true, title: 'สำเร็จ!', message: 'ทำรายการเบิกจ่ายเรียบร้อยแล้ว', type: 'success' });
    } catch (error) {
      setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: error.message, type: 'error' });
    }
  };

  const handleCheckin = async (id, collectionName) => {
    if(window.confirm("ต้องการรับคืนรายการนี้ใช่หรือไม่?")) {
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
    }
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (returnCondition === 'broken' && !returnRemarks.trim()) return setCustomAlert({ isOpen: true, title: 'แจ้งเตือน', message: 'กรุณากรอกหมายเหตุเมื่อของชำรุด', type: 'error' });
    try {
      const item = accessories.find(a => a.id === returnModal.assetId);
      if (item && item.assignees) {
        const assigneeToReturn = item.assignees.find(a => a.checkoutId === returnModal.checkoutId);
        const returnedSN = assigneeToReturn?.serialNumber || '';
        const returnedCost = assigneeToReturn?.customCost || ''; 

        const newAssignees = item.assignees.filter(a => a.checkoutId !== returnModal.checkoutId);
        const updateData = { assignees: newAssignees };

        if (returnCondition === 'broken') {
          updateData.brokenQuantity = Number(item.brokenQuantity || 0) + 1;
          updateData.quantity = Number(item.quantity || 1) - 1; 
          
          const newBrokenSNs = [...(item.brokenSNs || [])];
          newBrokenSNs.push(returnedSN);
          updateData.brokenSNs = newBrokenSNs;

          const newBrokenCosts = [...(item.brokenCosts || [])];
          newBrokenCosts.push(returnedCost);
          updateData.brokenCosts = newBrokenCosts;
        } else {
          const newAvailableSNs = [...(item.availableSNs || [])];
          newAvailableSNs.push(returnedSN);
          updateData.availableSNs = newAvailableSNs;

          const newAvailableCosts = [...(item.availableCosts || [])];
          newAvailableCosts.push(returnedCost);
          updateData.availableCosts = newAvailableCosts;
        }
        await updateDoc(doc(db, 'accessories', returnModal.assetId), updateData);
        
        await addDoc(collection(db, 'accessories_transactions'), {
          empId: returnModal.empId, 
          assetName: returnModal.assetName, 
          category: 'accessories', action: 'รับคืน', condition: returnCondition === 'good' ? 'ปกติ' : 'ชำรุด', 
          remarks: `SN: ${returnedSN || '-'} | ${returnRemarks.trim() || '-'}`, 
          timestamp: Date.now()
        });
      }
      setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null });
      setReturnCondition('good'); setReturnRemarks('');
      setCustomAlert({ isOpen: true, title: 'สำเร็จ', message: 'รับคืนอุปกรณ์เรียบร้อยแล้ว', type: 'success' });
    } catch (error) { setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' }); }
  };

  const handleConfirmRepair = async (e) => {
    e.preventDefault();
    const qtyToRepair = parseInt(repairQuantity, 10);
    if (qtyToRepair < 1 || qtyToRepair > repairModal.maxRepair) return setCustomAlert({ isOpen: true, title: 'ข้อผิดพลาด', message: 'จำนวนที่ส่งกลับเข้าคลังไม่ถูกต้อง', type: 'error' });
    try {
      const item = accessories.find(a => a.id === repairModal.assetId);
      if (item) {
        const newBrokenQty = Number(item.brokenQuantity || 0) - qtyToRepair;
        const newTotalQty = Number(item.quantity || 0) + qtyToRepair;
        
        const currentBrokenSNs = [...(item.brokenSNs || [])];
        const newAvailableSNs = [...(item.availableSNs || [])];

        const currentBrokenCosts = [...(item.brokenCosts || [])]; 
        const newAvailableCosts = [...(item.availableCosts || [])]; 

        for (let i = 0; i < qtyToRepair; i++) {
          if (currentBrokenSNs.length > 0) newAvailableSNs.push(currentBrokenSNs.shift());
          if (currentBrokenCosts.length > 0) newAvailableCosts.push(currentBrokenCosts.shift()); 
        }

        await updateDoc(doc(db, 'accessories', repairModal.assetId), { 
          brokenQuantity: newBrokenQty, quantity: newTotalQty,
          brokenSNs: currentBrokenSNs, availableSNs: newAvailableSNs,
          brokenCosts: currentBrokenCosts, availableCosts: newAvailableCosts  
        });
        
        await addDoc(collection(db, 'accessories_transactions'), {
          empId: 'SYSTEM', assetName: item.name, category: 'accessories', action: 'ซ่อมเสร็จ/เข้าคลัง', condition: 'ปกติ', remarks: repairRemarks.trim() || '-', timestamp: Date.now()
        });
        setRepairModal({ isOpen: false, assetId: null, assetName: null, maxRepair: 0 });
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
  else if (activeMenu === 'employees') baseData = employees;
  else if (activeMenu === 'accessories') baseData = accessories.filter(item => accFilterType === 'ทั้งหมด' || item.type === accFilterType);

  let currentData = baseData;
  if (searchTerm.trim() !== '') {
    const lowerCaseTerm = searchTerm.toLowerCase();
    currentData = baseData.filter(item => {
      if (activeMenu === 'employees') return (item.fullName?.toLowerCase().includes(lowerCaseTerm) || item.fullNameEng?.toLowerCase().includes(lowerCaseTerm) || item.empId?.toLowerCase().includes(lowerCaseTerm) || item.nickname?.toLowerCase().includes(lowerCaseTerm));
      else return (item.name?.toLowerCase().includes(lowerCaseTerm) || item.type?.toLowerCase().includes(lowerCaseTerm));
    });
  }

  let currentRepairRequests = repairRequests;
  if (repairFilterStatus !== 'ทั้งหมด') currentRepairRequests = repairRequests.filter(req => req.status === repairFilterStatus);

  const handleSelectEmployee = (e, id) => e.target.checked ? setSelectedEmployeeIds(prev => [...prev, id]) : setSelectedEmployeeIds(prev => prev.filter(empId => empId !== id));
  const handleSelectAllEmployees = (e) => e.target.checked ? setSelectedEmployeeIds(currentData.map(emp => emp.id)) : setSelectedEmployeeIds([]);
  const handleSelectAccessory = (e, id) => e.target.checked ? setSelectedAccessoryIds(prev => [...prev, id]) : setSelectedAccessoryIds(prev => prev.filter(itemId => itemId !== id));
  const handleSelectAllAccessories = (e) => e.target.checked ? setSelectedAccessoryIds(currentData.map(item => item.id)) : setSelectedAccessoryIds([]);

  const menuTitle = activeMenu === 'dashboard' ? 'ภาพรวมระบบ (Dashboard)' :
                    activeMenu === 'assets' ? 'ทรัพย์สิน IT หลัก' : 
                    activeMenu === 'licenses' ? 'โปรแกรม/License' : 
                    activeMenu === 'accessories' ? 'อุปกรณ์เสริม (Accessories)' : 
                    activeMenu === 'repairs' ? 'แจ้งปัญหา IT' : 'ข้อมูลพนักงาน';

  if (authRole === null) {
    return (
      <>
        <LoginView showAdminLogin={showAdminLogin} setShowAdminLogin={setShowAdminLogin} setAuthRole={setAuthRole} loginForm={loginForm} setLoginForm={setLoginForm} handleAdminLogin={handleAdminLogin} />
        <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
      </>
    );
  }

  if (authRole === 'staff') {
    return (
      <>
        <StaffView setAuthRole={setAuthRole} currentStaff={currentStaff} setCurrentStaff={setCurrentStaff} staffEmpIdInput={staffEmpIdInput} setStaffEmpIdInput={setStaffEmpIdInput} handleStaffLogin={handleStaffLogin} staffRepairForm={staffRepairForm} setStaffRepairForm={setStaffRepairForm} handleSubmitRepairRequest={handleSubmitRepairRequest} repairRequests={repairRequests} editStaffRepairModal={editStaffRepairModal} setEditStaffRepairModal={setEditStaffRepairModal} handleStaffUpdateRepair={handleStaffUpdateRepair} handleStaffDeleteRepair={handleStaffDeleteRepair} />
        <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
      </>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');`}</style>
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 px-6 md:px-10 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 sticky top-0 shrink-0">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{menuTitle}</h2>
          <div className="flex items-center gap-3">
            <div className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              {activeMenu === 'dashboard' ? `ข้อมูลในระบบทั้งหมด ${assets.length + licenses.length + accessories.length + employees.length} รายการ` : `มีรายการทั้งหมด ${currentData.length} รายการ`}
            </div>
            <button onClick={() => setAuthRole(null)} className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-full hover:bg-red-600 hover:text-white transition-colors shadow-sm whitespace-nowrap">ออกจากระบบ</button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeMenu === 'dashboard' ? (
            <DashboardStats assets={assets} licenses={licenses} accessories={accessories} employees={employees} />
          ) : activeMenu === 'repairs' ? (
            <div className="h-full flex flex-col bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-slate-100 pb-6 shrink-0">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 whitespace-nowrap"><span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner">🔧</span> คิวงานแจ้งปัญหาจากพนักงาน</h3>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select value={repairFilterStatus} onChange={(e) => setRepairFilterStatus(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm cursor-pointer">
                    <option value="ทั้งหมด">สถานะ: ทั้งหมด</option><option value="รอดำเนินการ">รอดำเนินการ</option><option value="กำลังดำเนินการ">กำลังดำเนินการ</option><option value="ซ่อมเสร็จสิ้น">ซ่อมเสร็จสิ้น</option><option value="ยกเลิก">ยกเลิก</option>
                  </select>
                </div>
              </div>
              {currentRepairRequests.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <span className="text-5xl mb-4 opacity-50 drop-shadow-sm">✅</span>
                  <p className="font-bold text-lg text-slate-500">ไม่มีคิวงานในสถานะนี้</p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-left whitespace-nowrap text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr><th className="px-5 py-4 font-bold text-slate-500">วันที่แจ้ง</th><th className="px-5 py-4 font-bold text-slate-500">ผู้แจ้ง (รหัสพนักงาน)</th><th className="px-5 py-4 font-bold text-slate-500">หัวข้อ / รายละเอียดปัญหา</th><th className="px-5 py-4 font-bold text-slate-500 text-center">สถานะ</th><th className="px-5 py-4 font-bold text-slate-500 text-center">การจัดการ</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentRepairRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 text-slate-600 font-medium">{new Date(req.timestamp).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="px-5 py-4"><div className="font-bold text-indigo-700">{req.empName}</div><div className="text-xs text-slate-500 mt-0.5">{req.empId} • {req.department || '-'}</div></td>
                          <td className="px-5 py-4"><div className="font-bold text-slate-800">{req.assetName}</div><div className="text-xs text-slate-500 mt-0.5 truncate max-w-[250px]" title={req.issue}>{req.issue}</div></td>
                          <td className="px-5 py-4 text-center">
                            <select value={req.status} onChange={(e) => handleUpdateRepairRequestStatus(req.id, e.target.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer shadow-sm ${req.status === 'รอดำเนินการ' ? 'bg-amber-50 text-amber-700 border-amber-200' : req.status === 'กำลังดำเนินการ' ? 'bg-blue-50 text-blue-700 border-blue-200' : req.status === 'ซ่อมเสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                              <option value="รอดำเนินการ">รอดำเนินการ</option><option value="กำลังดำเนินการ">กำลังดำเนินการ</option><option value="ซ่อมเสร็จสิ้น">ซ่อมเสร็จสิ้น</option><option value="ยกเลิก">ยกเลิก</option>
                            </select>
                          </td>
                          <td className="px-5 py-4 text-center"><button onClick={() => handleDeleteRepairRequest(req.id)} className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-lg transition-all shadow-sm">🗑️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col flex-1">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-slate-100 pb-6 shrink-0">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 whitespace-nowrap"><span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner">📦</span> รายการ {menuTitle}</h3>
                  <div className="flex flex-wrap w-full xl:w-auto gap-3 items-center sm:justify-end">
                    <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                      <input type="text" placeholder="ค้นหาชื่อ หรือ รหัส..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                    </div>
                    {activeMenu === 'employees' && (
                      <>
                        <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm">นำเข้า CSV</button>
                        <button onClick={handleExportEmployees} className="flex-1 sm:flex-none w-full sm:w-auto bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm">ส่งออก CSV</button>
                        {selectedEmployeeIds.length > 0 && (<button onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedEmployeeIds, collectionName: 'employees' })} className="flex-1 sm:flex-none w-full sm:w-auto bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm">🗑️ ลบที่เลือก ({selectedEmployeeIds.length})</button>)}
                      </>
                    )}
                    {activeMenu === 'assets' && (
                      <>
                        <select value={assetFilterDepartment} onChange={(e) => setAssetFilterDepartment(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm cursor-pointer"><option value="ทั้งหมด">แผนก: ทั้งหมด</option><option value="DX">DX</option><option value="BD">BD</option><option value="General">General</option></select>
                        <select value={assetFilterType} onChange={(e) => setAssetFilterType(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm cursor-pointer"><option value="ทั้งหมด">ประเภท: ทั้งหมด</option><option value="คอมพิวเตอร์">คอมพิวเตอร์ (PC/Laptop)</option><option value="หน้าจอ">หน้าจอ (Monitor)</option><option value="แท็บเล็ต/มือถือ">แท็บเล็ต / มือถือ</option><option value="อุปกรณ์เครือข่าย">อุปกรณ์เครือข่าย (Network)</option><option value="อื่นๆ">อื่นๆ</option></select>
                        <select value={assetFilterStatus} onChange={(e) => setAssetFilterStatus(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm cursor-pointer"><option value="ทั้งหมด">สถานะ: ทั้งหมด</option><option value="พร้อมใช้งาน">พร้อมใช้งาน</option><option value="ถูกใช้งาน">ถูกใช้งาน</option><option value="ชำรุดเสียหาย">ชำรุดเสียหาย</option><option value="ไม่สามารถใช้งานได้">ไม่สามารถใช้งานได้</option><option value="รอดำเนินการ">รอดำเนินการ</option></select>
                      </>
                    )}
                    {activeMenu === 'accessories' && (
                      <>
                        <select value={accFilterType} onChange={(e) => setAccFilterType(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm cursor-pointer"><option value="ทั้งหมด">ประเภท: ทั้งหมด</option><option value="เมาส์ (Mouse)">เมาส์ (Mouse)</option><option value="คีย์บอร์ด (Keyboard)">คีย์บอร์ด (Keyboard)</option><option value="สายชาร์จ (Adapter)">สายชาร์จ (Adapter)</option><option value="หูฟัง (Headset)">หูฟัง (Headset)</option><option value="กระเป๋า (Bag)">กระเป๋าใส่โน๊ตบุ๊ค</option><option value="อื่นๆ">อื่นๆ</option></select>
                        <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm">นำเข้า CSV</button>
                        <button onClick={handleExportAccessories} className="flex-1 sm:flex-none w-full sm:w-auto bg-blue-50 text-blue-700 border border-blue-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm">ส่งออก CSV</button>
                        {selectedAccessoryIds.length > 0 && (<button onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedAccessoryIds, collectionName: 'accessories' })} className="flex-1 sm:flex-none w-full sm:w-auto bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm">🗑️ ลบที่เลือก ({selectedAccessoryIds.length})</button>)}
                      </>
                    )}
                    {(activeMenu === 'assets' || activeMenu === 'licenses') && (<button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm">นำเข้า CSV</button>)}
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/30">➕ เพิ่มรายการใหม่</button>
                  </div>
                </div>
                
                {currentData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <span className="text-5xl mb-4 opacity-50 drop-shadow-sm">📂</span>
                    <p className="font-bold text-lg text-slate-500">ไม่พบข้อมูลที่ค้นหา</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
                      <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
                        <tr>
                          {activeMenu === 'employees' ? (
                            <><th className="px-4 py-4 text-center"><input type="checkbox" className="w-4 h-4" checked={currentData.length > 0 && selectedEmployeeIds?.length === currentData.length} onChange={handleSelectAllEmployees} /></th><th className="px-5 py-4 font-bold text-slate-500 text-xs">รหัสพนักงาน</th><th className="px-5 py-4 font-bold text-slate-500 text-xs">ชื่อ-นามสกุล</th><th className="px-5 py-4 font-bold text-slate-500 text-xs">แผนก / บริษัท</th><th className="px-5 py-4 font-bold text-slate-500 text-xs">ตำแหน่ง</th><th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">จัดการ</th></>
                          ) : activeMenu === 'licenses' ? (
                            <><th className="px-5 py-4 font-bold text-slate-500 text-xs">ชื่อโปรแกรม</th><th className="px-5 py-4 font-bold text-slate-500 text-xs">Product Key</th><th className="px-5 py-4 font-bold text-slate-500 text-xs">วันหมดอายุ</th><th className="px-5 py-4 font-bold text-slate-500 text-xs">ราคา</th><th className="px-5 py-4 font-bold text-slate-500 text-xs">สถานะ</th><th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">จัดการ</th></>
                          ) : (
                            <>
                              {activeMenu === 'accessories' && (<th className="px-4 py-4 text-center"><input type="checkbox" className="w-4 h-4" checked={currentData.length > 0 && selectedAccessoryIds?.length === currentData.length} onChange={handleSelectAllAccessories} /></th>)}
                              <th className="px-5 py-4 font-bold text-slate-500 text-xs">ชื่ออุปกรณ์</th><th className="px-5 py-4 font-bold text-slate-500 text-xs">ประเภท</th>
                              {activeMenu === 'assets' && (<th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">แผนก</th>)}
                              {activeMenu === 'accessories' && (<><th className="px-5 py-4 font-bold text-slate-800 text-xs text-center bg-slate-100/50">รวมทั้งหมด</th><th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">คงเหลือ</th><th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">ใช้งานไป</th><th className="px-5 py-4 font-bold text-red-500 text-xs text-center">ชำรุด/พัง</th></>)}
                              <th className="px-5 py-4 font-bold text-slate-500 text-xs">ราคา</th>{activeMenu !== 'accessories' && (<th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">สถานะ</th>)}<th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">จัดการ</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentData.map((item) => (
                          <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors group">
                            {activeMenu === 'employees' ? (
                              <>
                                <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-4 h-4" checked={selectedEmployeeIds?.includes(item.id) || false} onChange={(e) => handleSelectEmployee(e, item.id)} /></td>
                                <td className="px-5 py-4 font-bold text-indigo-700">{item.empId}</td>
                                <td className="px-5 py-4">
                                  <button onClick={() => { setSelectedEmployee(item); setEmpModalTab('info'); }} className="text-left flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg shadow-inner">{item.fullName.charAt(0)}</div>
                                    <div><span className="font-bold text-slate-800 group-hover:text-indigo-600">{item.fullName}</span> {item.nickname && <span className="text-slate-400 text-sm ml-2">({item.nickname})</span>}</div>
                                  </button>
                                </td>
                                <td className="px-5 py-4 text-slate-600"><div className="text-sm font-bold text-slate-700">{item.department}</div><div className="text-xs text-slate-400">{item.company}</div></td>
                                <td className="px-5 py-4 text-slate-600 text-sm">{item.position}</td>
                                <td className="px-5 py-4 text-center space-x-2">
                                  <button onClick={() => openEditEmpModal(item)} className="inline-flex items-center justify-center w-9 h-9 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 rounded-xl transition-all shadow-sm" title="แก้ไข">✏️</button>
                                  <button onClick={() => handleDelete(item.id, 'employees')} className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-xl transition-all shadow-sm" title="ลบ">🗑️</button>
                                </td>
                              </>
                            ) : activeMenu === 'licenses' ? (
                              <>
                                <td className="px-5 py-4"><button onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory(activeMenu); }} className="text-left font-bold text-slate-800 group-hover:text-indigo-600">{item.name}</button></td>
                                <td className="px-5 py-4 text-slate-600"><div className="text-sm font-bold font-mono bg-slate-100 px-3 py-1.5 rounded-lg w-fit border border-slate-200">{item.productKey || '-'}</div><div className="text-xs text-slate-400 ml-1 mt-1">{item.keyCode || '-'}</div></td>
                                <td className="px-5 py-4 text-sm text-slate-600">{item.expirationDate || '-'}</td>
                                <td className="px-5 py-4 text-sm font-bold text-emerald-600">{item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}</td>
                                <td className="px-5 py-4">{!item.status || item.status === 'พร้อมใช้งาน' ? <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex border border-emerald-200 shadow-sm"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> พร้อมใช้งาน</div> : <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex border border-amber-200 shadow-sm"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> {item.status}</div>}</td>
                                <td className="px-5 py-4 text-center space-x-2">
                                  {!item.status || item.status === 'พร้อมใช้งาน' ? (
                                    <button onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: activeMenu })} className="inline-flex items-center justify-center w-9 h-9 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-xl transition-all shadow-sm" title="เบิกจ่าย">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                    </button>
                                  ) : (
                                    <button onClick={() => handleCheckin(item.id, activeMenu)} className="inline-flex items-center justify-center w-9 h-9 text-teal-600 bg-teal-50 hover:bg-teal-600 hover:text-white border border-teal-200 hover:border-teal-600 rounded-xl transition-all shadow-sm" title="รับคืน">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    </button>
                                  )}
                                  <button onClick={() => openEditLicenseModal(item)} className="inline-flex items-center justify-center w-9 h-9 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 rounded-xl transition-all shadow-sm" title="แก้ไข">✏️</button>
                                  <button onClick={() => handleDelete(item.id, 'licenses')} className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-xl transition-all shadow-sm" title="ลบ">🗑️</button>
                                </td>
                              </>
                            ) : (
                              <>
                                {activeMenu === 'accessories' && (
                                  <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-4 h-4" checked={selectedAccessoryIds?.includes(item.id) || false} onChange={(e) => handleSelectAccessory(e, item.id)} /></td>
                                )}
                                <td className="px-5 py-4">
                                  <button onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory(activeMenu); }} className="text-left flex items-center gap-3 group">
                                    {item.image ? <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm" /> : <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0 shadow-inner border border-slate-200">{activeMenu === 'assets' ? '🖥️' : '🖱️'}</div>}
                                    <div className="font-bold text-slate-800 group-hover:text-indigo-600">{item.name}</div>
                                  </button>
                                </td>
                                <td className="px-5 py-4"><span className="bg-slate-100 text-slate-600 text-[11px] px-3 py-1.5 rounded-lg font-bold border border-slate-200">{item.type}</span></td>
                                {activeMenu === 'assets' && (<td className="px-5 py-4 text-center text-sm font-bold text-indigo-700">{item.department || '-'}</td>)}
                                {activeMenu === 'accessories' && (
                                  <>
                                    <td className="px-5 py-4 text-sm font-black text-slate-800 text-center bg-slate-100/50">{(item.quantity ? (Number(item.quantity) - (item.assignees?.length || 0)) : (1 - (item.assignees?.length || 0))) + (item.assignees?.length || 0) + Number(item.brokenQuantity || 0)}</td>
                                    <td className="px-5 py-4 text-sm font-bold text-slate-700 text-center bg-slate-50/50">{item.quantity ? (Number(item.quantity) - (item.assignees?.length || 0)) : (1 - (item.assignees?.length || 0))}</td>
                                    <td className="px-5 py-4 text-sm font-bold text-indigo-600 text-center">{item.assignees?.length || 0}</td>
                                    <td className="px-5 py-4 text-sm font-bold text-red-500 text-center">{item.brokenQuantity || 0}</td>
                                  </>
                                )}
                                <td className="px-5 py-4 text-sm font-bold text-emerald-600">{item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}</td>
                                {activeMenu !== 'accessories' && (
                                  <td className="px-5 py-4 text-center">
                                    {item.status === 'พร้อมใช้งาน' ? (
                                      <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex border border-emerald-200 shadow-sm"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> พร้อมใช้งาน</div>
                                    ) : (
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex border border-amber-200 shadow-sm"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> {item.status}</div>
                                        {item.assignedName && <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">👤 {item.assignedName}</span>}
                                      </div>
                                    )}
                                  </td>
                                )}
                                <td className="px-5 py-4 text-center space-x-2">
                                  {activeMenu !== 'accessories' && (
                                    item.status === 'พร้อมใช้งาน' ? (
                                      <button onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: activeMenu })} className="inline-flex items-center justify-center w-9 h-9 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-xl transition-all shadow-sm" title="เบิกจ่าย">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                      </button>
                                    ) : (
                                      <button onClick={() => handleCheckin(item.id, activeMenu)} className="inline-flex items-center justify-center w-9 h-9 text-teal-600 bg-teal-50 hover:bg-teal-600 hover:text-white border border-teal-200 hover:border-teal-600 rounded-xl transition-all shadow-sm" title="รับคืน">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                      </button>
                                    )
                                  )}
                                  {activeMenu === 'accessories' && Number(item.brokenQuantity || 0) > 0 && (
                                    <button onClick={() => { setRepairModal({ isOpen: true, assetId: item.id, assetName: item.name, maxRepair: item.brokenQuantity }); setRepairQuantity(1); setRepairRemarks(''); }} className="inline-flex items-center justify-center w-9 h-9 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-500 rounded-xl transition-all shadow-sm" title="นำกลับเข้าคลัง">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </button>
                                  )}
                                  <button onClick={() => openEditAssetModal(item, activeMenu)} className="inline-flex items-center justify-center w-9 h-9 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 rounded-xl transition-all shadow-sm" title="แก้ไข">✏️</button>
                                  <button onClick={() => handleDelete(item.id, activeMenu)} className="inline-flex items-center justify-center w-9 h-9 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-xl transition-all shadow-sm" title="ลบ">🗑️</button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ส่ง State ให้ Modals ต่างๆ */}
      <AddModal isAddModalOpen={isAddModalOpen} setIsAddModalOpen={setIsAddModalOpen} activeMenu={activeMenu} handleAddEmployee={handleAddEmployee} empForm={empForm} handleEmpChange={handleEmpChange} handleAddLicense={handleAddLicense} licenseForm={licenseForm} handleLicenseChange={handleLicenseChange} handleAdd={handleAdd} name={name} setName={setName} type={type} setType={setType} cost={cost} setCost={setCost} purchaseDate={purchaseDate} setPurchaseDate={setPurchaseDate} warrantyDate={warrantyDate} setWarrantyDate={setWarrantyDate} quantity={quantity} setQuantity={setQuantity} assetImage={assetImage} setAssetImage={setAssetImage} assetDepartment={assetDepartment} setAssetDepartment={setAssetDepartment} />
      <CheckoutModal checkoutModal={checkoutModal} setCheckoutModal={setCheckoutModal} handleCheckout={handleCheckout} checkoutSearchTerm={checkoutSearchTerm} setCheckoutSearchTerm={setCheckoutSearchTerm} checkoutEmpId={checkoutEmpId} setCheckoutEmpId={setCheckoutEmpId} employees={employees} checkoutRemarks={checkoutRemarks} setCheckoutRemarks={setCheckoutRemarks} />
      <EmployeeDetailsModal selectedEmployee={selectedEmployee} setSelectedEmployee={setSelectedEmployee} empModalTab={empModalTab} setEmpModalTab={setEmpModalTab} assets={assets} licenses={licenses} accessories={accessories} transactions={transactions} openEditEmpModal={openEditEmpModal} handleCheckin={handleCheckin} setReturnModal={setReturnModal} />
      <AssetDetailsModal selectedAssetDetail={selectedAssetDetail} setSelectedAssetDetail={setSelectedAssetDetail} selectedAssetCategory={selectedAssetCategory} setSelectedAssetCategory={setSelectedAssetCategory} accessories={accessories} assets={assets} licenses={licenses} setCheckoutModal={setCheckoutModal} setReturnModal={setReturnModal} handleCheckin={handleCheckin} openEditLicenseModal={openEditLicenseModal} openEditAssetModal={openEditAssetModal} />
      <EditEmpModal editEmpModal={editEmpModal} setEditEmpModal={setEditEmpModal} handleUpdateEmployee={handleUpdateEmployee} handleEditEmpChange={handleEditEmpChange} />
      <EditAssetModal editAssetModal={editAssetModal} setEditAssetModal={setEditAssetModal} handleUpdateAsset={handleUpdateAsset} handleEditAssetChange={handleEditAssetChange} />
      <EditLicenseModal editLicenseModal={editLicenseModal} setEditLicenseModal={setEditLicenseModal} handleUpdateLicense={handleUpdateLicense} handleEditLicenseChange={handleEditLicenseChange} />
      <ImportModal isImportModalOpen={isImportModalOpen} setIsImportModalOpen={setIsImportModalOpen} handleDownloadTemplate={handleDownloadTemplate} handleImportEmployees={handleImportEmployees} activeMenu={activeMenu} />
      <ReturnModal returnModal={returnModal} setReturnModal={setReturnModal} returnCondition={returnCondition} setReturnCondition={setReturnCondition} returnRemarks={returnRemarks} setReturnRemarks={setReturnRemarks} handleConfirmReturn={handleConfirmReturn} />
      <RepairModal repairModal={repairModal} setRepairModal={setRepairModal} repairQuantity={repairQuantity} setRepairQuantity={setRepairQuantity} repairRemarks={repairRemarks} setRepairRemarks={setRepairRemarks} handleConfirmRepair={handleConfirmRepair} />
      <ConfirmDeleteModal confirmDeleteModal={confirmDeleteModal} setConfirmDeleteModal={setConfirmDeleteModal} executeDelete={executeDelete} />
      <CustomAlert customAlert={customAlert} setCustomAlert={setCustomAlert} />
    </div>
  )
}

export default App