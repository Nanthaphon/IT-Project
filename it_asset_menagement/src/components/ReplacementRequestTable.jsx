import React from 'react';

export default function ReplacementRequestTable({
  replacementRequests,
  handleUpdateReplacementStatus,
  handleDeleteReplacement
}) {
  return (
    <div className="h-full flex flex-col bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-slate-100 pb-6 shrink-0">
        <h3 className="text-xl font-black text-[#1E487A] flex items-center gap-3 whitespace-nowrap">
          <span className="p-2 bg-blue-50 text-[#1E487A] rounded-xl shadow-sm border border-blue-100">🔄</span> 
          คิวคำขอเปลี่ยนเครื่องโน๊ตบุ๊ค
        </h3>
      </div>
      {replacementRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <span className="text-5xl mb-4 opacity-50 drop-shadow-sm">✅</span>
          <p className="font-bold text-lg text-slate-500">ไม่มีคำขอเปลี่ยนเครื่องในขณะนี้</p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left whitespace-nowrap text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">วันที่ขอ</th>
                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">ผู้ขอ (แผนก)</th>
                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">แจ้งอีเมลหัวหน้างาน</th>
                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">สถานะเครื่อง / เหตุผล</th>
                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">สถานะคำขอ</th>
                <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {replacementRequests.map((req) => (
                <tr key={req.id} className="hover:bg-blue-50/40 transition-colors bg-white group">
                  <td className="px-5 py-4 text-slate-600 font-medium">{new Date(req.timestamp).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-5 py-4"><div className="font-bold text-[#1E487A]">{req.empName}</div><div className="text-xs text-slate-500 mt-0.5">{req.empId} • {req.department || '-'}</div></td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{req.managerName}</div>
                    {req.managerEmail ? (
                      <div className="text-xs text-emerald-600 mt-0.5 font-bold">📧 {req.managerEmail}</div>
                    ) : (
                      <div className="text-xs text-slate-400 mt-0.5">- ไม่มีข้อมูลอีเมล -</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{req.currentStatus}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[250px]" title={req.reason}>{req.reason}</div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <select value={req.status} onChange={(e) => handleUpdateReplacementStatus(req.id, e.target.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer shadow-sm ${req.status === 'รอดำเนินการ' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500' : req.status === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500' : 'bg-red-50 text-red-700 border-red-200 focus:ring-red-500'}`}>
                      <option value="รอดำเนินการ">รอดำเนินการ</option>
                      <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                      <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => handleDeleteReplacement(req.id)} className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg transition-all shadow-sm" title="ลบคำขอ">🗑️</button>
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