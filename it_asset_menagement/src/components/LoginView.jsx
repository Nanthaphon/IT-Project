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
}) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');`}</style>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">ระบบจัดการทรัพย์สิน IT</h1>
          <p className="text-slate-400 text-lg">กรุณาเลือกบทบาทของคุณเพื่อเข้าสู่ระบบ</p>
        </div>

        {!showAdminLogin ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <button
              onClick={() => setAuthRole('staff')}
              className="bg-slate-800 border border-slate-700 p-8 rounded-3xl hover:bg-slate-700 hover:border-emerald-500 transition-all group text-left flex flex-col items-center text-center shadow-xl"
            >
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">👥</div>
              <h2 className="text-2xl font-bold text-white mb-2">พนักงานทั่วไป (Staff)</h2>
              <p className="text-slate-400">เข้าสู่ระบบเพื่อสร้างรายการแจ้งปัญหา IT และติดตามสถานะ (ระบุเพียงรหัสพนักงาน)</p>
            </button>

            <button
              onClick={() => { setShowAdminLogin(true); setLoginError && setLoginError(''); }}
              className="bg-slate-800 border border-slate-700 p-8 rounded-3xl hover:bg-slate-700 hover:border-indigo-500 transition-all group text-left flex flex-col items-center text-center shadow-xl"
            >
              <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">💻</div>
              <h2 className="text-2xl font-bold text-white mb-2">เจ้าหน้าที่ IT (Admin)</h2>
              <p className="text-slate-400">เข้าสู่ระบบเพื่อจัดการทรัพย์สิน, โปรแกรม และจัดการคิวงานแจ้งซ่อม (ต้องใช้รหัสผ่าน)</p>
            </button>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => { setShowAdminLogin(false); setLoginError && setLoginError(''); }}
                className="text-slate-400 hover:text-white p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-white">เข้าสู่ระบบ IT Admin</h2>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-5">
              {/* แสดง error message แทน alert() */}
              {loginError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Email</label>
                {/* เปลี่ยนจาก type="text" เป็น type="email" เพื่อใช้กับ Firebase Auth */}
                <input
                  type="email"
                  value={loginForm.username}
                  onChange={e => {
                    setLoginForm({ ...loginForm, username: e.target.value });
                    if (loginError && setLoginError) setLoginError('');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="admin@yourdomain.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={e => {
                    setLoginForm({ ...loginForm, password: e.target.value });
                    if (loginError && setLoginError) setLoginError('');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 p-3.5 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 mt-4"
              >
                เข้าสู่ระบบ
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}