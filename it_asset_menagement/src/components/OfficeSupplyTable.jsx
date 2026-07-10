import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, Package, AlertTriangle, CheckCircle, XCircle, ChevronDown, Building2 } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

/* ─── Stock config ───────────────────────────────────────────────
   สี tone-down เข้าธีม navy — เหลือเฉพาะสีเตือนที่จำเป็น
   ─────────────────────────────────────────────────────────────── */
function getStockMeta(qty) {
  if (qty <= 0)  return {
    key:'out', label:'หมดสต็อก', icon:XCircle,
    num:'text-rose-700',
    badge:'bg-rose-50 text-rose-700 ring-rose-200',
    bar:'bg-rose-400', barW:0,
    dot:'bg-rose-500',
    rowAccent:'border-l-rose-400',
  };
  if (qty <= 5)  return {
    key:'low', label:'ใกล้หมด', icon:AlertTriangle,
    num:'text-amber-700',
    badge:'bg-amber-50 text-amber-700 ring-amber-200',
    bar:'bg-amber-400', barW:25,
    dot:'bg-amber-500',
    rowAccent:'border-l-amber-400',
  };
  if (qty <= 20) return {
    key:'medium', label:'พอใช้', icon:CheckCircle,
    num:'text-slate-700',
    badge:'bg-slate-50 text-slate-600 ring-slate-200',
    bar:'bg-slate-400', barW:50,
    dot:'bg-slate-400',
    rowAccent:'border-l-slate-300',
  };
  return {
    key:'normal', label:'เพียงพอ', icon:CheckCircle,
    num:'text-[#1E487A]',
    badge:'bg-blue-50 text-[#1E487A] ring-blue-200',
    bar:'bg-[#1E487A]', barW:100,
    dot:'bg-[#1E487A]',
    rowAccent:'border-l-[#1E487A]',
  };
}

/* ═══════════════════════════════════════════════════════════════════
   Main — Row list (แถว) + สรุปสถิติด้านบน + pagination
   ═══════════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 15;

export default function OfficeSupplyTable({
  currentData,
  selectedOfficeSupplyIds,
  handleSelectAllOfficeSupplies,
  handleSelectOfficeSupply,
  openEditAssetModal,
  setConfirmDeleteModal,
  activeMenu,
  canEdit,
}) {
  const [page, setPage] = useState(1);
  const [companyFilter, setCompanyFilter] = useState('ทั้งหมด');

  // 🆕 รายชื่อบริษัททั้งหมด (unique)
  const companyOptions = useMemo(() => {
    const set = new Set();
    currentData.forEach(item => {
      const c = (item.company || '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [currentData]);

  // กรองตามบริษัท
  const filteredData = useMemo(() => {
    if (companyFilter === 'ทั้งหมด') return currentData;
    if (companyFilter === '__NONE__') return currentData.filter(i => !(i.company || '').trim());
    return currentData.filter(i => (i.company || '').trim() === companyFilter);
  }, [currentData, companyFilter]);

  const allSelected = filteredData.length > 0 && selectedOfficeSupplyIds?.length === filteredData.length;

  // สรุปสถิติ (ตามผลกรอง)
  const stats = filteredData.reduce((acc, item) => {
    const qty = Number(item.quantity);
    const meta = getStockMeta(qty);
    acc[meta.key] = (acc[meta.key] || 0) + 1;
    return acc;
  }, {});

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedData = filteredData.slice(pageStart, pageStart + PAGE_SIZE);

  React.useEffect(() => { setPage(1); }, [filteredData.length, companyFilter]);

  return (
    <div className="p-4 space-y-3">

      {/* ── Compact stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatChip label="ทั้งหมด"  value={filteredData.length}                      color="slate" icon={Package} />
        <StatChip label="หมดสต็อก" value={stats.out    || 0}                        color="rose"  icon={XCircle} />
        <StatChip label="ใกล้หมด"  value={stats.low    || 0}                        color="amber" icon={AlertTriangle} />
        <StatChip label="เพียงพอ"  value={(stats.medium || 0) + (stats.normal || 0)} color="navy"  icon={CheckCircle} />
      </div>

      {/* 🆕 ── Company filter bar ── */}
      {companyOptions.length > 0 && (
        <div className="bg-white ring-1 ring-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 shrink-0">
            <Building2 className="h-3.5 w-3.5 text-[#1E487A]" strokeWidth={2.2} />
            บริษัท:
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <FilterPill
              active={companyFilter === 'ทั้งหมด'}
              onClick={() => setCompanyFilter('ทั้งหมด')}
              label="ทั้งหมด"
              count={currentData.length}
            />
            {companyOptions.map(c => (
              <FilterPill
                key={c}
                active={companyFilter === c}
                onClick={() => setCompanyFilter(c)}
                label={c}
                count={currentData.filter(i => (i.company || '').trim() === c).length}
              />
            ))}
            {currentData.some(i => !(i.company || '').trim()) && (
              <FilterPill
                active={companyFilter === '__NONE__'}
                onClick={() => setCompanyFilter('__NONE__')}
                label="ไม่ระบุ"
                count={currentData.filter(i => !(i.company || '').trim()).length}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      {currentData.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-white ring-1 ring-slate-200 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A]"
              checked={allSelected}
              onChange={handleSelectAllOfficeSupplies}
            />
            <span className="text-[13px] font-medium text-slate-600">
              {selectedOfficeSupplyIds?.length > 0
                ? `เลือก ${selectedOfficeSupplyIds.length}/${currentData.length}`
                : 'เลือกทั้งหมด'}
            </span>
          </label>
          <span className="text-[12.5px] text-slate-400 hidden sm:inline">
            {currentData.length} รายการ · หน้า {currentPage}/{totalPages}
          </span>
        </div>
      )}

      {/* ── Empty state ── */}
      {currentData.length === 0 && (
        <div className="py-20 text-center bg-white ring-1 ring-slate-200 rounded-xl">
          <div
            className="w-12 h-12 mx-auto mb-2.5 rounded-xl flex items-center justify-center"
            style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
          >
            <Package className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <p className="font-semibold text-slate-500 text-[14.5px]">ไม่พบรายการอุปกรณ์</p>
          <p className="text-[12.5px] text-slate-400 mt-0.5">ลองค้นหาด้วยคำอื่น หรือเพิ่มอุปกรณ์ใหม่</p>
        </div>
      )}

      {/* ── Row list ── */}
      {currentData.length > 0 && (
        <div className="bg-white ring-1 ring-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {pagedData.map((item) => {
            const qty  = Number(item.quantity);
            const meta = getStockMeta(qty);
            const isSelected = selectedOfficeSupplyIds?.includes(item.id);
            return (
              <SupplyRow
                key={item.id}
                item={item}
                qty={qty}
                meta={meta}
                isSelected={isSelected}
                canEdit={canEdit}
                onSelect={(e) => handleSelectOfficeSupply(e, item.id)}
                onEdit={() => openEditAssetModal(item, activeMenu)}
                onDelete={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: activeMenu })}
              />
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-[13px] font-medium text-slate-600 rounded-lg ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← ก่อนหน้า
          </button>
          <span className="text-[12.5px] text-slate-500">
            หน้า <span className="font-bold text-slate-700">{currentPage}</span> / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-[13px] font-medium text-slate-600 rounded-lg ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ถัดไป →
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Filter Pill (สำหรับกรองบริษัท) ────────────────────────── */
function FilterPill({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ring-1 ring-inset transition-colors ${
        active
          ? 'bg-[#1E487A] text-white ring-[#1E487A]'
          : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 hover:bg-slate-50'
      }`}
    >
      {label}
      <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded-full ${
        active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
      }`}>{count}</span>
    </button>
  );
}

/* ─── Stat Chip (บนสุด) ─────────────────────────────────────── */
function StatChip({ label, value, color, icon: Icon }) {
  const c = {
    slate: { bg: 'bg-slate-100',  text: 'text-slate-700',  icon: 'text-slate-500'  },
    rose:  { bg: 'bg-rose-100',   text: 'text-rose-700',   icon: 'text-rose-500'   },
    amber: { bg: 'bg-amber-100',  text: 'text-amber-700',  icon: 'text-amber-500'  },
    navy:  { bg: 'bg-blue-100',   text: 'text-[#1E487A]',  icon: 'text-[#1E487A]'  },
  }[color];

  return (
    <div className="bg-white ring-1 ring-slate-200 rounded-lg p-2.5 flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${c.icon}`} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide leading-none">{label}</p>
        <p className={`text-[19px] font-bold ${c.text} tabular-nums leading-none mt-1`}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Row (แถว) ─────────────────────────────────────────────── */
function SupplyRow({ item, qty, meta, isSelected, canEdit, onSelect, onEdit, onDelete }) {
  const StatusIcon = meta.icon;
  const [expanded, setExpanded] = useState(false);
  const hasExtraInfo = item.vendor || item.company || item.purchaseDate || item.note;

  return (
    <div
      className={`group transition-colors border-l-4 ${
        isSelected ? 'bg-blue-50/40 border-l-[#1E487A]' : `${meta.rowAccent} hover:bg-slate-50/60`
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          className="w-4 h-4 cursor-pointer rounded border-slate-300 text-[#1E487A] focus:ring-[#1E487A] shrink-0"
          checked={isSelected || false}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Image / Icon */}
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-11 h-11 rounded-lg object-cover ring-1 ring-slate-200 shrink-0 bg-white"
          />
        ) : (
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset"
            style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
          >
            <Package className="h-5 w-5" strokeWidth={1.6} />
          </div>
        )}

        {/* Name + Type + Company */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14.5px] text-slate-800 truncate group-hover:text-[#1E487A] transition-colors">
            {item.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {item.type && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {item.type}
              </span>
            )}
            {item.company ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E487A] bg-blue-50 px-1.5 py-0.5 rounded ring-1 ring-inset ring-blue-100">
                <Building2 className="h-2.5 w-2.5" strokeWidth={2.4} />
                {item.company}
              </span>
            ) : (
              <span className="text-[10.5px] text-slate-400 italic">ไม่ระบุบริษัท</span>
            )}
          </div>
        </div>

        {/* Stock number + bar (แถบไฟ mini) */}
        <div className="hidden sm:flex flex-col items-end shrink-0 w-24">
          <div className="flex items-baseline gap-1">
            <span className={`font-bold text-[19px] tabular-nums leading-none ${meta.num}`}>
              {qty}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {item.unit || 'ชิ้น'}
            </span>
          </div>
          <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5">
            <div className={`h-full ${meta.bar}`} style={{ width: `${meta.barW}%` }} />
          </div>
        </div>

        {/* Mobile: stock พร้อม badge รวม */}
        <div className="flex sm:hidden items-center gap-2 shrink-0">
          <span className={`font-bold text-[16px] tabular-nums ${meta.num}`}>{qty}</span>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 text-[11.5px] px-2 py-1 rounded-full font-semibold ring-1 ring-inset ${meta.badge} shrink-0`}>
          <StatusIcon className="h-3 w-3" strokeWidth={2.4} />
          <span className="hidden sm:inline">{meta.label}</span>
        </span>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              title="แก้ไข"
              className="w-8 h-8 rounded-lg text-slate-500 hover:text-[#1E487A] hover:bg-blue-50 flex items-center justify-center transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            <button
              onClick={onDelete}
              title="ลบ"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Expand toggle */}
        {hasExtraInfo && (
          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'ย่อ' : 'ขยาย'}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      {/* Expandable details */}
      {expanded && hasExtraInfo && (
        <div className="px-4 pb-3 pl-[68px] flex flex-wrap gap-x-6 gap-y-1 text-[12.5px] bg-slate-50/50 border-t border-slate-100 pt-3">
          {item.vendor && (
            <div>
              <span className="text-slate-400">Vendor:</span>{' '}
              <span className="font-medium text-slate-700">{item.vendor}</span>
            </div>
          )}
          {item.company && (
            <div>
              <span className="text-slate-400">บริษัท:</span>{' '}
              <span className="font-medium text-slate-700">{item.company}</span>
            </div>
          )}
          {item.purchaseDate && (
            <div>
              <span className="text-slate-400">วันที่ซื้อ:</span>{' '}
              <span className="font-medium text-slate-700">{item.purchaseDate}</span>
            </div>
          )}
          {item.cost && (
            <div>
              <span className="text-slate-400">ราคา:</span>{' '}
              <span className="font-medium text-slate-700">฿{Number(item.cost).toLocaleString()}</span>
            </div>
          )}
          {item.note && (
            <div className="w-full mt-1 text-slate-600">
              <span className="text-slate-400">หมายเหตุ:</span> {item.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
