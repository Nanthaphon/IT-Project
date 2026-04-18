import React from 'react';

export default function ReturnModal({
  returnModal, setReturnModal, returnCondition, setReturnCondition,
  returnRemarks, setReturnRemarks, handleConfirmReturn
}) {
  if (!returnModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white px-6 py-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2"><span className="bg-white/20 p-1.5 rounded-lg text-sm">📥</span> ยืนยันการรับคืนอุปกรณ์</h3>
          <button onClick={() => { setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null }); setReturnCondition('good'); setReturnRemarks(''); }} className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-xl">
            <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleConfirmReturn} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium mb-1">อุปกรณ์ที่รับคืน</p>
            <p className="text-base font-bold text-slate-800 flex flex-col gap-1 items-start">
              {returnModal.assetName}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-1">รับคืนจาก</p>
              <p className="text-sm font-bold text-indigo-700 flex items-center gap-1.5">
                <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {returnModal.empName}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">ระบุสภาพอุปกรณ์ที่รับคืน</label>
            <div className="space-y-3">
              <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all shadow-sm ${returnCondition === 'good' ? 'bg-emerald-50 border-emerald-500' : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
                <input type="radio" name="condition" value="good" checked={returnCondition === 'good'} onChange={() => setReturnCondition('good')} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-gray-300" />
                <span className="ml-4 flex flex-col"><span className="text-base font-bold text-slate-800 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> สภาพปกติ (Good)</span><span className="text-sm text-slate-500 mt-1">นำกลับเข้าคลังเพื่อพร้อมใช้งานต่อ</span></span>
              </label>
              
              <label className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all shadow-sm ${returnCondition === 'broken' ? 'bg-red-50 border-red-500' : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
                <input type="radio" name="condition" value="broken" checked={returnCondition === 'broken'} onChange={() => setReturnCondition('broken')} className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300" />
                <span className="ml-4 flex flex-col"><span className="text-base font-bold text-slate-800 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> ชำรุด/ตัดจำหน่าย (Broken)</span><span className="text-sm text-slate-500 mt-1">บันทึกเป็นของเสีย ไม่นำกลับเข้าคลัง</span></span>
              </label>
            </div>

            <div className={`transition-all duration-300 overflow-hidden -mx-2 px-2 ${returnCondition === 'broken' ? 'max-h-[200px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
              <div className="pt-2 pb-3">
                <label className="block text-sm font-bold text-slate-700 mb-2 pl-1">หมายเหตุ <span className="text-red-500">*</span></label>
                <textarea value={returnRemarks} onChange={(e) => setReturnRemarks(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm transition-all resize-none shadow-sm block" placeholder="เช่น สายขาด, ลูกกลิ้งเลื่อนไม่ได้, เปิดไม่ติด..." rows="2" required={returnCondition === 'broken'}></textarea>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button type="button" onClick={() => { setReturnModal({ isOpen: false, assetId: null, checkoutId: null, empId: null, empName: null, assetName: null }); setReturnCondition('good'); setReturnRemarks(''); }} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all shadow-sm">ยกเลิก</button>
            <button type="submit" className={`flex-1 py-3 text-white rounded-xl font-bold transition-all shadow-lg ${returnCondition === 'good' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}>ยืนยันการรับคืน</button>
          </div>
        </form>
      </div>
    </div>
  );
}
