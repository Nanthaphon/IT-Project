import React, { useState } from 'react';
import {
  LayoutDashboard,
  Monitor,
  AppWindow,
  Cable,
  Package,
  ClipboardList,
  Users,
  Wrench,
  ArrowLeftRight,
  KeyRound,
  SlidersHorizontal,
  FileBarChart2,
  TrendingUp,
  ShieldCheck,
  Settings,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = {
  admin: [
    {
      group: 'ทรัพย์สิน',
      items: [
        { id: 'dashboard',   label: 'แดชบอร์ด',         icon: LayoutDashboard },
        { id: 'assets',      label: 'ทรัพย์สินหลัก',     icon: Monitor },
        { id: 'licenses',    label: 'โปรแกรม / License', icon: AppWindow },
        { id: 'accessories', label: 'อุปกรณ์เสริม',      icon: Cable },
      ],
    },
    {
      group: 'การจัดการ',
      items: [
        { id: 'office_supplies',      label: 'อุปกรณ์สำนักงาน',  icon: Package },
        { id: 'supply_requests',      label: 'คำขอเบิกอุปกรณ์',  icon: ClipboardList },
        { id: 'employees',            label: 'ข้อมูลพนักงาน',    icon: Users },
        { id: 'repairs',              label: 'แจ้งซ่อม',         icon: Wrench },
        { id: 'replacement_requests', label: 'ขอเปลี่ยนเครื่อง', icon: ArrowLeftRight },
      ],
    },
    {
      group: 'รายงาน',
      items: [
        { id: 'kpi_dashboard', label: 'รายงาน KPI',      icon: TrendingUp },
        { id: 'field_options', label: 'ตัวเลือกฟิลด์',   icon: SlidersHorizontal },
        { id: 'it_report',     label: 'สร้าง IT Report', icon: FileBarChart2 },
      ],
    },
  ],
  hr: [
    {
      group: 'การจัดการ',
      items: [
        { id: 'office_supplies', label: 'อุปกรณ์สำนักงาน', icon: Package },
        { id: 'supply_requests', label: 'คำขอเบิกอุปกรณ์', icon: ClipboardList },
        { id: 'employees',       label: 'ข้อมูลพนักงาน',   icon: Users },
      ],
    },
  ],
};

export default function Sidebar({
  activeMenu, setActiveMenu, onChangePassword, authRole, isSuperAdmin,
  allowedMenus, canManageUsers, sidebarOpen, setSidebarOpen,
}) {
  const [hoveredId, setHoveredId] = useState(null);

  const handleMenuClick = (id) => {
    setActiveMenu(id);
    if (setSidebarOpen) setSidebarOpen(false);
  };
  const handleChangePassword = () => {
    onChangePassword();
    if (setSidebarOpen) setSidebarOpen(false);
  };

  const baseGroups = NAV_ITEMS[authRole] || NAV_ITEMS.hr;
  const filteredGroups = baseGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !allowedMenus || allowedMenus.includes(item.id)),
  })).filter(group => group.items.length > 0);

  const adminItems = [];
  if (isSuperAdmin || canManageUsers) {
    adminItems.push({ id: 'users', label: 'จัดการผู้ใช้', icon: ShieldCheck });
  }
  if (isSuperAdmin) {
    adminItems.push({ id: 'system_settings', label: 'ตั้งค่าระบบ', icon: Settings });
  }
  const superAdminGroup = adminItems.length > 0 ? [{
    group: 'ผู้ดูแลระบบ',
    items: adminItems,
  }] : [];

  const groups = [...filteredGroups, ...superAdminGroup];

  return (
    <>
      {/* Backdrop overlay บนมือถือ */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`w-[260px] flex flex-col flex-shrink-0 h-screen transition-transform duration-300 ease-out
          fixed md:static inset-y-0 left-0 z-50 bg-white
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFD 100%)',
          boxShadow: '1px 0 0 rgba(15, 23, 42, 0.06), 4px 0 24px rgba(15, 23, 42, 0.04)',
        }}
      >

        {/* ─── Logo / Brand area ─── */}
        <div className="px-5 pt-6 pb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1E487A 0%, #112F57 100%)',
                boxShadow: '0 6px 16px rgba(30, 72, 122, 0.30), 0 1px 2px rgba(30, 72, 122, 0.20)',
              }}
            >
              {/* shine effect */}
              <span
                className="absolute inset-0 opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)',
                }}
              />
              <img
                src="/gb_icon.svg"
                alt="Logo"
                className="w-5 h-5 object-contain relative z-10"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <div className="leading-tight">
              <p className="text-[15.5px] font-bold text-slate-800 tracking-tight">IT Admin</p>
              <p className="text-[11.5px] text-slate-400 tracking-wide font-medium">Asset Management</p>
            </div>
          </div>
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {groups.map((group, gi) => (
            <div key={group.group}>
              {/* Group title — ไม่ใช้ uppercase */}
              <p className="text-[10.5px] font-bold text-slate-400 px-3.5 mb-1.5 tracking-[0.14em] uppercase">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon }) => {
                  const active = activeMenu === id;
                  const hovered = hoveredId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleMenuClick(id)}
                      onMouseEnter={() => setHoveredId(id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 group
                        ${active
                          ? 'font-semibold text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 font-medium'
                        }`}
                      style={active ? {
                        background: 'linear-gradient(135deg, #1E487A 0%, #2A5896 100%)',
                        boxShadow: '0 4px 12px rgba(30, 72, 122, 0.25), 0 1px 2px rgba(30, 72, 122, 0.15)',
                      } : hovered ? {
                        background: 'rgba(30, 72, 122, 0.06)',
                      } : {}}
                    >
                      {/* Icon container */}
                      <span
                        className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all ${
                          active
                            ? 'bg-white/15 text-white'
                            : 'text-slate-500 group-hover:text-[#1E487A]'
                        }`}
                      >
                        <Icon className="h-[16px] w-[16px]" strokeWidth={active ? 2.4 : 2} />
                      </span>

                      <span className="truncate flex-1 text-left">{label}</span>

                      {/* Arrow ตอน hover (เฉพาะเมื่อไม่ active) */}
                      {!active && hovered && (
                        <ChevronRight
                          className="h-3.5 w-3.5 text-slate-400 shrink-0 transition-all"
                          strokeWidth={2.4}
                        />
                      )}

                      {/* Active dot indicator */}
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* แถบเส้นแบ่งระหว่างกลุ่ม (ยกเว้นกลุ่มสุดท้าย) */}
              {gi < groups.length - 1 && (
                <div className="mt-4 mx-3 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              )}
            </div>
          ))}

          {/* ─── บัญชี ─── */}
          <div>
            <div className="mt-2 mx-3 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-4" />
            <p className="text-[10.5px] font-bold text-slate-400 px-3.5 mb-1.5 tracking-[0.14em] uppercase">
              บัญชี
            </p>
            <button
              onClick={handleChangePassword}
              onMouseEnter={() => setHoveredId('__changepwd__')}
              onMouseLeave={() => setHoveredId(null)}
              className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-600 hover:text-slate-900 transition-all duration-200 group"
              style={hoveredId === '__changepwd__' ? { background: 'rgba(30, 72, 122, 0.06)' } : {}}
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 text-slate-500 group-hover:text-[#1E487A] transition-colors">
                <KeyRound className="h-[16px] w-[16px]" strokeWidth={2} />
              </span>
              <span className="truncate flex-1 text-left">เปลี่ยนรหัสผ่าน</span>
              {hoveredId === '__changepwd__' && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={2.4} />
              )}
            </button>
          </div>
        </nav>

        {/* ─── Footer ─── */}
        <div className="hidden md:block px-4 py-4 shrink-0">
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #F0F7FF 0%, #E8F0FB 100%)',
              border: '1px solid rgba(30, 72, 122, 0.08)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11.5px] text-slate-600 font-semibold tracking-wide">
                ระบบออนไลน์
              </span>
            </div>
            <span className="text-[10.5px] text-slate-400 font-mono font-semibold">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
