import React, { useState, useEffect } from 'react';

// รับค่า activeMenu และ setActiveMenu ผ่าน props มาจาก App.jsx
export default function Sidebar({ activeMenu, setActiveMenu, onResetPassword, authRole }) {
  // ✅ เพิ่ม State คอยเช็คสถานะอินเทอร์เน็ตของเครื่อง
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // ฟังก์ชันอัปเดตสถานะเมื่อเน็ตติด หรือ เน็ตหลุด
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // ดักฟัง Event ของ Browser
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-10 flex-shrink-0">
      <div className="p-4 md:p-6 text-left md:text-center border-b border-slate-800 flex justify-between items-center md:block">
        <div>
          <h1 className="text-xl md:text-2xl font-black flex items-center gap-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            💻 IT Admin
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1 hidden md:block font-medium">Asset Management</p>
        </div>
        <div className="md:hidden">
          {/* ✅ เปลี่ยนสีและข้อความของป้าย (สำหรับมือถือ) ตามสถานะจริง */}
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium shadow-sm flex items-center gap-1 border ${isOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span> {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        </div>
      </div>
      
      <nav className="flex flex-row md:flex-col md:flex-1 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button 
          onClick={() => setActiveMenu('dashboard')}
          className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
            activeMenu === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="mr-2 md:mr-3 text-lg md:text-xl">📊</span>
          <span className="font-semibold text-sm md:text-base">หน้าหลักแดชบอร์ด</span>
        </button>

        <button 
          onClick={() => setActiveMenu('assets')}
          className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
            activeMenu === 'assets' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="mr-2 md:mr-3 text-lg md:text-xl">🖥️</span>
          <span className="font-semibold text-sm md:text-base">ทรัพย์สินหลัก</span>
        </button>
        
        <button 
          onClick={() => setActiveMenu('licenses')}
          className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
            activeMenu === 'licenses' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="mr-2 md:mr-3 text-lg md:text-xl">🔑</span>
          <span className="font-semibold text-sm md:text-base">โปรแกรม/License</span>
        </button>

        <button 
          onClick={() => setActiveMenu('accessories')}
          className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
            activeMenu === 'accessories' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="mr-2 md:mr-3 text-lg md:text-xl">🖱️</span>
          <span className="font-semibold text-sm md:text-base">อุปกรณ์เสริม</span>
        </button>

        {authRole === 'admin' && (
          <>
            <div className="w-full border-t border-slate-800 my-2 hidden md:block"></div>

            <button 
              onClick={() => setActiveMenu('office_supplies')}
              className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
                activeMenu === 'office_supplies' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-2 md:mr-3 text-lg md:text-xl">📦</span>
              <span className="font-semibold text-sm md:text-base">คลังอุปกรณ์สำนักงาน</span>
            </button>

            <button 
              onClick={() => setActiveMenu('supply_requests')}
              className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
                activeMenu === 'supply_requests' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-2 md:mr-3 text-lg md:text-xl">📝</span>
              <span className="font-semibold text-sm md:text-base">คำขอเบิกอุปกรณ์</span>
            </button>
          </>
        )}

        <div className="w-full border-t border-slate-800 my-2 hidden md:block"></div>

        <button 
          onClick={() => setActiveMenu('employees')}
          className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
            activeMenu === 'employees' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="mr-2 md:mr-3 text-lg md:text-xl">👥</span>
          <span className="font-semibold text-sm md:text-base">ข้อมูลพนักงาน</span>
        </button>

        <button
          onClick={() => setActiveMenu('repairs')}
          className={`w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 ${
            activeMenu === 'repairs' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="mr-2 md:mr-3 text-lg md:text-xl">🔧</span>
          <span className="font-semibold text-sm md:text-base">แจ้งซ่อม</span>
        </button>

        <button
          onClick={onResetPassword}
          className="w-auto md:w-full flex items-center p-2 md:p-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-amber-500/10 hover:text-amber-400"
        >
          <span className="mr-2 md:mr-3 text-lg md:text-xl">🔒</span>
          <span className="font-semibold text-sm md:text-base">เปลี่ยนรหัสผ่าน</span>
        </button>

      </nav>
      
      <div className="hidden md:block p-4 border-t border-slate-800 text-center">
        {/* ✅ เปลี่ยนสีและข้อความของป้าย (สำหรับคอมพิวเตอร์) ตามสถานะจริง */}
        <span className={`text-xs px-4 py-1.5 rounded-full font-medium shadow-sm flex items-center justify-center gap-2 mx-auto w-fit border ${isOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span> {isOnline ? 'ระบบออนไลน์' : 'ขาดการเชื่อมต่อ'}
        </span>
      </div>
    </aside>
  );
}