import React from 'react';

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
  handleStaffDeleteRepair
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');`}</style>
      
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="text-2xl">🛠️</span> ระบบแจ้งปัญหา IT (สำหรับพนักงาน)
        </h1>
        <button 
          onClick={() => { setAuthRole(null); setCurrentStaff(null); }} 
          className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-colors shadow-sm"
        >
          ออกจากระบบ
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
         {!currentStaff ? (
           <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full mt-10">
             <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-6 mx-auto">🆔</div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">ยืนยันตัวตนพนักงาน</h2>
             <p className="text-slate-500 text-center mb-8">กรุณากรอกรหัสพนักงานของคุณเพื่อเข้าสู่ระบบแจ้งปัญหาและติดตามสถานะ</p>
             
             <form onSubmit={handleStaffLogin} className="space-y-5">
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">รหัสพนักงาน</label>
                 <input 
                   type="text" 
                   value={staffEmpIdInput} 
                   onChange={e => setStaffEmpIdInput(e.target.value)} 
                   className="w-full border border-slate-300 p-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm" 
                   placeholder="ระบุรหัสพนักงานของคุณ..." 
                   required 
                 />
               </div>
               <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30">
                 ตรวจสอบข้อมูล
               </button>
             </form>
           </div>
         ) : (
           <div className="w-full max-w-screen-2xl space-y-6">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl border border-white/30">👤</div>
                  <div>
                    <h2 className="text-2xl font-bold">สวัสดี, {currentStaff.fullName} {currentStaff.nickname ? `(${currentStaff.nickname})` : ''}</h2>
                    <p className="text-emerald-100 font-medium mt-1">แผนก: {currentStaff.department || '-'} | รหัส: {currentStaff.empId}</p>
                  </div>
                </div>
                <button onClick={() => setCurrentStaff(null)} className="px-5 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-colors backdrop-blur-sm border border-white/20">
                  เปลี่ยนรหัสพนักงาน
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 h-fit">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><span className="text-2xl">📝</span> เปิดใบแจ้งปัญหาใหม่</h3>
                  <form onSubmit={handleSubmitRepairRequest} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">เรื่องที่ต้องการแจ้ง / อุปกรณ์ที่มีปัญหา <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={staffRepairForm.assetName} 
                        onChange={(e) => setStaffRepairForm({...staffRepairForm, assetName: e.target.value})} 
                        className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm text-sm" 
                        placeholder="เช่น โน๊ตบุ๊ค, เครื่องปริ้น, โปรแกรม License, ขอสิทธิ์ไฟล์..." 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">อาการที่พบ / รายละเอียดเพิ่มเติม <span className="text-red-500">*</span></label>
                      <textarea 
                        value={staffRepairForm.issue} 
                        onChange={(e) => setStaffRepairForm({...staffRepairForm, issue: e.target.value})} 
                        className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm resize-none text-sm" 
                        placeholder="เช่น เปิดไม่ติด, กระดาษติด, License หลุด, หาไฟล์งานไม่เจอ..." 
                        rows="4"
                        required 
                      ></textarea>
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30">
                      ส่งเรื่องแจ้งปัญหา IT
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><span className="text-2xl">🕒</span> ประวัติการแจ้งปัญหาของคุณ</h3>
                  
                  {(() => {
                    const myRequests = repairRequests.filter(req => req.empId === currentStaff.empId);
                    if (myRequests.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center text-slate-400 py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                          <span className="text-5xl mb-4 opacity-50">📂</span>
                          <p className="font-bold text-lg text-slate-500">คุณยังไม่มีประวัติแจ้งปัญหา</p>
                        </div>
                      );
                    }
                    return (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="min-w-full text-left whitespace-nowrap text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-5 py-4 font-bold text-slate-500">วันที่แจ้ง</th>
                              <th className="px-5 py-4 font-bold text-slate-500">หัวข้อ / อุปกรณ์</th>
                              <th className="px-5 py-4 font-bold text-slate-500">รายละเอียดปัญหา</th>
                              <th className="px-5 py-4 font-bold text-slate-500 text-center">สถานะ</th>
                              <th className="px-5 py-4 font-bold text-slate-500 text-center">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {myRequests.map((req) => (
                              <tr key={req.id} className="hover:bg-slate-50">
                                <td className="px-5 py-4 text-slate-600 font-medium">
                                  {new Date(req.timestamp).toLocaleDateString('th-TH')}
                                </td>
                                <td className="px-5 py-4 text-slate-800 font-bold">{req.assetName}</td>
                                <td className="px-5 py-4 text-slate-600 truncate max-w-[200px]" title={req.issue}>{req.issue}</td>
                                <td className="px-5 py-4 text-center">
                                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
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
                                    <span className="text-[10px] text-slate-400 font-medium">ทำรายการไม่ได้</span>
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
           </div>
         )}

         {/* หน้าต่าง Modal แก้ไขของพนักงาน */}
         {editStaffRepairModal.isOpen && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80] transition-opacity">
             <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
               <div className="bg-amber-500 text-white px-6 py-5 flex justify-between items-center">
                 <h3 className="font-bold text-lg flex items-center gap-2">
                   <span className="bg-black/10 p-1.5 rounded-lg text-sm">✏️</span> แก้ไขรายการแจ้งปัญหา
                 </h3>
                 <button onClick={() => setEditStaffRepairModal({ isOpen: false, data: null })} className="text-amber-100 hover:text-white bg-amber-600/50 hover:bg-amber-600 p-1.5 rounded-xl transition-colors">
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
                     className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm shadow-sm" 
                     required 
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">อาการที่พบ / รายละเอียด <span className="text-red-500">*</span></label>
                   <textarea 
                     value={editStaffRepairModal.data.issue} 
                     onChange={(e) => setEditStaffRepairModal(prev => ({...prev, data: {...prev.data, issue: e.target.value}}))} 
                     className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm resize-none shadow-sm" 
                     rows="4" 
                     required
                   ></textarea>
                 </div>
                 <button type="submit" className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30">
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