// Unified design tokens — keep the whole app on one visual language.
// น้ำเงิน-ขาว, minimal, สบายตา

// ── Companies — ใช้กับ employee และ asset records ──
export const COMPANIES = ['Globe Syndicate', 'Besthrm'];

export const BRAND = {
  primary:      '#1E487A',  // main navy (action, accent, active state)
  primaryDark:  '#163963',  // hover / pressed
  primaryDeep:  '#112F57',  // sidebar bottom
  primarySoft:  '#E8EFF8',  // very light navy tint for backgrounds
  primaryRing:  'rgba(30,72,122,0.15)', // focus ring
};

// Status colors — used sparingly for badges/indicators
export const STATUS = {
  success: { bg: '#ECFDF5', text: '#047857', ring: '#A7F3D0' },  // emerald
  warning: { bg: '#FFFBEB', text: '#B45309', ring: '#FCD34D' },  // amber
  danger:  { bg: '#FEF2F2', text: '#B91C1C', ring: '#FCA5A5' },  // rose
  info:    { bg: '#EFF6FF', text: '#1D4ED8', ring: '#BFDBFE' },  // blue
  neutral: { bg: '#F1F5F9', text: '#475569', ring: '#CBD5E1' },  // slate
};

// Reusable input/select/textarea base styles (Tailwind classes)
export const cls = {
  input:
    'w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 ' +
    'placeholder:text-slate-400 outline-none transition-all ' +
    'hover:border-slate-300 focus:border-[#1E487A] focus:ring-2 focus:ring-[#1E487A]/15 ' +
    'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',

  inputMono:
    'w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 font-mono tracking-tight ' +
    'placeholder:text-slate-400 outline-none transition-all ' +
    'hover:border-slate-300 focus:border-[#1E487A] focus:ring-2 focus:ring-[#1E487A]/15',

  select:
    'w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 ' +
    'outline-none transition-all hover:border-slate-300 focus:border-[#1E487A] focus:ring-2 focus:ring-[#1E487A]/15 ' +
    'cursor-pointer pr-9 appearance-none bg-no-repeat bg-[right_0.75rem_center] ' +
    "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='none' stroke='%2364748b' stroke-width='2'><path d='M5 7l5 5 5-5'/></svg>\")]",

  // label ฟอร์ม — ตรงกับ labelCls ของ StaffView
  label:
    'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5',

  // Buttons
  btnPrimary:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg ' +
    'bg-[#1E487A] hover:bg-[#163963] transition-colors ' +
    'focus:outline-none focus:ring-2 focus:ring-[#1E487A]/30 ' +
    'disabled:bg-slate-300 disabled:cursor-not-allowed',

  btnSecondary:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 rounded-lg ' +
    'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors ' +
    'focus:outline-none focus:ring-2 focus:ring-slate-200',

  btnGhost:
    'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg ' +
    'hover:bg-slate-100 hover:text-slate-900 transition-colors',

  btnDanger:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg ' +
    'bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm hover:shadow-md ' +
    'focus:outline-none focus:ring-2 focus:ring-rose-200',

  // Cards / surfaces — ธีมฝั่งพนักงาน: ขอบบาง + เงานุ่มโทนน้ำเงิน
  card:
    'bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)]',

  cardHover:
    'bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)] ' +
    'hover:border-slate-300 transition-colors',

  // Modal pieces
  modalOverlay:
    'fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[85]',

  modalShell:
    'bg-white rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(16,47,87,0.04),0_10px_28px_-16px_rgba(16,47,87,0.12)] ' +
    'w-full overflow-hidden flex flex-col max-h-[92vh]',

  // Table
  tableHead:
    'text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80 border-b border-slate-200',

  tableRow:
    'border-b border-slate-100 hover:bg-slate-50/60 transition-colors',

  // Badges — ธีมฝั่งพนักงาน: rounded-md + border (ไม่ใช่ pill กลม + ring)
  badge:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border',
};

// Helper: status badge classNames given a STATUS key
export function badgeCls(kind = 'neutral') {
  const s = STATUS[kind] || STATUS.neutral;
  return `${cls.badge}`;
}

export function badgeStyle(kind = 'neutral') {
  const s = STATUS[kind] || STATUS.neutral;
  return { backgroundColor: s.bg, color: s.text, '--tw-ring-color': s.ring };
}
