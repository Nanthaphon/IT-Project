import React from 'react';
import { Trash2, ClipboardList, CheckCircle2 } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

const TH = 'px-5 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-[0.08em]';
const TD = 'px-5 py-3.5';

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
  handleDelete,
}) {
  return (
    <div className="h-full flex flex-col bg-white p-5 rounded-2xl ring-1 ring-slate-200/70 shadow-sm">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-5 gap-3 border-b border-slate-100 pb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
          >
            <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight">คิวขอเบิกอุปกรณ์สำนักงาน</h3>
            <p className="text-[11.5px] text-slate-500 mt-0.5">{currentSupplyRequests.length} รายการในมุมมองนี้</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter value={supplyFilterDate} onChange={setSupplyFilterDate}>
            <option value="ทั้งหมด">วันที่: ทั้งหมด</option>
            {getUniqueDates(supplyRequests).map(d => (
              <option key={d} value={d}>{formatDateLabel(d)}</option>
            ))}
          </Filter>
          <Filter value={supplyFilterStatus} onChange={setSupplyFilterStatus}>
            <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
            <option value="ปฏิเสธคำขอ">ปฏิเสธคำขอ</option>
          </Filter>
        </div>
      </div>

      {currentSupplyRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-16 bg-slate-50/50 rounded-xl ring-1 ring-dashed ring-slate-200">
          <div className="w-14 h-14 rounded-full bg-white ring-1 ring-slate-200 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
          </div>
          <p className="font-medium text-slate-500">ไม่มีคำขอในสถานะนี้</p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1 rounded-xl ring-1 ring-slate-200 bg-white">
          <table className="min-w-full text-left whitespace-nowrap text-[13.5px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className={TH}>วันที่ขอ</th>
                <th className={TH}>ผู้ขอ</th>
                <th className={TH}>อุปกรณ์ที่ต้องการ</th>
                <th className={`${TH} text-center`}>จำนวน</th>
                <th className={`${TH} text-center`}>สถานะ</th>
                <th className={`${TH} text-center`}>จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentSupplyRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className={`${TD} text-slate-500 text-[12px] tabular-nums`}>
                    {new Date(req.timestamp).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className={TD}>
                    <div className="font-medium text-[#1E487A] text-[13px]">{req.empName}</div>
                    <div className="text-[11.5px] text-slate-400 mt-0.5">{req.empId} · {req.department || '-'}</div>
                  </td>
                  <td className={TD}>
                    <div className="font-medium text-slate-800">{req.supplyName}</div>
                    {req.note && <div className="text-[12px] text-slate-500 mt-0.5 truncate max-w-[240px]">{req.note}</div>}
                  </td>
                  <td className={`${TD} text-center font-semibold text-[#1E487A] tabular-nums text-[14px]`}>{req.requestedQty}</td>
                  <td className={`${TD} text-center`}>
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateSupplyRequestStatus(req, e.target.value)}
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
                      onClick={() => handleDelete(req.id, 'supply_requests')}
                      className="inline-flex items-center justify-center w-7 h-7 text-rose-500 bg-white hover:bg-rose-50 ring-1 ring-inset ring-slate-200 hover:ring-rose-300 rounded-lg transition-colors"
                      title="ลบ"
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

function Filter({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full sm:w-auto bg-white ring-1 ring-slate-200 text-slate-700 px-3 py-2 rounded-lg text-[13px] font-medium outline-none transition-colors cursor-pointer hover:ring-slate-300 focus:ring-2 focus:ring-[#1E487A]/30"
    >
      {children}
    </select>
  );
}
