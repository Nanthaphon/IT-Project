/* Dev harness ดูหน้า login โดยไม่ต้อง logout ของจริง
   เปิดที่ http://localhost:5173/login-preview.html — ไม่เข้า production build */
import './index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import LoginView from './components/LoginView.jsx';

function Harness() {
  const [log, setLog] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const push = (line) => setLog((l) => [line, ...l].slice(0, 6));

  return (
    <>
      <LoginView
        setLoginForm={() => {}}
        loginError={error}
        setLoginError={setError}
        loginLoading={loading}
        handleAdminLogin={(e, c) => {
          e?.preventDefault?.();
          push(`admin → signInWithEmailAndPassword("${c.username}", ••••)`);
          setLoading(true);
          setTimeout(() => { setLoading(false); setError('Email หรือ Password ไม่ถูกต้อง'); }, 700);
        }}
        handleStaffLogin={(e, c) => {
          e?.preventDefault?.();
          push(`staff → POST /api/staff-login { empId: "${c.empId}" }`);
          setLoading(true);
          setTimeout(() => { setLoading(false); setError('ไม่พบรหัสพนักงานนี้ในระบบ'); }, 700);
        }}
      />
      <div className="fixed bottom-4 left-4 z-50 max-w-md rounded-xl border border-stone-200/60 bg-white p-3 text-[13px] shadow-sm">
        <p className="mb-1.5 font-medium text-stone-600">เส้นทางที่ถูกเรียก (ทดสอบ ไม่ต่อของจริง)</p>
        {log.length === 0
          ? <p className="text-stone-400">ยังไม่ได้กดเข้าสู่ระบบ</p>
          : log.map((l, i) => <p key={i} className="font-mono text-[11px] text-stone-500">{l}</p>)}
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <div className="font-sans text-stone-900"><Harness /></div>,
);
export default Harness;
