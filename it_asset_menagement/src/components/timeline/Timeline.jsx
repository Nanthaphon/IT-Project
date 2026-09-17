import {
  ShoppingCart, ArrowUpRight, ArrowDownLeft, KeyRound, Unlink, Wrench, Info,
} from 'lucide-react';
import { EVENT_KIND, thaiDate, thaiTime, spanLabel, summarize } from './buildTimeline.js';

/* โทนตาม TONE ใน src/ui/earth.js — ไม่มีขอบ, พื้นอ่อน, font-medium */
const TONE = {
  clay:    { dot: 'bg-clay-600',   ring: 'ring-clay-600/15',   chip: 'bg-clay-100 text-clay-600'    },
  olive:   { dot: 'bg-olive-600',  ring: 'ring-olive-600/15',  chip: 'bg-olive-50 text-olive-700'   },
  ochre:   { dot: 'bg-ochre-600',  ring: 'ring-ochre-600/15',  chip: 'bg-ochre-50 text-ochre-700'   },
  brick:   { dot: 'bg-brick-500',  ring: 'ring-brick-500/15',  chip: 'bg-rose-50 text-rose-700'     },
  neutral: { dot: 'bg-sand-300',   ring: 'ring-stone-300/20',  chip: 'bg-sand-100 text-stone-600'   },
};

const ICON = {
  purchase: ShoppingCart,
  checkout: ArrowUpRight,
  checkin:  ArrowDownLeft,
  licOn:    KeyRound,
  licOff:   Unlink,
  repair:   Wrench,
  seatOn:   KeyRound,
  seatOff:  Unlink,
};

/* ── การ์ดสรุปด้านบน ─────────────────────────────────────── */
function Summary({ events, holderLabel, holderKinds, assignLabel }) {
  const s = summarize(events, holderKinds);
  const cells = [
    { label: 'เหตุการณ์ทั้งหมด', value: s.total },
    { label: holderLabel, value: s.holders },
    { label: assignLabel, value: `${s.assigns} ครั้ง` },
    { label: 'อยู่ในระบบมาแล้ว', value: s.ageLabel || '—' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cells.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-stone-200/60 px-4 py-3.5">
          <p className="text-xs font-medium text-stone-400">{c.label}</p>
          <p className="mt-1 text-[19px] font-medium text-stone-900 tabular-nums leading-tight">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── หนึ่งเหตุการณ์ ──────────────────────────────────────── */
function Row({ event, nextMs, isLast }) {
  const meta = EVENT_KIND[event.kind] || EVENT_KIND.checkout;
  const tone = TONE[meta.tone] || TONE.neutral;
  const Icon = ICON[event.kind] || Info;
  const time = thaiTime(event.ms, event.exactTime);

  /* ระยะห่างจากเหตุการณ์ก่อนหน้า (รายการเรียงใหม่->เก่า จึงเทียบกับตัวถัดไป) */
  const gap = nextMs != null ? spanLabel(nextMs, event.ms) : '';

  return (
    <li className="relative pl-12 pb-6 last:pb-0">
      {/* เส้นแกน */}
      {!isLast && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-stone-200/70" aria-hidden />}

      {/* จุด */}
      <span
        className={`absolute left-0 top-0.5 flex size-8 items-center justify-center rounded-xl ring-4 ${tone.ring} ${tone.dot}`}
      >
        <Icon className="size-4 text-white" strokeWidth={2} />
      </span>

      <div className="bg-white rounded-xl border border-stone-200/60 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${tone.chip}`}>
            {meta.label}
          </span>
          <span className="text-sm font-medium text-stone-900">{event.title}</span>
          {event.matchedByName && (
            <span
              className="inline-flex items-center rounded-lg bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-stone-500"
              title="รายการนี้จับคู่จากชื่อ เพราะข้อมูลรุ่นเก่าไม่ได้เก็บรหัสอ้างอิงไว้ — อาจไม่ครบทุกรายการ"
            >
              จับคู่จากชื่อ
            </span>
          )}
        </div>

        {(event.by || event.detail) && (
          <p className="mt-1.5 text-sm text-stone-700">
            {event.by}
            {event.by && event.detail ? <span className="text-stone-300"> · </span> : null}
            {event.detail && <span className="text-stone-500">{event.detail}</span>}
          </p>
        )}

        {event.note && <p className="mt-1 text-[13px] text-stone-500">{event.note}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-stone-400">
          <span className="tabular-nums">{thaiDate(event.ms)}</span>
          {time && <span className="tabular-nums">{time}</span>}
          {event.docs > 0 && <span>แนบเอกสาร {event.docs} ไฟล์</span>}
          {gap && <span className="text-stone-300">ห่างจากรายการก่อนหน้า {gap}</span>}
        </div>
      </div>
    </li>
  );
}

/**
 * Timeline — ประวัติทั้งหมดที่เกี่ยวข้องกับทรัพย์สิน/License ชิ้นหนึ่ง
 * เรียงตามเวลา ใหม่ -> เก่า
 *
 * @param {array}  events       ผลลัพธ์จาก buildAssetTimeline / buildLicenseTimeline
 * @param {string} emptyHint    ข้อความเมื่อยังไม่มีประวัติ
 * @param {string} holderLabel  ป้ายในการ์ดสรุป (ผู้ถือครอง / เครื่องที่เคยผูก)
 */
export default function Timeline({
  events = [],
  emptyHint = 'ยังไม่มีประวัติการใช้งานของทรัพย์สินชิ้นนี้',
  holderLabel = 'ผู้เคยถือครอง',
  holderKinds = ['checkout'],
  assignLabel = 'เบิกจ่ายไปแล้ว',
}) {
  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white/60 py-16 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-sand-100 text-stone-400">
          <Info className="size-5" strokeWidth={1.8} />
        </div>
        <p className="text-sm font-medium text-stone-500">{emptyHint}</p>
        <p className="mt-1 text-[13px] text-stone-400">
          ประวัติจะถูกบันทึกอัตโนมัติเมื่อมีการเบิกจ่าย รับคืน หรือผูก License
        </p>
      </div>
    );
  }

  return (
    <div>
      <Summary events={events} holderLabel={holderLabel} holderKinds={holderKinds} assignLabel={assignLabel} />
      <ol className="relative">
        {events.map((e, i) => (
          <Row
            key={`${e.kind}-${e.ms}-${i}`}
            event={e}
            nextMs={events[i + 1]?.ms}
            isLast={i === events.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}
