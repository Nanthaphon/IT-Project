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
    <header className="h-14 bg-white border-b border-stone-200 px-3 md:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Page title */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Hamburger — แสดงเฉพาะมือถือ */}
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 transition-colors shrink-0"
            aria-label="เปิดเมนู"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        <h2 className="text-[17px] md:text-[19px] font-medium text-stone-900 tracking-tight truncate">
          {menuTitle}
        </h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* User badge — แสดงชื่อ user ที่ login */}
        {badgeLabel && (
          <span
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mr-1"
            style={{
              backgroundColor: `${BRAND.primary}10`,
              color: BRAND.primary,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            {badgeLabel}
          </span>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[13px] font-medium text-stone-600 hover:text-rose-600 px-2 md:px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
          aria-label="ออกจากระบบ"
        >
          <LogOut className="h-[15px] w-[15px]" strokeWidth={2} />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}

function NotifItem({ label, count, kind, Icon, onClick }) {
  const kindCls = {
    info:    { bg: 'bg-stone-50',    text: 'text-stone-600',    badge: 'bg-stone-50 text-stone-700 border-stone-200' },
    success: { bg: 'bg-olive-50', text: 'text-olive-600', badge: 'bg-olive-50 text-olive-700 border-olive-200' },
    warning: { bg: 'bg-clay-100',   text: 'text-clay-600',   badge: 'bg-ochre-50 text-ochre-700 border-ochre-200' },
    cyan:    { bg: 'bg-clay-100',   text: 'text-clay-600',   badge: 'bg-ochre-50 text-ochre-700 border-ochre-200' },
    violet:  { bg: 'bg-clay-100',  text: 'text-clay-600',  badge: 'bg-ochre-50 text-ochre-700 border-ochre-200' },
  }[kind];

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors text-left group"
    >
      <div className={`w-9 h-9 rounded-lg ${kindCls.bg} ${kindCls.text} flex items-center justify-center shrink-0`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate">{label}</p>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${kindCls.badge} shrink-0`}>
        {count}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
    </button>
  );
}
