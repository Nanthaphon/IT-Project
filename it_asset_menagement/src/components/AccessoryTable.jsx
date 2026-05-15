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
function IconMouse() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

export default function AccessoryTable({
  currentData,
  selectedAccessoryIds,
  handleSelectAllAccessories,
  handleSelectAccessory,
  setSelectedAssetDetail,
  setSelectedAssetCategory,
  setCheckoutModal,
  openEditAssetModal,
  setConfirmDeleteModal
}) {
  const totalQty    = currentData.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const totalRemain = currentData.reduce((s, i) => s + (Number(i.quantity || 0) - (i.assignees?.length || 0) - Number(i.brokenQuantity || 0)), 0);
  const totalUsed   = currentData.reduce((s, i) => s + (i.assignees?.length || 0), 0);
  const totalBroken = currentData.reduce((s, i) => s + (Number(i.brokenQuantity) || 0), 0);

  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3.5 text-center">
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
              checked={currentData.length > 0 && selectedAccessoryIds?.length === currentData.length}
              onChange={handleSelectAllAccessories}
            />
          </th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ชื่ออุปกรณ์</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ประเภท</th>
          <th className="px-5 py-3.5 font-semibold text-slate-700 text-xs text-center bg-slate-100/60 border-l border-r border-slate-100">
            รวมทั้งหมด <span className="text-[#1E487A] ml-1">({totalQty})</span>
          </th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs text-center">
            คงเหลือ <span className="text-emerald-600 ml-1">({totalRemain})</span>
          </th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs text-center">
            ใช้งานไป <span className="text-amber-500 ml-1">({totalUsed})</span>
          </th>
          <th className="px-5 py-3.5 font-semibold text-red-400 text-xs text-center">
            ชำรุด/พัง <span className="ml-1">({totalBroken})</span>
          </th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center border-l border-slate-100">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {currentData.map((item) => {
          const remain = Number(item.quantity || 0) - (item.assignees?.length || 0) - Number(item.brokenQuantity || 0);
          return (
            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group bg-white">
              <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
                  checked={selectedAccessoryIds?.includes(item.id) || false}
                  onChange={(e) => handleSelectAccessory(e, item.id)}
                />
              </td>
              <td className="px-5 py-3.5">
                <button onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory('accessories'); }} className="text-left flex items-center gap-3 group/link">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200 text-slate-400 group-hover/link:bg-[#1E487A]/10 group-hover/link:text-[#1E487A] transition-colors">
                      <IconMouse />
                    </div>
                  )}
                  <span className="font-semibold text-slate-800 group-hover/link:text-[#1E487A] transition-colors">{item.name}</span>
                </button>
              </td>
              <td className="px-5 py-3.5">
                <span className="bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-md font-semibold border border-slate-200">
                  {item.type}
                </span>
              </td>
              <td className="px-5 py-3.5 font-bold text-slate-800 text-center bg-slate-50/50 border-l border-r border-slate-100">
                {item.quantity || 0}
              </td>
              <td className="px-5 py-3.5 font-semibold text-emerald-600 text-center">{remain}</td>
              <td className="px-5 py-3.5 font-semibold text-amber-500 text-center">{item.assignees?.length || 0}</td>
              <td className="px-5 py-3.5 font-semibold text-red-500 text-center">{item.brokenQuantity || 0}</td>
              <td className="px-5 py-3.5 text-center border-l border-slate-100">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: 'accessories' })}
                    className="px-2.5 py-1.5 bg-white text-[#1E487A] border border-[#1E487A]/30 hover:bg-[#1E487A] hover:text-white rounded-md font-semibold transition-all text-xs"
                    title="เบิกจ่าย"
                  >
                    เบิกจ่าย
                  </button>
                  <button
                    onClick={() => openEditAssetModal(item, 'accessories')}
                    className="inline-flex items-center justify-center w-7 h-7 text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-md transition-all"
                    title="แก้ไข"
                  >
                    <IconEdit />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'accessories' })}
                    className="inline-flex items-center justify-center w-7 h-7 text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-md transition-all"
                    title="ลบ"
                  >
                    <IconTrash />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
