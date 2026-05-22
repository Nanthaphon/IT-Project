import React from 'react';
import { cls, BRAND } from './theme.js';

/* Field — label + input wrapper */
export function Field({ label, required, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className={cls.label}>
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{hint}</p>}
      {error && <p className="text-[11px] text-rose-500 mt-1.5 leading-snug">{error}</p>}
    </div>
  );
}

/* SectionHeader — uppercase subtle dividers inside forms / cards */
export function SectionHeader({ children, action }) {
  return (
    <div className="flex items-center gap-3 first:pt-0">
      <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase shrink-0">
        {children}
      </span>
      <span className="flex-1 h-px bg-slate-200/80" />
      {action && <span className="shrink-0">{action}</span>}
    </div>
  );
}

/* Button — primary / secondary / ghost / danger */
export function Button({
  variant = 'primary',
  type = 'button',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const variantCls =
    variant === 'secondary' ? cls.btnSecondary :
    variant === 'ghost'     ? cls.btnGhost :
    variant === 'danger'    ? cls.btnDanger :
    cls.btnPrimary;

  const sizeCls =
    size === 'sm' ? 'px-3 py-1.5 text-[13px]' :
    size === 'lg' ? 'px-5 py-3 text-[15px]' : '';

  return (
    <button type={type} className={`${variantCls} ${sizeCls} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* Card — generic surface */
export function Card({ children, className = '', hoverable = false, padding = 'md' }) {
  const padCls =
    padding === 'none' ? '' :
    padding === 'sm'   ? 'p-4' :
    padding === 'lg'   ? 'p-7' :
    'p-5';
  return (
    <div className={`${hoverable ? cls.cardHover : cls.card} ${padCls} ${className}`}>
      {children}
    </div>
  );
}

/* Modal shell — Overlay + box */
export function Modal({ open, onClose, size = 'lg', children }) {
  if (!open) return null;
  const sizeCls =
    size === 'sm' ? 'max-w-md' :
    size === 'md' ? 'max-w-lg' :
    size === 'xl' ? 'max-w-3xl' :
    size === '2xl' ? 'max-w-5xl' :
    'max-w-2xl';
  return (
    <div className={cls.modalOverlay} onClick={onClose}>
      <div className={`${cls.modalShell} ${sizeCls}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ModalHeader — title + subtitle + close button + optional icon */
export function ModalHeader({ icon: Icon, title, subtitle, onClose }) {
  return (
    <div className="px-7 py-5 flex items-start justify-between border-b border-slate-100 shrink-0">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
        )}
        <div>
          <h3 className="text-[17px] font-semibold text-slate-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-[12.5px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors focus:outline-none"
          aria-label="ปิด"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ModalBody — scrollable body */
export function ModalBody({ children, className = '' }) {
  return <div className={`px-7 py-6 overflow-y-auto flex-1 ${className}`}>{children}</div>;
}

/* ModalFooter — actions row */
export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`px-7 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2.5 shrink-0 ${className}`}>
      {children}
    </div>
  );
}

/* Badge — colored pill (kind: success/warning/danger/info/neutral) */
const BADGE_CLS = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger:  'bg-rose-50 text-rose-700 ring-rose-200',
  info:    'bg-blue-50 text-blue-700 ring-blue-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  brand:   'bg-[#E8EFF8] text-[#1E487A] ring-[#1E487A]/20',
};
export function Badge({ kind = 'neutral', dot = false, children, className = '' }) {
  return (
    <span className={`${cls.badge} ${BADGE_CLS[kind] || BADGE_CLS.neutral} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

/* PageHeader — common page title block (under TopHeader) */
export function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
        )}
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
