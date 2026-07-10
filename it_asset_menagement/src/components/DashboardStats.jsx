import React, { useMemo } from 'react';
import {
  Server, FileText, Cpu, Users, Wallet, Activity,
  Layers, Package, Building2, Sparkles, ArrowUpRight, Boxes,
  CheckCircle2, AlertCircle,
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
    const assetReserve      = assets.filter(a => a.status === 'สำรอง').length;
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
      .slice(0, 6);

    return {
      totalAssets, assetAvailable, assetInUse, assetReserve, assetBroken, assetMaintenance,
      accTotal, accUsed, accBroken, accRemain,
      totalLicenses, licAvailable, licInUse,
      assetValue, licValue, accValue, totalValue,
      assetTypeBreakdown, deptBreakdown,
    };
  }, [assets, licenses, accessories, employees]);

  const fmt = (v) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(v);
  const fmtShort = (v) => {
    if (v >= 1_000_000) return `฿${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `฿${(v / 1_000).toFixed(0)}K`;
    return `฿${v.toLocaleString()}`;
  };
  const pct = (v, t) => (t > 0 ? (v / t) * 100 : 0);

  // คำนวณ stroke-dasharray สำหรับ donut chart (circumference = 87.9 ที่ r=14)
  const donutSegment = (val, total) => `${pct(val, total) * 0.879} 87.9`;
  const donutOffset  = (acc, total) => `-${pct(acc, total) * 0.879}`;

  return (
    <div className="space-y-4">

      {/* ════════════════════════════════════════════
          ROW 1 — Welcome Header Strip
          ════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
          <HeaderStat label="ทรัพย์สินรวม" value={stats.totalAssets} unit="รายการ" icon={Server} color={BRAND.primary} />
          <HeaderStat label="License ทั้งหมด" value={stats.totalLicenses} unit="รายการ" icon={FileText} color="#7C3AED" />
          <HeaderStat label="อุปกรณ์ในคลัง" value={stats.accTotal} unit="ชิ้น" icon={Boxes} color="#059669" />
          <HeaderStat label="พนักงาน" value={employees.length} unit="คน" icon={Users} color="#D97706" />
        </div>
      </div>

      {/* ════════════════════════════════════════════
          ROW 2 — Featured Section (Donut + Asset Value by Type)
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── Donut + Total value (2/5 col) ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">

          {/* Dark gradient header */}
          <div
            className="px-5 py-4 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1E487A 0%, #2A5896 50%, #163963 100%)' }}
          >
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-3.5 w-3.5 text-blue-200" strokeWidth={2.2} />
                <p className="text-[10.5px] font-bold text-blue-200 uppercase tracking-[0.14em]">มูลค่าทรัพย์สินรวม</p>
              </div>
              <p className="text-[26px] font-bold tabular-nums leading-tight">{fmt(stats.totalValue)}</p>
            </div>
          </div>

          {/* Donut chart body */}
          <div className="p-5 flex items-center gap-5">
            <div className="relative shrink-0 w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="5.5" />
                {stats.totalValue > 0 && (
                  <>
                    <circle cx="18" cy="18" r="14" fill="none" stroke={BRAND.primary} strokeWidth="5.5"
                      strokeDasharray={donutSegment(stats.assetValue, stats.totalValue)}
                      strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#7C3AED" strokeWidth="5.5"
                      strokeDasharray={donutSegment(stats.licValue, stats.totalValue)}
                      strokeDashoffset={donutOffset(stats.assetValue, stats.totalValue)}
                      strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#059669" strokeWidth="5.5"
                      strokeDasharray={donutSegment(stats.accValue, stats.totalValue)}
                      strokeDashoffset={donutOffset(stats.assetValue + stats.licValue, stats.totalValue)}
                      strokeLinecap="round" />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] text-slate-400 font-medium">3 หมวด</span>
                <span className="text-[18px] font-bold text-slate-800 tabular-nums">{fmtShort(stats.totalValue)}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2.5">
              {[
                { label: 'ทรัพย์สินหลัก', value: stats.assetValue, color: BRAND.primary },
                { label: 'License',        value: stats.licValue,   color: '#7C3AED' },
                { label: 'อุปกรณ์เสริม',  value: stats.accValue,   color: '#059669' },
              ].map(item => {
                const p = pct(item.value, stats.totalValue);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[11.5px] font-semibold text-slate-700 truncate">{item.label}</span>
                      </div>
                      <span className="text-[11.5px] font-bold tabular-nums shrink-0" style={{ color: item.color }}>{p.toFixed(0)}%</span>
                    </div>
                    <div className="text-[12.5px] text-slate-500 tabular-nums font-medium">{fmtShort(item.value)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Asset value by type (3/5 col) ── */}
        <div className="lg:col-span-3 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-5">
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
              <p className="text-[15px] font-bold tabular-nums" style={{ color: BRAND.primary }}>{fmt(stats.assetValue)}</p>
            </div>
          </div>

          {stats.assetTypeBreakdown.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-[13px]">ยังไม่มีข้อมูลทรัพย์สิน</div>
          ) : (
            <div className="space-y-2.5 max-h-[245px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                        className="h-full rounded-full transition-colors duration-500 group-hover:opacity-80"
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
          ROW 3 — Status Cards (3 cols รวม assets/acc/license)
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ทรัพย์สินหลัก */}
        <StatusCard
          title="ทรัพย์สินหลัก"
          icon={Server}
          color={BRAND.primary}
          tint="#EFF6FF"
          total={stats.totalAssets}
          totalLabel="รายการ"
          segments={[
            { label: 'ถูกใช้งาน', value: stats.assetInUse,        color: BRAND.primary },
            { label: 'พร้อมใช้',   value: stats.assetAvailable,    color: '#10b981' },
            { label: 'สำรอง',     value: stats.assetReserve,       color: '#8b5cf6' },
            { label: 'รอจัดการ',  value: stats.assetMaintenance,  color: '#f59e0b' },
            { label: 'ชำรุด',     value: stats.assetBroken,        color: '#f43f5e' },
          ]}
        />

        {/* อุปกรณ์เสริม */}
        <StatusCard
          title="อุปกรณ์เสริม"
          icon={Package}
          color="#059669"
          tint="#ECFDF5"
          total={stats.accTotal}
          totalLabel="ชิ้น"
          segments={[
            { label: 'คงเหลือ', value: stats.accRemain, color: '#10b981' },
            { label: 'ถูกใช้',  value: stats.accUsed,   color: BRAND.primary },
            { label: 'ชำรุด',  value: stats.accBroken, color: '#f43f5e' },
          ]}
        />

        {/* License */}
        <StatusCard
          title="License / โปรแกรม"
          icon={Sparkles}
          color="#7C3AED"
          tint="#F5F3FF"
          total={stats.totalLicenses}
          totalLabel="รายการ"
          segments={[
            { label: 'ถูกใช้', value: stats.licInUse,     color: '#7C3AED' },
            { label: 'ว่าง',   value: stats.licAvailable, color: '#10b981' },
          ]}
        />
      </div>

      {/* ════════════════════════════════════════════
          ROW 4 — Department + Health Summary
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* พนักงานแยกตามแผนก (2/3 col) */}
        <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FFFBEB', color: '#D97706' }}>
                <Building2 className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-800 tracking-tight">พนักงานแยกตามแผนก</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Top 6 แผนกที่มีพนักงานมากที่สุด</p>
              </div>
            </div>
            <span className="text-[11.5px] text-slate-400 font-semibold tabular-nums">{stats.deptBreakdown.length} แผนก</span>
          </div>

          {stats.deptBreakdown.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-[13px]">ยังไม่มีข้อมูลพนักงาน</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
              {stats.deptBreakdown.map((d, i) => {
                const maxCount = stats.deptBreakdown[0].count;
                const percent = (d.count / maxCount) * 100;
                const colors = ['#1E487A', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
                const color = colors[i % colors.length];
                return (
                  <div key={d.dept}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12.5px] font-semibold text-slate-700 truncate flex-1">{d.dept}</span>
                      <span className="text-[12.5px] font-bold tabular-nums shrink-0 ml-2" style={{ color }}>
                        {d.count} <span className="text-[10px] text-slate-400 font-medium">คน</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-colors duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Health Summary (1/3 col) */}
        <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F0FDF4', color: '#16A34A' }}>
              <Activity className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-800 tracking-tight">สรุปสถานะระบบ</p>
              <p className="text-[11px] text-slate-400 mt-0.5">ภาพรวมสุขภาพทรัพย์สิน</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <HealthRow
              ok={stats.assetBroken === 0}
              label="ทรัพย์สินชำรุด"
              value={stats.assetBroken}
              total={stats.totalAssets}
            />
            <HealthRow
              ok={stats.accBroken === 0}
              label="อุปกรณ์เสริมชำรุด"
              value={stats.accBroken}
              total={stats.accTotal}
            />
            <HealthRow
              ok={stats.assetAvailable > 0}
              label="ทรัพย์สินพร้อมแจกจ่าย"
              value={stats.assetAvailable}
              total={stats.totalAssets}
              positive
            />
            <HealthRow
              ok={stats.licAvailable > 0}
              label="License พร้อมจัดสรร"
              value={stats.licAvailable}
              total={stats.totalLicenses}
              positive
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ─── Header Stat (in welcome strip) ───
════════════════════════════════════════════════ */
function HeaderStat({ label, value, unit, icon: Icon, color }) {
  return (
    <div className="px-5 py-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, color }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-0.5">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-[20px] font-bold text-slate-900 tabular-nums leading-none">{value.toLocaleString()}</span>
          <span className="text-[11px] text-slate-400 font-medium">{unit}</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ─── Status Card (combined stat + segments) ───
════════════════════════════════════════════════ */
function StatusCard({ title, icon: Icon, color, tint, total, totalLabel, segments }) {
  const totalSum = segments.reduce((s, x) => s + x.value, 0);
  const pct = (v) => totalSum > 0 ? (v / totalSum) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tint, color }}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <p className="text-[13.5px] font-bold text-slate-800 tracking-tight">{title}</p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-bold tabular-nums leading-tight" style={{ color }}>{total.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 font-medium leading-tight">{totalLabel}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Stacked bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden mb-3">
          {segments.map((s, i) => (
            <div
              key={i}
              className="h-full transition-colors duration-500"
              style={{ width: `${pct(s.value)}%`, backgroundColor: s.color }}
              title={`${s.label}: ${s.value}`}
            />
          ))}
        </div>

        {/* List */}
        <div className="space-y-1.5">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[12px] text-slate-600 font-medium">{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] text-slate-400 font-medium tabular-nums">{pct(s.value).toFixed(0)}%</span>
                <span className="text-[13px] font-bold tabular-nums min-w-[24px] text-right" style={{ color: s.color }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ─── Health Row (in Health Summary) ───
════════════════════════════════════════════════ */
function HealthRow({ ok, label, value, total, positive = false }) {
  // เกณฑ์การโชว์: ปกติ ok = green, ไม่ ok = red. positive = inverted (มีค่า > 0 = ok)
  const showOk = positive ? value > 0 : ok;
  const color = showOk ? '#16A34A' : (value === 0 ? '#94A3B8' : '#DC2626');
  const Icon = showOk ? CheckCircle2 : AlertCircle;
  const bgColor = showOk ? '#F0FDF4' : (value === 0 ? '#F8FAFC' : '#FEF2F2');

  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 rounded-xl ring-1 transition-colors"
      style={{
        background: bgColor,
        borderColor: showOk ? '#BBF7D0' : (value === 0 ? '#E2E8F0' : '#FECACA'),
        '--tw-ring-color': showOk ? '#BBF7D0' : (value === 0 ? '#E2E8F0' : '#FECACA'),
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 shrink-0" style={{ color }} strokeWidth={2.2} />
        <span className="text-[12.5px] text-slate-700 font-medium truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 shrink-0">
        <span className="text-[15px] font-bold tabular-nums" style={{ color }}>{value}</span>
        {total > 0 && (
          <span className="text-[10.5px] text-slate-400 font-medium">/ {total}</span>
        )}
      </div>
    </div>
  );
}
