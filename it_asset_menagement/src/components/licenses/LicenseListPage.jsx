import React from 'react';
import { Plus, Download } from 'lucide-react';
import { text } from '../../ui/earth.js';
import { StatusBadge, CellTitle } from '../../ui/earthUI.jsx';
import ListPage from '../list/ListPage.jsx';
import { formatDateShort } from '../../utils/formatDate.js';

/* ════════════════════════════════════════════════════════════════
   หน้ารายการโปรแกรม / License — ธีม v3 · config ของ ListPage

   4 คอลัมน์หลัก — ชื่อโปรแกรม / จำนวน seat / วันหมดอายุ / สถานะ
   Product Key, Supplier, ราคา ฯลฯ ย้ายไปเป็นคอลัมน์เสริมที่เปิดเองได้
   (ผูกกับ visibleLicenseColumns เดิมใน App.jsx)
   ════════════════════════════════════════════════════════════════ */

const money = (v) => (Number(v) > 0 ? Number(v).toLocaleString('th-TH') : '');
const used = (l) => l.assignees?.length || 0;
const total = (l) => Number(l.quantity) || 0;
const available = (l) => Math.max(0, total(l) - used(l));

const OPTIONAL_COLUMNS = [
  { key: 'productKey', label: 'Product Key', render: l => l.productKey || l.keyCode },
  { key: 'supplier', label: 'Supplier', render: l => l.supplier },
  { key: 'cost', label: 'ราคา', align: 'right', render: l => money(l.cost) },
  { key: 'purchaseDate', label: 'วันที่ซื้อ', render: l => formatDateShort(l.purchaseDate) },
];

/* `expiry` มาจาก checkLicenseExpiration เดิมของ App.jsx — ส่งเข้ามาเป็นฟังก์ชัน
   เพื่อไม่ให้หน้านี้ไปคำนวณวันหมดอายุซ้ำ (ตรรกะอยู่ที่เดียว) */
const buildColumns = (checkExpiration) => [
  {
    key: 'name', label: 'ชื่อโปรแกรม',
    render: l => <CellTitle title={l.name} sub={l.supplier} />,
  },
  {
    key: 'seats', label: 'จำนวน', width: 'w-32', align: 'right',
    cellClass: 'tabular-nums',
    render: l => (
      <div className="whitespace-nowrap">
        <p className="text-sm text-stone-600">
          {used(l).toLocaleString('th-TH')} / {total(l).toLocaleString('th-TH')}
        </p>
        <p className={`mt-0.5 ${text.faint}`}>เหลือ {available(l).toLocaleString('th-TH')}</p>
      </div>
    ),
  },
  {
    key: 'expiration', label: 'วันหมดอายุ', width: 'w-44',
    render: (l) => {
      if (!l.expirationDate) return <span className={text.faint}>—</span>;
      const ex = checkExpiration?.(l.expirationDate);
      return (
        <div className="whitespace-nowrap">
          <p className="text-sm text-stone-600">{formatDateShort(l.expirationDate)}</p>
          {ex?.statusText && (
            <p className="mt-0.5 text-[13px] font-medium text-clay-600">{ex.statusText}</p>
          )}
        </div>
      );
    },
  },
  { key: 'status', label: 'สถานะ', width: 'w-36', render: l => <StatusBadge status={l.status || 'พร้อมใช้งาน'} /> },
];

export default function LicenseListPage({
  rows, totalCount,
  searchTerm, onSearchChange,
  filterExpiry = [], onFilterExpiryChange, expiryOptions = [],
  page, pageSize, onPageChange,
  visibleColumns, onVisibleColumnsChange,
  selectedIds = [], onSelect, onSelectAll, onClearSelection, onBulkDelete,
  onAdd, onExportCsv,
  onOpen, onEdit, onCheckout, onCheckin, onDelete,
  checkExpiration,
  canEdit = false,
}) {
  return (
    <ListPage
      title="โปรแกรม / License"
      rows={rows}
      totalCount={totalCount}
      columns={buildColumns(checkExpiration)}
      optionalColumns={OPTIONAL_COLUMNS}
      visibleColumns={visibleColumns}
      onVisibleColumnsChange={onVisibleColumnsChange}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="ค้นหา ชื่อโปรแกรม / Supplier"
      filters={[
        { key: 'exp', label: 'วันหมดอายุ', selected: filterExpiry, options: expiryOptions, onChange: onFilterExpiryChange },
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
        canEdit && onAdd && { key: 'add', label: 'เพิ่ม License', icon: <Plus className="size-5" strokeWidth={2} />, onSelect: onAdd, primary: true },
      ].filter(Boolean)}
      onOpen={onOpen}
      /* จ่าย seat ได้เมื่อยังมีที่ว่าง · คืน seat ได้เมื่อมีคนถืออยู่ */
      rowActions={(item) => (!canEdit ? [] : [
        available(item) > 0 && { key: 'checkout', label: 'จ่าย License', onSelect: () => onCheckout?.(item) },
        used(item) > 0 && { key: 'checkin', label: 'คืน License', onSelect: () => onCheckin?.(item) },
        { key: 'edit', label: 'แก้ไข', onSelect: () => onEdit?.(item) },
        { key: 'delete', label: 'ลบ', tone: 'danger', onSelect: () => onDelete?.(item) },
      ].filter(Boolean))}
    />
  );
}
