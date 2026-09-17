import React, { useMemo, useState } from 'react';
import {
  Boxes, Wrench, Wallet, PackageCheck, SlidersHorizontal, X,
} from 'lucide-react';
import { surface, text, button, statusTone, fmt } from '../../ui/earth.js';
import useDashboardMetrics from './useDashboardMetrics.js';
import { MetricCard, Panel, StatusBadge, BarRow, ActionMenu, EmptyState } from '../../ui/earthUI.jsx';

/* ════════════════════════════════════════════════════════════════
   หน้า Dashboard หลัก — ธีม v3 (Earth tone · Minimalist & Clean)

   หลักที่ยึด: หนึ่งหน้าจอตอบได้ 3 คำถาม — มีของเท่าไหร่ / อะไรต้องดูแล /
   ค้างงานอะไรอยู่ · ที่เหลือซ่อนไว้หลังตัวกรองหรือเมนู "..."
   ════════════════════════════════════════════════════════════════ */

const ALL = '__all__';

export default function DashboardPage({
  assets = [], licenses = [], accessories = [], employees = [], repairRequests = [],
  onOpenRepairs, onOpenAssets,
}) {
  const [showFilter, setShowFilter] = useState(false);
  const [company, setCompany] = useState(ALL);

  /* รายชื่อบริษัทมาจากข้อมูลจริง — ไม่ต้องมาตามแก้เมื่อมีบริษัทใหม่ */
  const companies = useMemo(
    () => [...new Set(assets.map(a => a.company?.trim()).filter(Boolean))].sort(),
    [assets],
  );

  const scopedAssets = useMemo(
    () => (company === ALL ? assets : assets.filter(a => a.company?.trim() === company)),
    [assets, company],
  );

  const m = useDashboardMetrics({
    assets: scopedAssets, licenses, accessories, employees, repairs: repairRequests,
  });

  const statusRows = Object.entries(m.status).filter(([, n]) => n > 0);

  /* ตัวกรองบริษัทมีผลกับ "ทรัพย์สิน" เท่านั้น — license / อุปกรณ์เสริม / งานแจ้งซ่อม
     ไม่มีฟิลด์บริษัทในฐานข้อมูล จึงต้องบอกผู้ใช้ตรงๆ แทนที่จะเอามาบวกปนกัน */
  const filtered = company !== ALL;
  const valueCard = filtered
    ? { label: 'มูลค่าทรัพย์สิน', amount: m.assetValue, hint: 'เฉพาะทรัพย์สินของบริษัทนี้' }
    : { label: 'มูลค่ารวม',       amount: m.totalValue, hint: fmt.moneyFull(m.totalValue) };

  return (
    <div className={`${surface.page} min-h-full`}>
      <div className="mx-auto max-w-[1200px] space-y-6 p-6 lg:p-8">

        {/* ── หัวหน้า ── */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={text.h1}>ภาพรวมทรัพย์สิน</h1>
            <p className={`mt-1 ${text.muted}`}>
              {company === ALL ? 'ทุกบริษัท' : company} · {fmt.num(m.assetCount)} รายการ
            </p>
          </div>

          {/* ตัวกรองซ่อนไว้หลังปุ่ม — เปิดใช้เมื่อต้องการเท่านั้น */}
          <button
            type="button" onClick={() => setShowFilter(v => !v)}
            className={button.ghost} aria-expanded={showFilter}
          >
            {showFilter
              ? <X className="size-5" strokeWidth={1.75} />
              : <SlidersHorizontal className="size-5" strokeWidth={1.75} />}
            ตัวกรอง
            {company !== ALL && (
              <span className="rounded-lg bg-clay-100 px-1.5 py-0.5 text-xs font-medium text-clay-600">1</span>
            )}
          </button>
        </header>

        {showFilter && (
          <div className={`${surface.card} flex flex-wrap items-center gap-3 p-5`}>
            <span className={text.label}>บริษัท</span>
            <select
              value={company} onChange={e => setCompany(e.target.value)}
              className="rounded-xl border border-stone-200/60 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition-colors focus:border-clay-600/40 focus:ring-2 focus:ring-clay-600/10"
            >
              <option value={ALL}>ทุกบริษัท</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {company !== ALL && (
              <button
                type="button" onClick={() => setCompany(ALL)}
                className={`${text.faint} transition-colors hover:text-clay-600`}
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        )}

        {/* ── ตัวเลขสรุป ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Boxes} label="ทรัพย์สินทั้งหมด"
            value={fmt.num(m.assetCount)}
            hint={`ครุภัณฑ์สำนักงานอีก ${fmt.num(m.furnitureCount)} รายการ`}
          />
          <MetricCard
            icon={PackageCheck} label="พร้อมส่งมอบ"
            value={fmt.num(m.availableCount)}
            hint={`พนักงานในระบบ ${fmt.num(m.employeeCount)} คน`}
          />
          <MetricCard
            icon={Wrench} label="กำลังซ่อม"
            value={fmt.num(m.openRepairCount)}
            hint={filtered ? 'ทุกบริษัท — แจ้งซ่อมไม่แยกบริษัท' : 'งานแจ้งซ่อมที่ยังไม่ปิด'}
          />
          <MetricCard
            icon={Wallet} label={valueCard.label} tone="accent"
            value={fmt.money(valueCard.amount)}
            hint={valueCard.hint}
          />
        </div>

        {/* ── ต้องดูแล — ขึ้นเฉพาะเมื่อมีจริง ── */}
        {m.attention.length > 0 && (
          <div className={`${surface.card} flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5`}>
            <span className={`${text.label} font-medium`}>ต้องดูแล</span>
            {m.attention.map(a => (
              <span key={a.key} className={text.body}>
                {a.label}
                <b className="ml-2 font-medium tabular-nums text-clay-600">{fmt.num(a.value)}</b>
                <span className={`ml-1 ${text.faint}`}>{a.unit}</span>
              </span>
            ))}
          </div>
        )}

        {/* ── สัดส่วน + สถานะ ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <Panel title="สัดส่วนตามประเภท" meta="ทรัพย์สินหลัก 5 อันดับแรก">
            {m.byType.length === 0 ? (
              <EmptyState>ยังไม่มีข้อมูลทรัพย์สิน</EmptyState>
            ) : (
              <div className="space-y-5">
                {m.byType.map(t => (
                  <BarRow
                    key={t.type} label={t.type} value={t.count}
                    total={m.assetCount} tone="bg-clay-600/70"
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="สถานะทรัพย์สิน" meta={`${fmt.num(m.assetCount)} รายการ`}>
            {statusRows.length === 0 ? (
              <EmptyState>ยังไม่มีข้อมูลทรัพย์สิน</EmptyState>
            ) : (
              <div className="space-y-5">
                {statusRows.map(([label, n]) => (
                  <BarRow
                    key={label} label={label} value={n}
                    total={m.assetCount} tone={statusTone(label).bar}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* ── งานซ่อมที่ค้าง ── */}
        <Panel
          title="งานแจ้งซ่อมที่ค้างอยู่"
          meta={m.openRepairCount > 0 ? `ทั้งหมด ${fmt.num(m.openRepairCount)} งาน` : undefined}
          action={
            <ActionMenu
              items={[
                { key: 'repairs', label: 'ดูงานแจ้งซ่อมทั้งหมด', onSelect: onOpenRepairs },
                { key: 'assets', label: 'ไปหน้าทรัพย์สิน', onSelect: onOpenAssets },
              ]}
            />
          }
        >
          {m.recentRepairs.length === 0 ? (
            <EmptyState>ไม่มีงานค้าง</EmptyState>
          ) : (
            <ul className="-my-1">
              {m.recentRepairs.map((r, i) => (
                <li key={r.id ?? i} className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900">
                      {r.assetName || 'ไม่ระบุอุปกรณ์'}
                    </p>
                    <p className={`mt-0.5 truncate ${text.faint}`}>
                      {[r.empName, r.department].filter(Boolean).join(' · ') || 'ไม่ระบุผู้แจ้ง'}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
