import React from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { text } from '../../ui/earth.js';
import { CellTitle, Clamp } from '../../ui/earthUI.jsx';
import ListPage from '../list/ListPage.jsx';
import { brandsText } from '../../utils/brands.js';
import { EMP_LEFT, upcomingResignDate } from '../../utils/employeeStatus.js';
import { formatDateShort } from '../../utils/formatDate.js';

/* ════════════════════════════════════════════════════════════════
   หน้ารายการพนักงาน — ธีม v3 · config ของ ListPage

   5 คอลัมน์หลัก — ชื่อ (รหัส + ชื่อเล่นเป็นบรรทัดรอง) / ตำแหน่ง / แผนก / แบรนด์ที่ดูแล / บริษัท
   คนที่ออกแล้ว (ลบแล้ว หรือถึงวันที่ออก) อยู่ในรายการเดียวกัน — ป้าย "ออกแล้ว" · ตั้งวันที่ออกล่วงหน้า = ป้าย "จะออก …"
   กรองด้วยตัวกรองสถานะ (เดิมแยกเป็นปุ่มถังขยะ) · เมนูแถวของคนที่ออกแล้ว = กู้คืน / ลบถาวร
   ════════════════════════════════════════════════════════════════ */

const buildColumns = (statusOf, today) => [
  {
    key: 'name', label: 'ชื่อพนักงาน',
    render: e => (
      <div className="flex min-w-0 items-center gap-2">
        <CellTitle
          title={e.fullName}
          sub={[e.empId, e.nickname && `(${e.nickname})`].filter(Boolean).join(' · ')}
        />
        {statusOf(e) === EMP_LEFT
          ? <span className="shrink-0 rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">ออกแล้ว</span>
          : upcomingResignDate(e, today) && (
            <span className="shrink-0 rounded-lg bg-ochre-50 px-2 py-0.5 text-xs font-medium text-ochre-700">จะออก {formatDateShort(upcomingResignDate(e, today))}</span>
          )}
      </div>
    ),
  },
  { key: 'position', label: 'ตำแหน่ง', width: 'w-52', cellClass: 'text-sm text-stone-600', render: e => <Clamp width={200}>{e.position || '—'}</Clamp> },
  { key: 'department', label: 'แผนก', width: 'w-52', cellClass: 'text-sm text-stone-600', render: e => <Clamp width={200}>{e.department || '—'}</Clamp> },
  { key: 'brands', label: 'แบรนด์ที่ดูแล', width: 'w-44', cellClass: 'text-sm text-stone-600', render: e => <Clamp width={170}>{brandsText(e.brands) || '—'}</Clamp> },
  {
    key: 'company', label: 'บริษัท', width: 'w-44',
    render: e => (e.company ? <span className="text-sm text-stone-600">{e.company}</span> : <span className={text.faint}>—</span>),
  },
];

export default function EmployeeListPage({
  rows, totalCount,
  searchTerm, onSearchChange,
  filterStatus = [], onFilterStatusChange, statusOptions = [],
  filterDepartment = [], onFilterDepartmentChange, departmentOptions = [],
  isLeft = () => false,          // อยู่ใน deleted_employees → เมนูแถว กู้คืน / ลบถาวร
  statusOf = () => '',           // สถานะที่แสดง (ลบแล้ว หรือถึงวันที่ออก = ออกแล้ว)
  today,
  page, pageSize, onPageChange,
  selectedIds = [], onSelect, onSelectAll, onClearSelection, onBulkDelete,
  onAdd, onExportCsv, onImport,
  onOpen, onEdit, onDelete, onRestore, onPermanentDelete,
  canEdit = false,
}) {
  const columns = React.useMemo(() => buildColumns(statusOf, today), [statusOf, today]);
  return (
    <ListPage
      title="พนักงาน"
      rows={rows}
      totalCount={totalCount}
      unit="คน"
      emptyText="ไม่พบพนักงานที่ตรงกับเงื่อนไข"
      columns={columns}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="ค้นหา ชื่อ / รหัสพนักงาน"
      filters={[
        { key: 'status', label: 'สถานะ', selected: filterStatus, options: statusOptions, onChange: onFilterStatusChange },
        { key: 'dept', label: 'แผนก', selected: filterDepartment, options: departmentOptions, onChange: onFilterDepartmentChange },
      ]}
      page={page} pageSize={pageSize} onPageChange={onPageChange}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      onClearSelection={onClearSelection}
      bulkActions={[
        onExportCsv && { key: 'csv', label: 'ส่งออก CSV ที่เลือก', onSelect: onExportCsv },
        canEdit && onBulkDelete && { key: 'del', label: 'ลบที่เลือก', tone: 'danger', onSelect: onBulkDelete },
      ].filter(Boolean)}
      toolbar={[
        onExportCsv && { key: 'csv', label: 'CSV', icon: <Download className="size-5" strokeWidth={2} />, onSelect: onExportCsv },
        canEdit && onImport && { key: 'imp', label: 'นำเข้า', icon: <Upload className="size-5" strokeWidth={2} />, onSelect: onImport },
        canEdit && onAdd && { key: 'add', label: 'เพิ่มพนักงาน', icon: <Plus className="size-5" strokeWidth={2} />, onSelect: onAdd, primary: true },
      ].filter(Boolean)}
      onOpen={onOpen}
      rowActions={(item) => {
        if (!canEdit) return [];
        if (isLeft(item)) {
          return [
            { key: 'restore', label: 'กู้คืน', onSelect: () => onRestore?.(item) },
            { key: 'purge', label: 'ลบถาวร', tone: 'danger', onSelect: () => onPermanentDelete?.(item) },
          ];
        }
        return [
          { key: 'edit', label: 'แก้ไข', onSelect: () => onEdit?.(item) },
          { key: 'delete', label: 'ลบ', tone: 'danger', onSelect: () => onDelete?.(item) },
        ];
      }}
    />
  );
}
