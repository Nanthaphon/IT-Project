import React, { useState } from 'react';
import { User, ShieldCheck, IdCard, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle, KeyRound } from 'lucide-react';
import { BRAND } from '../ui/theme.js';
import ResetPasswordModal from './ResetPasswordModal.jsx';

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
  const [forgotOpen, setForgotOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
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
        <div className="w-full max-w-xl mx-auto flex flex-col items-center relative z-10">

          {/* Logo + title */}
          <div className="text-center mb-10">
            <Logo />
            <h1 className="text-[34px] font-semibold text-slate-900 mb-2 tracking-tight">
              ระบบจัดการทรัพย์สิน IT
            </h1>
            <p className="text-slate-500 text-[15.5px]">เลือกบทบาทของคุณเพื่อเข้าสู่ระบบ</p>
          </div>

          {/* Role buttons — compact horizontal pills */}
          <div className="w-full space-y-3.5">
            <RoleCard
              icon={User}
              title="พนักงานทั่วไป"
              description="แจ้งปัญหา IT และติดตามสถานะ"
              hintIcon={IdCard}
              hint="ใช้รหัสพนักงาน"
              onClick={() => setAuthRole('staff')}
            />
            <RoleCard
              icon={ShieldCheck}
              title="เจ้าหน้าที่ IT (Admin)"
              description="จัดการทรัพย์สิน โปรแกรม และคิวงาน"
              hintIcon={Lock}
              hint="ต้องใช้รหัสผ่าน"
              onClick={() => setShowAdminLogin(true)}
              accent
            />
          </div>

          {/* Footer hint */}
          <p className="mt-9 text-[12.5px] text-slate-400 text-center">
            © {new Date().getFullYear()} Globe Syndicate — IT Asset Management
          </p>
        </div>
      ) : (
        /* ── Admin login form ── */
        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="text-center mb-7">
            <Logo />
            <h2 className="text-[25px] font-semibold text-slate-900 tracking-tight">IT Administrator</h2>
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

              {/* ลืมรหัสผ่าน? */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[13.5px] font-medium text-slate-500 hover:text-[#1E487A] transition-colors inline-flex items-center gap-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5" strokeWidth={1.8} />
                  ลืมรหัสผ่าน?
                </button>
              </div>
            </form>
          </div>

          {/* alert จาก reset password */}
          {alertMsg && (
            <div className={`mt-4 px-4 py-3 rounded-xl text-[13.5px] font-medium ring-1 flex items-start gap-2 ${
              alertMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : 'bg-rose-50 text-rose-700 ring-rose-200'
            }`}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
              <span>{alertMsg.text}</span>
            </div>
          )}

          {/* forgot password modal */}
          <ResetPasswordModal
            isOpen={forgotOpen}
            onClose={() => setForgotOpen(false)}
            onSuccess={(msg) => setAlertMsg({ type: 'success', text: msg })}
            onError={(msg)   => setAlertMsg({ type: 'error',   text: msg })}
          />

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
      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#1E487A]/25 ring-1 ring-white/50"
      style={{ background: 'linear-gradient(135deg, #1E487A 0%, #163963 100%)' }}
    >
      <img
        src="/gb_icon.svg"
        alt="Logo"
        className="w-8 h-8 object-contain"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    </div>
  );
}

function RoleCard({ icon: Icon, title, description, hintIcon: HintIcon, hint, onClick, accent = false }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full bg-white rounded-2xl ring-1 flex items-center gap-5 px-6 py-5 text-left
                  transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl
                  ${accent
                    ? 'ring-[#1E487A]/15 hover:ring-[#1E487A]/40 hover:shadow-[#1E487A]/10'
                    : 'ring-slate-200/70 hover:ring-[#1E487A]/30 hover:shadow-slate-300/30'
                  }`}
    >
      {/* Icon */}
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
          accent ? 'text-white' : ''
        }`}
        style={
          accent
            ? { background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)` }
            : { background: `${BRAND.primary}10`, color: BRAND.primary }
        }
      >
        <Icon className="h-6 w-6" strokeWidth={1.85} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h2 className="text-[18px] font-semibold text-slate-900 group-hover:text-[#1E487A] transition-colors leading-tight">
          {title}
        </h2>
        <p className="text-slate-500 text-[14px] mt-1 leading-snug">{description}</p>
        <p className="text-slate-400 text-[12.5px] font-medium flex items-center gap-1.5 mt-1.5">
          <HintIcon className="h-3.5 w-3.5" strokeWidth={2} />
          {hint}
        </p>
      </div>

      {/* Arrow */}
      <ArrowRight
        className="h-5 w-5 text-slate-300 shrink-0 group-hover:text-[#1E487A] group-hover:translate-x-0.5 transition-all"
        strokeWidth={2.2}
      />
    </button>
  );
}

function FormField({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-[14px] font-medium text-slate-600 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
        </div>
        {children}
      </div>
    </div>
  );
}
