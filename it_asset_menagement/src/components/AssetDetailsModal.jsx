import React, { useState } from 'react';
import { db } from '../firebase'; 
import { doc, updateDoc } from 'firebase/firestore';

export default function AssetDetailsModal({
  selectedAssetDetail, setSelectedAssetDetail, selectedAssetCategory, setSelectedAssetCategory,
  accessories, assets, licenses, setCheckoutModal, setReturnModal, handleCheckin, openEditLicenseModal, openEditAssetModal,
  setRepairModal, setRepairQuantity, setRepairRemarks, showConfirm, setCustomAlert
}) {
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

  if (!selectedAssetDetail) return null;

  const currentAssetDetail = 
    selectedAssetCategory === 'accessories' ? (accessories.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
    selectedAssetCategory === 'assets' ? (assets.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
    (licenses.find(l => l.id === selectedAssetDetail.id) || selectedAssetDetail);

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

        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 print:border-none print:shadow-none print:bg-transparent">
          <div className="bg-slate-800 text-white p-5 flex justify-between items-center print:hidden">
            <h3 className="font-bold text-lg flex items-center gap-2">🖨️ ตัวอย่างป้าย (Label Preview)</h3>
            <button onClick={() => setShowLabelPreview(false)} className="text-slate-400 hover:text-white bg-slate-700 p-1.5 rounded-xl transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="p-10 flex justify-center items-center bg-slate-100 overflow-x-auto print:p-0 print:bg-transparent">
            <div id="printable-label-container" className="bg-white border-[3px] border-black p-1 flex flex-col w-[180px] h-[80px] text-black shrink-0 relative box-border overflow-hidden">
              <div className="flex gap-1.5 h-full mb-0.5 overflow-hidden">
                <div className="w-[42px] h-[42px] shrink-0 border border-gray-100 p-0.5 bg-white flex items-center justify-center self-start">
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
          
          <div className="p-5 bg-white border-t flex justify-end gap-3 print:hidden">
            <button onClick={() => setShowLabelPreview(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">กลับ</button>
            <button onClick={() => window.print()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md">
              🖨️ สั่งพิมพ์ (Print)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper ฟังก์ชันสำหรับสร้าง Card ข้อมูล (UI Component ภายใน)
  const InfoCard = ({ label, value, icon, isMono = false }) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3 hover:bg-slate-100/50 transition-colors">
      {icon && <div className="mt-0.5 text-lg opacity-60 shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className={`font-bold text-slate-800 text-sm truncate ${isMono ? 'font-mono text-xs bg-white px-2 py-0.5 rounded border shadow-sm w-fit' : ''}`}>
          {value || '-'}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header Modal */}
        <div className="bg-slate-800 text-white p-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2"><span className="bg-white/20 p-1.5 rounded-lg text-sm">📋</span> รายละเอียด{selectedAssetCategory === 'assets' ? 'ทรัพย์สินหลัก' : selectedAssetCategory === 'accessories' ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}</h3>
          <button onClick={closeAll} className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* เนื้อหาหลัก (เลื่อนได้) */}
        <div className="p-6 md:p-8 overflow-y-auto text-sm md:text-base text-slate-800 flex-1 bg-white">
          
          {/* ส่วนแสดงรูปภาพและชื่อรายการ (ตรงกลางด้านบน) */}
          <div className="mb-8 flex flex-col items-center text-center">
            {currentAssetDetail.image && selectedAssetCategory !== 'licenses' ? (
              <div className="mb-5 relative p-2 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
                <img src={currentAssetDetail.image} alt="Asset Preview" className="max-h-48 md:max-h-56 rounded-xl object-contain" />
              </div>
            ) : selectedAssetCategory !== 'licenses' ? (
              <div className="mb-5 w-full max-w-xs h-32 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-400 border-2 border-slate-200 border-dashed mx-auto">
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm font-medium">ไม่มีรูปภาพอ้างอิง</span>
              </div>
            ) : null}

            <h2 className="text-2xl md:text-3xl font-black text-indigo-900 mb-3">{currentAssetDetail.name}</h2>
            
            {/* Badges ใต้ชื่อ */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200 shadow-sm">
                {currentAssetDetail.type || 'ไม่ระบุประเภท'}
              </span>
              
              {selectedAssetCategory !== 'accessories' && (
                (!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-emerald-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> พร้อมใช้งาน</span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-amber-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {currentAssetDetail.status}</span>
                )
              )}

              {selectedAssetCategory === 'assets' && currentAssetDetail.department && (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200 shadow-sm flex items-center gap-1">
                  <span>🏢</span> แผนก: {currentAssetDetail.department}
                </span>
              )}
            </div>
          </div>

          {/* ส่วนแสดงผู้ครอบครอง (หากมี) */}
          {selectedAssetCategory !== 'accessories' && currentAssetDetail.assignedName && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-5 rounded-2xl border border-blue-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-blue-200 text-blue-500">👤</div>
                 <div>
                   <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">ผู้ครอบครองปัจจุบัน</div>
                   <div className="font-bold text-blue-900 text-base">{currentAssetDetail.assignedName}</div>
                 </div>
              </div>
            </div>
          )}

          {/* ข้อมูล Grid Cards ตามหมวดหมู่ */}
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><span className="text-lg">📋</span> ข้อมูลรายละเอียด</h4>
          
          {selectedAssetCategory === 'licenses' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="col-span-1 sm:col-span-2 md:col-span-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><span>🔑</span> Product Key</div>
                <div className="font-mono font-bold text-indigo-800 text-lg break-all bg-white px-3 py-1.5 rounded-lg border shadow-sm w-fit">{currentAssetDetail.productKey || '-'}</div>
              </div>
              <InfoCard label="รหัสอ้างอิง Key" value={currentAssetDetail.keyCode} icon="🔖" />
              <InfoCard label="Supplier ที่ซื้อ" value={currentAssetDetail.supplier} icon="🏬" />
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="mt-0.5 text-lg opacity-60 shrink-0">💰</div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ราคา (บาท)</div>
                  <div className="font-black text-emerald-600 text-base">{currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}</div>
                </div>
              </div>
              <InfoCard label="วันที่ซื้อ" value={currentAssetDetail.purchaseDate} icon="📅" />
              <InfoCard label="วันที่หมดอายุ" value={currentAssetDetail.expirationDate} icon="⏳" />
            </div>
          ) : selectedAssetCategory === 'assets' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <InfoCard label="รหัสทรัพย์สิน" value={currentAssetDetail.assetTag} icon="🏷️" />
              <InfoCard label="Serial Number" value={currentAssetDetail.sn} icon="🔢" isMono />
              <InfoCard label="ยี่ห้อ/รุ่น (Model)" value={currentAssetDetail.model} icon="💻" />
              <InfoCard label="บริษัท" value={currentAssetDetail.company} icon="🏢" />
              <InfoCard label="ผู้จัดจำหน่าย (Vendor)" value={currentAssetDetail.vendor} icon="🏬" />
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                <div className="mt-0.5 text-lg opacity-60 shrink-0">💰</div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ราคา (บาท)</div>
                  <div className="font-black text-emerald-600 text-base">{currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}</div>
                </div>
              </div>
              <InfoCard label="วันที่ซื้อ" value={currentAssetDetail.purchaseDate} icon="📅" />
              <InfoCard label="วันที่หมด Warranty" value={currentAssetDetail.warrantyDate} icon="🛡️" />
            </div>
          ) : (
            /* Accessories */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-center items-center text-center">
                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">จำนวนทั้งหมด</div>
                <div className="font-black text-indigo-800 text-2xl">{currentAssetDetail.quantity || 0}</div>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-center items-center text-center">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">คงเหลือ (เบิกได้)</div>
                <div className="font-black text-emerald-600 text-2xl">{currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0))}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center col-span-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ราคารวมทั้งหมด (บาท)</div>
                <div className="font-black text-slate-700 text-xl">{totalAccessoriesCost > 0 ? `฿${totalAccessoriesCost.toLocaleString()}` : '-'}</div>
              </div>
            </div>
          )}

          {/* ✅ ส่วนเอกสารแนบ (แสดงแบบใหม่) */}
          <div className="mt-8 mb-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><span className="text-lg">📎</span> เอกสารแนบ (PO / ใบสั่งซื้อ ฯลฯ)</h4>
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
              {(() => {
                let docs = currentAssetDetail.documents || [];
                // 🛠️ แก้ไข: รองรับกรณีข้อมูลเก่าเป็น Array อยู่แล้ว
                if (currentAssetDetail.document && docs.length === 0) {
                  docs = Array.isArray(currentAssetDetail.document) ? [...currentAssetDetail.document] : [currentAssetDetail.document];
                }
                docs = docs.flat(); // เคลียร์ Array ที่ซ้อนทับกันอยู่
                
                return docs.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {docs.map((docItem, idx) => (
                      <div key={idx} className="flex items-center bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden group pr-1">
                        <a href={docItem.data} download={docItem.name} className="flex items-center gap-2 text-sm text-indigo-700 font-bold py-2 px-3 hover:bg-indigo-50 transition-colors truncate max-w-[200px]">
                          <span className="text-lg">📄</span> <span className="truncate">{docItem.name}</span>
                        </a>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <button onClick={() => handleRemoveDocument(idx)} disabled={isSavingItem} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="ลบเอกสาร">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 font-medium">- ไม่มีเอกสารแนบ -</p>
                );
              })()}

              <div className="relative inline-block w-fit mt-1">
                <input type="file" multiple accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={handleDocumentUpload} disabled={isSavingItem} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" title="คลิกเพื่อแนบไฟล์" />
                <button type="button" disabled={isSavingItem} className={`inline-flex items-center gap-2 text-sm font-bold py-2 px-4 rounded-xl transition-colors border shadow-sm ${isSavingItem ? 'bg-slate-200 text-slate-400 border-slate-300' : 'bg-white hover:bg-indigo-50 text-indigo-600 border-slate-300'}`}>
                  {isSavingItem ? 'กำลังอัปโหลด...' : '➕ อัปโหลดไฟล์เพิ่มเติม'}
                </button>
              </div>
            </div>
          </div>

          {/* ✅ ส่วนจัดการรายการอุปกรณ์ย่อย (Accessories) */}
          {selectedAssetCategory === 'accessories' && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><span className="text-lg">📦</span> รายการอุปกรณ์แต่ละชิ้น ({individualItems.length} รายการ)</h4>
                  {individualItems.length > 0 && (
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 cursor-pointer bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedItemsForDelete.length === individualItems.length && individualItems.length > 0}
                        onChange={handleSelectAllItems}
                        className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      เลือกทั้งหมด
                    </label>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {selectedItemsForDelete.length > 0 && (
                    <button 
                      onClick={handleDeleteSelectedItems} 
                      disabled={isSavingItem}
                      className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5 shadow-sm border border-red-200 disabled:opacity-50"
                    >
                      🗑️ ลบที่เลือก ({selectedItemsForDelete.length})
                    </button>
                  )}
                  <button onClick={() => { setIsImportingCSV(!isImportingCSV); setIsAddingNew(false); }} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-sm border border-emerald-200">
                    📄 นำเข้า CSV
                  </button>
                  <button onClick={() => { setIsAddingNew(!isAddingNew); setIsImportingCSV(false); }} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-sm border border-indigo-200">
                    ➕ เพิ่มชิ้นใหม่
                  </button>
                </div>
              </div>

              {/* ฟอร์มนำเข้า CSV */}
              {isImportingCSV && (
                <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 mb-5 animate-in fade-in slide-in-from-top-2">
                  <h5 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">✨ นำเข้าข้อมูลอุปกรณ์ชิ้นใหม่จากไฟล์ CSV</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-700 mb-1">1. ดาวน์โหลดไฟล์ต้นแบบ</p>
                        <p className="text-xs text-slate-500 mb-3">โหลดไฟล์ CSV ที่มีหัวคอลัมน์ถูกต้อง</p>
                      </div>
                      <button onClick={handleDownloadPieceTemplate} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-300 flex items-center justify-center gap-2">
                        ⬇️ โหลด Template.csv
                      </button>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-700 mb-1">2. อัปโหลดไฟล์ข้อมูล</p>
                        <p className="text-xs text-slate-500 mb-3">เลือกไฟล์ CSV ที่กรอกข้อมูลเสร็จแล้ว</p>
                      </div>
                      <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleUploadPieceCSV} 
                        className="block w-full text-xs text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-emerald-100">
                    <button onClick={() => setIsImportingCSV(false)} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">ปิด</button>
                  </div>
                </div>
              )}

              {/* ฟอร์มเพิ่มรายชิ้น */}
              {isAddingNew && (
                <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100 mb-5 animate-in fade-in slide-in-from-top-2">
                  <h5 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">✨ ลงทะเบียนอุปกรณ์ชิ้นใหม่เข้าสต็อก</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Serial Number</label>
                      <input type="text" value={newItemData.sn} onChange={e=>setNewItemData({...newItemData, sn: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white shadow-sm font-mono" placeholder="ระบุ SN (ถ้ามี)..." />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">รุ่น / โมเดล</label>
                      <input type="text" value={newItemData.model} onChange={e=>setNewItemData({...newItemData, model: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white shadow-sm" placeholder="ระบุรุ่น..." />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ราคา (บาท)</label>
                      <input type="number" value={newItemData.cost} onChange={e=>setNewItemData({...newItemData, cost: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white shadow-sm" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">วันที่ซื้อ</label>
                      <input type="date" value={newItemData.purchaseDate} onChange={e=>setNewItemData({...newItemData, purchaseDate: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white shadow-sm text-slate-600" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">วันที่หมด Warranty</label>
                      <input type="date" value={newItemData.warrantyDate} onChange={e=>setNewItemData({...newItemData, warrantyDate: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white shadow-sm text-slate-600" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">จำนวน (ชิ้น)</label>
                      <input type="number" min="1" value={newItemData.quantity} onChange={e=>setNewItemData({...newItemData, quantity: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white shadow-sm" placeholder="1" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100">
                    <button onClick={() => setIsAddingNew(false)} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">ยกเลิก</button>
                    <button onClick={handleAddNewPiece} disabled={isSavingItem} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5">
                      {isSavingItem ? 'กำลังบันทึก...' : 'บันทึกเข้าสต็อก'}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {individualItems.map((item, index) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
                    <div 
                      onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                      className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={selectedItemsForDelete.includes(item.id)}
                          onChange={(e) => { e.stopPropagation(); handleSelectItem(item.id); }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm shrink-0 ${item.type === 'available' ? 'bg-emerald-100 text-emerald-600' : item.type === 'assigned' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>{index + 1}</div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {item.type === 'assigned' ? `👤 ${item.assignee.empName}` : `${currentAssetDetail.name} ชิ้นที่ ${index + 1}`}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">SN: <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{item.sn || 'ไม่ระบุ'}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:ml-auto">
                        {item.type === 'available' ? (
                          <button onClick={(e) => { e.stopPropagation(); setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory, sn: item.sn, snIndex: item.originalIndex, itemCost: item.itemCost, itemPurchaseDate: item.purchaseDate, itemWarrantyDate: item.warrantyDate }); }} className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors shadow-sm">เบิกจ่าย</button>
                        ) : item.type === 'assigned' ? (
                          <button onClick={(e) => { e.stopPropagation(); setReturnModal({ isOpen: true, assetId: currentAssetDetail.id, checkoutId: item.assignee.checkoutId, empId: item.assignee.empId, empName: item.assignee.empName, assetName: currentAssetDetail.name }); }} className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-teal-600 border-teal-200 hover:bg-teal-600 hover:text-white transition-colors shadow-sm">รับคืน</button>
                        ) : (
                          <button onClick={(e) => { 
                            e.stopPropagation(); 
                            setRepairModal({ 
                              isOpen: true, 
                              assetId: currentAssetDetail.id, 
                              assetName: `${currentAssetDetail.name} (SN: ${item.sn || 'ไม่ระบุ'})`, 
                              maxRepair: 1, 
                              brokenIndex: item.originalIndex 
                            }); 
                            setRepairQuantity(1); 
                            setRepairRemarks(''); 
                          }} className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            นำกลับเข้าคลัง
                          </button>
                        )}
                        <button className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-lg border border-slate-200 shadow-sm transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedItem === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* ฟอร์มแก้ไขรายชิ้น */}
                    {expandedItem === index && (
                      <div className="p-5 bg-white border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                        {editingItemId === item.id ? (
                          <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่ออุปกรณ์</label>
                                <div className="w-full border border-slate-200 bg-slate-100 p-2.5 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed truncate">
                                  {currentAssetDetail.name}
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">รุ่น / โมเดล</label>
                                <input 
                                  type="text" value={tempModelValue} onChange={(e) => setTempModelValue(e.target.value)}
                                  className="w-full border border-indigo-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                                  placeholder="ระบุรุ่น..."
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ราคา/ชิ้น</label>
                                <input 
                                  type="number" value={tempCostValue} onChange={(e) => setTempCostValue(e.target.value)}
                                  className="w-full border border-indigo-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                                  placeholder={item.itemCost || '0'}
                                />
                              </div>
                              <div className="sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serial Number อุปกรณ์</label>
                                <input 
                                  type="text" value={tempSNValue} onChange={(e) => setTempSNValue(e.target.value)}
                                  className="w-full border border-indigo-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono shadow-sm"
                                  placeholder="กรอก Serial Number..." autoFocus
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">วันที่ซื้อ</label>
                                <input 
                                  type="date" value={tempPurchaseDateValue} onChange={(e) => setTempPurchaseDateValue(e.target.value)}
                                  className="w-full border border-indigo-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-slate-700"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">วันที่หมด Warranty</label>
                                <input 
                                  type="date" value={tempWarrantyDateValue} onChange={(e) => setTempWarrantyDateValue(e.target.value)}
                                  className="w-full border border-indigo-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-slate-700"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 justify-end mt-2 border-t border-slate-100 pt-3">
                              <button onClick={() => setEditingItemId(null)} className="bg-slate-50 text-slate-600 border border-slate-200 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">ยกเลิก</button>
                              <button onClick={() => handleSaveItemDetails(item)} disabled={isSavingItem} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                                {isSavingItem ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6">
                            <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">รุ่น / โมเดล</span><span className="text-sm font-medium text-slate-700">{item.model || '-'}</span></div>
                            <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ราคา/ชิ้น</span><span className="text-sm font-black text-emerald-600">{item.itemCost ? `฿${Number(item.itemCost).toLocaleString()}` : '-'}</span></div>
                            <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Serial Number</span><span className="text-xs font-mono text-slate-800 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">{item.sn || 'ยังไม่ระบุ'}</span></div>
                            <div><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">วันที่ซื้อ</span><span className="text-sm font-medium text-slate-700">{item.purchaseDate || '-'}</span></div>
                            <div className="sm:col-span-2"><span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">วันที่หมด Warranty</span><span className="text-sm font-medium text-slate-700">{item.warrantyDate || '-'}</span></div>
                            
                            <div className="col-span-1 sm:col-span-3 mt-2 pt-3 border-t border-slate-100 flex justify-end">
                              <button 
                                onClick={() => { 
                                  setEditingItemId(item.id); 
                                  setTempSNValue(item.sn); 
                                  setTempModelValue(item.model);
                                  setTempCostValue(item.itemCost);
                                  setTempPurchaseDateValue(item.purchaseDate);
                                  setTempWarrantyDateValue(item.warrantyDate);
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center justify-center gap-1.5 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 transition-all shadow-sm w-full sm:w-auto hover:bg-indigo-100"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                แก้ไขข้อมูลย่อย
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Buttons */}
        <div className="p-5 md:p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-200 shrink-0">
           {selectedAssetCategory === 'accessories' ? (
             ((currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0))) > 0) && (
               <button onClick={() => { setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory }); }} className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold transition-colors border border-indigo-200 mr-auto flex items-center gap-2 text-sm md:text-base shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> เบิกจ่าย ({(currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0)))})</button>
             )
           ) : (
             (!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
               <button onClick={() => { setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory }); setSelectedAssetDetail(null); setSelectedAssetCategory(''); }} className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold transition-colors border border-indigo-200 mr-auto flex items-center gap-2 text-sm md:text-base shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> เบิกจ่าย</button>
             ) : currentAssetDetail.status === 'ถูกใช้งาน' ? (
               <button onClick={() => { handleCheckin(currentAssetDetail.id, selectedAssetCategory); setSelectedAssetDetail(null); setSelectedAssetCategory(''); }} className="px-6 py-3 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 font-bold transition-colors border border-teal-200 mr-auto flex items-center gap-2 text-sm md:text-base shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> รับคืน</button>
             ) : null
           )}

           {selectedAssetCategory === 'assets' && (
             <button onClick={() => setShowLabelPreview(true)} className="px-4 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 font-bold transition-colors shadow-sm text-sm md:text-base flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg> 
               พิมพ์ป้าย (Label)
             </button>
           )}

           <button onClick={() => { if (selectedAssetCategory === 'licenses') { openEditLicenseModal(currentAssetDetail); } else { openEditAssetModal(currentAssetDetail, selectedAssetCategory); } setSelectedAssetDetail(null); setSelectedAssetCategory(''); }} className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-bold transition-colors border border-amber-200 text-sm md:text-base shadow-sm">แก้ไขข้อมูล</button>
           <button onClick={() => { setSelectedAssetDetail(null); setSelectedAssetCategory(''); }} className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold transition-colors shadow-md text-sm md:text-base">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}