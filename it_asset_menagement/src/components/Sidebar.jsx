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
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = {
  admin: [
    {
      group: 'ทรัพย์สิน',
      items: [
        { id: 'dashboard',   label: 'แดชบอร์ด',         icon: LayoutDashboard },
        { id: 'assets',      label: 'ทรัพย์สิน',         icon: Monitor },
        { id: 'licenses',    label: 'โปรแกรม / License', icon: AppWindow },
        { id: 'accessories', label: 'อุปกรณ์เสริม',      icon: Cable },
      ],
    },
    {
      group: 'การจัดการ',
      items: [
        { id: 'office_supplies',      label: 'อุปกรณ์สำนักงาน',  icon: Package },
        { id: 'supply_requests',      label: 'คำขอเบิกอุปกรณ์',  icon: ClipboardList },
        { id: 'accessory_requests',   label: 'คำขออุปกรณ์เสริม', icon: ClipboardList },
        { id: 'employees',            label: 'พนักงาน',    icon: Users },
        { id: 'repairs',              label: 'แจ้งซ่อม',         icon: Wrench },
        { id: 'replacement_requests', label: 'ขอเปลี่ยนเครื่อง', icon: ArrowLeftRight },
      ],
    },
    {
      group: 'รายงาน',
      items: [
        { id: 'kpi_dashboard', label: 'รายงาน KPI',      icon: TrendingUp },
        { id: 'field_options', label: 'ตัวเลือกฟิลด์',   icon: SlidersHorizontal },
        { id: 'it_report',     label: 'IT Report', icon: FileBarChart2 },
      ],
    },
  ],
  hr: [
    {
      group: 'การจัดการ',
      items: [
        { id: 'office_supplies', label: 'อุปกรณ์สำนักงาน', icon: Package },
        { id: 'supply_requests', label: 'คำขอเบิกอุปกรณ์', icon: ClipboardList },
        { id: 'employees',       label: 'พนักงาน',   icon: Users },
      ],
    },
  ],
};

export default function Sidebar({
  activeMenu, setActiveMenu, onChangePassword, authRole, isSuperAdmin,
  allowedMenus, canManageUsers, sidebarOpen, setSidebarOpen,
  menuCounts = {}, // 🆕 { repairs: 2, supply_requests: 5, licenses: 3, ... }
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
          className="fixed inset-0 bg-slate-950/30 z-40 md:hidden"
        />
      )}

      <aside
        className={`w-[260px] flex flex-col flex-shrink-0 h-screen transition-transform duration-300 ease-out
          fixed md:static inset-y-0 left-0 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          background: 'linear-gradient(180deg, #1E487A 0%, #112F57 100%)',
        }}
      >

        {/* ─── Logo / Brand area ─── */}
        <div className="px-5 pt-6 pb-5 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-white/15 ring-1 ring-white/25">
              <img
                src="/gb_icon.svg"
                alt="Logo"
                className="w-5 h-5 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <p className="text-[15.5px] font-semibold text-white tracking-tight">IT Admin</p>
          </div>
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {groups.map((group, gi) => (
            <div key={group.group}>
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon }) => {
                  const active = activeMenu === id;
                  const hovered = hoveredId === id;
                  const count = Number(menuCounts[id] || 0);
                  const isExpiryBadge = id === 'licenses';
                  return (
                    <button
                      key={id}
                      onClick={() => handleMenuClick(id)}
                      onMouseEnter={() => setHoveredId(id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors group
                        ${active
                          ? 'font-semibold text-white bg-white/15 ring-1 ring-white/15'
                          : hovered
                            ? 'font-medium text-white bg-white/8'
                            : 'font-medium text-blue-100/85 hover:text-white'
                        }`}
                    >
                      {/* Icon container */}
                      <span className="relative flex items-center justify-center w-7 h-7 rounded-lg shrink-0">
                        <Icon className="h-[16px] w-[16px]" strokeWidth={active ? 2.4 : 2} />
                        {/* จุดสีบน icon เมื่อมีค้าง (ไม่ active) */}
                        {!active && count > 0 && (
                          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#1E487A] ${
                            isExpiryBadge ? 'bg-amber-400' : 'bg-rose-400'
                          }`} />
                        )}
                      </span>

                      <span className="truncate flex-1 text-left">{label}</span>

                      {/* Count badge */}
                      {count > 0 && (
                        <span
                          className={`text-[10.5px] font-bold tabular-nums px-1.5 min-w-[20px] h-[19px] inline-flex items-center justify-center rounded-full shrink-0 ${
                            active
                              ? 'bg-white/25 text-white'
                              : isExpiryBadge
                                ? 'bg-amber-400 text-amber-950'
                                : 'bg-rose-400 text-white'
                          }`}
                          title={isExpiryBadge ? `${count} รายการใกล้หมดอายุ` : `${count} รายการรอดำเนินการ`}
                        >
                          {count > 99 ? '99+' : count}
                        </span>
                      )}

                      {/* Arrow ตอน hover (เฉพาะไม่ active และไม่มี badge) */}
                      {!active && hovered && count === 0 && (
                        <ChevronRight className="h-3.5 w-3.5 text-blue-200/60 shrink-0" strokeWidth={2.4} />
                      )}

                      {/* Active dot indicator */}
                      {active && count === 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* แถบเส้นแบ่งระหว่างกลุ่ม */}
              {gi < groups.length - 1 && (
                <div className="mt-4 mx-3 h-px bg-white/10" />
              )}
            </div>
          ))}

          {/* ─── บัญชี ─── */}
          <div>
            <div className="mt-2 mx-3 h-px bg-white/10 mb-2" />
            <button
              onClick={handleChangePassword}
              onMouseEnter={() => setHoveredId('__changepwd__')}
              onMouseLeave={() => setHoveredId(null)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors ${
                hoveredId === '__changepwd__'
                  ? 'bg-white/8 text-white'
                  : 'text-blue-100/85 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0">
                <KeyRound className="h-[16px] w-[16px]" strokeWidth={2} />
              </span>
              <span className="truncate flex-1 text-left">เปลี่ยนรหัสผ่าน</span>
              {hoveredId === '__changepwd__' && (
                <ChevronRight className="h-3.5 w-3.5 text-blue-200/60 shrink-0" strokeWidth={2.4} />
              )}
            </button>
          </div>
        </nav>

      </aside>
    </>
  );
}
