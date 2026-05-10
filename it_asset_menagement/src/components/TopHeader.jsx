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
  totalSystemItems,
  currentDataLength,
  handleLogout 
}) {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-10 py-5 flex justify-between items-center z-10 sticky top-0">
      
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-black text-[#1E487A] tracking-tight">{menuTitle}</h2>
      </div>
      
      <div className="flex items-center gap-4">
        
        {/* กระดิ่งแจ้งเตือน */}
        <div ref={notifRef} className="relative cursor-pointer">
          <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2.5 bg-slate-50 text-slate-500 hover:text-[#1E487A] rounded-full border border-slate-200 transition-colors shadow-sm focus:outline-none">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {totalPendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse border-2 border-white">{totalPendingCount}</span>
            )}
          </button>

          {/* รายการแจ้งเตือน */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-bold text-[#1E487A] text-sm">การแจ้งเตือน</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {totalPendingCount === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">ไม่มีรายการรอดำเนินการ</div>
                ) : (
                  <>
                    {pendingRepairsCount > 0 && (
                      <div onClick={() => { setActiveMenu('repairs'); setIsNotifOpen(false); }} className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">🔧</div>
                        <div><p className="text-sm font-bold text-slate-800">แจ้งซ่อมรอดำเนินการ</p><p className="text-xs text-slate-500 mt-0.5">มีรายการใหม่ <span className="font-bold text-blue-600">{pendingRepairsCount}</span> รายการ</p></div>
                      </div>
                    )}
                    {pendingSuppliesCount > 0 && (
                      <div onClick={() => { setActiveMenu('supply_requests'); setIsNotifOpen(false); }} className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">📦</div>
                        <div><p className="text-sm font-bold text-slate-800">เบิกอุปกรณ์รอดำเนินการ</p><p className="text-xs text-slate-500 mt-0.5">มีคำขอเบิก <span className="font-bold text-emerald-600">{pendingSuppliesCount}</span> รายการ</p></div>
                      </div>
                    )}
                    {expiringLicensesCount > 0 && (
                      <div onClick={() => { setActiveMenu('licenses'); setIsNotifOpen(false); }} className="p-4 hover:bg-slate-50 cursor-pointer flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">🔑</div>
                        <div><p className="text-sm font-bold text-slate-800">License ใกล้หมดอายุ</p><p className="text-xs text-slate-500 mt-0.5">มีโปรแกรมใกล้/หมดอายุ <span className="font-bold text-amber-600">{expiringLicensesCount}</span> รายการ</p></div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleLogout} className="text-sm font-bold text-[#1E487A] bg-white border-2 border-[#1E487A] px-5 py-2 rounded-full hover:bg-[#1E487A] hover:text-white transition-all shadow-sm">
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}