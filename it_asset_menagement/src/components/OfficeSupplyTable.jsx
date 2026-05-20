import React from 'react';
import { Pencil, Trash2, Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

/* ─── Stock config ───────────────────────────────────────── */
function getStockMeta(qty) {
  if (qty <= 0)  return { kind: 'out',    bar: 'bg-rose-400',    barW: 'w-0',    num: 'text-rose-600',   badge: 'bg-rose-50 text-rose-700 ring-rose-200',     label: 'หมดสต็อก', icon: XCircle,       accent: 'border-rose-400'   };
  if (qty <= 5)  return { kind: 'low',    bar: 'bg-amber-400',   barW: 'w-1/4',  num: 'text-amber-600',  badge: 'bg-amber-50 text-amber-700 ring-amber-200',   label: 'ใกล้หมด',  icon: AlertTriangle, accent: 'border-amber-400'  };
  if (qty <= 20) return { kind: 'medium', bar: 'bg-blue-400',    barW: 'w-1/2',  num: 'text-[#1E487A]',  badge: 'bg-blue-50 text-blue-700 ring-blue-200',      label: 'พอใช้',    icon: CheckCircle,   accent: 'border-blue-400'   };
  return          { kind: 'normal', bar: 'bg-emerald-400', barW: 'w-full', num: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: 'เพียงพอ',  icon: CheckCircle,   accent: 'border-emerald-400' };
}

/* ─── Main Table ─────────────────────────────────────────── */
export default function OfficeSupplyTable({
  currentData,
  selectedOfficeSupplyIds,
  handleSelectAllOfficeSupplies,
  handleSelectOfficeSupply,
  openEditAssetModal,
  setConfirmDeleteModal,
  activeMenu,
}) {
  const allSelected = currentData.length > 0 && selectedOfficeSupplyIds?.length === currentData.length;

  return (
    <table className="min-w-full border-collapse w-full">

      {/* ── thead ── */}
      <thead className="sticky top-0 z-10">
        <tr className="bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
          <th className="px-4 py-3.5 w-10 text-center">
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
              checked={allSelected}
              onChange={handleSelectAllOfficeSupplies}
            />
          </th>
          <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            อุปกรณ์
          </th>
          <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest hidden sm:table-cell">
            ประเภท
          </th>
          <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            สต็อกคงเหลือ
          </th>
          <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest hidden md:table-cell">
            สถานะ
          </th>
          <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            จัดการ
          </th>
        </tr>
      </thead>

      {/* ── tbody ── */}
      <tbody className="bg-white divide-y divide-slate-100">
        {currentData.map((item) => {
          const qty  = Number(item.quantity);
          const meta = getStockMeta(qty);
          const StatusIcon = meta.icon;
          const isSelected = selectedOfficeSupplyIds?.includes(item.id);

          return (
            <tr
              key={item.id}
              className={`group transition-all duration-150 ${
                isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'
              }`}
            >
              {/* ── checkbox ── */}
              <td
                className="px-4 py-0 text-center w-10 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-all duration-200 ${
                  isSelected ? 'bg-[#1E487A]' : `${meta.accent} opacity-0 group-hover:opacity-100`
                }`} />
                <input
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
                  checked={isSelected || false}
                  onChange={(e) => handleSelectOfficeSupply(e, item.id)}
                />
              </td>

              {/* ── name + image ── */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  {/* image or icon */}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0 shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-inset"
                      style={{
                        background: `${BRAND.primary}10`,
                        color: BRAND.primary,
                        ringColor: `${BRAND.primary}20`,
                      }}
                    >
                      <Package className="h-[18px] w-[18px]" strokeWidth={1.7} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-semibold text-[13.5px] text-slate-800 group-hover:text-[#1E487A] transition-colors truncate">
                      {item.name}
                    </p>
                    {/* type (mobile fallback) */}
                    <p className="text-[11px] text-slate-400 mt-0.5 sm:hidden">
                      {item.type || '—'}
                    </p>
                  </div>
                </div>
              </td>

              {/* ── type ── */}
              <td className="px-4 py-3.5 hidden sm:table-cell">
                <span className="inline-flex items-center bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-full font-medium ring-1 ring-inset ring-slate-200">
                  {item.type || '—'}
                </span>
              </td>

              {/* ── stock ── */}
              <td className="px-4 py-3.5 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  {/* number */}
                  <div className="flex items-baseline gap-1">
                    <span className={`font-black text-[20px] tabular-nums leading-none ${meta.num}`}>
                      {item.quantity}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.unit || 'ชิ้น'}
                    </span>
                  </div>

                  {/* mini progress bar */}
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${meta.bar} ${meta.barW}`} />
                  </div>
                </div>
              </td>

              {/* ── status badge ── */}
              <td className="px-4 py-3.5 text-center hidden md:table-cell">
                <span className={`inline-flex items-center gap-1.5 text-[11.5px] px-3 py-1.5 rounded-full font-semibold ring-1 ring-inset ${meta.badge}`}>
                  <StatusIcon className="h-3 w-3" strokeWidth={2.2} />
                  {meta.label}
                </span>
              </td>

              {/* ── actions ── */}
              <td className="px-4 py-3.5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <ActionBtn
                    onClick={() => openEditAssetModal(item, activeMenu)}
                    title="แก้ไข"
                    kind="edit"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                  </ActionBtn>
                  <ActionBtn
                    onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: activeMenu })}
                    title="ลบ"
                    kind="delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </ActionBtn>
                </div>
              </td>
            </tr>
          );
        })}

        {/* empty state inside tbody */}
        {currentData.length === 0 && (
          <tr>
            <td colSpan={6} className="py-20 text-center">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
                >
                  <Package className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <p className="font-semibold text-slate-500 text-[14px]">ไม่พบรายการอุปกรณ์</p>
                <p className="text-[12px] text-slate-400">ลองค้นหาด้วยคำอื่น หรือเพิ่มอุปกรณ์ใหม่</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/* ─── Action Button ──────────────────────────────────────── */
function ActionBtn({ onClick, title, children, kind }) {
  const styles = {
    edit:   'text-amber-500 hover:bg-amber-50 hover:text-amber-600 hover:ring-amber-300',
    delete: 'text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:ring-rose-300',
  }[kind];

  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-8 h-8 bg-white ring-1 ring-inset ring-slate-200 rounded-xl transition-all active:scale-95 ${styles}`}
    >
      {children}
    </button>
  );
}
