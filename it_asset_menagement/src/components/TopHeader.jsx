import React from 'react';

export default function TopHeader({
  menuTitle,
  notifRef,
  isNotifOpen,
  setIsNotifOpen,
  totalPendingCount,
  pendingRepairsCount,
  pendingSuppliesCount,
  expiringLicensesCount,
  setActiveMenu,
  activeMenu,
  totalSystemItems,
  currentDataLength,
  handleLogout
}) {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 px-6 md:px-10 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 sticky top-0 shrink-0">
      <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{menuTitle}</h2>
      <div className="flex items-center gap-3">
        
        {/* กล่องแจ้งเตือน */}
        <div className="relative" ref={notifRef}>
          <div 
            className="cursor-pointer flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition-colors shadow-sm"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            title={totalPendingCount > 0 ? `มีรายการรอดำเนินการ ${totalPendingCount} รายการ` : 'ไม่มีการแจ้งเตือนใหม่'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${totalPendingCount > 0 ? 'text-amber-500' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {totalPendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white animate-bounce">
                {totalPendingCount}
              </span>
            )}
          </div>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-800">รายการรอดำเนินการ</h4>
                <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">{totalPendingCount}</span>
              </div>
              <div className="flex flex-col max-h-[300px] overflow-y-auto">
                {totalPendingCount === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400 text-sm font-medium">
                    ไม่มีรายการใหม่ 🎉
                  </div>
                ) : (
                  <React.Fragment>
                    {pendingRepairsCount > 0 && (
                      <button 
                        onClick={() => { setActiveMenu('repairs'); setIsNotifOpen(false); }}
                        className="px-4 py-3 text-left hover:bg-teal-50 transition-colors border-b border-slate-50 flex items-start gap-3"
                      >
                        <span className="text-lg bg-white shadow-sm border border-slate-100 rounded-lg p-1.5 shrink-0">🔧</span>
                        <div>
                          <p className="text-sm font-bold text-slate-800">แจ้งปัญหา IT</p>
                          <p className="text-xs text-teal-600 font-medium mt-0.5">{pendingRepairsCount} คิวใหม่</p>
                        </div>
                      </button>
                    )}
                    {pendingSuppliesCount > 0 && (
                      <button 
                        onClick={() => { setActiveMenu('supply_requests'); setIsNotifOpen(false); }}
                        className="px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-start gap-3"
                      >
                        <span className="text-lg bg-white shadow-sm border border-slate-100 rounded-lg p-1.5 shrink-0">📝</span>
                        <div>
                          <p className="text-sm font-bold text-slate-800">ขอเบิกอุปกรณ์สำนักงาน</p>
                          <p className="text-xs text-emerald-600 font-medium mt-0.5">{pendingSuppliesCount} คิวใหม่</p>
                        </div>
                      </button>
                    )}
                    {expiringLicensesCount > 0 && (
                      <button 
                        onClick={() => { setActiveMenu('licenses'); setIsNotifOpen(false); }}
                        className="px-4 py-3 text-left hover:bg-purple-50 transition-colors border-t border-slate-50 flex items-start gap-3"
                      >
                        <span className="text-lg bg-white shadow-sm border border-slate-100 rounded-lg p-1.5 shrink-0">🔑</span>
                        <div>
                          <p className="text-sm font-bold text-slate-800">โปรแกรม/License</p>
                          <p className="text-xs text-purple-600 font-medium mt-0.5">{expiringLicensesCount} รายการใกล้/หมดอายุ</p>
                        </div>
                      </button>
                    )}
                  </React.Fragment>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ป้ายแสดงจำนวนรายการ */}
        <div className="text-sm font-bold text-teal-700 bg-teal-50 border border-teal-100 px-4 py-2 rounded-full shadow-sm flex items-center gap-2 hidden sm:flex">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          {activeMenu === 'dashboard' ? `ข้อมูลในระบบทั้งหมด ${totalSystemItems} รายการ` : `มีรายการทั้งหมด ${currentDataLength} รายการ`}
        </div>
        
        <button onClick={handleLogout} className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-full hover:bg-red-600 hover:text-white transition-colors shadow-sm whitespace-nowrap">
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}