import React from 'react';

export default function LicenseTable({
  currentData,
  setSelectedAssetDetail,
  setSelectedAssetCategory,
  checkLicenseExpiration,
  setCheckoutModal,
  handleCheckin,
  openEditLicenseModal,
  setConfirmDeleteModal
}) {
  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <tr>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">ชื่อโปรแกรม</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Product Key</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">วันหมดอายุ</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">ราคา</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">สถานะ</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group bg-white">
            <td className="px-5 py-4">
              <button 
                onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory('licenses'); }} 
                className="text-left font-bold text-slate-800 group-hover:text-[#1E487A] transition-colors"
              >
                {item.name}
              </button>
            </td>
            <td className="px-5 py-4 text-slate-600">
              <div className="text-sm font-bold font-mono bg-slate-100 px-3 py-1.5 rounded-lg w-fit border border-slate-200">
                {item.productKey || '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {item.keyCode || '-'}
              </div>
            </td>
            <td className="px-5 py-4 text-sm text-slate-600">
              <div className="flex flex-col gap-1 items-start">
                <span className="font-medium text-slate-700">{item.expirationDate || '-'}</span>
                {(() => {
                  const expStatus = checkLicenseExpiration(item.expirationDate);
                  return expStatus.isExpiring ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm ${expStatus.colorClass}`}>
                      ⚠️ {expStatus.statusText}
                    </span>
                  ) : null;
                })()}
              </div>
            </td>
            <td className="px-5 py-4 text-sm font-bold text-slate-700">
              {item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}
            </td>
            <td className="px-5 py-4">
              {!item.status || item.status === 'พร้อมใช้งาน' ? (
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex border border-emerald-200 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> พร้อมใช้งาน
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex border border-amber-200 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> {item.status}
                </div>
              )}
            </td>
            <td className="px-5 py-4 text-center space-x-2">
              {!item.status || item.status === 'พร้อมใช้งาน' ? (
                <button 
                  onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: 'licenses' })} 
                  className="px-3 py-1.5 bg-white text-[#1E487A] border border-[#1E487A]/30 hover:bg-[#1E487A] hover:text-white rounded-lg font-semibold transition-all text-xs shadow-sm" 
                  title="เบิกจ่าย"
                >
                  เบิกจ่าย
                </button>
              ) : item.status === 'ถูกใช้งาน' ? (
                <button 
                  onClick={() => handleCheckin(item.id, 'licenses')} 
                  className="px-3 py-1.5 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white rounded-lg font-semibold transition-all text-xs shadow-sm" 
                  title="รับคืน"
                >
                  รับคืน
                </button>
              ) : null}
              <button 
                onClick={() => openEditLicenseModal(item)} 
                className="inline-flex items-center justify-center w-8 h-8 text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-all shadow-sm" 
                title="แก้ไข"
              >
                ✏️
              </button>
              <button 
                onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'licenses' })} 
                className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg transition-all shadow-sm" 
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