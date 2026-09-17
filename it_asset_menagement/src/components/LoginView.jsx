import React, { useState } from 'react';
import { UserRound, Lock, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { BRAND } from '../ui/theme.js';
import ResetPasswordModal from './ResetPasswordModal.jsx';

/* ฟอร์มเดียวสำหรับทุกคน — ไม่ต้องเลือกบทบาทก่อน
   แยกเส้นทางจากค่าที่กรอกเอง: มี @ = อีเมล (admin/hr) · ไม่มี = รหัสพนักงาน
   ทั้งสองทาง onAuthStateChanged ใน App.jsx ตั้ง authRole ให้เองหลัง sign-in
   จึงไม่ต้องให้ผู้ใช้บอกล่วงหน้าว่าเป็นใคร */
const looksLikeEmail = (v) => v.includes('@');

export default function LoginView({
  setLoginForm,
  handleAdminLogin,
  handleStaffLogin,
  loginError,
  setLoginError,
  loginLoading,
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    const id = identifier.trim();
    if (!id || !password) return;
    /* ส่งค่าตรงเข้า handler ไม่ผ่าน state ของ App
       (ถ้าเซ็ต state แล้วเรียกในจังหวะเดียวกัน handler จะอ่านค่าเก่า) */
    if (looksLikeEmail(id)) {
      setLoginForm({ username: id, password });
      handleAdminLogin(e, { username: id, password });
    } else {
      handleStaffLogin(e, { empId: id, password });
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4"
      style={{
        background:
          'radial-gradient(60% 50% at 50% 0%, rgba(43,103,119,0.10) 0%, rgba(43,103,119,0) 60%), linear-gradient(180deg, #F7F9FA 0%, #DFEAEF 100%)',
      }}
    >
      {/* ลวดลายพื้นหลังจาง ๆ */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 size-96 rounded-full opacity-20 blur-3xl"
        style={{ background: BRAND.primary }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full opacity-10 blur-3xl"
        style={{ background: BRAND.primary }}
      />

      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="mb-7 text-center">
          <Logo />
          <h1 className="text-[25px] font-medium tracking-tight text-stone-900">ระบบจัดการทรัพย์สิน IT</h1>
          <p className="mt-1 text-sm text-stone-500">เข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        <div className="rounded-xl border border-stone-200/70 bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <form onSubmit={submit} className="space-y-4">
            {loginError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                <span>{loginError}</span>
              </div>
            )}

            <FormField label="รหัสพนักงาน หรือ อีเมล" icon={UserRound}>
              <input
                type="text"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); if (loginError) setLoginError(''); }}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/70 py-3 pl-10 pr-4 text-sm text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-clay-600 focus:bg-white focus:ring-2 focus:ring-clay-600/15"
                placeholder="เช่น 1010101"
                autoComplete="username"
                autoFocus
                required
              />
            </FormField>

            <FormField label="รหัสผ่าน" icon={Lock}>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (loginError) setLoginError(''); }}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/70 py-3 pl-10 pr-4 text-sm text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-clay-600 focus:bg-white focus:ring-2 focus:ring-clay-600/15"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </FormField>

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-clay-600 py-3.5 text-sm font-medium text-white transition-colors hover:bg-clay-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loginLoading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  เข้าสู่ระบบ
                  <ArrowRight className="size-4" strokeWidth={2} />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-stone-500 transition-colors hover:text-clay-600"
              >
                <KeyRound className="size-3.5" strokeWidth={2} />
                ลืมรหัสผ่าน?
              </button>
            </div>
          </form>
        </div>

        {alertMsg && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-[13px] font-medium ${
              alertMsg.type === 'success'
                ? 'border-olive-200 bg-olive-50 text-olive-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
            <span>{alertMsg.text}</span>
          </div>
        )}

        <ResetPasswordModal
          isOpen={forgotOpen}
          onClose={() => setForgotOpen(false)}
          onSuccess={(msg) => setAlertMsg({ type: 'success', text: msg })}
          onError={(msg) => setAlertMsg({ type: 'error', text: msg })}
        />

        <p className="mt-8 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} Globe Syndicate — IT Asset Management
        </p>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div
      className="mx-auto mb-6 flex size-16 items-center justify-center rounded-xl border border-white/50 shadow-sm shadow-clay-600/25"
      style={{ background: 'linear-gradient(135deg, #2B6777 0%, #225462 100%)' }}
    >
      <img
        src="/gb_icon.svg"
        alt="Logo"
        className="size-8 object-contain"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    </div>
  );
}

function FormField({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-stone-600">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <Icon className="size-4 text-stone-400" strokeWidth={2} />
        </div>
        {children}
      </div>
    </div>
  );
}
