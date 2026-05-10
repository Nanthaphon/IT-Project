import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[90] transition-opacity" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all border border-slate-100 text-center p-8">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-50 text-[#1E487A] mb-6 shadow-inner border border-blue-100">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-[#1E487A] mb-3">รีเซ็ตรหัสผ่าน</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          กรุณาระบุอีเมลที่ใช้ในระบบ <br/>เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ระบุอีเมลของคุณ..."
            required
            className="w-full border border-slate-300 p-3.5 rounded-xl focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none text-base transition-all shadow-sm text-center"
          />
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all shadow-sm"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#1E487A] hover:bg-[#133257] transition-all shadow-lg shadow-[#1E487A]/30 disabled:opacity-50"
            >
              {isLoading ? 'กำลังส่ง...' : 'ยืนยัน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}