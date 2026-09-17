/* Dev harness ดู 3 เมนูใหม่ (License / อุปกรณ์เสริม / พนักงาน) โดยไม่ต้องล็อกอิน
   เปิดที่ http://localhost:5173/list-preview.html — ไม่เข้า production build */
import './index.css';
import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import LicenseListPage from './components/licenses/LicenseListPage.jsx';
import AccessoryListPage from './components/accessories/AccessoryListPage.jsx';
import EmployeeListPage from './components/employees/EmployeeListPage.jsx';
import OfficeSupplyListPage from './components/officeSupplies/OfficeSupplyListPage.jsx';
import ReplacementRequestTable from './components/ReplacementRequestTable.jsx';   // หน้าที่รีสกินสีอย่างเดียว
import { LICENSE_EXPIRY_OPTIONS, ACCESSORY_TYPE_OPTIONS, OFFICE_STOCK_OPTIONS } from './components/list/filterOptions.js';

const mk = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const PAGE_SIZE = 10;
const log = (what) => (item) => console.log(what, item.name || item.fullName);

const LICENSES = mk(23, i => ({
  id: `l${i}`,
  name: ['Microsoft 365', 'Adobe Acrobat Pro', 'AutoCAD LT', 'Zoom Pro', 'Figma Org'][i % 5] + ` #${i + 1}`,
  supplier: ['Microsoft', 'Adobe', 'Autodesk', 'Zoom', 'Figma'][i % 5],
  productKey: `KEY-${1000 + i}`,
  quantity: 5 + (i % 8),
  assignees: mk(i % 6, () => ({})),
  cost: 12000 + i * 900,
  status: ['พร้อมใช้งาน', 'ถูกใช้งาน', 'ตัดจำหน่าย'][i % 3],
  expirationDate: i % 4 === 0 ? '' : `202${6 + (i % 2)}-${String(1 + (i % 12)).padStart(2, '0')}-28`,
  purchaseDate: '2025-03-10',
}));

const ACCESSORIES = mk(17, i => ({
  id: `c${i}`,
  name: ['เมาส์ Logitech', 'คีย์บอร์ด Dell', 'Docking Station', 'หูฟัง Jabra', 'สาย HDMI'][i % 5],
  type: ACCESSORY_TYPE_OPTIONS[i % 3].value,
  quantity: 10 + (i % 30),
  assignees: mk(i % 9, () => ({})),
  brokenQuantity: i % 5 === 0 ? 2 : 0,
  requestDisabled: i % 6 === 0,
}));

const EMPLOYEES = mk(34, i => ({
  id: `e${i}`,
  empId: `EMP${String(100 + i)}`,
  fullName: ['สมชาย ใจดี', 'วิภา สุขสันต์', 'ธนกร พงษ์ทอง', 'ปรียา วงศ์ดี', 'อนุชา แสงเพชร'][i % 5],
  nickname: ['ชาย', 'ภา', 'กร', 'ยา', 'ชา'][i % 5],
  position: ['IT Support', 'Accountant', 'Sales Executive', 'HR Officer'][i % 4],
  department: ['Design Experience', 'Recruitment & Field Force', 'Business Development', 'Operation Team 1'][i % 4],
  company: i % 3 === 0 ? 'Best HRM' : 'Globe Syndicate',
}));

const SUPPLIES = mk(21, i => ({
  id: `s${i}`,
  name: ['ปากกาลูกลื่น', 'กระดาษ A4', 'แฟ้มสันกว้าง', 'ลวดเย็บกระดาษ', 'หมึกปริ้นเตอร์'][i % 5],
  type: 'เครื่องเขียน',
  quantity: [0, 3, 12, 48, 5][i % 5],
  unit: 'ชิ้น',
  company: i % 2 === 0 ? 'Globe Syndicate' : 'Best HRM',
  cost: 25 + i * 7,
  vendor: 'ออฟฟิศเมท',
  purchaseDate: '2026-05-20',
}));

const REPLACEMENTS = mk(6, i => ({
  id: `r${i}`,
  empId: `EMP${100 + i}`,
  empName: ['สมชาย ใจดี', 'วิภา สุขสันต์', 'ธนกร พงษ์ทอง'][i % 3],
  department: 'Design Experience',
  reason: 'เครื่องช้ามาก เปิดโปรแกรมไม่ขึ้น',
  currentStatus: 'ใช้งานได้แต่ช้า',
  managerName: 'หัวหน้าแผนก',
  managerEmail: 'head@example.com',
  status: ['รอดำเนินการ', 'อนุมัติ', 'ปฏิเสธ'][i % 3],
  timestamp: new Date(Date.now() - i * 86400000).toISOString(),
  damagePhotos: [],
}));

const DEPTS = ['Design Experience', 'Recruitment & Field Force', 'Business Development', 'Operation Team 1'];

/* checkLicenseExpiration ตัวย่อ ใช้แค่ในหน้าทดสอบ */
const checkExpiration = (d) => {
  if (!d) return null;
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return { statusText: 'หมดอายุแล้ว' };
  if (days <= 90) return { statusText: `เหลือ ${days} วัน` };
  return null;
};

function usePaged(all, filterFn) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState([]);
  const [page, setPage] = useState(1);
  const [ids, setIds] = useState([]);
  const filtered = useMemo(() => filterFn(all, search, filter), [all, search, filter, filterFn]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safe = Math.min(page, pages);
  return {
    search, setSearch: v => { setSearch(v); setPage(1); },
    filter, setFilter: v => { setFilter(v); setPage(1); },
    page: safe, setPage: p => setPage(Math.min(Math.max(1, p), pages)),
    rows: filtered.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE),
    total: filtered.length,
    ids, toggle: id => setIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]),
    all: on => setIds(on ? filtered.map(r => r.id) : []),
    clear: () => setIds([]),
  };
}

const match = (hay, q) => String(hay || '').toLowerCase().includes(q.trim().toLowerCase());

function Harness() {
  const [menu, setMenu] = useState('licenses');
  const [cols, setCols] = useState({ productKey: true, supplier: true });

  const lic = usePaged(LICENSES, (all, q, f) => all.filter(l =>
    (!q || match(l.name, q) || match(l.supplier, q)) &&
    (f.length === 0 || f.some(v => v === 'ไม่ระบุ' ? !l.expirationDate : match(checkExpiration(l.expirationDate)?.statusText, ''))),
  ));
  const acc = usePaged(ACCESSORIES, (all, q, f) => all.filter(a =>
    (!q || match(a.name, q)) && (f.length === 0 || f.includes(a.type)),
  ));
  const emp = usePaged(EMPLOYEES, (all, q, f) => all.filter(e =>
    (!q || match(e.fullName, q) || match(e.empId, q)) && (f.length === 0 || f.includes(e.department)),
  ));

  const [stock, setStock] = useState('ทั้งหมด');
  const [supCols, setSupCols] = useState({ cost: true });
  const sup = usePaged(SUPPLIES, (all, q) => all.filter(s => !q || match(s.name, q)));
  const tabs = [['licenses', 'License'], ['accessories', 'อุปกรณ์เสริม'], ['employees', 'พนักงาน'], ['supplies', 'อุปกรณ์สำนักงาน'], ['replace', 'ขอเปลี่ยนเครื่อง (รีสกิน)']];

  return (
    <>
      <div className="flex gap-2 bg-[#12303A] p-3">
        {tabs.map(([k, label]) => (
          <button
            key={k} onClick={() => setMenu(k)}
            className={`rounded-lg px-3 py-1.5 text-sm ${menu === k ? 'bg-white text-stone-900' : 'text-white/70'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {menu === 'licenses' && (
        <LicenseListPage
          rows={lic.rows} totalCount={lic.total} canEdit
          searchTerm={lic.search} onSearchChange={lic.setSearch}
          filterExpiry={lic.filter} onFilterExpiryChange={lic.setFilter} expiryOptions={LICENSE_EXPIRY_OPTIONS}
          page={lic.page} pageSize={PAGE_SIZE} onPageChange={lic.setPage}
          visibleColumns={cols} onVisibleColumnsChange={setCols}
          selectedIds={lic.ids} onSelect={lic.toggle} onSelectAll={lic.all} onClearSelection={lic.clear}
          onBulkDelete={() => console.log('ลบ license ที่เลือก', lic.ids.length)}
          onAdd={() => console.log('เพิ่ม license')} onExportCsv={() => console.log('csv')}
          onOpen={log('เปิด')} onEdit={log('แก้ไข')} onCheckout={log('จ่าย')} onCheckin={log('คืน')} onDelete={log('ลบ')}
          checkExpiration={checkExpiration}
        />
      )}

      {menu === 'accessories' && (
        <AccessoryListPage
          rows={acc.rows} totalCount={acc.total} canEdit
          searchTerm={acc.search} onSearchChange={acc.setSearch}
          filterType={acc.filter} onFilterTypeChange={acc.setFilter} typeOptions={ACCESSORY_TYPE_OPTIONS}
          page={acc.page} pageSize={PAGE_SIZE} onPageChange={acc.setPage}
          selectedIds={acc.ids} onSelect={acc.toggle} onSelectAll={acc.all} onClearSelection={acc.clear}
          onBulkDelete={() => console.log('ลบอุปกรณ์เสริมที่เลือก', acc.ids.length)}
          onAdd={() => console.log('เพิ่ม')} onExportCsv={() => console.log('csv')}
          onOpen={log('เปิด')} onEdit={log('แก้ไข')} onCheckout={log('จ่าย')} onDelete={log('ลบ')}
        />
      )}

      {menu === 'employees' && (
        <EmployeeListPage
          rows={emp.rows} totalCount={emp.total} canEdit
          searchTerm={emp.search} onSearchChange={emp.setSearch}
          filterDepartment={emp.filter} onFilterDepartmentChange={emp.setFilter} departmentOptions={DEPTS}
          page={emp.page} pageSize={PAGE_SIZE} onPageChange={emp.setPage}
          selectedIds={emp.ids} onSelect={emp.toggle} onSelectAll={emp.all} onClearSelection={emp.clear}
          onBulkDelete={() => console.log('ลบพนักงานที่เลือก', emp.ids.length)}
          onAdd={() => console.log('เพิ่ม')} onExportCsv={() => console.log('csv')} onImport={() => console.log('นำเข้า')}
          showDeleted={false} onToggleDeleted={(on) => console.log('ถังขยะ', on)}
          onOpen={log('เปิด')} onEdit={log('แก้ไข')} onDelete={log('ลบ')}
        />
      )}
      {menu === 'supplies' && (
        <OfficeSupplyListPage
          rows={sup.rows} totalCount={sup.total} canEdit
          searchTerm={sup.search} onSearchChange={sup.setSearch}
          stockFilter={stock} onStockFilterChange={setStock} stockOptions={OFFICE_STOCK_OPTIONS}
          page={sup.page} pageSize={PAGE_SIZE} onPageChange={sup.setPage}
          visibleColumns={supCols} onVisibleColumnsChange={setSupCols}
          selectedIds={sup.ids} onSelect={sup.toggle} onSelectAll={sup.all} onClearSelection={sup.clear}
          onBulkDelete={() => console.log('ลบอุปกรณ์สำนักงานที่เลือก', sup.ids.length)}
          onAdd={() => console.log('เพิ่ม')} onExportCsv={() => console.log('csv')} onImport={() => console.log('นำเข้า')}
          onEdit={log('แก้ไข')} onDelete={log('ลบ')}
        />
      )}
      {menu === 'replace' && (
        <div className="p-6">
          <ReplacementRequestTable
            replacementRequests={REPLACEMENTS}
            handleUpdateReplacementStatus={(...a) => console.log('อัปเดตสถานะ', a)}
            handleDeleteReplacement={(...a) => console.log('ลบ', a)}
          />
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <div className="flex h-screen bg-stone-50 text-stone-900 font-sans">
    <main className="flex-1 flex flex-col overflow-hidden bg-transparent min-w-0">
      <div id="main-scroll-container" className="flex-1 overflow-auto">
        <Harness />
      </div>
    </main>
  </div>,
);

/* export เพื่อให้ Fast Refresh ของ Vite ทำงานกับไฟล์ harness นี้ได้ */
export default Harness;
