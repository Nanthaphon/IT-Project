import React from 'react';

export default function ActionBar({
  menuTitle,
  activeMenu,
  searchTerm,
  setSearchTerm,
  showDeletedEmployees,
  setShowDeletedEmployees,
  setIsImportModalOpen,
  handleExportEmployees,
  selectedEmployeeIds,
  setConfirmDeleteModal,
  assetFilterDepartment,
  setAssetFilterDepartment,
  assetFilterType,
  setAssetFilterType,
  assetFilterStatus,
  setAssetFilterStatus,
  accFilterType,
  setAccFilterType,
  handleExportAccessories,
  selectedAccessoryIds,
  officeSupplyStockFilter,
  setOfficeSupplyStockFilter,
  selectedOfficeSupplyIds,
  setIsAddModalOpen
}) {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-slate-100 pb-6 shrink-0">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 whitespace-nowrap">
        <span className="p-2 bg-teal-50 text-teal-600 rounded-xl shadow-inner">📦</span> รายการ {menuTitle}
      </h3>
      <div className="flex flex-wrap w-full xl:w-auto gap-3 items-center sm:justify-end">
        
        {/* ช่องค้นหา */}
        <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="ค้นหาชื่อ หรือ รหัส..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full sm:w-64 pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all shadow-sm" 
          />
        </div>
        
        {/* ตัวกรองสำหรับ พนักงาน */}
        {activeMenu === 'employees' && (
          <React.Fragment>
            <button onClick={() => setShowDeletedEmployees(!showDeletedEmployees)} className={`flex-1 sm:flex-none w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${showDeletedEmployees ? 'bg-black text-teal-400 border border-slate-900 shadow-md' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>
              {showDeletedEmployees ? 'ดูพนักงานปัจจุบัน' : 'ถังขยะพนักงาน'}
            </button>
            {!showDeletedEmployees && (
              <React.Fragment>
                <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all shadow-sm">นำเข้า CSV</button>
                <button onClick={handleExportEmployees} className="flex-1 sm:flex-none w-full sm:w-auto bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all shadow-sm">ส่งออก CSV</button>
                {selectedEmployeeIds.length > 0 && (
                  <button onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedEmployeeIds, collectionName: 'employees' })} className="flex-1 sm:flex-none w-full sm:w-auto bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm">
                    🗑️ ลบที่เลือก ({selectedEmployeeIds.length})
                  </button>
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        )}
        
        {/* ตัวกรองสำหรับ ทรัพย์สินหลัก */}
        {activeMenu === 'assets' && (
          <React.Fragment>
            <select value={assetFilterDepartment} onChange={(e) => setAssetFilterDepartment(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-1 focus:ring-teal-500 outline-none transition-all shadow-sm cursor-pointer">
              <option value="ทั้งหมด">แผนก: ทั้งหมด</option><option value="DX">DX</option><option value="BD">BD</option><option value="General">General</option>
            </select>
            <select value={assetFilterType} onChange={(e) => setAssetFilterType(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-1 focus:ring-teal-500 outline-none transition-all shadow-sm cursor-pointer">
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option><option value="คอมพิวเตอร์">คอมพิวเตอร์ (PC/Laptop)</option><option value="หน้าจอ">หน้าจอ (Monitor)</option><option value="แท็บเล็ต/มือถือ">แท็บเล็ต / มือถือ</option><option value="อุปกรณ์เครือข่าย">อุปกรณ์เครือข่าย (Network)</option><option value="อื่นๆ">อื่นๆ</option>
            </select>
            <select value={assetFilterStatus} onChange={(e) => setAssetFilterStatus(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-1 focus:ring-teal-500 outline-none transition-all shadow-sm cursor-pointer">
              <option value="ทั้งหมด">สถานะ: ทั้งหมด</option><option value="พร้อมใช้งาน">พร้อมใช้งาน</option><option value="ถูกใช้งาน">ถูกใช้งาน</option><option value="ชำรุดเสียหาย">ชำรุดเสียหาย</option><option value="ไม่สามารถใช้งานได้">ไม่สามารถใช้งานได้</option><option value="รอดำเนินการ">รอดำเนินการ</option>
            </select>
          </React.Fragment>
        )}
        
        {/* ตัวกรองสำหรับ อุปกรณ์เสริม */}
        {activeMenu === 'accessories' && (
          <React.Fragment>
            <select value={accFilterType} onChange={(e) => setAccFilterType(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-1 focus:ring-teal-500 outline-none transition-all shadow-sm cursor-pointer">
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option><option value="เมาส์ (Mouse)">เมาส์ (Mouse)</option><option value="คีย์บอร์ด (Keyboard)">คีย์บอร์ด (Keyboard)</option><option value="อุปกรณ์เสริมโน๊ตบุ๊ค">อุปกรณ์เสริมโน๊ตบุ๊ค</option><option value="หูฟัง (Headset)">หูฟัง (Headset)</option><option value="กระเป๋า (Bag)">กระเป๋าใส่โน๊ตบุ๊ค</option><option value="อื่นๆ">อื่นๆ</option>
            </select>
            <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-slate-100 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all shadow-sm">นำเข้า CSV</button>
            <button onClick={handleExportAccessories} className="flex-1 sm:flex-none w-full sm:w-auto bg-slate-100 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all shadow-sm">ส่งออก CSV</button>
            {selectedAccessoryIds.length > 0 && (
              <button onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedAccessoryIds, collectionName: 'accessories' })} className="flex-1 sm:flex-none w-full sm:w-auto bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm">
                🗑️ ลบที่เลือก ({selectedAccessoryIds.length})
              </button>
            )}
          </React.Fragment>
        )}

        {/* ตัวกรองสำหรับ อุปกรณ์สำนักงาน */}
        {activeMenu === 'office_supplies' && (
          <React.Fragment>
            <select value={officeSupplyStockFilter} onChange={(e) => setOfficeSupplyStockFilter(e.target.value)} className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white focus:ring-1 focus:ring-teal-500 outline-none transition-all shadow-sm cursor-pointer">
              <option value="ทั้งหมด">สถานะสต็อก: ทั้งหมด</option>
              <option value="ปกติ">🟢 ปกติ (&gt; 5)</option>
              <option value="ใกล้หมด">🟡 ใกล้หมด (1-5)</option>
              <option value="หมดสต็อก">🔴 หมดสต็อก (0)</option>
            </select>
            {selectedOfficeSupplyIds.length > 0 && (
              <button onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedOfficeSupplyIds, collectionName: 'office_supplies' })} className="flex-1 sm:flex-none w-full sm:w-auto bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm">
                🗑️ ลบที่เลือก ({selectedOfficeSupplyIds.length})
              </button>
            )}
          </React.Fragment>
        )}

        {/* ปุ่มนำเข้าสำหรับ ทรัพย์สินและ License */}
        {(activeMenu === 'assets' || activeMenu === 'licenses') && (
          <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-slate-100 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all shadow-sm">
            นำเข้า CSV
          </button>
        )}
        
        {/* ปุ่มเพิ่มรายการใหม่ (แสดงทุกเมนูยกเว้นตอนดูพนักงานที่ถูกลบ) */}
        {!showDeletedEmployees && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-black text-teal-400 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg border border-slate-800 whitespace-nowrap">
            + เพิ่มรายการใหม่
          </button>
        )}
      </div>
    </div>
  );
}