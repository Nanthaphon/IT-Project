import React from 'react';
import { Pencil, Trash2, RotateCcw } from 'lucide-react';

const TH = 'px-5 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-[0.08em]';
const TD = 'px-5 py-3.5';

export default function EmployeeTable({
  currentData,
  selectedEmployeeIds,
  handleSelectAllEmployees,
  handleSelectEmployee,
  setSelectedEmployee,
  setEmpModalTab,
  showDeletedEmployees,
  handleRestoreEmployee,
  openEditEmpModal,
  setConfirmDeleteModal,
  canEdit,
}) {
  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
        <tr>
          <th className="px-4 py-3 text-center w-10">
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
              checked={currentData.length > 0 && selectedEmployeeIds?.length === currentData.length}
              onChange={handleSelectAllEmployees}
            />
          </th>
          <th className={TH}>รหัสพนักงาน</th>
          <th className={TH}>ชื่อ-นามสกุล</th>
          <th className={TH}>แผนก / บริษัท</th>
          <th className={TH}>ตำแหน่ง</th>
          <th className={`${TH} text-center`}>จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-[13.5px] bg-white">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
            <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
                checked={selectedEmployeeIds?.includes(item.id) || false}
                onChange={(e) => handleSelectEmployee(e, item.id)}
              />
            </td>
            <td className={`${TD} font-mono text-[12.5px] font-semibold text-[#1E487A]`}>{item.empId}</td>
            <td className={TD}>
              <button
                onClick={() => { setSelectedEmployee(item); setEmpModalTab('info'); }}
                className="text-left flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1E487A] flex items-center justify-center font-semibold text-[13px] ring-1 ring-blue-100">
                  {item.fullName.charAt(0)}
                </div>
                <div>
                  <span className="font-medium text-slate-800 group-hover:text-[#1E487A] transition-colors">{item.fullName}</span>
                  {item.nickname && <span className="text-slate-400 text-[12px] ml-2">({item.nickname})</span>}
                </div>
              </button>
            </td>
            <td className={`${TD} text-slate-600`}>
              <div className="text-[13px] font-medium text-slate-700">{item.department || '-'}</div>
              <div className="text-[11.5px] text-slate-400 mt-0.5">{item.company || '-'}</div>
            </td>
            <td className={`${TD} text-slate-600`}>{item.position || '-'}</td>
            <td className={`${TD} text-center`}>
              <div className="flex items-center justify-center gap-1.5">
                {showDeletedEmployees ? (
                  canEdit && (
                    <button
                      onClick={() => handleRestoreEmployee(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-[#1E487A] ring-1 ring-inset ring-[#1E487A]/30 hover:bg-[#1E487A] hover:text-white hover:ring-[#1E487A] rounded-lg font-semibold transition-colors text-[11.5px]"
                    >
                      <RotateCcw className="h-3 w-3" strokeWidth={2.2} /> กู้คืน
                    </button>
                  )
                ) : (
                  <>
                    {canEdit && (
                      <IconBtn onClick={() => openEditEmpModal(item)} title="แก้ไข" kind="warning">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      </IconBtn>
                    )}
                    {canEdit && (
                      <IconBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'employees' })} title="ลบ" kind="danger">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </IconBtn>
                    )}
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IconBtn({ onClick, title, children, kind }) {
  const map = {
    warning: 'text-amber-600 hover:bg-amber-50 hover:ring-amber-300',
    danger:  'text-rose-500 hover:bg-rose-50 hover:ring-rose-300',
  }[kind];
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 bg-white ring-1 ring-inset ring-slate-200 rounded-lg transition-colors ${map}`}
    >
      {children}
    </button>
  );
}
