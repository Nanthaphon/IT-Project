import React, { useState } from 'react';

export default function EmployeeDetailsModal({
  selectedEmployee,
  setSelectedEmployee,
  empModalTab,
  setEmpModalTab,
  assets,
  licenses,
  accessories,
  transactions,
  openEditEmpModal,
  // รับ Props เพิ่มเติมสำหรับการสั่งงานรับคืน
  handleCheckin,
  setReturnModal
}) {
  // สร้าง State สำหรับกรองประเภทประวัติภายใน Modal นี้
  const [historyFilter, setHistoryFilter] = useState('all');

  // ถ้าไม่มีการเลือกพนักงาน จะไม่แสดง Modal
  if (!selectedEmployee) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-100">
        <div className="bg-slate-800 text-white p-5 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="bg-white/20 p-1.5 rounded-lg text-sm">📋</span> ข้อมูลพนักงาน
          </h3>
          <button 
            onClick={() => setSelectedEmployee(null)} 
            className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-700 hover:bg-slate-600 p-1.5 rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ส่วนเลือกแท็บเมนู */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setEmpModalTab('info')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${empModalTab === 'info' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            ข้อมูลทั่วไป
          </button>
          <button
            onClick={() => setEmpModalTab('assets')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${empModalTab === 'assets' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            ครอบครองปัจจุบัน
          </button>
          <button
            onClick={() => setEmpModalTab('history')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${empModalTab === 'history' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            ประวัติการเบิก-คืน
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto space-y-4 text-sm md:text-base text-slate-800 flex-1">
          {empModalTab === 'info' ? (
            <div className="bg-white rounded-xl">
              {/* ข้อมูลทั่วไปพนักงาน */}
              <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4 mt-2">
                <span className="text-slate-500 font-bold text-sm md:text-base">รหัสพนักงาน:</span>
                <span className="col-span-2 font-black text-indigo-700 text-lg md:text-xl">{selectedEmployee.empId}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                <span className="text-slate-500 font-bold text-sm md:text-base">ชื่อ-นามสกุล (TH):</span>
                <span className="col-span-2 font-bold text-slate-800">
                  {selectedEmployee.fullName} {selectedEmployee.nickname ? <span className="text-slate-400 font-medium">({selectedEmployee.nickname})</span> : ''}
                </span>
              </div>
              {selectedEmployee.fullNameEng && (
                <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                  <span className="text-slate-500 font-bold text-sm md:text-base">ชื่อ-นามสกุล (EN):</span>
                  <span className="col-span-2 font-medium text-slate-800">{selectedEmployee.fullNameEng}</span>
                </div>
              )}
              <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                <span className="text-slate-500 font-bold text-sm md:text-base">ตำแหน่ง:</span>
                <span className="col-span-2 font-medium">{selectedEmployee.position || '-'}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                <span className="text-slate-500 font-bold text-sm md:text-base">แผนก:</span>
                <span className="col-span-2 font-medium">{selectedEmployee.department || '-'}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-100 py-3 md:py-4">
                <span className="text-slate-500 font-bold text-sm md:text-base">อีเมล:</span>
                <span className="col-span-2 font-medium text-blue-600">{selectedEmployee.email || '-'}</span>
              </div>
            </div>
          ) : empModalTab === 'assets' ? (
            <div className="space-y-3">
              {(() => {
                // กรองข้อมูลที่พนักงานคนนี้ถือครองอยู่
                const empAssets = assets.filter(item => item.assignedTo === selectedEmployee.id);
                const empLicenses = licenses.filter(item => item.assignedTo === selectedEmployee.id);
                const empAccessories = accessories.reduce((accList, acc) => {
                  if (acc.assignees) {
                    acc.assignees.filter(a => a.empId === selectedEmployee.id).forEach(checkout => {
                      accList.push({ ...acc, uniqueKey: checkout.checkoutId, checkoutId: checkout.checkoutId });
                    });
                  }
                  return accList;
                }, []);
                
                const allHeldItems = [...empAssets, ...empLicenses, ...empAccessories];
                
                if (allHeldItems.length === 0) {
                  return (
                    <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <span className="text-4xl block mb-3 opacity-50">📦</span>
                      <p className="font-medium text-base">ยังไม่มีทรัพย์สินที่ถือครองในระบบ</p>
                    </div>
                  );
                }

                return (
                  <ul className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-100 shadow-sm">
                    {allHeldItems.map(item => {
                      const isAsset = assets.some(a => a.id === item.id);
                      const isAccessory = accessories.some(a => a.id === item.id);
                      const category = isAsset ? 'assets' : isAccessory ? 'accessories' : 'licenses';

                      return (
                        <li key={item.uniqueKey || item.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-slate-500">{item.type || 'License'}</span>
                              <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-bold">
                                {isAsset ? 'ทรัพย์สินหลัก' : isAccessory ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}
                              </span>
                            </div>
                          </div>
                          
                          {/* ปุ่มรับคืนในแต่ละรายการ */}
                          <button
                            onClick={() => {
                              if (isAccessory) {
                                setReturnModal({
                                  isOpen: true,
                                  assetId: item.id,
                                  checkoutId: item.checkoutId,
                                  empId: selectedEmployee.id,
                                  empName: selectedEmployee.fullName,
                                  assetName: item.name
                                });
                              } else {
                                handleCheckin(item.id, category);
                              }
                            }}
                            className="ml-4 px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-200 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            รับคืน
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-4">
              {/* ตัวกรองประวัติ (History Filter Chips) */}
              <div className="flex flex-wrap gap-2 mb-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {['all', 'assets', 'licenses', 'accessories'].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setHistoryFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${historyFilter === cat ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {cat === 'all' ? 'ทั้งหมด' : cat === 'assets' ? 'ทรัพย์สินหลัก' : cat === 'licenses' ? 'โปรแกรม/License' : 'อุปกรณ์เสริม'}
                  </button>
                ))}
              </div>

              {(() => {
                // กรองข้อมูลพนักงาน
                let empHistory = transactions.filter(t => t.empId === selectedEmployee.id);
                
                // กรองตามประเภท โดยรองรับทั้งรูปแบบเอกพจน์และพหูพจน์ (ป้องกันข้อมูลใน DB ไม่ตรงกัน)
                if (historyFilter !== 'all') {
                  empHistory = empHistory.filter(t => {
                    if (historyFilter === 'licenses') return t.category === 'licenses' || t.category === 'license';
                    if (historyFilter === 'assets') return t.category === 'assets' || t.category === 'asset';
                    if (historyFilter === 'accessories') return t.category === 'accessories' || t.category === 'accessory';
                    return t.category === historyFilter;
                  });
                }
                
                // เรียงจากใหม่ไปเก่า
                empHistory = empHistory.sort((a, b) => b.timestamp - a.timestamp);

                if (empHistory.length === 0) {
                  return (
                    <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <span className="text-4xl block mb-3 opacity-50">🕒</span>
                      <p className="font-medium text-base">ไม่พบประวัติรายการในหมวดหมู่นี้</p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap text-sm">
                      <thead className="bg-slate-100">
                        <tr className="text-slate-600">
                          <th className="p-3 md:p-4 font-bold border-b border-slate-200">วันที่</th>
                          <th className="p-3 md:p-4 font-bold border-b border-slate-200">รายการ</th>
                          <th className="p-3 md:p-4 font-bold border-b border-slate-200 text-center">ประเภทข้อมูล</th>
                          <th className="p-3 md:p-4 font-bold border-b border-slate-200">ประเภททำรายการ</th>
                          <th className="p-3 md:p-4 font-bold border-b border-slate-200">สภาพ</th>
                          <th className="p-3 md:p-4 font-bold border-b border-slate-200">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {empHistory.map(record => {
                          const dateObj = new Date(record.timestamp);
                          const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
                          return (
                            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 md:p-4 text-slate-500 font-medium">{formattedDate}</td>
                              <td className="p-3 md:p-4 text-slate-800 font-bold">{record.assetName}</td>
                              <td className="p-3 md:p-4 text-center">
                                <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 uppercase border border-slate-200">
                                  {(record.category === 'assets' || record.category === 'asset') ? 'ทรัพย์สิน' : (record.category === 'licenses' || record.category === 'license') ? 'LICENSE' : 'อุปกรณ์'}
                                </span>
                              </td>
                              <td className="p-3 md:p-4 text-slate-700">{record.action}</td>
                              <td className="p-3 md:p-4">
                                <span className={`font-bold flex items-center gap-1.5 ${record.condition === 'ปกติ' ? 'text-emerald-600' : 'text-red-500'}`}>
                                  <span className={`w-2 h-2 rounded-full ${record.condition === 'ปกติ' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                  {record.condition}
                                </span>
                              </td>
                              <td className="p-3 md:p-4 text-slate-500 max-w-[150px] truncate" title={record.remarks}>{record.remarks || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        
        <div className="p-5 md:p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-200">
           <button onClick={() => openEditEmpModal(selectedEmployee)} className="px-6 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-bold transition-colors border border-amber-200 text-sm">แก้ไขข้อมูล</button>
           <button onClick={() => setSelectedEmployee(null)} className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold transition-colors shadow-md text-sm">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}