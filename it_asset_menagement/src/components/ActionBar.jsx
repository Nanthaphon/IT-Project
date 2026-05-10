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
  setIsAddModalOpen,
  handleExportAssets,          
  visibleAssetColumns,         
  setVisibleAssetColumns       
}) {
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = React.useState(false);
  const columnDropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target)) {
        setIsColumnDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (col) => {
    setVisibleAssetColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const columnLabels = {
    name: 'ชื่ออุปกรณ์', type: 'ประเภท', department: 'แผนก', cost: 'ราคา', status: 'สถานะ',
    assetTag: 'รหัสทรัพย์สิน', sn: 'Serial Number', model: 'ยี่ห้อ/รุ่น', vendor: 'ผู้จัดจำหน่าย', company: 'บริษัท',
    purchaseDate: 'วันที่ซื้อ', warrantyDate: 'วันที่หมด Warranty', assignedName: 'ผู้ครอบครอง'
  };

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-slate-200 pb-6 shrink-0">
      <h3 className="text-xl font-black text-[#1E487A] flex items-center gap-3 whitespace-nowrap">
        <span className="p-2 bg-blue-50 text-[#1E487A] rounded-xl shadow-sm border border-blue-100">📦</span> 
        รายการ {menuTitle}
      </h3>
      
      <div className="flex flex-wrap w-full xl:w-auto gap-3 items-center sm:justify-end">
        
        {/* ช่องค้นหา */}
        <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="ค้นหาชื่อ หรือ รหัส..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-300 text-slate-800 rounded-full text-sm font-medium focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all shadow-sm" 
          />
        </div>
        
        {/* ตัวกรองพนักงาน */}
        {activeMenu === 'employees' && (
          <React.Fragment>
            <button onClick={() => setShowDeletedEmployees(!showDeletedEmployees)} className={`flex-1 sm:flex-none w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm border ${showDeletedEmployees ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-[#1E487A]'}`}>
              {showDeletedEmployees ? 'ดูพนักงานปัจจุบัน' : 'ถังขยะพนักงาน'}
            </button>
            {!showDeletedEmployees && (
              <React.Fragment>
                <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-white text-slate-600 border border-slate-300 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-50 hover:text-[#1E487A] transition-all shadow-sm">นำเข้า CSV</button>
                <button onClick={handleExportEmployees} className="flex-1 sm:flex-none w-full sm:w-auto bg-white text-slate-600 border border-slate-300 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-50 hover:text-[#1E487A] transition-all shadow-sm">ส่งออก CSV</button>
                {selectedEmployeeIds.length > 0 && (
                  <button onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedEmployeeIds, collectionName: 'employees' })} className="flex-1 sm:flex-none w-full sm:w-auto bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm">
                    🗑️ ลบที่เลือก ({selectedEmployeeIds.length})
                  </button>
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        )}
        
        {/* ตัวกรองทรัพย์สินหลัก */}
        {activeMenu === 'assets' && (
          <React.Fragment>
            <select value={assetFilterDepartment} onChange={(e) => setAssetFilterDepartment(e.target.value)} className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 font-bold px-4 py-2.5 rounded-full text-sm hover:bg-slate-50 focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all shadow-sm cursor-pointer">
              <option value="ทั้งหมด">แผนก: ทั้งหมด</option><option value="DX">DX</option><option value="BD">BD</option><option value="General">General</option>
            </select>
            <select value={assetFilterType} onChange={(e) => setAssetFilterType(e.target.value)} className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 font-bold px-4 py-2.5 rounded-full text-sm hover:bg-slate-50 focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all shadow-sm cursor-pointer">
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option><option value="คอมพิวเตอร์">คอมพิวเตอร์</option><option value="หน้าจอ">หน้าจอ</option><option value="แท็บเล็ต/มือถือ">แท็บเล็ต / มือถือ</option><option value="อื่นๆ">อื่นๆ</option>
            </select>
            <select value={assetFilterStatus} onChange={(e) => setAssetFilterStatus(e.target.value)} className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 font-bold px-4 py-2.5 rounded-full text-sm hover:bg-slate-50 focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all shadow-sm cursor-pointer">
              <option value="ทั้งหมด">สถานะ: ทั้งหมด</option><option value="พร้อมใช้งาน">พร้อมใช้งาน</option><option value="ถูกใช้งาน">ถูกใช้งาน</option><option value="ชำรุดเสียหาย">ชำรุดเสียหาย</option>
            </select>

            <div className="relative" ref={columnDropdownRef}>
              <button 
                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 font-bold px-4 py-2.5 rounded-full text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                คอลัมน์ ▼
              </button>
              {isColumnDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
                  <p className="text-xs font-bold text-slate-400 mb-1 border-b border-slate-100 pb-2">เลือกคอลัมน์ที่ต้องการแสดง</p>
                  {Object.keys(columnLabels).map(col => (
                    <label key={col} className={`flex items-center gap-3 text-sm font-medium p-2 rounded-lg transition-colors cursor-pointer ${col === 'name' ? 'text-slate-400 bg-slate-50' : 'text-slate-700 hover:bg-blue-50'}`}>
                      <input 
                        type="checkbox" 
                        checked={visibleAssetColumns[col]} 
                        onChange={() => toggleColumn(col)}
                        disabled={col === 'name'} 
                        className="w-4 h-4 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A] disabled:opacity-50 cursor-pointer" 
                      />
                      {columnLabels[col]}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleExportAssets} className="flex-1 sm:flex-none w-full sm:w-auto bg-white text-slate-600 border border-slate-300 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-50 hover:text-[#1E487A] transition-all shadow-sm">
              ส่งออก CSV
            </button>
          </React.Fragment>
        )}

        {/* ตัวกรองอุปกรณ์เสริม */}
        {activeMenu === 'accessories' && (
          <React.Fragment>
            <select value={accFilterType} onChange={(e) => setAccFilterType(e.target.value)} className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 font-bold px-4 py-2.5 rounded-full text-sm hover:bg-slate-50 focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all shadow-sm cursor-pointer">
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option><option value="เมาส์ (Mouse)">เมาส์</option><option value="คีย์บอร์ด (Keyboard)">คีย์บอร์ด</option><option value="อื่นๆ">อื่นๆ</option>
            </select>
            
            {/* 🟢 เพิ่มปุ่มส่งออก CSV ตรงนี้ให้แสดงในหน้า อุปกรณ์เสริม */}
            <button onClick={handleExportAccessories} className="flex-1 sm:flex-none w-full sm:w-auto bg-white text-slate-600 border border-slate-300 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-50 hover:text-[#1E487A] transition-all shadow-sm">
              ส่งออก CSV
            </button>

            {selectedAccessoryIds.length > 0 && (
              <button onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedAccessoryIds, collectionName: 'accessories' })} className="flex-1 sm:flex-none w-full sm:w-auto bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-red-600 hover:text-white transition-all">
                🗑️ ลบที่เลือก ({selectedAccessoryIds.length})
              </button>
            )}
          </React.Fragment>
        )}
        
        {/* ตัวกรองสำหรับ อุปกรณ์สำนักงาน */}
        {activeMenu === 'office_supplies' && (
          <React.Fragment>
            <select value={officeSupplyStockFilter} onChange={(e) => setOfficeSupplyStockFilter(e.target.value)} className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 font-bold px-4 py-2.5 rounded-full text-sm hover:bg-slate-50 focus:ring-2 focus:ring-[#1E487A] focus:border-[#1E487A] outline-none transition-all shadow-sm cursor-pointer">
              <option value="ทั้งหมด">สถานะสต็อก: ทั้งหมด</option>
              <option value="ปกติ">🟢 ปกติ (&gt; 5)</option>
              <option value="ใกล้หมด">🟡 ใกล้หมด (1-5)</option>
              <option value="หมดสต็อก">🔴 หมดสต็อก (0)</option>
            </select>
            {selectedOfficeSupplyIds.length > 0 && (
              <button onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedOfficeSupplyIds, collectionName: 'office_supplies' })} className="flex-1 sm:flex-none w-full sm:w-auto bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm">
                🗑️ ลบที่เลือก ({selectedOfficeSupplyIds.length})
              </button>
            )}
          </React.Fragment>
        )}

        {/* ปุ่มนำเข้าสำหรับ ทรัพย์สินและ License */}
        {(activeMenu === 'assets' || activeMenu === 'licenses') && (
          <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-white text-slate-600 border border-slate-300 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-50 hover:text-[#1E487A] transition-all shadow-sm">
            นำเข้า CSV
          </button>
        )}

        {/* ปุ่มเพิ่มรายการใหม่ (สีน้ำเงินองค์กร) */}
        {!showDeletedEmployees && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto bg-[#1E487A] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#133257] transition-all shadow-md shadow-[#1E487A]/30 whitespace-nowrap">
            + เพิ่มรายการใหม่
          </button>
        )}
      </div>
    </div>
  );
}