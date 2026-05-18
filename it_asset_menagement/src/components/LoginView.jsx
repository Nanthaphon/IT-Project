import React from 'react';
import { User, ShieldCheck, IdCard, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

export default function LoginView({
  showAdminLogin,
  setShowAdminLogin,
  setAuthRole,
  loginForm,
  setLoginForm,
  handleAdminLogin,
  loginError,
  setLoginError,
  loginLoading,
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(60% 50% at 50% 0%, rgba(30,72,122,0.10) 0%, rgba(30,72,122,0) 60%), linear-gradient(180deg, #F8FAFC 0%, #EEF2F8 100%)',
      }}
    >
      {/* Subtle decoration */}
      <div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: BRAND.primary }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: BRAND.primary }}
      />

      {!showAdminLogin ? (
        /* ── Role selection ── */
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center relative z-10">

          {/* Logo + title */}
          <div className="text-center mb-10">
            <Logo />
            <h1 className="text-[28px] font-semibold text-slate-900 mb-2 tracking-tight">
              ระบบจัดการทรัพย์สิน IT
            </h1>
            <p className="text-slate-500 text-sm">กรุณาเลือกบทบาทของคุณเพื่อเข้าสู่ระบบ</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full px-2 md:px-0">
            <RoleCard
              icon={User}
              title="พนักงานทั่วไป"
              description="เข้าสู่ระบบเพื่อสร้างรายการแจ้งปัญหา IT และติดตามสถานะ"
              hintIcon={IdCard}
              hint="ใช้รหัสพนักงาน และรหัสบัตรประชาชน"
              onClick={() => setAuthRole('staff')}
            />
            <RoleCard
              icon={ShieldCheck}
              title="เจ้าหน้าที่ IT (Admin)"
              description="เข้าสู่ระบบเพื่อจัดการทรัพย์สิน, โปรแกรม และคิวงานแจ้งซ่อม"
              hintIcon={Lock}
              hint="จำเป็นต้องใช้รหัสผ่าน (Password)"
              onClick={() => setShowAdminLogin(true)}
            />
          </div>
        </div>
      ) : (
        /* ── Admin login form ── */
        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="text-center mb-7">
            <Logo />
            <h2 className="text-[24px] font-semibold text-slate-900 tracking-tight">IT Administrator</h2>
            <p className="text-slate-500 text-sm mt-1">เข้าสู่ระบบการจัดการทรัพย์สินส่วนกลาง</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-950/5 ring-1 ring-slate-200/70 p-7">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {loginError && (
                <div className="bg-rose-50 text-rose-700 p-3.5 rounded-xl text-sm font-medium ring-1 ring-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                  <span>{loginError}</span>
                </div>
              )}

              <FormField label="อีเมล (Email)" icon={Mail}>
                <input
                  type="email"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full bg-slate-50/70 border border-slate-200 pl-10 pr-4 py-3 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
                  placeholder="admin@example.com"
                  required
                />
              </FormField>

              <FormField label="รหัสผ่าน (Password)" icon={Lock}>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full bg-slate-50/70 border border-slate-200 pl-10 pr-4 py-3 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                />
              </FormField>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 bg-[#1E487A] text-white font-semibold rounded-lg hover:bg-[#163963] shadow-lg shadow-[#1E487A]/25 mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm transition-all"
              >
                {loginLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    เข้าสู่ระบบ
                    <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setShowAdminLogin(false);
                setLoginError('');
                setLoginForm({ username: '', password: '' });
              }}
              className="text-sm font-medium text-slate-500 hover:text-[#1E487A] transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              กลับไปหน้าเลือกบทบาท
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Logo() {
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-[#1E487A]/25 ring-1 ring-white/50"
      style={{ background: 'linear-gradient(135deg, #1E487A 0%, #163963 100%)' }}
    >
      <img
        src="/gb_icon.svg"
        alt="Logo"
        className="w-7 h-7 object-contain"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    </div>
  );
}

function RoleCard({ icon: Icon, title, description, hintIcon: HintIcon, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group bg-white p-8 rounded-2xl ring-1 ring-slate-200/70 flex flex-col items-center text-center
                 hover:ring-[#1E487A]/30 hover:shadow-xl hover:shadow-[#1E487A]/8 hover:-translate-y-0.5
                 transition-all duration-200 relative overflow-hidden"
    >
      {/* Hover gradient overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(30,72,122,0.04) 0%, rgba(30,72,122,0) 70%)',
        }}
      />

      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-200 relative"
        style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
      >
        <Icon className="h-7 w-7" strokeWidth={1.7} />
      </div>

      <h2 className="text-[18px] font-semibold text-slate-900 group-hover:text-[#1E487A] mb-2 transition-colors duration-200 relative">
        {title}
      </h2>
      <p className="text-slate-500 text-[13.5px] leading-relaxed mb-5 relative">{description}</p>

      <div className="mt-auto pt-4 w-full border-t border-slate-100 relative">
        <p className="text-slate-400 text-[11.5px] font-medium flex items-center justify-center gap-1.5">
          <HintIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
          {hint}
        </p>
      </div>
    </button>
  );
}

function FormField({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-slate-600 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
        </div>
        {children}
      </div>
    </div>
  );
}
