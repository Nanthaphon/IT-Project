import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { KeyRound } from 'lucide-react';
import { BRAND, cls } from '../ui/theme.js';

export default function ResetPasswordModal({ isOpen, onClose, onSuccess, onError }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      onSuccess('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว');
      onClose();
      setEmail('');
    } catch (error) {
      onError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-slate-950/20 max-w-sm w-full overflow-hidden ring-1 ring-slate-200/60 text-center p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-5 ring-1"
          style={{ background: `${BRAND.primary}10`, color: BRAND.primary, '--tw-ring-color': `${BRAND.primary}20` }}
        >
          <KeyRound className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <h3 className="text-[19px] font-semibold mb-2 tracking-tight" style={{ color: BRAND.primary }}>
          รีเซ็ตรหัสผ่าน
        </h3>
        <p className="text-[13.5px] text-slate-500 mb-6 leading-relaxed">
          กรุณาระบุอีเมลที่ใช้ในระบบ
          <br />
          เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ระบุอีเมลของคุณ..."
            required
            className={cls.input + ' text-center'}
          />
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-[13.5px] font-medium text-slate-700 bg-white ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-lg text-[13.5px] font-semibold text-white transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: BRAND.primary, boxShadow: `0 4px 12px ${BRAND.primary}40` }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = BRAND.primaryDark)}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = BRAND.primary)}
            >
              {isLoading ? 'กำลังส่ง...' : 'ยืนยัน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
