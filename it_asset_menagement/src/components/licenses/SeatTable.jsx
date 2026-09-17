import { KeyRound, Calendar, ChevronRight, Monitor, User } from 'lucide-react';
import { statusTone } from '../../ui/earth.js';

/* ตารางสิทธิ์ License
   เดิมเป็นลิสต์เต็มความกว้าง แถวละ 923px แต่เนื้อหาจบที่ 283px
   = ที่ว่าง 69% ต่อแถว คูณ 52 แถว และเทียบข้ามแถวไม่ได้เลย
   ข้อมูลต่อสิทธิ์มี 5 อย่าง (สถานะ · ผู้ถือ · key · เบิกเมื่อ · หมดอายุ)
   -> เป็นตาราง กวาดสายตาลงคอลัมน์ได้ ใช้ความกว้างจริง

   จอแคบกว่า md กลับไปเป็นการ์ดเหมือนเดิม (ตารางอ่านไม่ได้บนมือถือ) */

const COLS = [
  { key: 'seat',   label: '#',              w: 'w-[52px]'  },
  { key: 'holder', label: 'ผู้ถือครอง',      w: ''          },
  { key: 'key',    label: 'Product Key',    w: 'w-[22%]'   },
  { key: 'date',   label: 'เบิกเมื่อ',       w: 'w-[96px]' },
  { key: 'exp',    label: 'หมดอายุ',         w: 'w-[96px]' },
  { key: 'status', label: 'สถานะ',           w: 'w-[118px]' },
];

/** ข้อมูลที่แถวหนึ่งต้องใช้ — รวมตรรกะ 3 แบบ (ว่าง / คนถือ / ผูกเครื่อง) ไว้ที่เดียว */
function readSeat(seat, index) {
  if (seat.type === 'available') {
    return {
      n: `#${index + 1}`,
      holder: null,
      holderHint: seat.seatLabel || 'ยังไม่จ่ายสิทธิ์',
      icon: null,
      date: '',
      status: 'พร้อมใช้งาน',
    };
  }
  const a = seat.assignee || {};
  if (a.isAssetBound) {
    return {
      n: `#${index + 1}`,
      holder: a.assignedAssetName || 'ทรัพย์สิน',
      holderHint: a.empName || seat.seatLabel || 'ผูกกับเครื่อง',
      icon: Monitor,
      date: a.checkoutDate || '',
      status: a.empId ? 'ถูกใช้งาน' : 'ติดตั้งบนเครื่อง',
    };
  }
  return {
    n: `#${index + 1}`,
    holder: a.empName || '—',
    holderHint: a.department || seat.seatLabel || '',
    icon: User,
    date: a.checkoutDate || '',
    status: 'ถูกใช้งาน',
  };
}

function StatusChip({ status }) {
  const tone = statusTone(status);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-medium ${tone.badge}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${tone.dot}`} />
      {status}
    </span>
  );
}

/** วันหมดอายุ — แสดงเฉพาะที่ seat ตั้งเอง ถ้าตรงกับของ License ไม่ต้องซ้ำ */
function ExpiryCell({ seat, licenseExpiry, expiring, fmt }) {
  const own = seat.seatExpirationDate;
  if (!own) {
    return <span className="text-stone-300" title={licenseExpiry ? `ใช้วันของ License: ${fmt(licenseExpiry)}` : ''}>ตามสัญญาหลัก</span>;
  }
  return (
    <span className={expiring?.isExpiring ? 'font-medium text-ochre-700' : ''}>
      {fmt(own)}
    </span>
  );
}

export default function SeatTable({
  seats,
  licenseExpiry,
  selectedIds = [],
  onToggleSelect,
  onOpen,
  onReturn,
  checkExpiration,
  formatDate,
}) {
  return (
    <>
      {/* ── ตาราง (md ขึ้นไป) ── */}
      <div className="hidden overflow-hidden rounded-xl border border-stone-200/60 md:block">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="border-b border-stone-200/60 bg-sand-50">
              <th className="w-[44px] py-2.5 pl-4" />
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={`py-2.5 pr-4 text-left text-xs font-medium text-stone-400 ${c.w}`}
                >
                  {c.label}
                </th>
              ))}
              <th className="w-[44px]" />
            </tr>
          </thead>
          <tbody>
            {seats.map((seat, index) => {
              const r = readSeat(seat, index);
              const exp = checkExpiration(seat.seatExpirationDate || licenseExpiry);
              const Icon = r.icon;
              const selected = selectedIds.includes(seat.id);
              return (
                <tr
                  key={seat.id}
                  onClick={() => onOpen(seat)}
                  className={`cursor-pointer border-b border-stone-100 transition-colors last:border-0 hover:[&>td]:bg-sand-50 ${selected ? '[&>td]:bg-clay-50' : ''}`}
                >
                  <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(seat.id)}
                      className="size-3.5 rounded border-stone-300 text-clay-600"
                    />
                  </td>

                  <td className="py-3 pr-4 text-[13px] tabular-nums text-stone-400 whitespace-nowrap">{r.n}</td>

                  <td className="py-3 pr-4">
                    {r.holder ? (
                      <div className="flex items-center gap-2 overflow-hidden">
                        {Icon && <Icon className="size-3.5 shrink-0 text-stone-400" strokeWidth={2} />}
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-stone-800" title={r.holder}>{r.holder}</p>
                          {r.holderHint && <p className="truncate text-[11px] text-stone-400" title={r.holderHint}>{r.holderHint}</p>}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[13px] text-stone-300">{r.holderHint}</span>
                    )}
                  </td>

                  <td className="py-3 pr-4">
                    {seat.productKey ? (
                      <span className="block truncate font-mono text-[11px] text-stone-600" title={seat.productKey}>
                        {seat.productKey}
                      </span>
                    ) : (
                      <span className="text-[13px] text-stone-300">—</span>
                    )}
                  </td>

                  <td className="py-3 pr-4 text-[13px] tabular-nums text-stone-500">{r.date || '—'}</td>

                  <td className="py-3 pr-4 text-[13px] tabular-nums text-stone-500">
                    <ExpiryCell seat={seat} licenseExpiry={licenseExpiry} expiring={exp} fmt={formatDate} />
                  </td>

                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <StatusChip status={r.status} />
                      {seat.type === 'assigned' && !seat.assignee?.isAssetBound && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onReturn(seat); }}
                          className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium text-clay-600 transition-colors hover:bg-clay-100"
                        >
                          รับคืน
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="py-3 pr-4 text-right">
                    <ChevronRight className="inline size-4 text-stone-300" strokeWidth={2} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── การ์ด (จอแคบ) ── */}
      <div className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200/60 md:hidden">
        {seats.map((seat, index) => {
          const r = readSeat(seat, index);
          const Icon = r.icon;
          return (
            <div
              key={seat.id}
              onClick={() => onOpen(seat)}
              className="flex cursor-pointer items-center justify-between gap-2 p-3 transition-colors hover:bg-sand-50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="size-3.5 shrink-0 text-stone-400" strokeWidth={2} />}
                  <p className="truncate text-[13px] font-medium text-stone-800">
                    {r.holder || `สิทธิ์ว่าง ${r.n}`}
                  </p>
                </div>
                <p className="mt-0.5 flex items-center gap-2 truncate text-[11px] text-stone-400">
                  {seat.productKey && (
                    <span className="inline-flex items-center gap-1 truncate font-mono">
                      <KeyRound className="size-2.5 shrink-0" strokeWidth={2} />
                      {seat.productKey}
                    </span>
                  )}
                  {seat.seatExpirationDate && (
                    <span className="inline-flex shrink-0 items-center gap-1">
                      <Calendar className="size-2.5 shrink-0" strokeWidth={2} />
                      {formatDate(seat.seatExpirationDate)}
                    </span>
                  )}
                </p>
              </div>
              <StatusChip status={r.status} />
            </div>
          );
        })}
      </div>
    </>
  );
}
