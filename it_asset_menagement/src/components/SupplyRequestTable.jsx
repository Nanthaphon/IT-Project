import React from 'react';

function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
function IconEmpty() {
  return (
    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg className="h-3 w-3 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

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
    <div className="h-full flex flex-col bg-white p-5 rounded-xl border border-slate-200">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-5 gap-3 border-b border-slate-100 pb-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-50 text-[#1E487A] rounded-lg flex items-center justify-center border border-blue-100">
            <IconDoc />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 whitespace-nowrap">คิวขอเบิกอุปกรณ์สำนักงาน</h3>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={supplyFilterDate}
            onChange={(e) => setSupplyFilterDate(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] outline-none transition cursor-pointer"
          >
            <option value="ทั้งหมด">วันที่: ทั้งหมด</option>
            {getUniqueDates(supplyRequests).map(d => (
              <option key={d} value={d}>{formatDateLabel(d)}</option>
            ))}
          </select>
          <select
            value={supplyFilterStatus}
            onChange={(e) => setSupplyFilterStatus(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] outline-none transition cursor-pointer"
          >
            <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
            <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
          </select>
        </div>
      </div>

      {currentSupplyRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-16 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <IconEmpty />
          <p className="font-semibold text-slate-400 mt-3">ไม่มีคำขอในสถานะนี้</p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1 rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left whitespace-nowrap text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">วันที่ขอ</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ผู้ขอ</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">อุปกรณ์ที่ต้องการ</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">จำนวน</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">สถานะ</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentSupplyRequests.map((req) => (
                <tr key={req.id} className="hover:bg-blue-50/30 transition-colors bg-white group">
                  <td className="px-5 py-3.5 text-slate-600 text-xs">
                    {new Date(req.timestamp).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[#1E487A] text-sm">{req.empName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{req.empId} · {req.department || '-'}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800 text-sm">{req.supplyName}</div>
                    {req.note && <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{req.note}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-center font-bold text-[#1E487A]">{req.requestedQty}</td>
                  <td className="px-5 py-3.5 text-center">
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateSupplyRequestStatus(req, e.target.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border outline-none cursor-pointer ${
                        req.status === 'รอดำเนินการ' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        req.status === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      <option value="รอดำเนินการ">รอดำเนินการ</option>
                      <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                      <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleDelete(req.id, 'supply_requests')}
                      className="inline-flex items-center justify-center w-7 h-7 text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-md transition-all"
                      title="ลบ"
                    >
                      <IconTrash />
                    </button>
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
