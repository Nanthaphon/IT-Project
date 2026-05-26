import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase.js';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Plus, Pencil, Trash2, Users, Shield, Eye, CheckSquare, Square, X, KeyRound } from 'lucide-react';
import { cls, BRAND } from '../ui/theme.js';

/* ── Firebase secondary app (to create users without logging out) ── */
const firebaseConfig = {
  apiKey: "AIzaSyAyOWP7fsCUYh2cevBPBpehP85p7tuy-hM",
  authDomain: "it-asset-management-dc883.firebaseapp.com",
  projectId: "it-asset-management-dc883",
  storageBucket: "it-asset-management-dc883.firebasestorage.app",
  messagingSenderId: "897937967642",
  appId: "1:897937967642:web:9b0ccc5ca28a8c57f55fa3",
};
const secondaryApp = getApps().find(a => a.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

/* ── Menu definitions ── */
const ALL_MENU_IDS = [
  'dashboard', 'assets', 'licenses', 'accessories', 'office_supplies',
  'supply_requests', 'employees', 'repairs', 'replacement_requests',
  'kpi_dashboard', 'field_options', 'it_report',
];

const MENU_LABELS = {
  dashboard:            'แดชบอร์ด',
  assets:               'ทรัพย์สิน IT หลัก',
  licenses:             'โปรแกรม / License',
  accessories:          'อุปกรณ์เสริม',
  office_supplies:      'อุปกรณ์สำนักงาน',
  supply_requests:      'คำขอเบิกอุปกรณ์',
  employees:            'ข้อมูลพนักงาน',
  repairs:              'แจ้งปัญหา IT',
  replacement_requests: 'ขอเปลี่ยนเครื่อง',
  kpi_dashboard:        'รายงาน KPI',
  field_options:        'ตัวเลือกฟิลด์',
  it_report:            'สร้าง IT Report',
};

/* ── Empty form state ── */
const EMPTY_FORM = {
  displayName: '',
  email: '',
  password: '',
  level: 'view',
  menus: [],
  canManagePasswords: false,
};

/* ─────────────────────────────────────────────────────────────── */
export default function UserManagementPage({ isSuperAdmin = false, canManagePasswords = false }) {
  // SuperAdmin = จัดการผู้ใช้ได้เต็มที่ / canManagePasswords = รีเซ็ตรหัสผ่านได้อย่างเดียว
  const canFullManage = isSuperAdmin;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = new user
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(null); // user object

  /* ── Reset password modal state ── */
  const [pwUser, setPwUser] = useState(null);   // user object being reset
  const [pwValue, setPwValue] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  /* ── Live-sync admin_users collection ── */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admin_users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── Open modal ── */
  function openAdd() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditingUser(user);
    setForm({
      displayName: user.displayName || '',
      email: user.email || '',
      password: '',
      level: user.permissions?.level || 'view',
      menus: user.permissions?.menus || [],
      canManagePasswords: user.permissions?.canManagePasswords || false,
    });
    setError('');
    setModalOpen(true);
  }

  /* ── Reset password ── */
  function openResetPassword(user) {
    setPwUser(user);
    setPwValue('');
    setPwConfirm('');
    setPwError('');
    setPwSuccess('');
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwValue.length < 6) { setPwError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (pwValue !== pwConfirm) { setPwError('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return; }

    setPwSaving(true);
    try {
      // ── เรียก Vercel API endpoint (api/set-password.js) ──
      const idToken = await auth.currentUser.getIdToken();
      const resp = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, targetUid: pwUser.id, newPassword: pwValue }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
      setPwSuccess('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว');
      setPwValue('');
      setPwConfirm('');
    } catch (err) {
      console.error(err);
      setPwError(err.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
    } finally {
      setPwSaving(false);
    }
  }

  /* ── Save ── */
  async function handleSave(e) {
    e.preventDefault();
    setError('');
    if (!form.displayName.trim()) { setError('กรุณากรอกชื่อผู้ใช้'); return; }

    setSaving(true);
    try {
      if (editingUser) {
        /* ── Edit existing ── */
        await setDoc(doc(db, 'admin_users', editingUser.id), {
          ...editingUser,
          displayName: form.displayName.trim(),
          permissions: { menus: form.menus, level: form.level, canManagePasswords: form.canManagePasswords },
        }, { merge: true });
      } else {
        /* ── Create new ── */
        if (!form.email.trim()) { setError('กรุณากรอก Email'); setSaving(false); return; }
        if (!form.password.trim()) { setError('กรุณากรอกรหัสผ่าน'); setSaving(false); return; }
        if (form.password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); setSaving(false); return; }

        const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), form.password);
        const newUid = cred.user.uid;
        await secondaryAuth.signOut();

        await setDoc(doc(db, 'admin_users', newUid), {
          uid: newUid,
          email: form.email.trim(),
          displayName: form.displayName.trim(),
          isSuperAdmin: false,
          permissions: { menus: form.menus, level: form.level, canManagePasswords: form.canManagePasswords },
          createdAt: serverTimestamp(),
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Email นี้ถูกใช้งานแล้ว');
      else if (err.code === 'auth/invalid-email') setError('รูปแบบ Email ไม่ถูกต้อง');
      else setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ── */
  async function handleDelete(user) {
    try {
      await deleteDoc(doc(db, 'admin_users', user.id));
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    }
  }

  /* ── Menu checkbox helpers ── */
  function toggleMenu(id) {
    setForm(prev => ({
      ...prev,
      menus: prev.menus.includes(id) ? prev.menus.filter(m => m !== id) : [...prev.menus, id],
    }));
  }

  function selectAll()  { setForm(prev => ({ ...prev, menus: [...ALL_MENU_IDS] })); }
  function clearAll()   { setForm(prev => ({ ...prev, menus: [] })); }

  /* ── Date formatter ── */
  function fmtDate(ts) {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('th-TH', { dateStyle: 'medium' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#1E487A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: `${BRAND.primary}15`, color: BRAND.primary }}
          >
            <Users className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[19px] font-bold text-slate-800 tracking-tight">จัดการผู้ใช้งานระบบ</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">{users.length} บัญชีในระบบ</p>
          </div>
        </div>

        {canFullManage && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-sm hover:shadow-md"
            style={{ background: BRAND.primary, boxShadow: `0 4px 12px ${BRAND.primary}33` }}
            onMouseEnter={e => (e.currentTarget.style.background = BRAND.primaryDark)}
            onMouseLeave={e => (e.currentTarget.style.background = BRAND.primary)}
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            เพิ่มผู้ใช้
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">ชื่อ</th>
                <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Email</th>
                <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 text-center">สิทธิ์</th>
                <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 text-center">เมนูที่เข้าถึงได้</th>
                <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">วันที่สร้าง</th>
                <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[14.5px] bg-white">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">

                  {/* ชื่อ */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[15px] shrink-0 shadow-sm"
                        style={{ background: user.isSuperAdmin ? `${BRAND.primary}20` : '#f1f5f9', color: user.isSuperAdmin ? BRAND.primary : '#64748b' }}
                      >
                        {(user.displayName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{user.displayName || '-'}</p>
                        {user.isSuperAdmin && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1E487A]/10 text-[#1E487A] mt-0.5">
                            <Shield className="h-2.5 w-2.5" strokeWidth={2.2} />
                            SuperAdmin
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3.5 text-slate-600 font-mono text-[13.5px]">{user.email || '-'}</td>

                  {/* สิทธิ์ */}
                  <td className="px-5 py-3.5 text-center">
                    {user.isSuperAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#1E487A] text-white ring-1 ring-[#1E487A]">
                        Full
                      </span>
                    ) : user.permissions?.level === 'full' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        แก้ไขได้
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
                        <Eye className="h-3 w-3" strokeWidth={2} />
                        ดูอย่างเดียว
                      </span>
                    )}
                  </td>

                  {/* เมนูที่เข้าถึง */}
                  <td className="px-5 py-3.5 text-center">
                    {user.isSuperAdmin ? (
                      <span className="text-[14px] font-semibold text-[#1E487A]">ทั้งหมด ({ALL_MENU_IDS.length})</span>
                    ) : (
                      <span className="text-[14px] font-semibold text-slate-700">
                        {(user.permissions?.menus || []).length} / {ALL_MENU_IDS.length}
                      </span>
                    )}
                  </td>

                  {/* วันที่สร้าง */}
                  <td className="px-5 py-3.5 text-slate-500 text-[13.5px]">{fmtDate(user.createdAt)}</td>

                  {/* จัดการ */}
                  <td className="px-5 py-3.5 text-center">
                    {(() => {
                      const canReset = (canFullManage || canManagePasswords) && !user.isSuperAdmin;
                      const canEditDelete = canFullManage && !user.isSuperAdmin;
                      if (!canReset && !canEditDelete) {
                        return <span className="text-[12px] text-slate-400">-</span>;
                      }
                      return (
                        <div className="flex items-center justify-center gap-1.5">
                          {canReset && (
                            <IconBtn onClick={() => openResetPassword(user)} title="รีเซ็ตรหัสผ่าน" kind="primary">
                              <KeyRound className="h-3.5 w-3.5" strokeWidth={2} />
                            </IconBtn>
                          )}
                          {canEditDelete && (
                            <>
                              <IconBtn onClick={() => openEdit(user)} title="แก้ไข" kind="warning">
                                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                              </IconBtn>
                              <IconBtn onClick={() => setConfirmDelete(user)} title="ลบ" kind="danger">
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                              </IconBtn>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-[14px]">
                    ยังไม่มีผู้ใช้งานในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[85]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-slate-200/60 flex flex-col max-h-[92vh]">

            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.primary}15`, color: BRAND.primary }}>
                  <Users className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <h2 className="text-[16px] font-bold text-slate-800">
                  {editingUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* body */}
            <form onSubmit={handleSave} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* ชื่อ */}
              <div>
                <label className={cls.label}>ชื่อผู้ใช้งาน <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  className={cls.input}
                  placeholder="เช่น สมชาย ใจดี"
                  value={form.displayName}
                  onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                  required
                />
              </div>

              {/* Email (new only) */}
              {!editingUser && (
                <div>
                  <label className={cls.label}>Email <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    className={cls.input}
                    placeholder="user@example.com"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              )}

              {/* Password (new only) */}
              {!editingUser && (
                <div>
                  <label className={cls.label}>รหัสผ่าน <span className="text-rose-500">*</span></label>
                  <input
                    type="password"
                    className={cls.input}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={form.password}
                    onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
              )}

              {/* Access level */}
              <div>
                <label className={cls.label}>ระดับสิทธิ์การเข้าถึง</label>
                <div className="flex gap-4 mt-1.5">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="level"
                      value="view"
                      checked={form.level === 'view'}
                      onChange={() => setForm(prev => ({ ...prev, level: 'view' }))}
                      className="w-4 h-4 text-[#1E487A] border-slate-300 focus:ring-[#1E487A]"
                    />
                    <span className="text-[14.5px] text-slate-700 font-medium group-hover:text-slate-900 select-none">
                      ดูอย่างเดียว
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="level"
                      value="full"
                      checked={form.level === 'full'}
                      onChange={() => setForm(prev => ({ ...prev, level: 'full' }))}
                      className="w-4 h-4 text-[#1E487A] border-slate-300 focus:ring-[#1E487A]"
                    />
                    <span className="text-[14.5px] text-slate-700 font-medium group-hover:text-slate-900 select-none">
                      แก้ไขได้ทุกอย่าง
                    </span>
                  </label>
                </div>
              </div>

              {/* Menu checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cls.label + ' !mb-0'}>เมนูที่เข้าถึงได้</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[13px] text-[#1E487A] font-semibold hover:underline flex items-center gap-1"
                    >
                      <CheckSquare className="h-3 w-3" strokeWidth={2} />
                      เลือกทั้งหมด
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-[13px] text-slate-500 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Square className="h-3 w-3" strokeWidth={2} />
                      ล้างทั้งหมด
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 p-3 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                  {ALL_MENU_IDS.map(id => (
                    <label
                      key={id}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white cursor-pointer transition-colors select-none"
                    >
                      <input
                        type="checkbox"
                        checked={form.menus.includes(id)}
                        onChange={() => toggleMenu(id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A] focus:ring-offset-0"
                      />
                      <span className="text-[13.5px] text-slate-700 font-medium truncate">
                        {MENU_LABELS[id]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* สิทธิ์จัดการรหัสผ่าน */}
              <div>
                <label className={cls.label}>สิทธิ์พิเศษ</label>
                <label className="flex items-start gap-2.5 px-3.5 py-3 bg-slate-50 rounded-xl ring-1 ring-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors select-none mt-1.5">
                  <input
                    type="checkbox"
                    checked={form.canManagePasswords}
                    onChange={() => setForm(prev => ({ ...prev, canManagePasswords: !prev.canManagePasswords }))}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A] focus:ring-offset-0"
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-slate-700">อนุญาตให้รีเซ็ตรหัสผ่านผู้ใช้อื่น</p>
                    <p className="text-[12.5px] text-slate-400 mt-0.5">
                      ผู้ใช้คนนี้จะเข้าหน้าจัดการผู้ใช้ และตั้งรหัสผ่านใหม่ให้บัญชีอื่นได้
                    </p>
                  </div>
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="px-3.5 py-2.5 bg-rose-50 text-rose-600 text-[14px] font-medium rounded-xl ring-1 ring-rose-200">
                  {error}
                </div>
              )}

            </form>

            {/* footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className={cls.btnSecondary}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={cls.btnPrimary}
                style={{ minWidth: 96 }}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังบันทึก...
                  </span>
                ) : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-slate-200/60">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-5 w-5 text-rose-600" strokeWidth={2} />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 text-center mb-1">ยืนยันการลบผู้ใช้</h3>
              <p className="text-[14px] text-slate-500 text-center">
                คุณต้องการลบ <span className="font-semibold text-slate-700">{confirmDelete.displayName}</span> ออกจากระบบใช่หรือไม่?
                ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้อีกต่อไป
              </p>
            </div>
            <div className="flex items-center gap-2.5 px-6 pb-5">
              <button
                onClick={() => setConfirmDelete(null)}
                className={cls.btnSecondary + ' flex-1'}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className={cls.btnDanger + ' flex-1'}
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {pwUser && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-slate-200/60">

            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.primary}15`, color: BRAND.primary }}>
                  <KeyRound className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <h2 className="text-[16px] font-bold text-slate-800">รีเซ็ตรหัสผ่าน</h2>
              </div>
              <button
                onClick={() => setPwUser(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* body */}
            <form onSubmit={handleResetPassword} className="px-6 py-5 space-y-4">
              <p className="text-[14px] text-slate-500">
                ตั้งรหัสผ่านใหม่ให้ <span className="font-semibold text-slate-700">{pwUser.displayName}</span>
                {pwUser.email && <span className="text-slate-400"> ({pwUser.email})</span>}
              </p>
              <div>
                <label className={cls.label}>รหัสผ่านใหม่ <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  className={cls.input}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={pwValue}
                  onChange={e => setPwValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={cls.label}>ยืนยันรหัสผ่านใหม่ <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  className={cls.input}
                  placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  required
                />
              </div>
              {pwError && (
                <div className="px-3.5 py-2.5 bg-rose-50 text-rose-600 text-[14px] font-medium rounded-xl ring-1 ring-rose-200">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 text-[14px] font-medium rounded-xl ring-1 ring-emerald-200">
                  {pwSuccess}
                </div>
              )}
            </form>

            {/* footer */}
            <div className="flex items-center gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setPwUser(null)}
                className={cls.btnSecondary + ' flex-1'}
              >
                ปิด
              </button>
              <button
                onClick={handleResetPassword}
                disabled={pwSaving}
                className={cls.btnPrimary + ' flex-1'}
              >
                {pwSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังตั้งรหัส...
                  </span>
                ) : 'ตั้งรหัสผ่าน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Icon button helper ── */
function IconBtn({ onClick, title, children, kind }) {
  const map = {
    warning: 'text-amber-600 hover:bg-amber-50 hover:ring-amber-300',
    danger:  'text-rose-500 hover:bg-rose-50 hover:ring-rose-300',
    primary: 'text-[#1E487A] hover:bg-blue-50 hover:ring-blue-300',
  }[kind];
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 bg-white ring-1 ring-inset ring-slate-200 rounded-lg transition-colors ${map}`}
    >
      {children}
    </button>
  );
}
