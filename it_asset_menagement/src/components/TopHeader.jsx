import React from 'react';
import { Bell, BellRing, Wrench, Package, FileText, LogOut, ChevronRight, Menu, ArrowLeftRight, Sparkles } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

export default function TopHeader({
  menuTitle,
  notifRef,
  isNotifOpen,
  setIsNotifOpen,
  totalPendingCount,
  pendingRepairsCount,
  pendingSuppliesCount,
  pendingReplacementsCount = 0,
  pendingAccessoryReqCount = 0,
  expiringLicensesCount,
  setActiveMenu,
  handleLogout,
  authRole,
  isSuperAdmin,
  userName,
  onOpenSidebar,
}) {
  const roleLabel =
    authRole === 'admin' ? 'IT Admin' :
    authRole === 'hr'    ? 'HR' :
    authRole === 'staff' ? 'Staff' : '';
  // แสดงชื่อ user ที่ login ถ้ามี — ถ้าไม่มีใช้ชื่อ role แทน
  const badgeLabel = userName || roleLabel;

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 md:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Page title */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Hamburger — แสดงเฉพาะมือถือ */}
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="เปิดเมนู"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        <h2 className="text-[17px] md:text-[19px] font-bold text-slate-900 tracking-tight truncate">
          {menuTitle}
        </h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* User badge — แสดงชื่อ user ที่ login */}
        {badgeLabel && (
          <span
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border mr-1"
            style={{
              backgroundColor: `${BRAND.primary}10`,
              color: BRAND.primary,
              borderColor: `${BRAND.primary}25`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            {badgeLabel}
          </span>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[13.5px] font-medium text-slate-600 hover:text-rose-600 px-2 md:px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
          aria-label="ออกจากระบบ"
        >
          <LogOut className="h-[15px] w-[15px]" strokeWidth={1.8} />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}

function NotifItem({ label, count, kind, Icon, onClick }) {
  const kindCls = {
    info:    { bg: 'bg-blue-50',    text: 'text-blue-600',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    success: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    warning: { bg: 'bg-amber-50',   text: 'text-amber-600',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600',    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  badge: 'bg-violet-50 text-violet-700 border-violet-200' },
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
        <p className="text-[14px] font-medium text-slate-800 truncate">{label}</p>
      </div>
      <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-md border ${kindCls.badge} shrink-0`}>
        {count}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
    </button>
  );
}
