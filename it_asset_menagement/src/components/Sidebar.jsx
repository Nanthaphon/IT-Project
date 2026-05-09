import React, { useState, useEffect } from 'react';

export default function Sidebar({ activeMenu, setActiveMenu, onResetPassword, authRole }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getBtnClass = (menu) => `w-auto md:w-full flex items-center p-2.5 md:p-3.5 rounded-xl transition-all duration-200 ${
    activeMenu === menu ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20 font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-teal-400 font-medium'
  }`;

  return (
    <aside className="w-full md:w-64 bg-black text-slate-300 flex flex-col shadow-2xl z-10 flex-shrink-0 border-r border-slate-900">
      <div className="p-5 md:p-6 text-left md:text-center border-b border-slate-900 flex justify-between items-center md:block">
        <div>
          <h1 className="text-xl md:text-2xl font-black flex items-center justify-start md:justify-center gap-2 tracking-tight text-white">
            <span className="text-teal-400">💻</span> IT Admin
          </h1>
          <p className="text-teal-500/70 text-xs md:text-sm mt-1 hidden md:block font-bold tracking-widest uppercase">Asset Mgt</p>
        </div>
        <div className="md:hidden">
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm flex items-center gap-1.5 border ${isOnline ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-teal-400 animate-pulse' : 'bg-red-500'}`}></span> {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        </div>
      </div>
      
      <nav className="flex flex-row md:flex-col md:flex-1 p-3 md:p-4 space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button onClick={() => setActiveMenu('dashboard')} className={getBtnClass('dashboard')}>
          <span className="mr-2 md:mr-3 text-lg md:text-xl opacity-90">📊</span><span className="text-sm md:text-base">แดชบอร์ด</span>
        </button>
        <button onClick={() => setActiveMenu('assets')} className={getBtnClass('assets')}>
          <span className="mr-2 md:mr-3 text-lg md:text-xl opacity-90">🖥️</span><span className="text-sm md:text-base">ทรัพย์สินหลัก</span>
        </button>
        <button onClick={() => setActiveMenu('licenses')} className={getBtnClass('licenses')}>
          <span className="mr-2 md:mr-3 text-lg md:text-xl opacity-90">🔑</span><span className="text-sm md:text-base">โปรแกรม/License</span>
        </button>
        <button onClick={() => setActiveMenu('accessories')} className={getBtnClass('accessories')}>
          <span className="mr-2 md:mr-3 text-lg md:text-xl opacity-90">🖱️</span><span className="text-sm md:text-base">อุปกรณ์เสริม</span>
        </button>

        {authRole === 'admin' && (
          <>
            <div className="w-full border-t border-slate-900 my-3 hidden md:block"></div>
            <button onClick={() => setActiveMenu('office_supplies')} className={getBtnClass('office_supplies')}>
              <span className="mr-2 md:mr-3 text-lg md:text-xl opacity-90">📦</span><span className="text-sm md:text-base">อุปกรณ์สำนักงาน</span>
            </button>
            <button onClick={() => setActiveMenu('supply_requests')} className={getBtnClass('supply_requests')}>
              <span className="mr-2 md:mr-3 text-lg md:text-xl opacity-90">📝</span><span className="text-sm md:text-base">คำขอเบิกอุปกรณ์</span>
            </button>
          </>
        )}

        <div className="w-full border-t border-slate-900 my-3 hidden md:block"></div>
        <button onClick={() => setActiveMenu('employees')} className={getBtnClass('employees')}>
          <span className="mr-2 md:mr-3 text-lg md:text-xl opacity-90">👥</span><span className="text-sm md:text-base">ข้อมูลพนักงาน</span>
        </button>
        <button onClick={() => setActiveMenu('repairs')} className={getBtnClass('repairs')}>
          <span className="mr-2 md:mr-3 text-lg md:text-xl opacity-90">🔧</span><span className="text-sm md:text-base">แจ้งซ่อม</span>
        </button>
        <button onClick={onResetPassword} className="w-auto md:w-full flex items-center p-2.5 md:p-3.5 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-900 hover:text-white font-medium mt-auto">
          <span className="mr-2 md:mr-3 text-lg md:text-xl opacity-80">🔒</span><span className="text-sm md:text-base">เปลี่ยนรหัสผ่าน</span>
        </button>
      </nav>
      
      <div className="hidden md:block p-5 border-t border-slate-900 text-center">
        <span className={`text-xs px-4 py-2 rounded-full font-bold shadow-sm flex items-center justify-center gap-2 mx-auto w-fit border ${isOnline ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-teal-400 animate-pulse' : 'bg-red-500'}`}></span> {isOnline ? 'ระบบออนไลน์' : 'ขาดการเชื่อมต่อ'}
        </span>
      </div>
    </aside>
  );
}