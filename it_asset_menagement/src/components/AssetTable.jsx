import React from 'react';
import { Pencil, Trash2, Monitor, User as UserIcon, LogIn, RotateCcw } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

const TH = 'px-5 py-3 font-semibold text-slate-500 text-[11px] uppercase tracking-[0.08em]';
const TD = 'px-5 py-3.5';

export default function AssetTable({
  currentData,
  setSelectedAssetDetail,
  setSelectedAssetCategory,
  setCheckoutModal,
  setReturnModal,
  openEditAssetModal,
  setConfirmDeleteModal,
  visibleAssetColumns,
}) {
  return (
    <table className="min-w-full text-left border-collapse w-full whitespace-nowrap">
      <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
        <tr>
          {visibleAssetColumns.name && <th className={TH}>ชื่ออุปกรณ์</th>}
          {visibleAssetColumns.type && <th className={TH}>ประเภท</th>}
          {visibleAssetColumns.department && <th className={`${TH} text-center`}>แผนก</th>}
          {visibleAssetColumns.assetTag && <th className={TH}>รหัสทรัพย์สิน</th>}
          {visibleAssetColumns.sn && <th className={TH}>Serial Number</th>}
          {visibleAssetColumns.model && <th className={TH}>ยี่ห้อ/รุ่น</th>}
          {visibleAssetColumns.vendor && <th className={TH}>ผู้จัดจำหน่าย</th>}
          {visibleAssetColumns.company && <th className={TH}>บริษัท</th>}
          {visibleAssetColumns.purchaseDate && <th className={TH}>วันที่ซื้อ</th>}
          {visibleAssetColumns.warrantyDate && <th className={TH}>หมด Warranty</th>}
          {visibleAssetColumns.cost && <th className={`${TH} text-right`}>ราคา</th>}
          {visibleAssetColumns.assignedName && <th className={`${TH} text-center`}>ผู้ครอบครอง</th>}
          {visibleAssetColumns.status && <th className={`${TH} text-center`}>สถานะ</th>}
          <th className={`${TH} text-center`}>จัดการ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-[13.5px] bg-white">
        {currentData.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
            {visibleAssetColumns.name && (
              <td className={TD}>
                <button
                  onClick={() => { setSelectedAssetDetail(item); setSelectedAssetCategory('assets'); }}
                  className="text-left flex items-center gap-3 group/link"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                      style={{ background: `${BRAND.primary}10`, color: BRAND.primary }}
                    >
                      <Monitor className="h-4 w-4" strokeWidth={1.7} />
                    </div>
                  )}
                  <span className="font-medium text-slate-800 group-hover/link:text-[#1E487A] transition-colors">
                    {item.name}
                  </span>
                </button>
              </td>
            )}

            {visibleAssetColumns.type && (
              <td className={TD}>
                <span className="inline-flex items-center bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-full font-medium ring-1 ring-inset ring-slate-200">
                  {item.type}
                </span>
              </td>
            )}

            {visibleAssetColumns.department && (
              <td className={`${TD} text-center font-medium text-slate-700`}>{item.department || '-'}</td>
            )}
            {visibleAssetColumns.assetTag && (
              <td className={`${TD} font-mono text-slate-600 text-[12.5px]`}>{item.assetTag || '-'}</td>
            )}
            {visibleAssetColumns.sn && (
              <td className={`${TD} font-mono text-slate-600 text-[12.5px]`}>{item.sn || '-'}</td>
            )}
            {visibleAssetColumns.model && <td className={`${TD} text-slate-700`}>{item.model || '-'}</td>}
            {visibleAssetColumns.vendor && <td className={`${TD} text-slate-700`}>{item.vendor || '-'}</td>}
            {visibleAssetColumns.company && <td className={`${TD} text-slate-700`}>{item.company || '-'}</td>}
            {visibleAssetColumns.purchaseDate && <td className={`${TD} text-slate-500 tabular-nums`}>{item.purchaseDate || '-'}</td>}
            {visibleAssetColumns.warrantyDate && <td className={`${TD} text-slate-500 tabular-nums`}>{item.warrantyDate || '-'}</td>}
            {visibleAssetColumns.cost && (
              <td className={`${TD} text-right font-medium text-slate-700 tabular-nums`}>
                {item.cost ? `฿${Number(item.cost).toLocaleString()}` : '-'}
              </td>
            )}

            {visibleAssetColumns.assignedName && (
              <td className={`${TD} text-center font-medium`} style={{ color: BRAND.primary }}>
                {item.assignedName || '-'}
              </td>
            )}

            {visibleAssetColumns.status && (
              <td className={`${TD} text-center`}>
                <StatusBadge status={item.status} assignedName={item.assignedName} showAssignee={!visibleAssetColumns.assignedName} />
              </td>
            )}

            <td className={`${TD} text-center`}>
              <div className="flex items-center justify-center gap-1.5">
                {(!item.status || item.status === 'พร้อมใช้งาน') ? (
                  <ActionBtn
                    onClick={() => setCheckoutModal({ isOpen: true, assetId: item.id, collectionName: 'assets' })}
                    kind="primary"
                    icon={LogIn}
                  >
                    เบิกจ่าย
                  </ActionBtn>
                ) : item.status === 'ถูกใช้งาน' ? (
                  <ActionBtn
                    onClick={() => setReturnModal({ isOpen: true, assetId: item.id, collectionName: 'assets', empId: item.assignedTo, empName: item.assignedName, assetName: item.name })}
                    kind="success"
                    icon={RotateCcw}
                  >
                    รับคืน
                  </ActionBtn>
                ) : null}
                <IconBtn onClick={() => openEditAssetModal(item, 'assets')} title="แก้ไข" kind="warning">
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                </IconBtn>
                <IconBtn onClick={() => setConfirmDeleteModal({ isOpen: true, id: item.id, collectionName: 'assets' })} title="ลบ" kind="danger">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                </IconBtn>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Reusable bits ── */
function StatusBadge({ status, assignedName, showAssignee }) {
  const norm = !status || status === 'พร้อมใช้งาน' ? 'ready'
    : status === 'ถูกใช้งาน' ? 'inuse'
    : status === 'ชำรุดเสียหาย' ? 'broken'
    : 'pending';

  const meta = {
    ready:  { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500 animate-pulse', label: 'พร้อมใช้งาน' },
    inuse:  { cls: 'bg-blue-50 text-[#1E487A] ring-blue-200', dot: 'bg-[#1E487A]', label: 'ถูกใช้งาน' },
    broken: { cls: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500', label: 'ชำรุดเสียหาย' },
    pending:{ cls: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500', label: status },
  }[norm];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 ring-inset ${meta.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
      </span>
      {norm === 'inuse' && showAssignee && assignedName && (
        <span className="text-[10.5px] text-slate-500 font-medium flex items-center gap-1">
          <UserIcon className="h-3 w-3" strokeWidth={2} /> {assignedName}
        </span>
      )}
    </div>
  );
}

function ActionBtn({ onClick, kind, icon: Icon, children }) {
  const map = {
    primary: 'text-[#1E487A] ring-[#1E487A]/30 hover:bg-[#1E487A] hover:text-white hover:ring-[#1E487A]',
    success: 'text-emerald-600 ring-emerald-200 hover:bg-emerald-500 hover:text-white hover:ring-emerald-500',
  }[kind];
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 bg-white ring-1 ring-inset rounded-lg font-semibold transition-colors text-[11.5px] ${map}`}
    >
      {Icon && <Icon className="h-3 w-3" strokeWidth={2.2} />}
      {children}
    </button>
  );
}

function IconBtn({ onClick, title, children, kind }) {
  const map = {
    warning: 'text-amber-600 hover:bg-amber-50 hover:ring-amber-300',
    danger:  'text-rose-500 hover:bg-rose-50 hover:ring-rose-300',
  }[kind];
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 bg-white ring-1 ring-inset ring-slate-200 rounded-lg transition-colors ${map}`}
    >
      {children}
    </button>
  );
}
