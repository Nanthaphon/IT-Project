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
  const [supplyCart, setSupplyCart] = useState([]);
  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  const [isSupplyDropdownOpen, setIsSupplyDropdownOpen] = useState(false);
  const supplyDropdownRef = useRef(null);

  const [isSubmittingRepair, setIsSubmittingRepair] = useState(false);
  const [isSubmittingSupply, setIsSubmittingSupply] = useState(false);

  const [repairPage, setRepairPage] = useState(1);
  const [supplyPage, setSupplyPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    function handleClickOutside(event) {
      if (supplyDropdownRef.current && !supplyDropdownRef.current.contains(event.target)) {
        setIsSupplyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [supplyDropdownRef]);

  useEffect(() => {
    setRepairPage(1);
    setSupplyPage(1);
  }, [activeTab]);

  const filteredSupplies = officeSupplies.filter(supply =>
    supply.name?.toLowerCase().includes(supplySearchTerm.toLowerCase())
  );

  const onRepairSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingRepair(true);
    try {
      await handleSubmitRepairRequest(e);
      setRepairPage(1);
    } finally {
      setIsSubmittingRepair(false);
    }
  };

  const onSupplySubmit = async (e) => {
    e.preventDefault();
    if (supplyCart.length === 0) return alert('กรุณาเลือกอุปกรณ์ที่ต้องการเบิกอย่างน้อย 1 รายการ');
    setIsSubmittingSupply(true);
    try {
      for (const item of supplyCart) {
        await handleStaffSubmitSupplyRequest(item.supplyId, item.name, item.quantity, item.note);
      }
      setSupplyCart([]); 
      setSupplySearchTerm(''); 
      setSupplyPage(1);
    } finally {
      setIsSubmittingSupply(false);
    }
  };

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
  const myRequests = repairRequests.filter(req => req.empId === currentStaff?.empId);
  const totalRepairPages = Math.ceil(myRequests.length / ITEMS_PER_PAGE);
  const currentRepairRequests = myRequests.slice((repairPage - 1) * ITEMS_PER_PAGE, repairPage * ITEMS_PER_PAGE);

  const mySupplyReqs = supplyRequests.filter(req => req.empId === currentStaff?.empId);
  const totalSupplyPages = Math.ceil(mySupplyReqs.length / ITEMS_PER_PAGE);
  const currentSupplyRequests = mySupplyReqs.slice((supplyPage - 1) * ITEMS_PER_PAGE, supplyPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex flex-col font-sans" style={{ fontFamily: "'Prompt', sans-serif" }}>
      
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1E487A] rounded-xl flex items-center justify-center text-white shadow-sm font-serif italic text-2xl">
            G
          </div>
          <h1 className="text-xl font-black text-[#1E487A] tracking-tight hidden sm:block">Staff Portal</h1>
        </div>
        {currentStaff && (
          <button 
            onClick={() => { setAuthRole(null); setCurrentStaff(null); }} 
            className="text-sm font-bold text-[#1E487A] bg-white hover:bg-slate-50 border border-[#1E487A]/30 hover:border-[#1E487A] px-5 py-2 rounded-full transition-all shadow-sm flex items-center gap-2"
          >
            ออกจากระบบ
          </button>
        )}
      </header>

      <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
         {!currentStaff ? (
           <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full mt-10 md:mt-20">
             <div className="w-20 h-20 bg-blue-50 text-[#1E487A] rounded-2xl flex items-center justify-center text-4xl mb-6 mx-auto shadow-sm border border-blue-100">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <h2 className="text-2xl font-black text-[#1E487A] mb-2 text-center tracking-tight">ยืนยันตัวตนพนักงาน</h2>
             <p className="text-slate-500 text-center mb-8 text-sm font-medium">กรุณากรอกรหัสพนักงานของคุณเพื่อเข้าสู่ระบบบริการ แจ้งปัญหา และเบิกอุปกรณ์</p>
             
             <form onSubmit={handleStaffLogin} className="space-y-5">
               <div>
                 <input 
                   type="text" 
                   value={staffEmpIdInput} 
                   onChange={e => setStaffEmpIdInput(e.target.value)} 
                   className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all shadow-sm text-center font-bold text-lg tracking-widest placeholder:text-sm placeholder:font-medium placeholder:tracking-normal" 
                   placeholder="ระบุรหัสพนักงาน (เช่น EMP001)" 
                   required 
                 />
               </div>
               <button type="submit" className="w-full py-4 bg-[#1E487A] hover:bg-[#133257] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#1E487A]/20 flex items-center justify-center gap-2 active:scale-[0.98]">
                 ตรวจสอบข้อมูล <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
               </button>
             </form>
           </div>
         ) : (
           <div className="w-full max-w-screen-2xl space-y-6 md:space-y-8">
              
              <div className="bg-[#1E487A] rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl border border-white/20 shadow-inner shrink-0">
                    {currentStaff.fullName?.charAt(0) || '👤'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight truncate text-white">สวัสดี, {currentStaff.fullName} {currentStaff.nickname ? `(${currentStaff.nickname})` : ''}</h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 text-white text-xs font-bold">รหัส: {currentStaff.empId}</span> 
                      <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 text-white text-xs font-bold">แผนก: {currentStaff.department || '-'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setCurrentStaff(null)} className="w-full md:w-auto px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all border border-white/10 relative z-10 whitespace-nowrap shadow-sm">
                  เปลี่ยนผู้ใช้งาน
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
                <button 
                  onClick={() => setActiveTab('it_repair')} 
                  className={`flex-1 p-4 rounded-2xl shadow-sm flex items-center gap-4 transition-all duration-300 border ${
                    activeTab === 'it_repair' 
                      ? 'bg-white border-[#1E487A] shadow-md shadow-[#1E487A]/10 scale-[1.02]' 
                      : 'bg-white/60 text-slate-600 hover:bg-white border-transparent'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${activeTab === 'it_repair' ? 'bg-[#1E487A] text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>🔧</div>
                  <div className="text-left">
                    <h4 className={`text-base md:text-lg font-black ${activeTab === 'it_repair' ? 'text-[#1E487A]' : 'text-slate-700'}`}>แจ้งปัญหา IT</h4>
                    <p className="text-xs mt-0.5 font-medium text-slate-500">ประวัติ {myRequests.length} รายการ</p>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('office_supplies')} 
                  className={`flex-1 p-4 rounded-2xl shadow-sm flex items-center gap-4 transition-all duration-300 border ${
                    activeTab === 'office_supplies' 
                      ? 'bg-white border-[#1E487A] shadow-md shadow-[#1E487A]/10 scale-[1.02]' 
                      : 'bg-white/60 text-slate-600 hover:bg-white border-transparent'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${activeTab === 'office_supplies' ? 'bg-[#1E487A] text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>📦</div>
                  <div className="text-left">
                    <h4 className={`text-base md:text-lg font-black ${activeTab === 'office_supplies' ? 'text-[#1E487A]' : 'text-slate-700'}`}>เบิกอุปกรณ์</h4>
                    <p className="text-xs mt-0.5 font-medium text-slate-500">ประวัติ {mySupplyReqs.length} คำขอ</p>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('my_assets')} 
                  className={`flex-1 p-4 rounded-2xl shadow-sm flex items-center gap-4 transition-all duration-300 border ${
                    activeTab === 'my_assets' 
                      ? 'bg-white border-[#1E487A] shadow-md shadow-[#1E487A]/10 scale-[1.02]' 
                      : 'bg-white/60 text-slate-600 hover:bg-white border-transparent'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${activeTab === 'my_assets' ? 'bg-[#1E487A] text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>💻</div>
                  <div className="text-left">
                    <h4 className={`text-base md:text-lg font-black ${activeTab === 'my_assets' ? 'text-[#1E487A]' : 'text-slate-700'}`}>ทรัพย์สินที่ดูแล</h4>
                    <p className="text-xs mt-0.5 font-medium text-slate-500">ครอบครอง {myAssetsList.length} รายการ</p>
                  </div>
                </button>
              </div>

              {/* -------------------- 🔧 TAB: แจ้งปัญหา IT -------------------- */}
              {activeTab === 'it_repair' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 h-fit">
                    <h3 className="text-xl font-bold text-[#1E487A] mb-6 flex items-center gap-3"><span className="p-2 bg-blue-50 text-[#1E487A] rounded-xl shadow-sm border border-blue-100">📝</span> เปิดใบแจ้งปัญหาใหม่</h3>
                    <form onSubmit={onRepairSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">เรื่องที่ต้องการแจ้ง / อุปกรณ์ <span className="text-red-500">*</span></label>
                        <select 
                          value={staffRepairForm.assetName} 
                          onChange={(e) => setStaffRepairForm({...staffRepairForm, assetName: e.target.value})} 
                          className="w-full border border-slate-300 p-4 rounded-xl focus:ring-2 focus:ring-[#1E487A] outline-none transition-all shadow-sm text-base bg-slate-50 focus:bg-white cursor-pointer" 
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
                          className="w-full border border-slate-300 p-4 rounded-xl focus:ring-2 focus:ring-[#1E487A] outline-none transition-all shadow-sm resize-none text-base bg-slate-50 focus:bg-white" 
                          placeholder="อธิบายปัญหาเพิ่มเติม หรือขอสิทธิ์เข้าถึงโฟลเดอร์..." 
                          rows="4"
                          required 
                        ></textarea>
                      </div>
                      <button 
                        type="submit" 
                        disabled={isSubmittingRepair}
                        className={`w-full py-4 text-white font-bold text-base rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${isSubmittingRepair ? 'bg-[#1E487A]/50 cursor-not-allowed' : 'bg-[#1E487A] hover:bg-[#133257] shadow-[#1E487A]/30 active:scale-[0.98]'}`}
                      >
                        {isSubmittingRepair ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        )}
                        {isSubmittingRepair ? 'กำลังส่งข้อมูล...' : 'ส่งเรื่องให้ IT'}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-[#1E487A] flex items-center gap-3"><span className="p-2 bg-blue-50 text-[#1E487A] rounded-xl shadow-inner border border-blue-100">🕒</span> ประวัติการแจ้งปัญหาของคุณ</h3>
                      {totalRepairPages > 0 && (
                        <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">หน้า {repairPage} / {totalRepairPages}</span>
                      )}
                    </div>
                    
                    {currentRepairRequests.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="text-5xl mb-4 opacity-50">📂</span>
                        <p className="font-bold text-lg text-slate-500">คุณยังไม่มีประวัติแจ้งปัญหาในหน้านี้</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm flex-1">
                        <table className="min-w-full text-left whitespace-nowrap text-sm h-full">
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
                            {currentRepairRequests.map((req) => (
                              <tr key={req.id} className="hover:bg-blue-50/40 transition-colors">
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
                                    'bg-red-50 text-red-700 border-red-200'
                                  }`}>
                                    {req.status}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  {req.status === 'รอดำเนินการ' ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <button onClick={() => setEditStaffRepairModal({ isOpen: true, data: req })} className="inline-flex items-center justify-center w-8 h-8 text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-lg transition-all shadow-sm" title="แก้ไข">✏️</button>
                                      <button onClick={() => handleStaffDeleteRepair(req.id)} className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all shadow-sm" title="ยกเลิก/ลบ">🗑️</button>
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
                    )}
                    
                    {totalRepairPages > 1 && (
                      <div className="flex justify-center items-center gap-1.5 mt-6 pt-4 border-t border-slate-100">
                        <button onClick={() => setRepairPage(p => Math.max(1, p - 1))} disabled={repairPage === 1} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors">&lt; ก่อนหน้า</button>
                        <div className="flex gap-1">
                          {Array.from({ length: totalRepairPages }).map((_, i) => (
                            <button key={i} onClick={() => setRepairPage(i + 1)} className={`w-9 h-9 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${repairPage === i + 1 ? 'bg-[#1E487A] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200'}`}>{i + 1}</button>
                          ))}
                        </div>
                        <button onClick={() => setRepairPage(p => Math.min(totalRepairPages, p + 1))} disabled={repairPage === totalRepairPages} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors">ถัดไป &gt;</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* -------------------- 📦 TAB: เบิกอุปกรณ์สำนักงาน -------------------- */}
              {activeTab === 'office_supplies' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 h-fit">
                    <h3 className="text-xl font-bold text-[#1E487A] mb-6 flex items-center gap-3"><span className="p-2 bg-blue-50 text-[#1E487A] rounded-xl shadow-inner border border-blue-100">📝</span> ฟอร์มขอเบิกอุปกรณ์</h3>
                    <form onSubmit={onSupplySubmit} className="space-y-5">
                      <div ref={supplyDropdownRef} className="relative">
                        <label className="block text-sm font-bold text-slate-700 mb-2">ค้นหาและเลือกอุปกรณ์ <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </div>
                          <input
                            type="text"
                            placeholder="พิมพ์ชื่ออุปกรณ์ที่ต้องการค้นหา..."
                            value={supplySearchTerm}
                            onChange={(e) => { setSupplySearchTerm(e.target.value); setIsSupplyDropdownOpen(true); }}
                            onFocus={() => setIsSupplyDropdownOpen(true)}
                            className={`w-full pl-12 pr-4 py-4 border rounded-xl outline-none bg-slate-50 focus:bg-white text-base font-medium transition-all shadow-sm ${!supplyCart.length && supplySearchTerm ? 'border-amber-300 focus:ring-1 focus:ring-[#1E487A] focus:border-[#1E487A]' : 'border-slate-300 focus:ring-1 focus:ring-[#1E487A] focus:border-[#1E487A]'}`}
                          />
                        </div>

                        {isSupplyDropdownOpen && (
                          <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto">
                            {filteredSupplies.length > 0 ? (
                              filteredSupplies.map(item => (
                                <div key={item.id} className={`px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-4 border-b border-slate-50 last:border-b-0 ${item.quantity <= 0 ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''} ${supplyCart.some(c => c.supplyId === item.id) ? 'bg-blue-50' : ''}`}
                                  onClick={() => {
                                    if (item.quantity > 0) {
                                      if (!supplyCart.some(c => c.supplyId === item.id)) {
                                        setSupplyCart([...supplyCart, { supplyId: item.id, name: item.name, maxQty: item.quantity, image: item.image, unit: item.unit, quantity: 1, note: '' }]);
                                      }
                                      setSupplySearchTerm(''); setIsSupplyDropdownOpen(false);
                                    }
                                  }}
                                >
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm" />
                                  ) : (
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0 shadow-inner border border-slate-200">📎</div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 text-base truncate">{item.name}</div>
                                    <div className="text-sm font-medium mt-1">
                                      {item.quantity <= 0 ? (
                                        <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">ของหมดสต็อก</span>
                                      ) : (
                                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">คงเหลือ {item.quantity} {item.unit}</span>
                                      )}
                                    </div>
                                  </div>
                                  {supplyCart.some(c => c.supplyId === item.id) && (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1E487A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>)}
                                </div>
                              ))
                            ) : (<div className="p-5 text-center text-base text-slate-500 font-medium">ไม่พบอุปกรณ์ที่ค้นหา</div>)}
                          </div>
                        )}
                      </div>

                      {supplyCart.length > 0 && (
                        <div className="space-y-4 mt-5">
                          <label className="block text-sm font-bold text-slate-700 mb-2">อุปกรณ์ที่เลือกแล้ว ({supplyCart.length} รายการ)</label>
                          {supplyCart.map((cartItem, index) => (
                            <div key={cartItem.supplyId} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-4 animate-in fade-in relative group">
                              <button type="button" onClick={() => setSupplyCart(supplyCart.filter(c => c.supplyId !== cartItem.supplyId))} className="absolute -top-3 -right-3 bg-white text-slate-400 hover:text-red-500 hover:bg-slate-50 p-1.5 rounded-full shadow-md border border-slate-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" title="ลบรายการนี้">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                              
                              <div className="flex items-center gap-4">
                                {cartItem.image ? (
                                  <img src={cartItem.image} alt={cartItem.name} className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0" />
                                ) : (
                                   <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-2xl shrink-0 shadow-sm border border-slate-200">📎</div>
                                )}
                                <div>
                                  <p className="text-base font-bold text-slate-800 line-clamp-1">{cartItem.name}</p>
                                  <p className="text-sm text-slate-500 font-medium mt-0.5">เบิกได้สูงสุด: <span className="font-bold">{cartItem.maxQty}</span> {cartItem.unit}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">จำนวน <span className="text-red-500">*</span></label>
                                  <input type="number" min="1" max={cartItem.maxQty} value={cartItem.quantity} onChange={(e) => { const newCart = [...supplyCart]; newCart[index].quantity = e.target.value; setSupplyCart(newCart); }} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-1 focus:ring-[#1E487A] outline-none text-base shadow-sm bg-white" required />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">เหตุผลการเบิก / หมายเหตุ</label>
                                  <input type="text" value={cartItem.note} onChange={(e) => { const newCart = [...supplyCart]; newCart[index].note = e.target.value; setSupplyCart(newCart); }} className="w-full border border-slate-300 p-3 rounded-xl focus:ring-1 focus:ring-[#1E487A] outline-none text-base shadow-sm bg-white" placeholder="เช่น นำไปใช้ในโปรเจค A..." />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <button type="submit" disabled={supplyCart.length === 0 || isSubmittingSupply} className={`w-full py-4 text-white font-bold text-base rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${(supplyCart.length > 0 && !isSubmittingSupply) ? 'bg-[#1E487A] hover:bg-[#133257] shadow-[#1E487A]/30 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>
                        {isSubmittingSupply ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 00-1-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" /></svg>
                        )}
                        {isSubmittingSupply ? 'กำลังส่งคำขอ...' : `ส่งคำขอเบิก (${supplyCart.length} รายการ)`}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-[#1E487A] flex items-center gap-3"><span className="p-2 bg-blue-50 text-[#1E487A] rounded-xl shadow-inner border border-blue-100">🕒</span> ประวัติคำขอเบิกอุปกรณ์ของคุณ</h3>
                      {totalSupplyPages > 0 && (<span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">หน้า {supplyPage} / {totalSupplyPages}</span>)}
                    </div>
                    
                    {currentSupplyRequests.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="text-5xl mb-4 opacity-50">📂</span>
                        <p className="font-bold text-lg text-slate-500">คุณยังไม่มีประวัติการเบิกอุปกรณ์ในหน้านี้</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm flex-1">
                        <table className="min-w-full text-left whitespace-nowrap text-sm h-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">วันที่ขอ</th>
                              <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">อุปกรณ์</th>
                              <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">จำนวน</th>
                              <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">สถานะคำขอ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {currentSupplyRequests.map((req) => (
                              <tr key={req.id} className="hover:bg-blue-50/40 transition-colors">
                                <td className="px-5 py-4 text-slate-600 font-medium">
                                  {new Date(req.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-5 py-4 text-slate-800 font-bold">{req.supplyName}</td>
                                <td className="px-5 py-4 text-center font-black text-[#1E487A] text-lg">{req.requestedQty}</td>
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
                    )}

                    {totalSupplyPages > 1 && (
                      <div className="flex justify-center items-center gap-1.5 mt-6 pt-4 border-t border-slate-100">
                        <button onClick={() => setSupplyPage(p => Math.max(1, p - 1))} disabled={supplyPage === 1} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors">&lt; ก่อนหน้า</button>
                        <div className="flex gap-1">
                          {Array.from({ length: totalSupplyPages }).map((_, i) => (
                            <button key={i} onClick={() => setSupplyPage(i + 1)} className={`w-9 h-9 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${supplyPage === i + 1 ? 'bg-[#1E487A] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200'}`}>{i + 1}</button>
                          ))}
                        </div>
                        <button onClick={() => setSupplyPage(p => Math.min(totalSupplyPages, p + 1))} disabled={supplyPage === totalSupplyPages} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors">ถัดไป &gt;</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* -------------------- 💻 TAB: ทรัพย์สินที่ดูแล -------------------- */}
              {activeTab === 'my_assets' && (
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-6">
                    <h3 className="text-xl font-bold text-[#1E487A] flex items-center gap-3">
                      <span className="p-2 bg-blue-50 text-[#1E487A] rounded-xl shadow-inner border border-blue-100">💻</span> ทรัพย์สินที่อยู่ในการดูแลของคุณ
                    </h3>
                    <span className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-xl text-sm font-bold border border-slate-200 shadow-sm flex items-center gap-2">
                      จำนวนทั้งหมด <span className="bg-white px-2 py-0.5 rounded-lg text-[#1E487A] border border-slate-200">{myAssetsList.length}</span>
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
                        if (isAsset) { catText = 'ทรัพย์สินหลัก'; icon = '🖥️'; bgClass = 'bg-slate-50 text-slate-600'; borderClass = 'border-slate-200'; textClass = 'text-slate-700 bg-slate-100'; } 
                        else if (isAccessory) { catText = 'อุปกรณ์เสริม'; icon = '🖱️'; bgClass = 'bg-slate-50 text-slate-600'; borderClass = 'border-slate-200'; textClass = 'text-slate-700 bg-slate-100'; } 
                        else { catText = 'โปรแกรม/License'; icon = '🔑'; bgClass = 'bg-slate-50 text-slate-600'; borderClass = 'border-slate-200'; textClass = 'text-slate-700 bg-slate-100'; }

                        return (
                          <div key={item.uniqueKey || item.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-200 shrink-0" />
                              ) : (
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0 border border-slate-200 ${bgClass}`}>
                                  {icon}
                                </div>
                              )}
                              <div className="flex-1 min-w-0 pt-1">
                                <h4 className="font-bold text-slate-800 text-base truncate" title={item.name}>{item.name}</h4>
                                <p className="text-sm text-slate-500 truncate mt-0.5">{item.type || 'License'}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-slate-100">
                              <span className={`text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-lg font-bold border shadow-sm ${borderClass} ${textClass}`}>
                                {catText}
                              </span>
                              {item.sn && (
                                <span className="text-[10px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm truncate max-w-[150px] font-bold" title={item.sn}>
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

              {/* Modal แก้ไขแจ้งปัญหา */}
              {editStaffRepairModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] transition-opacity">
                  <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
                    <div className="bg-[#1E487A] text-white px-6 py-5 flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="bg-white/20 p-1.5 rounded-lg text-sm">✏️</span> แก้ไขรายการแจ้งปัญหา
                      </h3>
                      <button onClick={() => setEditStaffRepairModal({ isOpen: false, data: null })} className="text-blue-200 hover:text-white bg-[#133257]/50 hover:bg-[#133257] p-1.5 rounded-xl transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <form onSubmit={handleStaffUpdateRepair} className="p-6 md:p-8 space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">เรื่องที่ต้องการแจ้ง / อุปกรณ์ <span className="text-red-500">*</span></label>
                        <select 
                          value={editStaffRepairModal.data.assetName} 
                          onChange={(e) => setEditStaffRepairModal(prev => ({...prev, data: {...prev.data, assetName: e.target.value}}))} 
                          className="w-full border border-slate-300 p-3 rounded-xl focus:ring-1 focus:ring-[#1E487A] outline-none text-sm shadow-sm bg-slate-50 focus:bg-white cursor-pointer" 
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
                          value={editStaffRepairModal.data.issue} 
                          onChange={(e) => setEditStaffRepairModal(prev => ({...prev, data: {...prev.data, issue: e.target.value}}))} 
                          className="w-full border border-slate-300 p-3 rounded-xl focus:ring-1 focus:ring-[#1E487A] outline-none text-sm resize-none shadow-sm bg-slate-50 focus:bg-white" 
                          rows="4" 
                          required
                        ></textarea>
                      </div>
                      <button type="submit" className="w-full py-3.5 bg-[#1E487A] hover:bg-[#133257] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#1E487A]/30">
                        บันทึกการแก้ไข
                      </button>
                    </form>
                  </div>
                </div>
              )}
           </div>
         )}
      </main>
    </div>
  );
}