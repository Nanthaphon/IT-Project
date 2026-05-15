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
function IconWarning() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

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
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ชื่อโปรแกรม</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Product Key</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">วันหมดอายุ</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ราคา</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">สถานะ</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group bg-white">
            <td className="px-5 py-3.5">
              <button
                onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory('licenses'); }}
                className="text-left font-semibold text-slate-800 group-hover:text-[#1E487A] transition-colors"
              >
                {item.name}
              </button>
            </td>
            <td className="px-5 py-3.5 text-slate-600">
              <div className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md w-fit border border-slate-200 font-semibold">
                {item.productKey || '-'}
              </div>
              {item.keyCode && <div className="text-xs text-slate-400 mt-1">{item.keyCode}</div>}
            </td>
            <td className="px-5 py-3.5 text-sm text-slate-600">
              <div className="flex flex-col gap-1 items-start">
                <span className="text-slate-700">{item.expirationDate || '-'}</span>
                {(() => {
                  const expStatus = checkLicenseExpiration(item.expirationDate);
                  return expStatus.isExpiring ? (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${expStatus.colorClass}`}>
                      <IconWarning /> {expStatus.statusText}
                    </span>
                  ) : null;
                })()}
              </div>
            </td>
            <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">
              {item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}
            </td>
            <td className="px-5 py-3.5">
              {!item.status || item.status === 'พร้อมใช้งาน' ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> พร้อมใช้งาน
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-[#1E487A] px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E487A]" /> {item.status}
                </span>
              )}
            </td>
            <td className="px-5 py-3.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                {!item.status || item.status === 'พร้อมใช้งาน' ? (
                  <button
                    onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: 'licenses' })}
                    className="px-2.5 py-1.5 bg-white text-[#1E487A] border border-[#1E487A]/30 hover:bg-[#1E487A] hover:text-white rounded-md font-semibold transition-all text-xs"
                    title="เบิกจ่าย"
                  >
                    เบิกจ่าย
                  </button>
                ) : item.status === 'ถูกใช้งาน' ? (
                  <button
                    onClick={() => handleCheckin(item.id, 'licenses')}
                    className="px-2.5 py-1.5 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white rounded-md font-semibold transition-all text-xs"
                    title="รับคืน"
                  >
                    รับคืน
                  </button>
                ) : null}
                <button
                  onClick={() => openEditLicenseModal(item)}
                  className="inline-flex items-center justify-center w-7 h-7 text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-md transition-all"
                  title="แก้ไข"
                >
                  <IconEdit />
                </button>
                <button
                  onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'licenses' })}
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
