import React from 'react';

export default function AssetTable({
  currentData,
  setSelectedAssetDetail,
  setSelectedAssetCategory,
  setCheckoutModal,
  handleCheckin,
  openEditAssetModal,
  setConfirmDeleteModal,
  visibleAssetColumns // รับ State ควบคุมการแสดงคอลัมน์
}) {
  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <tr>
          {/* เลือกแสดงผล <th> ตาม State ที่ส่งมา */}
          {visibleAssetColumns.name && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">ชื่ออุปกรณ์</th>}
          {visibleAssetColumns.type && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">ประเภท</th>}
          {visibleAssetColumns.department && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">แผนก</th>}
          {visibleAssetColumns.assetTag && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">รหัสทรัพย์สิน</th>}
          {visibleAssetColumns.sn && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Serial Number</th>}
          {visibleAssetColumns.model && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">ยี่ห้อ/รุ่น</th>}
          {visibleAssetColumns.vendor && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">ผู้จัดจำหน่าย</th>}
          {visibleAssetColumns.company && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">บริษัท</th>}
          {visibleAssetColumns.purchaseDate && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">วันที่ซื้อ</th>}
          {visibleAssetColumns.warrantyDate && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">หมด Warranty</th>}
          {visibleAssetColumns.cost && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">ราคา</th>}
          {visibleAssetColumns.assignedName && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">ผู้ครอบครอง</th>}
          {visibleAssetColumns.status && <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">สถานะ</th>}
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group bg-white">
            {visibleAssetColumns.name && (
              <td className="px-5 py-4">
                <button onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory('assets'); }} className="text-left flex items-center gap-3 group/link">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shrink-0 border border-slate-200 text-slate-400 group-hover/link:bg-[#1E487A]/10 group-hover/link:text-[#1E487A] transition-colors">🖥️</div>
                  )}
                  <div className="font-bold text-slate-800 group-hover/link:text-[#1E487A] transition-colors">{item.name}</div>
                </button>
              </td>
            )}
            
            {visibleAssetColumns.type && (
              <td className="px-5 py-4">
                <span className="bg-slate-100 text-slate-600 text-[11px] px-3 py-1.5 rounded-lg font-bold border border-slate-200">
                  {item.type}
                </span>
              </td>
            )}
            
            {visibleAssetColumns.department && <td className="px-5 py-4 text-center font-bold text-slate-700">{item.department || '-'}</td>}
            {visibleAssetColumns.assetTag && <td className="px-5 py-4 font-mono text-slate-600">{item.assetTag || '-'}</td>}
            {visibleAssetColumns.sn && <td className="px-5 py-4 font-mono text-slate-600">{item.sn || '-'}</td>}
            {visibleAssetColumns.model && <td className="px-5 py-4 text-slate-700">{item.model || '-'}</td>}
            {visibleAssetColumns.vendor && <td className="px-5 py-4 text-slate-700">{item.vendor || '-'}</td>}
            {visibleAssetColumns.company && <td className="px-5 py-4 text-slate-700">{item.company || '-'}</td>}
            {visibleAssetColumns.purchaseDate && <td className="px-5 py-4 text-slate-700">{item.purchaseDate || '-'}</td>}
            {visibleAssetColumns.warrantyDate && <td className="px-5 py-4 text-slate-700">{item.warrantyDate || '-'}</td>}
            {visibleAssetColumns.cost && <td className="px-5 py-4 font-bold text-slate-700">{item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}</td>}
            
            {visibleAssetColumns.assignedName && (
              <td className="px-5 py-4 text-center font-bold text-[#1E487A]">{item.assignedName || '-'}</td>
            )}

            {visibleAssetColumns.status && (
              <td className="px-5 py-4 text-center">
                {(!item.status || item.status === 'พร้อมใช้งาน') ? (
                  <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex border border-emerald-200 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span> พร้อมใช้งาน
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex border border-amber-200 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span> {item.status}
                    </div>
                    {item.assignedName && !visibleAssetColumns.assignedName && <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">👤 {item.assignedName}</span>}
                  </div>
                )}
              </td>
            )}

            <td className="px-5 py-4 text-center space-x-2 border-l border-slate-50">
              {(!item.status || item.status === 'พร้อมใช้งาน') ? (
                <button onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: 'assets' })} className="px-3 py-1.5 bg-white text-[#1E487A] border border-[#1E487A]/30 hover:bg-[#1E487A] hover:text-white rounded-lg font-semibold transition-all text-xs shadow-sm" title="เบิกจ่าย">เบิกจ่าย</button>
              ) : item.status === 'ถูกใช้งาน' ? (
                <button onClick={() => handleCheckin(item.id, 'assets')} className="px-3 py-1.5 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white rounded-lg font-semibold transition-all text-xs shadow-sm" title="รับคืน">รับคืน</button>
              ) : null}
              <button onClick={() => openEditAssetModal(item, 'assets')} className="inline-flex items-center justify-center w-8 h-8 text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-all shadow-sm" title="แก้ไข">✏️</button>
              <button onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'assets' })} className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg transition-all shadow-sm" title="ลบ">🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}