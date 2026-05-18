import React from 'react';
import { Server, FileText, Cpu, Users, TrendingUp, Wallet } from 'lucide-react';
import { BRAND } from '../ui/theme.js';

export default function DashboardStats({ assets = [], licenses = [], accessories = [], employees = [] }) {
  /* ── Stats (unchanged logic) ── */
  const totalAssets       = assets.length;
  const assetAvailable    = assets.filter(a => !a.status || a.status === 'พร้อมใช้งาน').length;
  const assetInUse        = assets.filter(a => a.status === 'ถูกใช้งาน').length;
  const assetBroken       = assets.filter(a => a.status === 'ชำรุดเสียหาย' || a.status === 'ไม่สามารถใช้งานได้').length;
  const assetMaintenance  = assets.filter(a => a.status === 'รอดำเนินการ').length;

  const accTotal  = accessories.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const accUsed   = accessories.reduce((s, i) => s + (i.assignees?.length || 0), 0);
  const accBroken = accessories.reduce((s, i) => s + (Number(i.brokenQuantity) || 0), 0);
  const accRemain = Math.max(0, accTotal - accUsed - accBroken);

  const totalLicenses = licenses.length;
  const licAvailable  = licenses.filter(l => !l.status || l.status === 'พร้อมใช้งาน').length;
  const licInUse      = licenses.filter(l => l.status === 'ถูกใช้งาน').length;

  const calcValue    = (arr) => arr.reduce((s, i) => s + (Number(i.cost) || 0), 0);
  const calcAccValue = (arr) => arr.reduce((s, i) => s + ((Number(i.cost) || 0) * (Number(i.quantity) || 0)), 0);

  const assetValue = calcValue(assets);
  const licValue   = calcValue(licenses);
  const accValue   = calcAccValue(accessories);
  const totalValue = assetValue + licValue + accValue;

  const fmt = (v) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(v);
  const pct = (v, t) => (t > 0 ? (v / t) * 100 : 0);

  return (
    <div className="space-y-5">
      {/* ── Row 1: KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="ทรัพย์สินหลัก"
          value={totalAssets}
          unit="รายการ"
          sub={`ใช้งาน ${assetInUse} · ว่าง ${assetAvailable}`}
          icon={Server}
          accent={BRAND.primary}
          tint="#E8EFF8"
        />
        <KpiCard
          label="License / โปรแกรม"
          value={totalLicenses}
          unit="รายการ"
          sub={`ใช้งาน ${licInUse} · ว่าง ${licAvailable}`}
          icon={FileText}
          accent="#7C3AED"
          tint="#F3EEFE"
        />
        <KpiCard
          label="อุปกรณ์เสริม"
          value={accTotal}
          unit="ชิ้น"
          sub={`คงเหลือ ${accRemain} · ใช้ ${accUsed}`}
          icon={Cpu}
          accent="#059669"
          tint="#ECFDF5"
        />
        <KpiCard
          label="พนักงานในระบบ"
          value={employees.length}
          unit="คน"
          sub="ข้อมูลพนักงานทั้งหมด"
          icon={Users}
          accent="#D97706"
          tint="#FFFBEB"
        />
      </div>

      {/* ── Row 2: Status charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ทรัพย์สินหลัก */}
        <ChartCard title="สถานะทรัพย์สินหลัก" subtitle={`${totalAssets} รายการ`}>
          <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden mb-5">
            <div style={{ width: `${pct(assetAvailable, totalAssets)}%` }}   className="bg-emerald-500 transition-all" />
            <div style={{ width: `${pct(assetInUse, totalAssets)}%`,    backgroundColor: BRAND.primary }} className="transition-all" />
            <div style={{ width: `${pct(assetMaintenance, totalAssets)}%` }} className="bg-amber-400 transition-all" />
            <div style={{ width: `${pct(assetBroken, totalAssets)}%` }}      className="bg-rose-400 transition-all" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'พร้อมใช้',   value: assetAvailable,    color: '#10b981' },
              { label: 'ถูกใช้งาน', value: assetInUse,         color: BRAND.primary },
              { label: 'รอจัดการ',  value: assetMaintenance,   color: '#fbbf24' },
              { label: 'ชำรุด',     value: assetBroken,        color: '#fb7185' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10px] text-slate-400 font-medium">{s.label}</span>
                </div>
                <p className="text-[17px] font-semibold text-slate-800 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* อุปกรณ์เสริม */}
        <ChartCard title="สถานะอุปกรณ์เสริม" subtitle={`${accTotal} ชิ้น`}>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0 w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                {accTotal > 0 && (
                  <>
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4"
                      strokeDasharray={`${pct(accRemain, accTotal) * 0.879} 87.9`} strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke={BRAND.primary} strokeWidth="4"
                      strokeDasharray={`${pct(accUsed, accTotal) * 0.879} 87.9`}
                      strokeDashoffset={`-${pct(accRemain, accTotal) * 0.879}`} strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#fb7185" strokeWidth="4"
                      strokeDasharray={`${pct(accBroken, accTotal) * 0.879} 87.9`}
                      strokeDashoffset={`-${(pct(accRemain, accTotal) + pct(accUsed, accTotal)) * 0.879}`} strokeLinecap="round" />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[15px] font-semibold text-slate-800 tabular-nums">{accTotal}</span>
                <span className="text-[9px] text-slate-400">ทั้งหมด</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {[
                { label: 'คงเหลือ (คลัง)', value: accRemain,  color: '#10b981' },
                { label: 'ถูกใช้งาน',       value: accUsed,    color: BRAND.primary },
                { label: 'ชำรุด / เสีย',    value: accBroken,  color: '#fb7185' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[12.5px] text-slate-500">{s.label}</span>
                  </div>
                  <span className="text-[13.5px] font-semibold text-slate-800 tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Row 3: Value summary + License ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* มูลค่ารวม */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-[#1E487A]/15"
          style={{
            background:
              'radial-gradient(100% 80% at 0% 0%, #2A5896 0%, #1E487A 50%, #163963 100%)',
          }}
        >
          {/* decorative ring */}
          <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full border border-white/5 pointer-events-none" />

          <div className="flex items-center gap-2 mb-1 relative">
            <Wallet className="h-3.5 w-3.5 text-blue-200" strokeWidth={2} />
            <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-[0.14em]">มูลค่าทรัพย์สินรวม</p>
          </div>
          <p className="text-[32px] font-bold text-white mb-5 tabular-nums leading-tight relative">{fmt(totalValue)}</p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/15 relative">
            {[
              { label: 'ทรัพย์สินหลัก', value: fmt(assetValue) },
              { label: 'License',        value: fmt(licValue)   },
              { label: 'อุปกรณ์เสริม',  value: fmt(accValue)   },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10.5px] text-blue-200/80 font-medium mb-1 tracking-wide">{item.label}</p>
                <p className="text-[13.5px] font-semibold text-white tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* License allocation */}
        <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-3.5 w-3.5 text-violet-500" strokeWidth={2} />
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.14em]">การจัดสรร License</p>
            </div>
            <p className="text-[28px] font-bold text-slate-900 mb-1 tabular-nums leading-tight">
              {totalLicenses} <span className="text-sm font-medium text-slate-400">รายการ</span>
            </p>
          </div>

          <div className="mt-4">
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct(licInUse, totalLicenses)}%`, backgroundColor: BRAND.primary }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50/70 rounded-lg px-3 py-2.5 ring-1 ring-slate-100">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10.5px] text-slate-500 font-medium">ว่าง</span>
                </div>
                <p className="text-[17px] font-semibold text-slate-800 tabular-nums">{licAvailable}</p>
              </div>
              <div className="bg-slate-50/70 rounded-lg px-3 py-2.5 ring-1 ring-slate-100">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
                  <span className="text-[10.5px] text-slate-500 font-medium">ถูกใช้</span>
                </div>
                <p className="text-[17px] font-semibold text-slate-800 tabular-nums">{licInUse}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, unit, sub, icon: Icon, accent, tint }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:ring-slate-300/70 transition-all">
      <div className="flex items-start justify-between">
        <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-[0.1em]">{label}</p>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: tint, color: accent }}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
      </div>
      <div>
        <p className="text-[26px] font-bold text-slate-900 tabular-nums leading-tight">
          {value}
          <span className="text-[13px] font-medium text-slate-400 ml-1.5">{unit}</span>
        </p>
        <p className="text-[12px] mt-1 font-medium" style={{ color: accent }}>{sub}</p>
      </div>
      <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full w-2/3 rounded-full opacity-50" style={{ backgroundColor: accent }} />
      </div>
    </div>
  );
}

/* ── Chart Card wrapper ── */
function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13.5px] font-semibold text-slate-800 tracking-tight">{title}</p>
        <span className="text-[11.5px] text-slate-400 font-medium tabular-nums">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}
