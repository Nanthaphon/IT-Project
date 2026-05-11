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
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;900&display=swap');`}</style>
      
      {!showAdminLogin ? (
        // ---------------------------------------------------------
        // หน้าจอ 1: หน้าเลือกบทบาท (Role Selection) ไม่มีเอฟเฟค Hover
        // ---------------------------------------------------------
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
          
          <div className="text-center mb-10 md:mb-14">
            <div className="w-16 h-16 bg-[#1E487A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#1E487A]/20">
              <span className="text-white font-serif italic text-3xl font-bold">G</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-3 tracking-tight">
              ระบบจัดการทรัพย์สิน IT
            </h1>
            <p className="text-slate-500 font-medium text-base">
              กรุณาเลือกบทบาทของคุณเพื่อเข้าสู่ระบบ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-2 md:px-8">
            
            {/* การ์ดพนักงานทั่วไป */}
            <button 
              onClick={() => setAuthRole('staff')} 
              className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10"></div>
              
              <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-3">
                พนักงานทั่วไป
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                เข้าสู่ระบบเพื่อสร้างรายการแจ้งปัญหา IT<br className="hidden md:block"/>และติดตามสถานะ
              </p>
              <div className="mt-auto pt-4 w-full border-t border-slate-100">
                <p className="text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                  ใช้รหัสพนักงาน และรหัสบัตรประชาชน
                </p>
              </div>
            </button>

            {/* การ์ดเจ้าหน้าที่ IT (Admin) */}
            <button 
              onClick={() => setShowAdminLogin(true)} 
              className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-slate-50 rounded-br-full -z-10"></div>

              <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-3">
                เจ้าหน้าที่ IT (Admin)
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                เข้าสู่ระบบเพื่อจัดการทรัพย์สิน, โปรแกรม<br className="hidden md:block"/>และคิวงานแจ้งซ่อม
              </p>
              <div className="mt-auto pt-4 w-full border-t border-slate-100">
                <p className="text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  จำเป็นต้องใช้รหัสผ่าน (Password)
                </p>
              </div>
            </button>

          </div>
        </div>
      ) : (
        // ---------------------------------------------------------
        // หน้าจอ 2: หน้าแบบฟอร์มเข้าสู่ระบบของ Admin (เอาเอฟเฟคออกทั้งหมด)
        // ---------------------------------------------------------
        <div className="w-full max-w-md mx-auto">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#1E487A] rounded-[1.2rem] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#1E487A]/20">
              <span className="text-white font-serif italic text-3xl font-bold">G</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">IT Administrator</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">เข้าสู่ระบบการจัดการทรัพย์สินส่วนกลาง</p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 border border-slate-200/60">
            <form onSubmit={handleAdminLogin} className="space-y-5">
              
              {loginError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-start gap-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>{loginError}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">อีเมล (Email)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  </div>
                  <input 
                    type="email" 
                    value={loginForm.username} 
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all shadow-sm text-sm font-medium"
                    placeholder="admin@example.com" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">รหัสผ่าน (Password)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input 
                    type="password" 
                    value={loginForm.password} 
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all shadow-sm text-sm font-medium"
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loginLoading}
                className="w-full py-4 bg-[#1E487A] text-white font-bold rounded-2xl hover:bg-[#133257] shadow-lg shadow-[#1E487A]/30 mt-6 disabled:opacity-70 flex justify-center items-center gap-2 text-sm"
              >
                {loginLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>เข้าสู่ระบบ <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => { setShowAdminLogin(false); setLoginError(''); setLoginForm({ username: '', password: '' }); }} 
              className="text-sm font-semibold text-slate-500 hover:text-[#1E487A] transition-colors inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200 hover:border-[#1E487A]/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              กลับไปหน้าเลือกบทบาท
            </button>
          </div>
        </div>
      )}
    </div>
  );
}