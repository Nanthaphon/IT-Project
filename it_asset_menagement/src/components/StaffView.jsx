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
  
  // ✅ เปลี่ยน State สำหรับฟอร์มเบิกของ จากของชิ้นเดียว ให้เป็น Array (ตะกร้าสินค้า)
  const [supplyCart, setSupplyCart] = useState([]);
  
  // State สำหรับระบบค้นหาอุปกรณ์
  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  const [isSupplyDropdownOpen, setIsSupplyDropdownOpen] = useState(false);
  const supplyDropdownRef = useRef(null);

  // ✅ State สำหรับระบบ Loading ตอนส่งข้อมูล
  const [isSubmittingRepair, setIsSubmittingRepair] = useState(false);
  const [isSubmittingSupply, setIsSubmittingSupply] = useState(false);

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

  // ✅ ฟังก์ชันแจ้งซ่อม (หุ้มด้วย Loading)
  const onRepairSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingRepair(true); // เปิด Loading
    try {
      await handleSubmitRepairRequest(e);
    } finally {
      setIsSubmittingRepair(false); // ปิด Loading เมื่อทำงานเสร็จ
    }
  };
  // ✅ ฟังก์ชันเบิกของ (หุ้มด้วย Loading และรองรับหลายรายการ)
  const onSupplySubmit = async (e) => {
    e.preventDefault();
    if (supplyCart.length === 0) return alert('กรุณาเลือกอุปกรณ์ที่ต้องการเบิกอย่างน้อย 1 รายการ');

    setIsSubmittingSupply(true); // เปิด Loading
    try {
      // วนลูปส่งคำขอตามจำนวนอุปกรณ์ที่อยู่ในตะกร้า
      for (const item of supplyCart) {
        await handleStaffSubmitSupplyRequest(item.supplyId, item.name, item.quantity, item.note);
      }
      setSupplyCart([]); // ล้างตะกร้าเมื่อส่งเสร็จ
      setSupplySearchTerm(''); 
    } finally {
      setIsSubmittingSupply(false); // ปิด Loading เมื่อทำงานเสร็จ
    }
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
  const myRequests = repairRequests.filter(req => req.empId === currentStaff?.empId);
  const mySupplyReqs = supplyRequests.filter(req => req.empId === currentStaff?.empId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800;900&display=swap');`}</style>
      
      {/* 🟢 Header */}
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
           <div className="w-full max-w-screen-2xl space-y-6 md:space-y-8 animate-in fade-in duration-500">
              
              {/* Profile Card (โลโก้บริษัท) */}
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

              {/* 🟢 การ์ดเมนูสีสันสดใส (แทนที่ Tabs เดิม) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                
                {/* การ์ด 1: แจ้งปัญหา IT */}
                <button 
                  onClick={() => setActiveTab('it_repair')} 
                  className={`text-left p-6 rounded-3xl shadow-lg flex items-center justify-between relative overflow-hidden transition-all duration-300 ${activeTab === 'it_repair' ? 'bg-gradient-to-br from-blue-500 to-blue-700 scale-[1.02] ring-4 ring-blue-300 ring-offset-2 opacity-100 shadow-blue-500/40' : 'bg-gradient-to-br from-slate-400 to-slate-500 hover:from-blue-400 hover:to-blue-500 opacity-80 hover:opacity-100 hover:scale-100'}`}
                >
                  <div className="relative z-10 text-white">
                    <p className="font-bold mb-1 text-sm tracking-wide opacity-90">ระบบแจ้งซ่อม</p>
                    <h4 className="text-xl lg:text-2xl font-black">แจ้งปัญหา IT</h4>
                    <p className="mt-3 text-xs bg-white/20 px-3 py-1.5 rounded-full w-fit font-semibold border border-white/20 backdrop-blur-sm">มีประวัติ {myRequests.length} รายการ</p>
                  </div>
                  <div className="text-6xl opacity-20 absolute -right-2 -bottom-2 transform rotate-12 select-none">🔧</div>
                </button>

                {/* การ์ด 2: ขอเบิกอุปกรณ์ */}
                <button 
                  onClick={() => setActiveTab('office_supplies')} 
                  className={`text-left p-6 rounded-3xl shadow-lg flex items-center justify-between relative overflow-hidden transition-all duration-300 ${activeTab === 'office_supplies' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 scale-[1.02] ring-4 ring-emerald-300 ring-offset-2 opacity-100 shadow-emerald-500/40' : 'bg-gradient-to-br from-slate-400 to-slate-500 hover:from-emerald-400 hover:to-emerald-500 opacity-80 hover:opacity-100 hover:scale-100'}`}
                >
                  <div className="relative z-10 text-white">
                    <p className="font-bold mb-1 text-sm tracking-wide opacity-90">ระบบคลัง</p>
                    <h4 className="text-xl lg:text-2xl font-black">เบิกอุปกรณ์</h4>
                    <p className="mt-3 text-xs bg-white/20 px-3 py-1.5 rounded-full w-fit font-semibold border border-white/20 backdrop-blur-sm">ประวัติ {mySupplyReqs.length} คำขอ</p>
                  </div>
                  <div className="text-6xl opacity-20 absolute -right-2 -bottom-2 transform -rotate-12 select-none">📦</div>
                </button>

                {/* การ์ด 3: ทรัพย์สินในความดูแล */}
                <button 
                  onClick={() => setActiveTab('my_assets')} 
                  className={`text-left p-6 rounded-3xl shadow-lg flex items-center justify-between relative overflow-hidden transition-all duration-300 ${activeTab === 'my_assets' ? 'bg-gradient-to-br from-orange-500 to-orange-700 scale-[1.02] ring-4 ring-orange-300 ring-offset-2 opacity-100 shadow-orange-500/40' : 'bg-gradient-to-br from-slate-400 to-slate-500 hover:from-orange-400 hover:to-orange-500 opacity-80 hover:opacity-100 hover:scale-100'}`}
                >
                  <div className="relative z-10 text-white">
                    <p className="font-bold mb-1 text-sm tracking-wide opacity-90">ตรวจสอบ</p>
                    <h4 className="text-xl lg:text-2xl font-black">ทรัพย์สินที่ดูแล</h4>
                    <p className="mt-3 text-xs bg-white/20 px-3 py-1.5 rounded-full w-fit font-semibold border border-white/20 backdrop-blur-sm">ครอบครอง {myAssetsList.length} รายการ</p>
                  </div>
                  <div className="text-6xl opacity-20 absolute -right-2 -bottom-2 transform rotate-12 select-none">💻</div>
                </button>
              </div>

              {/* 🟢 เนื้อหาภายใน: แจ้งปัญหา IT */}
              {activeTab === 'it_repair' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 h-fit">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-inner">📝</span> เปิดใบแจ้งปัญหาใหม่</h3>
                    {/* ✅ แก้ไข: หุ้มด้วยฟังก์ชัน onRepairSubmit ที่มี State Loading */}
                    <form onSubmit={onRepairSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">เรื่องที่ต้องการแจ้ง / อุปกรณ์ <span className="text-red-500">*</span></label>
                        <select 
                          value={staffRepairForm.assetName} 
                          onChange={(e) => setStaffRepairForm({...staffRepairForm, assetName: e.target.value})} 
                          className="w-full border border-slate-300 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-sm bg-slate-50 focus:bg-white cursor-pointer" 
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
                          className="w-full border border-slate-300 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm resize-none text-sm bg-slate-50 focus:bg-white" 
                          placeholder="อธิบายปัญหาเพิ่มเติม หรือขอสิทธิ์เข้าถึงโฟลเดอร์..." 
                          rows="4"
                          required 
                        ></textarea>
                      </div>
                      {/* ✅ แก้ไข: เพิ่มเงื่อนไข Loading ในปุ่ม */}
                      <button 
                        type="submit" 
                        disabled={isSubmittingRepair}
                        className={`w-full py-3.5 text-white font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${isSubmittingRepair ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 active:scale-[0.98]'}`}
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

                  <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span className="p-2 bg-slate-100 text-slate-500 rounded-xl shadow-inner">🕒</span> ประวัติการแจ้งปัญหาของคุณ</h3>
                    
                    {myRequests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="text-5xl mb-4 opacity-50">📂</span>
                        <p className="font-bold text-lg text-slate-500">คุณยังไม่มีประวัติแจ้งปัญหา</p>
                      </div>
                    ) : (
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
                              <tr key={req.id} className="hover:bg-blue-50/30 transition-colors">
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
                    )}
                  </div>
                </div>
              )}

              {/* 🟢 เนื้อหาภายใน: เบิกอุปกรณ์สำนักงาน */}
              {activeTab === 'office_supplies' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 h-fit">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner">📝</span> ฟอร์มขอเบิกอุปกรณ์</h3>
                    {/* ✅ แก้ไข: หุ้มด้วยฟังก์ชัน onSupplySubmit ที่มี State Loading */}
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
                              setIsSupplyDropdownOpen(true);
                            }}
                            onFocus={() => setIsSupplyDropdownOpen(true)}
                            className={`w-full pl-10 pr-4 py-3.5 border rounded-xl outline-none bg-slate-50 focus:bg-white text-sm transition-all shadow-sm border-slate-300 focus:ring-emerald-500 focus:border-emerald-500`}
                          />
                        </div>

                        {/* Dropdown ค้นหาอุปกรณ์ (คงเหลือสีตามจำนวน) */}
                        {isSupplyDropdownOpen && (
                          <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                            {filteredSupplies.length > 0 ? (
                              filteredSupplies.map(item => (
                                <div
                                  key={item.id}
                                  className={`px-4 py-3 cursor-pointer hover:bg-emerald-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-b-0 ${item.quantity <= 0 ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''} ${supplyCart.some(c => c.supplyId === item.id) ? 'bg-emerald-50' : ''}`}
                                  onClick={() => {
                                    if (item.quantity > 0) {
                                      // ตรวจสอบว่ามีอยู่ในตะกร้าหรือยัง ถ้ายังไม่มีให้เพิ่มเข้าไป
                                      if (!supplyCart.some(c => c.supplyId === item.id)) {
                                        setSupplyCart([...supplyCart, {
                                          supplyId: item.id,
                                          name: item.name,
                                          maxQty: item.quantity,
                                          image: item.image,
                                          unit: item.unit,
                                          quantity: 1,
                                          note: ''
                                        }]);
                                      }
                                      setSupplySearchTerm(''); // ล้างช่องค้นหาเพื่อให้พร้อมพิมพ์ค้นหาชิ้นต่อไป
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
                                  {supplyCart.some(c => c.supplyId === item.id) && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-center text-sm text-slate-500 font-medium">ไม่พบอุปกรณ์ที่ค้นหา</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* รายการอุปกรณ์ที่เลือกไว้ในตะกร้า */}
                      {supplyCart.length > 0 && (
                        <div className="space-y-3 mt-4">
                          <label className="block text-sm font-bold text-slate-700 mb-2">อุปกรณ์ที่เลือกแล้ว ({supplyCart.length} รายการ)</label>
                          {supplyCart.map((cartItem, index) => (
                            <div key={cartItem.supplyId} className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col gap-3 animate-in fade-in relative group">
                              <button 
                                type="button" 
                                onClick={() => setSupplyCart(supplyCart.filter(c => c.supplyId !== cartItem.supplyId))} 
                                className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-white hover:bg-red-500 p-1 rounded-full shadow-sm border border-red-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="ลบรายการนี้"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                              
                              <div className="flex items-center gap-3">
                                {cartItem.image ? (
                                  <img src={cartItem.image} alt={cartItem.name} className="w-10 h-10 rounded-lg object-cover border border-emerald-200 shadow-sm shrink-0" />
                                ) : (
                                   <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg shrink-0 shadow-sm border border-emerald-200">📎</div>
                                )}
                                <div>
                                  <p className="text-sm font-bold text-emerald-800 line-clamp-1">{cartItem.name}</p>
                                  <p className="text-xs text-emerald-600 font-medium mt-0.5">เบิกได้สูงสุด: <span className="font-bold">{cartItem.maxQty}</span> {cartItem.unit}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">จำนวน <span className="text-red-500">*</span></label>
                                  <input 
                                    type="number" min="1" max={cartItem.maxQty}
                                    value={cartItem.quantity} 
                                    onChange={(e) => {
                                      const newCart = [...supplyCart];
                                      newCart[index].quantity = e.target.value;
                                      setSupplyCart(newCart);
                                    }} 
                                    className="w-full border border-emerald-200 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm shadow-sm bg-white" required 
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เหตุผลการเบิก / หมายเหตุ</label>
                                  <input 
                                    type="text"
                                    value={cartItem.note} 
                                    onChange={(e) => {
                                      const newCart = [...supplyCart];
                                      newCart[index].note = e.target.value;
                                      setSupplyCart(newCart);
                                    }} 
                                    className="w-full border border-emerald-200 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm shadow-sm bg-white" 
                                    placeholder="เช่น นำไปใช้ในโปรเจค A..."
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* ✅ แก้ไข: เพิ่มเงื่อนไขปุ่มและข้อความให้สัมพันธ์กับจำนวนรายการในตะกร้า */}
                      <button 
                        type="submit" 
                        disabled={supplyCart.length === 0 || isSubmittingSupply} 
                        className={`w-full py-3.5 text-white font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${(supplyCart.length > 0 && !isSubmittingSupply) ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 active:scale-[0.98]' : 'bg-slate-300 cursor-not-allowed shadow-none'}`}
                      >
                        {isSubmittingSupply ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 00-1-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" /></svg>
                        )}
                        {isSubmittingSupply ? 'กำลังส่งคำขอ...' : `ส่งคำขอเบิก (${supplyCart.length} รายการ)`}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span className="p-2 bg-slate-100 text-slate-500 rounded-xl shadow-inner">🕒</span> ประวัติคำขอเบิกอุปกรณ์ของคุณ</h3>
                    {mySupplyReqs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="text-5xl mb-4 opacity-50">📂</span>
                        <p className="font-bold text-lg text-slate-500">คุณยังไม่มีประวัติการเบิกอุปกรณ์</p>
                      </div>
                    ) : (
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
                              <tr key={req.id} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="px-5 py-4 text-slate-600 font-medium">
                                  {new Date(req.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-5 py-4 text-slate-800 font-bold">{req.supplyName}</td>
                                <td className="px-5 py-4 text-center font-black text-emerald-600 text-lg">{req.requestedQty}</td>
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
                  </div>
                </div>
              )}

              {/* 🟢 เนื้อหาภายใน: ทรัพย์สินที่ครอบครอง */}
              {activeTab === 'my_assets' && (
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 border-t-4 border-t-orange-500">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <span className="p-2 bg-orange-100 text-orange-600 rounded-xl shadow-inner">💻</span> ทรัพย์สินที่อยู่ในการดูแลของคุณ
                    </h3>
                    <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-xl text-sm font-bold border border-slate-200 shadow-sm flex items-center gap-2">
                      จำนวนทั้งหมด <span className="bg-white px-2 py-0.5 rounded-lg text-orange-600">{myAssetsList.length}</span>
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
                        
                        let catText, icon, bgClass, borderClass, textClass, hoverText;
                        if (isAsset) {
                          catText = 'ทรัพย์สินหลัก'; icon = '🖥️'; hoverText = 'group-hover:text-blue-600';
                          bgClass = 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'; borderClass = 'border-blue-200'; textClass = 'text-blue-700 bg-blue-50';
                        } else if (isAccessory) {
                          catText = 'อุปกรณ์เสริม'; icon = '🖱️'; hoverText = 'group-hover:text-orange-600';
                          bgClass = 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'; borderClass = 'border-orange-200'; textClass = 'text-orange-700 bg-orange-50';
                        } else {
                          catText = 'โปรแกรม/License'; icon = '🔑'; hoverText = 'group-hover:text-purple-600';
                          bgClass = 'bg-gradient-to-br from-purple-400 to-purple-600 text-white'; borderClass = 'border-purple-200'; textClass = 'text-purple-700 bg-purple-50';
                        }

                        return (
                          <div key={item.uniqueKey || item.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-4 group">
                            <div className="flex items-start gap-4">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-200 shrink-0" />
                              ) : (
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0 ${bgClass}`}>
                                  {icon}
                                </div>
                              )}
                              <div className="flex-1 min-w-0 pt-1">
                                <h4 className={`font-bold text-slate-800 text-base truncate transition-colors ${hoverText}`} title={item.name}>{item.name}</h4>
                                <p className="text-sm text-slate-500 truncate mt-0.5">{item.type || 'License'}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-slate-100">
                              <span className={`text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-lg font-bold border shadow-sm ${borderClass} ${textClass}`}>
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
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-5 flex justify-between items-center">
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
                    <select 
                      value={editStaffRepairModal.data.assetName} 
                      onChange={(e) => setEditStaffRepairModal(prev => ({...prev, data: {...prev.data, assetName: e.target.value}}))} 
                      className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm bg-slate-50 focus:bg-white cursor-pointer" 
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
                      className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none shadow-sm bg-slate-50 focus:bg-white" 
                      rows="4" 
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30">
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