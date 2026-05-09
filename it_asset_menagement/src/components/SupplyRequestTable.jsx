import React from 'react';

export default function SupplyRequestTable({
  supplyRequests,
  currentSupplyRequests,
  supplyFilterDate,
  setSupplyFilterDate,
  supplyFilterStatus,
  setSupplyFilterStatus,
  getUniqueDates,
  formatDateLabel,
  handleUpdateSupplyRequestStatus,
  handleDelete
}) {
  return (
    <div className="h-full flex flex-col bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-slate-100 pb-6 shrink-0">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 whitespace-nowrap">
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shadow-inner">📝</span> คิวขอเบิกอุปกรณ์สำนักงาน
        </h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select value={supplyFilterDate} onChange={(e) => setSupplyFilterDate(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-1 focus:ring-teal-500 outline-none transition-all shadow-sm cursor-pointer">
            <option value="ทั้งหมด">วันที่: ทั้งหมด</option>
            {getUniqueDates(supplyRequests).map(d => (
              <option key={d} value={d}>{formatDateLabel(d)}</option>
            ))}
          </select>
          <select value={supplyFilterStatus} onChange={(e) => setSupplyFilterStatus(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-1 focus:ring-teal-500 outline-none transition-all shadow-sm cursor-pointer">
            <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
            <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
          </select>
        </div>
      </div>
      {currentSupplyRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <span className="text-5xl mb-4 opacity-50 drop-shadow-sm">✅</span>
          <p className="font-bold text-lg text-slate-500">ไม่มีคำขอในสถานะนี้</p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left whitespace-nowrap text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 font-bold text-slate-500">วันที่ขอ</th>
                <th className="px-5 py-4 font-bold text-slate-500">ผู้ขอ (รหัสพนักงาน)</th>
                <th className="px-5 py-4 font-bold text-slate-500">อุปกรณ์ที่ต้องการ</th>
                <th className="px-5 py-4 font-bold text-slate-500 text-center">จำนวน</th>
                <th className="px-5 py-4 font-bold text-slate-500 text-center">สถานะ</th>
                <th className="px-5 py-4 font-bold text-slate-500 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentSupplyRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-slate-600 font-medium">{new Date(req.timestamp).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-5 py-4"><div className="font-bold text-teal-700">{req.empName}</div><div className="text-xs text-slate-500 mt-0.5">{req.empId} • {req.department || '-'}</div></td>
                  <td className="px-5 py-4"><div className="font-bold text-slate-800">{req.supplyName}</div><div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{req.note}</div></td>
                  <td className="px-5 py-4 text-center font-bold text-emerald-600 text-lg">{req.requestedQty}</td>
                  <td className="px-5 py-4 text-center">
                    <select value={req.status} onChange={(e) => handleUpdateSupplyRequestStatus(req, e.target.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer shadow-sm ${req.status === 'รอดำเนินการ' ? 'bg-amber-50 text-amber-700 border-amber-200' : req.status === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      <option value="รอดำเนินการ">รอดำเนินการ</option><option value="อนุมัติแล้ว">อนุมัติแล้ว</option><option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => handleDelete(req.id, 'supply_requests')} className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-lg transition-all shadow-sm">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}