import React from 'react';

export default function DashboardStats({ assets = [], licenses = [], accessories = [], employees = [] }) {

  /* ── คำนวณสถิติ (ไม่แก้ logic เดิม) ── */
  const totalAssets     = assets.length;
  const assetAvailable  = assets.filter(a => !a.status || a.status === 'พร้อมใช้งาน').length;
  const assetInUse      = assets.filter(a => a.status === 'ถูกใช้งาน').length;
  const assetBroken     = assets.filter(a => a.status === 'ชำรุดเสียหาย' || a.status === 'ไม่สามารถใช้งานได้').length;
  const assetMaintenance= assets.filter(a => a.status === 'รอดำเนินการ').length;

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

  const fmt     = (v) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(v);
  const pct     = (v, t) => t > 0 ? (v / t) * 100 : 0;

  return (
    <div className="space-y-5" style={{ fontFamily: "'Prompt', sans-serif" }}>

      {/* ── Row 1: KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="ทรัพย์สินหลัก"
          value={totalAssets}
          unit="รายการ"
          sub={`ใช้งาน ${assetInUse} · ว่าง ${assetAvailable}`}
          icon={<IconMonitor />}
          accent="#1E487A"
        />
        <KpiCard
          label="License / โปรแกรม"
          value={totalLicenses}
          unit="รายการ"
          sub={`ใช้งาน ${licInUse} · ว่าง ${licAvailable}`}
          icon={<IconDoc />}
          accent="#1E487A"
        />
        <KpiCard
          label="อุปกรณ์เสริม"
          value={accTotal}
          unit="ชิ้น"
          sub={`คงเหลือ ${accRemain} · ใช้ ${accUsed}`}
          icon={<IconDevice />}
          accent="#1E487A"
        />
        <KpiCard
          label="พนักงานในระบบ"
          value={employees.length}
          unit="คน"
          sub="ข้อมูลพนักงานทั้งหมด"
          icon={<IconUsers />}
          accent="#1E487A"
        />
      </div>

      {/* ── Row 2: Status charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ทรัพย์สินหลัก */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-700">สถานะทรัพย์สินหลัก</p>
            <span className="text-xs text-slate-400">{totalAssets} รายการ</span>
          </div>

          {/* Stacked bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden mb-4">
            <div style={{ width: `${pct(assetAvailable, totalAssets)}%` }}   className="bg-emerald-500 transition-all" />
            <div style={{ width: `${pct(assetInUse, totalAssets)}%` }}        className="bg-[#1E487A] transition-all" />
            <div style={{ width: `${pct(assetMaintenance, totalAssets)}%` }}  className="bg-amber-400 transition-all" />
            <div style={{ width: `${pct(assetBroken, totalAssets)}%` }}       className="bg-red-400 transition-all" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'พร้อมใช้',   value: assetAvailable,   dot: 'bg-emerald-500' },
              { label: 'ถูกใช้งาน', value: assetInUse,        dot: 'bg-[#1E487A]'  },
              { label: 'รอจัดการ',  value: assetMaintenance,  dot: 'bg-amber-400'  },
              { label: 'ชำรุด',     value: assetBroken,       dot: 'bg-red-400'    },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  <span className="text-[10px] text-slate-400 font-medium">{s.label}</span>
                </div>
                <p className="text-base font-bold text-slate-800">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* อุปกรณ์เสริม */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-700">สถานะอุปกรณ์เสริม</p>
            <span className="text-xs text-slate-400">{accTotal} ชิ้น</span>
          </div>

          <div className="flex items-center gap-5">
            {/* Donut */}
            <div className="relative shrink-0 w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                {accTotal > 0 && <>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4"
                    strokeDasharray={`${pct(accRemain, accTotal) * 0.879} 87.9`} strokeLinecap="round" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1E487A" strokeWidth="4"
                    strokeDasharray={`${pct(accUsed, accTotal) * 0.879} 87.9`}
                    strokeDashoffset={`-${pct(accRemain, accTotal) * 0.879}`} strokeLinecap="round" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f87171" strokeWidth="4"
                    strokeDasharray={`${pct(accBroken, accTotal) * 0.879} 87.9`}
                    strokeDashoffset={`-${(pct(accRemain, accTotal) + pct(accUsed, accTotal)) * 0.879}`} strokeLinecap="round" />
                </>}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-slate-800">{accTotal}</span>
                <span className="text-[9px] text-slate-400">ทั้งหมด</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2.5">
              {[
                { label: 'คงเหลือ (คลัง)', value: accRemain, dot: 'bg-emerald-500' },
                { label: 'ถูกใช้งาน',       value: accUsed,   dot: 'bg-[#1E487A]'  },
                { label: 'ชำรุด / เสีย',    value: accBroken, dot: 'bg-red-400'    },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <span className="text-xs text-slate-500">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Value summary + License ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* มูลค่ารวม */}
        <div className="lg:col-span-2 bg-[#1E487A] rounded-xl p-6 text-white">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">มูลค่าทรัพย์สินรวม</p>
          <p className="text-3xl font-bold text-white mb-5">{fmt(totalValue)}</p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {[
              { label: 'ทรัพย์สินหลัก', value: fmt(assetValue) },
              { label: 'License',        value: fmt(licValue)   },
              { label: 'อุปกรณ์เสริม',  value: fmt(accValue)   },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] text-blue-200 font-medium mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* License allocation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">การจัดสรร License</p>
            <p className="text-3xl font-bold text-slate-800 mb-1">
              {totalLicenses} <span className="text-sm font-medium text-slate-400">รายการ</span>
            </p>
          </div>

          {/* progress bar */}
          <div className="mt-4">
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-3">
              <div
                className="h-full bg-[#1E487A] rounded-full transition-all"
                style={{ width: `${pct(licInUse, totalLicenses)}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-medium">ว่าง</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{licAvailable}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E487A]" />
                  <span className="text-[10px] text-slate-400 font-medium">ถูกใช้</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{licInUse}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, unit, sub, icon, accent }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">
          {value} <span className="text-sm font-medium text-slate-400">{unit}</span>
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

/* ── Micro SVG Icons ── */
function IconMonitor() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconDevice() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
