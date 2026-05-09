import React from 'react';

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
          <th className="px-4 py-4 text-center">
            <input 
              type="checkbox" 
              className="w-4 h-4 cursor-pointer" 
              checked={currentData.length > 0 && selectedOfficeSupplyIds?.length === currentData.length} 
              onChange={handleSelectAllOfficeSupplies} 
            />
          </th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs">ชื่ออุปกรณ์</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs">ประเภท</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">สต็อกคงเหลือ</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
            <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox" 
                className="w-4 h-4 cursor-pointer" 
                checked={selectedOfficeSupplyIds?.includes(item.id) || false} 
                onChange={(e) => handleSelectOfficeSupply(e, item.id)} 
              />
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0 shadow-inner border border-slate-200">📎</div>
                )}
                <div className="font-bold text-slate-800">{item.name}</div>
              </div>
            </td>
            <td className="px-5 py-4">
              <span className="bg-slate-100 text-slate-600 text-[11px] px-3 py-1.5 rounded-lg font-bold border border-slate-200">
                {item.type}
              </span>
            </td>
            <td className="px-5 py-4 text-center">
              {Number(item.quantity) <= 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-black text-red-600 text-xl">{item.quantity} <span className="text-xs text-slate-500 font-medium">{item.unit}</span></span>
                  <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-md font-bold shadow-sm whitespace-nowrap">หมดสต็อก</span>
                </div>
              ) : Number(item.quantity) <= 5 ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-black text-amber-500 text-xl">{item.quantity} <span className="text-xs text-slate-500 font-medium">{item.unit}</span></span>
                  <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-md font-bold shadow-sm whitespace-nowrap">ใกล้หมด</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-black text-teal-600 text-xl">{item.quantity} <span className="text-xs text-slate-500 font-medium">{item.unit}</span></span>
                  <span className="text-[10px] bg-teal-50 text-teal-600 border border-teal-200 px-2 py-0.5 rounded-md font-bold shadow-sm whitespace-nowrap">ปกติ</span>
                </div>
              )}
            </td>
            <td className="px-5 py-4 text-center space-x-2">
              <button 
                onClick={() => openEditAssetModal(item, activeMenu)} 
                className="inline-flex items-center justify-center w-8 h-8 text-amber-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-all shadow-sm" 
                title="แก้ไข"
              >
                ✏️
              </button>
              <button 
                onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: activeMenu })} 
                className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-white hover:bg-red-50 border border-slate-300 rounded-lg transition-all shadow-sm" 
                title="ลบ"
              >
                🗑️
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}