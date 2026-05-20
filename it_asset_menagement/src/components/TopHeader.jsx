import React from 'react';
import { Bell, BellRing, Wrench, Package, FileText, LogOut, ChevronRight } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

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
  handleLogout,
  authRole,
}) {
  const roleLabel =
    authRole === 'admin' ? 'IT Admin' :
    authRole === 'hr'    ? 'HR' :
    authRole === 'staff' ? 'Staff' : '';

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
      {/* Page title */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight truncate">
          {menuTitle}
        </h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Role badge */}
        {roleLabel && (
          <span
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ring-1 ring-inset mr-1"
            style={{
              backgroundColor: `${BRAND.primary}10`,
              color: BRAND.primary,
              '--tw-ring-color': `${BRAND.primary}25`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            {roleLabel}
          </span>
        )}

        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="การแจ้งเตือน"
          >
            {totalPendingCount > 0 ? (
              <BellRing className="h-[18px] w-[18px]" strokeWidth={1.8} />
            ) : (
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
            )}
            {totalPendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white flex items-center justify-center leading-none shadow-sm pointer-events-none">
                {totalPendingCount > 9 ? '9+' : totalPendingCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-950/15 ring-1 ring-slate-200/70 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-[13px] font-semibold text-slate-800 tracking-tight">การแจ้งเตือน</p>
                {totalPendingCount > 0 && (
                  <span className="text-[11px] font-semibold bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200 px-2 py-0.5 rounded-full">
                    {totalPendingCount} รายการ
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {totalPendingCount === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <Bell className="h-5 w-5 text-slate-300" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">ไม่มีรายการรอดำเนินการ</p>
                    <p className="text-[11.5px] text-slate-400 mt-1">ทุกอย่างเรียบร้อยดี</p>
                  </div>
                ) : (
                  <div className="py-1.5">
                    {pendingRepairsCount > 0 && (
                      <NotifItem
                        label="แจ้งซ่อมรอดำเนินการ"
                        count={pendingRepairsCount}
                        kind="info"
                        Icon={Wrench}
                        onClick={() => { setActiveMenu('repairs'); setIsNotifOpen(false); }}
                      />
                    )}
                    {pendingSuppliesCount > 0 && (
                      <NotifItem
                        label="คำขอเบิกรอดำเนินการ"
                        count={pendingSuppliesCount}
                        kind="success"
                        Icon={Package}
                        onClick={() => { setActiveMenu('supply_requests'); setIsNotifOpen(false); }}
                      />
                    )}
                    {expiringLicensesCount > 0 && (
                      <NotifItem
                        label="License ใกล้หมดอายุ"
                        count={expiringLicensesCount}
                        kind="warning"
                        Icon={FileText}
                        onClick={() => { setActiveMenu('licenses'); setIsNotifOpen(false); }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600 hover:text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <LogOut className="h-[15px] w-[15px]" strokeWidth={1.8} />
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}

function NotifItem({ label, count, kind, Icon, onClick }) {
  const kindCls = {
    info:    { bg: 'bg-blue-50',    text: 'text-blue-600',    badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
    success: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    warning: { bg: 'bg-amber-50',   text: 'text-amber-600',   badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  }[kind];

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group"
    >
      <div className={`w-9 h-9 rounded-lg ${kindCls.bg} ${kindCls.text} flex items-center justify-center shrink-0`}>
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-800 truncate">{label}</p>
      </div>
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${kindCls.badge} shrink-0`}>
        {count}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
    </button>
  );
}
