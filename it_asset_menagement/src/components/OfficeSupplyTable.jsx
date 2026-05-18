import React from 'react';
import { Pencil, Trash2, Package } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

const TH = 'px-5 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-[0.08em]';
const TD = 'px-5 py-3.5';

export default function OfficeSupplyTable({
  currentData,
  selectedOfficeSupplyIds,
  handleSelectAllOfficeSupplies,
  handleSelectOfficeSupply,
  openEditAssetModal,
  setConfirmDeleteModal,
  activeMenu,
}) {
  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
        <tr>
          <th className="px-4 py-3 text-center w-10">
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
              checked={currentData.length > 0 && selectedOfficeSupplyIds?.length === currentData.length}
              onChange={handleSelectAllOfficeSupplies}
            />
          </th>
          <th className={TH}>ชื่ออุปกรณ์</th>
          <th className={TH}>ประเภท</th>
          <th className={`${TH} text-center`}>สต็อกคงเหลือ</th>
          <th className={`${TH} text-center`}>จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-[13.5px] bg-white">
        {currentData.map((item) => {
          const qty = Number(item.quantity);
          const stockKind = qty <= 0 ? 'out' : qty <= 5 ? 'low' : 'normal';
          const stockMeta = {
            out:    { num: 'text-rose-600',  badge: 'bg-rose-50 text-rose-700 ring-rose-200',  label: 'หมดสต็อก' },
            low:    { num: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 ring-amber-200',label: 'ใกล้หมด' },
            normal: { num: 'text-[#1E487A]', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: 'ปกติ' },
          }[stockKind];

          return (
            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
              <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
                  checked={selectedOfficeSupplyIds?.includes(item.id) || false}
                  onChange={(e) => handleSelectOfficeSupply(e, item.id)}
                />
              </td>
              <td className={TD}>
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
                    >
                      <Package className="h-4 w-4" strokeWidth={1.7} />
                    </div>
                  )}
                  <span className="font-medium text-slate-800 group-hover:text-[#1E487A] transition-colors">{item.name}</span>
                </div>
              </td>
              <td className={TD}>
                <span className="inline-flex items-center bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-full font-medium ring-1 ring-inset ring-slate-200">
                  {item.type}
                </span>
              </td>
              <td className={`${TD} text-center`}>
                <div className="flex flex-col items-center gap-1">
                  <span className={`font-bold text-[17px] tabular-nums ${stockMeta.num}`}>
                    {item.quantity}
                    <span className="text-[11px] text-slate-500 font-normal ml-1">{item.unit}</span>
                  </span>
                  <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-semibold ring-1 ring-inset ${stockMeta.badge}`}>
                    {stockMeta.label}
                  </span>
                </div>
              </td>
              <td className={`${TD} text-center`}>
                <div className="flex items-center justify-center gap-1.5">
                  <IconBtn onClick={() => openEditAssetModal(item, activeMenu)} title="แก้ไข" kind="warning">
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                  </IconBtn>
                  <IconBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: activeMenu })} title="ลบ" kind="danger">
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </IconBtn>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function IconBtn({ onClick, title, children, kind }) {
  const map = {
    warning: 'text-amber-600 hover:bg-amber-50 hover:ring-amber-300',
    danger:  'text-rose-500 hover:bg-rose-50 hover:ring-rose-300',
  }[kind];
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 bg-white ring-1 ring-inset ring-slate-200 rounded-lg transition-colors ${map}`}
    >
      {children}
    </button>
  );
}
