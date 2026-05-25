import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Settings, Mail, Save, ShieldAlert, Wrench, Package } from 'lucide-react';
import { cls, BRAND } from '../ui/theme.js';

/* ── ตัวอย่างอีเมลในช่องกรอก (placeholder เท่านั้น) ── */
const PLACEHOLDER_IT_EMAIL = 'example@company.com';
const PLACEHOLDER_HR_EMAIL = 'example@company.com';

export default function SystemSettingsPage({ isSuperAdmin = false }) {
  const [itEmail, setItEmail] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* ── โหลดค่าจาก Firestore ── */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'notifications'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setItEmail(d.itEmail || '');
        setHrEmail(d.hrEmail || '');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── บันทึก ── */
  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const it = itEmail.trim();
    const hr = hrEmail.trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (it && !emailRe.test(it)) { setError('รูปแบบอีเมล IT ไม่ถูกต้อง'); return; }
    if (hr && !emailRe.test(hr)) { setError('รูปแบบอีเมล HR ไม่ถูกต้อง'); return; }

    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'notifications'), {
        itEmail: it,
        hrEmail: hr,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSuccess('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      setError(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  /* ── ผู้ที่ไม่ใช่ SuperAdmin — ไม่อนุญาต ── */
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-rose-500" strokeWidth={1.8} />
        </div>
        <p className="font-semibold text-slate-600 text-[15px]">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-[13px] text-slate-400">หน้านี้สำหรับผู้ดูแลระบบสูงสุด (SuperAdmin) เท่านั้น</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#1E487A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: `${BRAND.primary}15`, color: BRAND.primary }}
        >
          <Settings className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-[19px] font-bold text-slate-800 tracking-tight">ตั้งค่าระบบ</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">กำหนดอีเมลปลายทางสำหรับการแจ้งเตือน</p>
        </div>
      </div>

      {/* ── Email settings card ── */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">

        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <Mail className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
          <h2 className="text-[15px] font-bold text-slate-800">อีเมลแจ้งเตือน</h2>
        </div>

        <div className="px-6 py-5 space-y-5">

          <p className="text-[13.5px] text-slate-500 leading-relaxed bg-slate-50 rounded-xl px-3.5 py-3 ring-1 ring-slate-200">
            เมื่อมีการเปลี่ยนผู้รับผิดชอบ สามารถแก้อีเมลที่นี่ได้เลย — มีผลทันทีโดยไม่ต้องแก้โค้ดหรือ deploy ใหม่
          </p>

          {/* IT email */}
          <div>
            <label className={cls.label}>
              <span className="inline-flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-[#1E487A]" strokeWidth={2} />
                อีเมลฝ่าย IT
              </span>
            </label>
            <input
              type="email"
              className={cls.input}
              placeholder={PLACEHOLDER_IT_EMAIL}
              value={itEmail}
              onChange={e => setItEmail(e.target.value)}
            />
            <p className="text-[12px] text-slate-400 mt-1">
              รับแจ้งเตือน: แจ้งซ่อม / ปัญหา IT, ขอเปลี่ยนเครื่อง, License ใกล้หมดอายุ
            </p>
          </div>

          {/* HR email */}
          <div>
            <label className={cls.label}>
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-[#1E487A]" strokeWidth={2} />
                อีเมลฝ่าย HR
              </span>
            </label>
            <input
              type="email"
              className={cls.input}
              placeholder={PLACEHOLDER_HR_EMAIL}
              value={hrEmail}
              onChange={e => setHrEmail(e.target.value)}
            />
            <p className="text-[12px] text-slate-400 mt-1">
              รับแจ้งเตือน: คำขอเบิกอุปกรณ์สำนักงาน
            </p>
          </div>

          <p className="text-[12px] text-slate-400">
            * หากเว้นว่างไว้ ระบบจะใช้อีเมลค่าเริ่มต้นที่ตั้งไว้ในระบบ
          </p>

          {/* Error / Success */}
          {error && (
            <div className="px-3.5 py-2.5 bg-rose-50 text-rose-600 text-[14px] font-medium rounded-xl ring-1 ring-rose-200">
              {error}
            </div>
          )}
          {success && (
            <div className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 text-[14px] font-medium rounded-xl ring-1 ring-emerald-200">
              {success}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={cls.btnPrimary}
            style={{ minWidth: 130 }}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                กำลังบันทึก...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="h-4 w-4" strokeWidth={2} />
                บันทึกการตั้งค่า
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
