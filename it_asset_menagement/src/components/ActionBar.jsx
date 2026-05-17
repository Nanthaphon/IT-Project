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
  setVisibleAssetColumns,
  handleExportLicenses,
  selectedLicenseIds,
  visibleLicenseColumns,
  setVisibleLicenseColumns,
}) {
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = React.useState(false);
  const columnDropdownRef = React.useRef(null);
  const [isLicenseColumnDropdownOpen, setIsLicenseColumnDropdownOpen] = React.useState(false);
  const licenseColumnDropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target)) setIsColumnDropdownOpen(false);
      if (licenseColumnDropdownRef.current && !licenseColumnDropdownRef.current.contains(event.target)) setIsLicenseColumnDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (col) => setVisibleAssetColumns(prev => ({ ...prev, [col]: !prev[col] }));
  const toggleLicenseColumn = (col) => setVisibleLicenseColumns(prev => ({ ...prev, [col]: !prev[col] }));
  const licenseColumnLabels = {
    image: 'รูปภาพ', name: 'ชื่อโปรแกรม', productKey: 'Product Key',
    supplier: 'Supplier', purchaseDate: 'วันที่ซื้อ', expirationDate: 'วันหมดอายุ',
    cost: 'ราคา', quantity: 'จำนวนสิทธิ์', status: 'สถานะ',
  };

  const columnLabels = {
    name: 'ชื่ออุปกรณ์', type: 'ประเภท', department: 'แผนก', cost: 'ราคา', status: 'สถานะ',
    assetTag: 'รหัสทรัพย์สิน', sn: 'Serial Number', model: 'ยี่ห้อ/รุ่น', vendor: 'ผู้จัดจำหน่าย', company: 'บริษัท',
    purchaseDate: 'วันที่ซื้อ', warrantyDate: 'วันหมด Warranty', assignedName: 'ผู้ครอบครอง',
  };

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-5 border-b border-slate-200 shrink-0"
    >
      {/* Title */}
      <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">รายการ{menuTitle}</p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] transition w-48"
          />
        </div>

        {/* ── Employees filters ── */}
        {activeMenu === 'employees' && (
          <>
            <Btn
              onClick={() => setShowDeletedEmployees(!showDeletedEmployees)}
              active={showDeletedEmployees}
            >
              {showDeletedEmployees ? 'พนักงานปัจจุบัน' : 'ถังขยะ'}
            </Btn>
            {!showDeletedEmployees && (
              <>
                <Btn onClick={() => setIsImportModalOpen(true)}>นำเข้า CSV</Btn>
                <Btn onClick={handleExportEmployees}>ส่งออก CSV</Btn>
                {selectedEmployeeIds.length > 0 && (
                  <DangerBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedEmployeeIds, collectionName: 'employees' })}>
                    ลบ ({selectedEmployeeIds.length})
                  </DangerBtn>
                )}
              </>
            )}
          </>
        )}

        {/* ── Assets filters ── */}
        {activeMenu === 'assets' && (
          <>
            <FilterSelect value={assetFilterDepartment} onChange={setAssetFilterDepartment}>
              <option value="ทั้งหมด">แผนก: ทั้งหมด</option>
              <option value="DX">DX</option>
              <option value="BD">BD</option>
              <option value="General">General</option>
            </FilterSelect>
            <FilterSelect value={assetFilterType} onChange={setAssetFilterType}>
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
              <option value="คอมพิวเตอร์">คอมพิวเตอร์</option>
              <option value="หน้าจอ">หน้าจอ</option>
              <option value="แท็บเล็ต/มือถือ">แท็บเล็ต / มือถือ</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </FilterSelect>
            <FilterSelect value={assetFilterStatus} onChange={setAssetFilterStatus}>
              <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
              <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
              <option value="ถูกใช้งาน">ถูกใช้งาน</option>
              <option value="ชำรุดเสียหาย">ชำรุดเสียหาย</option>
            </FilterSelect>

            {/* Column picker */}
            <div className="relative" ref={columnDropdownRef}>
              <Btn onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                คอลัมน์
              </Btn>
              {isColumnDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-0.5 max-h-64 overflow-y-auto">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">แสดงคอลัมน์</p>
                  {Object.keys(columnLabels).map(col => (
                    <label
                      key={col}
                      className={`flex items-center gap-2.5 text-sm px-2 py-1.5 rounded-lg cursor-pointer transition ${
                        col === 'name' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={visibleAssetColumns[col]}
                        onChange={() => toggleColumn(col)}
                        disabled={col === 'name'}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
                      />
                      <span className="text-slate-600 font-medium">{columnLabels[col]}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Btn onClick={handleExportAssets}>ส่งออก CSV</Btn>
            <Btn onClick={() => setIsImportModalOpen(true)}>นำเข้า CSV</Btn>
          </>
        )}

        {/* ── Accessories filters ── */}
        {activeMenu === 'accessories' && (
          <>
            <FilterSelect value={accFilterType} onChange={setAccFilterType}>
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
              <option value="เมาส์ (Mouse)">เมาส์</option>
              <option value="คีย์บอร์ด (Keyboard)">คีย์บอร์ด</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </FilterSelect>
            <Btn onClick={handleExportAccessories}>ส่งออก CSV</Btn>
            {selectedAccessoryIds.length > 0 && (
              <DangerBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedAccessoryIds, collectionName: 'accessories' })}>
                ลบ ({selectedAccessoryIds.length})
              </DangerBtn>
            )}
          </>
        )}

        {/* ── Office supplies filters ── */}
        {activeMenu === 'office_supplies' && (
          <>
            <FilterSelect value={officeSupplyStockFilter} onChange={setOfficeSupplyStockFilter}>
              <option value="ทั้งหมด">สต็อก: ทั้งหมด</option>
              <option value="ปกติ">ปกติ (&gt; 5)</option>
              <option value="ใกล้หมด">ใกล้หมด (1–5)</option>
              <option value="หมดสต็อก">หมดสต็อก (0)</option>
            </FilterSelect>
            {selectedOfficeSupplyIds.length > 0 && (
              <DangerBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedOfficeSupplyIds, collectionName: 'office_supplies' })}>
                ลบ ({selectedOfficeSupplyIds.length})
              </DangerBtn>
            )}
          </>
        )}

        {/* ── Licenses controls ── */}
        {activeMenu === 'licenses' && (
          <>
            <div className="relative" ref={licenseColumnDropdownRef}>
              <Btn onClick={() => setIsLicenseColumnDropdownOpen(!isLicenseColumnDropdownOpen)}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                คอลัมน์
              </Btn>
              {isLicenseColumnDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-0.5 max-h-64 overflow-y-auto">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">แสดงคอลัมน์</p>
                  {Object.keys(licenseColumnLabels).map(col => (
                    <label key={col} className={`flex items-center gap-2.5 text-sm px-2 py-1.5 rounded-lg cursor-pointer transition ${col === 'name' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={visibleLicenseColumns?.[col] ?? true} onChange={() => toggleLicenseColumn(col)} disabled={col === 'name'} className="w-3.5 h-3.5 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]" />
                      <span className="text-slate-600 font-medium">{licenseColumnLabels[col]}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <Btn onClick={handleExportLicenses}>ส่งออก CSV</Btn>
            <Btn onClick={() => setIsImportModalOpen(true)}>นำเข้า CSV</Btn>
            {selectedLicenseIds?.length > 0 && (
              <DangerBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedLicenseIds, collectionName: 'licenses' })}>
                ลบ ({selectedLicenseIds.length})
              </DangerBtn>
            )}
          </>
        )}

        {/* ── Add button ── */}
        {!showDeletedEmployees && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1E487A] hover:bg-[#133257] text-white text-sm font-semibold rounded-lg transition whitespace-nowrap"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มรายการ
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Small helper components ── */
function Btn({ onClick, children, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition ${
        active
          ? 'bg-slate-800 text-white border-slate-800'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

function DangerBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      {children}
    </button>
  );
}

function FilterSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#1E487A]/20 focus:border-[#1E487A] transition cursor-pointer"
    >
      {children}
    </select>
  );
}
