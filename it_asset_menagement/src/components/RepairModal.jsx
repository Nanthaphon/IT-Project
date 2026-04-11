import React from 'react';

export default function RepairModal({
  repairModal,
  setRepairModal,
  repairQuantity,
  setRepairQuantity,
  repairRemarks,
  setRepairRemarks,
  handleConfirmRepair
}) {
  // ถ้า State เป็น false ไม่ต้องแสดงผล
  if (!repairModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all border border-slate-100">
        <div className="bg-red-500 text-white px-6 py-5 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-black/10 p-1.5 rounded-lg text-sm">🛠️</span> บันทึกแจ้งซ่อมแซม / ชำรุด
          </h3>
          <button 
            onClick={() => {
              setRepairModal({ isOpen: false, assetId: null, assetName: null, maxRepair: 0, collectionName: '' });
              setRepairQuantity(1);
              setRepairRemarks('');
            }} 
            className="text-red-100 hover:text-white transition-colors focus:outline-none bg-red-600/50 hover:bg-red-600 p-1.5 rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleConfirmRepair} className="p-6 md:p-8 space-y-5">
          <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
            <p className="text-xs text-red-500 font-bold mb-1 uppercase tracking-wide">อุปกรณ์ที่ต้องการแจ้งซ่อม</p>
            <p className="text-lg font-black text-red-700">{repairModal.assetName}</p>
          </div>

          {/* แสดงช่องกรอกจำนวน เฉพาะเมื่อเป็นการซ่อมอุปกรณ์เสริม (ที่มีจำนวนให้ซ่อมมากกว่า 1) */}
          {repairModal.maxRepair > 1 ? (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">จำนวนที่ต้องการแจ้งซ่อม (ชิ้น) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                min="1" 
                max={repairModal.maxRepair}
                value={repairQuantity}
                onChange={(e) => setRepairQuantity(e.target.value)}
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm transition-all shadow-sm"
                required
              />
              <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                * สามารถแจ้งซ่อมได้สูงสุด <span className="font-bold text-red-600">{repairModal.maxRepair}</span> ชิ้น จากที่ว่างในคลัง
              </p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">อาการเสีย / หมายเหตุ <span className="text-red-500">*</span></label>
            <textarea 
              value={repairRemarks}
              onChange={(e) => setRepairRemarks(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm transition-all resize-none shadow-sm"
              placeholder="ระบุอาการเสีย เช่น เปิดไม่ติด, หน้าจอแตก, ปุ่มกดไม่ได้..."
              rows="3"
              required
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => {
                setRepairModal({ isOpen: false, assetId: null, assetName: null, maxRepair: 0, collectionName: '' });
                setRepairQuantity(1);
                setRepairRemarks('');
              }}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ยืนยันการแจ้งซ่อม
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}