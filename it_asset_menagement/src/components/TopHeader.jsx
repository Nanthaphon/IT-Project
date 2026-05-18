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
  handleLogout
}) {
  return (
    <header
      className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shrink-0"
    >
      {/* Page title */}
      <h2 className="text-base font-semibold text-slate-800">{menuTitle}</h2>

      {/* Right actions */}
      <div className="flex items-center gap-2">

        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {totalPendingCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          {/* Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">การแจ้งเตือน</p>
                {totalPendingCount > 0 && (
                  <span className="text-xs font-semibold bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-md">
                    {totalPendingCount} รายการ
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {totalPendingCount === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <svg className="h-8 w-8 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p className="text-sm text-slate-400">ไม่มีรายการรอดำเนินการ</p>
                  </div>
                ) : (
                  <>
                    {pendingRepairsCount > 0 && (
                      <NotifItem
                        label="แจ้งซ่อมรอดำเนินการ"
                        count={pendingRepairsCount}
                        color="blue"
                        onClick={() => { setActiveMenu('repairs'); setIsNotifOpen(false); }}
                        icon={
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        }
                      />
                    )}
                    {pendingSuppliesCount > 0 && (
                      <NotifItem
                        label="คำขอเบิกรอดำเนินการ"
                        count={pendingSuppliesCount}
                        color="emerald"
                        onClick={() => { setActiveMenu('supply_requests'); setIsNotifOpen(false); }}
                        icon={
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        }
                      />
                    )}
                    {expiringLicensesCount > 0 && (
                      <NotifItem
                        label="License ใกล้หมดอายุ"
                        count={expiringLicensesCount}
                        color="amber"
                        onClick={() => { setActiveMenu('licenses'); setIsNotifOpen(false); }}
                        icon={
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/20 mx-1" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}

function NotifItem({ label, count, color, onClick, icon }) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-600',   badge: 'bg-blue-50 text-blue-600 border-blue-100' },
    emerald:{ bg: 'bg-emerald-50', text: 'text-emerald-600',badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-600',  badge: 'bg-amber-50 text-amber-600 border-amber-100' },
  };
  const c = colorMap[color];

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left"
    >
      <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{label}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${c.badge} shrink-0`}>
        {count}
      </span>
    </button>
  );
}
