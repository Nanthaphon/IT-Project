import React from 'react';

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
  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <tr>
          <th className="px-4 py-4 text-center">
            <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={currentData.length > 0 && selectedAccessoryIds?.length === currentData.length} onChange={handleSelectAllAccessories} />
          </th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs">ชื่ออุปกรณ์</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs">ประเภท</th>
          <th className="px-5 py-4 font-bold text-slate-800 text-xs text-center bg-slate-100/50">
            รวมทั้งหมดในระบบ <span className="text-sm ml-1 text-teal-600">({currentData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)})</span>
          </th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">
            คงเหลือ <span className="text-sm ml-1 text-emerald-600">({currentData.reduce((sum, item) => sum + (Number(item.quantity || 0) - (item.assignees?.length || 0) - Number(item.brokenQuantity || 0)), 0)})</span>
          </th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">
            ใช้งานไป <span className="text-sm ml-1 text-amber-600">({currentData.reduce((sum, item) => sum + (item.assignees?.length || 0), 0)})</span>
          </th>
          <th className="px-5 py-4 font-bold text-red-500 text-xs text-center">
            ชำรุด/พัง <span className="text-sm ml-1">({currentData.reduce((sum, item) => sum + (Number(item.brokenQuantity) || 0), 0)})</span>
          </th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
            <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={selectedAccessoryIds?.includes(item.id) || false} onChange={(e) => handleSelectAccessory(e, item.id)} />
            </td>
            <td className="px-5 py-4">
              <button onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory('accessories'); }} className="text-left flex items-center gap-3 group">
                {item.image ? <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm" /> : <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0 shadow-inner border border-slate-200">🖱️</div>}
                <div className="font-bold text-slate-800 group-hover:text-teal-600">{item.name}</div>
              </button>
            </td>
            <td className="px-5 py-4"><span className="bg-slate-100 text-slate-600 text-[11px] px-3 py-1.5 rounded-lg font-bold border border-slate-200">{item.type}</span></td>
            <td className="px-5 py-4 text-sm font-black text-slate-800 text-center bg-slate-100/50">{item.quantity || 0}</td>
            <td className="px-5 py-4 text-sm font-bold text-slate-700 text-center bg-slate-50/50">{item.quantity ? (Number(item.quantity) - (item.assignees?.length || 0) - Number(item.brokenQuantity || 0)) : 0}</td>
            <td className="px-5 py-4 text-sm font-bold text-teal-600 text-center">{item.assignees?.length || 0}</td>
            <td className="px-5 py-4 text-sm font-bold text-red-500 text-center">{item.brokenQuantity || 0}</td>
            <td className="px-5 py-4 text-center space-x-2">
              <button onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: 'accessories' })} className="px-3 py-1.5 bg-white text-teal-600 border border-slate-300 hover:bg-teal-50 hover:border-teal-300 rounded-lg font-semibold transition-all text-xs shadow-sm" title="เบิกจ่าย">เบิกจ่าย</button>
              <button onClick={() => openEditAssetModal(item, 'accessories')} className="inline-flex items-center justify-center w-8 h-8 text-amber-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-all shadow-sm" title="แก้ไข">✏️</button>
              <button onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'accessories' })} className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-white hover:bg-red-50 border border-slate-300 rounded-lg transition-all shadow-sm" title="ลบ">🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}