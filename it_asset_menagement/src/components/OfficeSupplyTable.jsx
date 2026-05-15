import React from 'react';

function IconEdit() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IconSupply() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

export default function OfficeSupplyTable({
  currentData,
  selectedOfficeSupplyIds,
  handleSelectAllOfficeSupplies,
  handleSelectOfficeSupply,
  openEditAssetModal,
  setConfirmDeleteModal,
  activeMenu
}) {
  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3.5 text-center">
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
              checked={currentData.length > 0 && selectedOfficeSupplyIds?.length === currentData.length}
              onChange={handleSelectAllOfficeSupplies}
            />
          </th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ชื่ออุปกรณ์</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ประเภท</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">สต็อกคงเหลือ</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group bg-white">
            <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
                checked={selectedOfficeSupplyIds?.includes(item.id) || false}
                onChange={(e) => handleSelectOfficeSupply(e, item.id)}
              />
            </td>
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200 text-slate-400 group-hover:bg-[#1E487A]/10 group-hover:text-[#1E487A] transition-colors">
                    <IconSupply />
                  </div>
                )}
                <span className="font-semibold text-slate-800 group-hover:text-[#1E487A] transition-colors">{item.name}</span>
              </div>
            </td>
            <td className="px-5 py-3.5">
              <span className="bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-md font-semibold border border-slate-200">
                {item.type}
              </span>
            </td>
            <td className="px-5 py-3.5 text-center">
              {Number(item.quantity) <= 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-bold text-red-600 text-lg">{item.quantity} <span className="text-xs text-slate-500 font-normal">{item.unit}</span></span>
                  <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded font-semibold whitespace-nowrap">หมดสต็อก</span>
                </div>
              ) : Number(item.quantity) <= 5 ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-bold text-amber-500 text-lg">{item.quantity} <span className="text-xs text-slate-500 font-normal">{item.unit}</span></span>
                  <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded font-semibold whitespace-nowrap">ใกล้หมด</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-bold text-[#1E487A] text-lg">{item.quantity} <span className="text-xs text-slate-500 font-normal">{item.unit}</span></span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded font-semibold whitespace-nowrap">ปกติ</span>
                </div>
              )}
            </td>
            <td className="px-5 py-3.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={() => openEditAssetModal(item, activeMenu)}
                  className="inline-flex items-center justify-center w-7 h-7 text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-md transition-all"
                  title="แก้ไข"
                >
                  <IconEdit />
                </button>
                <button
                  onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: activeMenu })}
                  className="inline-flex items-center justify-center w-7 h-7 text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-md transition-all"
                  title="ลบ"
                >
                  <IconTrash />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
