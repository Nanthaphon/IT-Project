/* Dev harness ดูหน้ารายการทรัพย์สิน ธีม v3 โดยไม่ต้องล็อกอิน Firebase
   จำลอง state ทั้งหมดแบบเดียวกับที่ App.jsx ถืออยู่ (ค้นหา/กรอง/แบ่งหน้า/เลือก)
   เปิดที่ http://localhost:5173/assets-preview.html — ไม่เข้า production build */
import './index.css';
import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AssetListPage from './components/assets/AssetListPage.jsx';

const TYPES = ['โน้ตบุ๊ค', 'คอมพิวเตอร์ตั้งโต๊ะ', 'จอมอนิเตอร์', 'เครื่องพิมพ์', 'โทรศัพท์มือถือ', 'แท็บเล็ต'];
const MODELS = ['Dell Latitude 5440', 'Lenovo ThinkPad E14', 'HP ProBook 450', 'Dell OptiPlex 7010', 'Dell P2422H', 'HP LaserJet M404'];
const STATUSES = ['ถูกใช้งาน', 'ถูกใช้งาน', 'ถูกใช้งาน', 'พร้อมใช้งาน', 'สำรอง', 'ชำรุดเสียหาย', 'ตัดจำหน่าย'];
const NAMES = ['สมชาย ใจดี', 'วิภา สุขสันต์', 'ธนกร พงษ์ทอง', 'ปรียา วงศ์ดี', 'อนุชา แสงเพชร', 'กมล ทองสุข'];
const DEPTS = ['Design Experience', 'Recruitment & Field Force', 'Business Development', 'Operation Team 1'];

/* 128 รายการ เท่าปริมาณจริงในระบบ เพื่อทดสอบ pagination ให้สมจริง */
const ALL_ASSETS = Array.from({ length: 128 }, (_, i) => {
  const status = STATUSES[i % STATUSES.length];
  const assigned = status === 'ถูกใช้งาน';
  return {
    id: `a${i + 1}`,
    assetTag: `GS-${String(1000 + i)}`,
    name: MODELS[i % MODELS.length],
    model: MODELS[i % MODELS.length],
    sn: `SN${String(70000 + i * 7)}`,
    type: TYPES[i % TYPES.length],
    status,
    company: i % 3 === 0 ? 'Best HRM' : 'Globe Syndicate',
    vendor: 'JIB Computer',
    purchaseDate: `202${3 + (i % 3)}-0${1 + (i % 9)}-15`,
    warrantyDate: `202${6 + (i % 2)}-0${1 + (i % 9)}-15`,
    assignedTo: assigned ? `e${i % NAMES.length}` : '',
    assignedName: assigned ? NAMES[i % NAMES.length] : '',
    forDepartment: DEPTS[i % DEPTS.length],
    cost: 12000 + (i % 9) * 3000,
    scrapValue: 3000 + (i % 5) * 1000,
    note: i % 4 === 0 ? 'เปลี่ยน SSD แล้ว' : '',
    remark: '',
  };
});

const PAGE_SIZE = 10;
const log = (what) => (item) => console.log(what, item.assetTag, item.name);

function Harness() {
  /* state ชุดเดียวกับที่ App.jsx ถือ */
  const [searchTerm, setSearchTerm] = useState('');
  /* ตัวกรองเป็น array เหมือน App.jsx (multi-select) */
  const [filterType, setFilterType] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({ cost: true });

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return ALL_ASSETS.filter(a => {
      if (filterType.length && !filterType.includes(a.type)) return false;
      if (filterStatus.length && !filterStatus.includes(a.status)) return false;
      if (filterDepartment.length && !filterDepartment.includes(a.forDepartment)) return false;
      if (!q) return true;
      return [a.name, a.assetTag, a.sn, a.model, a.assignedName]
        .some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [searchTerm, filterType, filterStatus, filterDepartment]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const reset = (fn) => (v) => { fn(v); setPage(1); };
  const toggleOne = (id) => setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  /* เหมือน handleSelectAllAssets เดิม: เลือก "ทุกรายการในผลค้นหา" ไม่ใช่แค่หน้านี้ */
  const toggleAll = (on) => setSelectedIds(on ? filtered.map(r => r.id) : []);

  return (
    <AssetListPage
      rows={rows}
      totalCount={filtered.length}
      searchTerm={searchTerm} onSearchChange={reset(setSearchTerm)}
      filterType={filterType} onFilterTypeChange={reset(setFilterType)}
      typeOptions={TYPES}
      filterStatus={filterStatus} onFilterStatusChange={reset(setFilterStatus)}
      statusOptions={[...new Set(STATUSES)]}
      filterDepartment={filterDepartment} onFilterDepartmentChange={reset(setFilterDepartment)}
      departmentOptions={DEPTS}
      page={safePage} pageSize={PAGE_SIZE} onPageChange={p => setPage(Math.min(Math.max(1, p), totalPages))}
      visibleColumns={visibleColumns} onVisibleColumnsChange={setVisibleColumns}
      selectedIds={selectedIds} onSelect={toggleOne} onSelectAll={toggleAll}
      onBulkDelete={() => console.log('ลบที่เลือก', selectedIds.length, 'รายการ')}
      onBulkExportPdf={() => console.log('พิมพ์ที่เลือก', selectedIds.length)}
      onClearSelection={() => setSelectedIds([])}
      onAdd={() => console.log('เพิ่มทรัพย์สิน')}
      onExportCsv={() => console.log('export csv')}
      onExportPdf={() => console.log('export pdf')}
      onOpen={log('เปิดรายละเอียด')}
      onEdit={log('แก้ไข')}
      onCheckout={log('จ่ายออก')}
      onReturn={log('รับคืน')}
      onClone={log('คัดลอก')}
      onDelete={log('ลบ')}
      canEdit
    />
  );
}

/* จำลอง app shell จริง (พื้นฟ้า + sidebar + scroll container ที่ไม่ใส่ padding) */
createRoot(document.getElementById('root')).render(
  <div className="flex h-screen bg-stone-50 text-stone-900 font-sans">
    <div className="w-[280px] shrink-0 bg-[#4A2B29]" />
    <main className="flex-1 flex flex-col overflow-hidden bg-transparent min-w-0">
      <div id="main-scroll-container" className="flex-1 overflow-auto">
        <Harness />
      </div>
    </main>
  </div>,
);

/* export เพื่อให้ Fast Refresh ของ Vite ทำงานกับไฟล์ harness นี้ได้ */
export default Harness;
