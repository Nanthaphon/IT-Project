import React, { useMemo } from 'react';
import {
  Server, FileText, Cpu, Users, Wallet, Activity,
  Layers, Package, Building2, Sparkles,
} from 'lucide-react';
import { BRAND } from '../ui/theme.js';

export default function DashboardStats({ assets = [], licenses = [], accessories = [], employees = [] }) {
  /* ════════════════════════════════════════════════
     คำนวณข้อมูล
  ════════════════════════════════════════════════ */
  const stats = useMemo(() => {
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

    const assetByType = {};
    assets.forEach(a => {
      const t = a.type?.trim() || 'ไม่ระบุประเภท';
      if (!assetByType[t]) assetByType[t] = { count: 0, value: 0, type: t };
      assetByType[t].count += 1;
      assetByType[t].value += Number(a.cost) || 0;
    });
    const assetTypeBreakdown = Object.values(assetByType).sort((a, b) => b.value - a.value);

    const empByDept = {};
    employees.forEach(e => {
      const d = e.department?.trim() || 'ไม่ระบุแผนก';
      empByDept[d] = (empByDept[d] || 0) + 1;
    });
    const deptBreakdown = Object.entries(empByDept)
      .map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAssets, assetAvailable, assetInUse, assetBroken, assetMaintenance,
      accTotal, accUsed, accBroken, accRemain,
      totalLicenses, licAvailable, licInUse,
      assetValue, licValue, accValue, totalValue,
      assetTypeBreakdown, deptBreakdown,
    };
  }, [assets, licenses, accessories, employees]);

  const fmt = (v) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(v);
  const fmtShort = (v) => {
    if (v >= 1_000_000) return `฿${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `฿${(v / 1_000).toFixed(1)}K`;
    return `฿${v.toLocaleString()}`;
  };
  const pct = (v, t) => (t > 0 ? (v / t) * 100 : 0);

  return (
    <div className="space-y-4">

      {/* ════════════════════════════════════════════
          ROW 1 — 4 KPI Cards (refined)
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="ทรัพย์สินหลัก"
          value={stats.totalAssets}
          unit="รายการ"
          breakdown={[
            { label: 'ใช้', value: stats.assetInUse, color: BRAND.primary },
            { label: 'ว่าง', value: stats.assetAvailable, color: '#10b981' },
            { label: 'ชำรุด', value: stats.assetBroken, color: '#f43f5e' },
          ]}
          icon={Server}
          accent={BRAND.primary}
        />
        <KpiCard
          label="License"
          value={stats.totalLicenses}
          unit="รายการ"
          breakdown={[
            { label: 'ใช้', value: stats.licInUse, color: '#7C3AED' },
            { label: 'ว่าง', value: stats.licAvailable, color: '#10b981' },
          ]}
          icon={FileText}
          accent="#7C3AED"
        />
        <KpiCard
          label="อุปกรณ์เสริม"
          value={stats.accTotal}
          unit="ชิ้น"
          breakdown={[
            { label: 'คงเหลือ', value: stats.accRemain, color: '#059669' },
            { label: 'ใช้', value: stats.accUsed, color: BRAND.primary },
            { label: 'ชำรุด', value: stats.accBroken, color: '#f43f5e' },
          ]}
          icon={Cpu}
          accent="#059669"
        />
        <KpiCard
          label="พนักงาน"
          value={employees.length}
          unit="คน"
          breakdown={[
            { label: 'แผนก', value: stats.deptBreakdown.length, color: '#D97706' },
          ]}
          icon={Users}
          accent="#D97706"
        />
      </div>

      {/* ════════════════════════════════════════════
          ROW 2 — มูลค่ารวม (1/3) + มูลค่าแยกตามประเภท (2/3)
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* ── Total Value card (compact) ── */}
        <div
          className="lg:col-span-1 rounded-2xl text-white relative overflow-hidden shadow-lg shadow-[#1E487A]/20"
          style={{
            background: 'radial-gradient(circle at 0% 0%, #2A5896 0%, #1E487A 50%, #163963 100%)',
          }}
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full border border-white/5 pointer-events-none" />

          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Wallet className="h-3.5 w-3.5 text-white" strokeWidth={2.2} />
              </div>
              <p className="text-[10.5px] font-bold text-blue-200 uppercase tracking-[0.14em]">มูลค่าทรัพย์สินรวม</p>
            </div>

            <p className="text-[26px] font-bold text-white tabular-nums leading-tight mb-4">{fmt(stats.totalValue)}</p>

            {stats.totalValue > 0 && (
              <div className="mb-3">
                <div className="w-full h-2 rounded-full bg-white/10 flex overflow-hidden">
                  <div className="h-full transition-all duration-500" style={{ width: `${pct(stats.assetValue, stats.totalValue)}%`, background: '#60A5FA' }} />
                  <div className="h-full transition-all duration-500" style={{ width: `${pct(stats.licValue, stats.totalValue)}%`, background: '#A78BFA' }} />
                  <div className="h-full transition-all duration-500" style={{ width: `${pct(stats.accValue, stats.totalValue)}%`, background: '#34D399' }} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {[
                { label: 'ทรัพย์สินหลัก', value: stats.assetValue, color: '#60A5FA' },
                { label: 'License',        value: stats.licValue,   color: '#A78BFA' },
                { label: 'อุปกรณ์เสริม',  value: stats.accValue,   color: '#34D399' },
              ].map(item => {
                const p = pct(item.value, stats.totalValue);
                return (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[12px] text-blue-100/90 font-medium truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-blue-200/60 tabular-nums">{p.toFixed(0)}%</span>
                      <span className="text-[12.5px] font-bold text-white tabular-nums min-w-[52px] text-right">{fmtShort(item.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Asset value by type (2/3 col) ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF', color: BRAND.primary }}>
                <Layers className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-800 tracking-tight">มูลค่าทรัพย์สินหลัก</p>
                <p className="text-[11px] text-slate-400 mt-0.5">แยกตามประเภท · เรียงจากมาก → น้อย</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wide">รวม</p>
              <p className="text-[15px] font-bold text-slate-800 tabular-nums">{fmt(stats.assetValue)}</p>
            </div>
          </div>

          {stats.assetTypeBreakdown.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-[13px]">ยังไม่มีข้อมูลทรัพย์สิน</div>
          ) : (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {stats.assetTypeBreakdown.map((item, idx) => {
                const percent = stats.assetValue > 0 ? (item.value / stats.assetValue) * 100 : 0;
                const colors = ['#1E487A', '#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#BE185D'];
                const color = colors[idx % colors.length];
                return (
                  <div key={item.type} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-[13px] font-semibold text-slate-700 truncate">{item.type}</span>
                        <span className="text-[10.5px] text-slate-400 font-medium tabular-nums shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.count}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[10.5px] text-slate-400 font-medium tabular-nums">{percent.toFixed(1)}%</span>
                        <span className="text-[13px] font-bold text-slate-800 tabular-nums min-w-[68px] text-right">{fmtShort(item.value)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                        style={{
                          width: `${Math.max(percent, 1)}%`,
                          background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          ROW 3 — สถานะทรัพย์สิน + อุปกรณ์เสริม (2 cols)
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* สถานะทรัพย์สินหลัก */}
        <ChartCard title="สถานะทรัพย์สินหลัก" subtitle={`${stats.totalAssets} รายการ`} icon={Activity} iconColor={BRAND.primary}>
          <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden mb-4">
            <div style={{ width: `${pct(stats.assetInUse, stats.totalAssets)}%`, backgroundColor: BRAND.primary }} className="transition-all duration-500" />
            <div style={{ width: `${pct(stats.assetAvailable, stats.totalAssets)}%` }} className="bg-emerald-500 transition-all duration-500" />
            <div style={{ width: `${pct(stats.assetMaintenance, stats.totalAssets)}%` }} className="bg-amber-400 transition-all duration-500" />
            <div style={{ width: `${pct(stats.assetBroken, stats.totalAssets)}%` }} className="bg-rose-400 transition-all duration-500" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'ถูกใช้งาน', value: stats.assetInUse,        color: BRAND.primary, bg: '#EFF6FF' },
              { label: 'พร้อมใช้',   value: stats.assetAvailable,    color: '#10b981',     bg: '#ECFDF5' },
              { label: 'รอจัดการ',  value: stats.assetMaintenance,  color: '#f59e0b',     bg: '#FFFBEB' },
              { label: 'ชำรุด',     value: stats.assetBroken,        color: '#f43f5e',     bg: '#FEF2F2' },
            ].map(s => (
              <div key={s.label} className="rounded-lg px-2 py-2 text-center" style={{ background: s.bg }}>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10.5px] text-slate-500 font-semibold">{s.label}</span>
                </div>
                <p className="text-[18px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* สถานะอุปกรณ์เสริม */}
        <ChartCard title="สถานะอุปกรณ์เสริม" subtitle={`${stats.accTotal} ชิ้น`} icon={Package} iconColor="#059669">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0 w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                {stats.accTotal > 0 && (
                  <>
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4.5"
                      strokeDasharray={`${pct(stats.accRemain, stats.accTotal) * 0.879} 87.9`} strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke={BRAND.primary} strokeWidth="4.5"
                      strokeDasharray={`${pct(stats.accUsed, stats.accTotal) * 0.879} 87.9`}
                      strokeDashoffset={`-${pct(stats.accRemain, stats.accTotal) * 0.879}`} strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#fb7185" strokeWidth="4.5"
                      strokeDasharray={`${pct(stats.accBroken, stats.accTotal) * 0.879} 87.9`}
                      strokeDashoffset={`-${(pct(stats.accRemain, stats.accTotal) + pct(stats.accUsed, stats.accTotal)) * 0.879}`} strokeLinecap="round" />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[17px] font-bold text-slate-800 tabular-nums">{stats.accTotal}</span>
                <span className="text-[9.5px] text-slate-400 font-medium">ชิ้น</span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              {[
                { label: 'คงเหลือ (คลัง)', value: stats.accRemain, color: '#10b981', bg: '#ECFDF5' },
                { label: 'ถูกใช้งาน',       value: stats.accUsed,    color: BRAND.primary, bg: '#EFF6FF' },
                { label: 'ชำรุด / เสีย',    value: stats.accBroken,  color: '#f43f5e', bg: '#FEF2F2' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ background: s.bg }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[12.5px] text-slate-600 font-medium">{s.label}</span>
                  </div>
                  <span className="text-[14px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ════════════════════════════════════════════
          ROW 4 — License + Department (2 cols)
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* การจัดสรร License */}
        <ChartCard title="การจัดสรร License" subtitle={`${stats.totalLicenses} รายการ`} icon={Sparkles} iconColor="#7C3AED">
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct(stats.licInUse, stats.totalLicenses)}%`, background: 'linear-gradient(90deg, #1E487A 0%, #7C3AED 100%)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl px-3.5 py-3" style={{ background: '#ECFDF5' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11.5px] text-slate-600 font-semibold">ว่าง</span>
              </div>
              <p className="text-[20px] font-bold text-emerald-700 tabular-nums">{stats.licAvailable}</p>
              <p className="text-[10.5px] text-slate-400 mt-0.5">{pct(stats.licAvailable, stats.totalLicenses).toFixed(1)}%</p>
            </div>
            <div className="rounded-xl px-3.5 py-3" style={{ background: '#F5F3FF' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                <span className="text-[11.5px] text-slate-600 font-semibold">ถูกใช้</span>
              </div>
              <p className="text-[20px] font-bold text-violet-700 tabular-nums">{stats.licInUse}</p>
              <p className="text-[10.5px] text-slate-400 mt-0.5">{pct(stats.licInUse, stats.totalLicenses).toFixed(1)}%</p>
            </div>
          </div>
        </ChartCard>

        {/* พนักงานแยกตามแผนก (Top 5) */}
        <ChartCard title="พนักงานแยกตามแผนก" subtitle={`Top 5 จาก ${stats.deptBreakdown.length} แผนก`} icon={Building2} iconColor="#D97706">
          {stats.deptBreakdown.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-[13px]">ยังไม่มีข้อมูลพนักงาน</div>
          ) : (
            <div className="space-y-2.5">
              {stats.deptBreakdown.map((d, i) => {
                const maxCount = stats.deptBreakdown[0].count;
                const percent = (d.count / maxCount) * 100;
                const colors = ['#1E487A', '#7C3AED', '#059669', '#D97706', '#DC2626'];
                const color = colors[i % colors.length];
                return (
                  <div key={d.dept}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold text-slate-700 truncate flex-1">{d.dept}</span>
                      <span className="text-[13px] font-bold tabular-nums shrink-0 ml-2" style={{ color }}>
                        {d.count} <span className="text-[10.5px] text-slate-400 font-medium">คน</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ─── KPI Card (refined — clean & spacious) ───
════════════════════════════════════════════════ */
function KpiCard({ label, value, unit, breakdown = [], icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-5 hover:shadow-md hover:ring-slate-300/70 transition-all group relative overflow-hidden">

      {/* Accent corner */}
      <div
        className="absolute -right-12 -top-12 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.10] transition-opacity"
        style={{ background: accent }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11.5px] font-bold text-slate-500 uppercase tracking-[0.1em]">{label}</p>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}15`, color: accent }}
          >
            <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
          </div>
        </div>

        <p className="text-[26px] font-bold text-slate-900 tabular-nums leading-tight mb-3">
          {value.toLocaleString()}
          <span className="text-[12.5px] font-semibold text-slate-400 ml-1.5">{unit}</span>
        </p>

        {breakdown.length > 0 && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            {breakdown.map((b, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                <span className="text-[11px] text-slate-500 font-medium">{b.label}</span>
                <span className="text-[12px] font-bold tabular-nums" style={{ color: b.color }}>{b.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ─── Chart Card wrapper (with icon header) ───
════════════════════════════════════════════════ */
function ChartCard({ title, subtitle, icon: Icon, iconColor, children }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${iconColor}15`, color: iconColor }}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </div>
          )}
          <p className="text-[14px] font-bold text-slate-800 tracking-tight">{title}</p>
        </div>
        <span className="text-[11.5px] text-slate-400 font-semibold tabular-nums">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}
