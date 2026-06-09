import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { Settings, MessageCircle, Save, ShieldAlert, Wrench, Package, User, Copy, RefreshCw, BookOpen, ChevronDown, AlertTriangle, Lightbulb, Server, Key } from 'lucide-react';
import { cls, BRAND } from '../ui/theme.js';

export default function SystemSettingsPage({ isSuperAdmin = false }) {
  const [itLineUserId, setItLineUserId] = useState('');
  const [hrLineUserId, setHrLineUserId] = useState('');
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    const q = query(collection(db, 'line_users'), orderBy('lastSeen', 'desc'), limit(10));
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

    const it = itLineUserId.trim();
    const hr = hrLineUserId.trim();
    // LINE userId รูปแบบ: ขึ้นต้นด้วย U ตามด้วย hex 32 ตัว
    const lineIdRe = /^U[0-9a-f]{32}$/i;
    if (it && !lineIdRe.test(it)) { setError('รูปแบบ IT LINE User ID ไม่ถูกต้อง (ต้องขึ้นต้นด้วย U + 32 ตัวอักษร)'); return; }
    if (hr && !lineIdRe.test(hr)) { setError('รูปแบบ HR LINE User ID ไม่ถูกต้อง (ต้องขึ้นต้นด้วย U + 32 ตัวอักษร)'); return; }

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
            <input
              type="text"
              className={cls.inputMono}
              placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={itLineUserId}
              onChange={e => setItLineUserId(e.target.value)}
              spellCheck={false}
            />
            <p className="text-[12px] text-slate-400 mt-1">
              รับแจ้งเตือน: แจ้งซ่อม / ปัญหา IT, ขอเปลี่ยนเครื่อง, License ใกล้หมดอายุ
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
            <input
              type="text"
              className={cls.inputMono}
              placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={hrLineUserId}
              onChange={e => setHrLineUserId(e.target.value)}
              spellCheck={false}
            />
            <p className="text-[12px] text-slate-400 mt-1">
              รับแจ้งเตือน: คำขอเบิกอุปกรณ์สำนักงาน
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
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <User className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
          <h2 className="text-[15px] font-bold text-slate-800">ผู้ใช้ LINE ล่าสุด</h2>
          <span className="ml-auto text-[12px] text-slate-400">{recentUsers.length} คน</span>
        </div>
        {recentUsers.length === 0 ? (
          <div className="px-6 py-12 text-center text-[14px] text-slate-400">
            <RefreshCw className="h-5 w-5 mx-auto mb-2 opacity-50" strokeWidth={1.6} />
            ยังไม่มีผู้ใช้ LINE ใดส่งข้อความเข้ามา<br />
            <span className="text-[12.5px]">เพิ่มบอตเป็นเพื่อนและส่งข้อความ "hello" จะปรากฏที่นี่</span>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentUsers.map(u => (
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
                  onClick={() => setItLineUserId(u.userId)}
                  className="px-2.5 py-1.5 text-[12px] font-medium text-[#1E487A] rounded-lg ring-1 ring-[#1E487A]/30 hover:bg-[#1E487A]/5 transition-colors"
                  title="ตั้งเป็น IT"
                >
                  → IT
                </button>
                <button
                  type="button"
                  onClick={() => setHrLineUserId(u.userId)}
                  className="px-2.5 py-1.5 text-[12px] font-medium text-emerald-700 rounded-lg ring-1 ring-emerald-300 hover:bg-emerald-50 transition-colors"
                  title="ตั้งเป็น HR"
                >
                  → HR
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          📖 คู่มือสำหรับผู้ดูแลระบบ — เผื่อ IT คนใหม่มาทำต่อ
          ══════════════════════════════════════════════════════════════ */}
      <ManualSection />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
   คู่มือ — เก็บไว้ใน component เดียวกัน อ่านง่าย ไม่กระจาย
   แบ่งเป็น accordion 5 หัวข้อ — ขยายทีละหัวข้อตาม use case
   ─────────────────────────────────────────────────────────────────── */
function ManualSection() {
  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId(prev => prev === id ? null : id);

  const items = [
    {
      id: 'overview',
      icon: Lightbulb,
      title: 'ภาพรวมระบบแจ้งเตือน',
      color: 'amber',
      content: (
        <div className="space-y-3 text-[13.5px] text-slate-700 leading-relaxed">
          <p>ระบบส่งแจ้งเตือนผ่าน <strong>LINE Official Account</strong> (ชื่อปัจจุบัน: <code className="px-1.5 py-0.5 bg-slate-100 rounded text-[12.5px]">GB-ANEK</code>) — ไม่ใช้ email อีกต่อไป</p>
          <div className="bg-slate-50 rounded-lg p-3.5 ring-1 ring-slate-200 space-y-2">
            <p className="font-semibold text-slate-800">เหตุการณ์ที่ระบบส่ง LINE:</p>
            <ul className="space-y-1.5 pl-4 list-disc text-slate-600">
              <li><strong>แจ้งซ่อม / ปัญหา IT</strong> → ส่งหา <span className="text-[#1E487A] font-semibold">IT</span></li>
              <li><strong>ขอเปลี่ยนเครื่อง</strong> → ส่งหา <span className="text-[#1E487A] font-semibold">IT</span></li>
              <li><strong>License ใกล้หมดอายุ</strong> → ส่งหา <span className="text-[#1E487A] font-semibold">IT</span></li>
              <li><strong>ขอเบิกอุปกรณ์สำนักงาน</strong> → ส่งหา <span className="text-emerald-700 font-semibold">HR</span></li>
            </ul>
          </div>
          <p className="text-[12.5px] text-slate-500">
            * Free tier ของ LINE OA = <strong>200 ข้อความ/เดือน</strong> เพียงพอสำหรับใช้ภายในบริษัท
          </p>
        </div>
      ),
    },
    {
      id: 'add-recipient',
      icon: User,
      title: 'วิธีเพิ่ม / เปลี่ยนผู้รับแจ้งเตือน (IT หรือ HR)',
      color: 'blue',
      content: (
        <div className="space-y-4 text-[13.5px] text-slate-700 leading-relaxed">
          <p>เมื่อมีพนักงานใหม่มารับหน้าที่ IT หรือ HR ทำตามนี้:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-blue-50/40 ring-1 ring-blue-200 rounded-xl p-4 space-y-2">
              <p className="font-bold text-[#1E487A] flex items-center gap-1.5"><User className="h-3.5 w-3.5" />ขั้นที่ 1: ผู้รับทำเอง</p>
              <ol className="text-[13px] space-y-1.5 pl-5 list-decimal text-slate-600">
                <li>เปิด LINE มือถือ</li>
                <li>ค้นหาเพื่อน <code className="px-1 bg-white rounded">GB-ANEK</code> (หรือเพิ่มเป็นเพื่อนถ้ายังไม่มี)</li>
                <li>พิมพ์คำว่า <code className="px-1.5 py-0.5 bg-white rounded font-semibold">userid</code> แล้วส่ง</li>
                <li>บอตจะตอบกลับด้วย <strong>User ID</strong> ของผู้รับ</li>
              </ol>
            </div>
            <div className="bg-emerald-50/40 ring-1 ring-emerald-200 rounded-xl p-4 space-y-2">
              <p className="font-bold text-emerald-700 flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" />ขั้นที่ 2: Admin ตั้งใน "ตั้งค่าระบบ"</p>
              <ol className="text-[13px] space-y-1.5 pl-5 list-decimal text-slate-600">
                <li>เลื่อนลงไปที่ <strong>"ผู้ใช้ LINE ล่าสุด"</strong> ด้านบน</li>
                <li>หาชื่อผู้รับใหม่ในรายการ</li>
                <li>กดปุ่ม <span className="px-1.5 py-0.5 rounded text-[#1E487A] ring-1 ring-[#1E487A]/30 text-[11px] font-semibold">→ IT</span> หรือ <span className="px-1.5 py-0.5 rounded text-emerald-700 ring-1 ring-emerald-300 text-[11px] font-semibold">→ HR</span></li>
                <li>กด <strong>"บันทึกการตั้งค่า"</strong></li>
              </ol>
            </div>
          </div>
          <div className="bg-amber-50/50 ring-1 ring-amber-200 rounded-lg p-3 text-[12.5px] text-amber-900">
            💡 <strong>Tip:</strong> ผู้รับใหม่ไม่ต้องส่ง User ID ให้ admin ด้วยตัวเอง — แค่พิมพ์ <code>userid</code> หาบอต ระบบจะ capture ไว้อัตโนมัติ admin เปิดหน้านี้แล้วเห็นชื่อ + รูปเลย
          </div>
        </div>
      ),
    },
    {
      id: 'test',
      icon: RefreshCw,
      title: 'วิธีทดสอบว่าระบบส่ง LINE ได้',
      color: 'emerald',
      content: (
        <div className="space-y-3 text-[13.5px] text-slate-700 leading-relaxed">
          <ol className="space-y-2 pl-5 list-decimal">
            <li>ตั้ง User ID ของตัวเอง (admin) เป็น IT ก่อน (ไว้รับ test message)</li>
            <li>Logout ออกจาก admin → Login เป็น <strong>staff</strong> (ใช้รหัสพนักงาน)</li>
            <li>กดเมนู <strong>"แจ้งซ่อม"</strong> → กรอกข้อมูลทดสอบ → กดส่ง</li>
            <li>เปิด LINE มือถือ → ต้องมี notification เด้งภายใน 2-3 วินาที</li>
          </ol>
          <div className="bg-slate-50 rounded-lg p-3 ring-1 ring-slate-200 text-[12.5px] text-slate-600">
            <strong>ถ้าไม่ได้รับ notification:</strong>
            <ul className="space-y-1 pl-4 list-disc mt-1.5">
              <li>เช็คว่าตั้ง User ID ถูกในช่อง IT แล้ว</li>
              <li>เช็คว่า User ID ตรงกับของพี่แมนเอง (เปรียบเทียบกับ "ผู้ใช้ LINE ล่าสุด")</li>
              <li>เช็คว่า LINE OA ยัง enabled อยู่ (ไม่ถูกระงับ)</li>
              <li>เช็คว่า quota รายเดือนยังเหลือ (LINE OA Manager → Statistics)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'architecture',
      icon: Server,
      title: 'สถาปัตยกรรมระบบ (สำหรับ IT)',
      color: 'slate',
      content: (
        <div className="space-y-3 text-[13.5px] text-slate-700 leading-relaxed">
          <p>ระบบแบ่งเป็น 3 ส่วน:</p>
          <div className="grid grid-cols-1 gap-2.5">
            <div className="bg-white ring-1 ring-slate-200 rounded-lg p-3">
              <p className="font-bold text-[#1E487A] text-[13px]">1. Frontend — Firebase Hosting</p>
              <p className="text-[12.5px] text-slate-500 mt-0.5">URL: <code>https://it-asset-management-dc883.web.app</code></p>
              <p className="text-[12px] text-slate-500 mt-1">เป็น React app static — deploy ด้วยคำสั่ง <code className="bg-slate-100 px-1 rounded">firebase deploy --only hosting</code></p>
            </div>
            <div className="bg-white ring-1 ring-slate-200 rounded-lg p-3">
              <p className="font-bold text-[#1E487A] text-[13px]">2. Backend API — Vercel serverless</p>
              <p className="text-[12.5px] text-slate-500 mt-0.5">URL: <code>https://itassetmenagement.vercel.app/api/*</code></p>
              <p className="text-[12px] text-slate-500 mt-1">endpoint ที่เกี่ยวกับ LINE: <code className="bg-slate-100 px-1 rounded">/api/staff-notify</code> (ส่งแจ้ง), <code className="bg-slate-100 px-1 rounded">/api/line-webhook</code> (รับ event)</p>
              <p className="text-[12px] text-slate-500 mt-1">deploy ด้วย <code className="bg-slate-100 px-1 rounded">vercel --prod</code></p>
            </div>
            <div className="bg-white ring-1 ring-slate-200 rounded-lg p-3">
              <p className="font-bold text-[#1E487A] text-[13px]">3. LINE OA — Messaging API</p>
              <p className="text-[12.5px] text-slate-500 mt-0.5">Webhook URL ตั้งที่ LINE Developers Console:</p>
              <p className="text-[12px] text-slate-500 mt-1"><code className="bg-slate-100 px-1 rounded">https://itassetmenagement.vercel.app/api/line-webhook</code></p>
            </div>
          </div>
          <div className="bg-amber-50/50 ring-1 ring-amber-200 rounded-lg p-3 text-[12.5px] text-amber-900 mt-2">
            <p className="font-semibold mb-1">⚠️ Environment Variables ที่ต้องตั้งบน Vercel:</p>
            <ul className="space-y-0.5 pl-4 list-disc">
              <li><code>LINE_CHANNEL_ACCESS_TOKEN</code> — token จาก LINE Developers Console</li>
              <li><code>LINE_CHANNEL_SECRET</code> — secret จาก LINE OA Manager</li>
              <li><code>FIREBASE_SERVICE_ACCOUNT</code> — service account JSON ของ Firebase</li>
              <li><code>ALLOWED_ORIGINS</code> — URL ของ Frontend (Firebase Hosting)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'troubleshoot',
      icon: AlertTriangle,
      title: 'แก้ปัญหาที่พบบ่อย',
      color: 'rose',
      content: (
        <div className="space-y-3 text-[13.5px] text-slate-700 leading-relaxed">
          <div className="space-y-2.5">
            <div className="bg-white ring-1 ring-slate-200 rounded-lg p-3">
              <p className="font-bold text-rose-700 text-[13px]">❌ ส่ง notification ไม่สำเร็จ — ขึ้น "บันทึกแล้ว แต่ส่ง LINE ไม่สำเร็จ"</p>
              <p className="text-[12.5px] text-slate-600 mt-1.5">สาเหตุที่เป็นไปได้:</p>
              <ul className="text-[12.5px] text-slate-600 mt-1 pl-4 list-disc space-y-1">
                <li><strong>HTTP 401:</strong> Channel Access Token หมดอายุ → re-issue ที่ LINE Developers Console แล้วอัปเดต env var บน Vercel</li>
                <li><strong>HTTP 400:</strong> User ID ผิด → ตรวจในช่อง IT/HR ว่าตรงกับใน "ผู้ใช้ LINE ล่าสุด"</li>
                <li><strong>HTTP 429:</strong> quota หมด — upgrade plan ของ LINE OA หรือรอเดือนใหม่</li>
              </ul>
            </div>
            <div className="bg-white ring-1 ring-slate-200 rounded-lg p-3">
              <p className="font-bold text-rose-700 text-[13px]">❌ "ผู้ใช้ LINE ล่าสุด" ไม่ขึ้นชื่อ ทั้งที่ส่ง userid แล้ว</p>
              <p className="text-[12.5px] text-slate-600 mt-1.5">สาเหตุที่เป็นไปได้:</p>
              <ul className="text-[12.5px] text-slate-600 mt-1 pl-4 list-disc space-y-1">
                <li>Webhook URL ที่ LINE Developers Console ตั้งผิด → ต้องเป็น <code className="bg-slate-100 px-1 rounded text-[11.5px]">https://itassetmenagement.vercel.app/api/line-webhook</code></li>
                <li>"Use webhook" switch ที่ LINE Developers Console ไม่ ON</li>
                <li>กด "Verify" ที่ Webhook URL → ดู error ที่ขึ้น</li>
              </ul>
            </div>
            <div className="bg-white ring-1 ring-slate-200 rounded-lg p-3">
              <p className="font-bold text-rose-700 text-[13px]">❌ บอตไม่ตอบเมื่อพิมพ์ "userid"</p>
              <p className="text-[12.5px] text-slate-600 mt-1.5">สาเหตุที่เป็นไปได้:</p>
              <ul className="text-[12.5px] text-slate-600 mt-1 pl-4 list-disc space-y-1">
                <li>LINE OA Manager → Response settings → <strong>Webhooks switch</strong> ไม่ ON</li>
                <li>Webhook URL ที่ LINE Developers Console ผิด</li>
                <li>Vercel function down (ดู logs ที่ <code className="bg-slate-100 px-1 rounded">vercel logs</code>)</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'keys',
      icon: Key,
      title: 'ขอสิทธิ์เข้าถึงระบบ (สำหรับ IT คนใหม่)',
      color: 'violet',
      content: (
        <div className="space-y-3 text-[13.5px] text-slate-700 leading-relaxed">
          <p>เมื่อ IT คนใหม่มารับช่วงต่อ — ต้องขอสิทธิ์เข้าถึง:</p>
          <ol className="space-y-2 pl-5 list-decimal">
            <li>
              <strong>Firebase Project</strong>
              <p className="text-[12.5px] text-slate-500 mt-0.5">Project: <code>it-asset-management-dc883</code> — เพิ่ม Google account เป็น Editor ที่ Firebase Console → Settings → Users and permissions</p>
            </li>
            <li>
              <strong>Vercel Project</strong>
              <p className="text-[12.5px] text-slate-500 mt-0.5">Project: <code>it_asset_menagement</code> — เพิ่ม member ที่ Vercel Dashboard → Team Settings → Members</p>
            </li>
            <li>
              <strong>LINE Developers Console</strong>
              <p className="text-[12.5px] text-slate-500 mt-0.5">Provider: <code>GB-MESSENGE</code> — Channel: <code>GB-ANEK</code> → เพิ่ม email เป็น Admin role ที่ tab "Roles"</p>
            </li>
            <li>
              <strong>LINE OA Manager</strong>
              <p className="text-[12.5px] text-slate-500 mt-0.5">เพิ่ม account ที่ Settings → Manage permissions → เพิ่ม admin/operator</p>
            </li>
            <li>
              <strong>GitHub / Code Repository</strong>
              <p className="text-[12.5px] text-slate-500 mt-0.5">ขอสิทธิ์ที่ owner ของ repo</p>
            </li>
          </ol>
          <div className="bg-amber-50/50 ring-1 ring-amber-200 rounded-lg p-3 text-[12.5px] text-amber-900">
            🔐 <strong>เพิ่มเติม:</strong> หลังโอนสิทธิ์ — ผู้รับช่วงควร <strong>re-issue Channel Access Token</strong> และ <strong>regenerate Channel Secret</strong> ใหม่ทันที (เพื่อตัดสิทธิ์ token เก่าที่อาจรั่วไหล)
          </div>
        </div>
      ),
    },
  ];

  const colorMap = {
    amber:   { bg: 'bg-amber-50/50',   ring: 'ring-amber-200',   text: 'text-amber-700',   iconBg: 'bg-amber-100' },
    blue:    { bg: 'bg-blue-50/50',    ring: 'ring-blue-200',    text: 'text-blue-700',    iconBg: 'bg-blue-100' },
    emerald: { bg: 'bg-emerald-50/50', ring: 'ring-emerald-200', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    slate:   { bg: 'bg-slate-50',      ring: 'ring-slate-200',   text: 'text-slate-700',   iconBg: 'bg-slate-100' },
    rose:    { bg: 'bg-rose-50/50',    ring: 'ring-rose-200',    text: 'text-rose-700',    iconBg: 'bg-rose-100' },
    violet:  { bg: 'bg-violet-50/50',  ring: 'ring-violet-200',  text: 'text-violet-700',  iconBg: 'bg-violet-100' },
  };

  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-gradient-to-r from-slate-50/50 to-transparent">
        <BookOpen className="h-4 w-4 text-[#1E487A]" strokeWidth={2} />
        <h2 className="text-[15px] font-bold text-slate-800">คู่มือสำหรับผู้ดูแลระบบ</h2>
        <span className="ml-auto text-[11.5px] text-slate-400 italic">สำหรับ IT คนใหม่</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map(item => {
          const Icon = item.icon;
          const isOpen = openId === item.id;
          const c = colorMap[item.color];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-slate-50/60 transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
                  <Icon className={`h-4 w-4 ${c.text}`} strokeWidth={2} />
                </div>
                <span className="flex-1 text-[14px] font-semibold text-slate-800">{item.title}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
              </button>
              {isOpen && (
                <div className={`px-6 pb-5 pt-1 ${c.bg} border-t ${c.ring}`}>
                  <div className="pt-3">
                    {item.content}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
