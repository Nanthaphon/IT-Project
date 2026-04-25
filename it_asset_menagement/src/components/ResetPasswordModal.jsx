import React, { useState } from 'react';
import { auth } from '../firebase';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';

export default function ResetPasswordModal({ isOpen, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!form.currentPassword) errs.currentPassword = 'กรุณากรอกรหัสผ่านปัจจุบัน';
    if (!form.newPassword) errs.newPassword = 'กรุณากรอกรหัสผ่านใหม่';
    else if (form.newPassword.length < 6) errs.newPassword = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    if (!form.confirmPassword) errs.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่';
    else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, form.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, form.newPassword);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess('เปลี่ยนรหัสผ่านสำเร็จ');
      onClose();
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrors({ currentPassword: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      } else {
        onError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">🔒</div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h2>
              <p className="text-xs text-slate-400">รีเซ็ตรหัสผ่านสำหรับบัญชี Admin</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่านปัจจุบัน</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.currentPassword ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
              placeholder="กรอกรหัสผ่านปัจจุบัน"
            />
            {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่านใหม่</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.newPassword ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
              placeholder="อย่างน้อย 6 ตัวอักษร"
            />
            {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.confirmPassword ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
