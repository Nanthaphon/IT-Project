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
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col items-center justify-center p-4"
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;900&display=swap');`}</style>

      {!showAdminLogin ? (
        /* ── Role selection ── */
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center">

          {/* Logo + title */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-[#1E487A] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#1E487A]/20">
              <span className="text-white font-serif italic text-2xl font-bold">G</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">ระบบจัดการทรัพย์สิน IT</h1>
            <p className="text-slate-500 text-sm">กรุณาเลือกบทบาทของคุณเพื่อเข้าสู่ระบบ</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full px-2 md:px-0">

            {/* Staff card */}
            <button
              onClick={() => setAuthRole('staff')}
              className="group bg-white p-8 rounded-2xl border border-slate-200 flex flex-col items-center text-center
                         hover:border-[#1E487A]/40 hover:shadow-lg hover:shadow-[#1E487A]/8 hover:-translate-y-0.5
                         transition-all duration-200 relative overflow-hidden"
            >
              {/* subtle bg accent on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/60 group-hover:to-transparent transition-all duration-200 pointer-events-none rounded-2xl" />

              <div className="w-16 h-16 bg-slate-50 group-hover:bg-[#1E487A]/10 text-slate-400 group-hover:text-[#1E487A] rounded-xl flex items-center justify-center mb-5 border border-slate-100 group-hover:border-[#1E487A]/20 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 group-hover:text-[#1E487A] mb-2.5 transition-colors duration-200">
                พนักงานทั่วไป
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">
                เข้าสู่ระบบเพื่อสร้างรายการแจ้งปัญหา IT<br className="hidden md:block" />และติดตามสถานะ
              </p>
              <div className="mt-auto pt-4 w-full border-t border-slate-100 group-hover:border-[#1E487A]/10 transition-colors duration-200">
                <p className="text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  ใช้รหัสพนักงาน และรหัสบัตรประชาชน
                </p>
              </div>
            </button>

            {/* Admin card */}
            <button
              onClick={() => setShowAdminLogin(true)}
              className="group bg-white p-8 rounded-2xl border border-slate-200 flex flex-col items-center text-center
                         hover:border-[#1E487A]/40 hover:shadow-lg hover:shadow-[#1E487A]/8 hover:-translate-y-0.5
                         transition-all duration-200 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/60 group-hover:to-transparent transition-all duration-200 pointer-events-none rounded-2xl" />

              <div className="w-16 h-16 bg-slate-50 group-hover:bg-[#1E487A]/10 text-slate-400 group-hover:text-[#1E487A] rounded-xl flex items-center justify-center mb-5 border border-slate-100 group-hover:border-[#1E487A]/20 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 group-hover:text-[#1E487A] mb-2.5 transition-colors duration-200">
                เจ้าหน้าที่ IT (Admin)
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">
                เข้าสู่ระบบเพื่อจัดการทรัพย์สิน, โปรแกรม<br className="hidden md:block" />และคิวงานแจ้งซ่อม
              </p>
              <div className="mt-auto pt-4 w-full border-t border-slate-100 group-hover:border-[#1E487A]/10 transition-colors duration-200">
                <p className="text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  จำเป็นต้องใช้รหัสผ่าน (Password)
                </p>
              </div>
            </button>
          </div>
        </div>

      ) : (
        /* ── Admin login form ── */
        <div className="w-full max-w-md mx-auto">

          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-[#1E487A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#1E487A]/20">
              <span className="text-white font-serif italic text-2xl font-bold">G</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">IT Administrator</h2>
            <p className="text-slate-500 text-sm mt-1">เข้าสู่ระบบการจัดการทรัพย์สินส่วนกลาง</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-7 border border-slate-200">
            <form onSubmit={handleAdminLogin} className="space-y-4">

              {loginError && (
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">อีเมล (Email)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] outline-none transition text-sm"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่าน (Password)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] outline-none transition text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 bg-[#1E487A] text-white font-semibold rounded-xl hover:bg-[#133257] shadow-md shadow-[#1E487A]/20 mt-2 disabled:opacity-70 flex justify-center items-center gap-2 text-sm transition"
              >
                {loginLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    เข้าสู่ระบบ
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setShowAdminLogin(false); setLoginError(''); setLoginForm({ username: '', password: '' }); }}
              className="text-sm font-medium text-slate-500 hover:text-[#1E487A] transition inline-flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              กลับไปหน้าเลือกบทบาท
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
