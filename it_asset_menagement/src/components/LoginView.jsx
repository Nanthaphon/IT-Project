import React from 'react';

export default function LoginView({
  showAdminLogin,
  setShowAdminLogin,
  setAuthRole,
  loginForm,
  setLoginForm,
  handleAdminLogin,
  loginError,
  setLoginError,
  loginLoading
}) {
  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-4 font-sans" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="max-w-4xl w-full">
         
         <div className="text-center mb-10">
           <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-[#1E487A] text-white rounded-2xl flex items-center justify-center text-5xl font-serif italic shadow-xl shadow-[#1E487A]/20">
                G
              </div>
           </div>
           <h1 className="text-3xl md:text-5xl font-black text-[#1E487A] mb-4 tracking-tight">ระบบจัดการทรัพย์สิน IT</h1>
           <p className="text-slate-500 text-base md:text-lg">กรุณาเลือกบทบาทของคุณเพื่อเข้าสู่ระบบ</p>
         </div>
         
         {!showAdminLogin ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
             <button 
               onClick={() => setAuthRole('staff')} 
               className="bg-white border border-slate-200 p-8 rounded-3xl hover:border-[#1E487A] transition-all duration-300 group text-left flex flex-col items-center text-center shadow-lg hover:shadow-xl"
             >
               <div className="w-20 h-20 bg-slate-50 text-[#1E487A] rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 group-hover:bg-[#1E487A]/10 transition-all border border-slate-100">👥</div>
               <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-[#1E487A] transition-colors">พนักงานทั่วไป (Staff)</h2>
               <p className="text-slate-500 text-sm leading-relaxed">เข้าสู่ระบบเพื่อสร้างรายการแจ้งปัญหา IT และติดตามสถานะ <br/>(ระบุเพียงรหัสพนักงาน)</p>
             </button>

             <button 
               onClick={() => { setShowAdminLogin(true); if(setLoginError) setLoginError(''); }} 
               className="bg-white border border-slate-200 p-8 rounded-3xl hover:border-[#1E487A] transition-all duration-300 group text-left flex flex-col items-center text-center shadow-lg hover:shadow-xl"
             >
               <div className="w-20 h-20 bg-slate-50 text-[#1E487A] rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 group-hover:bg-[#1E487A]/10 transition-all border border-slate-100">💻</div>
               <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-[#1E487A] transition-colors">เจ้าหน้าที่ IT (Admin)</h2>
               <p className="text-slate-500 text-sm leading-relaxed">เข้าสู่ระบบเพื่อจัดการทรัพย์สิน, โปรแกรม และคิวงานแจ้งซ่อม <br/>(ต้องใช้รหัสผ่าน)</p>
             </button>
           </div>
         ) : (
           <div className="max-w-md mx-auto bg-white border border-slate-200 p-8 md:p-10 rounded-3xl shadow-xl relative">
             <div className="flex items-center gap-4 mb-8">
               <button onClick={() => { setShowAdminLogin(false); if(setLoginError) setLoginError(''); }} className="text-slate-500 hover:text-[#1E487A] p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
               </button>
               <h2 className="text-2xl font-bold text-[#1E487A]">เข้าสู่ระบบ IT Admin</h2>
             </div>

             {loginError && (
               <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                 {loginError}
               </div>
             )}

             <form onSubmit={handleAdminLogin} className="space-y-5">
               <div>
                 <label className="block text-sm font-bold text-slate-600 mb-2">Username</label>
                 <input type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#1E487A] outline-none transition-all placeholder:text-slate-400" placeholder="ลองพิมพ์: admin" required />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-600 mb-2">Password</label>
                 <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#1E487A] outline-none transition-all placeholder:text-slate-400" placeholder="ลองพิมพ์: Admin@GB" required autoComplete="new-password" />
               </div>
               <button type="submit" disabled={loginLoading} className="w-full py-4 bg-[#1E487A] hover:bg-[#133257] text-white font-bold rounded-xl transition-all shadow-md shadow-[#1E487A]/20 mt-6 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2">
                 {loginLoading && <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                 เข้าสู่ระบบ
               </button>
             </form>
           </div>
         )}
      </div>
    </div>
  );
}