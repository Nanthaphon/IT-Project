import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, RotateCcw, X, ShieldCheck } from 'lucide-react';
import { BRAND, cls } from '../ui/theme.js';

/**
 * Modal ให้ staff ตั้ง/เปลี่ยน/รีเซ็ตรหัสผ่านของตัวเอง
 *
 * โหมด:
 *   1. "set" → ตั้งรหัสผ่านใหม่ (ต้องกรอกรหัสเดิม + รหัสใหม่ ≥ 6 ตัว)
 *   2. "reset" → รีเซ็ตกลับเป็นรหัสพนักงาน (ต้องกรอกรหัสเดิม)
 *
 * Props:
 *   isOpen       : boolean
 *   onClose      : () => void
 *   empId        : string  (สำหรับโชว์ว่าจะรีเซ็ตเป็นอะไร)
 *   vercelApiBase: string
 *   getIdToken   : async () => string  (เอา Firebase ID token มาแนบ Authorization)
 *   onSuccess    : (msg: string) => void
 */
export default function StaffSetPasswordModal({ isOpen, onClose, empId, vercelApiBase, getIdToken, onSuccess }) {
  const [mode, setMode] = useState('set'); // 'set' | 'reset'
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setMode('set'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setShowCurrent(false); setShowNew(false); setError(''); setSubmitting(false);
  };
  const handleClose = () => { reset(); onClose(); };

  /* ── password strength ─────────────────────────── */
  const rules = [
    { label: 'อย่างน้อย 6 ตัวอักษร', ok: newPassword.length >= 6 },
    { label: 'ไม่เหมือนรหัสผ่านเดิม', ok: newPassword.length > 0 && newPassword !== currentPassword },
  ];
  const passedAll = rules.every(r => r.ok);
  const matchOk = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) { setError('กรุณากรอกรหัสผ่านปัจจุบัน'); return; }

    if (mode === 'set') {
      if (!passedAll) { setError('รหัสผ่านใหม่ยังไม่ตรงตามเงื่อนไข'); return; }
      if (!matchOk) { setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน'); return; }
    }

    setSubmitting(true);
    try {
      const idToken = await getIdToken();
      if (!idToken) throw new Error('Session หมดอายุ — กรุณา login ใหม่');

      const body = mode === 'reset'
        ? { currentPassword, resetToDefault: true }
        : { currentPassword, newPassword };

      const resp = await fetch(`${vercelApiBase}/api/staff-change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');

      const msg = mode === 'reset'
        ? `รีเซ็ตรหัสผ่านกลับเป็นรหัสพนักงาน (${empId}) เรียบร้อยแล้ว`
        : 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว';
      onSuccess?.(msg);
      handleClose();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 max-w-md w-full overflow-hidden ring-1 ring-slate-200/60 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-1"
              style={{ background: `${BRAND.primary}15`, color: BRAND.primary, '--tw-ring-color': `${BRAND.primary}20` }}
            >
              <KeyRound className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[17px] font-bold tracking-tight" style={{ color: BRAND.primary }}>
                จัดการรหัสผ่าน
              </h3>
              <p className="text-[12.5px] text-slate-500 mt-0.5">ตั้งรหัสผ่านส่วนตัว หรือใช้รหัสพนักงานเป็นรหัสผ่าน</p>
            </div>
          </div>
        </div>

        {/* ── Mode tabs ── */}
        <div className="px-6 pt-4 pb-2 flex gap-2">
          <button
            type="button"
            onClick={() => { setMode('set'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'set'
                ? 'bg-[#1E487A] text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
            ตั้งรหัสผ่านใหม่
          </button>
          <button
            type="button"
            onClick={() => { setMode('reset'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'reset'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
            ใช้รหัสพนักงาน
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto">

          {/* Info banner for current mode */}
          {mode === 'reset' ? (
            <div className="bg-amber-50/60 ring-1 ring-amber-200 rounded-xl p-3.5 space-y-1.5">
              <p className="text-[13px] font-semibold text-amber-900">รีเซ็ตเป็นค่าเริ่มต้น</p>
              <p className="text-[12.5px] text-amber-800/90 leading-relaxed">
                รหัสผ่านจะถูกตั้งกลับเป็นรหัสพนักงาน: <code className="px-1.5 py-0.5 bg-white/80 rounded font-mono font-semibold">{empId}</code>
              </p>
              <p className="text-[12px] text-amber-700/80">หลังรีเซ็ตแล้ว Login ครั้งถัดไป — ใช้รหัสพนักงานเป็นทั้ง username และ password</p>
            </div>
          ) : (
            <div className="bg-blue-50/40 ring-1 ring-blue-200 rounded-xl p-3.5">
              <p className="text-[12.5px] text-blue-900/85 leading-relaxed">
                💡 ตั้งรหัสผ่านส่วนตัวเพื่อความปลอดภัยเพิ่มเติม — ระบบจะใช้รหัสที่ตั้งนี้แทนรหัสพนักงานในการ login
              </p>
            </div>
          )}

          {/* error banner */}
          {error && (
            <div className="bg-rose-50 text-rose-700 px-3.5 py-3 rounded-xl text-[13px] font-medium ring-1 ring-rose-200 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          {/* current password */}
          <Field label="รหัสผ่านปัจจุบัน" required>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
              placeholder={`ใส่รหัสผ่านปัจจุบัน${mode === 'reset' ? ' (เช่น รหัสพนักงานหากยังไม่เคยตั้ง)' : ''}`}
              autoFocus
            />
          </Field>

          {/* new password (only in 'set' mode) */}
          {mode === 'set' && (
            <>
              <Field label="รหัสผ่านใหม่" required>
                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNew}
                  onToggle={() => setShowNew(v => !v)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                />
              </Field>

              {newPassword.length > 0 && (
                <div className="bg-slate-50 ring-1 ring-slate-100 rounded-xl px-3.5 py-2.5 space-y-1">
                  {rules.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12.5px]">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 shrink-0 ${r.ok ? 'text-emerald-500' : 'text-slate-300'}`}
                        strokeWidth={2.2}
                      />
                      <span className={r.ok ? 'text-slate-700 font-medium' : 'text-slate-400'}>{r.label}</span>
                    </div>
                  ))}
                </div>
              )}

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
                  <p className="text-[12.5px] text-rose-600 mt-1.5 font-medium">รหัสผ่านไม่ตรงกัน</p>
                )}
                {confirmPassword.length > 0 && matchOk && (
                  <p className="text-[12.5px] text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> ตรงกันแล้ว
                  </p>
                )}
              </Field>
            </>
          )}
        </form>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-lg text-[14px] font-medium text-slate-700 bg-white ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !currentPassword || (mode === 'set' && (!passedAll || !matchOk))}
            className="flex-1 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: mode === 'reset' ? '#F59E0B' : BRAND.primary,
              boxShadow: `0 4px 12px ${mode === 'reset' ? '#F59E0B40' : `${BRAND.primary}40`}`,
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                กำลังบันทึก...
              </span>
            ) : mode === 'reset' ? 'รีเซ็ตรหัสผ่าน' : 'ตั้งรหัสผ่านใหม่'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── sub-components ───────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-slate-600 mb-1.5">
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
        className={`w-full bg-slate-50/70 border pl-3.5 pr-10 py-2.5 rounded-lg focus:bg-white focus:ring-2 outline-none transition-all text-[14px] text-slate-800 placeholder:text-slate-400 ${
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
