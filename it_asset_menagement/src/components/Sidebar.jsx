import React from 'react';

const NAV_ITEMS = {
  admin: [
    {
      group: 'ทรัพย์สิน',
      items: [
        { id: 'dashboard',   label: 'แดชบอร์ด',         icon: IconDashboard },
        { id: 'assets',      label: 'ทรัพย์สินหลัก',     icon: IconAsset },
        { id: 'licenses',    label: 'โปรแกรม / License', icon: IconLicense },
        { id: 'accessories', label: 'อุปกรณ์เสริม',      icon: IconAccessory },
      ],
    },
    {
      group: 'การจัดการ',
      items: [
        { id: 'office_supplies',      label: 'อุปกรณ์สำนักงาน',  icon: IconBox },
        { id: 'supply_requests',      label: 'คำขอเบิกอุปกรณ์',  icon: IconClipboard },
        { id: 'employees',            label: 'ข้อมูลพนักงาน',    icon: IconUsers },
        { id: 'repairs',              label: 'แจ้งซ่อม',         icon: IconWrench },
        { id: 'replacement_requests', label: 'ขอเปลี่ยนเครื่อง', icon: IconRefresh },
      ],
    },
  ],
  hr: [
    {
      group: 'การจัดการ',
      items: [
        { id: 'office_supplies', label: 'อุปกรณ์สำนักงาน', icon: IconBox },
        { id: 'supply_requests', label: 'คำขอเบิกอุปกรณ์', icon: IconClipboard },
        { id: 'employees',       label: 'ข้อมูลพนักงาน',   icon: IconUsers },
      ],
    },
  ],
};

export default function Sidebar({ activeMenu, setActiveMenu, onResetPassword, authRole }) {
  const groups = NAV_ITEMS[authRole] || NAV_ITEMS.hr;

  return (
    <aside
      className="w-full md:w-60 flex flex-col flex-shrink-0 h-screen"
      style={{ background: 'linear-gradient(180deg, #1E487A 0%, #133257 100%)' }}
    >
      {/* Logo */}
      <div className="h-14 px-5 flex items-center gap-3 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 bg-white/15 border border-white/20 text-white rounded-xl flex items-center justify-center font-serif italic text-base shadow-sm select-none">
          G
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">IT Admin</p>
          <p className="text-[10px] text-blue-200/70 tracking-wide">Asset Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {groups.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-semibold text-blue-200/50 uppercase tracking-widest px-2 mb-1.5">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ id, label, icon: Icon }) => {
                const active = activeMenu === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveMenu(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      active
                        ? 'bg-white text-[#1E487A] font-semibold shadow-md'
                        : 'text-blue-100/80 hover:bg-white/10 hover:text-white font-medium'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? 'text-[#1E487A]' : 'text-blue-200/70'}`}
                    />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* เปลี่ยนรหัสผ่าน */}
        <div>
          <p className="text-[10px] font-semibold text-blue-200/50 uppercase tracking-widest px-2 mb-1.5">
            บัญชี
          </p>
          <button
            onClick={onResetPassword}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-100/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <IconLock className="h-4 w-4 shrink-0 text-blue-200/70" />
            <span>เปลี่ยนรหัสผ่าน</span>
          </button>
        </div>
      </nav>

      {/* Status footer */}
      <div className="hidden md:flex items-center gap-2 px-5 py-3 border-t border-white/10 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
        <span className="text-xs text-blue-200/60 font-medium">ระบบออนไลน์</span>
      </div>
    </aside>
  );
}

/* ── SVG Icon components ── */
function IconDashboard({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5h7.5V3H3v10.5zM3 21h7.5v-4.5H3V21zm10.5 0H21v-10.5h-7.5V21zm0-18v4.5H21V3h-7.5z" />
    </svg>
  );
}
function IconAsset({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}
function IconLicense({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconAccessory({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
function IconBox({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
function IconClipboard({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}
function IconUsers({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconWrench({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconRefresh({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
function IconLock({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
