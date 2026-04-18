import React, { useState } from 'react';
import { db } from '../firebase'; // ✅ ตรวจสอบว่าไฟล์ firebase.js อยู่ในโฟลเดอร์ src
import { doc, updateDoc } from 'firebase/firestore';

export default function AssetDetailsModal({
  selectedAssetDetail, setSelectedAssetDetail, selectedAssetCategory, setSelectedAssetCategory,
  accessories, assets, licenses, setCheckoutModal, setReturnModal, handleCheckin, openEditLicenseModal, openEditAssetModal
}) {
  const [expandedItem, setExpandedItem] = useState(null); // ควบคุมการเปิด-ปิดแถวรายการย่อย
  const [editingSNId, setEditingSNId] = useState(null); // เก็บ ID ของชิ้นที่กำลังแก้ไข SN
  const [tempSNValue, setTempSNValue] = useState(''); // เก็บค่าที่พิมพ์ในช่อง Input
  const [isSavingSN, setIsSavingSN] = useState(false); // สถานะระหว่างบันทึก

  if (!selectedAssetDetail) return null;

  // ดึงข้อมูลล่าสุดจากรายการอุปกรณ์ที่มีอยู่
  const currentAssetDetail = 
    selectedAssetCategory === 'accessories' ? (accessories.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
    selectedAssetCategory === 'assets' ? (assets.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
    (licenses.find(l => l.id === selectedAssetDetail.id) || selectedAssetDetail);

  // ✅ ฟังก์ชันบันทึก Serial Number แยกรายชิ้นลง Firestore
  const handleSaveSN = async (item) => {
    if (isSavingSN) return;
    setIsSavingSN(true);
    try {
      const docRef = doc(db, selectedAssetCategory, currentAssetDetail.id);
      
      if (item.type === 'available') {
        const newSNs = [...(currentAssetDetail.availableSNs || [])];
        while (newSNs.length <= item.originalIndex) newSNs.push('');
        newSNs[item.originalIndex] = tempSNValue.trim();
        await updateDoc(docRef, { availableSNs: newSNs });
      } 
      else if (item.type === 'assigned') {
        const newAssignees = [...(currentAssetDetail.assignees || [])];
        const idx = newAssignees.findIndex(a => a.checkoutId === item.assignee.checkoutId);
        if (idx !== -1) {
          newAssignees[idx].serialNumber = tempSNValue.trim();
          await updateDoc(docRef, { assignees: newAssignees });
        }
      } 
      else if (item.type === 'broken') {
        const newSNs = [...(currentAssetDetail.brokenSNs || [])];
        while (newSNs.length <= item.originalIndex) newSNs.push('');
        newSNs[item.originalIndex] = tempSNValue.trim();
        await updateDoc(docRef, { brokenSNs: newSNs });
      }
      setEditingSNId(null);
    } catch (error) {
      console.error("Error updating SN:", error);
    } finally {
      setIsSavingSN(false);
    }
  };

  // เตรียมข้อมูลรายการอุปกรณ์แยกรายชิ้น (เฉพาะอุปกรณ์เสริม)
  let individualItems = [];
  if (selectedAssetCategory === 'accessories') {
    const totalQty = currentAssetDetail.quantity ? Number(currentAssetDetail.quantity) : 1;
    const assigneesCount = currentAssetDetail.assignees?.length || 0;
    const availableCount = Math.max(0, totalQty - assigneesCount);
    const brokenCount = Number(currentAssetDetail.brokenQuantity || 0);

    // 1. ชิ้นที่พร้อมใช้งาน
    for (let i = 0; i < availableCount; i++) {
      individualItems.push({ 
        type: 'available', status: 'พร้อมใช้งาน', 
        sn: currentAssetDetail.availableSNs?.[i] || '', 
        id: `avail-${i}`, originalIndex: i
      });
    }
    // 2. ชิ้นที่ถูกใช้งาน (ครอบครอง)
    if (currentAssetDetail.assignees) {
      currentAssetDetail.assignees.forEach((a, i) => {
        individualItems.push({ 
          type: 'assigned', status: 'ถูกใช้งาน', 
          assignee: a, sn: a.serialNumber || '', 
          id: `assign-${a.checkoutId || i}`, originalIndex: i
        });
      });
    }
    // 3. ชิ้นที่ชำรุด
    for (let i = 0; i < brokenCount; i++) {
      individualItems.push({ 
        type: 'broken', status: 'ชำรุดเสียหาย', 
        sn: currentAssetDetail.brokenSNs?.[i] || '', 
        id: `broken-${i}`, originalIndex: i
      });
    }
  }

  const closeAll = () => {
    setSelectedAssetDetail(null);
    setSelectedAssetCategory('');
    setExpandedItem(null);
    setEditingSNId(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-slate-800 text-white p-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg text-sm">📋</span> 
            รายละเอียด{selectedAssetCategory === 'assets' ? 'ทรัพย์สินหลัก' : selectedAssetCategory === 'accessories' ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}
          </h3>
          <button onClick={closeAll} className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto space-y-4 text-sm md:text-base text-slate-800 flex-1">
          <div className="bg-white rounded-xl">
            {selectedAssetCategory !== 'licenses' && (
              <div className="mb-6 flex justify-center border-b border-slate-100 pb-6">
                {currentAssetDetail.image ? (
                  <img src={currentAssetDetail.image} alt="Asset Preview" className="max-h-48 md:max-h-56 rounded-xl object-contain shadow-sm border border-slate-200" />
                ) : (
                  <div className="w-full max-w-sm h-32 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-400 border-2 border-slate-200 border-dashed">
                    <span className="text-3xl mb-2">📷</span>
                    <span className="text-sm font-medium">ไม่มีรูปภาพอ้างอิง</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 border-b border-slate-100 py-3 items-center">
              <span className="text-slate-500 font-bold">ชื่อรายการ:</span>
              <span className="col-span-2 font-black text-indigo-700 text-lg">{currentAssetDetail.name}</span>
            </div>
            <div className="grid grid-cols-3 border-b border-slate-100 py-3 items-center">
              <span className="text-slate-500 font-bold">ราคาเฉลี่ยต่อหน่วย:</span>
              <span className="col-span-2 font-bold text-emerald-600">{currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}</span>
            </div>

            {/* ส่วนสำหรับอุปกรณ์เสริม: รายการรายชิ้นพร้อมปุ่มจัดการ SN */}
            {selectedAssetCategory === 'accessories' && (
              <div className="pt-6 mt-4 border-t border-slate-100">
                <h4 className="text-slate-800 font-bold text-base mb-4 flex items-center gap-2">
                  <span className="text-xl">📦</span> รายการอุปกรณ์แต่ละชิ้น ({individualItems.length} รายการ)
                </h4>
                
                <div className="space-y-3">
                  {individualItems.map((item, index) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
                      <div 
                        onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                            item.type === 'available' ? 'bg-emerald-100 text-emerald-600' :
                            item.type === 'assigned' ? 'bg-blue-100 text-blue-600' :
                            'bg-red-100 text-red-600'
                          }`}>{index + 1}</div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">
                              {item.type === 'assigned' ? `👤 ${item.assignee.empName}` : `อุปกรณ์ชิ้นที่ ${index + 1}`}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">SN: {item.sn || 'ยังไม่ระบุ'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {item.type === 'available' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCheckoutModal({ 
                                  isOpen: true, assetId: currentAssetDetail.id, 
                                  collectionName: selectedAssetCategory,
                                  sn: item.sn, snIndex: item.originalIndex
                                });
                              }}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors"
                            >
                              เบิกจ่าย
                            </button>
                          ) : item.type === 'assigned' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReturnModal({
                                  isOpen: true, assetId: currentAssetDetail.id, checkoutId: item.assignee.checkoutId,
                                  empId: item.assignee.empId, empName: item.assignee.empName, assetName: currentAssetDetail.name
                                });
                              }}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold border bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-600 hover:text-white transition-colors"
                            >
                              รับคืน
                            </button>
                          ) : (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold border bg-red-50 text-red-600 border-red-200">
                              {item.status}
                            </span>
                          )}
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${expandedItem === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                      
                      {expandedItem === index && (
                        <div className="p-5 bg-slate-50 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><span className="block text-xs font-bold text-slate-500 mb-1">ชื่ออุปกรณ์</span><span className="text-sm font-semibold text-slate-800">{currentAssetDetail.name}</span></div>
                            <div><span className="block text-xs font-bold text-slate-500 mb-1">ราคา/ชิ้น</span><span className="text-sm font-semibold text-emerald-600">฿{Number(currentAssetDetail.cost || 0).toLocaleString()}</span></div>
                            
                            {/* ✅ ส่วนจัดการ Serial Number (Inline Editor) */}
                            <div className="col-span-1 sm:col-span-2 mt-2 pt-2 border-t border-slate-200">
                              <span className="block text-xs font-bold text-slate-700 mb-2 uppercase">Serial Number อุปกรณ์</span>
                              {editingSNId === item.id ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="text" value={tempSNValue} onChange={(e) => setTempSNValue(e.target.value)}
                                    className="flex-1 max-w-sm border border-indigo-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                    placeholder="กรอก Serial Number..." autoFocus
                                  />
                                  <button onClick={() => handleSaveSN(item)} disabled={isSavingSN} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                    {isSavingSN ? '...' : 'บันทึก'}
                                  </button>
                                  <button onClick={() => setEditingSNId(null)} className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">ยกเลิก</button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-mono text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm min-w-[150px]">
                                    {item.sn || 'ยังไม่ระบุข้อมูล'}
                                  </span>
                                  <button 
                                    onClick={() => { setEditingSNId(item.id); setTempSNValue(item.sn); }}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all shadow-sm"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    {item.sn ? 'แก้ไข SN' : 'เพิ่ม SN'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
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
           <button onClick={() => { if (selectedAssetCategory === 'licenses') { openEditLicenseModal(currentAssetDetail); } else { openEditAssetModal(currentAssetDetail, selectedAssetCategory); } closeAll(); }} className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-bold border border-amber-200 text-sm shadow-sm">แก้ไขข้อมูลภาพรวม</button>
           <button onClick={closeAll} className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold shadow-lg text-sm">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}