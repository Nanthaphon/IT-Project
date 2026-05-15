import React from 'react';

function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IconWrench() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
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

export default function RepairTable({
  repairRequests,
  currentRepairRequests,
  repairFilterMonth,
  setRepairFilterMonth,
  repairFilterStatus,
  setRepairFilterStatus,
  getUniqueMonths,
  formatMonthLabel,
  handleUpdateRepairRequestStatus,
  handleDeleteRepairRequest
}) {
  return (
    <div className="h-full flex flex-col bg-white p-5 rounded-xl border border-slate-200">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-5 gap-3 border-b border-slate-100 pb-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-50 text-[#1E487A] rounded-lg flex items-center justify-center border border-blue-100">
            <IconWrench />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 whitespace-nowrap">คิวงานแจ้งปัญหาจากพนักงาน</h3>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={repairFilterMonth}
            onChange={(e) => setRepairFilterMonth(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] outline-none transition cursor-pointer"
          >
            <option value="ทั้งหมด">เดือน: ทั้งหมด</option>
            {getUniqueMonths(repairRequests).map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
          <select
            value={repairFilterStatus}
            onChange={(e) => setRepairFilterStatus(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] outline-none transition cursor-pointer"
          >
            <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
            <option value="ซ่อมเสร็จสิ้น">ซ่อมเสร็จสิ้น</option>
            <option value="ยกเลิก">ยกเลิก</option>
          </select>
        </div>
      </div>

      {currentRepairRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-16 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <IconEmpty />
          <p className="font-semibold text-slate-400 mt-3">ไม่มีคิวงานในสถานะนี้</p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1 rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left whitespace-nowrap text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">วันที่แจ้ง</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ผู้แจ้ง</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">หัวข้อ / รายละเอียด</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">สถานะ</th>
                <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentRepairRequests.map((req) => (
                <tr key={req.id} className="hover:bg-blue-50/30 transition-colors bg-white group">
                  <td className="px-5 py-3.5 text-slate-600 text-xs">
                    {new Date(req.timestamp).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[#1E487A] text-sm">{req.empName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{req.empId} · {req.department || '-'}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800 text-sm">{req.assetName}</div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[250px]" title={req.issue}>{req.issue}</div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateRepairRequestStatus(req.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border outline-none cursor-pointer ${
                        req.status === 'รอดำเนินการ'     ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        req.status === 'กำลังดำเนินการ' ? 'bg-blue-50 text-[#1E487A] border-blue-200'  :
                        req.status === 'ซ่อมเสร็จสิ้น'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                           'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="รอดำเนินการ">รอดำเนินการ</option>
                      <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                      <option value="ซ่อมเสร็จสิ้น">ซ่อมเสร็จสิ้น</option>
                      <option value="ยกเลิก">ยกเลิก</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleDeleteRepairRequest(req.id)}
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
