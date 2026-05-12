import React from 'react';

export default function Sidebar({ activeMenu, setActiveMenu, onResetPassword, authRole }) {
  const getBtnClass = (menu) => `w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
    activeMenu === menu 
      ? 'bg-[#1E487A] text-white shadow-md shadow-[#1E487A]/20 font-bold' 
      : 'text-slate-500 hover:bg-slate-100 hover:text-[#1E487A] font-medium'
  }`;

  return (
    <aside className="w-full md:w-64 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.04)] z-20 flex-shrink-0 border-r border-slate-200 h-screen">
      
      <div className="p-5 border-b border-slate-100 flex flex-col items-center md:items-start text-center md:text-left shrink-0">
        <h1 className="text-xl font-black flex items-center gap-2 text-[#1E487A]">
          <div className="w-8 h-8 bg-[#1E487A] text-white rounded-lg flex items-center justify-center font-serif italic text-xl shadow-sm">
            G
          </div>
          IT Admin
        </h1>
        <p className="text-slate-400 text-[10px] mt-1.5 font-bold tracking-widest uppercase">Asset Management</p>
      </div>
      
      <nav className="flex flex-row md:flex-col md:flex-1 p-3 space-x-2 md:space-x-0 md:space-y-1.5 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {authRole === 'admin' && (
          <>
            <button onClick={() => setActiveMenu('dashboard')} className={getBtnClass('dashboard')}><span className="mr-2.5 text-lg">📊</span><span>แดชบอร์ด</span></button>
            <button onClick={() => setActiveMenu('assets')} className={getBtnClass('assets')}><span className="mr-2.5 text-lg">🖥️</span><span>ทรัพย์สินหลัก</span></button>
            <button onClick={() => setActiveMenu('licenses')} className={getBtnClass('licenses')}><span className="mr-2.5 text-lg">🔑</span><span>โปรแกรม/ใบอนุญาต</span></button>
            <button onClick={() => setActiveMenu('accessories')} className={getBtnClass('accessories')}><span className="mr-2.5 text-lg">🖱️</span><span>อุปกรณ์เสริม</span></button>
          </>
        )}

        {(authRole === 'admin' || authRole === 'hr') && (
          <>
            {authRole === 'admin' && <div className="w-full border-t border-slate-100 my-2 hidden md:block shrink-0"></div>}
            <button onClick={() => setActiveMenu('office_supplies')} className={getBtnClass('office_supplies')}><span className="mr-2.5 text-lg">📦</span><span>อุปกรณ์สำนักงาน</span></button>
            <button onClick={() => setActiveMenu('supply_requests')} className={getBtnClass('supply_requests')}><span className="mr-2.5 text-lg">📝</span><span>คำขอเบิกอุปกรณ์</span></button>
          </>
        )}

        <div className="w-full border-t border-slate-100 my-2 hidden md:block shrink-0"></div>
        <button onClick={() => setActiveMenu('employees')} className={getBtnClass('employees')}><span className="mr-2.5 text-lg">👥</span><span>ข้อมูลพนักงาน</span></button>
        
        {authRole === 'admin' && (
          <>
            <button onClick={() => setActiveMenu('repairs')} className={getBtnClass('repairs')}><span className="mr-2.5 text-lg">🔧</span><span>แจ้งซ่อม</span></button>
            <button onClick={() => setActiveMenu('replacement_requests')} className={getBtnClass('replacement_requests')}><span className="mr-2.5 text-lg">🔄</span><span>คำขอเปลี่ยนเครื่อง</span></button>
          </>
        )}
        
        <div className="w-full border-t border-slate-100 my-2 hidden md:block shrink-0"></div>
        <button onClick={onResetPassword} className="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 text-sm text-slate-500 hover:bg-slate-100 hover:text-[#1E487A] font-medium">
          <span className="mr-2.5 text-lg">🔐</span><span>เปลี่ยนรหัสผ่าน</span>
        </button>
      </nav>

      <div className="hidden md:block p-4 mt-auto border-t border-slate-100 shrink-0">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-600">ระบบออนไลน์</span>
        </div>
      </div>
    </aside>
  );
}