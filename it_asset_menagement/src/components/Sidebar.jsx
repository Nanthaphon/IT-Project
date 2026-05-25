import React from 'react';
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
      group: 'ตั้งค่า',
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

export default function Sidebar({ activeMenu, setActiveMenu, onChangePassword, authRole, isSuperAdmin, allowedMenus, canManageUsers, sidebarOpen, setSidebarOpen }) {
  // wrapper handler: เลือกเมนูแล้วปิด sidebar บนมือถือ
  const handleMenuClick = (id) => {
    setActiveMenu(id);
    if (setSidebarOpen) setSidebarOpen(false);
  };
  const handleChangePassword = () => {
    onChangePassword();
    if (setSidebarOpen) setSidebarOpen(false);
  };
  const baseGroups = NAV_ITEMS[authRole] || NAV_ITEMS.hr;

  // Filter groups by allowedMenus (null = show all, [] = show none)
  const filteredGroups = baseGroups.map(group => ({
    ...group,
    items: group.items.filter(item =>
      !allowedMenus || allowedMenus.includes(item.id)
    ),
  })).filter(group => group.items.length > 0);

  // Append admin group for SuperAdmin or admins allowed to manage users/passwords
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
      {/* Backdrop overlay บนมือถือ — คลิกเพื่อปิด */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`w-64 flex flex-col flex-shrink-0 h-screen text-slate-100 transition-transform duration-300 ease-in-out
          fixed md:static inset-y-0 left-0 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          background:
            'radial-gradient(120% 80% at 0% 0%, #234e85 0%, #1b4174 35%, #112f57 100%)',
        }}
      >
      {/* ขอบขวาบางๆ ให้เกิดเส้นแบ่งกับ content */}
      <div className="absolute inset-y-0 right-0 w-px bg-white/8 pointer-events-none" />

      {/* Logo / Brand */}
      <div className="px-5 pt-6 pb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-black/20"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #dbeafe 100%)',
            }}
          >
            <img
              src="/gb_icon.svg"
              alt="Logo"
              className="w-5 h-5 object-contain"
              style={{
                filter:
                  'invert(20%) sepia(40%) saturate(1400%) hue-rotate(190deg) brightness(70%)',
              }}
            />
          </div>
          <div className="leading-tight">
            <p className="text-[16px] font-semibold text-white tracking-tight">IT Admin</p>
            <p className="text-[12px] text-blue-200/70 tracking-wide">Asset Management</p>
          </div>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/10 shrink-0" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {groups.map((group) => (
          <div key={group.group}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200/55 px-3 mb-2">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map(({ id, label, icon: Icon }) => {
                const active = activeMenu === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleMenuClick(id)}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14.5px] transition-all duration-150 group
                      ${active
                        ? 'bg-white text-[#1E487A] font-semibold shadow-lg shadow-black/10'
                        : 'text-blue-100/80 hover:bg-white/8 hover:text-white font-medium'
                      }`}
                  >
                    {/* แถบสีตัวบ่งชี้ด้านซ้ายเฉพาะ active */}
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                        style={{ background: '#1E487A' }}
                      />
                    )}

                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                        active ? 'text-[#1E487A]' : 'text-blue-200/80 group-hover:text-white'
                      }`}
                      strokeWidth={active ? 2.2 : 1.8}
                    />

                    <span className="truncate">{label}</span>

                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1E487A]/80 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* บัญชี */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200/55 px-3 mb-2">
            บัญชี
          </p>
          <button
            onClick={handleChangePassword}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14.5px] font-medium text-blue-100/80 hover:bg-white/8 hover:text-white transition-all duration-150 group"
          >
            <KeyRound
              className="h-[18px] w-[18px] shrink-0 text-blue-200/80 group-hover:text-white transition-colors"
              strokeWidth={1.8}
            />
            <span className="truncate">เปลี่ยนรหัสผ่าน</span>
          </button>
        </div>
      </nav>

      {/* Footer — สถานะระบบ */}
      <div className="hidden md:block px-4 py-4 shrink-0 border-t border-white/10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[12.5px] text-blue-200/70 font-medium tracking-wide">
              ระบบออนไลน์
            </span>
          </div>
          <span className="text-[11px] text-blue-200/40 font-mono">v1.0</span>
        </div>
      </div>
    </aside>
    </>
  );
}
