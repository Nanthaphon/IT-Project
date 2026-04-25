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
    
    const qrDataString = `ASSET
N:${currentAssetDetail.name || '-'}
T:${currentAssetDetail.assetTag || '-'}
S:${currentAssetDetail.sn || '-'}
M:${currentAssetDetail.model || '-'}
C:${currentAssetDetail.company || '-'}
V:${currentAssetDetail.vendor || '-'}
Ty:${currentAssetDetail.type || '-'}
Pr:${currentAssetDetail.cost || '-'}
Pd:${currentAssetDetail.purchaseDate || '-'}
Wd:${currentAssetDetail.warrantyDate || '-'}
Own:${currentAssetDetail.assignedName || '-'}`;

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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-slate-800 text-white p-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2"><span className="bg-white/20 p-1.5 rounded-lg text-sm">📋</span> รายละเอียด{selectedAssetCategory === 'assets' ? 'ทรัพย์สินหลัก' : selectedAssetCategory === 'accessories' ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}</h3>
          <button onClick={closeAll} className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto space-y-4 text-sm md:text-base text-slate-800 flex-1">
          <div className="bg-white rounded-xl">
            {currentAssetDetail.image && selectedAssetCategory !== 'licenses' && (
              <div className="mb-6 flex justify-center border-b border-slate-100 pb-6">
                <img src={currentAssetDetail.image} alt="Asset Preview" className="max-h-48 md:max-h-56 rounded-xl object-contain shadow-sm border border-slate-200" />
              </div>
            )}
            
            {!currentAssetDetail.image && selectedAssetCategory !== 'licenses' && (
              <div className="mb-6 flex justify-center border-b border-slate-100 pb-6">
                <div className="w-full max-w-sm h-32 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-400 border-2 border-slate-200 border-dashed">
                  <span className="text-3xl mb-2">📷</span>
                  <span className="text-sm font-medium">ไม่มีรูปภาพอ้างอิง</span>
                </div>
              </div>
            )}

            {selectedAssetCategory === 'licenses' ? (
              <>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 mt-2"><span className="text-slate-500 font-bold text-sm md:text-base">ชื่อโปรแกรม:</span><span className="col-span-2 font-black text-indigo-700 text-lg md:text-xl">{currentAssetDetail.name}</span></div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4"><span className="text-slate-500 font-bold text-sm md:text-base">Product Key:</span><span className="col-span-2 font-mono bg-slate-100 px-3 py-1 rounded-lg w-fit text-slate-700 text-base border border-slate-200">{currentAssetDetail.productKey || '-'}</span></div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4"><span className="text-slate-500 font-bold text-sm md:text-base">รหัสอ้างอิง Key:</span><span className="col-span-2 font-medium">{currentAssetDetail.keyCode || '-'}</span></div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4"><span className="text-slate-500 font-bold text-sm md:text-base">Supplier ที่ซื้อ:</span><span className="col-span-2 font-medium">{currentAssetDetail.supplier || '-'}</span></div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4"><span className="text-slate-500 font-bold text-sm md:text-base">วันที่ซื้อ:</span><span className="col-span-2 font-medium">{currentAssetDetail.purchaseDate || '-'}</span></div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4"><span className="text-slate-500 font-bold text-sm md:text-base">วันที่หมดอายุ:</span><span className="col-span-2 font-medium">{currentAssetDetail.expirationDate || '-'}</span></div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4"><span className="text-slate-500 font-bold text-sm md:text-base">ราคา:</span><span className="col-span-2 font-bold text-emerald-600 text-lg">{currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}</span></div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 mt-2 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">{selectedAssetCategory === 'accessories' ? 'ชื่อรายการ:' : 'ชื่ออุปกรณ์:'}</span><span className="col-span-2 font-black text-indigo-700 text-lg md:text-xl">{currentAssetDetail.name}</span></div>
                
                {/* ข้อมูลเฉพาะของทรัพย์สินหลัก */}
                {selectedAssetCategory === 'assets' && (
                  <>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">รหัสทรัพย์สิน:</span><span className="col-span-2 font-bold text-slate-800">{currentAssetDetail.assetTag || '-'}</span></div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">Serial Number:</span><span className="col-span-2 font-mono text-slate-700">{currentAssetDetail.sn || '-'}</span></div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">ยี่ห้อ/รุ่น (Model):</span><span className="col-span-2 font-medium">{currentAssetDetail.model || '-'}</span></div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">บริษัท:</span><span className="col-span-2 font-medium">{currentAssetDetail.company || '-'}</span></div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">แผนก:</span><span className="col-span-2 font-bold text-indigo-700 text-lg">{currentAssetDetail.department || '-'}</span></div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">ผู้จัดจำหน่าย (Vendor):</span><span className="col-span-2 font-medium">{currentAssetDetail.vendor || '-'}</span></div>
                    {currentAssetDetail.document && (
                      <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                        <span className="text-slate-500 font-bold text-sm md:text-base">เอกสารแนบ:</span>
                        <span className="col-span-2">
                          <a href={currentAssetDetail.document.data} download={currentAssetDetail.document.name} className="inline-flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg transition-colors border border-slate-200 shadow-sm">
                            📎 โหลด: {currentAssetDetail.document.name}
                          </a>
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">ประเภท:</span><span className="col-span-2 font-medium"><span className="bg-slate-100 text-slate-600 text-sm px-4 py-2 rounded-full font-bold border border-slate-200">{currentAssetDetail.type}</span></span></div>
                {selectedAssetCategory === 'accessories' && (
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                    <span className="text-slate-500 font-bold text-sm md:text-base">จำนวนทั้งหมดในระบบ:</span>
                    <span className="col-span-2 font-medium text-lg">{currentAssetDetail.quantity || 0} ชิ้น</span>
                  </div>
                )}
                {selectedAssetCategory !== 'accessories' && (
                  <>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">ราคา:</span><span className="col-span-2 font-bold text-emerald-600 text-lg">{currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}</span></div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">วันที่ซื้อ:</span><span className="col-span-2 font-medium">{currentAssetDetail.purchaseDate || '-'}</span></div>
                    <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">วันที่หมด Warranty:</span><span className="col-span-2 font-medium">{currentAssetDetail.warrantyDate || '-'}</span></div>
                  </>
                )}
              </>
            )}

            {selectedAssetCategory !== 'accessories' && (
              <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                <span className="text-slate-500 font-bold text-sm md:text-base">สถานะ:</span>
                <span className="col-span-2">
                  {(!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
                    <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 border border-emerald-200 shadow-sm"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> พร้อมใช้งาน</span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 border border-amber-200 shadow-sm"><span className="w-2 h-2 rounded-full bg-amber-500"></span> {currentAssetDetail.status}</span>
                  )}
                </span>
              </div>
            )}
            
            {selectedAssetCategory !== 'accessories' && (
              <div className="grid grid-cols-3 pt-3 md:pt-4"><span className="text-slate-500 font-bold text-sm md:text-base">ผู้ครอบครอง:</span><span className="col-span-2 font-medium">{currentAssetDetail.assignedName ? `👤 ${currentAssetDetail.assignedName}` : '-'}</span></div>
            )}

            {selectedAssetCategory === 'accessories' && (
              <div className="pt-6 mt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-slate-800 font-bold text-base flex items-center gap-2"><span className="text-xl">📦</span> รายการอุปกรณ์แต่ละชิ้น ({individualItems.length} รายการ)</h4>
                    {individualItems.length > 0 && (
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={selectedItemsForDelete.length === individualItems.length && individualItems.length > 0}
                          onChange={handleSelectAllItems}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
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
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2 shadow-sm border border-red-200 w-full sm:w-auto justify-center disabled:opacity-50"
                      >
                        🗑️ ลบที่เลือก ({selectedItemsForDelete.length})
                      </button>
                    )}
                    <button onClick={() => { setIsImportingCSV(!isImportingCSV); setIsAddingNew(false); }} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2 shadow-sm border border-emerald-200 w-full sm:w-auto justify-center">
                      📄 นำเข้า CSV
                    </button>
                    <button onClick={() => { setIsAddingNew(!isAddingNew); setIsImportingCSV(false); }} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm border border-indigo-200 w-full sm:w-auto justify-center">
                      ➕ เพิ่มรายการ
                    </button>
                  </div>
                </div>

                {isImportingCSV && (
                  <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 mb-5 animate-in fade-in slide-in-from-top-2">
                    <h5 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">✨ นำเข้าข้อมูลอุปกรณ์ชิ้นใหม่จากไฟล์ CSV</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-700 mb-1">1. ดาวน์โหลดไฟล์ต้นแบบ</p>
                          <p className="text-xs text-slate-500 mb-3">โหลดไฟล์ CSV ที่มีหัวคอลัมน์ถูกต้อง</p>
                        </div>
                        <button onClick={handleDownloadPieceTemplate} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors border border-slate-300 flex items-center justify-center gap-2">
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
                          className="block w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-emerald-100">
                      <button onClick={() => setIsImportingCSV(false)} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">ปิดหน้าต่าง</button>
                    </div>
                  </div>
                )}

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
                      <button onClick={() => setIsAddingNew(false)} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">ยกเลิก</button>
                      <button onClick={handleAddNewPiece} disabled={isSavingItem} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2">
                        {isSavingItem ? 'กำลังบันทึก...' : 'บันทึกเข้าสต็อก'}
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {individualItems.map((item, index) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
                      <div 
                        onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors gap-3"
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
                            <p className="text-xs text-slate-500 font-mono">SN: {item.sn || 'ยังไม่ระบุ'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:ml-auto">
                          {item.type === 'available' ? (
                            <button onClick={(e) => { e.stopPropagation(); setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory, sn: item.sn, snIndex: item.originalIndex, itemCost: item.itemCost, itemPurchaseDate: item.purchaseDate, itemWarrantyDate: item.warrantyDate }); }} className="px-4 py-1.5 rounded-lg text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors">เบิกจ่าย</button>
                          ) : item.type === 'assigned' ? (
                            <button onClick={(e) => { e.stopPropagation(); setReturnModal({ isOpen: true, assetId: currentAssetDetail.id, checkoutId: item.assignee.checkoutId, empId: item.assignee.empId, empName: item.assignee.empName, assetName: currentAssetDetail.name }); }} className="px-4 py-1.5 rounded-lg text-xs font-bold border bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-600 hover:text-white transition-colors">รับคืน</button>
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
                            }} className="px-4 py-1.5 rounded-lg text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              นำกลับเข้าคลัง
                            </button>
                          )}
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform ${expandedItem === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                      
                      {expandedItem === index && (
                        <div className="p-5 bg-slate-50 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                          {editingItemId === item.id ? (
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่ออุปกรณ์</label>
                                  <div className="w-full border border-slate-200 bg-slate-200/50 p-2.5 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed">
                                    {currentAssetDetail.name}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">รุ่น / โมเดล</label>
                                  <input 
                                    type="text" value={tempModelValue} onChange={(e) => setTempModelValue(e.target.value)}
                                    className="w-full border border-indigo-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner bg-white"
                                    placeholder="ระบุรุ่น..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ราคา/ชิ้น</label>
                                  <input 
                                    type="number" value={tempCostValue} onChange={(e) => setTempCostValue(e.target.value)}
                                    className="w-full border border-indigo-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner bg-white"
                                    placeholder={item.itemCost || '0'}
                                  />
                                </div>
                                <div className="sm:col-span-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serial Number อุปกรณ์</label>
                                  <input 
                                    type="text" value={tempSNValue} onChange={(e) => setTempSNValue(e.target.value)}
                                    className="w-full border border-indigo-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono shadow-inner bg-white"
                                    placeholder="กรอก Serial Number..." autoFocus
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">วันที่ซื้อ</label>
                                  <input 
                                    type="date" value={tempPurchaseDateValue} onChange={(e) => setTempPurchaseDateValue(e.target.value)}
                                    className="w-full border border-indigo-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner bg-white text-slate-600"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">วันที่หมด Warranty</label>
                                  <input 
                                    type="date" value={tempWarrantyDateValue} onChange={(e) => setTempWarrantyDateValue(e.target.value)}
                                    className="w-full border border-indigo-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner bg-white text-slate-600"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 justify-end mt-2 border-t border-slate-200 pt-3">
                                <button onClick={() => setEditingItemId(null)} className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">ยกเลิก</button>
                                <button onClick={() => handleSaveItemDetails(item)} disabled={isSavingItem} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2">
                                  {isSavingItem ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div><span className="block text-xs font-bold text-slate-500 mb-1">รุ่น / โมเดล</span><span className="text-sm font-medium text-slate-700">{item.model || '-'}</span></div>
                              <div><span className="block text-xs font-bold text-slate-500 mb-1">ราคา/ชิ้น</span><span className="text-sm font-semibold text-emerald-600">{item.itemCost ? `฿${Number(item.itemCost).toLocaleString()}` : '-'}</span></div>
                              <div><span className="block text-xs font-bold text-slate-500 mb-1">Serial Number</span><span className="text-sm font-mono text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-sm">{item.sn || 'ยังไม่ระบุ'}</span></div>
                              <div><span className="block text-xs font-bold text-slate-500 mb-1">วันที่ซื้อ</span><span className="text-sm font-medium text-slate-700">{item.purchaseDate || '-'}</span></div>
                              <div className="sm:col-span-2"><span className="block text-xs font-bold text-slate-500 mb-1">วันที่หมด Warranty</span><span className="text-sm font-medium text-slate-700">{item.warrantyDate || '-'}</span></div>
                              
                              <div className="col-span-1 sm:col-span-3 mt-2 pt-3 border-t border-slate-200 flex justify-end">
                                <button 
                                  onClick={() => { 
                                    setEditingItemId(item.id); 
                                    setTempSNValue(item.sn); 
                                    setTempModelValue(item.model);
                                    setTempCostValue(item.itemCost);
                                    setTempPurchaseDateValue(item.purchaseDate);
                                    setTempWarrantyDateValue(item.warrantyDate);
                                  }}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center justify-center gap-1.5 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 transition-all shadow-sm w-full sm:w-auto"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  แก้ไขข้อมูลรายชิ้น
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
        </div>
        
        <div className="p-5 md:p-6 bg-slate-50 flex flex-wrap justify-end gap-3 border-t border-slate-200 shrink-0">
           {selectedAssetCategory === 'assets' && (
             (!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
               <button onClick={() => { setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory }); closeAll(); }} className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold transition-colors border border-indigo-200 mr-auto flex items-center gap-2 text-sm md:text-base shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> เบิกจ่าย</button>
             ) : (
               <button onClick={() => { handleCheckin(currentAssetDetail.id, selectedAssetCategory); closeAll(); }} className="px-6 py-3 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 font-bold transition-colors border border-teal-200 mr-auto flex items-center gap-2 text-sm md:text-base shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> รับคืน</button>
             )
           )}

           {selectedAssetCategory === 'assets' && (
             <button onClick={() => setShowLabelPreview(true)} className="px-4 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 font-bold transition-colors shadow-sm text-sm md:text-base flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg> 
               Generate Label
             </button>
           )}

           <button onClick={() => { if (selectedAssetCategory === 'licenses') { openEditLicenseModal(currentAssetDetail); } else { openEditAssetModal(currentAssetDetail, selectedAssetCategory); } closeAll(); }} className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-bold transition-colors border border-amber-200 text-sm md:text-base shadow-sm">แก้ไขข้อมูล</button>
           <button onClick={closeAll} className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold transition-colors shadow-md text-sm md:text-base">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}