import React from 'react';
import { Search, Plus, Columns3, Trash2, Upload, Download, ChevronDown, Sparkles, FileText } from 'lucide-react';
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
  handleExportAssetsPDF,
  handleExportOfficeSupplies,
  visibleAssetColumns,
  setVisibleAssetColumns,
  handleExportLicenses,
  selectedLicenseIds,
  visibleLicenseColumns,
  setVisibleLicenseColumns,
  licenseExpFilter,
  setLicenseExpFilter,
  setIsSnipeITImportOpen,
  canEdit,
  fieldOptions = {},
  selectedAssetIds = [],
  handleExportSelectedAssetsPDF,
  handleDeleteSelectedAssets,
  clearSelectedAssets,
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
    name: 'ชื่ออุปกรณ์', type: 'ประเภท', forDepartment: 'สำหรับแผนก', cost: 'ราคา', status: 'สถานะ',
    assetTag: 'รหัสทรัพย์สิน', sn: 'Serial Number', model: 'ยี่ห้อ/รุ่น', vendor: 'ผู้จัดจำหน่าย', company: 'บริษัท',
    purchaseDate: 'วันที่ซื้อ', warrantyDate: 'วันหมด Warranty', assignedName: 'ผู้ครอบครอง',
    note: 'หมายเหตุ',
    remark: 'Remark',
    age: 'อายุการใช้งาน',
    scrapValue: 'ราคาปัจจุบัน',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pb-5 shrink-0">
      {/* Controls — เอา title ออก (ซ้ำกับ TopHeader) */}
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" strokeWidth={2} />
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] hover:border-slate-300 w-48"
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
                <Btn icon={Upload} onClick={() => setIsImportModalOpen(true)}>นำเข้า</Btn>
                <Btn icon={Download} onClick={handleExportEmployees}>CSV</Btn>
                {selectedEmployeeIds.length > 0 && (
                  <DangerBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedEmployeeIds, collectionName: 'employees' })}>
                    ลบ ({selectedEmployeeIds.length})
                  </DangerBtn>
                )}
              </>
            )}
          </>
        )}

        {/* ── Assets / ครุภัณฑ์ (ใช้ toolbar เดียวกัน) ── */}
        {(activeMenu === 'assets' || activeMenu === 'furniture') && (
          <>
            <MultiSelectFilter
              label="สำหรับแผนก"
              selected={assetFilterDepartment}
              onChange={setAssetFilterDepartment}
              options={(fieldOptions.forDepartments || []).map(opt => ({ value: opt, label: opt }))}
            />
            {/* ประเภท + สถานะ — ซ่อนในเมนูครุภัณฑ์ */}
            {activeMenu !== 'furniture' && (
              <>
                <MultiSelectFilter
                  label="ประเภท"
                  selected={assetFilterType}
                  onChange={setAssetFilterType}
                  options={[
                    { value: 'คอมพิวเตอร์',     label: 'คอมพิวเตอร์' },
                    { value: 'โน๊ตบุ๊ค',         label: 'โน๊ตบุ๊ค' },
                    { value: 'หน้าจอ',           label: 'หน้าจอ' },
                    { value: 'แท็บเล็ต/มือถือ', label: 'แท็บเล็ต / มือถือ' },
                    { value: 'ทีวี',             label: 'ทีวี' },
                    { value: 'ปริ้นเตอร์',       label: 'ปริ้นเตอร์' },
                    { value: 'อุปกรณ์ IT',       label: 'อุปกรณ์ IT' },
                    { value: 'อุปกรณ์สำนักงาน',  label: 'อุปกรณ์สำนักงาน' },
                    { value: 'อุปกรณ์เครือข่าย', label: 'อุปกรณ์เครือข่าย' },
                    { value: 'อื่นๆ',            label: 'อื่นๆ' },
                  ]}
                />
                <MultiSelectFilter
                  label="สถานะ"
                  selected={assetFilterStatus}
                  onChange={setAssetFilterStatus}
                  options={[
                    { value: 'พร้อมใช้งาน',       label: 'พร้อมใช้งาน' },
                    { value: 'ถูกใช้งาน',         label: 'ถูกใช้งาน' },
                    { value: 'สำรอง',             label: 'สำรอง' },
                    { value: 'ชำรุดเสียหาย',      label: 'ชำรุดเสียหาย' },
                    { value: 'ไม่สามารถใช้งานได้',  label: 'ไม่สามารถใช้งานได้' },
                    { value: 'รอดำเนินการ',       label: 'รอดำเนินการ' },
                    { value: 'ตัดจำหน่าย',        label: 'ตัดจำหน่าย' },
                  ]}
                />
              </>
            )}

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

            {canEdit && <Btn icon={Download} onClick={handleExportAssets}>CSV</Btn>}
            {canEdit && handleExportAssetsPDF && (
              <Btn icon={FileText} onClick={handleExportAssetsPDF}>PDF ทั้งหมด</Btn>
            )}
            {/* 🆕 พิมพ์ PDF เฉพาะที่ติ๊กเลือก (ขึ้นเมื่อเลือก ≥ 1) */}
            {canEdit && selectedAssetIds.length > 0 && (
              <>
                {handleExportSelectedAssetsPDF && (
                  <button
                    onClick={handleExportSelectedAssetsPDF}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[14px] font-semibold text-white bg-[#1E487A] hover:bg-[#163963] rounded-lg transition-colors whitespace-nowrap"
                    title="พิมพ์ PDF เฉพาะรายการที่เลือก"
                  >
                    <FileText className="h-[14px] w-[14px]" strokeWidth={2} />
                    พิมพ์ที่เลือก ({selectedAssetIds.length})
                  </button>
                )}
                {handleDeleteSelectedAssets && (
                  <button
                    onClick={handleDeleteSelectedAssets}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[14px] font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 rounded-lg transition-colors whitespace-nowrap"
                    title="ลบรายการที่เลือกทั้งหมด"
                  >
                    <Trash2 className="h-[14px] w-[14px]" strokeWidth={2} />
                    ลบที่เลือก ({selectedAssetIds.length})
                  </button>
                )}
                {clearSelectedAssets && (
                  <button
                    onClick={clearSelectedAssets}
                    className="text-[12.5px] font-semibold text-slate-400 hover:text-rose-600 transition-colors underline decoration-slate-300 hover:decoration-rose-400 underline-offset-2 whitespace-nowrap"
                    title="ล้างรายการที่เลือก"
                  >
                    ล้าง
                  </button>
                )}
              </>
            )}
            {canEdit && <Btn icon={Upload} onClick={() => setIsImportModalOpen(true)}>นำเข้า</Btn>}
          </>
        )}

        {/* ── Accessories ── */}
        {activeMenu === 'accessories' && (
          <>
            <MultiSelectFilter
              label="ประเภท"
              selected={accFilterType}
              onChange={setAccFilterType}
              options={[
                { value: 'เมาส์ (Mouse)',       label: 'เมาส์' },
                { value: 'คีย์บอร์ด (Keyboard)', label: 'คีย์บอร์ด' },
                { value: 'อื่นๆ',                label: 'อื่นๆ' },
              ]}
            />
            {canEdit && <Btn icon={Download} onClick={handleExportAccessories}>CSV</Btn>}
            {canEdit && <Btn icon={Upload} onClick={() => setIsImportModalOpen(true)}>นำเข้า</Btn>}
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
            {canEdit && <Btn icon={Download} onClick={handleExportOfficeSupplies}>CSV</Btn>}
            {canEdit && <Btn icon={Upload} onClick={() => setIsImportModalOpen(true)}>นำเข้า</Btn>}
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
            <MultiSelectFilter
              label="วันหมดอายุ"
              selected={licenseExpFilter}
              onChange={setLicenseExpFilter}
              options={[
                { value: 'หมดอายุแล้ว', label: '⚠️ หมดอายุแล้ว' },
                { value: '30',          label: 'ใกล้หมดอายุ ≤ 30 วัน' },
                { value: '60',          label: 'ใกล้หมดอายุ ≤ 60 วัน' },
                { value: '90',          label: 'ใกล้หมดอายุ ≤ 90 วัน' },
                { value: 'ไม่ระบุ',     label: 'ไม่ระบุวันหมดอายุ' },
              ]}
            />
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
            {canEdit && <Btn icon={Download} onClick={handleExportLicenses}>CSV</Btn>}
            {canEdit && <Btn icon={Upload} onClick={() => setIsImportModalOpen(true)}>นำเข้า</Btn>}
            {canEdit && setIsSnipeITImportOpen && (
              <button
                onClick={() => setIsSnipeITImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-colors"
                title="Smart Import จาก Snipe-IT CSV"
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                Snipe-IT Import
              </button>
            )}
            {canEdit && selectedLicenseIds?.length > 0 && (
              <DangerBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: selectedLicenseIds, collectionName: 'licenses' })}>
                ลบ ({selectedLicenseIds.length})
              </DangerBtn>
            )}
          </>
        )}

        {/* Add button — brand primary (v2 CTA) */}
        {canEdit && !showDeletedEmployees && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#1E487A] hover:bg-[#163963] rounded-lg transition-colors whitespace-nowrap"
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
          ? 'bg-[#1E487A] text-white border border-[#1E487A]'
          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
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
      className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors whitespace-nowrap"
    >
      <Trash2 className="h-[14px] w-[14px]" strokeWidth={1.9} />
      {children}
    </button>
  );
}

/* ─── MultiSelectFilter — checkbox dropdown (เลือกได้หลายตัว) ───
   - selected: array | undefined
   - empty array = ไม่มี filter (= ทั้งหมด)
*/
function MultiSelectFilter({ label, options, selected = [], onChange }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value));
    else onChange([...selected, value]);
  };
  const clear = (e) => { e.stopPropagation(); onChange([]); };

  let displayText;
  if (selected.length === 0)       displayText = `${label}: ทั้งหมด`;
  else if (selected.length === 1)  displayText = `${label}: ${options.find(o => o.value === selected[0])?.label || selected[0]}`;
  else                             displayText = `${label}: ${selected.length} รายการ`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 pl-3 pr-2.5 py-2 text-[14px] font-medium rounded-lg transition-colors whitespace-nowrap
          ${selected.length > 0
            ? 'bg-[#1E487A]/8 text-[#1E487A] border border-[#1E487A]/30 hover:bg-[#1E487A]/15'
            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
      >
        <span>{displayText}</span>
        {selected.length > 1 && (
          <span className="text-[10.5px] font-bold bg-[#1E487A] text-white px-1.5 py-0.5 rounded">
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" strokeWidth={2.2} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1.5 left-0 bg-white rounded-xl border border-slate-200 shadow-[0_10px_28px_-16px_rgba(16,47,87,0.12)] p-2 z-50 min-w-[240px] max-h-[320px] overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.1em]">{label}</span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="text-[11px] font-medium text-[#1E487A] hover:underline"
              >
                ล้าง
              </button>
            )}
          </div>
          {options.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A] cursor-pointer"
              />
              <span className="text-[13.5px] text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-[14px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium outline-none transition-colors cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-[#1E487A]/30 focus:ring-offset-0"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" strokeWidth={2} />
    </div>
  );
}

function ColumnPicker({ labels, visible, onToggle, lockedKey }) {
  return (
    <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-lg shadow-[0_10px_28px_-16px_rgba(16,47,87,0.12)] z-50 p-2 space-y-0.5 max-h-72 overflow-y-auto">
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
