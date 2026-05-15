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
function IconRestore() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

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
  setConfirmDeleteModal
}) {
  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3.5 text-center">
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
              checked={currentData.length > 0 && selectedEmployeeIds?.length === currentData.length}
              onChange={handleSelectAllEmployees}
            />
          </th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">รหัสพนักงาน</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ชื่อ-นามสกุล</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">แผนก / บริษัท</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">ตำแหน่ง</th>
          <th className="px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group bg-white">
            <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
                checked={selectedEmployeeIds?.includes(item.id) || false}
                onChange={(e) => handleSelectEmployee(e, item.id)}
              />
            </td>
            <td className="px-5 py-3.5 font-semibold text-[#1E487A] text-xs font-mono">{item.empId}</td>
            <td className="px-5 py-3.5">
              <button onClick={() => { setSelectedEmployee(item); setEmpModalTab('info'); }} className="text-left flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1E487A] flex items-center justify-center font-bold text-sm border border-blue-100">
                  {item.fullName.charAt(0)}
                </div>
                <div>
                  <span className="font-semibold text-slate-800 group-hover:text-[#1E487A] transition-colors">{item.fullName}</span>
                  {item.nickname && <span className="text-slate-400 text-xs ml-2">({item.nickname})</span>}
                </div>
              </button>
            </td>
            <td className="px-5 py-3.5 text-slate-600">
              <div className="text-sm font-semibold text-slate-700">{item.department || '-'}</div>
              <div className="text-xs text-slate-400 mt-0.5">{item.company || '-'}</div>
            </td>
            <td className="px-5 py-3.5 text-slate-600 text-sm">{item.position || '-'}</td>
            <td className="px-5 py-3.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                {showDeletedEmployees ? (
                  <button
                    onClick={() => handleRestoreEmployee(item)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-[#1E487A] border border-[#1E487A]/30 hover:bg-[#1E487A] hover:text-white rounded-md font-semibold transition-all text-xs"
                  >
                    <IconRestore /> กู้คืน
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => openEditEmpModal(item)}
                      className="inline-flex items-center justify-center w-7 h-7 text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-md transition-all"
                      title="แก้ไข"
                    >
                      <IconEdit />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'employees' })}
                      className="inline-flex items-center justify-center w-7 h-7 text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-md transition-all"
                      title="ลบ"
                    >
                      <IconTrash />
                    </button>
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
