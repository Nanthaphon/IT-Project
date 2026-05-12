import React, { useState, useRef, useEffect } from 'react';

export default function EditEmpModal({
  editEmpModal,
  setEditEmpModal,
  handleUpdateEmployee,
  handleEditEmpChange,
  employees = [] // 🟢 รับข้อมูลพนักงานเข้ามาเพื่อใช้ใน Dropdown
}) {
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const managerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (managerRef.current && !managerRef.current.contains(event.target)) setIsManagerDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editEmpModal.isOpen || !editEmpModal.data) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-[#1E487A] text-white px-6 py-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg text-sm">✏️</span> แก้ไขข้อมูลพนักงาน
          </h3>
          <button onClick={() => setEditEmpModal({ isOpen: false, data: null })} className="text-blue-200 hover:text-white focus:outline-none bg-[#133257]/50 hover:bg-[#133257] p-1.5 rounded-xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleUpdateEmployee} className="p-6 md:p-8 overflow-y-auto space-y-5 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสพนักงาน <span className="text-red-500">*</span></label>
              <input type="text" name="empId" value={editEmpModal.data.empId || ''} onChange={handleEditEmpChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">รหัสบัตรประชาชน (ใช้เข้าสู่ระบบ) <span className="text-red-500">*</span></label>
              <input type="text" name="nationalId" value={editEmpModal.data.nationalId || ''} onChange={handleEditEmpChange} required maxLength="13" className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" placeholder="เลข 13 หลัก" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (TH) <span className="text-red-500">*</span></label>
              <input type="text" name="fullName" value={editEmpModal.data.fullName || ''} onChange={handleEditEmpChange} required className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ นามสกุล (EN)</label>
              <input type="text" name="fullNameEng" value={editEmpModal.data.fullNameEng || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อเล่น</label>
              <input type="text" name="nickname" value={editEmpModal.data.nickname || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">เบอร์โทร</label>
              <input type="tel" name="phone" value={editEmpModal.data.phone || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
            <input type="email" name="email" value={editEmpModal.data.email || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">บริษัท</label>
            <input type="text" name="company" value={editEmpModal.data.company || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">แผนก</label>
              <input type="text" name="department" value={editEmpModal.data.department || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">ตำแหน่ง</label>
              <input type="text" name="position" value={editEmpModal.data.position || ''} onChange={handleEditEmpChange} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" />
            </div>
          </div>

          {/* 🟢 อัปเดตช่องเลือกหัวหน้างานให้เป็นแบบค้นหารายชื่อจากระบบ */}
          <div ref={managerRef} className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อหัวหน้างาน</label>
            <div className="relative">
              <input 
                type="text" 
                name="manager" 
                value={editEmpModal.data.manager || ''} 
                onChange={handleEditEmpChange} 
                onFocus={() => setIsManagerDropdownOpen(true)}
                className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-sm transition-all shadow-sm" 
                placeholder="ค้นหาและเลือกหัวหน้างาน..." 
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            {isManagerDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {employees.filter(emp => emp.fullName?.toLowerCase().includes((editEmpModal.data.manager || '').toLowerCase()) || emp.empId?.toLowerCase().includes((editEmpModal.data.manager || '').toLowerCase())).map(emp => (
                  <div 
                    key={emp.id} 
                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-slate-50 last:border-b-0 flex justify-between items-center"
                    onClick={() => {
                      handleEditEmpChange({ target: { name: 'manager', value: emp.fullName } });
                      setIsManagerDropdownOpen(false);
                    }}
                  >
                    <div>
                      <div className="font-bold text-slate-800">{emp.fullName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{emp.empId} • {emp.department || 'ไม่ระบุแผนก'}</div>
                    </div>
                  </div>
                ))}
                {employees.filter(emp => emp.fullName?.toLowerCase().includes((editEmpModal.data.manager || '').toLowerCase()) || emp.empId?.toLowerCase().includes((editEmpModal.data.manager || '').toLowerCase())).length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-500 font-medium">ไม่พบข้อมูลพนักงานในระบบ</div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-5 border-t border-slate-100 mt-auto shrink-0">
            <button type="button" onClick={() => setEditEmpModal({ isOpen: false, data: null })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-all shadow-sm">
              ยกเลิก
            </button>
            <button type="submit" className="flex-1 py-3 bg-[#1E487A] text-white rounded-xl hover:bg-[#133257] font-bold transition-all shadow-lg shadow-[#1E487A]/30">
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}