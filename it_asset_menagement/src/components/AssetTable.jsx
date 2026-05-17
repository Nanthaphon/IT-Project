import React from 'react';

/* ── SVG icon helpers ── */
function IconEdit() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
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
function IconMonitor() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

export default function AssetTable({
  currentData,
  setSelectedAssetDetail,
  setSelectedAssetCategory,
  setCheckoutModal,
  setReturnModal,
  openEditAssetModal,
  setConfirmDeleteModal,
  visibleAssetColumns
}) {
  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <tr>
          {visibleAssetColumns.name && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ชื่ออุปกรณ์</th>}
          {visibleAssetColumns.type && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ประเภท</th>}
          {visibleAssetColumns.department && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">แผนก</th>}
          {visibleAssetColumns.assetTag && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">รหัสทรัพย์สิน</th>}
          {visibleAssetColumns.sn && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Serial Number</th>}
          {visibleAssetColumns.model && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ยี่ห้อ/รุ่น</th>}
          {visibleAssetColumns.vendor && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ผู้จัดจำหน่าย</th>}
          {visibleAssetColumns.company && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">บริษัท</th>}
          {visibleAssetColumns.purchaseDate && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">วันที่ซื้อ</th>}
          {visibleAssetColumns.warrantyDate && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">หมด Warranty</th>}
          {visibleAssetColumns.cost && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ราคา</th>}
          {visibleAssetColumns.assignedName && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">ผู้ครอบครอง</th>}
          {visibleAssetColumns.status && <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">สถานะ</th>}
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group bg-white">
            {visibleAssetColumns.name && (
              <td className="px-5 py-3.5">
                <button onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory('assets'); }} className="text-left flex items-center gap-3 group/link">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200 text-slate-400 group-hover/link:bg-[#1E487A]/10 group-hover/link:text-[#1E487A] transition-colors">
                      <IconMonitor />
                    </div>
                  )}
                  <span className="font-semibold text-slate-800 group-hover/link:text-[#1E487A] transition-colors">{item.name}</span>
                </button>
              </td>
            )}

            {visibleAssetColumns.type && (
              <td className="px-5 py-3.5">
                <span className="bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-md font-semibold border border-slate-200">
                  {item.type}
                </span>
              </td>
            )}

            {visibleAssetColumns.department && <td className="px-5 py-3.5 text-center font-semibold text-slate-700">{item.department || '-'}</td>}
            {visibleAssetColumns.assetTag && <td className="px-5 py-3.5 font-mono text-slate-600 text-xs">{item.assetTag || '-'}</td>}
            {visibleAssetColumns.sn && <td className="px-5 py-3.5 font-mono text-slate-600 text-xs">{item.sn || '-'}</td>}
            {visibleAssetColumns.model && <td className="px-5 py-3.5 text-slate-700">{item.model || '-'}</td>}
            {visibleAssetColumns.vendor && <td className="px-5 py-3.5 text-slate-700">{item.vendor || '-'}</td>}
            {visibleAssetColumns.company && <td className="px-5 py-3.5 text-slate-700">{item.company || '-'}</td>}
            {visibleAssetColumns.purchaseDate && <td className="px-5 py-3.5 text-slate-600">{item.purchaseDate || '-'}</td>}
            {visibleAssetColumns.warrantyDate && <td className="px-5 py-3.5 text-slate-600">{item.warrantyDate || '-'}</td>}
            {visibleAssetColumns.cost && <td className="px-5 py-3.5 font-semibold text-slate-700">{item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}</td>}

            {visibleAssetColumns.assignedName && (
              <td className="px-5 py-3.5 text-center font-semibold text-[#1E487A]">{item.assignedName || '-'}</td>
            )}

            {visibleAssetColumns.status && (
              <td className="px-5 py-3.5 text-center">
                {(!item.status || item.status === 'พร้อมใช้งาน') ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    พร้อมใช้งาน
                  </span>
                ) : item.status === 'ถูกใช้งาน' ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-[#1E487A] px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1E487A]" />
                      ถูกใช้งาน
                    </span>
                    {item.assignedName && !visibleAssetColumns.assignedName && (
                      <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <IconUser /> {item.assignedName}
                      </span>
                    )}
                  </div>
                ) : item.status === 'ชำรุดเสียหาย' ? (
                  <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    ชำรุดเสียหาย
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {item.status}
                  </span>
                )}
              </td>
            )}

            <td className="px-5 py-3.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                {(!item.status || item.status === 'พร้อมใช้งาน') ? (
                  <button
                    onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: 'assets' })}
                    className="px-2.5 py-1.5 bg-white text-[#1E487A] border border-[#1E487A]/30 hover:bg-[#1E487A] hover:text-white rounded-md font-semibold transition-all text-xs"
                    title="เบิกจ่าย"
                  >
                    เบิกจ่าย
                  </button>
                ) : item.status === 'ถูกใช้งาน' ? (
                  <button
                    onClick={() => setReturnModal({ isOpen: true, assetId: item.id, collectionName: 'assets', empId: item.assignedTo, empName: item.assignedName, assetName: item.name })}
                    className="px-2.5 py-1.5 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white rounded-md font-semibold transition-all text-xs"
                    title="รับคืน"
                  >
                    รับคืน
                  </button>
                ) : null}
                <button
                  onClick={() => openEditAssetModal(item, 'assets')}
                  className="inline-flex items-center justify-center w-7 h-7 text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-md transition-all"
                  title="แก้ไข"
                >
                  <IconEdit />
                </button>
                <button
                  onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'assets' })}
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
