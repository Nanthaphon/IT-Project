import React from 'react';
import { Pencil, Trash2, Mouse, LogIn } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

const TH = 'px-5 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-[0.08em]';
const TD = 'px-5 py-3.5';

export default function AccessoryTable({
  currentData,
  selectedAccessoryIds,
  handleSelectAllAccessories,
  handleSelectAccessory,
  setSelectedAssetDetail,
  setSelectedAssetCategory,
  setCheckoutModal,
  openEditAssetModal,
  setConfirmDeleteModal,
}) {
  const totalQty    = currentData.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const totalRemain = currentData.reduce((s, i) => s + (Number(i.quantity || 0) - (i.assignees?.length || 0) - Number(i.brokenQuantity || 0)), 0);
  const totalUsed   = currentData.reduce((s, i) => s + (i.assignees?.length || 0), 0);
  const totalBroken = currentData.reduce((s, i) => s + (Number(i.brokenQuantity) || 0), 0);

  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
        <tr>
          <th className="px-4 py-3 text-center w-10">
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
              checked={currentData.length > 0 && selectedAccessoryIds?.length === currentData.length}
              onChange={handleSelectAllAccessories}
            />
          </th>
          <th className={TH}>ชื่ออุปกรณ์</th>
          <th className={TH}>ประเภท</th>
          <th className={`px-5 py-3 font-semibold text-slate-700 text-[11px] uppercase tracking-[0.08em] text-center bg-slate-100/60`}>
            รวมทั้งหมด <span style={{ color: BRAND.primary }} className="ml-1 tabular-nums">({totalQty})</span>
          </th>
          <th className={`${TH} text-center`}>
            คงเหลือ <span className="text-emerald-600 ml-1 tabular-nums">({totalRemain})</span>
          </th>
          <th className={`${TH} text-center`}>
            ใช้งานไป <span className="text-amber-600 ml-1 tabular-nums">({totalUsed})</span>
          </th>
          <th className={`${TH} text-center`}>
            ชำรุด/พัง <span className="text-rose-500 ml-1 tabular-nums">({totalBroken})</span>
          </th>
          <th className={`${TH} text-center`}>จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-[13.5px] bg-white">
        {currentData.map((item) => {
          const remain = Number(item.quantity || 0) - (item.assignees?.length || 0) - Number(item.brokenQuantity || 0);
          const used   = item.assignees?.length || 0;
          const broken = item.brokenQuantity || 0;
          return (
            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
              <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
                  checked={selectedAccessoryIds?.includes(item.id) || false}
                  onChange={(e) => handleSelectAccessory(e, item.id)}
                />
              </td>
              <td className={TD}>
                <button
                  onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory('accessories'); }}
                  className="text-left flex items-center gap-3 group/link"
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
                    >
                      <Mouse className="h-4 w-4" strokeWidth={1.7} />
                    </div>
                  )}
                  <span className="font-medium text-slate-800 group-hover/link:text-[#1E487A] transition-colors">{item.name}</span>
                </button>
              </td>
              <td className={TD}>
                <span className="inline-flex items-center bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-full font-medium ring-1 ring-inset ring-slate-200">
                  {item.type}
                </span>
              </td>
              <td className="px-5 py-3.5 font-semibold text-slate-900 text-center bg-slate-50/40 tabular-nums">
                {item.quantity || 0}
              </td>
              <td className={`${TD} font-semibold text-center tabular-nums ${remain > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{remain}</td>
              <td className={`${TD} font-semibold text-center tabular-nums ${used > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{used}</td>
              <td className={`${TD} font-semibold text-center tabular-nums ${broken > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{broken}</td>
              <td className={`${TD} text-center`}>
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: 'accessories' })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white text-[#1E487A] ring-1 ring-inset ring-[#1E487A]/30 hover:bg-[#1E487A] hover:text-white hover:ring-[#1E487A] rounded-lg font-semibold transition-colors text-[11.5px]"
                    title="เบิกจ่าย"
                  >
                    <LogIn className="h-3 w-3" strokeWidth={2.2} />
                    เบิกจ่าย
                  </button>
                  <IconBtn onClick={() => openEditAssetModal(item, 'accessories')} title="แก้ไข" kind="warning">
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                  </IconBtn>
                  <IconBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'accessories' })} title="ลบ" kind="danger">
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
