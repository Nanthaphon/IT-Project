import React, { useState, useRef, useEffect } from 'react';

export default function CheckoutModal({
  checkoutModal, setCheckoutModal, handleCheckout,
  checkoutSearchTerm, setCheckoutSearchTerm,
  checkoutEmpId, setCheckoutEmpId, employees,
  checkoutRemarks, setCheckoutRemarks
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  if (!checkoutModal.isOpen) return null;

  const filteredEmployees = employees.filter(emp => {
    const term = checkoutSearchTerm.toLowerCase();
    return (emp.fullName?.toLowerCase().includes(term) || emp.fullNameEng?.toLowerCase().includes(term) || emp.empId?.toLowerCase().includes(term) || emp.nickname?.toLowerCase().includes(term));
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full min-h-[500px] flex flex-col overflow-hidden transform transition-all border border-slate-100">
        <div className="bg-indigo-600 text-white px-6 py-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-xl flex items-center gap-2"><span className="bg-white/20 p-1.5 rounded-lg">📤</span> ระบุพนักงานที่เบิกจ่าย</h3>
          <button onClick={() => { setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' }); setCheckoutEmpId(''); setCheckoutSearchTerm(''); setCheckoutRemarks(''); setIsDropdownOpen(false); }} className="text-indigo-200 hover:text-white transition-colors focus:outline-none bg-indigo-700/50 hover:bg-indigo-700 p-1.5 rounded-xl">
            <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={(e) => { if (!checkoutEmpId) { e.preventDefault(); return; } handleCheckout(e); }} className="p-6 md:p-8 flex flex-col flex-1 overflow-y-auto">
          
          <div ref={wrapperRef} className="relative">
            <label className="block text-base font-bold text-slate-700 mb-2">ค้นหาและเลือกพนักงาน <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
              <input
                type="text" placeholder="พิมพ์ชื่อ หรือ รหัสพนักงาน..." value={checkoutSearchTerm}
                onChange={(e) => { setCheckoutSearchTerm(e.target.value); setCheckoutEmpId(''); setIsDropdownOpen(true); }}
                onFocus={() => setIsDropdownOpen(true)}
                className={`w-full pl-11 pr-4 py-3.5 border rounded-xl outline-none bg-white text-base transition-all shadow-sm ${!checkoutEmpId && checkoutSearchTerm ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'}`} autoComplete="off"
              />
            </div>
            
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[300px] overflow-y-auto">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(emp => (
                    <div key={emp.id} className={`px-5 py-3.5 cursor-pointer hover:bg-indigo-50 transition-colors flex items-center gap-4 border-b border-slate-50 last:border-b-0 ${checkoutEmpId === emp.id ? 'bg-indigo-50' : ''}`}
                      onClick={() => { setCheckoutEmpId(emp.id); setCheckoutSearchTerm(`${emp.empId} - ${emp.fullName} ${emp.nickname ? `(${emp.nickname})` : ''}`); setIsDropdownOpen(false); }}
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">{emp.fullName?.charAt(0) || '?'}</div>
                      <div className="flex-1 min-w-0"><div className="font-bold text-slate-800 text-base truncate">{emp.fullName} {emp.nickname ? `(${emp.nickname})` : ''}</div><div className="text-sm text-slate-500 font-medium truncate">{emp.empId} • {emp.department || '-'}</div></div>
                      {checkoutEmpId === emp.id && (<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="h-6 w-6 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>)}
                    </div>
                  ))
                ) : (<div className="p-5 text-center text-base text-slate-500 font-medium">ไม่พบข้อมูลพนักงาน</div>)}
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-base font-bold text-slate-700 mb-2">เหตุผล / หมายเหตุ (ถ้ามี)</label>
            <textarea value={checkoutRemarks} onChange={(e) => setCheckoutRemarks(e.target.value)} className="w-full border border-slate-300 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base transition-all resize-none shadow-sm" placeholder="ระบุเหตุผลการเบิกจ่าย หรือหมายเหตุเพิ่มเติม..." rows="2"></textarea>
          </div>
          
          <div className="flex gap-4 pt-5 border-t border-slate-100 mt-auto shrink-0">
            <button type="button" onClick={() => { setCheckoutModal({ isOpen: false, assetId: null, collectionName: '' }); setCheckoutEmpId(''); setCheckoutSearchTerm(''); setCheckoutRemarks(''); setIsDropdownOpen(false); }} className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold text-base transition-all">ยกเลิก</button>
            <button type="submit" disabled={!checkoutEmpId} className={`flex-1 py-3.5 text-white rounded-xl font-bold text-base transition-all shadow-lg ${checkoutEmpId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30' : 'bg-slate-300 cursor-not-allowed shadow-none'}`}>ยืนยันเบิกจ่าย</button>
          </div>
        </form>
      </div>
    </div>
  );
}