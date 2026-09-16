import React from 'react';
import { Plus, Download } from 'lucide-react';
import { text } from '../../ui/earth.js';
import { CellTitle } from '../../ui/earthUI.jsx';
import ListPage from '../list/ListPage.jsx';

/* ════════════════════════════════════════════════════════════════
   หน้ารายการอุปกรณ์เสริม — ธีม v3 · config ของ ListPage

   4 คอลัมน์หลัก — ชื่อ / จำนวน / คงเหลือ / การเบิก
   สูตรคงเหลือยกมาจาก AccessoryTable เดิม: ทั้งหมด − จ่ายออกแล้ว − ชำรุด
   ════════════════════════════════════════════════════════════════ */

const total = (a) => Number(a.quantity) || 0;
const used = (a) => a.assignees?.length || 0;
const broken = (a) => Number(a.brokenQuantity) || 0;
const remain = (a) => total(a) - used(a) - broken(a);

const COLUMNS = [
  { key: 'name', label: 'ชื่ออุปกรณ์', render: a => <CellTitle title={a.name} sub={a.type} /> },
  {
    key: 'qty', label: 'ทั้งหมด', width: 'w-28', align: 'right',
    cellClass: 'text-sm tabular-nums text-stone-600',
    render: a => total(a).toLocaleString('th-TH'),
  },
  {
    key: 'remain', label: 'คงเหลือ', width: 'w-40', align: 'right',
    cellClass: 'tabular-nums',
    render: a => (
      <div className="whitespace-nowrap">
        <p className={`text-sm ${remain(a) <= 0 ? 'font-medium text-rose-600' : 'text-stone-600'}`}>
          {remain(a).toLocaleString('th-TH')}
        </p>
        <p className={`mt-0.5 ${text.faint}`}>
          จ่ายแล้ว {used(a).toLocaleString('th-TH')}
          {broken(a) > 0 && ` · ชำรุด ${broken(a).toLocaleString('th-TH')}`}
        </p>
      </div>
    ),
  },
  {
    key: 'request', label: 'การเบิก', width: 'w-36',
    render: a => (
      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${
        a.requestDisabled ? 'bg-stone-100 text-stone-400' : 'bg-olive-50 text-olive-700'
      }`}
      >
        {a.requestDisabled ? 'ปิดเบิก' : 'เปิดเบิก'}
      </span>
    ),
  },
];

export default function AccessoryListPage({
  rows, totalCount,
  searchTerm, onSearchChange,
  filterType = [], onFilterTypeChange, typeOptions = [],
  page, pageSize, onPageChange,
  selectedIds = [], onSelect, onSelectAll, onClearSelection, onBulkDelete,
  onAdd, onExportCsv,
  onOpen, onEdit, onCheckout, onDelete,
  canEdit = false,
}) {
  return (
    <ListPage
      title="อุปกรณ์เสริม"
      rows={rows}
      totalCount={totalCount}
      unit="รายการ"
      columns={COLUMNS}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="ค้นหา ชื่ออุปกรณ์"
      filters={[
        { key: 'type', label: 'ประเภท', selected: filterType, options: typeOptions, onChange: onFilterTypeChange },
      ]}
      page={page} pageSize={pageSize} onPageChange={onPageChange}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      onClearSelection={onClearSelection}
      bulkActions={canEdit && onBulkDelete
        ? [{ key: 'del', label: 'ลบที่เลือก', tone: 'danger', onSelect: onBulkDelete }]
        : []}
      toolbar={[
        onExportCsv && { key: 'csv', label: 'CSV', icon: <Download className="size-5" strokeWidth={1.75} />, onSelect: onExportCsv },
        canEdit && onAdd && { key: 'add', label: 'เพิ่มอุปกรณ์เสริม', icon: <Plus className="size-5" strokeWidth={2} />, onSelect: onAdd, primary: true },
      ].filter(Boolean)}
      onOpen={onOpen}
      /* จ่ายออกได้เฉพาะตอนยังมีของเหลือ */
      rowActions={(item) => (!canEdit ? [] : [
        remain(item) > 0 && { key: 'checkout', label: 'จ่ายออก', onSelect: () => onCheckout?.(item) },
        { key: 'edit', label: 'แก้ไข', onSelect: () => onEdit?.(item) },
        { key: 'delete', label: 'ลบ', tone: 'danger', onSelect: () => onDelete?.(item) },
      ].filter(Boolean))}
    />
  );
}
