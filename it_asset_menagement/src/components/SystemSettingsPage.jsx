import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Settings, MessageCircle, Save, ShieldAlert, Wrench, Package, User, Copy, RefreshCw, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { cls, BRAND } from '../ui/theme.js';

export default function SystemSettingsPage({ isSuperAdmin = false }) {
  const [itLineUserId, setItLineUserId] = useState('');
  const [hrLineUserId, setHrLineUserId] = useState('');
  const [recentUsers, setRecentUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');   // 🆕 search "ผู้ใช้ LINE ล่าสุด"
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // 🆕 Modal สำหรับยืนยันการลบ
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null, deleting: false, error: '' });

  /* ── โหลดค่าจาก Firestore ── */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'notifications'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setItLineUserId(d.itLineUserId || '');
        setHrLineUserId(d.hrLineUserId || '');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── โหลด LINE users ล่าสุด (ที่บอตเคยเจอ) ── */
  useEffect(() => {
    // 🆕 เพิ่มลิมิตเป็น 100 (เดิม 10 น้อยเกินไป ทำให้ user บางคนไม่แสดง)
    const q = query(collection(db, 'line_users'), orderBy('lastSeen', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setRecentUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  /* ── บันทึก ── */
  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 🆕 รองรับหลาย ID (คั่นด้วย newline หรือ ",")
    const lineIdRe = /^U[0-9a-f]{32}$/i;
    const splitAndClean = (raw) => String(raw || '').split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    const itList = splitAndClean(itLineUserId);
    const hrList = splitAndClean(hrLineUserId);

    // Validate ทุก ID ในลิสต์
    for (const id of itList) {
      if (!lineIdRe.test(id)) { setError(`IT: รูปแบบ User ID "${id}" ไม่ถูกต้อง (ต้องขึ้นต้นด้วย U + 32 ตัวอักษร)`); return; }
    }
    for (const id of hrList) {
      if (!lineIdRe.test(id)) { setError(`HR: รูปแบบ User ID "${id}" ไม่ถูกต้อง (ต้องขึ้นต้นด้วย U + 32 ตัวอักษร)`); return; }
    }
    // Dedupe ในแต่ละกลุ่ม
    const it = [...new Set(itList)].join('\n');
    const hr = [...new Set(hrList)].join('\n');

    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'notifications'), {
        itLineUserId: it,
        hrLineUserId: hr,
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

  const copy = (text) => { navigator.clipboard?.writeText(text); };

  // 🆕 ลบ user ออกจากรายการ "ผู้ใช้ LINE ล่าสุด"
  const openDeleteModal = (user) => {
    setDeleteModal({ open: true, user, deleting: false, error: '' });
  };
  const confirmDeleteLineUser = async () => {
    if (!deleteModal.user) return;
    setDeleteModal(m => ({ ...m, deleting: true, error: '' }));
    try {
      await deleteDoc(doc(db, 'line_users', deleteModal.user.userId));
      setDeleteModal({ open: false, user: null, deleting: false, error: '' });
    } catch (err) {
      console.error('Delete line_user failed:', err);
      setDeleteModal(m => ({ ...m, deleting: false, error: err.message || 'ลบไม่สำเร็จ' }));
    }
  };

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
    <div className="flex flex-col gap-6 max-w-3xl">

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
          <p className="text-[13px] text-slate-400 mt-0.5">กำหนดผู้รับแจ้งเตือนผ่าน LINE Official Account</p>
        </div>
      </div>

      {/* ── วิธีใช้ ── */}
      <div className="bg-emerald-50/50 ring-1 ring-emerald-200/70 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-emerald-700">
          <MessageCircle className="h-4 w-4" strokeWidth={2} />
          <p className="text-[14px] font-semibold">วิธีตั้งค่า LINE OA</p>
        </div>
        <ol className="text-[13px] text-emerald-900/80 leading-relaxed space-y-1 list-decimal pl-5">
          <li>เพิ่ม LINE Official Account เป็นเพื่อน (จาก QR code ที่ admin มี)</li>
          <li>ส่งข้อความใดก็ได้หาบอต — บอตจะตอบกลับด้วย <strong>User ID</strong> ของคุณ</li>
          <li>คัดลอก User ID นั้น มาวางในช่องด้านล่าง (IT หรือ HR)</li>
          <li>หรือเลือกจากรายการ <strong>"ผู้ใช้ LINE ล่าสุด"</strong> ด้านล่างที่บอตเคยเจอ</li>
        </ol>
      </div>

      {/* ── LINE settings card ── */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">

        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <MessageCircle className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
          <h2 className="text-[15px] font-bold text-slate-800">ผู้รับแจ้งเตือนผ่าน LINE</h2>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* IT LINE User ID */}
          <div>
            <label className={cls.label}>
              <span className="inline-flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-[#1E487A]" strokeWidth={2} />
                LINE User ID ฝ่าย IT
              </span>
            </label>
            <textarea
              className={cls.inputMono + ' min-h-[80px] resize-y'}
              placeholder={`Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nUyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`}
              value={itLineUserId}
              onChange={e => setItLineUserId(e.target.value)}
              spellCheck={false}
              rows={3}
            />
            <p className="text-[12px] text-slate-400 mt-1">
              รับแจ้งเตือน: แจ้งซ่อม / ปัญหา IT, ขอเปลี่ยนเครื่อง, License ใกล้หมดอายุ
              <br />
              💡 <span className="font-medium">แจ้งได้หลายคน</span> — ใส่ 1 User ID ต่อบรรทัด (หรือคั่นด้วยเครื่องหมาย ",")
            </p>
          </div>

          {/* HR LINE User ID */}
          <div>
            <label className={cls.label}>
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-[#1E487A]" strokeWidth={2} />
                LINE User ID ฝ่าย HR
              </span>
            </label>
            <textarea
              className={cls.inputMono + ' min-h-[80px] resize-y'}
              placeholder={`Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nUyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`}
              value={hrLineUserId}
              onChange={e => setHrLineUserId(e.target.value)}
              spellCheck={false}
              rows={3}
            />
            <p className="text-[12px] text-slate-400 mt-1">
              รับแจ้งเตือน: คำขอเบิกอุปกรณ์สำนักงาน
              <br />
              💡 <span className="font-medium">แจ้งได้หลายคน</span> — ใส่ 1 User ID ต่อบรรทัด (หรือคั่นด้วยเครื่องหมาย ",")
            </p>
          </div>

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

      {/* ── Recent LINE users ── */}
      {(() => {
        // 🆕 filter ด้วย search term (ชื่อ หรือ User ID)
        const term = userSearch.trim().toLowerCase();
        const filteredUsers = term
          ? recentUsers.filter(u =>
              (u.displayName || '').toLowerCase().includes(term) ||
              (u.userId || '').toLowerCase().includes(term)
            )
          : recentUsers;
        return (
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5 flex-wrap">
          <User className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
          <h2 className="text-[15px] font-bold text-slate-800">ผู้ใช้ LINE ล่าสุด</h2>
          <span className="text-[12px] text-slate-400">
            {term ? `${filteredUsers.length}/${recentUsers.length}` : recentUsers.length} คน
          </span>
          {recentUsers.length > 3 && (
            <input
              type="text"
              placeholder="🔍 ค้นหาชื่อ/User ID..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="ml-auto w-full sm:w-64 px-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A]"
            />
          )}
        </div>
        {filteredUsers.length === 0 ? (
          <div className="px-6 py-12 text-center text-[14px] text-slate-400">
            <RefreshCw className="h-5 w-5 mx-auto mb-2 opacity-50" strokeWidth={1.6} />
            {term ? (
              <>ไม่พบผู้ใช้ที่ตรงกับ "<span className="font-semibold text-slate-500">{term}</span>"</>
            ) : (
              <>ยังไม่มีผู้ใช้ LINE ใดส่งข้อความเข้ามา<br />
                <span className="text-[12.5px]">เพิ่มบอตเป็นเพื่อนและส่งข้อความ "hello" จะปรากฏที่นี่</span>
              </>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredUsers.map(u => (
              <li key={u.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                {u.pictureUrl ? (
                  <img src={u.pictureUrl} alt={u.displayName} className="w-10 h-10 rounded-full ring-1 ring-slate-200 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-slate-400">
                    <User className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-slate-800 truncate">{u.displayName || '(ไม่มีชื่อ)'}</p>
                  <p className="text-[11.5px] text-slate-400 font-mono truncate">{u.userId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(u.userId)}
                  className={cls.btnGhost}
                  title="คัดลอก User ID"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={2} /> Copy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // 🆕 เพิ่มต่อลิสต์ IT (ถ้ายังไม่มี)
                    const existing = new Set(String(itLineUserId || '').split(/[\n,]/).map(s => s.trim()).filter(Boolean));
                    if (existing.has(u.userId)) return;
                    existing.add(u.userId);
                    setItLineUserId([...existing].join('\n'));
                  }}
                  className="px-2.5 py-1.5 text-[12px] font-medium text-[#1E487A] rounded-lg ring-1 ring-[#1E487A]/30 hover:bg-[#1E487A]/5 transition-colors"
                  title="เพิ่มเข้าลิสต์ IT"
                >
                  + IT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // 🆕 เพิ่มต่อลิสต์ HR (ถ้ายังไม่มี)
                    const existing = new Set(String(hrLineUserId || '').split(/[\n,]/).map(s => s.trim()).filter(Boolean));
                    if (existing.has(u.userId)) return;
                    existing.add(u.userId);
                    setHrLineUserId([...existing].join('\n'));
                  }}
                  className="px-2.5 py-1.5 text-[12px] font-medium text-emerald-700 rounded-lg ring-1 ring-emerald-300 hover:bg-emerald-50 transition-colors"
                  title="เพิ่มเข้าลิสต์ HR"
                >
                  + HR
                </button>
                <button
                  type="button"
                  onClick={() => openDeleteModal(u)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"
                  title="ลบรายการนี้"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
        );
      })()}

      {/* ── คู่มือสั้น ๆ สำหรับพนักงานที่อยากรับแจ้งเตือนผ่าน LINE ── */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF', color: BRAND.primary }}>
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.2} />
          </div>
          <p className="text-[14px] font-bold text-slate-800 tracking-tight">วิธีให้พนักงานรับแจ้งเตือนผ่าน LINE</p>
        </div>

        <ol className="px-5 py-5 space-y-3">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#1E487A] text-white text-[12px] font-bold flex items-center justify-center shrink-0">1</span>
            <div className="flex-1">
              <p className="text-[13.5px] text-slate-700">
                <span className="font-semibold">เพิ่มบอท LINE</span> ของบริษัทเป็นเพื่อน
                <span className="text-slate-500"> (LINE Official Account: <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[12px] font-mono">GB-ANEK</code>)</span>
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#1E487A] text-white text-[12px] font-bold flex items-center justify-center shrink-0">2</span>
            <div className="flex-1">
              <p className="text-[13.5px] text-slate-700">
                ในแชต พิมพ์คำว่า <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[12px] font-mono font-bold">userid</code> แล้วส่ง
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#1E487A] text-white text-[12px] font-bold flex items-center justify-center shrink-0">3</span>
            <div className="flex-1">
              <p className="text-[13.5px] text-slate-700">
                บอทจะตอบกลับด้วย <span className="font-semibold">User ID</span> ของพนักงานคนนั้น
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[12px] font-bold flex items-center justify-center shrink-0">4</span>
            <div className="flex-1">
              <p className="text-[13.5px] text-slate-700">
                ชื่อพนักงานคนนั้นจะปรากฏใน <span className="font-semibold">"ผู้ใช้ LINE ล่าสุด"</span> ด้านบน → กดปุ่ม <span className="text-[#1E487A] font-bold">→ IT</span> หรือ <span className="text-emerald-700 font-bold">→ HR</span> แล้วบันทึก
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* 🆕 Modal ยืนยันการลบ — ดีไซน์สวย */}
      {deleteModal.open && deleteModal.user && (
        <DeleteUserModal
          user={deleteModal.user}
          deleting={deleteModal.deleting}
          error={deleteModal.error}
          onCancel={() => setDeleteModal({ open: false, user: null, deleting: false, error: '' })}
          onConfirm={confirmDeleteLineUser}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Delete User Modal — สวยและให้ข้อมูลครบ
   ──────────────────────────────────────────── */
function DeleteUserModal({ user, deleting, error, onCancel, onConfirm }) {
  const displayName = user.displayName || '(ไม่มีชื่อ)';
  return (
    <div
      className="fixed inset-0 bg-slate-950/50 z-[95] flex items-center justify-center p-4"
      onClick={() => !deleting && onCancel()}
    >
      <div
        className="bg-white rounded-2xl shadow-md max-w-md w-full overflow-hidden ring-1 ring-slate-200/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-rose-50 ring-1 ring-rose-100">
            <Trash2 className="h-6 w-6 text-rose-500" strokeWidth={2} />
          </div>
          <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">ลบรายการออกจากระบบ?</h3>
          <p className="text-[12.5px] text-slate-500 mt-1">การกระทำนี้ย้อนกลับไม่ได้</p>
        </div>

        {/* User card */}
        <div className="px-6 pb-4">
          <div className="bg-slate-50 ring-1 ring-slate-200 rounded-xl p-3 flex items-center gap-3">
            {user.pictureUrl ? (
              <img src={user.pictureUrl} alt={displayName} className="w-10 h-10 rounded-full ring-1 ring-slate-200 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white ring-1 ring-slate-200 flex items-center justify-center text-slate-400">
                <User className="h-4.5 w-4.5" strokeWidth={1.8} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 font-mono truncate">{user.userId}</p>
            </div>
          </div>
        </div>

        {/* Impact info — กระทบอะไรบ้าง */}
        <div className="px-6 pb-4 space-y-2">
          <div className="bg-emerald-50/60 ring-1 ring-emerald-200 rounded-xl px-3.5 py-3">
            <p className="text-[11.5px] font-bold text-emerald-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} /> ปลอดภัย
            </p>
            <ul className="text-[12.5px] text-emerald-900/85 space-y-1 pl-4 list-disc">
              <li>ไม่กระทบ User ID ที่ตั้งไว้เป็น IT/HR แล้ว — ยังส่งแจ้งเตือนได้ปกติ</li>
              <li>ไม่กระทบบัญชี LINE จริง — แค่ลบออกจากรายการแสดงผล</li>
              <li>ถ้า user คนนี้ส่งข้อความหาบอตอีก จะกลับมาอัตโนมัติ</li>
            </ul>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-3">
            <div className="bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-[12.5px] text-rose-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-slate-700 bg-white ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                กำลังลบ...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                ยืนยันลบ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

