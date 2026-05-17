import React from 'react';
import {
  LayoutDashboard,
  Server,
  FileText,
  Cpu,
  Package,
  ClipboardList,
  Users,
  Wrench,
  RefreshCw,
  KeyRound,
  SlidersHorizontal,
  BarChart3,
} from 'lucide-react';

const NAV_ITEMS = {
  admin: [
    {
      group: 'ทรัพย์สิน',
      items: [
        { id: 'dashboard',   label: 'แดชบอร์ด',         icon: LayoutDashboard },
        { id: 'assets',      label: 'ทรัพย์สินหลัก',     icon: Server },
        { id: 'licenses',    label: 'โปรแกรม / License', icon: FileText },
        { id: 'accessories', label: 'อุปกรณ์เสริม',      icon: Cpu },
      ],
    },
    {
      group: 'การจัดการ',
      items: [
        { id: 'office_supplies',      label: 'อุปกรณ์สำนักงาน',  icon: Package },
        { id: 'supply_requests',      label: 'คำขอเบิกอุปกรณ์',  icon: ClipboardList },
        { id: 'employees',            label: 'ข้อมูลพนักงาน',    icon: Users },
        { id: 'repairs',              label: 'แจ้งซ่อม',         icon: Wrench },
        { id: 'replacement_requests', label: 'ขอเปลี่ยนเครื่อง', icon: RefreshCw },
      ],
    },
    {
      group: 'ตั้งค่า',
      items: [
        { id: 'field_options', label: 'ตัวเลือกฟิลด์',   icon: SlidersHorizontal },
        { id: 'it_report',     label: 'สร้าง IT Report', icon: BarChart3 },
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

export default function Sidebar({ activeMenu, setActiveMenu, onResetPassword, authRole }) {
  const groups = NAV_ITEMS[authRole] || NAV_ITEMS.hr;

  return (
    <aside className="w-full md:w-60 flex flex-col flex-shrink-0 h-screen bg-white border-r border-slate-100">

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1E487A]">
            <img src="/gb_icon.svg" alt="Logo" className="w-5 h-5 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-800">IT Admin</p>
            <p className="text-[11px] text-slate-400 tracking-wide">Asset Management</p>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-slate-100 shrink-0" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {groups.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 px-3 mb-1.5">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ id, label, icon: Icon }) => {
                const active = activeMenu === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveMenu(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                      ${active
                        ? 'bg-[#EFF6FF] text-[#1E487A]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                  >
                    {/* Icon */}
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150
                      ${active
                        ? 'bg-[#1E487A] text-white'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'
                      }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>

                    <span className="truncate">{label}</span>

                    {/* Active indicator dot */}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1E487A] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* บัญชี */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 px-3 mb-1.5">
            บัญชี
          </p>
          <button
            onClick={onResetPassword}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-150 group"
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500 transition-colors">
              <KeyRound className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">เปลี่ยนรหัสผ่าน</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="hidden md:block px-4 py-4 shrink-0 border-t border-slate-100">
        <div className="flex items-center gap-2 px-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-xs text-slate-400 font-medium">ระบบออนไลน์</span>
        </div>
      </div>
    </aside>
  );
}
