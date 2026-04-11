import React from 'react';

export default function CheckoutModal({
  checkoutModal, 
  setCheckoutModal,
  handleCheckout,
  checkoutSearchTerm, 
  setCheckoutSearchTerm,
  checkoutEmpId, 
  setCheckoutEmpId,
  employees
}) {
  // ถ้า State เป็น false ไม่ต้องแสดง Modal
  if (!checkoutModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all border border-slate-100">
        <div className="bg-indigo-600 text-white px-6 py-5 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg">📤</span> ระบุพนักงานที่เบิกจ่าย
          </h3>
          <button 
            onClick={() => { 
              setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' }); 
              setCheckoutEmpId(''); 
              setCheckoutSearchTerm(''); 
            }} 
            className="text-indigo-200 hover:text-white transition-colors focus:outline-none bg-indigo-700/50 hover:bg-indigo-700 p-1.5 rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleCheckout} className="p-6 md:p-8 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ค้นหาพนักงาน</label>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="พิมพ์ชื่อ หรือ รหัสพนักงาน..."
                value={checkoutSearchTerm}
                onChange={(e) => setCheckoutSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm transition-all shadow-sm"
              />
            </div>
            <label className="block text-sm font-bold text-slate-700 mb-2">เลือกพนักงาน</label>
            <select 
              value={checkoutEmpId}
              onChange={(e) => setCheckoutEmpId(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm text-slate-700 transition-all shadow-sm cursor-pointer"
              required
            >
              <option value="" disabled>-- เลือกพนักงาน --</option>
              {employees.filter(emp => {
                const term = checkoutSearchTerm.toLowerCase();
                return (emp.fullName?.toLowerCase().includes(term) || 
                        emp.fullNameEng?.toLowerCase().includes(term) ||
                        emp.empId?.toLowerCase().includes(term) ||
                        emp.nickname?.toLowerCase().includes(term));
              }).map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.empId} - {emp.fullName} {emp.nickname ? `(${emp.nickname})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => { 
                setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' }); 
                setCheckoutEmpId(''); 
                setCheckoutSearchTerm(''); 
              }}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              ยืนยันเบิกจ่าย
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}