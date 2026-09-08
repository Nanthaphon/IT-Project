import React, { useMemo } from 'react';
import {
  Monitor, Armchair, AppWindow, Cable, Users,
  Wallet, Layers, Building2, AlertTriangle,
} from 'lucide-react';

/* ── Minimal tokens ─────────────────────────────────────────
   การ์ดขาว ขอบบาง เงาเบามาก · สีใช้เฉพาะที่สื่อความหมาย (สถานะ)
   ─────────────────────────────────────────────────────────── */
const CARD = 'bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(16,47,87,0.04)]';
const NAVY = '#1E487A';

/* palette สำหรับสถานะ (functional color) */
const ST = {
  inUse:   NAVY,
  avail:   '#10b981',
  reserve: '#8b5cf6',
  wait:    '#f59e0b',
  broken:  '#f43f5e',
  disposed:'#94a3b8',
  license: '#7c3aed',
};

export default function DashboardStats({ assets = [], licenses = [], accessories = [], employees = [] }) {
  const s = useMemo(() => {
    // แยกทรัพย์สินหลัก vs ครุภัณฑ์ (assetGroup === 'office')
    const mainAssets = assets.filter(a => a.assetGroup !== 'office');
    const furniture  = assets.filter(a => a.assetGroup === 'office');

    const byStatus = (list, st) => list.filter(a => (a.status || 'พร้อมใช้งาน') === st).length;
    const assetStatus = {
      inUse:    mainAssets.filter(a => a.status === 'ถูกใช้งาน').length,
      avail:    mainAssets.filter(a => !a.status || a.status === 'พร้อมใช้งาน').length,
      reserve:  byStatus(mainAssets, 'สำรอง'),
      wait:     byStatus(mainAssets, 'รอดำเนินการ'),
      broken:   mainAssets.filter(a => a.status === 'ชำรุดเสียหาย' || a.status === 'ไม่สามารถใช้งานได้').length,
      disposed: byStatus(mainAssets, 'ตัดจำหน่าย'),
    };

    const accTotal  = accessories.reduce((n, i) => n + (Number(i.quantity) || 0), 0);
    const accUsed   = accessories.reduce((n, i) => n + (i.assignees?.length || 0), 0);
    const accBroken = accessories.reduce((n, i) => n + (Number(i.brokenQuantity) || 0), 0);
    const accRemain = Math.max(0, accTotal - accUsed - accBroken);

    const licActive = licenses.reduce((n, l) => n + (l.assignees?.length || 0), 0);
    const licStock  = licenses.reduce((n, l) => n + (Number(l.quantity) || 0), 0);

    // มูลค่า
    const sum = (arr, f) => arr.reduce((n, i) => n + f(i), 0);
    const assetValue = sum(assets, i => Number(i.cost) || 0);
    const licValue   = sum(licenses, i => Number(i.cost) || 0);
    const accValue   = sum(accessories, i => (Number(i.cost) || 0) * (Number(i.quantity) || 0));
    const totalValue = assetValue + licValue + accValue;

    // ทรัพย์สินหลักตามประเภท (มูลค่ามาก→น้อย)
    const typeMap = {};
    mainAssets.forEach(a => {
      const t = a.type?.trim() || 'ไม่ระบุประเภท';
      if (!typeMap[t]) typeMap[t] = { type: t, count: 0, value: 0 };
      typeMap[t].count++; typeMap[t].value += Number(a.cost) || 0;
    });
    const byType = Object.values(typeMap).sort((a, b) => b.value - a.value);

    // พนักงานตามแผนก (Top 6)
    const deptMap = {};
    employees.forEach(e => {
      const d = e.department?.trim() || 'ไม่ระบุแผนก';
      deptMap[d] = (deptMap[d] || 0) + 1;
    });
    const byDept = Object.entries(deptMap).map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6);

    // แจ้งเตือน (แสดงเฉพาะที่ต้องดูแล)
    const alerts = [];
    if (assetStatus.broken > 0) alerts.push({ label: 'ทรัพย์สินชำรุด', value: assetStatus.broken });
    if (accBroken > 0)          alerts.push({ label: 'อุปกรณ์เสริมชำรุด', value: accBroken });

    return {
      mainCount: mainAssets.length, furnitureCount: furniture.length,
      assetStatus, accTotal, accUsed, accBroken, accRemain,
      licActive, licStock,
      assetValue, licValue, accValue, totalValue,
      byType, byDept, alerts,
    };
  }, [assets, licenses, accessories, employees]);

  const fmtFull  = (v) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(v);
  const fmtShort = (v) => v >= 1e6 ? `฿${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `฿${(v / 1e3).toFixed(0)}K` : `฿${v.toLocaleString()}`;
  const pct = (v, t) => (t > 0 ? (v / t) * 100 : 0);

  const assetTotal = s.mainCount;

  return (
    <div className="max-w-[1360px] mx-auto space-y-5">

      {/* ── KPI strip (monochrome, minimal) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <Kpi label="ทรัพย์สิน" value={s.mainCount} unit="รายการ" icon={Monitor}
             sub={`พร้อมใช้ ${s.assetStatus.avail.toLocaleString()}`} />
        <Kpi label="ครุภัณฑ์สำนักงาน" value={s.furnitureCount} unit="รายการ" icon={Armchair} />
        <Kpi label="License" value={licenses.length} unit="รายการ" icon={AppWindow}
             sub={`ใช้งาน ${s.licActive.toLocaleString()} / ${s.licStock.toLocaleString()}`} />
        <Kpi label="อุปกรณ์เสริม" value={s.accTotal} unit="ชิ้น" icon={Cable}
             sub={`คงเหลือ ${s.accRemain.toLocaleString()}`} />
        <Kpi label="พนักงาน" value={employees.length} unit="คน" icon={Users} />
      </div>

      {/* ── แจ้งเตือน (เฉพาะเมื่อมี) ── */}
      {s.alerts.length > 0 && (
        <div className={`${CARD} px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-2`}>
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-4 w-4" strokeWidth={2.2} />
            <span className="text-[13px] font-semibold">ต้องดูแล</span>
          </div>
          {s.alerts.map(a => (
            <span key={a.label} className="text-[13px] text-slate-600">
              {a.label} <b className="text-rose-600 tabular-nums">{a.value}</b>
            </span>
          ))}
        </div>
      )}

      {/* ── สถานะทรัพย์สิน + มูลค่ารวม ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* สถานะทรัพย์สินหลัก */}
        <div className={`lg:col-span-3 ${CARD} p-6`}>
          <SectionHead icon={Monitor} title="สถานะทรัพย์สินหลัก" meta={`${assetTotal.toLocaleString()} รายการ`} />
          {assetTotal === 0 ? (
            <Empty text="ยังไม่มีข้อมูลทรัพย์สิน" />
          ) : (
            <>
              <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden mb-5">
                {[
                  { v: s.assetStatus.inUse,    c: ST.inUse },
                  { v: s.assetStatus.avail,    c: ST.avail },
                  { v: s.assetStatus.reserve,  c: ST.reserve },
                  { v: s.assetStatus.wait,     c: ST.wait },
                  { v: s.assetStatus.broken,   c: ST.broken },
                  { v: s.assetStatus.disposed, c: ST.disposed },
                ].map((seg, i) => seg.v > 0 && (
                  <div key={i} className="h-full" style={{ width: `${pct(seg.v, assetTotal)}%`, backgroundColor: seg.c }} />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                <Legend color={ST.inUse}    label="ถูกใช้งาน"  value={s.assetStatus.inUse}    total={assetTotal} />
                <Legend color={ST.avail}    label="พร้อมใช้"    value={s.assetStatus.avail}    total={assetTotal} />
                <Legend color={ST.reserve}  label="สำรอง"      value={s.assetStatus.reserve}  total={assetTotal} />
                <Legend color={ST.wait}     label="รอจัดการ"   value={s.assetStatus.wait}     total={assetTotal} />
                <Legend color={ST.broken}   label="ชำรุด"      value={s.assetStatus.broken}   total={assetTotal} />
                <Legend color={ST.disposed} label="ตัดจำหน่าย"  value={s.assetStatus.disposed} total={assetTotal} />
              </div>
            </>
          )}
        </div>

        {/* มูลค่ารวม (donut minimal) */}
        <div className={`lg:col-span-2 ${CARD} p-6`}>
          <SectionHead icon={Wallet} title="มูลค่ารวม" />
          <p className="text-[28px] font-bold text-slate-800 tabular-nums leading-none mb-5">{fmtFull(s.totalValue)}</p>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0 w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                {s.totalValue > 0 && (() => {
                  const segs = [
                    { v: s.assetValue, c: NAVY },
                    { v: s.licValue,   c: ST.license },
                    { v: s.accValue,   c: ST.avail },
                  ];
                  let acc = 0;
                  return segs.map((seg, i) => {
                    const dash = `${pct(seg.v, s.totalValue) * 0.879} 87.9`;
                    const off = `-${pct(acc, s.totalValue) * 0.879}`;
                    acc += seg.v;
                    return <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={seg.c} strokeWidth="4.5"
                      strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="round" />;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-medium">รวม</span>
                <span className="text-[15px] font-bold text-slate-800 tabular-nums">{fmtShort(s.totalValue)}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {[
                { label: 'ทรัพย์สิน', value: s.assetValue, color: NAVY },
                { label: 'License',   value: s.licValue,   color: ST.license },
                { label: 'อุปกรณ์เสริม', value: s.accValue, color: ST.avail },
              ].map(it => (
                <div key={it.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
                    <span className="text-[12.5px] text-slate-600 truncate">{it.label}</span>
                  </span>
                  <span className="text-[12.5px] font-semibold text-slate-700 tabular-nums shrink-0">{fmtShort(it.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ทรัพย์สินตามประเภท + พนักงานตามแผนก ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ตามประเภท */}
        <div className={`${CARD} p-6`}>
          <SectionHead icon={Layers} title="ทรัพย์สินตามประเภท" meta={fmtShort(s.assetValue)} />
          {s.byType.length === 0 ? (
            <Empty text="ยังไม่มีข้อมูล" />
          ) : (
            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {s.byType.map(item => {
                const p = pct(item.value, s.assetValue);
                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-medium text-slate-700 truncate">{item.type}</span>
                        <span className="text-[10.5px] text-slate-400 tabular-nums shrink-0">×{item.count}</span>
                      </span>
                      <span className="text-[12.5px] font-semibold text-slate-700 tabular-nums shrink-0">{fmtShort(item.value)}</span>
                    </div>
                    <Bar percent={p} color={NAVY} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ตามแผนก */}
        <div className={`${CARD} p-6`}>
          <SectionHead icon={Building2} title="พนักงานตามแผนก" meta={`${employees.length} คน`} />
          {s.byDept.length === 0 ? (
            <Empty text="ยังไม่มีข้อมูลพนักงาน" />
          ) : (
            <div className="space-y-4">
              {s.byDept.map((d, i) => {
                const p = (d.count / s.byDept[0].count) * 100;
                return (
                  <div key={d.dept}>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-[13px] font-medium text-slate-700 truncate">{d.dept}</span>
                      <span className="text-[12.5px] font-semibold text-slate-700 tabular-nums shrink-0">
                        {d.count} <span className="text-[10px] text-slate-400 font-normal">คน</span>
                      </span>
                    </div>
                    <Bar percent={p} color={NAVY} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── subcomponents ────────────────────────────────────────── */
function Kpi({ label, value, unit, sub, icon: Icon }) {
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-start justify-between">
        <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
        {Icon && (
          <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-[27px] font-bold text-slate-800 tabular-nums leading-none">{Number(value).toLocaleString()}</span>
        {unit && <span className="text-[12px] text-slate-400 font-medium">{unit}</span>}
      </div>
      {sub && <p className="text-[12px] text-slate-400 mt-1.5 truncate">{sub}</p>}
    </div>
  );
}

function SectionHead({ icon: Icon, title, meta }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={2} />}
        <h3 className="text-[13.5px] font-bold text-slate-700 tracking-tight truncate">{title}</h3>
      </div>
      {meta != null && <span className="text-[12px] text-slate-400 font-medium tabular-nums shrink-0">{meta}</span>}
    </div>
  );
}

function Legend({ color, label, value, total }) {
  const p = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[12.5px] text-slate-600 truncate">{label}</span>
      </span>
      <span className="flex items-baseline gap-1.5 shrink-0">
        <span className="text-[10.5px] text-slate-400 tabular-nums">{p.toFixed(0)}%</span>
        <span className="text-[13px] font-bold text-slate-800 tabular-nums min-w-[22px] text-right">{value}</span>
      </span>
    </div>
  );
}

function Bar({ percent, color }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.max(percent, 2)}%`, backgroundColor: color }} />
    </div>
  );
}

function Empty({ text }) {
  return <div className="py-12 text-center text-[13px] text-slate-400">{text}</div>;
}
