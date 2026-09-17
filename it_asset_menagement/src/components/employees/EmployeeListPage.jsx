import React from 'react';
import { Plus, Download, Upload, Trash2, Undo2 } from 'lucide-react';
import { text } from '../../ui/earth.js';
import { CellTitle } from '../../ui/earthUI.jsx';
import ListPage from '../list/ListPage.jsx';

/* ════════════════════════════════════════════════════════════════
   หน้ารายการพนักงาน — ธีม v3 · config ของ ListPage

   4 คอลัมน์หลัก — ชื่อ (รหัส + ชื่อเล่นเป็นบรรทัดรอง) / ตำแหน่ง / แผนก / บริษัท
   โหมดถังขยะใช้หน้าเดียวกัน แค่สลับชุด action เป็น กู้คืน / ลบถาวร
   ════════════════════════════════════════════════════════════════ */

const COLUMNS = [
  {
    key: 'name', label: 'ชื่อพนักงาน',
    render: e => (
      <CellTitle
        title={e.fullName}
        sub={[e.empId, e.nickname && `(${e.nickname})`].filter(Boolean).join(' · ')}
      />
    ),
  },
  { key: 'position', label: 'ตำแหน่ง', width: 'w-52', cellClass: 'text-sm text-stone-600', render: e => e.position || '—' },
  { key: 'department', label: 'แผนก', width: 'w-52', cellClass: 'text-sm text-stone-600', render: e => e.department || '—' },
  {
    key: 'company', label: 'บริษัท', width: 'w-44',
    render: e => (e.company ? <span className="text-sm text-stone-600">{e.company}</span> : <span className={text.faint}>—</span>),
  },
];

export default function EmployeeListPage({
  rows, totalCount,
  searchTerm, onSearchChange,
  filterDepartment = [], onFilterDepartmentChange, departmentOptions = [],
  page, pageSize, onPageChange,
  selectedIds = [], onSelect, onSelectAll, onClearSelection, onBulkDelete,
  onAdd, onExportCsv, onImport,
  onOpen, onEdit, onDelete,
  /* โหมดถังขยะ */
  showDeleted = false, onToggleDeleted, onRestore, onPermanentDelete,
  canEdit = false,
}) {
  return (
    <ListPage
      title={showDeleted ? 'พนักงาน — ถังขยะ' : 'พนักงาน'}
      rows={rows}
      totalCount={totalCount}
      unit="คน"
      emptyText={showDeleted ? 'ถังขยะว่าง' : 'ไม่พบพนักงานที่ตรงกับเงื่อนไข'}
      columns={COLUMNS}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="ค้นหา ชื่อ / รหัสพนักงาน"
      filters={[
        { key: 'dept', label: 'แผนก', selected: filterDepartment, options: departmentOptions, onChange: onFilterDepartmentChange },
      ]}
      page={page} pageSize={pageSize} onPageChange={onPageChange}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      onClearSelection={onClearSelection}
      bulkActions={canEdit && onBulkDelete && !showDeleted
        ? [{ key: 'del', label: 'ลบที่เลือก', tone: 'danger', onSelect: onBulkDelete }]
        : []}
      toolbar={[
        onToggleDeleted && {
          key: 'trash',
          label: showDeleted ? 'กลับหน้ารายชื่อ' : 'ถังขยะ',
          icon: showDeleted
            ? <Undo2 className="size-5" strokeWidth={1.75} />
            : <Trash2 className="size-5" strokeWidth={1.75} />,
          onSelect: () => onToggleDeleted(!showDeleted),
        },
        !showDeleted && onExportCsv && { key: 'csv', label: 'CSV', icon: <Download className="size-5" strokeWidth={1.75} />, onSelect: onExportCsv },
        !showDeleted && canEdit && onImport && { key: 'imp', label: 'นำเข้า', icon: <Upload className="size-5" strokeWidth={1.75} />, onSelect: onImport },
        !showDeleted && canEdit && onAdd && { key: 'add', label: 'เพิ่มพนักงาน', icon: <Plus className="size-5" strokeWidth={2} />, onSelect: onAdd, primary: true },
      ].filter(Boolean)}
      onOpen={onOpen}
      rowActions={(item) => {
        if (!canEdit) return [];
        if (showDeleted) {
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
