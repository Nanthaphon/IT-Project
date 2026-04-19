import React, { useState } from 'react';
import { db } from '../firebase'; 
import { doc, updateDoc } from 'firebase/firestore';

export default function AssetDetailsModal({
  selectedAssetDetail, setSelectedAssetDetail, selectedAssetCategory, setSelectedAssetCategory,
  accessories, assets, licenses, setCheckoutModal, setReturnModal, handleCheckin, openEditLicenseModal, openEditAssetModal
}) {
  const [expandedItem, setExpandedItem] = useState(null); 
  const [editingItemId, setEditingItemId] = useState(null); 
  const [tempSNValue, setTempSNValue] = useState(''); 
  const [tempCostValue, setTempCostValue] = useState(''); 
  const [isSavingItem, setIsSavingItem] = useState(false); 

  if (!selectedAssetDetail) return null;

  const currentAssetDetail = 
    selectedAssetCategory === 'accessories' ? (accessories.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
    selectedAssetCategory === 'assets' ? (assets.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
    (licenses.find(l => l.id === selectedAssetDetail.id) || selectedAssetDetail);

  // ✅ ฟังก์ชันบันทึก ข้อมูลแยกรายชิ้น (SN, ราคา) ลง Firestore โดยไม่ยุ่งกับชื่อ
  const handleSaveItemDetails = async (item) => {
    if (isSavingItem) return;
    setIsSavingItem(true);
    try {
      const docRef = doc(db, selectedAssetCategory, currentAssetDetail.id);
      
      if (item.type === 'available') {
        const newSNs = [...(currentAssetDetail.availableSNs || [])];
        const newCosts = [...(currentAssetDetail.availableCosts || [])];

        while (newSNs.length <= item.originalIndex) newSNs.push('');
        while (newCosts.length <= item.originalIndex) newCosts.push('');

        newSNs[item.originalIndex] = tempSNValue.trim();
        newCosts[item.originalIndex] = tempCostValue.trim();

        await updateDoc(docRef, { 
          availableSNs: newSNs, availableCosts: newCosts 
        });
      } 
      else if (item.type === 'assigned') {
        const newAssignees = [...(currentAssetDetail.assignees || [])];
        const idx = newAssignees.findIndex(a => a.checkoutId === item.assignee.checkoutId);
        if (idx !== -1) {
          newAssignees[idx].serialNumber = tempSNValue.trim();
          newAssignees[idx].customCost = tempCostValue.trim();
          await updateDoc(docRef, { assignees: newAssignees });
        }
      } 
      else if (item.type === 'broken') {
        const newSNs = [...(currentAssetDetail.brokenSNs || [])];
        const newCosts = [...(currentAssetDetail.brokenCosts || [])];

        while (newSNs.length <= item.originalIndex) newSNs.push('');
        while (newCosts.length <= item.originalIndex) newCosts.push('');

        newSNs[item.originalIndex] = tempSNValue.trim();
        newCosts[item.originalIndex] = tempCostValue.trim();

        await updateDoc(docRef, { 
          brokenSNs: newSNs, brokenCosts: newCosts 
        });
      }
      setEditingItemId(null);
    } catch (error) {
      console.error("Error updating item details:", error);
    } finally {
      setIsSavingItem(false);
    }
  };

  // เตรียมข้อมูลรายการอุปกรณ์แยกรายชิ้น
  let individualItems = [];
  if (selectedAssetCategory === 'accessories') {
    const totalQty = currentAssetDetail.quantity ? Number(currentAssetDetail.quantity) : 1;
    const assigneesCount = currentAssetDetail.assignees?.length || 0;
    const availableCount = Math.max(0, totalQty - assigneesCount);
    const brokenCount = Number(currentAssetDetail.brokenQuantity || 0);

    for (let i = 0; i < availableCount; i++) {
      individualItems.push({ 
        type: 'available', status: 'พร้อมใช้งาน', 
        sn: currentAssetDetail.availableSNs?.[i] || '', 
        itemCost: currentAssetDetail.availableCosts?.[i] || currentAssetDetail.cost,
        id: `avail-${i}`, originalIndex: i
      });
    }
    if (currentAssetDetail.assignees) {
      currentAssetDetail.assignees.forEach((a, i) => {
        individualItems.push({ 
          type: 'assigned', status: 'ถูกใช้งาน', 
          assignee: a, sn: a.serialNumber || '', 
          itemCost: a.customCost || currentAssetDetail.cost,
          id: `assign-${a.checkoutId || i}`, originalIndex: i
        });
      });
    }
    for (let i = 0; i < brokenCount; i++) {
      individualItems.push({ 
        type: 'broken', status: 'ชำรุดเสียหาย', 
        sn: currentAssetDetail.brokenSNs?.[i] || '', 
        itemCost: currentAssetDetail.brokenCosts?.[i] || currentAssetDetail.cost,
        id: `broken-${i}`, originalIndex: i
      });
    }
  }

  const closeAll = () => {
    setSelectedAssetDetail(null);
    setSelectedAssetCategory('');
    setExpandedItem(null);
    setEditingItemId(null);
  };

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
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">ประเภท:</span><span className="col-span-2 font-medium"><span className="bg-slate-100 text-slate-600 text-sm px-4 py-2 rounded-full font-bold border border-slate-200">{currentAssetDetail.type}</span></span></div>
                {selectedAssetCategory === 'assets' && (
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">แผนก:</span><span className="col-span-2 font-bold text-indigo-700 text-lg">{currentAssetDetail.department || '-'}</span></div>
                )}
                {selectedAssetCategory === 'accessories' && (
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                    <span className="text-slate-500 font-bold text-sm md:text-base">จำนวนคงเหลือ:</span>
                    <span className="col-span-2 font-medium text-lg">{currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0))} ชิ้น</span>
                  </div>
                )}
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center"><span className="text-slate-500 font-bold text-sm md:text-base">{selectedAssetCategory === 'accessories' ? 'ราคาเฉลี่ยต่อหน่วย:' : 'ราคา:'}</span><span className="col-span-2 font-bold text-emerald-600 text-lg">{currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}</span></div>
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

            {/* ส่วนสำหรับอุปกรณ์เสริม: รายการรายชิ้นพร้อมปุ่มจัดการ SN และราคา */}
            {selectedAssetCategory === 'accessories' && (
              <div className="pt-6 mt-4 border-t border-slate-100">
                <h4 className="text-slate-800 font-bold text-base mb-4 flex items-center gap-2"><span className="text-xl">📦</span> รายการอุปกรณ์แต่ละชิ้น ({individualItems.length} รายการ)</h4>
                
                <div className="space-y-3">
                  {individualItems.map((item, index) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
                      <div 
                        onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${item.type === 'available' ? 'bg-emerald-100 text-emerald-600' : item.type === 'assigned' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>{index + 1}</div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">
                              {item.type === 'assigned' ? `👤 ${item.assignee.empName}` : `${currentAssetDetail.name} ชิ้นที่ ${index + 1}`}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">SN: {item.sn || 'ยังไม่ระบุ'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.type === 'available' ? (
                            <button onClick={(e) => { e.stopPropagation(); setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory, sn: item.sn, snIndex: item.originalIndex, itemCost: item.itemCost }); }} className="px-4 py-1.5 rounded-lg text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors">เบิกจ่าย</button>
                          ) : item.type === 'assigned' ? (
                            <button onClick={(e) => { e.stopPropagation(); setReturnModal({ isOpen: true, assetId: currentAssetDetail.id, checkoutId: item.assignee.checkoutId, empId: item.assignee.empId, empName: item.assignee.empName, assetName: currentAssetDetail.name }); }} className="px-4 py-1.5 rounded-lg text-xs font-bold border bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-600 hover:text-white transition-colors">รับคืน</button>
                          ) : <span className="px-3 py-1 rounded-lg text-xs font-bold border bg-red-50 text-red-600 border-red-200">{item.status}</span>}
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform ${expandedItem === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                      
                      {expandedItem === index && (
                        <div className="p-5 bg-slate-50 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                          {editingItemId === item.id ? (
                            // ✅ โหมดแก้ไขข้อมูล (ไม่สามารถแก้ชื่อได้)
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่ออุปกรณ์ (เฉพาะชิ้นนี้)</label>
                                  <div className="w-full border border-slate-200 bg-slate-200/50 p-2.5 rounded-lg text-sm font-semibold text-slate-500 cursor-not-allowed">
                                    {currentAssetDetail.name}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ราคา/ชิ้น</label>
                                  <input 
                                    type="number" value={tempCostValue} onChange={(e) => setTempCostValue(e.target.value)}
                                    className="w-full border border-indigo-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner bg-white"
                                    placeholder={currentAssetDetail.cost || '0'}
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serial Number อุปกรณ์</label>
                                  <input 
                                    type="text" value={tempSNValue} onChange={(e) => setTempSNValue(e.target.value)}
                                    className="w-full border border-indigo-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono shadow-inner bg-white"
                                    placeholder="กรอก Serial Number..." autoFocus
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
                            // ✅ โหมดแสดงข้อมูลปกติ
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div><span className="block text-xs font-bold text-slate-500 mb-1">ชื่ออุปกรณ์</span><span className="text-sm font-semibold text-slate-800">{currentAssetDetail.name}</span></div>
                              <div><span className="block text-xs font-bold text-slate-500 mb-1">ราคา/ชิ้น</span><span className="text-sm font-semibold text-emerald-600">{item.itemCost ? `฿${Number(item.itemCost).toLocaleString()}` : '-'}</span></div>
                              
                              <div className="col-span-1 sm:col-span-2 mt-2 pt-3 border-t border-slate-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div>
                                    <span className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Serial Number อุปกรณ์</span>
                                    <span className="text-sm font-mono text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm inline-block min-w-[150px]">
                                      {item.sn || 'ยังไม่ระบุข้อมูล'}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => { 
                                      setEditingItemId(item.id); 
                                      setTempSNValue(item.sn); 
                                      setTempCostValue(item.itemCost !== currentAssetDetail.cost ? item.itemCost : '');
                                    }}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center justify-center gap-1.5 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 transition-all shadow-sm w-full sm:w-auto mt-2 sm:mt-0"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    แก้ไขข้อมูลรายชิ้น
                                  </button>
                                </div>
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
        
        <div className="p-5 md:p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-200 shrink-0">
           {selectedAssetCategory === 'accessories' ? (
             ((currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0))) > 0) && (
               <button onClick={() => { setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory }); closeAll(); }} className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold transition-colors border border-indigo-200 mr-auto flex items-center gap-2 text-sm md:text-base shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> เบิกจ่าย ({(currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0)))})</button>
             )
           ) : (
             (!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
               <button onClick={() => { setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory }); closeAll(); }} className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold transition-colors border border-indigo-200 mr-auto flex items-center gap-2 text-sm md:text-base shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> เบิกจ่าย</button>
             ) : (
               <button onClick={() => { handleCheckin(currentAssetDetail.id, selectedAssetCategory); closeAll(); }} className="px-6 py-3 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 font-bold transition-colors border border-teal-200 mr-auto flex items-center gap-2 text-sm md:text-base shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> รับคืน</button>
             )
           )}
           <button onClick={() => { if (selectedAssetCategory === 'licenses') { openEditLicenseModal(currentAssetDetail); } else { openEditAssetModal(currentAssetDetail, selectedAssetCategory); } closeAll(); }} className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-bold transition-colors border border-amber-200 text-sm md:text-base shadow-sm">แก้ไขข้อมูลภาพรวม</button>
           <button onClick={closeAll} className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold transition-colors shadow-md text-sm md:text-base">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}