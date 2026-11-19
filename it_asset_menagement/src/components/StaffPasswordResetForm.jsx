import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { auth, VERCEL_API_BASE } from '../firebase.js';

export default function StaffPasswordResetForm({ empDocId, empName, empId }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const save = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (password.trim().length < 8 || password.length > 1024 || password.trim() === String(empId || '').trim()) {
      setMessage({ error: true, text: 'ใช้รหัสผ่านชั่วคราวอย่างน้อย 8 ตัวอักษร และห้ามใช้รหัสพนักงาน' });
      return;
    }
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('กรุณาเข้าสู่ระบบผู้ดูแลใหม่');
      const response = await fetch(`${VERCEL_API_BASE}/api/set-staff-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ empDocId, newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
      setPassword('');
      setMessage({ text: `ตั้งรหัสชั่วคราวให้ ${empName || 'พนักงาน'} แล้ว พนักงานต้องเปลี่ยนรหัสเมื่อเข้าสู่ระบบ` });
    } catch (error) { setMessage({ error: true, text: error.message }); }
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={save} className="px-4 py-3 space-y-3">
      <p className="text-[13px] text-stone-500">ระบบไม่เก็บรหัสผ่านให้เปิดดู หากพนักงานลืมรหัส ให้ตั้งรหัสชั่วคราวแล้วแจ้งเจ้าตัว</p>
      <label className="block text-[13px] text-stone-500" htmlFor="staff-temporary-password">รหัสผ่านชั่วคราว</label>
      <div className="flex gap-2">
        <input id="staff-temporary-password" type={show ? 'text' : 'password'} value={password}
          onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={1024}
          autoComplete="new-password" placeholder="อย่างน้อย 8 ตัวอักษร"
          className="min-w-0 flex-1 border border-stone-200/60 rounded-xl px-3 py-2 text-sm" />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'ซ่อนรหัสชั่วคราว' : 'แสดงรหัสชั่วคราว'}
          className="px-3 text-stone-500">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      </div>
      <button type="submit" disabled={saving || !password} className="inline-flex items-center gap-2 bg-clay-600 hover:bg-clay-700 text-white rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-50">
        <KeyRound className="h-4 w-4" />{saving ? 'กำลังบันทึก...' : 'ตั้งรหัสชั่วคราว'}
      </button>
      {message && <p role="status" className={`text-[13px] ${message.error ? 'text-rose-700' : 'text-olive-700'}`}>{message.text}</p>}
    </form>
  );
}
