    import React from 'react';

export default function AssetTable({
  currentData,
  setSelectedAssetDetail,
  setSelectedAssetCategory,
  setCheckoutModal,
  handleCheckin,
  openEditAssetModal,
  setConfirmDeleteModal
}) {
  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <tr>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs">ชื่ออุปกรณ์</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs">ประเภท</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">แผนก</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs">ราคา</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">สถานะ</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
            <td className="px-5 py-4">
              <button onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory('assets'); }} className="text-left flex items-center gap-3 group">
                {item.image ? <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm" /> : <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0 shadow-inner border border-slate-200">🖥️</div>}
                <div className="font-bold text-slate-800 group-hover:text-teal-600">{item.name}</div>
              </button>
            </td>
            <td className="px-5 py-4"><span className="bg-slate-100 text-slate-600 text-[11px] px-3 py-1.5 rounded-lg font-bold border border-slate-200">{item.type}</span></td>
            <td className="px-5 py-4 text-center text-sm font-bold text-slate-700">{item.department || '-'}</td>
            <td className="px-5 py-4 text-sm font-bold text-slate-700">{item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}</td>
            <td className="px-5 py-4 text-center">
              {(!item.status || item.status === 'พร้อมใช้งาน') ? (
                <div className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-md text-xs font-bold inline-flex border border-teal-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 animate-pulse"></span> พร้อมใช้งาน</div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md text-xs font-bold inline-flex border border-amber-200 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span> {item.status}</div>
                  {item.assignedName && <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">👤 {item.assignedName}</span>}
                </div>
              )}
            </td>
            <td className="px-5 py-4 text-center space-x-2">
              {(!item.status || item.status === 'พร้อมใช้งาน') ? (
                <button onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: 'assets' })} className="px-3 py-1.5 bg-white text-teal-600 border border-slate-300 hover:bg-teal-50 hover:border-teal-300 rounded-lg font-semibold transition-all text-xs shadow-sm" title="เบิกจ่าย">เบิกจ่าย</button>
              ) : item.status === 'ถูกใช้งาน' ? (
                <button onClick={() => handleCheckin(item.id, 'assets')} className="px-3 py-1.5 bg-white text-emerald-600 border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg font-semibold transition-all text-xs shadow-sm" title="รับคืน">รับคืน</button>
              ) : null}
              <button onClick={() => openEditAssetModal(item, 'assets')} className="inline-flex items-center justify-center w-8 h-8 text-amber-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-all shadow-sm" title="แก้ไข">✏️</button>
              <button onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'assets' })} className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-white hover:bg-red-50 border border-slate-300 rounded-lg transition-all shadow-sm" title="ลบ">🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}