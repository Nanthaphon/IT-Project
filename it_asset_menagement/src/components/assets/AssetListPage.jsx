import React from 'react';
import { Plus, Download, FileText } from 'lucide-react';
import { text } from '../../ui/earth.js';
import { StatusBadge, CellTitle } from '../../ui/earthUI.jsx';
import ListPage from '../list/ListPage.jsx';
import { formatDateShort } from '../../utils/formatDate.js';

/* ════════════════════════════════════════════════════════════════
   หน้ารายการทรัพย์สิน — ธีม v3 · เป็นแค่ "config" ของ ListPage

   4 คอลัมน์หลัก — ชื่อ / ประเภท / สถานะ / ผู้ถือครอง
   ข้อมูลรอง (รหัส, รุ่น, แผนก) ซ้อนเป็นบรรทัดที่สองใต้ชื่อ ไม่แตกคอลัมน์
   คอลัมน์เสริมเปิด/ปิดเองได้ (ผูกกับ visibleAssetColumns เดิมใน App.jsx)
   ════════════════════════════════════════════════════════════════ */

const money = (v) => (Number(v) > 0 ? Number(v).toLocaleString('th-TH') : '');

/* อายุการใช้งานจากวันที่ซื้อ -> "X ปี Y เดือน" */
function assetAge(purchaseDate) {
  if (!purchaseDate) return '';
  const d = new Date(purchaseDate);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (now.getDate() < d.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  if (years < 0) return '';
  if (years === 0 && months === 0) return '< 1 เดือน';
  return [years > 0 ? `${years} ปี` : '', months > 0 ? `${months} เดือน` : ''].filter(Boolean).join(' ');
}

/* key ตรงกับ visibleAssetColumns ใน App.jsx
   (name/type/status/assignedName เป็นคอลัมน์หลัก ไม่อยู่ในนี้
    ส่วน assetTag/model แสดงเป็นบรรทัดรองใต้ชื่ออยู่แล้ว) */
const OPTIONAL_COLUMNS = [
  { key: 'cost', label: 'ราคา', align: 'right', render: a => money(a.cost) },
  { key: 'scrapValue', label: 'ราคาปัจจุบัน', align: 'right', render: a => money(a.scrapValue) },
  { key: 'sn', label: 'Serial Number', render: a => a.sn },
  { key: 'company', label: 'บริษัท', render: a => a.company },
  { key: 'vendor', label: 'ผู้จัดจำหน่าย', render: a => a.vendor },
  { key: 'purchaseDate', label: 'วันที่ซื้อ', render: a => formatDateShort(a.purchaseDate) },
  { key: 'warrantyDate', label: 'วันหมด Warranty', render: a => formatDateShort(a.warrantyDate) },
  { key: 'age', label: 'อายุการใช้งาน', render: a => assetAge(a.purchaseDate) },
  { key: 'note', label: 'หมายเหตุ', render: a => a.note },
  { key: 'remark', label: 'Remark', render: a => a.remark },
];

const COLUMNS = [
  {
    key: 'name', label: 'ชื่อทรัพย์สิน',
    /* บรรทัดรอง: รหัส + รุ่น (ไม่ซ้ำรุ่นถ้าชื่อกับรุ่นเป็นค่าเดียวกัน) */
    render: a => (
      <CellTitle
        title={a.name}
        sub={[a.assetTag, a.model !== a.name ? a.model : null].filter(Boolean).join(' · ')}
      />
    ),
  },
  { key: 'type', label: 'ประเภท', width: 'w-40', cellClass: 'text-sm text-stone-600', render: a => a.type || '—' },
  { key: 'status', label: 'สถานะ', width: 'w-36', render: a => <StatusBadge status={a.status || 'พร้อมใช้งาน'} /> },
  {
    key: 'assignee', label: 'ผู้ถือครอง', width: 'w-52',
    render: a => (a.assignedName
      ? <CellTitle title={a.assignedName} sub={a.forDepartment} />
      : <span className={text.faint}>ยังไม่จ่ายออก</span>),
  },
];

export default function AssetListPage({
  rows, totalCount, title = 'ทรัพย์สิน',
  searchTerm, onSearchChange,
  filterType, onFilterTypeChange, typeOptions = [],
  filterStatus, onFilterStatusChange, statusOptions = [],
  filterDepartment, onFilterDepartmentChange, departmentOptions = [],
  page, pageSize, onPageChange,
  visibleColumns, onVisibleColumnsChange,
  selectedIds = [], onSelect, onSelectAll, onClearSelection, onBulkDelete, onBulkExportPdf,
  onAdd, onExportCsv, onExportPdf,
  onOpen, onEdit, onCheckout, onReturn, onClone, onDelete,
  canEdit = false,
}) {
  return (
    <ListPage
      title={title}
      rows={rows}
      totalCount={totalCount}
      columns={COLUMNS}
      optionalColumns={OPTIONAL_COLUMNS}
      visibleColumns={visibleColumns}
      onVisibleColumnsChange={onVisibleColumnsChange}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="ค้นหา ชื่อ / รหัส / S/N / ผู้ถือครอง"
      filters={[
        { key: 'dept', label: 'สำหรับแผนก', selected: filterDepartment, options: departmentOptions, onChange: onFilterDepartmentChange },
        { key: 'type', label: 'ประเภท', selected: filterType, options: typeOptions, onChange: onFilterTypeChange },
        { key: 'status', label: 'สถานะ', selected: filterStatus, options: statusOptions, onChange: onFilterStatusChange },
      ]}
      page={page} pageSize={pageSize} onPageChange={onPageChange}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      onClearSelection={onClearSelection}
      bulkActions={[
        onBulkExportPdf && { key: 'pdf', label: 'พิมพ์ที่เลือก', onSelect: onBulkExportPdf },
        canEdit && onBulkDelete && { key: 'del', label: 'ลบที่เลือก', tone: 'danger', onSelect: onBulkDelete },
      ].filter(Boolean)}
      toolbar={[
        onExportCsv && { key: 'csv', label: 'CSV', icon: <Download className="size-5" strokeWidth={2} />, onSelect: onExportCsv },
        onExportPdf && { key: 'pdf', label: 'PDF', icon: <FileText className="size-5" strokeWidth={2} />, onSelect: onExportPdf },
        canEdit && onAdd && { key: 'add', label: 'เพิ่มทรัพย์สิน', icon: <Plus className="size-5" strokeWidth={2} />, onSelect: onAdd, primary: true },
      ].filter(Boolean)}
      onOpen={onOpen}
      /* ทุก action ในเมนูแถวแก้ข้อมูลทั้งหมด -> ไม่มีสิทธิ์แก้ = ไม่มีเมนู
         (คนอ่านอย่างเดียวยังคลิกแถวเพื่อดูรายละเอียดได้ตามปกติ)
         รายการแรกสลับตามสถานะจริง: ถือครองอยู่ = รับคืน / ว่าง = จ่ายออก */
      rowActions={(item) => (!canEdit ? [] : [
        item.assignedTo
          ? { key: 'return', label: 'รับคืน', onSelect: () => onReturn?.(item) }
          : { key: 'checkout', label: 'จ่ายออก', onSelect: () => onCheckout?.(item) },
        { key: 'edit', label: 'แก้ไข', onSelect: () => onEdit?.(item) },
        { key: 'clone', label: 'คัดลอกรายการ', onSelect: () => onClone?.(item) },
        { key: 'delete', label: 'ลบ', tone: 'danger', onSelect: () => onDelete?.(item) },
      ])}
    />
  );
}
