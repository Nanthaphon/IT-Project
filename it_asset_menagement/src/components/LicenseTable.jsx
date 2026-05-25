import React from 'react';
import { Pencil, Trash2, FileText, AlertTriangle, LogIn, RotateCcw } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

const TH = 'px-5 py-3 font-semibold text-slate-500 text-[12px] uppercase tracking-[0.08em]';
const TD = 'px-5 py-3.5';

export default function LicenseTable({
  currentData,
  selectedLicenseIds,
  handleSelectAllLicenses,
  handleSelectLicense,
  setSelectedAssetDetail,
  setSelectedAssetCategory,
  checkLicenseExpiration,
  setCheckoutModal,
  handleCheckin,
  openEditLicenseModal,
  setConfirmDeleteModal,
  visibleLicenseColumns,
  canEdit,
}) {
  const col = visibleLicenseColumns || {};
  const allSelected = currentData.length > 0 && currentData.every(item => selectedLicenseIds.includes(item.id));

  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
        <tr>
          <th className="px-4 py-3 w-10">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAllLicenses}
              className="w-3.5 h-3.5 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A] cursor-pointer"
            />
          </th>
          {col.image && <th className={`${TH} w-16`}>รูป</th>}
          {col.name && <th className={TH}>ชื่อโปรแกรม</th>}
          {col.productKey && <th className={TH}>Product Key</th>}
          {col.supplier && <th className={TH}>Supplier</th>}
          {col.purchaseDate && <th className={TH}>วันที่ซื้อ</th>}
          {col.expirationDate && <th className={TH}>วันหมดอายุ</th>}
          {col.cost && <th className={`${TH} text-right`}>ราคา</th>}
          {col.quantity && <th className={`${TH} text-center`}>จำนวนสิทธิ์</th>}
          {col.status && <th className={TH}>สถานะ</th>}
          <th className={`${TH} text-center`}>จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-[14.5px] bg-white">
        {currentData.map((item) => {
          const isSelected = selectedLicenseIds.includes(item.id);
          return (
            <tr
              key={item.id}
              className={`transition-colors group ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
            >
              <td className="px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectLicense(e, item.id)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A] cursor-pointer"
                />
              </td>

              {col.image && (
                <td className={TD}>
                  {item.image ? (
                    <div className="w-10 h-10 rounded-xl bg-white ring-1 ring-slate-200 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                      <img src={item.image} alt={item.name} className="w-9 h-9 object-contain" />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
                    >
                      <FileText className="h-4 w-4" strokeWidth={1.7} />
                    </div>
                  )}
                </td>
              )}

              {col.name && (
                <td className={TD}>
                  <button
                    onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory('licenses'); }}
                    className="text-left font-medium text-slate-800 group-hover:text-[#1E487A] transition-colors"
                  >
                    {item.name}
                  </button>
                </td>
              )}

              {col.productKey && (
                <td className={TD}>
                  <div className="text-[13px] font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg w-fit ring-1 ring-inset ring-slate-200 font-semibold tracking-tight">
                    {item.productKey || '-'}
                  </div>
                  {item.keyCode && <div className="text-[12px] text-slate-400 mt-1 font-mono">{item.keyCode}</div>}
                </td>
              )}

              {col.supplier && <td className={`${TD} text-slate-600`}>{item.supplier || '-'}</td>}
              {col.purchaseDate && <td className={`${TD} text-slate-500 tabular-nums`}>{item.purchaseDate || '-'}</td>}

              {col.expirationDate && (
                <td className={`${TD} text-slate-600`}>
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-slate-700 tabular-nums">{item.expirationDate || '-'}</span>
                    {(() => {
                      const exp = checkLicenseExpiration(item.expirationDate);
                      return exp.isExpiring ? (
                        <span className={`inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${exp.colorClass}`}>
                          <AlertTriangle className="h-3 w-3" strokeWidth={2} /> {exp.statusText}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </td>
              )}

              {col.cost && (
                <td className={`${TD} text-right font-medium text-slate-700 tabular-nums`}>
                  {(() => {
                    const availTotal = (item.availableSeatCosts || []).reduce((s, c) => s + (Number(c) || 0), 0);
                    const assignedTotal = (item.assignees || []).reduce((s, a) => s + (Number(a.seatCost) || 0), 0);
                    const total = availTotal + assignedTotal;
                    return total > 0 ? `฿${total.toLocaleString()}` : (item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-');
                  })()}
                </td>
              )}

              {col.quantity && (
                <td className={`${TD} text-center`}>
                  <span className="text-[14px] font-semibold text-slate-800 tabular-nums">
                    {item.assignees?.length ?? 0}
                    <span className="text-slate-400 font-normal"> / {item.quantity ?? '-'}</span>
                  </span>
                </td>
              )}

              {col.status && (
                <td className={TD}>
                  {!item.status || item.status === 'พร้อมใช้งาน' ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[12px] font-medium ring-1 ring-inset ring-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> พร้อมใช้งาน
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-[#1E487A] px-2.5 py-1 rounded-full text-[12px] font-medium ring-1 ring-inset ring-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1E487A]" /> {item.status}
                    </span>
                  )}
                </td>
              )}

              <td className={`${TD} text-center`}>
                <div className="flex items-center justify-center gap-1.5">
                  {canEdit && (!item.status || item.status === 'พร้อมใช้งาน') ? (
                    <button
                      onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: 'licenses' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white text-[#1E487A] ring-1 ring-inset ring-[#1E487A]/30 hover:bg-[#1E487A] hover:text-white hover:ring-[#1E487A] rounded-lg font-semibold transition-colors text-[12.5px]"
                    >
                      <LogIn className="h-3 w-3" strokeWidth={2.2} /> เบิกจ่าย
                    </button>
                  ) : canEdit && item.status === 'ถูกใช้งาน' ? (
                    <button
                      onClick={() => handleCheckin(item.id, 'licenses')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white text-emerald-600 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-500 hover:text-white hover:ring-emerald-500 rounded-lg font-semibold transition-colors text-[12.5px]"
                    >
                      <RotateCcw className="h-3 w-3" strokeWidth={2.2} /> รับคืน
                    </button>
                  ) : null}
                  {canEdit && (
                    <IconBtn onClick={() => openEditLicenseModal(item)} title="แก้ไข" kind="warning">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    </IconBtn>
                  )}
                  {canEdit && (
                    <IconBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'licenses' })} title="ลบ" kind="danger">
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    </IconBtn>
                  )}
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
