import React from 'react';
import { Search, Plus, Columns3, Trash2, Upload, Download, ChevronDown } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

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
  handleExportOfficeSupplies,
  visibleAssetColumns,
  setVisibleAssetColumns,
  handleExportLicenses,
  selectedLicenseIds,
  visibleLicenseColumns,
  setVisibleLicenseColumns,
  canEdit,
  fieldOptions = {},
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-5 border-b border-slate-200 shrink-0">
      {/* Title */}
      <p className="text-[14.5px] font-semibold text-slate-700 whitespace-nowrap tracking-tight">
        รายการ{menuTitle}
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" strokeWidth={2} />
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] hover:border-slate-300 w-48"
          />
        </div>

        {/* ── Employees ── */}
        {activeMenu === 'employees' && (
          <>
            {canEdit && (
              <Btn onClick={() => setShowDeletedEmployees(!showDeletedEmployees)} active={showDeletedEmployees}>
                {showDeletedEmployees ? 'พนักงานปัจจุบัน' : 'ถังขยะ'}
              </Btn>
            )}
            {canEdit && !showDeletedEmployees && (
              <>
                <Btn icon={Upload} onClick={() => setIsImportModalOpen(true)}>นำเข้า CSV</Btn>
                <Btn icon={Download} onClick={handleExportEmployees}>ส่งออก CSV</Btn>
                {selectedEmployeeIds.length > 0 && (
                  <DangerBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedEmployeeIds, collectionName: 'employees' })}>
                    ลบ ({selectedEmployeeIds.length})
                  </DangerBtn>
                )}
              </>
            )}
          </>
        )}

        {/* ── Assets ── */}
        {activeMenu === 'assets' && (
          <>
            <FilterSelect value={assetFilterDepartment} onChange={setAssetFilterDepartment}>
              <option value="ทั้งหมด">สำหรับแผนก: ทั้งหมด</option>
              {(fieldOptions.forDepartments || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
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

            <div className="relative" ref={columnDropdownRef}>
              <Btn icon={Columns3} onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}>
                คอลัมน์
              </Btn>
              {isColumnDropdownOpen && (
                <ColumnPicker
                  labels={columnLabels}
                  visible={visibleAssetColumns}
                  onToggle={toggleColumn}
                  lockedKey="name"
                />
              )}
            </div>

            {canEdit && <Btn icon={Download} onClick={handleExportAssets}>ส่งออก CSV</Btn>}
            {canEdit && <Btn icon={Upload} onClick={() => setIsImportModalOpen(true)}>นำเข้า CSV</Btn>}
          </>
        )}

        {/* ── Accessories ── */}
        {activeMenu === 'accessories' && (
          <>
            <FilterSelect value={accFilterType} onChange={setAccFilterType}>
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
              <option value="เมาส์ (Mouse)">เมาส์</option>
              <option value="คีย์บอร์ด (Keyboard)">คีย์บอร์ด</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </FilterSelect>
            {canEdit && <Btn icon={Download} onClick={handleExportAccessories}>ส่งออก CSV</Btn>}
            {canEdit && <Btn icon={Upload} onClick={() => setIsImportModalOpen(true)}>นำเข้า CSV</Btn>}
            {canEdit && selectedAccessoryIds.length > 0 && (
              <DangerBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedAccessoryIds, collectionName: 'accessories' })}>
                ลบ ({selectedAccessoryIds.length})
              </DangerBtn>
            )}
          </>
        )}

        {/* ── Office supplies ── */}
        {activeMenu === 'office_supplies' && (
          <>
            <FilterSelect value={officeSupplyStockFilter} onChange={setOfficeSupplyStockFilter}>
              <option value="ทั้งหมด">สต็อก: ทั้งหมด</option>
              <option value="ปกติ">ปกติ (&gt; 5)</option>
              <option value="ใกล้หมด">ใกล้หมด (1–5)</option>
              <option value="หมดสต็อก">หมดสต็อก (0)</option>
            </FilterSelect>
            {canEdit && <Btn icon={Download} onClick={handleExportOfficeSupplies}>ส่งออก CSV</Btn>}
            {canEdit && <Btn icon={Upload} onClick={() => setIsImportModalOpen(true)}>นำเข้า CSV</Btn>}
            {canEdit && selectedOfficeSupplyIds.length > 0 && (
              <DangerBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedOfficeSupplyIds, collectionName: 'office_supplies' })}>
                ลบ ({selectedOfficeSupplyIds.length})
              </DangerBtn>
            )}
          </>
        )}

        {/* ── Licenses ── */}
        {activeMenu === 'licenses' && (
          <>
            <div className="relative" ref={licenseColumnDropdownRef}>
              <Btn icon={Columns3} onClick={() => setIsLicenseColumnDropdownOpen(!isLicenseColumnDropdownOpen)}>
                คอลัมน์
              </Btn>
              {isLicenseColumnDropdownOpen && (
                <ColumnPicker
                  labels={licenseColumnLabels}
                  visible={visibleLicenseColumns || {}}
                  onToggle={toggleLicenseColumn}
                  lockedKey="name"
                />
              )}
            </div>
            {canEdit && <Btn icon={Download} onClick={handleExportLicenses}>ส่งออก CSV</Btn>}
            {canEdit && <Btn icon={Upload} onClick={() => setIsImportModalOpen(true)}>นำเข้า CSV</Btn>}
            {canEdit && selectedLicenseIds?.length > 0 && (
              <DangerBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedLicenseIds, collectionName: 'licenses' })}>
                ลบ ({selectedLicenseIds.length})
              </DangerBtn>
            )}
          </>
        )}

        {/* Add button — brand primary */}
        {canEdit && !showDeletedEmployees && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all whitespace-nowrap shadow-sm hover:shadow-md"
            style={{ background: BRAND.primary, boxShadow: `0 4px 12px ${BRAND.primary}33` }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.primaryDark)}
            onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.primary)}
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            เพิ่มรายการ
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ── */
function Btn({ onClick, children, active, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium rounded-lg transition-colors whitespace-nowrap
        ${active
          ? 'bg-[#1E487A] text-white ring-1 ring-[#1E487A]'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300 hover:text-slate-900 hover:bg-slate-50'
        }`}
    >
      {Icon && <Icon className="h-[14px] w-[14px]" strokeWidth={1.9} />}
      {children}
    </button>
  );
}

function DangerBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium rounded-lg ring-1 ring-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:ring-rose-600 transition-colors whitespace-nowrap"
    >
      <Trash2 className="h-[14px] w-[14px]" strokeWidth={1.9} />
      {children}
    </button>
  );
}

function FilterSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-[14px] bg-white ring-1 ring-slate-200 rounded-lg text-slate-700 font-medium outline-none transition-colors cursor-pointer hover:ring-slate-300 focus:ring-2 focus:ring-[#1E487A]/30 focus:ring-offset-0"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" strokeWidth={2} />
    </div>
  );
}

function ColumnPicker({ labels, visible, onToggle, lockedKey }) {
  return (
    <div className="absolute right-0 mt-1.5 w-56 bg-white ring-1 ring-slate-200 rounded-xl shadow-xl shadow-slate-950/10 z-50 p-2 space-y-0.5 max-h-72 overflow-y-auto">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em] px-2 py-1">แสดงคอลัมน์</p>
      {Object.keys(labels).map(col => (
        <label
          key={col}
          className={`flex items-center gap-2.5 text-[14px] px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
            col === lockedKey ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'
          }`}
        >
          <input
            type="checkbox"
            checked={visible[col] ?? true}
            onChange={() => onToggle(col)}
            disabled={col === lockedKey}
            className="w-3.5 h-3.5 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A] focus:ring-offset-0"
          />
          <span className="text-slate-700 font-medium">{labels[col]}</span>
        </label>
      ))}
    </div>
  );
}
