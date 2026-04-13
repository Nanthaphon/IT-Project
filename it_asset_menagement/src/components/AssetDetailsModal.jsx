import React from 'react';

export default function AssetDetailsModal({
  selectedAssetDetail,
  setSelectedAssetDetail,
  selectedAssetCategory,
  setSelectedAssetCategory,
  accessories,
  assets,
  licenses,
  setCheckoutModal,
  setReturnModal,
  handleCheckin,
  openEditLicenseModal,
  openEditAssetModal
}) {
  // ถ้าไม่มีการเลือกดูรายละเอียด (เป็น null) จะไม่แสดง Modal
  if (!selectedAssetDetail) return null;

  // หาข้อมูลล่าสุดจาก state เพื่อให้จำนวนและสถานะอัปเดตแบบเรียลไทม์
  const currentAssetDetail = 
    selectedAssetCategory === 'accessories' ? (accessories.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
    selectedAssetCategory === 'assets' ? (assets.find(a => a.id === selectedAssetDetail.id) || selectedAssetDetail) :
    (licenses.find(l => l.id === selectedAssetDetail.id) || selectedAssetDetail);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-slate-800 text-white p-5 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg text-sm">📋</span> รายละเอียด{selectedAssetCategory === 'assets' ? 'ทรัพย์สินหลัก' : selectedAssetCategory === 'accessories' ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}
          </h3>
          <button 
            onClick={() => { setSelectedAssetDetail(null); setSelectedAssetCategory(''); }} 
            className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto space-y-4 text-sm md:text-base text-slate-800 flex-1">
          <div className="bg-white rounded-xl">
            
            {/* ✅ แสดงรูปภาพเด่นชัดที่ด้านบน (ถ้ามี) */}
            {currentAssetDetail.image && selectedAssetCategory !== 'licenses' && (
              <div className="mb-6 flex justify-center border-b border-slate-100 pb-6">
                <img 
                  src={currentAssetDetail.image} 
                  alt="Asset Preview" 
                  className="max-h-48 md:max-h-56 rounded-xl object-contain shadow-sm border border-slate-200" 
                />
              </div>
            )}

            {selectedAssetCategory === 'licenses' ? (
              <>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 mt-2">
                  <span className="text-slate-500 font-bold text-sm md:text-base">ชื่อโปรแกรม:</span>
                  <span className="col-span-2 font-black text-indigo-700 text-lg md:text-xl">{currentAssetDetail.name}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                  <span className="text-slate-500 font-bold text-sm md:text-base">Product Key:</span>
                  <span className="col-span-2 font-mono bg-slate-100 px-3 py-1 rounded-lg w-fit text-slate-700 text-base">{currentAssetDetail.productKey || '-'}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                  <span className="text-slate-500 font-bold text-sm md:text-base">รหัสอ้างอิง Key:</span>
                  <span className="col-span-2 font-medium">{currentAssetDetail.keyCode || '-'}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                  <span className="text-slate-500 font-bold text-sm md:text-base">Supplier ที่ซื้อ:</span>
                  <span className="col-span-2 font-medium">{currentAssetDetail.supplier || '-'}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                  <span className="text-slate-500 font-bold text-sm md:text-base">วันที่ซื้อ:</span>
                  <span className="col-span-2 font-medium">{currentAssetDetail.purchaseDate || '-'}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                  <span className="text-slate-500 font-bold text-sm md:text-base">วันที่หมดอายุ:</span>
                  <span className="col-span-2 font-medium">{currentAssetDetail.expirationDate || '-'}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                  <span className="text-slate-500 font-bold text-sm md:text-base">ราคา:</span>
                  <span className="col-span-2 font-bold text-emerald-600 text-lg">{currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 mt-2 items-center">
                  <span className="text-slate-500 font-bold text-sm md:text-base">ชื่ออุปกรณ์:</span>
                  <span className="col-span-2 font-black text-indigo-700 text-lg md:text-xl">{currentAssetDetail.name}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                  <span className="text-slate-500 font-bold text-sm md:text-base">ประเภท:</span>
                  <span className="col-span-2 font-medium">
                    <span className="bg-slate-100 text-slate-600 text-sm px-4 py-2 rounded-full font-bold border border-slate-200">
                      {currentAssetDetail.type}
                    </span>
                  </span>
                </div>
                {selectedAssetCategory === 'accessories' && (
                  <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                    <span className="text-slate-500 font-bold text-sm md:text-base">จำนวนคงเหลือ:</span>
                    <span className="col-span-2 font-medium text-lg">
                      {currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0))} ชิ้น
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                  <span className="text-slate-500 font-bold text-sm md:text-base">ราคา:</span>
                  <span className="col-span-2 font-bold text-emerald-600 text-lg">
                    {currentAssetDetail.cost ? `฿${Number(currentAssetDetail.cost).toLocaleString()}` : '-'}
                  </span>
                </div>
              </>
            )}
            
            {selectedAssetCategory !== 'accessories' && (
              <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 items-center">
                <span className="text-slate-500 font-bold text-sm md:text-base">สถานะ:</span>
                <span className="col-span-2">
                  {(!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
                    <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> พร้อมใช้งาน
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> {currentAssetDetail.status}
                    </span>
                  )}
                </span>
              </div>
            )}
            
            {selectedAssetCategory === 'accessories' ? (
              <div className="grid grid-cols-3 pt-3 md:pt-4">
                <span className="text-slate-500 font-bold text-sm md:text-base pt-2">ผู้ครอบครอง:</span>
                <span className="col-span-2 font-medium space-y-3">
                  {currentAssetDetail.assignees && currentAssetDetail.assignees.length > 0 ? (
                    currentAssetDetail.assignees.map((assignee) => (
                      <div key={assignee.checkoutId} className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-base text-slate-800 font-bold">👤 {assignee.empName}</span>
                        <button 
                          onClick={() => {
                            setReturnModal({
                              isOpen: true,
                              assetId: currentAssetDetail.id,
                              checkoutId: assignee.checkoutId,
                              empId: assignee.empId,
                              empName: assignee.empName,
                              assetName: currentAssetDetail.name
                            });
                          }}
                          className="text-sm bg-teal-50 text-teal-700 hover:bg-teal-500 hover:text-white border border-teal-200 hover:border-teal-500 px-4 py-2 rounded-lg font-bold transition-all shadow-sm"
                        >
                          รับคืน
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400 block mt-2">- ไม่มีผู้ครอบครอง -</span>
                  )}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-3 pt-3 md:pt-4">
                <span className="text-slate-500 font-bold text-sm md:text-base">ผู้ครอบครอง:</span>
                <span className="col-span-2 font-medium">
                  {currentAssetDetail.assignedName ? `👤 ${currentAssetDetail.assignedName}` : '-'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-5 md:p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-200">
           {selectedAssetCategory === 'accessories' ? (
             ((currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0))) > 0) && (
               <button 
                 onClick={() => {
                   setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory });
                 }} 
                 className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold transition-colors border border-indigo-200 mr-auto flex items-center gap-2 text-sm md:text-base"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                 เบิกจ่าย ({(currentAssetDetail.quantity ? (Number(currentAssetDetail.quantity) - (currentAssetDetail.assignees?.length || 0)) : (1 - (currentAssetDetail.assignees?.length || 0)))})
               </button>
             )
           ) : (
             (!currentAssetDetail.status || currentAssetDetail.status === 'พร้อมใช้งาน') ? (
               <button 
                 onClick={() => {
                   setCheckoutModal({ isOpen: true, assetId: currentAssetDetail.id, collectionName: selectedAssetCategory });
                   setSelectedAssetDetail(null);
                   setSelectedAssetCategory('');
                 }} 
                 className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold transition-colors border border-indigo-200 mr-auto flex items-center gap-2 text-sm md:text-base"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                 เบิกจ่าย
               </button>
             ) : (
               <button 
                 onClick={() => {
                   handleCheckin(currentAssetDetail.id, selectedAssetCategory);
                   setSelectedAssetDetail(null);
                   setSelectedAssetCategory('');
                 }} 
                 className="px-6 py-3 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 font-bold transition-colors border border-teal-200 mr-auto flex items-center gap-2 text-sm md:text-base"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                 รับคืน
               </button>
             )
           )}
           
           <button 
             onClick={() => {
               if (selectedAssetCategory === 'licenses') {
                 openEditLicenseModal(currentAssetDetail);
               } else {
                 openEditAssetModal(currentAssetDetail, selectedAssetCategory);
               }
               setSelectedAssetDetail(null);
               setSelectedAssetCategory('');
             }} 
             className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-bold transition-colors border border-amber-200 text-sm md:text-base"
           >
             แก้ไขข้อมูล
           </button>
           <button 
             onClick={() => { setSelectedAssetDetail(null); setSelectedAssetCategory(''); }} 
             className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold transition-colors shadow-md text-sm md:text-base"
           >
             ปิดหน้าต่าง
           </button>
        </div>
      </div>
    </div>
  );
}