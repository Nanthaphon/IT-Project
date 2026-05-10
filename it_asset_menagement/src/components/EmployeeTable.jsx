import React from 'react';

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
          <th className="px-4 py-4 text-center">
            <input 
              type="checkbox" 
              className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]" 
              checked={currentData.length > 0 && selectedEmployeeIds?.length === currentData.length} 
              onChange={handleSelectAllEmployees} 
            />
          </th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">รหัสพนักงาน</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">ชื่อ-นามสกุล</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">แผนก / บริษัท</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">ตำแหน่ง</th>
          <th className="px-5 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group bg-white">
            <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox" 
                className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]" 
                checked={selectedEmployeeIds?.includes(item.id) || false} 
                onChange={(e) => handleSelectEmployee(e, item.id)} 
              />
            </td>
            <td className="px-5 py-4 font-bold text-[#1E487A]">{item.empId}</td>
            <td className="px-5 py-4">
              <button onClick={() => { setSelectedEmployee(item); setEmpModalTab('info'); }} className="text-left flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E487A] flex items-center justify-center font-black text-lg shadow-sm border border-blue-100">
                  {item.fullName.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-slate-800 group-hover:text-[#1E487A] transition-colors">{item.fullName}</span> 
                  {item.nickname && <span className="text-slate-400 text-sm ml-2">({item.nickname})</span>}
                </div>
              </button>
            </td>
            <td className="px-5 py-4 text-slate-600">
              <div className="text-sm font-bold text-slate-700">{item.department || '-'}</div>
              <div className="text-xs text-slate-400 mt-0.5">{item.company || '-'}</div>
            </td>
            <td className="px-5 py-4 text-slate-600 text-sm font-medium">{item.position || '-'}</td>
            <td className="px-5 py-4 text-center space-x-2">
              {showDeletedEmployees ? (
                <button 
                  onClick={() => handleRestoreEmployee(item)} 
                  className="px-3 py-1.5 bg-white text-[#1E487A] border border-slate-300 hover:border-[#1E487A] hover:bg-blue-50 rounded-lg font-semibold transition-all text-xs shadow-sm"
                >
                  🔄 กู้คืน
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => openEditEmpModal(item)} 
                    className="inline-flex items-center justify-center w-8 h-8 text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg transition-all shadow-sm" 
                    title="แก้ไข"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'employees' })} 
                    className="inline-flex items-center justify-center w-8 h-8 text-red-500 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg transition-all shadow-sm" 
                    title="ลบ"
                  >
                    🗑️
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}