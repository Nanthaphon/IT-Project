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
        { id: 'field_options', label: 'ตัวเลือกฟิลด์', icon: SlidersHorizontal },
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
    <aside className="w-full md:w-64 flex flex-col flex-shrink-0 h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f2544 0%, #0a1a33 60%, #071220 100%)' }}
    >
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
      <div className="absolute bottom-20 right-0 w-40 h-40 rounded-full opacity-5 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', transform: 'translate(40%, 0)' }} />

      {/* Logo */}
      <div className="relative px-5 pt-6 pb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <img src="/gb_icon.svg" alt="Logo" className="w-8 h-8 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 shadow-sm"
              style={{ borderColor: '#0f2544', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white tracking-wide">IT Admin</p>
            <p className="text-[11px] text-blue-300/60 tracking-widest uppercase">Asset Management</p>
          </div>
        </div>
        <div className="mt-5 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 100%)' }} />
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-2 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {groups.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] px-3 mb-2"
              style={{ color: 'rgba(147,197,253,0.4)' }}>
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map(({ id, label, icon: Icon }) => {
                const active = activeMenu === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveMenu(id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative"
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.15) 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.3)',
                    } : {}}
                  >
                    {/* Active left bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                        style={{ background: 'linear-gradient(180deg, #60a5fa, #818cf8)' }} />
                    )}

                    {/* Icon container */}
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                      style={active ? {
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                      } : {
                        background: 'rgba(255,255,255,0.05)',
                      }}>
                      <Icon className={`h-4 w-4 transition-colors duration-200 ${active ? 'text-white' : 'text-blue-300/50 group-hover:text-blue-200'}`} />
                    </span>

                    <span className={`truncate font-medium transition-colors duration-200 ${
                      active ? 'text-white' : 'text-blue-200/60 group-hover:text-blue-100'
                    }`}>
                      {label}
                    </span>

                    {/* Hover glow */}
                    {!active && (
                      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ background: 'rgba(255,255,255,0.03)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* บัญชี */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] px-3 mb-2"
            style={{ color: 'rgba(147,197,253,0.4)' }}>
            บัญชี
          </p>
          <button
            onClick={onResetPassword}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group"
          >
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <KeyRound className="h-4 w-4 text-blue-300/50 group-hover:text-blue-200 transition-colors" />
            </span>
            <span className="font-medium text-blue-200/60 group-hover:text-blue-100 transition-colors">
              เปลี่ยนรหัสผ่าน
            </span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="relative hidden md:block px-4 py-4 shrink-0">
        <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.07) 0%, transparent 100%)' }} />
        <div className="flex items-center gap-2.5 px-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"
              style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }}></span>
          </span>
          <span className="text-xs font-medium" style={{ color: 'rgba(147,197,253,0.5)' }}>
            ระบบออนไลน์
          </span>
        </div>
      </div>
    </aside>
  );
}

