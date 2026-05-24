import React, { useState } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import OwnershipHistory from './OwnershipHistory.jsx';

export default function AssetDetailsModal({
  selectedAssetDetail, setSelectedAssetDetail, selectedAssetCategory, setSelectedAssetCategory,
  accessories, assets, licenses, setCheckoutModal, setReturnModal, handleCheckin, openEditLicenseModal, openEditAssetModal,
  setRepairModal, setRepairQuantity, setRepairRemarks, showConfirm, setCustomAlert,
  transactions = [],
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

  // License seat states
  const [selectedLicenseSeatsForDelete, setSelectedLicenseSeatsForDelete] = useState([]);
  const [isAddingNewLicenseSeat, setIsAddingNewLicenseSeat] = useState(false);
  const [newSeatCount, setNewSeatCount] = useState(1);
  const [newSeatProductKey, setNewSeatProductKey] = useState('');
  const [newSeatKeyCode, setNewSeatKeyCode] = useState('');
  const [newSeatSupplier, setNewSeatSupplier] = useState('');
  const [newSeatCost, setNewSeatCost] = useState('');
  const [newSeatPurchaseDate, setNewSeatPurchaseDate] = useState('');
  const [newSeatExpirationDate, setNewSeatExpirationDate] = useState('');
  const [newSeatDocs, setNewSeatDocs] = useState([]);
  const [isImportingLicenseCSV, setIsImportingLicenseCSV] = useState(false);
  const [editingLicenseSeatId, setEditingLicenseSeatId] = useState(null);
  const [tempLicenseSupplier, setTempLicenseSupplier] = useState('');
  const [tempLicensePurchaseDate, setTempLicensePurchaseDate] = useState('');
  const [tempLicenseExpirationDate, setTempLicenseExpirationDate] = useState('');
  const [tempLicenseProductKey, setTempLicenseProductKey] = useState('');
  const [tempLicenseKeyCode, setTempLicenseKeyCode] = useState('');
  const [tempLicenseSeatCost, setTempLicenseSeatCost] = useState('');
  const [tempLicenseSeatDocs, setTempLicenseSeatDocs] = useState([]);

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

      // Always write to availableItems (new format) — migrates existing data as needed
      const existingItems = Array.isArray(currentAssetDetail.availableItems)
        ? [...currentAssetDetail.availableItems]
        : (() => {
            const availCount = Math.max(0, currentQty - (currentAssetDetail.assignees?.length || 0) - Number(currentAssetDetail.brokenQuantity || 0));
            return Array.from({length: availCount}, (_, i) => ({
              sn: currentAssetDetail.availableSNs?.[i] || '',
              model: currentAssetDetail.availableModels?.[i] || '',
              cost: currentAssetDetail.availableCosts?.[i] || '',
              purchaseDate: currentAssetDetail.availablePurchaseDates?.[i] || '',
              warrantyDate: currentAssetDetail.availableWarrantyDates?.[i] || '',
            }));
          })();

      for (let i = 0; i < addQty; i++) {
        existingItems.push({
          sn: newItemData.sn.trim(),
          model: newItemData.model.trim(),
          cost: newItemData.cost.trim(),
          purchaseDate: newItemData.purchaseDate,
          warrantyDate: newItemData.warrantyDate,
        });
      }

      await updateDoc(docRef, {
        quantity: currentQty + addQty,
        availableItems: existingItems,
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
        const idx = item.originalIndex;
        if (Array.isArray(currentAssetDetail.availableItems)) {
          const newItems = [...currentAssetDetail.availableItems];
          if (newItems[idx]) {
            newItems[idx] = { ...newItems[idx], sn: tempSNValue.trim(), model: tempModelValue.trim(), cost: tempCostValue.trim(), purchaseDate: tempPurchaseDateValue, warrantyDate: tempWarrantyDateValue };
          }
          await updateDoc(docRef, { availableItems: newItems });
        } else {
          // old parallel array format
          const newSNs = [...(currentAssetDetail.availableSNs||[])]; while (newSNs.length <= idx) newSNs.push(''); newSNs[idx] = tempSNValue.trim();
          const newModels = [...(currentAssetDetail.availableModels||[])]; while (newModels.length <= idx) newModels.push(''); newModels[idx] = tempModelValue.trim();
          const newCosts = [...(currentAssetDetail.availableCosts||[])]; while (newCosts.length <= idx) newCosts.push(''); newCosts[idx] = tempCostValue.trim();
          const newPurchaseDates = [...(currentAssetDetail.availablePurchaseDates||[])]; while (newPurchaseDates.length <= idx) newPurchaseDates.push(''); newPurchaseDates[idx] = tempPurchaseDateValue;
          const newWarrantyDates = [...(currentAssetDetail.availableWarrantyDates||[])]; while (newWarrantyDates.length <= idx) newWarrantyDates.push(''); newWarrantyDates[idx] = tempWarrantyDateValue;
          await updateDoc(docRef, { availableSNs: newSNs, availableModels: newModels, availableCosts: newCosts, availablePurchaseDates: newPurchaseDates, availableWarrantyDates: newWarrantyDates });
        }
      }
      else if (item.type === 'assigned') {
        const newAssignees = [...(currentAssetDetail.assignees || [])];
        const idx = newAssignees.findIndex(a => a.checkoutId === item.assignee.checkoutId);
        if (idx !== -1) {
          newAssignees[idx].serialNumber = tempSNValue.trim();
          newAssignees[idx].model = tempModelValue.trim();
          newAssignees[idx].itemCost = tempCostValue.trim();
          newAssignees[idx].purchaseDate = tempPurchaseDateValue;
          newAssignees[idx].warrantyDate = tempWarrantyDateValue;
          await updateDoc(docRef, { assignees: newAssignees });
        }
      }
      else if (item.type === 'broken') {
        const idx = item.originalIndex;
        if (Array.isArray(currentAssetDetail.brokenItems)) {
          const newItems = [...currentAssetDetail.brokenItems];
          if (newItems[idx]) {
            newItems[idx] = { ...newItems[idx], sn: tempSNValue.trim(), model: tempModelValue.trim(), cost: tempCostValue.trim(), purchaseDate: tempPurchaseDateValue, warrantyDate: tempWarrantyDateValue };
          }
          await updateDoc(docRef, { brokenItems: newItems });
        } else {
          const newSNs = [...(currentAssetDetail.brokenSNs||[])]; while (newSNs.length <= idx) newSNs.push(''); newSNs[idx] = tempSNValue.trim();
          const newModels = [...(currentAssetDetail.brokenModels||[])]; while (newModels.length <= idx) newModels.push(''); newModels[idx] = tempModelValue.trim();
          const newCosts = [...(currentAssetDetail.brokenCosts||[])]; while (newCosts.length <= idx) newCosts.push(''); newCosts[idx] = tempCostValue.trim();
          const newPurchaseDates = [...(currentAssetDetail.brokenPurchaseDates||[])]; while (newPurchaseDates.length <= idx) newPurchaseDates.push(''); newPurchaseDates[idx] = tempPurchaseDateValue;
          const newWarrantyDates = [...(currentAssetDetail.brokenWarrantyDates||[])]; while (newWarrantyDates.length <= idx) newWarrantyDates.push(''); newWarrantyDates[idx] = tempWarrantyDateValue;
          await updateDoc(docRef, { brokenSNs: newSNs, brokenModels: newModels, brokenCosts: newCosts, brokenPurchaseDates: newPurchaseDates, brokenWarrantyDates: newWarrantyDates });
        }
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

    // Available items — prefer new format, fall back to parallel arrays
    if (Array.isArray(currentAssetDetail.availableItems)) {
      currentAssetDetail.availableItems.forEach((it, i) => {
        individualItems.push({
          type: 'available', status: 'พร้อมใช้งาน',
          sn: it.sn || '', model: it.model || '',
          itemCost: it.cost || '',
          purchaseDate: it.purchaseDate || '', warrantyDate: it.warrantyDate || '',
          id: `avail-${i}`, originalIndex: i,
        });
      });
    } else {
      const availableCount = Math.max(0, totalQty - assigneesCount - brokenCount);
      for (let i = 0; i < availableCount; i++) {
        individualItems.push({
          type: 'available', status: 'พร้อมใช้งาน',
          sn: currentAssetDetail.availableSNs?.[i] || '',
          model: currentAssetDetail.availableModels?.[i] || '',
          itemCost: currentAssetDetail.availableCosts?.[i] || '',
          purchaseDate: currentAssetDetail.availablePurchaseDates?.[i] || '',
          warrantyDate: currentAssetDetail.availableWarrantyDates?.[i] || '',
          id: `avail-${i}`, originalIndex: i,
        });
      }
    }

    // Assigned items
    if (currentAssetDetail.assignees) {
      currentAssetDetail.assignees.forEach((a, i) => {
        individualItems.push({
          type: 'assigned', status: 'ถูกใช้งาน',
          assignee: a, sn: a.serialNumber || '',
          model: a.model || '',
          itemCost: a.itemCost || a.customCost || '',
          purchaseDate: a.purchaseDate || '',
          warrantyDate: a.warrantyDate || '',
          id: `assign-${a.checkoutId || i}`, originalIndex: i,
        });
      });
    }

    // Broken items — prefer new format, fall back to parallel arrays
    if (Array.isArray(currentAssetDetail.brokenItems)) {
      currentAssetDetail.brokenItems.forEach((it, i) => {
        individualItems.push({
          type: 'broken', status: 'ชำรุดเสียหาย',
          sn: it.sn || '', model: it.model || '',
          itemCost: it.cost || '',
          purchaseDate: it.purchaseDate || '', warrantyDate: it.warrantyDate || '',
          id: `broken-${i}`, originalIndex: i,
        });
      });
    } else {
      for (let i = 0; i < brokenCount; i++) {
        individualItems.push({
          type: 'broken', status: 'ชำรุดเสียหาย',
          sn: currentAssetDetail.brokenSNs?.[i] || '',
          model: currentAssetDetail.brokenModels?.[i] || '',
          itemCost: currentAssetDetail.brokenCosts?.[i] || '',
          purchaseDate: currentAssetDetail.brokenPurchaseDates?.[i] || '',
          warrantyDate: currentAssetDetail.brokenWarrantyDates?.[i] || '',
          id: `broken-${i}`, originalIndex: i,
        });
      }
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

  let licenseSeats = [];
  if (selectedAssetCategory === 'licenses') {
    const totalQty = Number(currentAssetDetail.quantity || 0);
    const assignees = currentAssetDetail.assignees || [];
    const availableCount = Math.max(0, totalQty - assignees.length);
    for (let i = 0; i < availableCount; i++) {
      licenseSeats.push({
        type: 'available', id: `avail-${i}`, index: i,
        productKey: currentAssetDetail.availableKeys?.[i] || '',
        keyCode: currentAssetDetail.availableKeyCodes?.[i] || '',
        seatCost: currentAssetDetail.availableSeatCosts?.[i] || '',
        documents: currentAssetDetail.availableSeatDocs?.[String(i)] || [],
      });
    }
    assignees.forEach((a, i) => {
      licenseSeats.push({
        type: 'assigned', id: `assign-${a.checkoutId || i}`, assignee: a,
        productKey: a.productKey || '',
        keyCode: a.keyCode || '',
        seatCost: a.seatCost || '',
        documents: a.seatDocuments || [],
      });
    });
  }

  const totalLicenseCost = licenseSeats.reduce((sum, s) => sum + (Number(s.seatCost) || 0), 0);

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
          const newAssignees = (currentAssetDetail.assignees || []).filter(a => !assignIdsToDelete.includes(a.checkoutId));
          const totalDeleted = selectedItemsForDelete.length;
          const newQuantity = Math.max(0, (Number(currentAssetDetail.quantity) || 0) - totalDeleted);
          const newBrokenQuantity = Math.max(0, (Number(currentAssetDetail.brokenQuantity) || 0) - brokenIndicesToDelete.length);

          const updatePayload = { quantity: newQuantity, brokenQuantity: newBrokenQuantity, assignees: newAssignees };

          // Available items: prefer new format, fall back to parallel arrays
          if (Array.isArray(currentAssetDetail.availableItems)) {
            updatePayload.availableItems = currentAssetDetail.availableItems.filter((_, i) => !availIndicesToDelete.includes(i));
          } else {
            updatePayload.availableSNs = (currentAssetDetail.availableSNs || []).filter((_, idx) => !availIndicesToDelete.includes(idx));
            updatePayload.availableModels = (currentAssetDetail.availableModels || []).filter((_, idx) => !availIndicesToDelete.includes(idx));
            updatePayload.availableCosts = (currentAssetDetail.availableCosts || []).filter((_, idx) => !availIndicesToDelete.includes(idx));
            updatePayload.availablePurchaseDates = (currentAssetDetail.availablePurchaseDates || []).filter((_, idx) => !availIndicesToDelete.includes(idx));
            updatePayload.availableWarrantyDates = (currentAssetDetail.availableWarrantyDates || []).filter((_, idx) => !availIndicesToDelete.includes(idx));
          }

          // Broken items: prefer new format, fall back to parallel arrays
          if (Array.isArray(currentAssetDetail.brokenItems)) {
            updatePayload.brokenItems = currentAssetDetail.brokenItems.filter((_, i) => !brokenIndicesToDelete.includes(i));
          } else {
            updatePayload.brokenSNs = (currentAssetDetail.brokenSNs || []).filter((_, idx) => !brokenIndicesToDelete.includes(idx));
            updatePayload.brokenModels = (currentAssetDetail.brokenModels || []).filter((_, idx) => !brokenIndicesToDelete.includes(idx));
            updatePayload.brokenCosts = (currentAssetDetail.brokenCosts || []).filter((_, idx) => !brokenIndicesToDelete.includes(idx));
            updatePayload.brokenPurchaseDates = (currentAssetDetail.brokenPurchaseDates || []).filter((_, idx) => !brokenIndicesToDelete.includes(idx));
            updatePayload.brokenWarrantyDates = (currentAssetDetail.brokenWarrantyDates || []).filter((_, idx) => !brokenIndicesToDelete.includes(idx));
          }

          await updateDoc(docRef, updatePayload);
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
            // Always write to availableItems (new format) — migrates existing data as needed
            const existingItems = Array.isArray(currentAssetDetail.availableItems)
              ? [...currentAssetDetail.availableItems]
              : (() => {
                  const availCount = Math.max(0, currentQty - (currentAssetDetail.assignees?.length || 0) - Number(currentAssetDetail.brokenQuantity || 0));
                  return Array.from({length: availCount}, (_, i) => ({
                    sn: currentAssetDetail.availableSNs?.[i] || '',
                    model: currentAssetDetail.availableModels?.[i] || '',
                    cost: currentAssetDetail.availableCosts?.[i] || '',
                    purchaseDate: currentAssetDetail.availablePurchaseDates?.[i] || '',
                    warrantyDate: currentAssetDetail.availableWarrantyDates?.[i] || '',
                  }));
                })();
            for (let i = 0; i < dataRows.length; i++) {
              existingItems.push({ sn: newSNs[i] || '', model: newModels[i] || '', cost: newCosts[i] || '', purchaseDate: newPurchaseDates[i] || '', warrantyDate: newWarrantyDates[i] || '' });
            }
            await updateDoc(docRef, {
              quantity: currentQty + dataRows.length,
              availableItems: existingItems,
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

  const handleAddLicenseSeats = async () => {
    if (isSavingItem) return;
    setIsSavingItem(true);
    try {
      const count = Number(newSeatCount) || 1;
      const existingAvailCount = Math.max(0, (Number(currentAssetDetail.quantity) || 0) - (currentAssetDetail.assignees?.length || 0));
      const newKeys = [...(currentAssetDetail.availableKeys || [])];
      const newKeyCodes = [...(currentAssetDetail.availableKeyCodes || [])];
      const newCosts = [...(currentAssetDetail.availableSeatCosts || [])];
      const newDocMap = { ...(currentAssetDetail.availableSeatDocs || {}) };
      for (let i = 0; i < count; i++) {
        newKeys.push(newSeatProductKey.trim());
        newKeyCodes.push(newSeatKeyCode.trim());
        newCosts.push(newSeatCost.trim());
        if (newSeatDocs.length > 0) newDocMap[String(existingAvailCount + i)] = newSeatDocs;
      }
      const updateData = {
        quantity: (Number(currentAssetDetail.quantity) || 0) + count,
        availableKeys: newKeys,
        availableKeyCodes: newKeyCodes,
        availableSeatCosts: newCosts,
        availableSeatDocs: newDocMap,
      };
      if (newSeatSupplier.trim()) updateData.supplier = newSeatSupplier.trim();
      if (newSeatPurchaseDate) updateData.purchaseDate = newSeatPurchaseDate;
      if (newSeatExpirationDate) updateData.expirationDate = newSeatExpirationDate;
      await updateDoc(doc(db, 'licenses', currentAssetDetail.id), updateData);
      setIsAddingNewLicenseSeat(false);
      setNewSeatCount(1);
      setNewSeatProductKey(''); setNewSeatKeyCode(''); setNewSeatSupplier('');
      setNewSeatCost(''); setNewSeatPurchaseDate(''); setNewSeatExpirationDate('');
      setNewSeatDocs([]);
    } catch (error) { console.error(error); }
    finally { setIsSavingItem(false); }
  };

  const handleNewSeatDocUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      if (setCustomAlert) setCustomAlert({ isOpen: true, title: 'ไฟล์ใหญ่เกินไป', message: 'แต่ละไฟล์ต้องไม่เกิน 5MB', type: 'error' });
      e.target.value = null; return;
    }
    setIsSavingItem(true);
    try {
      const newDocs = await Promise.all(files.map(file => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onloadend = () => res({ name: file.name, data: reader.result });
        reader.onerror = rej;
        reader.readAsDataURL(file);
      })));
      setNewSeatDocs(prev => [...prev, ...newDocs]);
    } catch (err) { console.error(err); }
    finally { setIsSavingItem(false); e.target.value = null; }
  };

  const handleSelectLicenseSeat = (seatId) => {
    setSelectedLicenseSeatsForDelete(prev =>
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    );
  };

  const handleSelectAllLicenseSeats = () => {
    if (selectedLicenseSeatsForDelete.length === licenseSeats.length) {
      setSelectedLicenseSeatsForDelete([]);
    } else {
      setSelectedLicenseSeatsForDelete(licenseSeats.map(s => s.id));
    }
  };

  const handleDeleteSelectedLicenseSeats = () => {
    showConfirm('ยืนยันการลบ', `ต้องการลบสิทธิ์ที่เลือก ${selectedLicenseSeatsForDelete.length} รายการ?`, async () => {
      if (isSavingItem) return;
      setIsSavingItem(true);
      try {
        const availIndices = selectedLicenseSeatsForDelete.filter(id => id.startsWith('avail-')).map(id => parseInt(id.replace('avail-', '')));
        const assigneeIdsToDelete = selectedLicenseSeatsForDelete.filter(id => id.startsWith('assign-')).map(id => id.replace('assign-', ''));
        const newAssignees = (currentAssetDetail.assignees || []).filter(a => !assigneeIdsToDelete.includes(a.checkoutId));
        const totalDeleted = availIndices.length + assigneeIdsToDelete.length;
        const newQty = Math.max(0, (Number(currentAssetDetail.quantity) || 0) - totalDeleted);
        const newStatus = newAssignees.length >= newQty ? 'ถูกใช้งาน' : 'พร้อมใช้งาน';
        await updateDoc(doc(db, 'licenses', currentAssetDetail.id), {
          quantity: newQty, assignees: newAssignees, status: newStatus,
          assignedTo: newAssignees.length > 0 ? newAssignees.map(a => a.empId).join(',') : null,
          assignedName: newAssignees.length > 0 ? newAssignees.map(a => a.empName).join(', ') : null,
          availableKeys: (currentAssetDetail.availableKeys || []).filter((_, i) => !availIndices.includes(i)),
          availableKeyCodes: (currentAssetDetail.availableKeyCodes || []).filter((_, i) => !availIndices.includes(i)),
          availableSeatCosts: (currentAssetDetail.availableSeatCosts || []).filter((_, i) => !availIndices.includes(i)),
          availableSeatDocs: (() => {
            const oldDocMap = currentAssetDetail.availableSeatDocs || {};
            const totalAvail = Math.max(0, (Number(currentAssetDetail.quantity) || 0) - (currentAssetDetail.assignees?.length || 0));
            const newDocMap = {};
            let newIdx = 0;
            for (let i = 0; i < totalAvail; i++) {
              if (!availIndices.includes(i)) {
                if (oldDocMap[String(i)]) newDocMap[String(newIdx)] = oldDocMap[String(i)];
                newIdx++;
              }
            }
            return newDocMap;
          })(),
        });
        setSelectedLicenseSeatsForDelete([]);
        setExpandedItem(null);
      } catch (error) {
        if (setCustomAlert) setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' });
      } finally { setIsSavingItem(false); }
    }, { confirmText: 'ลบ', icon: 'trash' });
  };

  const handleSaveLicenseSeatEdit = async (seat) => {
    if (isSavingItem) return;
    setIsSavingItem(true);
    try {
      const docRef = doc(db, 'licenses', currentAssetDetail.id);
      const updateData = { supplier: tempLicenseSupplier, purchaseDate: tempLicensePurchaseDate, expirationDate: tempLicenseExpirationDate };

      if (seat.type === 'available') {
        const idx = seat.index;
        const pad = (arr, val) => { const a = [...(arr || [])]; while (a.length <= idx) a.push(val); return a; };
        const newKeys = pad(currentAssetDetail.availableKeys, ''); newKeys[idx] = tempLicenseProductKey;
        const newKeyCodes = pad(currentAssetDetail.availableKeyCodes, ''); newKeyCodes[idx] = tempLicenseKeyCode;
        const newCosts = pad(currentAssetDetail.availableSeatCosts, ''); newCosts[idx] = tempLicenseSeatCost;
        const newDocMap = { ...(currentAssetDetail.availableSeatDocs || {}) };
        if (tempLicenseSeatDocs.length > 0) newDocMap[String(idx)] = tempLicenseSeatDocs;
        else delete newDocMap[String(idx)];
        Object.assign(updateData, { availableKeys: newKeys, availableKeyCodes: newKeyCodes, availableSeatCosts: newCosts, availableSeatDocs: newDocMap });
      } else if (seat.type === 'assigned') {
        const newAssignees = [...(currentAssetDetail.assignees || [])];
        const idx = newAssignees.findIndex(a => a.checkoutId === seat.assignee.checkoutId);
        if (idx !== -1) {
          newAssignees[idx] = { ...newAssignees[idx], productKey: tempLicenseProductKey, keyCode: tempLicenseKeyCode, seatCost: tempLicenseSeatCost, seatDocuments: tempLicenseSeatDocs };
          updateData.assignees = newAssignees;
        }
      }
      await updateDoc(docRef, updateData);
      setEditingLicenseSeatId(null);
    } catch (error) { console.error(error); }
    finally { setIsSavingItem(false); }
  };

  const handleLicenseSeatDocUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      if (setCustomAlert) setCustomAlert({ isOpen: true, title: 'ไฟล์ใหญ่เกินไป', message: 'แต่ละไฟล์ต้องไม่เกิน 5MB', type: 'error' });
      e.target.value = null; return;
    }
    setIsSavingItem(true);
    try {
      const newDocs = await Promise.all(files.map(file => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onloadend = () => res({ name: file.name, data: reader.result });
        reader.onerror = rej;
        reader.readAsDataURL(file);
      })));
      setTempLicenseSeatDocs(prev => [...prev, ...newDocs]);
    } catch (err) { console.error(err); }
    finally { setIsSavingItem(false); e.target.value = null; }
  };

  const handleDownloadLicenseSeatTemplate = () => {
    const csv = '"จำนวนสิทธิ์ที่เพิ่ม"\n"1"\n';
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'template_license_seats.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadLicenseSeatCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rows = event.target.result.split('\n').filter(r => r.trim() !== '');
      if (rows.length <= 1) {
        if (setCustomAlert) setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: 'ไม่พบข้อมูลในไฟล์', type: 'error' });
        e.target.value = null; return;
      }
      const count = rows.slice(1).reduce((sum, row) => {
        const val = parseInt(row.replace(/[^0-9]/g, ''));
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
      if (count <= 0) {
        if (setCustomAlert) setCustomAlert({ isOpen: true, title: 'ผิดพลาด', message: 'ไม่พบจำนวนสิทธิ์ที่ถูกต้อง', type: 'error' });
        e.target.value = null; return;
      }
      showConfirm('ยืนยันการนำเข้า', `ต้องการเพิ่มสิทธิ์อีก ${count} สิทธิ์?`, async () => {
        setIsSavingItem(true);
        try {
          await updateDoc(doc(db, 'licenses', currentAssetDetail.id), {
            quantity: (Number(currentAssetDetail.quantity) || 0) + count
          });
          setIsImportingLicenseCSV(false);
          if (setCustomAlert) setCustomAlert({ isOpen: true, title: 'นำเข้าสำเร็จ!', message: `เพิ่มสิทธิ์อีก ${count} สิทธิ์เรียบร้อย`, type: 'success' });
        } catch (err) {
          if (setCustomAlert) setCustomAlert({ isOpen: true, title: 'เกิดข้อผิดพลาด', message: err.message, type: 'error' });
        } finally { setIsSavingItem(false); }
      }, { confirmText: 'นำเข้า' });
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
    setSelectedLicenseSeatsForDelete([]);
    setIsAddingNewLicenseSeat(false);
    setIsImportingLicenseCSV(false);
    setEditingLicenseSeatId(null);
    setTempLicenseSeatDocs([]);
    setNewSeatProductKey(''); setNewSeatKeyCode(''); setNewSeatSupplier('');
    setNewSeatCost(''); setNewSeatPurchaseDate(''); setNewSeatExpirationDate('');
    setNewSeatDocs([]);
    setActiveTab('info');
    setIsAddingHistory(false);
    setEditingHistoryId(null);
  };

  if (showLabelPreview) {
    const rawTag = currentAssetDetail.assetTag || currentAssetDetail.sn || currentAssetDetail.name || "0";
    const barcodeDataString = rawTag.replace(/[^a-zA-Z0-9-]/g, "");
    
    const qrDataString = `https://itassetmenagement.vercel.app/?asset=${currentAssetDetail.id}&cat=${encodeURIComponent(selectedAssetCategory || 'assets')}`;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[90] transition-opacity print:bg-transparent print:backdrop-blur-none" style={{ fontFamily: "Arial, sans-serif" }}>
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
            <div id="printable-label-container" className="bg-white border-[3px] border-slate-800 p-1.5 flex flex-col w-[230px] min-h-[110px] text-slate-800 shrink-0 relative box-border overflow-hidden">
              <div className="flex gap-2 mb-1">
                <div className="w-[58px] h-[58px] shrink-0 border border-slate-200 p-0.5 bg-white flex items-center justify-center self-start">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrDataString)}&ecc=L&margin=0`} alt="QR Code" className="w-full h-full object-contain" />
                </div>

                <div className="flex flex-col text-[7px] leading-[1.18] font-bold w-full overflow-hidden justify-start pt-0.5 gap-[1px]">
                  <div className="truncate">C: {currentAssetDetail.company || '-'}</div>
                  <div className="line-clamp-2 break-words">N: {currentAssetDetail.name || '-'}</div>
                  <div className="truncate">T: {currentAssetDetail.assetTag || '-'}</div>
                  <div className="truncate">S: {currentAssetDetail.sn || '-'}</div>
                </div>
              </div>

              <div className="h-[28px] w-full mt-auto flex justify-center overflow-hidden">
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
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-medium text-slate-400 leading-[1.5]">{label}</span>
      <span className={`text-[13px] font-semibold text-slate-800 leading-[1.6] ${isMono ? 'font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 w-fit text-[11.5px]' : ''}`}>
        {value || '-'}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 max-w-5xl w-full flex flex-col h-[90vh] ring-1 ring-slate-200/60 overflow-hidden">

        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: '#1E487A15', color: '#1E487A' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <h3 className="text-[13.5px] font-semibold text-slate-700 leading-[1.5]">
              รายละเอียด{selectedAssetCategory === 'assets' ? 'ทรัพย์สินหลัก' : selectedAssetCategory === 'accessories' ? 'อุปกรณ์เสริม' : 'โปรแกรม / License'}
            </h3>
          </div>
          <button onClick={closeAll} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile band */}
        <div className="px-5 py-3 shrink-0 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          {currentAssetDetail.image ? (
            <div className="w-11 h-11 rounded-xl shrink-0 ring-1 ring-slate-200 bg-white overflow-hidden flex items-center justify-center">
              <img src={currentAssetDetail.image} alt="" className="max-w-full max-h-full object-contain p-0.5" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl shrink-0 ring-1 ring-dashed ring-slate-300 bg-white flex items-center justify-center text-slate-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-[#1E487A] leading-[1.5] truncate mb-1">{currentAssetDetail.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              {currentAssetDetail.type && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
                  {currentAssetDetail.type}
                </span>
              )}
              {selectedAssetCategory === 'assets' && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium ring-1 ring-inset ${(!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : currentAssetDetail.status === 'ถูกใช้งาน' ? 'bg-blue-50 text-[#1E487A] ring-blue-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${(!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? 'bg-emerald-500 animate-pulse' : currentAssetDetail.status === 'ถูกใช้งาน' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                  {currentAssetDetail.status || 'พร้อมใช้งาน'}
                </span>
              )}
              {selectedAssetCategory === 'licenses' && (
                <>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium ring-1 ring-inset ${(currentAssetDetail.assignees?.length || 0) >= (currentAssetDetail.quantity || 1) ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}`}>
                    <span className={`w-2 h-2 rounded-full ${(currentAssetDetail.assignees?.length || 0) >= (currentAssetDetail.quantity || 1) ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                    {(currentAssetDetail.assignees?.length || 0) >= (currentAssetDetail.quantity || 1) ? 'ใช้งานเต็ม' : 'มีสิทธิ์ว่าง'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-[#1E487A] rounded-full text-[12px] font-semibold ring-1 ring-inset ring-blue-200">
                    {currentAssetDetail.assignees?.length || 0} / {currentAssetDetail.quantity || 0} สิทธิ์
                  </span>
                </>
              )}
              {selectedAssetCategory === 'assets' && currentAssetDetail.department && (
                <span className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[12px] font-medium ring-1 ring-inset ring-purple-200">
                  {currentAssetDetail.department}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-slate-100 flex gap-2 shrink-0 bg-white flex-wrap">
          <button
            onClick={() => { setActiveTab('info'); setIsAddingHistory(false); setEditingHistoryId(null); }}
            className={`py-3 px-5 text-[12.5px] font-semibold border-b-2 whitespace-nowrap transition-colors -mb-px ${activeTab === 'info' ? 'border-[#1E487A] text-[#1E487A]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            ข้อมูลทั่วไป
          </button>
          {selectedAssetCategory === 'assets' && (
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-5 text-[12.5px] font-semibold border-b-2 whitespace-nowrap transition-colors -mb-px ${activeTab === 'history' ? 'border-[#1E487A] text-[#1E487A]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              ประวัติจัดซื้อ ({purchaseHistory.length})
            </button>
          )}
          {(selectedAssetCategory === 'assets' || selectedAssetCategory === 'accessories') && (
            <button
              onClick={() => { setActiveTab('ownership'); setIsAddingHistory(false); setEditingHistoryId(null); }}
              className={`py-3 px-5 text-[12.5px] font-semibold border-b-2 whitespace-nowrap transition-colors -mb-px ${activeTab === 'ownership' ? 'border-[#1E487A] text-[#1E487A]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              ประวัติการครอบครอง
            </button>
          )}
          <button
            onClick={() => { setActiveTab('docs'); setIsAddingHistory(false); setEditingHistoryId(null); }}
            className={`py-3 px-5 text-[12.5px] font-semibold border-b-2 whitespace-nowrap transition-colors -mb-px ${activeTab === 'docs' ? 'border-[#1E487A] text-[#1E487A]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            เอกสารแนบ
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-5 bg-slate-50/50">

          {/* TAB: ข้อมูลทั่วไป */}
          {activeTab === 'info' && (
            <div className="space-y-4 animate-in fade-in duration-200">

              {/* Assignee banner */}
              {selectedAssetCategory === 'assets' && currentAssetDetail.assignedName && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1E487A] to-[#2558a0] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white/15 ring-1 ring-white/20 text-white font-bold text-[13px] flex items-center justify-center shrink-0">
                        {currentAssetDetail.assignedName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-blue-200 font-semibold tracking-widest uppercase leading-[1.5]">ผู้ครอบครองปัจจุบัน</p>
                        <p className="text-[14px] font-bold text-white leading-[1.5] truncate">{currentAssetDetail.assignedName}</p>
                        {currentAssetDetail.department && <p className="text-[11px] text-blue-200 leading-[1.5]">{currentAssetDetail.department}</p>}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 rounded-full ring-1 ring-white/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shrink-0" />
                      <span className="text-[11px] font-medium text-white whitespace-nowrap">กำลังถูกใช้งาน</span>
                    </div>
                  </div>
                </div>
              )}

              {/* KPI Cards — assets only */}
              {selectedAssetCategory === 'assets' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl ring-1 ring-slate-200/60 px-4 py-3 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${(!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? 'bg-emerald-50 text-emerald-600' : currentAssetDetail.status === 'ถูกใช้งาน' ? 'bg-blue-50 text-[#1E487A]' : 'bg-amber-50 text-amber-600'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">สถานะ</p>
                      <p className="text-[13px] font-semibold text-slate-800 leading-[1.5]">{currentAssetDetail.status || 'พร้อมใช้งาน'}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl ring-1 ring-slate-200/60 px-4 py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E487A] flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">ราคาจัดซื้อ</p>
                      <p className="text-[13px] font-bold text-[#1E487A] leading-[1.5]">{currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl ring-1 ring-slate-200/60 px-4 py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">อายุใช้งาน</p>
                      <p className="text-[13px] font-semibold text-slate-800 leading-[1.5]">{calculateAge(currentAssetDetail.purchaseDate)}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl ring-1 ring-slate-200/60 px-4 py-3 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${currentAssetDetail.warrantyDate && new Date(currentAssetDetail.warrantyDate) < new Date() ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">หมดประกัน</p>
                      <p className={`text-[13px] font-semibold leading-[1.5] ${currentAssetDetail.warrantyDate && new Date(currentAssetDetail.warrantyDate) < new Date() ? 'text-red-500' : 'text-slate-800'}`}>{currentAssetDetail.warrantyDate || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl ring-1 ring-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-[#1E487A]" />
                  <h4 className="text-[12.5px] font-semibold text-slate-600">ข้อมูลจำเพาะ</h4>
                </div>
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4">
                  {selectedAssetCategory === 'licenses' ? (
                    <>
                      <div className="col-span-2 md:col-span-4"><DetailItem label="Product Key" value={currentAssetDetail.productKey} isMono /></div>
                      <DetailItem label="รหัสอ้างอิง Key" value={currentAssetDetail.keyCode} />
                      <DetailItem label="สิทธิ์ทั้งหมด" value={`${currentAssetDetail.quantity || 0} สิทธิ์`} />
                      <DetailItem label="กำลังใช้งาน" value={`${currentAssetDetail.assignees?.length || 0} สิทธิ์`} />
                      <DetailItem label="คงเหลือ" value={`${Math.max(0, (Number(currentAssetDetail.quantity) || 0) - (currentAssetDetail.assignees?.length || 0))} สิทธิ์`} />
                      <DetailItem label="Supplier ที่ซื้อ" value={currentAssetDetail.supplier} />
                      <DetailItem label="วันที่ซื้อ" value={currentAssetDetail.purchaseDate} />
                      <DetailItem label="วันที่หมดอายุ" value={currentAssetDetail.expirationDate} />
                      <DetailItem label="ราคา (บาท)" value={currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'} />
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
                      <DetailItem label="ผู้จัดจำหน่าย (Vendor)" value={currentAssetDetail.vendor} />
                      <DetailItem label="วันที่ซื้อ" value={currentAssetDetail.purchaseDate} />
                      {currentAssetDetail.note && (
                        <div className="col-span-2 md:col-span-4">
                          <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg p-3">
                            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-amber-700/80 mb-1">หมายเหตุ / รายละเอียดเพิ่มเติม</p>
                            <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">{currentAssetDetail.note}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="col-span-2 md:col-span-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-slate-500 leading-[1.5]">
                      {selectedAssetCategory === 'accessories' ? 'มูลค่ารวม' : selectedAssetCategory === 'licenses' ? 'ราคารวมทั้งหมด' : 'ราคาจัดซื้อ'}
                    </span>
                    <span className="text-[14px] font-bold text-slate-800">
                      {selectedAssetCategory === 'accessories'
                        ? (totalAccessoriesCost > 0 ? `฿${totalAccessoriesCost.toLocaleString()}` : '-')
                        : selectedAssetCategory === 'licenses'
                          ? (totalLicenseCost > 0 ? `฿${totalLicenseCost.toLocaleString()}` : '-')
                          : (currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-')}
                    </span>
                  </div>
                </div>
              </div>

              {/* รายการสิทธิ์ผู้ถือครอง (เฉพาะ licenses) */}
              {selectedAssetCategory === 'licenses' && (
                <div className="bg-white rounded-2xl ring-1 ring-slate-200/60 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-[#1E487A]" />
                      <h4 className="text-[12.5px] font-semibold text-slate-600">รายการผู้ถือสิทธิ์ ({licenseSeats.length})</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {licenseSeats.length > 0 && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer mr-2">
                          <input type="checkbox" checked={selectedLicenseSeatsForDelete.length === licenseSeats.length && licenseSeats.length > 0} onChange={handleSelectAllLicenseSeats} className="w-3.5 h-3.5 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]" />
                          เลือกทั้งหมด
                        </label>
                      )}
                      {selectedLicenseSeatsForDelete.length > 0 && (
                        <button onClick={handleDeleteSelectedLicenseSeats} disabled={isSavingItem} className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md border border-red-200 transition-colors disabled:opacity-50">
                          ลบ ({selectedLicenseSeatsForDelete.length})
                        </button>
                      )}
                      <button onClick={() => { setIsImportingLicenseCSV(!isImportingLicenseCSV); setIsAddingNewLicenseSeat(false); }} className="text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-md transition-colors">
                        นำเข้า CSV
                      </button>
                      <button onClick={() => { setIsAddingNewLicenseSeat(!isAddingNewLicenseSeat); setIsImportingLicenseCSV(false); }} className="text-xs text-white bg-[#1E487A] hover:bg-[#133257] px-3 py-1.5 rounded-md transition-colors">
                        + เพิ่มสิทธิ์
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                  {isImportingLicenseCSV && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 animate-in fade-in">
                      <div className="flex flex-col sm:flex-row gap-4 mb-3">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-700 mb-2">1. ดาวน์โหลด Template</p>
                          <button onClick={handleDownloadLicenseSeatTemplate} className="w-full py-1.5 bg-white border border-slate-300 text-slate-700 text-xs rounded-md hover:bg-slate-50">ดาวน์โหลด .csv</button>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-700 mb-2">2. อัปโหลดข้อมูล</p>
                          <input type="file" accept=".csv" onChange={handleUploadLicenseSeatCSV} className="block w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-200 file:text-slate-700 cursor-pointer" />
                        </div>
                      </div>
                      <div className="text-right"><button onClick={() => setIsImportingLicenseCSV(false)} className="text-xs text-slate-500 hover:text-slate-700">ยกเลิก</button></div>
                    </div>
                  )}

                  {isAddingNewLicenseSeat && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 animate-in fade-in space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <input type="text" value={newSeatProductKey} onChange={e => setNewSeatProductKey(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full font-mono col-span-2" placeholder="Product Key" />
                        <input type="text" value={newSeatKeyCode} onChange={e => setNewSeatKeyCode(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full" placeholder="รหัสอ้างอิง Key" />
                        <input type="text" value={newSeatSupplier} onChange={e => setNewSeatSupplier(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full" placeholder="Supplier ที่ซื้อ" />
                        <input type="number" value={newSeatCost} onChange={e => setNewSeatCost(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full" placeholder="ราคา (บาท)" />
                        <input type="number" min="1" value={newSeatCount} onChange={e => setNewSeatCount(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full" placeholder="จำนวนสิทธิ์" />
                        <input type="date" value={newSeatPurchaseDate} onChange={e => setNewSeatPurchaseDate(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full text-slate-600" title="วันที่ซื้อ" />
                        <input type="date" value={newSeatExpirationDate} onChange={e => setNewSeatExpirationDate(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] outline-none w-full text-slate-600" title="วันหมดอายุ" />
                      </div>
                      {/* ไฟล์แนบ */}
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">ไฟล์แนบ</span>
                          <label className={`cursor-pointer text-[10px] font-semibold py-1 px-2.5 rounded border transition-colors ${isSavingItem ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-[#1E487A] border-blue-200 hover:bg-blue-50'}`}>
                            + แนบไฟล์
                            <input type="file" multiple accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={handleNewSeatDocUpload} disabled={isSavingItem} className="hidden" />
                          </label>
                        </div>
                        {newSeatDocs.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {newSeatDocs.map((d, i) => (
                              <div key={i} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded text-[10px]">
                                <span className="text-slate-600 truncate max-w-[100px]">{d.name}</span>
                                <button type="button" onClick={() => setNewSeatDocs(prev => prev.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-500 ml-1">✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setIsAddingNewLicenseSeat(false); setNewSeatProductKey(''); setNewSeatKeyCode(''); setNewSeatSupplier(''); setNewSeatCost(''); setNewSeatPurchaseDate(''); setNewSeatExpirationDate(''); setNewSeatDocs([]); }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-md">ยกเลิก</button>
                        <button onClick={handleAddLicenseSeats} disabled={isSavingItem} className="px-3 py-1.5 text-xs text-white bg-[#1E487A] hover:bg-[#133257] rounded-md disabled:opacity-50">บันทึก</button>
                      </div>
                    </div>
                  )}

                  <div className="ring-1 ring-slate-200/60 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {licenseSeats.map((seat, index) => (
                      <div key={seat.id} className="bg-white transition-colors hover:bg-slate-50">
                        <div onClick={() => setExpandedItem(expandedItem === `lic-${index}` ? null : `lic-${index}`)} className="p-3 flex items-center justify-between cursor-pointer gap-2">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <input type="checkbox" checked={selectedLicenseSeatsForDelete.includes(seat.id)} onChange={(e) => { e.stopPropagation(); handleSelectLicenseSeat(seat.id); }} onClick={(e) => e.stopPropagation()} className="w-3.5 h-3.5 text-[#1E487A] rounded border-slate-300 shrink-0" />
                            <span className={`w-2 h-2 rounded-full shrink-0 ${seat.type === 'available' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            {seat.type === 'available' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-600">สิทธิ์ว่าง</span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">พร้อมใช้งาน</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1E487A] flex items-center justify-center font-bold text-xs border border-blue-200 shrink-0">
                                  {seat.assignee.empName?.charAt(0) || '?'}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-semibold text-slate-800 truncate">{seat.assignee.empName}</p>
                                  {seat.assignee.checkoutDate && <p className="text-[10px] text-slate-400">เบิกเมื่อ {seat.assignee.checkoutDate}</p>}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {seat.type === 'available' ? (
                              <button onClick={(e) => { e.stopPropagation(); setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: 'licenses' }); }} className="text-[10px] font-semibold bg-white border border-blue-200 text-[#1E487A] hover:bg-blue-50 px-2 py-1 rounded transition-colors">เบิกจ่าย</button>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setReturnModal({ isOpen: true, assetId: currentAssetDetail.id, checkoutId: seat.assignee.checkoutId, empId: seat.assignee.empId, empName: seat.assignee.empName, assetName: currentAssetDetail.name, collectionName: 'licenses' }); }} className="text-[10px] font-semibold bg-white border border-teal-200 text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors">รับคืน</button>
                            )}
                            <svg className={`h-4 w-4 text-slate-400 transition-transform ${expandedItem === `lic-${index}` ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>

                        {expandedItem === `lic-${index}` && (
                          <div className="px-4 pb-4 pt-3 bg-slate-50 border-t border-slate-100 animate-in fade-in">
                            {editingLicenseSeatId === seat.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  <input type="text" value={tempLicenseProductKey} onChange={(e) => setTempLicenseProductKey(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] w-full font-mono col-span-2 md:col-span-2" placeholder="Product Key" />
                                  <input type="text" value={tempLicenseKeyCode} onChange={(e) => setTempLicenseKeyCode(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] w-full" placeholder="รหัสอ้างอิง Key" />
                                  <input type="text" value={tempLicenseSupplier} onChange={(e) => setTempLicenseSupplier(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] w-full" placeholder="Supplier ที่ซื้อ" />
                                  <input type="number" value={tempLicenseSeatCost} onChange={(e) => setTempLicenseSeatCost(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] w-full" placeholder="ราคา (บาท)" />
                                  <input type="date" value={tempLicensePurchaseDate} onChange={(e) => setTempLicensePurchaseDate(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] text-slate-600 w-full" title="วันที่ซื้อ" />
                                  <input type="date" value={tempLicenseExpirationDate} onChange={(e) => setTempLicenseExpirationDate(e.target.value)} className="border border-slate-300 p-2 rounded-md text-xs focus:ring-1 focus:ring-[#1E487A] text-slate-600 w-full" title="วันหมดอายุ" />
                                </div>
                                {/* ไฟล์แนบ */}
                                <div className="pt-2 border-t border-slate-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">ไฟล์แนบ</span>
                                    <label className={`cursor-pointer text-[10px] font-semibold py-1 px-2.5 rounded border transition-colors ${isSavingItem ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-[#1E487A] border-blue-200 hover:bg-blue-50'}`}>
                                      + แนบไฟล์
                                      <input type="file" multiple accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={handleLicenseSeatDocUpload} disabled={isSavingItem} className="hidden" />
                                    </label>
                                  </div>
                                  {tempLicenseSeatDocs.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {tempLicenseSeatDocs.map((d, i) => (
                                        <div key={i} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded text-[10px]">
                                          <span className="text-slate-600 truncate max-w-[100px]">{d.name}</span>
                                          <button type="button" onClick={() => setTempLicenseSeatDocs(prev => prev.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-500 ml-1">✕</button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                  <button onClick={() => setEditingLicenseSeatId(null)} className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100">ยกเลิก</button>
                                  <button onClick={() => handleSaveLicenseSeatEdit(seat)} disabled={isSavingItem} className="px-3 py-1.5 text-xs text-white bg-[#1E487A] rounded-md hover:bg-[#133257] disabled:opacity-50">บันทึก</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                                <div className="space-y-2 text-xs flex-1">
                                  {seat.productKey && (
                                    <div>
                                      <span className="text-slate-400 block text-[10px]">Product Key</span>
                                      <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block text-[11px]">{seat.productKey}</span>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 md:flex gap-x-6 gap-y-2">
                                    {seat.keyCode && <div><span className="text-slate-400 block text-[10px]">รหัสอ้างอิง Key</span><span className="font-medium text-slate-800">{seat.keyCode}</span></div>}
                                    <div><span className="text-slate-400 block text-[10px]">Supplier ที่ซื้อ</span><span className="font-medium text-slate-800">{currentAssetDetail.supplier || '-'}</span></div>
                                    <div><span className="text-slate-400 block text-[10px]">ราคา</span><span className="font-medium text-slate-800">{seat.seatCost ? `฿${Number(seat.seatCost).toLocaleString()}` : '-'}</span></div>
                                    <div><span className="text-slate-400 block text-[10px]">วันที่ซื้อ</span><span className="font-medium text-slate-800">{currentAssetDetail.purchaseDate || '-'}</span></div>
                                    <div><span className="text-slate-400 block text-[10px]">อายุการใช้งาน</span><span className="font-medium text-slate-800">{calculateAge(currentAssetDetail.purchaseDate)}</span></div>
                                    <div><span className="text-slate-400 block text-[10px]">วันหมดอายุ</span><span className="font-medium text-slate-800">{currentAssetDetail.expirationDate || '-'}</span></div>
                                    {seat.type === 'assigned' && seat.assignee.remarks && <div><span className="text-slate-400 block text-[10px]">หมายเหตุ</span><span className="font-medium text-slate-800">{seat.assignee.remarks}</span></div>}
                                  </div>
                                  {seat.documents?.length > 0 && (
                                    <div>
                                      <span className="text-slate-400 block text-[10px] mb-1">ไฟล์แนบ</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {seat.documents.map((d, i) => (
                                          <a key={i} href={d.data} download={d.name} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded text-[10px] text-[#1E487A] hover:bg-blue-50 transition-colors">
                                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            <span className="truncate max-w-[100px]">{d.name}</span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingLicenseSeatId(seat.id);
                                    setTempLicenseProductKey(seat.productKey);
                                    setTempLicenseKeyCode(seat.keyCode);
                                    setTempLicenseSeatCost(seat.seatCost);
                                    setTempLicenseSeatDocs(seat.documents || []);
                                    setTempLicenseSupplier(currentAssetDetail.supplier || '');
                                    setTempLicensePurchaseDate(currentAssetDetail.purchaseDate || '');
                                    setTempLicenseExpirationDate(currentAssetDetail.expirationDate || '');
                                  }}
                                  className="text-[10px] text-[#1E487A] bg-white border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 font-medium whitespace-nowrap self-end"
                                >
                                  แก้ไขข้อมูล
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {licenseSeats.length === 0 && (
                      <div className="py-8 text-center text-[12px] text-slate-400 bg-slate-50 rounded-xl">
                        ไม่มีข้อมูลสิทธิ์ กรุณาตั้งค่าจำนวนสิทธิ์ก่อน
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              )}

              {/* ส่วนจัดการชิ้นย่อย (เฉพาะอุปกรณ์เสริม) */}
              {selectedAssetCategory === 'accessories' && (
                <div className="bg-white rounded-2xl ring-1 ring-slate-200/60 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-[#1E487A]" />
                      <h4 className="text-[12.5px] font-semibold text-slate-600">รายการชิ้นย่อย ({individualItems.length})</h4>
                    </div>
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

                  <div className="p-4">
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
                  
                  <div className="ring-1 ring-slate-200/60 rounded-xl overflow-hidden divide-y divide-slate-100">
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
                              <button onClick={(e) => { e.stopPropagation(); setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory, sn: item.sn, snIndex: item.originalIndex, itemModel: item.model, itemCost: item.itemCost, itemPurchaseDate: item.purchaseDate, itemWarrantyDate: item.warrantyDate }); }} className="text-[10px] font-semibold bg-white border border-blue-200 text-[#1E487A] hover:bg-blue-50 px-2 py-1 rounded">เบิกจ่าย</button>
                            ) : item.type === 'assigned' ? (
                              <button onClick={(e) => { e.stopPropagation(); setReturnModal({ isOpen: true, assetId: currentAssetDetail.id, checkoutId: item.assignee.checkoutId, empId: item.assignee.empId, empName: item.assignee.empName, assetName: currentAssetDetail.name }); }} className="text-[10px] font-semibold bg-white border border-teal-200 text-teal-600 hover:bg-teal-50 px-2 py-1 rounded">รับคืน</button>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setRepairModal({ isOpen: true, assetId: currentAssetDetail.id, assetName: `${currentAssetDetail.name} (SN: ${item.sn || '-'})`, maxRepair: 1, brokenIndex: item.originalIndex, brokenSN: item.sn, brokenModel: item.model, brokenCost: item.itemCost, brokenPurchaseDate: item.purchaseDate, brokenWarrantyDate: item.warrantyDate }); setRepairQuantity(1); setRepairRemarks(''); }} className="text-[10px] font-semibold bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded">เข้าคลัง</button>
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
                    {individualItems.length === 0 && (
                      <div className="py-8 text-center text-[12px] text-slate-400 bg-slate-50 rounded-xl">ไม่มีข้อมูลชิ้นย่อย</div>
                    )}
                  </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: ประวัติการครอบครอง */}
          {activeTab === 'ownership' && (selectedAssetCategory === 'assets' || selectedAssetCategory === 'accessories') && (
            <div className="animate-in fade-in duration-200">
              <OwnershipHistory
                assetId={currentAssetDetail.id}
                transactions={transactions}
                currentHolder={currentAssetDetail.assignedName ? { empName: currentAssetDetail.assignedName } : null}
              />
            </div>
          )}

          {/* TAB: ประวัติการจัดซื้อ */}
          {activeTab === 'history' && selectedAssetCategory === 'assets' && (
            <div className="space-y-3 animate-in fade-in duration-200">

              {!isAddingHistory && !editingHistoryId ? (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-[#1E487A]" />
                      <h4 className="text-[12px] font-semibold text-slate-600">ประวัติการจัดซื้อ ({purchaseHistory.length} ครั้ง)</h4>
                    </div>
                    <button
                      onClick={() => {
                        setIsAddingHistory(true);
                        setHistoryForm({ purchaseDate: '', cost: '', vendor: '', model: currentAssetDetail.model || '', note: '', documents: [] });
                      }}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold bg-[#1E487A] text-white px-3.5 py-2 rounded-lg hover:bg-[#163963] transition-colors shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      เพิ่มประวัติจัดซื้อ
                    </button>
                  </div>

                  {purchaseHistory.length === 0 ? (
                    <div className="py-14 text-center bg-white rounded-2xl ring-1 ring-slate-200/60">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </div>
                      <p className="text-[13px] font-semibold text-slate-500">ยังไม่มีประวัติการจัดซื้อที่บันทึกไว้</p>
                      <p className="text-[11.5px] text-slate-400 mt-1">กดปุ่มด้านบนเพื่อเพิ่มประวัติการจัดซื้อ</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {purchaseHistory.map((hist, index) => (
                        <div key={hist.id} className={`bg-white rounded-2xl px-5 py-4 transition-all ring-1 ${index === 0 ? 'ring-[#1E487A]/25' : 'ring-slate-200/60 hover:ring-slate-300/60'}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {index === 0 && (
                                <span className="bg-blue-50 text-[#1E487A] px-2 py-0.5 rounded-full text-[9.5px] font-semibold ring-1 ring-inset ring-blue-200 shrink-0">ล่าสุด</span>
                              )}
                              <span className="text-[12px] text-slate-500 font-medium shrink-0">
                                {hist.purchaseDate ? new Date(hist.purchaseDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'ไม่ระบุวันที่'}
                              </span>
                            </div>
                            <div className="text-[15px] font-bold text-[#1E487A] shrink-0">
                              {hist.cost ? `฿${Number(hist.cost).toLocaleString()}` : '-'}
                            </div>
                            <div className="flex-1 min-w-0 hidden sm:block">
                              <p className="text-[12px] text-slate-600 truncate"><span className="text-slate-400">Vendor:</span> {hist.vendor || '-'}</p>
                              <p className="text-[12px] text-slate-600 truncate"><span className="text-slate-400">Model:</span> {hist.model || '-'}</p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => { setEditingHistoryId(hist.id); setHistoryForm(hist); }} className="p-1.5 bg-white ring-1 ring-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => handleDeleteHistory(hist.id)} className="p-1.5 bg-white ring-1 ring-red-200 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                          {(hist.note || (hist.documents && hist.documents.length > 0)) && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-start">
                              {hist.note && <p className="text-[12px] text-slate-500 flex-1">{hist.note}</p>}
                              {hist.documents?.map((docItem, idx) => (
                                <a key={idx} href={docItem.data} download={docItem.name} className="flex items-center gap-1 text-[11px] bg-slate-50 text-slate-500 ring-1 ring-slate-200 py-1 px-2.5 rounded-full hover:bg-blue-50 hover:text-[#1E487A] hover:ring-blue-200 transition-colors max-w-[160px] truncate">
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
                <div className="bg-white ring-1 ring-slate-200/60 p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                    <div className="w-1 h-5 rounded-full bg-[#1E487A]" />
                    <h4 className="text-[13px] font-semibold text-slate-700">
                      {editingHistoryId ? 'แก้ไขประวัติการจัดซื้อ' : 'เพิ่มประวัติการจัดซื้อใหม่'}
                    </h4>
                  </div>

                  <form onSubmit={handleSaveHistory} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12.5px] font-medium text-slate-600 mb-1.5">วันที่จัดซื้อ</label>
                        <input type="date" value={historyForm.purchaseDate} onChange={(e) => setHistoryForm({...historyForm, purchaseDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] transition-all" />
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-medium text-slate-600 mb-1.5">ราคา (บาท)</label>
                        <input type="number" step="any" value={historyForm.cost} onChange={(e) => setHistoryForm({...historyForm, cost: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] transition-all" placeholder="ยอดรวมหรือต่อชิ้น" />
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-medium text-slate-600 mb-1.5">ผู้จัดจำหน่าย (Vendor)</label>
                        <input type="text" value={historyForm.vendor} onChange={(e) => setHistoryForm({...historyForm, vendor: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] transition-all" placeholder="ชื่อร้าน/บริษัท" />
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-medium text-slate-600 mb-1.5">ยี่ห้อ/รุ่น (Model)</label>
                        <input type="text" value={historyForm.model} onChange={(e) => setHistoryForm({...historyForm, model: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[12.5px] font-medium text-slate-600 mb-1.5">รายละเอียด / หมายเหตุ</label>
                        <textarea value={historyForm.note} onChange={(e) => setHistoryForm({...historyForm, note: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] transition-all resize-none" rows="2" placeholder="เช่น จัดซื้อทดแทนเครื่องเดิม..."></textarea>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-[12.5px] font-medium text-slate-600 mb-3">เอกสารแนบการจัดซื้อ</label>

                      {historyForm.documents && historyForm.documents.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {historyForm.documents.map((docItem, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 ring-1 ring-slate-200 p-2.5 rounded-lg">
                              <span className="text-[12px] font-medium text-slate-600 truncate max-w-[180px]">{docItem.name}</span>
                              <button type="button" onClick={() => handleRemoveHistoryDoc(idx)} className="text-slate-400 hover:text-red-500 bg-white ring-1 ring-slate-200 w-6 h-6 rounded-md flex items-center justify-center transition-colors">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className={`cursor-pointer inline-flex items-center gap-1.5 text-[12px] font-semibold py-2 px-3.5 rounded-lg ring-1 transition-colors ${isSavingItem ? 'ring-slate-200 bg-slate-50 text-slate-400' : 'ring-blue-200 bg-white text-[#1E487A] hover:bg-blue-50'}`}>
                        {isSavingItem ? 'กำลังอัปโหลด...' : (
                          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>แนบไฟล์</>
                        )}
                        <input type="file" multiple accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={handleHistoryDocUpload} disabled={isSavingItem} className="hidden" />
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button type="button" onClick={() => { setIsAddingHistory(false); setEditingHistoryId(null); }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 text-sm font-semibold transition-colors">ยกเลิก</button>
                      <button type="submit" disabled={isSavingItem} className="flex-1 py-2.5 bg-[#1E487A] text-white rounded-xl hover:bg-[#163963] text-sm font-semibold transition-colors shadow-sm disabled:opacity-50">บันทึกประวัติ</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB: เอกสารแนบ */}
          {activeTab === 'docs' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl ring-1 ring-slate-200/60 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-[#1E487A]" />
                  <h4 className="text-[12px] font-semibold text-slate-600">จัดการเอกสารแนบ</h4>
                </div>
                
                <div className="flex flex-col gap-4">
                  {(() => {
                    let docs = currentAssetDetail.documents || [];
                    if (currentAssetDetail.document && docs.length === 0) docs = Array.isArray(currentAssetDetail.document) ? [...currentAssetDetail.document] : [currentAssetDetail.document];
                    docs = docs.flat();
                    
                    return docs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {docs.map((docItem, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 ring-1 ring-slate-200/60 p-3 rounded-xl overflow-hidden">
                            <a href={docItem.data} download={docItem.name} className="flex items-center gap-3 text-[12.5px] text-[#1E487A] font-medium hover:underline truncate mr-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-[#1E487A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              </div>
                              <span className="truncate">{docItem.name}</span>
                            </a>
                            <button onClick={() => handleRemoveDocument(idx)} disabled={isSavingItem} className="text-slate-400 hover:text-red-500 bg-white ring-1 ring-slate-200 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 hover:ring-red-200 transition-colors shrink-0" title="ลบเอกสารนี้">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-slate-50 ring-1 ring-dashed ring-slate-300 rounded-2xl">
                        <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-white ring-1 ring-slate-200 flex items-center justify-center text-slate-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-500 mb-0.5">ยังไม่มีเอกสารแนบ</p>
                        <p className="text-[11.5px] text-slate-400">อัปโหลดใบเสนอราคา ใบเสร็จ หรือรูปภาพเพิ่มเติมได้ที่นี่</p>
                      </div>
                    );
                  })()}

                  <div className="mt-3 flex justify-center">
                    <label className={`cursor-pointer inline-flex items-center gap-1.5 text-[12.5px] font-semibold py-2.5 px-5 rounded-xl ring-1 transition-colors ${isSavingItem ? 'ring-slate-200 bg-slate-50 text-slate-400' : 'ring-blue-200 bg-white text-[#1E487A] hover:bg-blue-50'}`}>
                      {isSavingItem ? (
                        <><div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>กำลังอัปโหลด...</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>อัปโหลดไฟล์</>
                      )}
                      <input type="file" multiple accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={handleDocumentUpload} disabled={isSavingItem} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 bg-white flex flex-wrap justify-end items-center gap-2 border-t border-slate-100 shrink-0 rounded-b-2xl">
          {selectedAssetCategory === 'assets' && (
            (!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
              <button onClick={() => { setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory }); closeAll(); }} className="w-full sm:w-auto px-5 py-2.5 bg-[#1E487A] text-white rounded-xl hover:bg-[#163963] text-[13px] font-semibold transition-colors sm:mr-auto shadow-sm">เบิกจ่าย</button>
            ) : currentAssetDetail.status === 'ถูกใช้งาน' ? (
              <button onClick={() => { setReturnModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: 'assets', empId: currentAssetDetail.assignedTo, empName: currentAssetDetail.assignedName, assetName: currentAssetDetail.name }); closeAll(); }} className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-[13px] font-semibold transition-colors sm:mr-auto shadow-sm">รับคืน</button>
            ) : null
          )}

          {selectedAssetCategory === 'assets' && (
            <button onClick={() => setShowLabelPreview(true)} className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-slate-600 ring-1 ring-slate-200 rounded-xl hover:bg-slate-50 text-[13px] font-semibold transition-colors">
              พิมพ์ป้าย
            </button>
          )}

          <button onClick={() => { if (selectedAssetCategory === 'licenses') { openEditLicenseModal(currentAssetDetail); } else { openEditAssetModal(currentAssetDetail, selectedAssetCategory); } closeAll(); }} className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-slate-600 ring-1 ring-slate-200 rounded-xl hover:bg-slate-50 text-[13px] font-semibold transition-colors">แก้ไขข้อมูล</button>
          <button onClick={closeAll} className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 text-[13px] font-semibold transition-colors">ปิด</button>
        </div>
      </div>
    </div>
  );
}