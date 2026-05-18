import React from 'react';
import { Trash2, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

const TH = 'px-5 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-[0.08em]';
const TD = 'px-5 py-3.5';

export default function ReplacementRequestTable({
  replacementRequests,
  handleUpdateReplacementStatus,
  handleDeleteReplacement,
}) {
  return (
    <div className="h-full flex flex-col bg-white p-5 rounded-2xl ring-1 ring-slate-200/70 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-5 shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
        >
          <RefreshCw className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight">คิวคำขอเปลี่ยนเครื่องโน๊ตบุ๊ค</h3>
          <p className="text-[11.5px] text-slate-500 mt-0.5">{replacementRequests.length} คำขอทั้งหมด</p>
        </div>
      </div>

      {replacementRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-16 bg-slate-50/50 rounded-xl ring-1 ring-dashed ring-slate-200">
          <div className="w-14 h-14 rounded-full bg-white ring-1 ring-slate-200 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
          </div>
          <p className="font-medium text-slate-500">ไม่มีคำขอเปลี่ยนเครื่องในขณะนี้</p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1 rounded-xl ring-1 ring-slate-200 bg-white">
          <table className="min-w-full text-left whitespace-nowrap text-[13.5px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className={TH}>วันที่ขอ</th>
                <th className={TH}>ผู้ขอ</th>
                <th className={TH}>แจ้งอีเมลหัวหน้างาน</th>
                <th className={TH}>สถานะเครื่อง / เหตุผล</th>
                <th className={`${TH} text-center`}>สถานะคำขอ</th>
                <th className={`${TH} text-center`}>จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {replacementRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className={`${TD} text-slate-500 text-[12px] tabular-nums`}>
                    {new Date(req.timestamp).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className={TD}>
                    <div className="font-medium text-[#1E487A] text-[13px]">{req.empName}</div>
                    <div className="text-[11.5px] text-slate-400 mt-0.5">{req.empId} · {req.department || '-'}</div>
                  </td>
                  <td className={TD}>
                    <div className="font-medium text-slate-800">{req.managerName}</div>
                    {req.managerEmail ? (
                      <div className="text-[12px] text-emerald-600 mt-0.5 font-medium flex items-center gap-1">
                        <Mail className="h-3 w-3" strokeWidth={2} /> {req.managerEmail}
                      </div>
                    ) : (
                      <div className="text-[11.5px] text-slate-400 mt-0.5">ไม่มีข้อมูลอีเมล</div>
                    )}
                  </td>
                  <td className={TD}>
                    <div className="font-medium text-slate-800">{req.currentStatus}</div>
                    <div className="text-[12px] text-slate-500 mt-0.5 truncate max-w-[280px]" title={req.reason}>{req.reason}</div>
                  </td>
                  <td className={`${TD} text-center`}>
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateReplacementStatus(req.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 ring-inset outline-none cursor-pointer transition-colors ${
                        req.status === 'รอดำเนินการ' ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                        req.status === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                                                        'bg-rose-50 text-rose-700 ring-rose-200'
                      }`}
                    >
                      <option value="รอดำเนินการ">รอดำเนินการ</option>
                      <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                      <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
                    </select>
                  </td>
                  <td className={`${TD} text-center`}>
                    <button
                      onClick={() => handleDeleteReplacement(req.id)}
                      className="inline-flex items-center justify-center w-7 h-7 text-rose-500 bg-white hover:bg-rose-50 ring-1 ring-inset ring-slate-200 hover:ring-rose-300 rounded-lg transition-colors"
                      title="ลบคำขอ"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
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
