import React, { useState } from 'react';
import { X, KeyRound } from 'lucide-react';

export default function StaffSetPasswordModal({ isOpen, onClose, empId, vercelApiBase, getIdToken, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  if (!isOpen) return null;
  const close = () => {
    if (saving) return;
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(''); onClose();
  };
  const save = async (event) => {
    event.preventDefault();
    setError('');
    if (newPassword.trim().length < 8 || newPassword.length > 1024 || newPassword.trim() === String(empId || '').trim()) {
      setError('ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร และห้ามใช้รหัสพนักงาน'); return;
    }
    if (newPassword !== confirmPassword) { setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return; }
    if (newPassword === currentPassword) { setError('รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม'); return; }
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('กรุณาเข้าสู่ระบบใหม่');
      const response = await fetch(`${vercelApiBase}/api/staff-change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      if (result.session) {
        const { supabase } = await import('../firebase.js');
        const { error: sessionError } = await supabase.auth.setSession(result.session);
        if (sessionError) throw new Error('เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบใหม่');
      }
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      onSuccess?.('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว'); onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  const inputClass='w-full border border-stone-200/60 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-clay-600/15';
  return (
    <div className="fixed inset-0 z-[100] bg-stone-950/50 flex items-center justify-center p-4" onClick={close}>
      <section role="dialog" aria-modal="true" aria-labelledby="staff-password-title" className="w-full max-w-md bg-white rounded-lg border border-stone-200/60" onClick={(event)=>event.stopPropagation()}>
        <div className="px-7 py-5 flex items-center justify-between border-b border-stone-100">
          <h3 id="staff-password-title" className="text-[19px] font-medium flex items-center gap-2"><KeyRound className="h-5 w-5" />เปลี่ยนรหัสผ่าน</h3>
          <button type="button" onClick={close} aria-label="ปิด" disabled={saving}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={save} className="px-7 py-5 space-y-4">
          <p className="text-[13px] text-stone-500">ใช้รหัสส่วนตัวอย่างน้อย 8 ตัวอักษร หากลืมรหัส ให้ติดต่อ IT เพื่อรีเซ็ต</p>
          <label className="block text-[13px] text-stone-500">รหัสผ่านปัจจุบัน
            <input className={inputClass} type="password" value={currentPassword} onChange={(event)=>setCurrentPassword(event.target.value)} required maxLength={1024} autoComplete="current-password" />
          </label>
          <label className="block text-[13px] text-stone-500">รหัสผ่านใหม่
            <input className={inputClass} type="password" value={newPassword} onChange={(event)=>setNewPassword(event.target.value)} required minLength={8} maxLength={1024} autoComplete="new-password" />
          </label>
          <label className="block text-[13px] text-stone-500">ยืนยันรหัสผ่านใหม่
            <input className={inputClass} type="password" value={confirmPassword} onChange={(event)=>setConfirmPassword(event.target.value)} required minLength={8} maxLength={1024} autoComplete="new-password" />
          </label>
          {error && <p role="alert" className="text-[13px] text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} disabled={saving} className="rounded-xl px-4 py-2 text-sm border border-stone-200/60">ยกเลิก</button>
            <button type="submit" disabled={saving} className="bg-clay-600 hover:bg-clay-700 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
