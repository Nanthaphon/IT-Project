import React from 'react';

export default function LoginView({
  showAdminLogin,
  setShowAdminLogin,
  setAuthRole,
  loginForm,
  setLoginForm,
  handleAdminLogin
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');`}</style>
      <div className="max-w-4xl w-full">
         <div className="text-center mb-10">
           <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-500 mb-4 tracking-tight">ระบบจัดการทรัพย์สิน IT</h1>
           <p className="text-slate-400 text-lg">กรุณาเลือกบทบาทของคุณเพื่อเข้าสู่ระบบ</p>
         </div>
         
         {!showAdminLogin ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
             <button 
               onClick={() => setAuthRole('staff')} 
               className="bg-black border border-slate-800 p-8 rounded-[2rem] hover:bg-slate-900 hover:border-teal-500/50 transition-all duration-300 group text-left flex flex-col items-center text-center shadow-2xl"
             >
               <div className="w-20 h-20 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all shadow-[0_0_20px_rgba(20,184,166,0.15)]">👥</div>
               <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">พนักงานทั่วไป (Staff)</h2>
               <p className="text-slate-500 text-sm leading-relaxed">เข้าสู่ระบบเพื่อสร้างรายการแจ้งปัญหา IT และติดตามสถานะ <br/>(ระบุเพียงรหัสพนักงาน)</p>
             </button>

             <button 
               onClick={() => setShowAdminLogin(true)} 
               className="bg-black border border-slate-800 p-8 rounded-[2rem] hover:bg-slate-900 hover:border-teal-500/50 transition-all duration-300 group text-left flex flex-col items-center text-center shadow-2xl"
             >
               <div className="w-20 h-20 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all shadow-[0_0_20px_rgba(20,184,166,0.15)]">💻</div>
               <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">เจ้าหน้าที่ IT (Admin)</h2>
               <p className="text-slate-500 text-sm leading-relaxed">เข้าสู่ระบบเพื่อจัดการทรัพย์สิน, โปรแกรม และคิวงานแจ้งซ่อม <br/>(ต้องใช้รหัสผ่าน)</p>
             </button>
           </div>
         ) : (
           <div className="max-w-md mx-auto bg-black border border-slate-800 p-8 md:p-10 rounded-[2rem] shadow-2xl">
             <div className="flex items-center gap-4 mb-8">
               <button onClick={() => setShowAdminLogin(false)} className="text-slate-500 hover:text-teal-400 p-2 bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
               </button>
               <h2 className="text-2xl font-bold text-white">เข้าสู่ระบบ IT Admin</h2>
             </div>
             <form onSubmit={handleAdminLogin} className="space-y-5">
               <div>
                 <label className="block text-sm font-bold text-slate-400 mb-2">Username</label>
                 <input type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-600" placeholder="ลองพิมพ์: admin" required />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-400 mb-2">Password</label>
                 <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-600" placeholder="ลองพิมพ์: Admin@GB" required autoComplete="new-password" />
               </div>
               <button type="submit" className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-black font-black rounded-xl transition-all shadow-lg shadow-teal-500/20 mt-6 active:scale-[0.98]">
                 เข้าสู่ระบบ
               </button>
             </form>
           </div>
         )}
      </div>
    </div>
  );
}