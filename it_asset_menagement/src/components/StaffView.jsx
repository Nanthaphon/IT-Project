import React, { useState, useRef, useEffect } from 'react';

export default function StaffView({
  setAuthRole,
  currentStaff,
  setCurrentStaff,
  staffEmpIdInput,
  setStaffEmpIdInput,
  handleStaffLogin,
  staffRepairForm,
  setStaffRepairForm,
  handleSubmitRepairRequest,
  repairRequests,
  editStaffRepairModal,
  setEditStaffRepairModal,
  handleStaffUpdateRepair,
  handleStaffDeleteRepair,
  officeSupplies = [],
  supplyRequests = [],
  handleStaffSubmitSupplyRequest,
  assets = [],
  accessories = [],
  licenses = []
}) {
  const [activeTab, setActiveTab] = useState('it_repair'); // 'it_repair' | 'office_supplies' | 'my_assets'
  
  // State สำหรับฟอร์มเบิกของ
  const [supplyReqForm, setSupplyReqForm] = useState({ supplyId: '', quantity: 1, note: '' });
  
  // State สำหรับระบบค้นหาอุปกรณ์
  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  const [isSupplyDropdownOpen, setIsSupplyDropdownOpen] = useState(false);
  const supplyDropdownRef = useRef(null);

  // ปิด Dropdown ค้นหาอุปกรณ์เมื่อคลิกที่อื่น
  useEffect(() => {
    function handleClickOutside(event) {
      if (supplyDropdownRef.current && !supplyDropdownRef.current.contains(event.target)) {
        setIsSupplyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [supplyDropdownRef]);

  // กรองรายการอุปกรณ์ตามคำค้นหา
  const filteredSupplies = officeSupplies.filter(supply =>
    supply.name?.toLowerCase().includes(supplySearchTerm.toLowerCase())
  );

  const onSupplySubmit = (e) => {
    e.preventDefault();
    if (!supplyReqForm.supplyId) return alert('กรุณาเลือกอุปกรณ์');
    const selectedSupply = officeSupplies.find(s => s.id === supplyReqForm.supplyId);
    if (!selectedSupply) return;

    handleStaffSubmitSupplyRequest(selectedSupply.id, selectedSupply.name, supplyReqForm.quantity, supplyReqForm.note);
    setSupplyReqForm({ supplyId: '', quantity: 1, note: '' });
    setSupplySearchTerm(''); 
  };

  // ดึงข้อมูลทรัพย์สินที่พนักงานคนนี้ครอบครอง
  const getMyAssets = () => {
    if (!currentStaff) return [];
    
    const empAssets = assets.filter(item => item.assignedTo === currentStaff.id);
    const empLicenses = licenses.filter(item => item.assignedTo === currentStaff.id);
    
    const empAccessories = accessories.reduce((accList, acc) => {
      if (acc.assignees) {
        acc.assignees.filter(a => a.empId === currentStaff.id).forEach(checkout => {
          accList.push({ ...acc, uniqueKey: checkout.checkoutId, checkoutId: checkout.checkoutId, sn: checkout.serialNumber }); 
        });
      } else if (acc.assignedTo === currentStaff.id) {
        accList.push({ ...acc, uniqueKey: acc.id }); 
      }
      return accList;
    }, []);
    
    return [...empAssets, ...empLicenses, ...empAccessories];
  };

  const myAssetsList = getMyAssets();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800;900&display=swap');`}</style>
      
      {/* 🟢 Header โฉมใหม่ */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#174873] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#174873]/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">Staff Portal</h1>
        </div>
        {currentStaff && (
          <button 
            onClick={() => { setAuthRole(null); setCurrentStaff(null); }} 
            className="text-sm font-bold text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            ออกจากระบบ
          </button>
        )}
      </header>

      <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
         
         {/* 🟢 หน้า Login (เมื่อยังไม่ระบุรหัส) */}
         {!currentStaff ? (
           <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 max-w-md w-full mt-10 md:mt-20 transform transition-all hover:scale-[1.01]">
             <div className="w-20 h-20 bg-[#174873]/10 text-[#174873] rounded-2xl flex items-center justify-center text-4xl mb-6 mx-auto shadow-inner border border-[#174873]/20">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <h2 className="text-2xl font-black text-slate-800 mb-2 text-center tracking-tight">ยืนยันตัวตนพนักงาน</h2>
             <p className="text-slate-500 text-center mb-8 text-sm font-medium">กรุณากรอกรหัสพนักงานของคุณเพื่อเข้าสู่ระบบบริการ แจ้งปัญหา และเบิกอุปกรณ์</p>
             
             <form onSubmit={handleStaffLogin} className="space-y-5">
               <div>
                 <input 
                   type="text" 
                   value={staffEmpIdInput} 
                   onChange={e => setStaffEmpIdInput(e.target.value)} 
                   className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#174873] focus:border-[#174873] outline-none transition-all shadow-sm text-center font-bold text-lg tracking-widest placeholder:text-sm placeholder:font-medium placeholder:tracking-normal" 
                   placeholder="ระบุรหัสพนักงาน (เช่น EMP001)" 
                   required 
                 />
               </div>
               <button type="submit" className="w-full py-4 bg-[#174873] hover:bg-[#103352] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#174873]/30 flex items-center justify-center gap-2 active:scale-[0.98]">
                 ตรวจสอบข้อมูล <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
               </button>
             </form>
           </div>
         ) : (
           
           /* 🟢 หน้า Dashboard พนักงาน (เข้าระบบแล้ว) */
           <div className="w-full max-w-screen-2xl space-y-6">
              
              {/* Profile Card */}
              <div className="bg-gradient-to-r from-[#174873] to-[#0f2d4a] rounded-[2rem] p-8 md:p-10 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-10 w-48 h-48 bg-black/20 rounded-full mix-blend-overlay filter blur-3xl"></div>

                <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl border border-white/20 backdrop-blur-md shadow-inner shrink-0">
                    {currentStaff.fullName?.charAt(0) || '👤'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight truncate">สวัสดี, {currentStaff.fullName} {currentStaff.nickname ? `(${currentStaff.nickname})` : ''}</h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 text-white text-xs font-bold shadow-sm">รหัส: {currentStaff.empId}</span> 
                      <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 text-white text-xs font-bold shadow-sm">แผนก: {currentStaff.department || '-'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setCurrentStaff(null)} className="w-full md:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all backdrop-blur-md border border-white/20 relative z-10 whitespace-nowrap shadow-sm">
                  เปลี่ยนผู้ใช้งาน
                </button>
              </div>

              {/* Tabs Selection แบบ Pills */}
              <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 w-full md:w-fit mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <button 
                  onClick={() => setActiveTab('it_repair')} 
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'it_repair' ? 'bg-[#174873] text-white shadow-md shadow-[#174873]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  แจ้งปัญหา IT
                </button>
                <button 
                  onClick={() => setActiveTab('office_supplies')} 
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'office_supplies' ? 'bg-[#174873] text-white shadow-md shadow-[#174873]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  เบิกอุปกรณ์สำนักงาน
                </button>
                <button 
                  onClick={() => setActiveTab('my_assets')} 
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'my_assets' ? 'bg-[#174873] text-white shadow-md shadow-[#174873]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                  ทรัพย์สินในความดูแล <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-xs">{myAssetsList.length}</span>
                </button>
              </div>

              {/* 🟢 แท็บ 1: แจ้งปัญหา IT */}
              {activeTab === 'it_repair' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 h-fit">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span className="p-2 bg-[#174873]/10 text-[#174873] rounded-xl shadow-inner">📝</span> เปิดใบแจ้งปัญหาใหม่</h3>
                    <form onSubmit={handleSubmitRepairRequest} className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">เรื่องที่ต้องการแจ้ง / อุปกรณ์ <span className="text-red-500">*</span></label>
                        <select 
                          value={staffRepairForm.assetName} 
                          onChange={(e) => setStaffRepairForm({...staffRepairForm, assetName: e.target.value})} 
                          className="w-full border border-slate-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#174873] focus:border-[#174873] outline-none transition-all shadow-sm text-sm bg-slate-50 focus:bg-white cursor-pointer" 
                          required 
                        >
                          <option value="" disabled>-- เลือกระบุอุปกรณ์ / ปัญหา --</option>
                          <option value="โน๊ตบุ๊ค/คอมพิวเตอร์">โน๊ตบุ๊ค/คอมพิวเตอร์</option>
                          <option value="โปรแกรม">โปรแกรม</option>
                          <option value="ปริ้นท์เตอร์">ปริ้นท์เตอร์</option>
                          <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">อาการที่พบ / รายละเอียด <span className="text-red-500">*</span></label>
                        <textarea 
                          value={staffRepairForm.issue} 
                          onChange={(e) => setStaffRepairForm({...staffRepairForm, issue: e.target.value})} 
                          className="w-full border border-slate-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#174873] focus:border-[#174873] outline-none transition-all shadow-sm resize-none text-sm bg-slate-50 focus:bg-white" 
                          placeholder="อธิบายปัญหาเพิ่มเติม หรือขอสิทธิ์เข้าถึงโฟลเดอร์..." 
                          rows="4"
                          required 
                        ></textarea>
                      </div>
                      <button type="submit" className="w-full py-3.5 bg-[#174873] hover:bg-[#103352] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#174873]/30 flex justify-center items-center gap-2 active:scale-[0.98]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        ส่งเรื่องให้ IT
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span className="p-2 bg-slate-100 text-slate-500 rounded-xl shadow-inner">🕒</span> ประวัติการแจ้งปัญหาของคุณ</h3>
                    
                    {(() => {
                      const myRequests = repairRequests.filter(req => req.empId === currentStaff.empId);
                      if (myRequests.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                            <span className="text-5xl mb-4 opacity-50">📂</span>
                            <p className="font-bold text-lg text-slate-500">คุณยังไม่มีประวัติแจ้งปัญหา</p>
                          </div>
                        );
                      }
                      return (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                          <table className="min-w-full text-left whitespace-nowrap text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">วันที่แจ้ง</th>
                                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">เรื่อง / อุปกรณ์</th>
                                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">รายละเอียด</th>
                                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">สถานะ</th>
                                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {myRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-[#174873]/5 transition-colors">
                                  <td className="px-5 py-4 text-slate-600 font-medium">
                                    {new Date(req.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-5 py-4 text-slate-800 font-bold">{req.assetName}</td>
                                  <td className="px-5 py-4 text-slate-600 truncate max-w-[200px]" title={req.issue}>{req.issue}</td>
                                  <td className="px-5 py-4 text-center">
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${
                                      req.status === 'รอดำเนินการ' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      req.status === 'กำลังดำเนินการ' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      req.status === 'ซ่อมเสร็จสิ้น' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}>
                                      {req.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    {req.status === 'รอดำเนินการ' ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => setEditStaffRepairModal({ isOpen: true, data: req })} className="inline-flex items-center justify-center w-8 h-8 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 hover:border-amber-500 rounded-lg transition-all shadow-sm" title="แก้ไข">✏️</button>
                                        <button onClick={() => handleStaffDeleteRepair(req.id)} className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-lg transition-all shadow-sm" title="ยกเลิก/ลบ">🗑️</button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded-md">แก้ไขไม่ได้แล้ว</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 🟢 แท็บ 2: เบิกอุปกรณ์สำนักงาน */}
              {activeTab === 'office_supplies' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 h-fit">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span className="p-2 bg-[#174873]/10 text-[#174873] rounded-xl shadow-inner">📝</span> ฟอร์มขอเบิกอุปกรณ์</h3>
                    <form onSubmit={onSupplySubmit} className="space-y-5">
                      
                      <div ref={supplyDropdownRef} className="relative">
                        <label className="block text-sm font-bold text-slate-700 mb-2">ค้นหาและเลือกอุปกรณ์ <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </div>
                          <input
                            type="text"
                            placeholder="พิมพ์ชื่ออุปกรณ์ที่ต้องการค้นหา..."
                            value={supplySearchTerm}
                            onChange={(e) => {
                              setSupplySearchTerm(e.target.value);
                              setSupplyReqForm({ ...supplyReqForm, supplyId: '' }); 
                              setIsSupplyDropdownOpen(true);
                            }}
                            onFocus={() => setIsSupplyDropdownOpen(true)}
                            className={`w-full pl-10 pr-4 py-3.5 border rounded-xl outline-none bg-slate-50 focus:bg-white text-sm transition-all shadow-sm ${!supplyReqForm.supplyId && supplySearchTerm ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500' : 'border-slate-300 focus:ring-[#174873] focus:border-[#174873]'}`}
                          />
                        </div>

                        {/* Dropdown ค้นหา */}
                        {isSupplyDropdownOpen && (
                          <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                            {filteredSupplies.length > 0 ? (
                              filteredSupplies.map(item => (
                                <div
                                  key={item.id}
                                  className={`px-4 py-3 cursor-pointer hover:bg-[#174873]/5 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-b-0 ${item.quantity <= 0 ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''} ${supplyReqForm.supplyId === item.id ? 'bg-[#174873]/5' : ''}`}
                                  onClick={() => {
                                    if (item.quantity > 0) {
                                      setSupplyReqForm({ ...supplyReqForm, supplyId: item.id });
                                      setSupplySearchTerm(item.name);
                                      setIsSupplyDropdownOpen(false);
                                    }
                                  }}
                                >
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-sm" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0 shadow-inner border border-slate-200">📎</div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 text-sm truncate">{item.name}</div>
                                    <div className="text-xs font-medium mt-0.5">
                                      {item.quantity <= 0 ? (
                                        <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">ของหมดสต็อก</span>
                                      ) : item.quantity <= 5 ? (
                                        <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">คงเหลือ {item.quantity} {item.unit}</span>
                                      ) : (
                                        <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">คงเหลือ {item.quantity} {item.unit}</span>
                                      )}
                                    </div>
                                  </div>
                                  {supplyReqForm.supplyId === item.id && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#174873] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-center text-sm text-slate-500 font-medium">ไม่พบอุปกรณ์ที่ค้นหา</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* แสดง Preview */}
                      {supplyReqForm.supplyId && (
                        <div className="p-4 bg-[#174873]/5 border border-[#174873]/20 rounded-xl flex items-center gap-4 animate-in fade-in">
                          {(() => {
                            const selectedSupply = officeSupplies.find(s => s.id === supplyReqForm.supplyId);
                            if(!selectedSupply) return null;
                            return (
                              <>
                                {selectedSupply.image ? (
                                  <img src={selectedSupply.image} alt={selectedSupply.name} className="w-12 h-12 rounded-lg object-cover border border-[#174873]/20 shadow-sm shrink-0" />
                                ) : (
                                   <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-xl shrink-0 shadow-sm border border-[#174873]/20">📎</div>
                                )}
                                <div>
                                  <p className="text-sm font-bold text-[#174873] line-clamp-2">{selectedSupply.name}</p>
                                  <p className="text-xs text-[#174873]/80 font-medium mt-0.5">เบิกได้สูงสุด: <span className="font-bold">{selectedSupply.quantity}</span> {selectedSupply.unit}</p>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">จำนวนที่ต้องการเบิก <span className="text-red-500">*</span></label>
                        <input 
                          type="number" min="1"
                          value={supplyReqForm.quantity} 
                          onChange={(e) => setSupplyReqForm({...supplyReqForm, quantity: e.target.value})} 
                          className="w-full border border-slate-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#174873] outline-none text-sm shadow-sm bg-slate-50 focus:bg-white" required 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">เหตุผลการเบิก / หมายเหตุ</label>
                        <textarea 
                          value={supplyReqForm.note} 
                          onChange={(e) => setSupplyReqForm({...supplyReqForm, note: e.target.value})} 
                          className="w-full border border-slate-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#174873] outline-none text-sm resize-none shadow-sm bg-slate-50 focus:bg-white" 
                          rows="3" placeholder="เช่น นำไปใช้ในโปรเจค A, เปลี่ยนของเดิมที่ชำรุด..."
                        ></textarea>
                      </div>
                      <button type="submit" disabled={!supplyReqForm.supplyId} className={`w-full py-3.5 text-white font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${supplyReqForm.supplyId ? 'bg-[#174873] hover:bg-[#103352] shadow-[#174873]/30 active:scale-[0.98]' : 'bg-slate-300 cursor-not-allowed shadow-none'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" /></svg>
                        ส่งคำขอเบิก
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span className="p-2 bg-slate-100 text-slate-500 rounded-xl shadow-inner">🕒</span> ประวัติคำขอเบิกอุปกรณ์ของคุณ</h3>
                    {(() => {
                      const mySupplyReqs = supplyRequests.filter(req => req.empId === currentStaff.empId);
                      if (mySupplyReqs.length === 0) return (<div className="flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl"><span className="text-5xl mb-4 opacity-50">📂</span><p className="font-bold text-lg text-slate-500">คุณยังไม่มีประวัติการเบิกอุปกรณ์</p></div>);
                      return (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                          <table className="min-w-full text-left whitespace-nowrap text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">วันที่ขอ</th>
                                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">อุปกรณ์</th>
                                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">จำนวน</th>
                                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">สถานะคำขอ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {mySupplyReqs.map((req) => (
                                <tr key={req.id} className="hover:bg-[#174873]/5 transition-colors">
                                  <td className="px-5 py-4 text-slate-600 font-medium">
                                    {new Date(req.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-5 py-4 text-slate-800 font-bold">{req.supplyName}</td>
                                  <td className="px-5 py-4 text-center font-black text-[#174873] text-lg">{req.requestedQty}</td>
                                  <td className="px-5 py-4 text-center">
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${req.status === 'รอดำเนินการ' ? 'bg-amber-50 text-amber-700 border-amber-200' : req.status === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                      {req.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 🟢 แท็บ 3: ทรัพย์สินที่ครอบครอง */}
              {activeTab === 'my_assets' && (
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <span className="p-2 bg-[#174873]/10 text-[#174873] rounded-xl shadow-inner">💻</span> ทรัพย์สินที่อยู่ในการดูแลของคุณ
                    </h3>
                    <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-xl text-sm font-bold border border-slate-200 shadow-sm flex items-center gap-2">
                      จำนวนทั้งหมด <span className="bg-white px-2 py-0.5 rounded-lg">{myAssetsList.length}</span>
                    </span>
                  </div>

                  {myAssetsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <span className="text-5xl mb-4 opacity-50 drop-shadow-sm">📦</span>
                      <p className="font-bold text-lg text-slate-500">คุณยังไม่มีทรัพย์สินหรืออุปกรณ์ที่ถูกเบิกในชื่อของคุณ</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {myAssetsList.map(item => {
                        const isAsset = assets.some(a => a.id === item.id);
                        const isAccessory = accessories.some(a => a.id === item.id);
                        
                        let catText, icon, bgClass, borderClass, textClass;
                        if (isAsset) {
                          catText = 'ทรัพย์สินหลัก'; icon = '🖥️';
                          bgClass = 'bg-blue-50'; borderClass = 'border-blue-200'; textClass = 'text-blue-700';
                        } else if (isAccessory) {
                          catText = 'อุปกรณ์เสริม'; icon = '🖱️';
                          bgClass = 'bg-orange-50'; borderClass = 'border-orange-200'; textClass = 'text-orange-700';
                        } else {
                          catText = 'โปรแกรม/License'; icon = '🔑';
                          bgClass = 'bg-purple-50'; borderClass = 'border-purple-200'; textClass = 'text-purple-700';
                        }

                        return (
                          <div key={item.uniqueKey || item.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-4 group">
                            <div className="flex items-start gap-4">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-200 shrink-0" />
                              ) : (
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-inner border ${borderClass} ${bgClass} ${textClass} shrink-0`}>
                                  {icon}
                                </div>
                              )}
                              <div className="flex-1 min-w-0 pt-1">
                                <h4 className="font-bold text-slate-800 text-base truncate group-hover:text-[#174873] transition-colors" title={item.name}>{item.name}</h4>
                                <p className="text-sm text-slate-500 truncate mt-0.5">{item.type || 'License'}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-slate-100">
                              <span className={`text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-lg font-bold border shadow-sm ${bgClass} ${borderClass} ${textClass}`}>
                                {catText}
                              </span>
                              {item.sn && (
                                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm truncate max-w-[150px] font-bold" title={item.sn}>
                                  SN: {item.sn}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Modal แก้ไขแจ้งปัญหา */}
          {editStaffRepairModal.isOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] transition-opacity">
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
                <div className="bg-[#174873] text-white px-6 py-5 flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="bg-black/20 p-1.5 rounded-lg text-sm">✏️</span> แก้ไขรายการแจ้งปัญหา
                  </h3>
                  <button onClick={() => setEditStaffRepairModal({ isOpen: false, data: null })} className="text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-xl transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleStaffUpdateRepair} className="p-6 md:p-8 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">เรื่องที่ต้องการแจ้ง / อุปกรณ์ <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={editStaffRepairModal.data.assetName} 
                      onChange={(e) => setEditStaffRepairModal(prev => ({...prev, data: {...prev.data, assetName: e.target.value}}))} 
                      className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#174873] outline-none text-sm shadow-sm bg-slate-50 focus:bg-white" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">อาการที่พบ / รายละเอียด <span className="text-red-500">*</span></label>
                    <textarea 
                      value={editStaffRepairModal.data.issue} 
                      onChange={(e) => setEditStaffRepairModal(prev => ({...prev, data: {...prev.data, issue: e.target.value}}))} 
                      className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#174873] outline-none text-sm resize-none shadow-sm bg-slate-50 focus:bg-white" 
                      rows="4" 
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-[#174873] hover:bg-[#103352] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#174873]/30">
                    บันทึกการแก้ไข
                  </button>
                </form>
              </div>
            </div>
          )}
       </main>
     </div>
   );
}