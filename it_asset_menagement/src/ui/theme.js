// Unified design tokens — keep the whole app on one visual language.
// Canyon (earth tone), minimal, สบายตา

// ── Companies — ใช้กับ employee และ asset records ──
export const COMPANIES = ['Globe Syndicate', 'Besthrm'];

export const BRAND = {
  primary:      '#A65F3C',  // terracotta — สีหลัก (ปุ่ม/ไฮไลท์/สถานะ active)
  primaryDark:  '#8E4E30',  // hover / pressed
  primaryDeep:  '#6E3B26',  // เข้มสุด (ฐาน sidebar)
  primarySoft:  '#F3E7DF',  // very light navy tint for backgrounds
  primaryRing:  'rgba(166,95,60,0.15)', // focus ring
};

// Status colors — used sparingly for badges/indicators
export const STATUS = {
  success: { bg: '#ECFDF5', text: '#047857', ring: '#A7F3D0' },  // emerald
  warning: { bg: '#FFFBEB', text: '#B45309', ring: '#FCD34D' },  // amber
  danger:  { bg: '#FEF2F2', text: '#B91C1C', ring: '#FCA5A5' },  // rose
  info:    { bg: '#F5F5F4', text: '#57534E', ring: '#D6D3D1' },  // blue
  neutral: { bg: '#F5F5F4', text: '#57534E', ring: '#D6D3D1' },  // slate
};

// Reusable input/select/textarea base styles (Tailwind classes)
export const cls = {
  input:
    'w-full bg-white border border-stone-200/60 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 ' +
    'placeholder:text-stone-400 outline-none transition-all ' +
    'hover:border-stone-300 focus:border-clay-600 focus:ring-2 focus:ring-clay-600/15 ' +
    'disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed',

  inputMono:
    'w-full bg-white border border-stone-200/60 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 font-mono tracking-tight ' +
    'placeholder:text-stone-400 outline-none transition-all ' +
    'hover:border-stone-300 focus:border-clay-600 focus:ring-2 focus:ring-clay-600/15',

  select:
    'w-full bg-white border border-stone-200/60 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 ' +
    'outline-none transition-all hover:border-stone-300 focus:border-clay-600 focus:ring-2 focus:ring-clay-600/15 ' +
    'cursor-pointer pr-9 appearance-none bg-no-repeat bg-[right_0.75rem_center] ' +
    "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='none' stroke='%23a8a29e' stroke-width='2'><path d='M5 7l5 5 5-5'/></svg>\")]",

  // label ฟอร์ม — ตรงกับ labelCls ของ StaffView
  label:
    'block text-[13px] font-medium text-stone-500 mb-2',

  // Buttons
  btnPrimary:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl ' +
    'bg-clay-600 hover:bg-clay-700 transition-colors ' +
    'focus:outline-none focus:ring-2 focus:ring-clay-600/30 ' +
    'disabled:bg-stone-300 disabled:cursor-not-allowed',

  btnSecondary:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 rounded-xl ' +
    'bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-colors ' +
    'focus:outline-none focus:ring-2 focus:ring-stone-200',

  btnGhost:
    'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-600 rounded-xl ' +
    'hover:bg-stone-100 hover:text-stone-900 transition-colors',

  btnDanger:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl ' +
    'bg-brick-600 hover:bg-brick-700 transition-colors shadow-sm hover:shadow-md ' +
    'focus:outline-none focus:ring-2 focus:ring-rose-200',

  // Cards / surfaces — ธีมฝั่งพนักงาน: ขอบบาง + เงานุ่มโทนน้ำเงิน
  card:
    'bg-white rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(74,43,41,0.20)]',

  cardHover:
    'bg-white rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(74,43,41,0.20)] ' +
    'hover:border-stone-300 transition-colors',

  // Modal pieces
  modalOverlay:
    'fixed inset-0 bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-[85]',

  modalShell:
    'bg-white rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_20px_50px_-28px_rgba(74,43,41,0.20)] ' +
    'w-full overflow-hidden flex flex-col max-h-[92vh]',

  // Table
  tableHead:
    'text-[12px] font-medium text-stone-400 border-b border-stone-200/60',

  tableRow:
    'border-b border-stone-100 hover:bg-stone-50/60 transition-colors',

  // Badges — ธีม v3: rounded-lg ไม่มีขอบ ตรงกับ StatusBadge ในหน้ารายการ
  badge:
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
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
