import { KeyRound, Calendar, ChevronRight, Monitor } from 'lucide-react';
import { statusTone } from '../../ui/earth.js';

/* ตารางสิทธิ์ License
   เดิมเป็นลิสต์เต็มความกว้าง แถวละ 923px แต่เนื้อหาจบที่ 283px
   = ที่ว่าง 69% ต่อแถว คูณ 52 แถว และเทียบข้ามแถวไม่ได้เลย
   ข้อมูลต่อสิทธิ์มี 5 อย่าง (สถานะ · ผู้ถือ · key · เบิกเมื่อ · หมดอายุ)
   -> เป็นตาราง กวาดสายตาลงคอลัมน์ได้ ใช้ความกว้างจริง

   รายการสิทธิ์คือ "ของจริง" ของ License (ข้อมูลระดับโปรแกรมเป็นแค่ค่าตั้งต้น)
   จึงให้น้ำหนักกับแถว: อวตารผู้ถือ · สิทธิ์ว่างเป็นวงกลมประ (กดจ่ายได้) · Key เป็นชิป

   จอแคบกว่า md กลับไปเป็นการ์ดเหมือนเดิม (ตารางอ่านไม่ได้บนมือถือ) */

const COLS = [
  { key: 'status', label: 'สถานะ',           w: 'w-[118px]' },   // หน้าสุด — กวาดตาดูว่าว่าง/ถูกใช้ได้ทันที
  { key: 'seat',   label: '#',              w: 'w-[52px]'  },
  { key: 'holder', label: 'ผู้ถือครอง',      w: ''          },
  { key: 'key',    label: 'Product Key',    w: 'w-[22%]'   },
  { key: 'date',   label: 'เบิกเมื่อ',       w: 'w-[96px]' },
  { key: 'exp',    label: 'หมดอายุ',         w: 'w-[116px]' },   // กว้างพอให้ "ตามสัญญาหลัก" อยู่บรรทัดเดียว (แถวไม่สูงเกิน)
];

/** ข้อมูลที่แถวหนึ่งต้องใช้ — รวมตรรกะ 3 แบบ (ว่าง / คนถือ / ผูกเครื่อง) ไว้ที่เดียว */
function readSeat(seat, index) {
  if (seat.type === 'available') {
    return {
      n: `#${index + 1}`,
      kind: 'available',
      holder: null,
      holderHint: seat.seatLabel || 'ยังไม่จ่ายสิทธิ์',
      date: '',
      status: 'พร้อมใช้งาน',
    };
  }
  const a = seat.assignee || {};
  if (a.isAssetBound) {
    return {
      n: `#${index + 1}`,
      kind: 'asset',
      holder: a.assignedAssetName || 'ทรัพย์สิน',
      holderHint: a.empName || seat.seatLabel || 'ผูกกับเครื่อง',
      date: a.checkoutDate || '',
      status: a.empId ? 'ถูกใช้งาน' : 'ติดตั้งบนเครื่อง',
    };
  }
  return {
    n: `#${index + 1}`,
    kind: 'person',
    holder: a.empName || '—',
    holderHint: a.department || seat.seatLabel || '',
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

/** อวตารหน้าแถว — บอกชนิดของสิทธิ์ได้ตั้งแต่ยังไม่อ่านตัวหนังสือ */
function SeatAvatar({ kind, name }) {
  if (kind === 'available') {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-stone-300 text-stone-300">
        <KeyRound className="size-3.5" strokeWidth={2} />
      </span>
    );
  }
  if (kind === 'asset') {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sand-100 text-stone-500">
        <Monitor className="size-3.5" strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-clay-600 text-[11px] font-medium text-white">
      {(name || '?').charAt(0)}
    </span>
  );
}

/** Product Key — ชิปโมโนสเปซ กวาดตาหาได้เร็วกว่าตัวหนังสือลอย */
function KeyCell({ value }) {
  if (!value) return <span className="text-[13px] text-stone-300">—</span>;
  return (
    <span
      className="block w-fit max-w-full truncate rounded-lg bg-sand-100 px-2 py-1 font-mono text-[11px] text-stone-600"
      title={value}
    >
      {value}
    </span>
  );
}

/** วันหมดอายุ — แสดงเฉพาะที่ seat ตั้งเอง ถ้าตรงกับของ License ไม่ต้องซ้ำ */
function ExpiryCell({ seat, licenseExpiry, expiring, fmt }) {
  const own = seat.seatExpirationDate;
  if (!own) {
    // ไม่ระบุวันเลย (ทั้ง seat และ License) → ไม่ต้องแสดงอะไร
    if (!licenseExpiry) return <span className="text-stone-300">—</span>;
    return <span className="text-stone-300" title={`ใช้วันของ License: ${fmt(licenseExpiry)}`}>ตามสัญญาหลัก</span>;
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
                  className={`whitespace-nowrap py-2.5 pr-4 text-left text-xs font-medium text-stone-400 ${c.w}`}
                >
                  {c.label}
                </th>
              ))}
              <th className="w-[96px]" />
            </tr>
          </thead>
          <tbody>
            {seats.map((seat, index) => {
              const r = readSeat(seat, index);
              const exp = checkExpiration(seat.seatExpirationDate || licenseExpiry);
              const selected = selectedIds.includes(seat.id);
              return (
                <tr
                  key={seat.id}
                  onClick={() => onOpen(seat)}
                  className={`cursor-pointer border-b border-stone-100 transition-colors last:border-0 hover:[&>td]:bg-sand-50 ${selected ? '[&>td]:bg-clay-50' : ''}`}
                >
                  <td className="py-3.5 pl-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(seat.id)}
                      className="size-3.5 rounded border-stone-300 text-clay-600"
                    />
                  </td>

                  <td className="py-3.5 pr-4">
                    <StatusChip status={r.status} />
                  </td>

                  <td className="py-3.5 pr-4 text-[13px] tabular-nums text-stone-400 whitespace-nowrap">{r.n}</td>

                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <SeatAvatar kind={r.kind} name={r.holder} />
                      {r.holder ? (
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-stone-800" title={r.holder}>{r.holder}</p>
                          {r.holderHint && <p className="truncate text-[11px] text-stone-400" title={r.holderHint}>{r.holderHint}</p>}
                        </div>
                      ) : (
                        <span className="truncate text-[13px] text-stone-400">{r.holderHint}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 pr-4">
                    <KeyCell value={seat.productKey} />
                  </td>

                  <td className="py-3.5 pr-4 text-[13px] tabular-nums text-stone-500">{r.date || '—'}</td>

                  <td className="py-3.5 pr-4 text-[13px] tabular-nums text-stone-500">
                    <ExpiryCell seat={seat} licenseExpiry={licenseExpiry} expiring={exp} fmt={formatDate} />
                  </td>

                  {/* ท้ายแถว: ปุ่มรับคืน (การกระทำ) + ลูกศร — สถานะย้ายไปหน้าสุดแล้ว */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center justify-end gap-1">
                      {seat.type === 'assigned' && !seat.assignee?.isAssetBound && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onReturn(seat); }}
                          className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium text-clay-600 transition-colors hover:bg-clay-100"
                        >
                          รับคืน
                        </button>
                      )}
                      <ChevronRight className="size-4 shrink-0 text-stone-300" strokeWidth={2} />
                    </div>
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
          return (
            <div
              key={seat.id}
              onClick={() => onOpen(seat)}
              className="flex cursor-pointer items-center justify-between gap-2.5 p-3 transition-colors hover:bg-sand-50"
            >
              <SeatAvatar kind={r.kind} name={r.holder} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-stone-800">
                  {r.holder || `สิทธิ์ว่าง ${r.n}`}
                </p>
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
