import React, { useMemo, useState } from 'react';
import {
  Wrench, Star, TrendingUp, Users, Clock, CheckCircle2,
  Download, Calendar, MessageSquare, Award, Activity,
  ChevronDown, BarChart3,
} from 'lucide-react';
import { BRAND } from '../ui/theme.js';
import { exportKpiReport } from '../utils/exportKpiReport.js';

/* ── ตัวกรองช่วงเวลา ────────────────────────────────── */
const RANGE_OPTIONS = [
  { value: 'this_month',   label: 'เดือนนี้'      },
  { value: 'last_month',   label: 'เดือนที่แล้ว'   },
  { value: 'this_quarter', label: 'ไตรมาสนี้'     },
  { value: 'this_year',    label: 'ปีนี้'         },
  { value: 'all',          label: 'ทั้งหมด'       },
];

const monthsTh = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

/* ── คำนวณช่วงเวลา ─────────────────────────────────── */
function getRange(value) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (value === 'this_month') {
    return { from: new Date(y, m, 1).getTime(), to: new Date(y, m + 1, 0, 23, 59, 59, 999).getTime() };
  }
  if (value === 'last_month') {
    return { from: new Date(y, m - 1, 1).getTime(), to: new Date(y, m, 0, 23, 59, 59, 999).getTime() };
  }
  if (value === 'this_quarter') {
    const qStart = Math.floor(m / 3) * 3;
    return { from: new Date(y, qStart, 1).getTime(), to: new Date(y, qStart + 3, 0, 23, 59, 59, 999).getTime() };
  }
  if (value === 'this_year') {
    return { from: new Date(y, 0, 1).getTime(), to: new Date(y, 11, 31, 23, 59, 59, 999).getTime() };
  }
  return { from: null, to: null };
}

function getRangeLabel(value) {
  const now = new Date();
  const y = now.getFullYear() + 543;
  const m = now.getMonth();
  if (value === 'this_month')   return `${monthsTh[m]} ${y}`;
  if (value === 'last_month')   return `${monthsTh[(m + 11) % 12]} ${m === 0 ? y - 1 : y}`;
  if (value === 'this_quarter') return `ไตรมาส Q${Math.floor(m / 3) + 1}/${y}`;
  if (value === 'this_year')    return `ปี ${y}`;
  return 'ทั้งหมด';
}

/* ─── Main Component ───────────────────────────────── */
export default function KpiDashboard({ repairRequests = [] }) {
  const [rangeValue, setRangeValue] = useState('this_month');
  const [isExporting, setIsExporting] = useState(false);
  const [openComments, setOpenComments] = useState(false);

  const range = useMemo(() => getRange(rangeValue), [rangeValue]);

  /* ── filter list ตามช่วงเวลา ────────────────────────── */
  const list = useMemo(() => {
    if (!range.from && !range.to) return repairRequests;
    return repairRequests.filter(r => {
      const t = r.timestamp || 0;
      if (range.from && t < range.from) return false;
      if (range.to && t > range.to) return false;
      return true;
    });
  }, [repairRequests, range]);

  /* ── คำนวณ KPI ทั้งหมด ─────────────────────────────── */
  const k = useMemo(() => {
    const total      = list.length;
    const pending    = list.filter(r => r.status === 'รอดำเนินการ').length;
    const inProgress = list.filter(r => r.status === 'กำลังซ่อม').length;
    const done       = list.filter(r => r.status === 'ซ่อมเสร็จสิ้น').length;
    const cancelled  = list.filter(r => r.status === 'ยกเลิก').length;
    const closureRate = total > 0 ? ((done / total) * 100) : 0;

    const respHrs = list
      .map(r => ((r.startedAt || 0) - (r.timestamp || 0)) / 3600000)
      .filter(v => v >= 0 && isFinite(v) && v > 0);
    const repairHrs = list
      .map(r => ((r.completedAt || 0) - (r.startedAt || 0)) / 3600000)
      .filter(v => v >= 0 && isFinite(v) && v > 0);

    const avg = (arr) => arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
    const avgResponse = avg(respHrs);
    const avgRepair   = avg(repairHrs);

    const evaluated = list.filter(r => r.evaluation && r.evaluation.overallRating > 0);
    const responseRate = done > 0 ? (evaluated.length / done) * 100 : 0;
    const avgRating = (key) => {
      if (evaluated.length === 0) return 0;
      return evaluated.reduce((s, r) => s + (Number(r.evaluation?.[key]) || 0), 0) / evaluated.length;
    };
    const avgOverall = avgRating('overallRating');
    const avgSpeed   = avgRating('speedRating');
    const avgQuality = avgRating('qualityRating');
    const avgService = avgRating('serviceRating');

    const distribution = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: evaluated.filter(r => Math.round(r.evaluation.overallRating) === star).length,
    }));

    // แนวโน้มรายเดือน (6 เดือนล่าสุด)
    const monthly = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      const monthList = repairRequests.filter(r => r.timestamp >= start && r.timestamp <= end);
      const monthEval = monthList.filter(r => r.evaluation?.overallRating > 0);
      monthly.push({
        label: `${monthsTh[d.getMonth()]}${String(d.getFullYear() + 543).slice(2)}`,
        cases: monthList.length,
        rating: monthEval.length > 0 ? monthEval.reduce((s, r) => s + r.evaluation.overallRating, 0) / monthEval.length : 0,
      });
    }

    // Top แผนก
    const deptMap = {};
    list.forEach(r => {
      const d = r.department || 'ไม่ระบุ';
      deptMap[d] = (deptMap[d] || 0) + 1;
    });
    const topDepts = Object.entries(deptMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // ความเห็นล่าสุด
    const recentComments = evaluated
      .filter(r => r.evaluation.comment && r.evaluation.comment.trim().length > 0)
      .sort((a, b) => (b.evaluation.evaluatedAt || 0) - (a.evaluation.evaluatedAt || 0))
      .slice(0, 5);

    return {
      total, pending, inProgress, done, cancelled, closureRate,
      avgResponse, avgRepair,
      evaluated: evaluated.length, responseRate,
      avgOverall, avgSpeed, avgQuality, avgService,
      distribution, monthly, topDepts, recentComments,
    };
  }, [list, repairRequests]);

  /* ── Export Excel ──────────────────────────────────── */
  const handleExport = async () => {
    setIsExporting(true);
    try {
      exportKpiReport({
        repairRequests,
        periodLabel: getRangeLabel(rangeValue),
        range,
      });
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถสร้างไฟล์รายงานได้: ' + err.message);
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/70 p-4 md:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.primary}15` }}>
            <BarChart3 className="h-5 w-5" style={{ color: BRAND.primary }} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">รายงาน KPI</h2>
            <p className="text-[12px] text-slate-500">สรุปผลงานแจ้งซ่อม &amp; ความพึงพอใจ</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Range filter */}
          <div className="relative">
            <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.9} />
            <select
              value={rangeValue}
              onChange={(e) => setRangeValue(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 pl-9 pr-9 py-2.5 rounded-xl text-[13px] text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-[#1E487A]/15 focus:border-[#1E487A] outline-none transition-all"
            >
              {RANGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2} />
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={isExporting || k.total === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            style={{ background: BRAND.primary, boxShadow: `0 6px 16px ${BRAND.primary}40` }}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" strokeWidth={2.2} />
                Export Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {k.total === 0 && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/70 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="h-7 w-7 text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="font-medium text-[14px] text-slate-500">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
          <p className="text-[12px] text-slate-400 mt-1">ลองเลือกช่วงเวลาอื่น</p>
        </div>
      )}

      {k.total > 0 && (
        <>
          {/* ── Row 1: KPI Cards (งานซ่อม) ── */}
          <div>
            <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-3 px-1">🔧 งานแจ้งซ่อม</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={Wrench}
                label="เคสทั้งหมด"
                value={k.total}
                unit="เคส"
                sub={`รอ ${k.pending} · กำลังซ่อม ${k.inProgress}`}
                accent={BRAND.primary}
                tint="#E8EFF8"
              />
              <KpiCard
                icon={CheckCircle2}
                label="ปิดเคสสำเร็จ"
                value={k.done}
                unit="เคส"
                sub={`อัตราการปิด ${k.closureRate.toFixed(1)}%`}
                accent="#10B981"
                tint="#ECFDF5"
              />
              <KpiCard
                icon={Clock}
                label="เวลาตอบสนองเฉลี่ย"
                value={k.avgResponse > 0 ? k.avgResponse.toFixed(1) : '-'}
                unit="ชั่วโมง"
                sub="แจ้ง → เริ่มซ่อม"
                accent="#F59E0B"
                tint="#FEF3C7"
              />
              <KpiCard
                icon={Activity}
                label="เวลาซ่อมเฉลี่ย"
                value={k.avgRepair > 0 ? k.avgRepair.toFixed(1) : '-'}
                unit="ชั่วโมง"
                sub="เริ่ม → เสร็จ"
                accent="#8B5CF6"
                tint="#F3E8FF"
              />
            </div>
          </div>

          {/* ── Row 2: KPI Cards (ความพึงพอใจ) ── */}
          <div>
            <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-3 px-1">⭐ ความพึงพอใจ</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* คะแนนรวม (ขนาดใหญ่) */}
              <div className="lg:col-span-1 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 ring-1 ring-amber-200/60 rounded-2xl p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-amber-700/80 tracking-wide">คะแนนเฉลี่ยรวม</p>
                  <div className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center">
                    <Award className="h-4.5 w-4.5 text-amber-500" strokeWidth={2.2} />
                  </div>
                </div>
                <div className="my-2">
                  <p className="text-[44px] font-black text-amber-700 leading-none tabular-nums">
                    {k.avgOverall.toFixed(2)}
                    <span className="text-[18px] font-medium text-amber-600/60"> / 5.00</span>
                  </p>
                  <div className="flex items-center gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        className={`h-5 w-5 ${n <= Math.round(k.avgOverall) ? 'fill-amber-400 text-amber-400' : 'text-amber-200 fill-amber-100'}`}
                        strokeWidth={1.6}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[11.5px] text-amber-700/70 font-medium">
                  จาก {k.evaluated} ผู้ประเมิน
                </p>
              </div>

              {/* คะแนนแยกหมวด */}
              <div className="lg:col-span-2 bg-white ring-1 ring-slate-200/70 rounded-2xl p-5">
                <p className="text-[12px] font-semibold text-slate-500 tracking-wide mb-4">คะแนนแยกหมวด</p>
                <div className="space-y-3">
                  <RatingBar label="ความรวดเร็ว" value={k.avgSpeed} color="#3B82F6" />
                  <RatingBar label="คุณภาพการแก้ปัญหา" value={k.avgQuality} color="#10B981" />
                  <RatingBar label="การบริการ &amp; มารยาท" value={k.avgService} color="#8B5CF6" />
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.9} />
                    <span className="text-[11.5px] text-slate-500">อัตราการประเมิน</span>
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 tabular-nums">
                    {k.responseRate.toFixed(1)}%
                    <span className="text-slate-400 font-normal ml-1">({k.evaluated}/{k.done})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 3: แนวโน้มรายเดือน + Distribution ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly trend */}
            <div className="lg:col-span-2 bg-white ring-1 ring-slate-200/70 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[13.5px] font-bold text-slate-800">แนวโน้มรายเดือน</p>
                  <p className="text-[11.5px] text-slate-400">เคสซ่อม &amp; คะแนนเฉลี่ย — 6 เดือนล่าสุด</p>
                </div>
                <TrendingUp className="h-4 w-4 text-slate-400" strokeWidth={1.9} />
              </div>
              <MonthlyTrend data={k.monthly} />
            </div>

            {/* Rating distribution */}
            <div className="bg-white ring-1 ring-slate-200/70 rounded-2xl p-5">
              <p className="text-[13.5px] font-bold text-slate-800 mb-1">การกระจายคะแนน</p>
              <p className="text-[11.5px] text-slate-400 mb-4">Rating Distribution</p>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const d = k.distribution.find(x => x.star === star);
                  const pct = k.evaluated > 0 ? (d.count / k.evaluated) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 w-12">
                        <span className="text-[12px] font-bold text-slate-700 tabular-nums">{star}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" strokeWidth={1.6} />
                      </div>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: starColor(star) }}
                        />
                      </div>
                      <span className="text-[11.5px] text-slate-500 font-semibold tabular-nums w-10 text-right">
                        {d.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Row 4: Top Departments + Recent Comments ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top depts */}
            <div className="bg-white ring-1 ring-slate-200/70 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13.5px] font-bold text-slate-800">แผนกที่แจ้งซ่อมมากที่สุด</p>
                <span className="text-[11px] text-slate-400 font-medium">Top 5</span>
              </div>
              {k.topDepts.length === 0 ? (
                <p className="text-[12px] text-slate-400 text-center py-6">ไม่มีข้อมูล</p>
              ) : (
                <div className="space-y-2.5">
                  {k.topDepts.map(([dept, count], idx) => {
                    const max = k.topDepts[0][1];
                    const pct = max > 0 ? (count / max) * 100 : 0;
                    return (
                      <div key={dept} className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-400 w-5">#{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12.5px] font-semibold text-slate-700 truncate">{dept}</span>
                            <span className="text-[12px] font-bold text-slate-600 tabular-nums">{count}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: BRAND.primary }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent comments */}
            <div className="bg-white ring-1 ring-slate-200/70 rounded-2xl p-5">
              <button
                onClick={() => setOpenComments(o => !o)}
                className="w-full flex items-center justify-between mb-3"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" strokeWidth={1.9} />
                  <p className="text-[13.5px] font-bold text-slate-800">ความเห็นล่าสุด</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ${openComments ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
              </button>

              {k.recentComments.length === 0 ? (
                <p className="text-[12px] text-slate-400 text-center py-6">ยังไม่มีความเห็น</p>
              ) : (
                <div className={`space-y-2.5 overflow-hidden transition-all ${openComments ? 'max-h-[600px]' : 'max-h-[180px]'}`}>
                  {k.recentComments.map((r, idx) => (
                    <div key={idx} className="bg-slate-50/70 ring-1 ring-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11.5px] font-semibold text-slate-600 truncate">
                          {r.evaluation.evaluatedByName || r.empName || 'ไม่ระบุ'}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star
                              key={n}
                              className={`h-3 w-3 ${n <= Math.round(r.evaluation.overallRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'}`}
                              strokeWidth={1.6}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-snug line-clamp-2">{r.evaluation.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Sub Components ───────────────────────────────── */
function KpiCard({ icon: Icon, label, value, unit, sub, accent, tint }) {
  return (
    <div className="bg-white ring-1 ring-slate-200/70 rounded-2xl p-4 flex flex-col gap-2.5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-[11.5px] font-semibold text-slate-500 tracking-wide">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tint }}>
          <Icon className="h-4 w-4" style={{ color: accent }} strokeWidth={2.2} />
        </div>
      </div>
      <div>
        <p className="text-[26px] font-black text-slate-800 leading-none tabular-nums">
          {value}
          {unit && <span className="text-[12px] text-slate-400 font-medium ml-1.5">{unit}</span>}
        </p>
        {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

function RatingBar({ label, value, color }) {
  const pct = (value / 5) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-semibold text-slate-600">{label}</span>
        <span className="text-[12px] font-bold tabular-nums" style={{ color }}>
          {value.toFixed(2)}
          <span className="text-slate-400 font-normal text-[10.5px]"> / 5.00</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function MonthlyTrend({ data }) {
  const maxCases = Math.max(...data.map(d => d.cases), 1);

  return (
    <div className="space-y-4">
      {/* Bar chart for cases */}
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((d, idx) => {
          const h = (d.cases / maxCases) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div className="relative w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-lg transition-all hover:opacity-80 relative group"
                  style={{
                    height: `${Math.max(h, 4)}%`,
                    background: `linear-gradient(180deg, ${BRAND.primary} 0%, ${BRAND.primary}AA 100%)`,
                  }}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10.5px] font-bold text-slate-600 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.cases} เคส
                  </span>
                </div>
              </div>
              <span className="text-[10.5px] text-slate-500 font-medium truncate w-full text-center">{d.label}</span>
              <span className="text-[10.5px] font-bold text-slate-700 tabular-nums">{d.cases}</span>
            </div>
          );
        })}
      </div>

      {/* Avg rating per month */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-2">คะแนนเฉลี่ยรายเดือน</p>
        <div className="flex items-center justify-between gap-2">
          {data.map((d, idx) => (
            <div key={idx} className="flex-1 text-center">
              <div className="flex items-center justify-center gap-0.5">
                <Star className={`h-3 w-3 ${d.rating > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'}`} strokeWidth={1.6} />
                <span className="text-[11px] font-bold text-slate-600 tabular-nums">
                  {d.rating > 0 ? d.rating.toFixed(1) : '-'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function starColor(star) {
  if (star >= 5) return '#10B981'; // emerald
  if (star >= 4) return '#84CC16'; // lime
  if (star >= 3) return '#F59E0B'; // amber
  if (star >= 2) return '#F97316'; // orange
  return '#EF4444';                // rose
}
