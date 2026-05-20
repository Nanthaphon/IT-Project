import React, { useState } from 'react';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { BRAND, cls } from '../ui/theme.js';

export default function ChangePasswordModal({ isOpen, onClose, onSuccess, onError }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [fieldError, setFieldError]   = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setShowCurrent(false); setShowNew(false); setFieldError('');
  };

  const handleClose = () => { reset(); onClose(); };

  /* ── password strength ─────────────────────────── */
  const rules = [
    { label: 'อย่างน้อย 8 ตัวอักษร',      ok: newPassword.length >= 8 },
    { label: 'มีตัวอักษร a-z หรือ A-Z',     ok: /[a-zA-Z]/.test(newPassword) },
    { label: 'มีตัวเลข 0-9',              ok: /\d/.test(newPassword) },
    { label: 'ไม่เหมือนรหัสผ่านเดิม',       ok: newPassword.length > 0 && newPassword !== currentPassword },
  ];
  const passedAll = rules.every(r => r.ok);
  const matchOk   = confirmPassword.length > 0 && newPassword === confirmPassword;

  /* ── submit ─────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError('');

    if (!passedAll) { setFieldError('รหัสผ่านใหม่ยังไม่ตรงตามเงื่อนไข'); return; }
    if (!matchOk)   { setFieldError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน'); return; }

    setIsLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('ไม่พบข้อมูลผู้ใช้ปัจจุบัน');

      // 1) re-authenticate (ความปลอดภัย: ต้องยืนยันรหัสเก่า)
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2) update password
      await updatePassword(user, newPassword);

      onSuccess('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      handleClose();
    } catch (error) {
      const code = error?.code || '';
      let msg = error?.message || 'เกิดข้อผิดพลาดที่ไม่รู้จัก';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        msg = 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
      } else if (code === 'auth/weak-password') {
        msg = 'รหัสผ่านใหม่ไม่ปลอดภัย (สั้นเกินไป)';
      } else if (code === 'auth/requires-recent-login') {
        msg = 'กรุณาออกจากระบบและเข้าสู่ระบบใหม่ก่อนเปลี่ยนรหัสผ่าน';
      }
      setFieldError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 max-w-md w-full overflow-hidden ring-1 ring-slate-200/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── header ── */}
        <div className="px-6 pt-6 pb-5 text-center border-b border-slate-100">
          <div
            className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl mb-4 ring-1"
            style={{ background: `${BRAND.primary}10`, color: BRAND.primary, '--tw-ring-color': `${BRAND.primary}20` }}
          >
            <KeyRound className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h3 className="text-[18px] font-semibold tracking-tight" style={{ color: BRAND.primary }}>
            เปลี่ยนรหัสผ่าน
          </h3>
          <p className="text-[12.5px] text-slate-500 mt-1">
            ยืนยันด้วยรหัสผ่านปัจจุบัน เพื่อความปลอดภัยของบัญชี
          </p>
        </div>

        {/* ── form ── */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* error banner */}
          {fieldError && (
            <div className="bg-rose-50 text-rose-700 px-3.5 py-3 rounded-xl text-[12.5px] font-medium ring-1 ring-rose-200 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
              <span>{fieldError}</span>
            </div>
          )}

          {/* current password */}
          <Field label="รหัสผ่านปัจจุบัน" required>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
              placeholder="ใส่รหัสผ่านปัจจุบัน"
              autoFocus
            />
          </Field>

          {/* new password */}
          <Field label="รหัสผ่านใหม่" required>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(v => !v)}
              placeholder="อย่างน้อย 8 ตัวอักษร"
            />
          </Field>

          {/* requirements */}
          {newPassword.length > 0 && (
            <div className="bg-slate-50 ring-1 ring-slate-100 rounded-xl px-3.5 py-2.5 space-y-1">
              {rules.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[11.5px]">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 shrink-0 ${r.ok ? 'text-emerald-500' : 'text-slate-300'}`}
                    strokeWidth={2.2}
                  />
                  <span className={r.ok ? 'text-slate-700 font-medium' : 'text-slate-400'}>{r.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* confirm */}
          <Field label="ยืนยันรหัสผ่านใหม่" required>
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showNew}
              onToggle={() => setShowNew(v => !v)}
              placeholder="ใส่รหัสผ่านใหม่อีกครั้ง"
              error={confirmPassword.length > 0 && !matchOk}
            />
            {confirmPassword.length > 0 && !matchOk && (
              <p className="text-[11.5px] text-rose-600 mt-1.5 font-medium">รหัสผ่านไม่ตรงกัน</p>
            )}
            {confirmPassword.length > 0 && matchOk && (
              <p className="text-[11.5px] text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> ตรงกันแล้ว
              </p>
            )}
          </Field>

          {/* buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg text-[13.5px] font-medium text-slate-700 bg-white ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading || !passedAll || !matchOk || !currentPassword}
              className="flex-1 py-2.5 rounded-lg text-[13.5px] font-semibold text-white transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: BRAND.primary, boxShadow: `0 4px 12px ${BRAND.primary}40` }}
            >
              {isLoading ? 'กำลังเปลี่ยน...' : 'ยืนยันเปลี่ยนรหัสผ่าน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── sub-components ───────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[12.5px] font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function PasswordInput({ value, onChange, show, onToggle, placeholder, autoFocus, error }) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required
        className={`w-full bg-slate-50/70 border pl-3.5 pr-10 py-2.5 rounded-lg focus:bg-white focus:ring-2 outline-none transition-all text-[13.5px] text-slate-800 placeholder:text-slate-400 ${
          error
            ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400'
            : 'border-slate-200 focus:ring-[#1E487A]/15 focus:border-[#1E487A]'
        }`}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute right-0 top-0 h-full px-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" strokeWidth={1.8} /> : <Eye className="h-4 w-4" strokeWidth={1.8} />}
      </button>
    </div>
  );
}
