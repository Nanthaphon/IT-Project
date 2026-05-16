import React, { useState } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

export default function AssetDetailsModal({
  selectedAssetDetail, setSelectedAssetDetail, selectedAssetCategory, setSelectedAssetCategory,
  accessories, assets, licenses, setCheckoutModal, setReturnModal, handleCheckin, openEditLicenseModal, openEditAssetModal,
  setRepairModal, setRepairQuantity, setRepairRemarks, showConfirm, setCustomAlert
}) {
  const db = getFirestore(); 
  const [expandedItem, setExpandedItem] = useState(null); 
  const [editingItemId, setEditingItemId] = useState(null); 
  const [tempSNValue, setTempSNValue] = useState(''); 
  const [tempModelValue, setTempModelValue] = useState(''); 
  const [tempCostValue, setTempCostValue] = useState(''); 
  const [tempPurchaseDateValue, setTempPurchaseDateValue] = useState(''); 
  const [tempWarrantyDateValue, setTempWarrantyDateValue] = useState(''); 
  const [isSavingItem, setIsSavingItem] = useState(false); 

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemData, setNewItemData] = useState({ sn: '', model: '', cost: '', purchaseDate: '', warrantyDate: '', quantity: 1 });

  const [showLabelPreview, setShowLabelPreview] = useState(false);

  const [selectedItemsForDelete, setSelectedItemsForDelete] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isImportingCSV, setIsImportingCSV] = useState(false);

  // 🟢 State สำหรับจัดการ Tab
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'history', 'docs'

  // 🟢 State สำหรับแท็บ ประวัติการจัดซื้อ (History Tab)
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [historyForm, setHistoryForm] = useState({ purchaseDate: '', cost: '', vendor: '', model: '', note: '', documents: [] });

  if (!selectedAssetDetail) return null;

  const calculateAge = (dateString) => {
    if (!dateString) return '-';
    const purchaseDate = new Date(dateString);
    const today = new Date();
    if (isNaN(purchaseDate.getTime())) return '-';
    let years = today.getFullYear() - purchaseDate.getFullYear();
    let months = today.getMonth() - purchaseDate.getMonth();
    let days = today.getDate() - purchaseDate.getDate();
    if (days < 0) months--;
    if (months < 0) { years--; months += 12; }
    if (years < 0) return 'ยังไม่ถึงวันที่ซื้อ'; 
    if (years === 0 && months === 0) return 'น้อยกว่า 1 เดือน';
    let ageStr = '';
    if (years > 0) ageStr += `${years} ปี `;
    if (months > 0) ageStr += `${months} เดือน`;
    return ageStr.trim();
  };

  const currentAssetDetail = 
    selectedAssetCategory === 'accessories' ? (accessories.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
    selectedAssetCategory === 'assets' ? (assets.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
    (licenses.find(l => l.id === selectedAssetDetail.id) || selectedAssetDetail);

  // 🟢 ดึงประวัติการซื้อที่ถูกบันทึกไว้ใน Document นี้ (แยกอิสระจากข้อมูลหลัก)
  let purchaseHistory = [];
  if (selectedAssetCategory === 'assets' && currentAssetDetail) {
    purchaseHistory = [...(currentAssetDetail.purchaseHistoryLog || [])].sort((a, b) => {
      const dateA = a.purchaseDate ? new Date(a.purchaseDate) : new Date(0);
      const dateB = b.purchaseDate ? new Date(b.purchaseDate) : new Date(0);
      return dateB - dateA; // ใหม่สุดขึ้นก่อน
    });
  }

  // 🟢 ฟังก์ชันบันทึก ประวัติการจัดซื้อ (สร้างใหม่ / แก้ไข)
  const handleSaveHistory = async (e) => {
    e.preventDefault();
    if (isSavingItem) return;
    setIsSavingItem(true);
    try {
      const docRef = doc(db, selectedAssetCategory, currentAssetDetail.id);
      const currentHistory = currentAssetDetail.purchaseHistoryLog || [];
      let updatedHistory;

      if (editingHistoryId) {
        updatedHistory = currentHistory.map(h => h.id === editingHistoryId ? { ...historyForm, id: editingHistoryId } : h);
      } else {
        updatedHistory = [{ ...historyForm, id: Date.now().toString() }, ...currentHistory];
      }

      await updateDoc(docRef, { purchaseHistoryLog: updatedHistory });
      
      setIsAddingHistory(false);
      setEditingHistoryId(null);
      setHistoryForm({ purchaseDate: '', cost: '', vendor: '', model: '', note: '', documents: [] });
    } catch(error) {
      if(setCustomAlert) setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' });
    } finally {
      setIsSavingItem(false);
    }
  };

  // 🟢 ฟังก์ชันลบ ประวัติการจัดซื้อ
  const handleDeleteHistory = (id) => {
    showConfirm(
      'ยืนยันการลบประวัติ',
      'ต้องการลบประวัติการจัดซื้อรายการนี้ใช่หรือไม่?',
      async () => {
        setIsSavingItem(true);
        try {
          const docRef = doc(db, selectedAssetCategory, currentAssetDetail.id);
          const updatedHistory = (currentAssetDetail.purchaseHistoryLog || []).filter(h => h.id !== id);
          await updateDoc(docRef, { purchaseHistoryLog: updatedHistory });
        } catch(err) {
          console.error(err);
        } finally {
          setIsSavingItem(false);
        }
      },
      { confirmText: 'ลบประวัติ', icon: 'trash' }
    );
  };

  // 🟢 ฟังก์ชันอัปโหลดเอกสารสำหรับ ประวัติการจัดซื้อ
  const handleHistoryDocUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      if(setCustomAlert) setCustomAlert({ isOpen: true, title: 'ไฟล์มีขนาดใหญ่เกินไป', message: 'ขนาดไฟล์แต่ละไฟล์ต้องไม่เกิน 5MB', type: 'error' });
      e.target.value = null;
      return;
    }
    setIsSavingItem(true);
    try {
      const newDocs = await Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ name: file.name, data: reader.result });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }));
      setHistoryForm(prev => ({ ...prev, documents: [...(prev.documents || []), ...newDocs] }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingItem(false);
      e.target.value = null;
    }
  };

  // 🟢 ฟังก์ชันลบเอกสารออกจากฟอร์มประวัติ
  const handleRemoveHistoryDoc = (index) => {
    setHistoryForm(prev => {
      const updatedDocs = [...(prev.documents || [])];
      updatedDocs.splice(index, 1);
      return { ...prev, documents: updatedDocs };
    });
  };

  const handleAddNewPiece = async () => {
    if (isSavingItem) return;
    setIsSavingItem(true);
    try {
      const docRef = doc(db, selectedAssetCategory, currentAssetDetail.id);
      const currentQty = Number(currentAssetDetail.quantity || 0);
      const addQty = Number(newItemData.quantity) || 1;

      const newAvailableSNs = [...(currentAssetDetail.availableSNs || [])];
      const newAvailableModels = [...(currentAssetDetail.availableModels || [])];
      const newAvailableCosts = [...(currentAssetDetail.availableCosts || [])];
      const newAvailablePurchaseDates = [...(currentAssetDetail.availablePurchaseDates || [])];
      const newAvailableWarrantyDates = [...(currentAssetDetail.availableWarrantyDates || [])];

      const availableCount = Math.max(0, currentQty - (currentAssetDetail.assignees?.length || 0) - Number(currentAssetDetail.brokenQuantity || 0));

      while (newAvailableSNs.length < availableCount) newAvailableSNs.push('');
      while (newAvailableModels.length < availableCount) newAvailableModels.push('');
      while (newAvailableCosts.length < availableCount) newAvailableCosts.push('');
      while (newAvailablePurchaseDates.length < availableCount) newAvailablePurchaseDates.push('');
      while (newAvailableWarrantyDates.length < availableCount) newAvailableWarrantyDates.push('');

      for (let i = 0; i < addQty; i++) {
        newAvailableSNs.push(newItemData.sn.trim());
        newAvailableModels.push(newItemData.model.trim());
        newAvailableCosts.push(newItemData.cost.trim());
        newAvailablePurchaseDates.push(newItemData.purchaseDate);
        newAvailableWarrantyDates.push(newItemData.warrantyDate);
      }

      await updateDoc(docRef, {
        quantity: currentQty + addQty,
        availableSNs: newAvailableSNs,
        availableModels: newAvailableModels,
        availableCosts: newAvailableCosts,
        availablePurchaseDates: newAvailablePurchaseDates,
        availableWarrantyDates: newAvailableWarrantyDates
      });

      setIsAddingNew(false);
      setNewItemData({ sn: '', model: '', cost: '', purchaseDate: '', warrantyDate: '', quantity: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleSaveItemDetails = async (item) => {
    if (isSavingItem) return;
    setIsSavingItem(true);
    try {
      const docRef = doc(db, selectedAssetCategory, currentAssetDetail.id);
      
      if (item.type === 'available') {
        const newSNs = [...(currentAssetDetail.availableSNs || [])];
        const newModels = [...(currentAssetDetail.availableModels || [])];
        const newCosts = [...(currentAssetDetail.availableCosts || [])];
        const newPurchaseDates = [...(currentAssetDetail.availablePurchaseDates || [])];
        const newWarrantyDates = [...(currentAssetDetail.availableWarrantyDates || [])];

        while (newSNs.length <= item.originalIndex) newSNs.push('');
        while (newModels.length <= item.originalIndex) newModels.push('');
        while (newCosts.length <= item.originalIndex) newCosts.push('');
        while (newPurchaseDates.length <= item.originalIndex) newPurchaseDates.push('');
        while (newWarrantyDates.length <= item.originalIndex) newWarrantyDates.push('');

        newSNs[item.originalIndex] = tempSNValue.trim();
        newModels[item.originalIndex] = tempModelValue.trim();
        newCosts[item.originalIndex] = tempCostValue.trim();
        newPurchaseDates[item.originalIndex] = tempPurchaseDateValue;
        newWarrantyDates[item.originalIndex] = tempWarrantyDateValue;

        await updateDoc(docRef, { 
          availableSNs: newSNs, availableModels: newModels, availableCosts: newCosts, availablePurchaseDates: newPurchaseDates, availableWarrantyDates: newWarrantyDates 
        });
      } 
      else if (item.type === 'assigned') {
        const newAssignees = [...(currentAssetDetail.assignees || [])];
        const idx = newAssignees.findIndex(a => a.checkoutId === item.assignee.checkoutId);
        if (idx !== -1) {
          newAssignees[idx].serialNumber = tempSNValue.trim();
          newAssignees[idx].model = tempModelValue.trim();
          newAssignees[idx].customCost = tempCostValue.trim();
          newAssignees[idx].purchaseDate = tempPurchaseDateValue;
          newAssignees[idx].warrantyDate = tempWarrantyDateValue;
          await updateDoc(docRef, { assignees: newAssignees });
        }
      } 
      else if (item.type === 'broken') {
        const newSNs = [...(currentAssetDetail.brokenSNs || [])];
        const newModels = [...(currentAssetDetail.brokenModels || [])];
        const newCosts = [...(currentAssetDetail.brokenCosts || [])];
        const newPurchaseDates = [...(currentAssetDetail.brokenPurchaseDates || [])];
        const newWarrantyDates = [...(currentAssetDetail.brokenWarrantyDates || [])];

        while (newSNs.length <= item.originalIndex) newSNs.push('');
        while (newModels.length <= item.originalIndex) newModels.push('');
        while (newCosts.length <= item.originalIndex) newCosts.push('');
        while (newPurchaseDates.length <= item.originalIndex) newPurchaseDates.push('');
        while (newWarrantyDates.length <= item.originalIndex) newWarrantyDates.push('');

        newSNs[item.originalIndex] = tempSNValue.trim();
        newModels[item.originalIndex] = tempModelValue.trim();
        newCosts[item.originalIndex] = tempCostValue.trim();
        newPurchaseDates[item.originalIndex] = tempPurchaseDateValue;
        newWarrantyDates[item.originalIndex] = tempWarrantyDateValue;

        await updateDoc(docRef, { 
          brokenSNs: newSNs, brokenModels: newModels, brokenCosts: newCosts, brokenPurchaseDates: newPurchaseDates, brokenWarrantyDates: newWarrantyDates 
        });
      }
      setEditingItemId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      if(setCustomAlert) setCustomAlert({ isOpen: true, title: 'ไฟล์มีขนาดใหญ่เกินไป', message: 'ขนาดไฟล์แต่ละไฟล์ต้องไม่เกิน 5MB (เพื่อป้องกันฐานข้อมูลเต็ม)', type: 'error' });
      e.target.value = null;
      return;
    }

    setIsSavingItem(true);
    try {
      const docRef = doc(db, selectedAssetCategory, currentAssetDetail.id);
      
      const newDocs = await Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ name: file.name, data: reader.result });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }));

      let existingDocs = currentAssetDetail.documents || [];
      
      if (currentAssetDetail.document && existingDocs.length === 0) {
        if (Array.isArray(currentAssetDetail.document)) {
          existingDocs = [...currentAssetDetail.document];
        } else {
          existingDocs = [currentAssetDetail.document];
        }
      }
      
      const flatExistingDocs = existingDocs.flat();
      const combinedDocs = [...flatExistingDocs, ...newDocs];

      await updateDoc(docRef, { documents: combinedDocs, document: null });
    } catch (error) {
      console.error('Error uploading document:', error);
      if(setCustomAlert) setCustomAlert({ isOpen: true, title: 'ข้อผิดพลาด', message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + error.message, type: 'error' });
    } finally {
      setIsSavingItem(false);
      e.target.value = null; 
    }
  };

  const handleRemoveDocument = async (indexToRemove) => {
    const executeRemove = async () => {
      setIsSavingItem(true);
      try {
        let existingDocs = currentAssetDetail.documents || [];
        
        if (currentAssetDetail.document && existingDocs.length === 0) {
          if (Array.isArray(currentAssetDetail.document)) {
            existingDocs = [...currentAssetDetail.document];
          } else {
            existingDocs = [currentAssetDetail.document];
          }
        }
        
        const flatExistingDocs = existingDocs.flat();
        const updatedDocs = flatExistingDocs.filter((_, idx) => idx !== indexToRemove);
        const docRef = doc(db, selectedAssetCategory, currentAssetDetail.id);
        
        await updateDoc(docRef, { documents: updatedDocs, document: null });
      } catch (error) {
        console.error('Error removing document:', error);
        if(setCustomAlert) setCustomAlert({ isOpen: true, title: 'ข้อผิดพลาด', message: 'เกิดข้อผิดพลาดในการลบไฟล์: ' + error.message, type: 'error' });
      } finally {
        setIsSavingItem(false);
      }
    };

    if (typeof showConfirm === 'function') {
      showConfirm(
        'ยืนยันการลบเอกสารแนบ',
        'คุณต้องการลบเอกสารแนบนี้ออกจากระบบใช่หรือไม่?',
        executeRemove,
        { confirmText: 'ยืนยันลบ', icon: 'trash' }
      );
    } else {
      if (!window.confirm('คุณต้องการลบเอกสารแนบนี้ออกจากระบบใช่หรือไม่?')) return;
      await executeRemove();
    }
  };

  let individualItems = [];
  if (selectedAssetCategory === 'accessories') {
    const totalQty = currentAssetDetail.quantity ? Number(currentAssetDetail.quantity) : 0;
    const assigneesCount = currentAssetDetail.assignees?.length || 0;
    const brokenCount = Number(currentAssetDetail.brokenQuantity || 0);
    const availableCount = Math.max(0, totalQty - assigneesCount - brokenCount);

    for (let i = 0; i < availableCount; i++) {
      individualItems.push({ 
        type: 'available', status: 'พร้อมใช้งาน', 
        sn: currentAssetDetail.availableSNs?.[i] || '', 
        model: currentAssetDetail.availableModels?.[i] || '',
        itemCost: currentAssetDetail.availableCosts?.[i] || '',
        purchaseDate: currentAssetDetail.availablePurchaseDates?.[i] || '',
        warrantyDate: currentAssetDetail.availableWarrantyDates?.[i] || '',
        id: `avail-${i}`, originalIndex: i
      });
    }
    if (currentAssetDetail.assignees) {
      currentAssetDetail.assignees.forEach((a, i) => {
        individualItems.push({ 
          type: 'assigned', status: 'ถูกใช้งาน', 
          assignee: a, sn: a.serialNumber || '', 
          model: a.model || '',
          itemCost: a.customCost || '',
          purchaseDate: a.purchaseDate || '',
          warrantyDate: a.warrantyDate || '',
          id: `assign-${a.checkoutId || i}`, originalIndex: i
        });
      });
    }
    for (let i = 0; i < brokenCount; i++) {
      individualItems.push({ 
        type: 'broken', status: 'ชำรุดเสียหาย', 
        sn: currentAssetDetail.brokenSNs?.[i] || '', 
        model: currentAssetDetail.brokenModels?.[i] || '',
        itemCost: currentAssetDetail.brokenCosts?.[i] || '',
        purchaseDate: currentAssetDetail.brokenPurchaseDates?.[i] || '',
        warrantyDate: currentAssetDetail.brokenWarrantyDates?.[i] || '',
        id: `broken-${i}`, originalIndex: i
      });
    }

    individualItems.sort((a, b) => {
      const typeOrder = { 'available': 1, 'assigned': 2, 'broken': 3 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return (a.sn || '').localeCompare((b.sn || ''), undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  let totalAccessoriesCost = 0;
  if (selectedAssetCategory === 'accessories') {
    totalAccessoriesCost = individualItems.reduce((sum, item) => sum + (Number(item.itemCost) || 0), 0);
  }

  const handleSelectItem = (itemId) => {
    setSelectedItemsForDelete(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAllItems = () => {
    if (selectedItemsForDelete.length === individualItems.length) {
      setSelectedItemsForDelete([]); 
    } else {
      setSelectedItemsForDelete(individualItems.map(item => item.id)); 
    }
  };

  const handleDeleteSelectedItems = () => {
    showConfirm(
      'ยืนยันการลบรายการย่อย',
      `คุณต้องการลบรายการย่อยที่เลือกจำนวน ${selectedItemsForDelete.length} รายการออกจากระบบใช่หรือไม่?`,
      async () => {
        if (isSavingItem) return;
        setIsSavingItem(true);
        try {
          const docRef = doc(db, selectedAssetCategory, currentAssetDetail.id);
          const availIndicesToDelete = selectedItemsForDelete.filter(id => id.startsWith('avail-')).map(id => parseInt(id.replace('avail-', '')));
          const brokenIndicesToDelete = selectedItemsForDelete.filter(id => id.startsWith('broken-')).map(id => parseInt(id.replace('broken-', '')));
          const assignIdsToDelete = selectedItemsForDelete.filter(id => id.startsWith('assign-')).map(id => id.replace('assign-', ''));
          const newAvailableSNs = (currentAssetDetail.availableSNs || []).filter((_, idx) => !availIndicesToDelete.includes(idx));
          const newAvailableModels = (currentAssetDetail.availableModels || []).filter((_, idx) => !availIndicesToDelete.includes(idx));
          const newAvailableCosts = (currentAssetDetail.availableCosts || []).filter((_, idx) => !availIndicesToDelete.includes(idx));
          const newAvailablePurchaseDates = (currentAssetDetail.availablePurchaseDates || []).filter((_, idx) => !availIndicesToDelete.includes(idx));
          const newAvailableWarrantyDates = (currentAssetDetail.availableWarrantyDates || []).filter((_, idx) => !availIndicesToDelete.includes(idx));
          const newBrokenSNs = (currentAssetDetail.brokenSNs || []).filter((_, idx) => !brokenIndicesToDelete.includes(idx));
          const newBrokenModels = (currentAssetDetail.brokenModels || []).filter((_, idx) => !brokenIndicesToDelete.includes(idx));
          const newBrokenCosts = (currentAssetDetail.brokenCosts || []).filter((_, idx) => !brokenIndicesToDelete.includes(idx));
          const newBrokenPurchaseDates = (currentAssetDetail.brokenPurchaseDates || []).filter((_, idx) => !brokenIndicesToDelete.includes(idx));
          const newBrokenWarrantyDates = (currentAssetDetail.brokenWarrantyDates || []).filter((_, idx) => !brokenIndicesToDelete.includes(idx));
          const newAssignees = (currentAssetDetail.assignees || []).filter(a => !assignIdsToDelete.includes(a.checkoutId));
          const totalDeleted = selectedItemsForDelete.length;
          const newQuantity = Math.max(0, (Number(currentAssetDetail.quantity) || 0) - totalDeleted);
          const newBrokenQuantity = Math.max(0, (Number(currentAssetDetail.brokenQuantity) || 0) - brokenIndicesToDelete.length);
          await updateDoc(docRef, {
            quantity: newQuantity, brokenQuantity: newBrokenQuantity,
            availableSNs: newAvailableSNs, availableModels: newAvailableModels, availableCosts: newAvailableCosts,
            availablePurchaseDates: newAvailablePurchaseDates, availableWarrantyDates: newAvailableWarrantyDates,
            brokenSNs: newBrokenSNs, brokenModels: newBrokenModels, brokenCosts: newBrokenCosts,
            brokenPurchaseDates: newBrokenPurchaseDates, brokenWarrantyDates: newBrokenWarrantyDates,
            assignees: newAssignees
          });
          setSelectedItemsForDelete([]);
          setExpandedItem(null);
          setEditingItemId(null);
        } catch (error) {
          setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: 'เกิดข้อผิดพลาดในการลบรายการ: ' + error.message, type: 'error' });
        } finally {
          setIsSavingItem(false);
        }
      },
      { confirmText: 'ยืนยันลบ', icon: 'trash' }
    );
  };

  const handleDownloadPieceTemplate = () => {
    const csvContent = "Serial Number,รุ่น/โมเดล,ราคา (บาท),วันที่ซื้อ (YYYY-MM-DD),วันที่หมด Warranty (YYYY-MM-DD)\nSN001,Logitech M90,150,2024-01-01,2025-01-01";
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_accessories.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadPieceCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      if (rows.length <= 1) {
        setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: 'ไม่พบข้อมูลในไฟล์ CSV (กรุณาใส่ข้อมูลใต้หัวข้อ)', type: 'error' });
        e.target.value = null;
        return;
      }
      
      const dataRows = rows.slice(1);
      const newSNs = [];
      const newModels = [];
      const newCosts = [];
      const newPurchaseDates = [];
      const newWarrantyDates = [];

      dataRows.forEach(row => {
        const cols = row.split(',').map(col => col.replace(/^"|"$/g, '').trim());
        newSNs.push(cols[0] || '');
        newModels.push(cols[1] || '');
        newCosts.push(cols[2] || '');
        newPurchaseDates.push(cols[3] || '');
        newWarrantyDates.push(cols[4] || '');
      });

      showConfirm(
        'ยืนยันการนำเข้าข้อมูล',
        `พบข้อมูลจำนวน ${dataRows.length} รายการ ต้องการนำเข้าใช่หรือไม่?`,
        async () => {
          setIsSavingItem(true);
          try {
            const docRef = doc(db, selectedAssetCategory, currentAssetDetail.id);
            const currentQty = Number(currentAssetDetail.quantity || 0);
            const availableCount = Math.max(0, currentQty - (currentAssetDetail.assignees?.length || 0) - Number(currentAssetDetail.brokenQuantity || 0));
            const updatedAvailableSNs = [...(currentAssetDetail.availableSNs || [])];
            const updatedAvailableModels = [...(currentAssetDetail.availableModels || [])];
            const updatedAvailableCosts = [...(currentAssetDetail.availableCosts || [])];
            const updatedAvailablePurchaseDates = [...(currentAssetDetail.availablePurchaseDates || [])];
            const updatedAvailableWarrantyDates = [...(currentAssetDetail.availableWarrantyDates || [])];
            while (updatedAvailableSNs.length < availableCount) updatedAvailableSNs.push('');
            while (updatedAvailableModels.length < availableCount) updatedAvailableModels.push('');
            while (updatedAvailableCosts.length < availableCount) updatedAvailableCosts.push('');
            while (updatedAvailablePurchaseDates.length < availableCount) updatedAvailablePurchaseDates.push('');
            while (updatedAvailableWarrantyDates.length < availableCount) updatedAvailableWarrantyDates.push('');
            updatedAvailableSNs.push(...newSNs);
            updatedAvailableModels.push(...newModels);
            updatedAvailableCosts.push(...newCosts);
            updatedAvailablePurchaseDates.push(...newPurchaseDates);
            updatedAvailableWarrantyDates.push(...newWarrantyDates);
            await updateDoc(docRef, {
              quantity: currentQty + dataRows.length,
              availableSNs: updatedAvailableSNs, availableModels: updatedAvailableModels, availableCosts: updatedAvailableCosts,
              availablePurchaseDates: updatedAvailablePurchaseDates, availableWarrantyDates: updatedAvailableWarrantyDates
            });
            setIsImportingCSV(false);
            setCustomAlert({ isOpen: true, title: 'นำเข้าสำเร็จ!', message: 'นำเข้าข้อมูลรายการย่อยเรียบร้อยแล้ว', type: 'success' });
          } catch (err) {
            setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: 'เกิดข้อผิดพลาดในการนำเข้า: ' + err.message, type: 'error' });
          } finally {
            setIsSavingItem(false);
          }
        },
        { confirmText: 'นำเข้า', icon: 'import' }
      );
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const closeAll = () => {
    setSelectedAssetDetail(null);
    setSelectedAssetCategory('');
    setExpandedItem(null);
    setEditingItemId(null);
    setIsAddingNew(false);
    setShowLabelPreview(false);
    setSelectedItemsForDelete([]); 
    setIsImportingCSV(false);
    setActiveTab('info');
    setIsAddingHistory(false);
    setEditingHistoryId(null);
  };

  if (showLabelPreview) {
    const rawTag = currentAssetDetail.assetTag || currentAssetDetail.sn || currentAssetDetail.name || "0";
    const barcodeDataString = rawTag.replace(/[^a-zA-Z0-9-]/g, "");
    
    const qrDataString = `ASSET\nN:${currentAssetDetail.name || '-'}\nT:${currentAssetDetail.assetTag || '-'}\nS:${currentAssetDetail.sn || '-'}\nM:${currentAssetDetail.model || '-'}\nC:${currentAssetDetail.company || '-'}\nV:${currentAssetDetail.vendor || '-'}\nTy:${currentAssetDetail.type || '-'}\nPr:${currentAssetDetail.cost || '-'}\nPd:${currentAssetDetail.purchaseDate || '-'}\nWd:${currentAssetDetail.warrantyDate || '-'}\nOwn:${currentAssetDetail.assignedName || '-'}`;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity print:bg-transparent print:backdrop-blur-none" style={{ fontFamily: "Arial, sans-serif" }}>
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #printable-label-container, #printable-label-container * { visibility: visible !important; }
            #printable-label-container { 
              position: absolute !important; 
              left: 15mm !important; 
              top: 15mm !important; 
              margin: 0 !important; 
              padding: 0 !important;
            }
            @page { size: auto; margin: 0mm; }
          }
        `}</style>

        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col border border-slate-200 print:border-none print:shadow-none print:bg-transparent">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center print:hidden">
            <h3 className="font-semibold text-slate-800">ตัวอย่างป้าย (Label Preview)</h3>
            <button onClick={() => setShowLabelPreview(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="p-10 flex justify-center items-center bg-slate-100/50 overflow-x-auto print:p-0 print:bg-transparent">
            <div id="printable-label-container" className="bg-white border-[3px] border-slate-800 p-1 flex flex-col w-[180px] h-[80px] text-slate-800 shrink-0 relative box-border overflow-hidden">
              <div className="flex gap-1.5 h-full mb-0.5 overflow-hidden">
                <div className="w-[42px] h-[42px] shrink-0 border border-slate-200 p-0.5 bg-white flex items-center justify-center self-start">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrDataString)}&ecc=L&margin=0`} alt="QR Code" className="w-full h-full object-contain" />
                </div>
                
                <div className="flex flex-col text-[7.5px] leading-[1.05] font-bold w-full overflow-hidden justify-start pt-0.5">
                  <div className="truncate">C: {currentAssetDetail.company || '-'}</div>
                  <div className="truncate whitespace-normal line-clamp-2 mt-[0.5px]">N: {currentAssetDetail.name} {currentAssetDetail.model ? ` ${currentAssetDetail.model}` : ''}</div>
                  <div className="truncate mt-[0.5px]">T: {currentAssetDetail.assetTag || '-'}</div>
                  <div className="truncate mt-[0.5px]">S: {currentAssetDetail.sn || '-'}</div>
                </div>
              </div>
              
              <div className="h-[18px] w-full mt-auto flex justify-center overflow-hidden">
                <img src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcodeDataString)}&code=Code128&hidehrt=True&unit=Fit`} alt="Barcode" className="w-full h-full object-fill" />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 print:hidden">
            <button onClick={() => setShowLabelPreview(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">ปิด</button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-[#1E487A] text-white rounded-lg font-medium hover:bg-[#133257] transition-colors">สั่งพิมพ์ (Print)</button>
          </div>
        </div>
      </div>
    );
  }

  const DetailItem = ({ label, value, isMono = false }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={`text-sm font-semibold text-slate-800 ${isMono ? 'font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 w-fit' : ''}`}>
        {value || '-'}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full flex flex-col max-h-[95vh] border border-slate-200">
        
        {/* 🟢 ส่วน Header และ Profile ด้านบน */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-[#1E487A] rounded-t-2xl shrink-0">
          <h3 className="font-bold text-lg text-white">
            รายละเอียด{selectedAssetCategory === 'assets' ? 'ทรัพย์สินหลัก' : selectedAssetCategory === 'accessories' ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}
          </h3>
          <button onClick={closeAll} className="text-blue-200 hover:text-white transition-colors p-1.5 rounded-md hover:bg-[#133257]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 pb-0 flex-shrink-0 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-6">
          {currentAssetDetail.image && selectedAssetCategory !== 'licenses' ? (
            <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm">
              <img src={currentAssetDetail.image} alt="Asset" className="max-w-full max-h-full object-contain p-1" />
            </div>
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center bg-white text-slate-400 shadow-sm">
              <svg className="w-8 h-8 mb-1 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-[10px] font-medium">ไม่มีรูปภาพ</span>
            </div>
          )}
          
          <div className="flex-1 flex flex-col justify-center pb-6">
            <h2 className="text-2xl font-bold text-[#1E487A] mb-3">{currentAssetDetail.name}</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200 shadow-sm">
                {currentAssetDetail.type || 'ไม่ระบุประเภท'}
              </span>
              
              {selectedAssetCategory !== 'accessories' && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm inline-flex items-center gap-1.5 ${(!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span> 
                  {currentAssetDetail.status || 'พร้อมใช้งาน'}
                </span>
              )}

              {selectedAssetCategory === 'assets' && currentAssetDetail.department && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 shadow-sm">
                  แผนก: {currentAssetDetail.department}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 🟢 แถบเมนูย่อย (Tabs) */}
        <div className="flex px-6 border-b border-slate-200 gap-6 shrink-0 overflow-x-auto scrollbar-hide bg-white">
          <button 
            onClick={() => { setActiveTab('info'); setIsAddingHistory(false); setEditingHistoryId(null); }} 
            className={`py-3.5 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'info' ? 'border-[#1E487A] text-[#1E487A]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
          >
            ข้อมูลทั่วไป
          </button>
          
          {selectedAssetCategory === 'assets' && (
            <button 
              onClick={() => setActiveTab('history')} 
              className={`py-3.5 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-[#1E487A] text-[#1E487A]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
            >
              ประวัติการจัดซื้อ ({purchaseHistory.length})
            </button>
          )}

          <button 
            onClick={() => { setActiveTab('docs'); setIsAddingHistory(false); setEditingHistoryId(null); }} 
            className={`py-3.5 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'docs' ? 'border-[#1E487A] text-[#1E487A]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
          >
            เอกสารแนบ
          </button>
        </div>
        
        {/* 🟢 เนื้อหาใน Tabs */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* TAB 1: ข้อมูลทั่วไป (เนื้อหาเดิมทั้งหมดอยู่ที่นี่) */}
          {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {selectedAssetCategory !== 'accessories' && currentAssetDetail.assignedName && (
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                   <div>
                     <span className="text-xs text-[#1E487A] font-bold tracking-wide uppercase">ผู้ครอบครองปัจจุบัน</span>
                     <div className="flex items-center gap-2 mt-1">
                       <div className="w-8 h-8 rounded-full bg-white text-[#1E487A] flex items-center justify-center font-bold text-sm border border-blue-200 shadow-sm shrink-0">
                         {currentAssetDetail.assignedName.charAt(0)}
                       </div>
                       <p className="text-lg font-bold text-[#1E487A]">{currentAssetDetail.assignedName}</p>
                     </div>
                   </div>
                   <span className="px-3 py-1.5 bg-white rounded-md text-xs font-semibold border border-blue-100 text-[#1E487A] shadow-sm inline-flex items-center gap-1.5 w-fit">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> กำลังถูกใช้งาน
                   </span>
                </div>
              )}

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-[#1E487A] mb-4 border-b border-slate-100 pb-2">ข้อมูลจำเพาะ</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                  {selectedAssetCategory === 'licenses' ? (
                    <>
                      <div className="col-span-2 md:col-span-4"><DetailItem label="Product Key" value={currentAssetDetail.productKey} isMono /></div>
                      <DetailItem label="รหัสอ้างอิง Key" value={currentAssetDetail.keyCode} />
                      <DetailItem label="Supplier ที่ซื้อ" value={currentAssetDetail.supplier} />
                      <DetailItem label="วันที่ซื้อ" value={currentAssetDetail.purchaseDate} />
                      <DetailItem label="อายุการใช้งาน" value={calculateAge(currentAssetDetail.purchaseDate)} />
                      <DetailItem label="วันที่หมดอายุ" value={currentAssetDetail.expirationDate} />
                    </>
                  ) : selectedAssetCategory === 'assets' ? (
                    <>
                      <DetailItem label="Asset Tag" value={currentAssetDetail.assetTag} isMono />
                      <DetailItem label="Serial Number" value={currentAssetDetail.sn} isMono />
                      <DetailItem label="ยี่ห้อ/รุ่น (Model)" value={currentAssetDetail.model} />
                      <DetailItem label="ผู้จัดจำหน่าย" value={currentAssetDetail.vendor} />
                      <DetailItem label="บริษัท" value={currentAssetDetail.company} />
                      <DetailItem label="วันที่ซื้อ" value={currentAssetDetail.purchaseDate} />
                      <DetailItem label="อายุการใช้งาน" value={calculateAge(currentAssetDetail.purchaseDate)} />
                      <DetailItem label="วันที่หมด Warranty" value={currentAssetDetail.warrantyDate} />
                    </>
                  ) : (
                    <>
                      <DetailItem label="จำนวนทั้งหมด" value={`${currentAssetDetail.quantity || 0} ชิ้น`} />
                      <DetailItem label="คงเหลือ (เบิกได้)" value={`${currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : 0} ชิ้น`} />
                    </>
                  )}

                  <div className="col-span-2 md:col-span-4 pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">{selectedAssetCategory === 'accessories' ? 'มูลค่ารวม' : 'ราคาจัดซื้อ'}</span>
                    <span className="text-base font-bold text-slate-800">
                      {selectedAssetCategory === 'accessories' 
                        ? (totalAccessoriesCost > 0 ? `฿${totalAccessoriesCost.toLocaleString()}` : '-') 
                        : (currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-')}
                    </span>
                  </div>
                </div>
              </div>

              {/* ส่วนจัดการชิ้นย่อย (เฉพาะอุปกรณ์เสริม) ยังคงอยู่และทำงานได้ 100% */}
              {selectedAssetCategory === 'accessories' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-100 pb-4 gap-3">
                    <h4 className="text-sm font-bold text-[#1E487A]">รายการชิ้นย่อย ({individualItems.length})</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {individualItems.length > 0 && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer mr-2">
                          <input type="checkbox" checked={selectedItemsForDelete.length === individualItems.length && individualItems.length > 0} onChange={handleSelectAllItems} className="w-3.5 h-3.5 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]" />
                          เลือกทั้งหมด
                        </label>
                      )}
                      {selectedItemsForDelete.length > 0 && (
                        <button onClick={handleDeleteSelectedItems} disabled={isSavingItem} className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md border border-red-200 transition-colors disabled:opacity-50">
                          ลบ ({selectedItemsForDelete.length})
                        </button>
                      )}
                      <button onClick={() => { setIsImportingCSV(!isImportingCSV); setIsAddingNew(false); }} className="text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-md transition-colors">
                        นำเข้า CSV
                      </button>
                      <button onClick={() => { setIsAddingNew(!isAddingNew); setIsImportingCSV(false); }} className="text-xs text-white bg-[#1E487A] hover:bg-[#133257] px-3 py-1.5 rounded-md transition-colors">
                        + เพิ่มชิ้นใหม่
                      </button>
                    </div>
                  </div>

                  {isImportingCSV && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 animate-in fade-in">
                      <div className="flex flex-col sm:flex-row gap-4 mb-3">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-700 mb-2">1. ดาวน์โหลด Template</p>
                          <button onClick={handleDownloadPieceTemplate} className="w-full py-1.5 bg-white border border-slate-300 text-slate-700 text-xs rounded-md hover:bg-slate-50">
                            ดาวน์โหลด .csv
                          </button>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-700 mb-2">2. อัปโหลดข้อมูล</p>
                          <input type="file" accept=".csv" onChange={handleUploadPieceCSV} className="block w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-200 file:text-slate-700 cursor-pointer" />
                        </div>
                      </div>
                      <div className="text-right"><button onClick={() => setIsImportingCSV(false)} className="text-xs text-slate-500 hover:text-slate-700">ยกเลิก</button></div>
                    </div>
                  )}

                  {isAddingNew && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 animate-in fade-in">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        <input type="text" value={newItemData.sn} onChange={e=>setNewItemData({...newItemData, sn: e.target.value})} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full" placeholder="Serial Number" />
                        <input type="text" value={newItemData.model} onChange={e=>setNewItemData({...newItemData, model: e.target.value})} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full" placeholder="รุ่น / โมเดล" />
                        <input type="number" value={newItemData.cost} onChange={e=>setNewItemData({...newItemData, cost: e.target.value})} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full" placeholder="ราคา (บาท)" />
                        <input type="date" value={newItemData.purchaseDate} onChange={e=>setNewItemData({...newItemData, purchaseDate: e.target.value})} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full text-slate-600" title="วันที่ซื้อ" />
                        <input type="date" value={newItemData.warrantyDate} onChange={e=>setNewItemData({...newItemData, warrantyDate: e.target.value})} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full text-slate-600" title="วันหมดประกัน" />
                        <input type="number" min="1" value={newItemData.quantity} onChange={e=>setNewItemData({...newItemData, quantity: e.target.value})} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full" placeholder="จำนวน (ชิ้น)" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAddingNew(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-md">ยกเลิก</button>
                        <button onClick={handleAddNewPiece} disabled={isSavingItem} className="px-3 py-1.5 text-xs text-white bg-[#1E487A] hover:bg-[#133257] rounded-md disabled:opacity-50">บันทึก</button>
                      </div>
                    </div>
                  )}
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                    {individualItems.map((item, index) => (
                      <div key={item.id} className="bg-white transition-colors hover:bg-slate-50">
                        <div onClick={() => setExpandedItem(expandedItem === index ? null : index)} className="p-3 flex items-center justify-between cursor-pointer gap-2">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <input type="checkbox" checked={selectedItemsForDelete.includes(item.id)} onChange={(e) => { e.stopPropagation(); handleSelectItem(item.id); }} onClick={(e) => e.stopPropagation()} className="w-3.5 h-3.5 text-[#1E487A] rounded border-slate-300 shrink-0" />
                            <span className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'available' ? 'bg-emerald-500' : item.type === 'assigned' ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 truncate">
                              <span className="text-xs font-semibold text-slate-800 truncate">
                                {item.type === 'assigned' ? `ผู้ถือครอง: ${item.assignee.empName}` : `ชิ้นที่ ${index + 1}`}
                              </span>
                              {item.sn && <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 rounded border border-slate-200 truncate">SN: {item.sn}</span>}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {item.type === 'available' ? (
                              <button onClick={(e) => { e.stopPropagation(); setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory, sn: item.sn, snIndex: item.originalIndex, itemCost: item.itemCost, itemPurchaseDate: item.purchaseDate, itemWarrantyDate: item.warrantyDate }); }} className="text-[10px] font-semibold bg-white border border-blue-200 text-[#1E487A] hover:bg-blue-50 px-2 py-1 rounded">เบิกจ่าย</button>
                            ) : item.type === 'assigned' ? (
                              <button onClick={(e) => { e.stopPropagation(); setReturnModal({ isOpen: true, assetId: currentAssetDetail.id, checkoutId: item.assignee.checkoutId, empId: item.assignee.empId, empName: item.assignee.empName, assetName: currentAssetDetail.name }); }} className="text-[10px] font-semibold bg-white border border-teal-200 text-teal-600 hover:bg-teal-50 px-2 py-1 rounded">รับคืน</button>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setRepairModal({ isOpen: true, assetId: currentAssetDetail.id, assetName: `${currentAssetDetail.name} (SN: ${item.sn || '-'})`, maxRepair: 1, brokenIndex: item.originalIndex }); setRepairQuantity(1); setRepairRemarks(''); }} className="text-[10px] font-semibold bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded">เข้าคลัง</button>
                            )}
                            <svg className={`h-4 w-4 text-slate-400 transition-transform ${expandedItem === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                        
                        {expandedItem === index && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in fade-in">
                            {editingItemId === item.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  <input type="text" value={tempSNValue} onChange={(e) => setTempSNValue(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] font-mono w-full" placeholder="Serial Number" />
                                  <input type="text" value={tempModelValue} onChange={(e) => setTempModelValue(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] w-full" placeholder="รุ่น / โมเดล" />
                                  <input type="number" value={tempCostValue} onChange={(e) => setTempCostValue(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] w-full" placeholder="ราคา (บาท)" />
                                  <input type="date" value={tempPurchaseDateValue} onChange={(e) => setTempPurchaseDateValue(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] text-slate-600 w-full" title="วันที่ซื้อ" />
                                  <input type="date" value={tempWarrantyDateValue} onChange={(e) => setTempWarrantyDateValue(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] text-slate-600 w-full" title="วันหมดประกัน" />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                  <button onClick={() => setEditingItemId(null)} className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100">ยกเลิก</button>
                                  <button onClick={() => handleSaveItemDetails(item)} disabled={isSavingItem} className="px-3 py-1.5 text-xs text-white bg-[#1E487A] rounded-md hover:bg-[#133257] disabled:opacity-50">บันทึก</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                                <div className="grid grid-cols-2 md:flex gap-x-6 gap-y-2 text-xs">
                                  <div><span className="text-slate-400 block text-[10px]">รุ่น/โมเดล</span><span className="font-medium text-slate-800">{item.model || '-'}</span></div>
                                  <div><span className="text-slate-400 block text-[10px]">ราคา/ชิ้น</span><span className="font-medium text-slate-800">{item.itemCost ? `฿${Number(item.itemCost).toLocaleString()}` : '-'}</span></div>
                                  <div><span className="text-slate-400 block text-[10px]">วันที่ซื้อ</span><span className="font-medium text-slate-800">{item.purchaseDate || '-'}</span></div>
                                  <div><span className="text-slate-400 block text-[10px]">วันหมดประกัน</span><span className="font-medium text-slate-800">{item.warrantyDate || '-'}</span></div>
                                </div>
                                <button onClick={() => { setEditingItemId(item.id); setTempSNValue(item.sn); setTempModelValue(item.model); setTempCostValue(item.itemCost); setTempPurchaseDateValue(item.purchaseDate); setTempWarrantyDateValue(item.warrantyDate); }} className="text-[10px] text-[#1E487A] bg-white border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 font-medium whitespace-nowrap">
                                  แก้ไขข้อมูล
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {individualItems.length === 0 && <div className="p-4 text-center text-xs text-slate-400 bg-slate-50">ไม่มีข้อมูลชิ้นย่อย</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🟢 TAB 2: ประวัติการจัดซื้อ (อิสระจากการใช้งานหลัก) */}
          {activeTab === 'history' && selectedAssetCategory === 'assets' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {!isAddingHistory && !editingHistoryId ? (
                <>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <h4 className="font-bold text-slate-800 text-lg">รายการจัดซื้อทั้งหมด ({purchaseHistory.length} ครั้ง)</h4>
                    <button 
                      onClick={() => {
                         setIsAddingHistory(true);
                         setHistoryForm({ purchaseDate: '', cost: '', vendor: '', model: currentAssetDetail.model || '', note: '', documents: [] });
                      }} 
                      className="text-sm bg-[#1E487A] text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-[#133257] transition-colors flex items-center gap-2"
                    >
                      + เพิ่มประวัติจัดซื้อ
                    </button>
                  </div>
                  
                  {purchaseHistory.length === 0 ? (
                    <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                       <span className="text-4xl mb-3 block opacity-40">📝</span>
                       <p className="font-bold text-slate-500">ยังไม่มีประวัติการจัดซื้อที่บันทึกไว้</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {purchaseHistory.map((hist, index) => (
                        <div key={hist.id} className={`bg-white border rounded-xl px-4 py-3 transition-all ${index === 0 ? 'border-[#1E487A]/40 ring-1 ring-[#1E487A]/10' : 'border-slate-200 hover:border-slate-300'}`}>
                          <div className="flex items-center justify-between gap-3">
                            {/* Left: date + badge */}
                            <div className="flex items-center gap-2 min-w-0">
                              {index === 0 && (
                                <span className="bg-blue-50 text-[#1E487A] px-2 py-0.5 rounded text-[9px] font-black tracking-widest border border-blue-100 shrink-0">ล่าสุด</span>
                              )}
                              <span className="text-xs text-slate-400 font-medium shrink-0">
                                {hist.purchaseDate ? new Date(hist.purchaseDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'ไม่ระบุวันที่'}
                              </span>
                            </div>
                            {/* Center: price */}
                            <div className="text-base font-black text-[#1E487A] shrink-0">
                              {hist.cost ? `฿${Number(hist.cost).toLocaleString()}` : '-'}
                            </div>
                            {/* Right: vendor + model */}
                            <div className="flex-1 min-w-0 hidden sm:block">
                              <p className="text-xs text-slate-600 truncate"><span className="text-slate-400">Vendor:</span> {hist.vendor || '-'}</p>
                              <p className="text-xs text-slate-600 truncate"><span className="text-slate-400">Model:</span> {hist.model || '-'}</p>
                            </div>
                            {/* Actions */}
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => { setEditingHistoryId(hist.id); setHistoryForm(hist); }} className="p-1.5 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-lg transition-all">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => handleDeleteHistory(hist.id)} className="p-1.5 bg-red-50 border border-red-100 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                          {(hist.note || (hist.documents && hist.documents.length > 0)) && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-2 items-start">
                              {hist.note && <p className="text-xs text-slate-500 flex-1">{hist.note}</p>}
                              {hist.documents?.map((docItem, idx) => (
                                <a key={idx} href={docItem.data} download={docItem.name} className="flex items-center gap-1 text-xs bg-slate-50 text-slate-500 border border-slate-200 py-1 px-2 rounded hover:bg-blue-50 hover:text-[#1E487A] transition-colors max-w-[160px] truncate">
                                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                  <span className="truncate">{docItem.name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm relative">
                  <h4 className="font-bold text-[#1E487A] text-lg mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
                    {editingHistoryId ? '✏️ แก้ไขประวัติการจัดซื้อ' : '➕ เพิ่มประวัติการจัดซื้อใหม่'}
                  </h4>
                  
                  <form onSubmit={handleSaveHistory} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">วันที่จัดซื้อ</label>
                        <input type="date" value={historyForm.purchaseDate} onChange={(e) => setHistoryForm({...historyForm, purchaseDate: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">ราคา (บาท)</label>
                        <input type="number" step="any" value={historyForm.cost} onChange={(e) => setHistoryForm({...historyForm, cost: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="ยอดรวมหรือต่อชิ้น" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">ผู้จัดจำหน่าย (Vendor)</label>
                        <input type="text" value={historyForm.vendor} onChange={(e) => setHistoryForm({...historyForm, vendor: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="ชื่อร้าน/บริษัท" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">ยี่ห้อ/รุ่น (Model)</label>
                        <input type="text" value={historyForm.model} onChange={(e) => setHistoryForm({...historyForm, model: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">รายละเอียด / หมายเหตุ</label>
                        <textarea value={historyForm.note} onChange={(e) => setHistoryForm({...historyForm, note: e.target.value})} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm resize-none" rows="2" placeholder="เช่น จัดซื้อทดแทนเครื่องเดิม..."></textarea>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <label className="block text-sm font-bold text-slate-700 mb-3">เอกสารแนบการจัดซื้อ</label>
                      
                      {historyForm.documents && historyForm.documents.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          {historyForm.documents.map((docItem, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-lg shadow-sm">
                              <span className="text-xs font-medium text-slate-600 truncate max-w-[180px]">{docItem.name}</span>
                              <button type="button" onClick={() => handleRemoveHistoryDoc(idx)} className="text-slate-400 hover:text-red-500 bg-white border border-slate-200 w-6 h-6 rounded flex items-center justify-center shadow-sm">
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className={`cursor-pointer inline-flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-lg border transition-colors shadow-sm ${isSavingItem ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-[#1E487A] border-blue-200 hover:bg-blue-50'}`}>
                        {isSavingItem ? 'กำลังอัปโหลด...' : '+ แนบไฟล์เพิ่ม'}
                        <input type="file" multiple accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={handleHistoryDocUpload} disabled={isSavingItem} className="hidden" />
                      </label>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-slate-100 mt-4">
                       <button type="button" onClick={() => { setIsAddingHistory(false); setEditingHistoryId(null); }} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all shadow-sm">ยกเลิก</button>
                       <button type="submit" disabled={isSavingItem} className="flex-1 py-3 bg-[#1E487A] text-white rounded-xl hover:bg-[#133257] font-bold transition-all shadow-lg shadow-[#1E487A]/30 disabled:opacity-50">บันทึกประวัติ</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: เอกสารแนบ (เนื้อหาเรื่องอัปโหลดเอกสารทั้งหมดอยู่ที่นี่) */}
          {activeTab === 'docs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-[#1E487A] mb-4 border-b border-slate-100 pb-2">จัดการเอกสารแนบอุปกรณ์</h4>
                
                <div className="flex flex-col gap-4">
                  {(() => {
                    let docs = currentAssetDetail.documents || [];
                    if (currentAssetDetail.document && docs.length === 0) docs = Array.isArray(currentAssetDetail.document) ? [...currentAssetDetail.document] : [currentAssetDetail.document];
                    docs = docs.flat();
                    
                    return docs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {docs.map((docItem, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl overflow-hidden shadow-sm">
                            <a href={docItem.data} download={docItem.name} className="flex items-center gap-3 text-sm text-[#1E487A] font-medium hover:underline truncate mr-4">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              </div>
                              <span className="truncate">{docItem.name}</span>
                            </a>
                            <button onClick={() => handleRemoveDocument(idx)} disabled={isSavingItem} className="text-slate-400 hover:text-red-500 bg-white border border-slate-200 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors shrink-0" title="ลบเอกสารนี้">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                        <p className="text-sm font-bold text-slate-500 mb-1">ยังไม่มีเอกสารแนบอุปกรณ์นี้</p>
                        <p className="text-xs text-slate-400">คุณสามารถอัปโหลดใบเสนอราคา, ใบเสร็จ หรือรูปภาพเพิ่มเติมได้ที่นี่</p>
                      </div>
                    );
                  })()}

                  <div className="mt-2 flex justify-center">
                    <label className={`cursor-pointer inline-flex items-center gap-2 text-sm font-bold py-2.5 px-5 rounded-xl border transition-colors shadow-sm ${isSavingItem ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-[#1E487A] border-blue-200 hover:bg-blue-50'}`}>
                      {isSavingItem ? (
                        <><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> กำลังอัปโหลด...</>
                      ) : (
                        <>+ อัปโหลดไฟล์เพิ่ม</>
                      )}
                      <input type="file" multiple accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={handleDocumentUpload} disabled={isSavingItem} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
        
        {/* 🟢 Footer แถบปุ่มด้านล่าง (ใช้งานได้เหมือนเดิม 100%) */}
        <div className="px-6 py-4 bg-white flex flex-wrap justify-end gap-3 border-t border-slate-200 shrink-0 rounded-b-2xl">
           {selectedAssetCategory !== 'accessories' && (
             (!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
               <button onClick={() => { setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory }); closeAll(); }} className="w-full sm:w-auto px-5 py-2.5 bg-[#1E487A] text-white rounded-xl hover:bg-[#133257] text-sm font-bold transition-colors sm:mr-auto shadow-md">เบิกจ่าย</button>
             ) : currentAssetDetail.status === 'ถูกใช้งาน' ? (
               <button onClick={() => { handleCheckin(currentAssetDetail.id, selectedAssetCategory); closeAll(); }} className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-sm font-bold transition-colors sm:mr-auto shadow-md">รับคืน</button>
             ) : null
           )}

           {selectedAssetCategory === 'assets' && (
             <button onClick={() => setShowLabelPreview(true)} className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 text-sm font-bold transition-colors shadow-sm">
               พิมพ์ป้าย (Label)
             </button>
           )}

           <button onClick={() => { if (selectedAssetCategory === 'licenses') { openEditLicenseModal(currentAssetDetail); } else { openEditAssetModal(currentAssetDetail, selectedAssetCategory); } closeAll(); }} className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 text-sm font-bold transition-colors shadow-sm">แก้ไขข้อมูล</button>
           <button onClick={closeAll} className="w-full sm:w-auto px-8 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 text-sm font-bold transition-colors shadow-md">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}