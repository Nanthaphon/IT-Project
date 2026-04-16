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
  handleCheckin,
  setReturnModal
}) {
  // สร้าง State สำหรับตัวกรองประวัติการทำรายการ
  const [historyFilter, setHistoryFilter] = useState('all');

  // ถ้าไม่มีการเลือกพนักงาน (เป็น null) จะไม่แสดง Modal
  if (!selectedEmployee) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-opacity"
      style={{ fontFamily: "'Prompt', sans-serif" }}
    >
      {/* Import Font Prompt from Google Fonts */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');`}
      </style>

      <div className="bg-slate-50 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh] border border-slate-200/50">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-300 rounded-2xl flex items-center justify-center text-2xl border border-indigo-500/30 shadow-inner">
              {selectedEmployee.fullName?.charAt(0) || '👤'}
            </div>
            <div>
              <h3 className="font-bold text-xl tracking-wide flex items-center gap-2">
                {selectedEmployee.fullName} {selectedEmployee.nickname && <span className="text-slate-400 font-medium text-base">({selectedEmployee.nickname})</span>}
              </h3>
              <p className="text-sm text-slate-400 font-medium mt-0.5">รหัสพนักงาน: <span className="text-indigo-300 font-bold">{selectedEmployee.empId}</span></p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedEmployee(null)} 
            className="text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-800 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/30 p-2.5 rounded-xl group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* แท็บเมนู (Tabs) */}
        <div className="flex px-6 pt-4 bg-white border-b border-slate-200 gap-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setEmpModalTab('info')}
            className={`pb-4 px-2 text-sm md:text-base font-semibold border-b-4 transition-all whitespace-nowrap ${empModalTab === 'info' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
          >
            📋 ข้อมูลทั่วไป
          </button>
          <button
            onClick={() => setEmpModalTab('assets')}
            className={`pb-4 px-2 text-sm md:text-base font-semibold border-b-4 transition-all whitespace-nowrap ${empModalTab === 'assets' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
          >
            📦 ครอบครองปัจจุบัน
          </button>
          <button
            onClick={() => setEmpModalTab('history')}
            className={`pb-4 px-2 text-sm md:text-base font-semibold border-b-4 transition-all whitespace-nowrap ${empModalTab === 'history' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
          >
            🕒 ประวัติการเบิก-คืน
          </button>
        </div>
        
        {/* Content Area */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-4 text-sm md:text-base text-slate-800 flex-1">
          
          {/* 1. แท็บข้อมูลทั่วไป */}
          {empModalTab === 'info' ? (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">ข้อมูลส่วนตัวและตำแหน่ง</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 mb-1">ชื่อ-นามสกุล (TH)</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.fullName || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 mb-1">ชื่อ-นามสกุล (EN)</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.fullNameEng || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 mb-1">ตำแหน่ง</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.position || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 mb-1">แผนก</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.department || '-'}</span>
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <span className="text-xs font-semibold text-slate-500 mb-1">บริษัท</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.company || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-100">ข้อมูลการติดต่อและสังกัด</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 mb-1">อีเมล (Email)</span>
                    <span className="font-bold text-indigo-600">{selectedEmployee.email || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 mb-1">เบอร์โทรศัพท์</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.phone || '-'}</span>
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <span className="text-xs font-semibold text-slate-500 mb-1">หัวหน้างาน</span>
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">👤</span>
                      {selectedEmployee.manager || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          ) : empModalTab === 'assets' ? (
            /* 2. แท็บครอบครองปัจจุบัน */
            <div className="space-y-4">
              {(() => {
                const empAssets = assets.filter(item => item.assignedTo === selectedEmployee.id);
                const empLicenses = licenses.filter(item => item.assignedTo === selectedEmployee.id);
                
                const empAccessories = accessories.reduce((accList, acc) => {
                  if (acc.assignees) {
                    acc.assignees.filter(a => a.empId === selectedEmployee.id).forEach(checkout => {
                      accList.push({ ...acc, uniqueKey: checkout.checkoutId, checkoutId: checkout.checkoutId });
                    });
                  } else if (acc.assignedTo === selectedEmployee.id) {
                    accList.push({ ...acc, uniqueKey: acc.id }); 
                  }
                  return accList;
                }, []);
                
                const allHeldItems = [...empAssets, ...empLicenses, ...empAccessories];
                
                if (allHeldItems.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center text-slate-400 py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                      <span className="text-5xl mb-4 drop-shadow-sm">📦</span>
                      <p className="font-bold text-lg text-slate-600">ยังไม่มีทรัพย์สินที่ถือครอง</p>
                      <p className="text-sm text-slate-400 mt-1">พนักงานคนนี้ยังไม่มีรายการเบิกจ่ายในระบบ</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-3">
                    {allHeldItems.map(item => {
                      const isAsset = assets.some(a => a.id === item.id);
                      const isAccessory = accessories.some(a => a.id === item.id);
                      const category = isAsset ? 'assets' : isAccessory ? 'accessories' : 'licenses';

                      return (
                        <div key={item.uniqueKey || item.id} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            {/* ✅ ส่วนการแสดงรูปภาพอุปกรณ์ในหน้ารายละเอียดพนักงาน */}
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-200 shrink-0" 
                              />
                            ) : (
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${isAsset ? 'bg-blue-50 text-blue-500' : isAccessory ? 'bg-orange-50 text-orange-500' : 'bg-purple-50 text-purple-500'}`}>
                                {isAsset ? '🖥️' : isAccessory ? '🖱️' : '🔑'}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-lg font-bold border ${isAsset ? 'bg-blue-50 border-blue-200 text-blue-700' : isAccessory ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
                                  {isAsset ? 'ทรัพย์สินหลัก' : isAccessory ? 'อุปกรณ์เสริม' : 'โปรแกรม/License'}
                                </span>
                                <span className="text-xs font-medium text-slate-500">{item.type || 'License'}</span>
                              </div>
                            </div>
                          </div>
                          
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
                            className="w-full sm:w-auto px-5 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-500 hover:text-white border border-teal-200 hover:border-teal-500 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            รับคืนรายการนี้
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

          ) : (
            /* 3. แท็บประวัติการเบิก-คืน */
            <div className="space-y-5">
              
              {/* ปุ่มกรองหมวดหมู่ (Filter) */}
              <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
                {[
                  { id: 'all', label: 'ทั้งหมด', icon: '📋' },
                  { id: 'assets', label: 'ทรัพย์สินหลัก', icon: '🖥️' },
                  { id: 'licenses', label: 'โปรแกรม', icon: '🔑' },
                  { id: 'accessories', label: 'อุปกรณ์เสริม', icon: '🖱️' }
                ].map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => setHistoryFilter(cat.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${historyFilter === cat.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                  >
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>

              {(() => {
                let empHistory = transactions.filter(t => t.empId === selectedEmployee.id);
                
                if (historyFilter !== 'all') {
                  empHistory = empHistory.filter(t => {
                    if (historyFilter === 'licenses') return t.category === 'licenses' || t.category === 'license';
                    if (historyFilter === 'assets') return t.category === 'assets' || t.category === 'asset';
                    if (historyFilter === 'accessories') return t.category === 'accessories' || t.category === 'accessory';
                    return t.category === historyFilter;
                  });
                }

                empHistory = empHistory.sort((a, b) => b.timestamp - a.timestamp);

                if (empHistory.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center text-slate-400 py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                      <span className="text-5xl mb-4 drop-shadow-sm">🕒</span>
                      <p className="font-bold text-lg text-slate-600">ไม่พบประวัติในหมวดหมู่นี้</p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
                    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap text-sm">
                      <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">วันที่ทำรายการ</th>
                          <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">รายการ/รุ่นอุปกรณ์</th>
                          <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">ประเภทข้อมูล</th>
                          <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">ประเภททำรายการ</th>
                          <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {empHistory.map(record => {
                          const dateObj = new Date(record.timestamp);
                          const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
                          
                          return (
                            <tr key={record.id} className="hover:bg-indigo-50/30 transition-colors group">
                              <td className="px-5 py-4 text-slate-500 font-medium">{formattedDate}</td>
                              <td className="px-5 py-4 text-slate-800 font-bold text-base group-hover:text-indigo-700 transition-colors">{record.assetName}</td>
                              <td className="px-5 py-4 text-center">
                                <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 uppercase border border-slate-200">
                                  {(record.category === 'assets' || record.category === 'asset') ? 'ทรัพย์สิน' : (record.category === 'licenses' || record.category === 'license') ? 'LICENSE' : 'อุปกรณ์'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`font-bold px-3 py-1.5 rounded-lg text-xs border ${record.action?.includes('เบิกจ่าย') ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : record.action?.includes('รับคืน') ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                  {record.action || '-'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-slate-500 max-w-[200px] truncate" title={record.remarks}>{record.remarks || '-'}</td>
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
        
        {/* Footer Buttons */}
        <div className="p-6 bg-white flex justify-end gap-3 border-t border-slate-200 rounded-b-3xl">
           <button 
             onClick={() => openEditEmpModal(selectedEmployee)} 
             className="px-6 py-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl hover:bg-amber-500 hover:text-white hover:border-amber-500 font-bold transition-all shadow-sm text-sm md:text-base flex items-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
             แก้ไขข้อมูลพนักงาน
           </button>
           <button 
             onClick={() => setSelectedEmployee(null)} 
             className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold transition-all shadow-lg shadow-slate-800/30 text-sm md:text-base"
           >
             ปิดหน้าต่าง
           </button>
        </div>
      </div>
    </div>
  );
}