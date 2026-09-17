import React from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { text } from '../../ui/earth.js';
import { StatusBadge, CellTitle } from '../../ui/earthUI.jsx';
import ListPage from '../list/ListPage.jsx';
import { formatDateShort } from '../../utils/formatDate.js';

/* ════════════════════════════════════════════════════════════════
   หน้ารายการอุปกรณ์สำนักงาน — ธีม v3 · config ของ ListPage

   4 คอลัมน์หลัก — ชื่อ / คงเหลือ / สถานะสต็อก / บริษัท
   เกณฑ์สต็อกยกมาจากตัวกรองเดิมใน ActionBar: 0 = หมด · 1–5 = ใกล้หมด · >5 = ปกติ
   ════════════════════════════════════════════════════════════════ */

const money = (v) => (Number(v) > 0 ? Number(v).toLocaleString('th-TH') : '');

function stockStatus(item) {
  const qty = Number(item.quantity) || 0;
  if (qty <= 0) return 'หมดสต็อก';
  if (qty <= 5) return 'ใกล้หมด';
  return 'ปกติ';
}

const OPTIONAL_COLUMNS = [
  { key: 'cost', label: 'ราคา/หน่วย', align: 'right', render: i => money(i.cost) },
  { key: 'vendor', label: 'ผู้จัดจำหน่าย', render: i => i.vendor },
  { key: 'purchaseDate', label: 'วันที่ซื้อ', render: i => formatDateShort(i.purchaseDate) },
  { key: 'note', label: 'หมายเหตุ', render: i => i.note },
];

const COLUMNS = [
  { key: 'name', label: 'ชื่ออุปกรณ์', render: i => <CellTitle title={i.name} sub={i.type} /> },
  {
    key: 'qty', label: 'คงเหลือ', width: 'w-32', align: 'right', cellClass: 'tabular-nums',
    render: i => (
      <span className="whitespace-nowrap text-sm text-stone-600">
        {(Number(i.quantity) || 0).toLocaleString('th-TH')}
        {i.unit && <span className={`ml-1 ${text.faint}`}>{i.unit}</span>}
      </span>
    ),
  },
  { key: 'stock', label: 'สถานะสต็อก', width: 'w-36', render: i => <StatusBadge status={stockStatus(i)} /> },
  {
    key: 'company', label: 'บริษัท', width: 'w-44',
    render: i => (i.company ? <span className="text-sm text-stone-600">{i.company}</span> : <span className={text.faint}>—</span>),
  },
];

export default function OfficeSupplyListPage({
  rows, totalCount,
  searchTerm, onSearchChange,
  stockFilter = 'ทั้งหมด', onStockFilterChange, stockOptions = [],
  page, pageSize, onPageChange,
  visibleColumns, onVisibleColumnsChange,
  selectedIds = [], onSelect, onSelectAll, onClearSelection, onBulkDelete,
  onAdd, onExportCsv, onImport,
  onEdit, onDelete,
  canEdit = false,
}) {
  /* ตัวกรองสต็อกใน App.jsx เก็บเป็นค่าเดี่ยว (string) ไม่ใช่ array — ครอบด้วย adapter
     ให้ใช้ UI ตัวกรองตัวเดียวกับเมนูอื่นได้ โดยไม่ต้องไปเปลี่ยนรูปแบบ state เดิม
     (ซึ่งถูก persist ลง localStorage อยู่ — เปลี่ยนแล้วค่าเก่าจะพัง) */
  const selected = !stockFilter || stockFilter === 'ทั้งหมด' ? [] : [stockFilter];
  const handleStock = (arr) => {
    const next = arr.filter(v => v !== stockFilter);   // เลือกใหม่ = แทนที่ของเดิม
    onStockFilterChange?.(next.length ? next[next.length - 1] : 'ทั้งหมด');
  };

  return (
    <ListPage
      title="อุปกรณ์สำนักงาน"
      rows={rows}
      totalCount={totalCount}
      columns={COLUMNS}
      optionalColumns={OPTIONAL_COLUMNS}
      visibleColumns={visibleColumns}
      onVisibleColumnsChange={onVisibleColumnsChange}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="ค้นหา ชื่ออุปกรณ์"
      filters={[
        { key: 'stock', label: 'สต็อก', selected, options: stockOptions, onChange: handleStock },
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
        canEdit && onImport && { key: 'imp', label: 'นำเข้า', icon: <Upload className="size-5" strokeWidth={1.75} />, onSelect: onImport },
        canEdit && onAdd && { key: 'add', label: 'เพิ่มอุปกรณ์', icon: <Plus className="size-5" strokeWidth={2} />, onSelect: onAdd, primary: true },
      ].filter(Boolean)}
      rowActions={(item) => (!canEdit ? [] : [
        { key: 'edit', label: 'แก้ไข', onSelect: () => onEdit?.(item) },
        { key: 'delete', label: 'ลบ', tone: 'danger', onSelect: () => onDelete?.(item) },
      ])}
    />
  );
}
