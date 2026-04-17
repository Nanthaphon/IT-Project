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
        <div className="bg-blue-600 text-white px-6 py-5 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg text-sm">🔄</span> บันทึกนำอุปกรณ์กลับเข้าคลัง (ซ่อมเสร็จ)
          </h3>
          <button 
            onClick={() => {
              setRepairModal({ isOpen: false, assetId: null, assetName: null, maxRepair: 0, collectionName: '' });
              setRepairQuantity(1);
              setRepairRemarks('');
            }} 
            className="text-blue-200 hover:text-white transition-colors focus:outline-none bg-blue-700/50 hover:bg-blue-700 p-1.5 rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleConfirmRepair} className="p-6 md:p-8 space-y-5">
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
            <p className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wide">อุปกรณ์ที่ซ่อมเสร็จแล้ว</p>
            <p className="text-lg font-black text-blue-800">{repairModal.assetName}</p>
          </div>

          {/* แสดงช่องกรอกจำนวน เฉพาะเมื่อเป็นการซ่อมอุปกรณ์เสริม (ที่มีจำนวนให้ซ่อมมากกว่า 1) */}
          {repairModal.maxRepair > 1 ? (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">จำนวนที่นำกลับเข้าคลัง (ชิ้น) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                min="1" 
                max={repairModal.maxRepair}
                value={repairQuantity}
                onChange={(e) => setRepairQuantity(e.target.value)}
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                required
              />
              <p className="text-xs text-slate-500 mt-2 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                * นำกลับเข้าคลังได้สูงสุด <span className="font-bold text-blue-600">{repairModal.maxRepair}</span> ชิ้น (จากรายการที่ชำรุด)
              </p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">รายละเอียดการซ่อม / หมายเหตุ <span className="text-red-500">*</span></label>
            <textarea 
              value={repairRemarks}
              onChange={(e) => setRepairRemarks(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all resize-none shadow-sm"
              placeholder="ระบุรายละเอียดการแก้ไข เช่น เปลี่ยนสายใหม่, ซ่อมบอร์ด, เปลี่ยนหน้าจอ..."
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
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all shadow-sm"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ยืนยันนำกลับเข้าคลัง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}