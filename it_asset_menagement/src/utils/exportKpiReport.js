// src/utils/exportKpiReport.js
// สร้างไฟล์ Excel หลายชีต สำหรับรายงาน KPI งานแจ้งซ่อม + ความพึงพอใจ
// แต่ละชีตจะถูกออกแบบให้หัวหน้าเปิดดูได้ทันที (Summary / Repair Detail / Evaluation Detail)
import * as XLSX from 'xlsx';
import { formatDateShort, formatDateTimeShort, formatDateMedium } from './formatDate.js';

/* ── helpers ───────────────────────────────────────── */
const formatDateTime = formatDateTimeShort;
const formatDate = formatDateMedium;

const hours = (ms) => {
  if (!ms || ms < 0) return null;
  return +(ms / 3600000).toFixed(2);
};

// คืนค่าตัวเลข (สำหรับ Excel คำนวณต่อ) หรือ '' ถ้าไม่มี — ไม่ใช้ '-' ในชีตข้อมูลดิบ
const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) ? '' : Number(v);
const round2 = (v) => (v === null || v === undefined || Number.isNaN(Number(v))) ? '' : Math.round(Number(v) * 100) / 100;
const dt = (ms) => ms ? formatDateTimeShort(ms) : '';

/* ── main export ───────────────────────────────────── */
/**
 * @param {Object} opts
 * @param {Array}  opts.repairRequests - array repair docs (with optional .evaluation)
 * @param {string} opts.periodLabel - เช่น "พ.ค. 2569" หรือ "ทั้งหมด"
 * @param {{from:number|null, to:number|null}} [opts.range] - ช่วงเวลา ms (optional)
 */
export function exportKpiReport({ repairRequests = [], periodLabel = 'ทั้งหมด', range = null }) {
  // ── filter ตามช่วงเวลา (ถ้ามี) ─────────────────────
  let list = repairRequests;
  if (range && (range.from || range.to)) {
    list = list.filter(r => {
      const t = r.timestamp || 0;
      if (range.from && t < range.from) return false;
      if (range.to && t > range.to) return false;
      return true;
    });
  }

  /* ── 1) Summary Sheet ─────────────────────────────── */
  const total      = list.length;
  const pending    = list.filter(r => r.status === 'รอดำเนินการ').length;
  const inProgress = list.filter(r => r.status === 'กำลังซ่อม').length;
  const done       = list.filter(r => r.status === 'ซ่อมเสร็จสิ้น').length;
  const cancelled  = list.filter(r => r.status === 'ยกเลิก').length;
  const closureRate = total > 0 ? +((done / total) * 100).toFixed(1) : 0;

  // เวลาตอบสนอง (timestamp → startedAt) และเวลาซ่อม (startedAt → completedAt)
  const respHours = list
    .map(r => hours((r.startedAt || 0) - (r.timestamp || 0)))
    .filter(v => v !== null && v >= 0);
  const repairHours = list
    .map(r => hours((r.completedAt || 0) - (r.startedAt || 0)))
    .filter(v => v !== null && v >= 0);

  const avg = (arr) => arr.length === 0 ? 0 : +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2);
  const avgResponseHrs = avg(respHours);
  const avgRepairHrs   = avg(repairHours);

  // ความพึงพอใจ
  const evaluated = list.filter(r => r.evaluation && r.evaluation.overallRating > 0);
  const responseRate = done > 0 ? +((evaluated.length / done) * 100).toFixed(1) : 0;
  const avgRating = (key) => {
    if (evaluated.length === 0) return 0;
    const sum = evaluated.reduce((s, r) => s + (Number(r.evaluation?.[key]) || 0), 0);
    return +(sum / evaluated.length).toFixed(2);
  };
  const avgOverall = avgRating('overallRating');
  const avgSpeed   = avgRating('speedRating');
  const avgQuality = avgRating('qualityRating');
  const avgService = avgRating('serviceRating');

  // distribution
  const dist = [1, 2, 3, 4, 5].map(star => ({
    star,
    count: evaluated.filter(r => Math.round(r.evaluation.overallRating) === star).length,
  }));

  const summaryRows = [
    ['📊 รายงาน KPI ระบบ IT Asset Management'],
    [`ช่วงเวลา: ${periodLabel}`],
    [`สร้างเมื่อ: ${formatDateTimeShort(new Date())}`],
    [],
    ['🔧 ส่วนที่ 1 — งานแจ้งซ่อม'],
    ['รายการ', 'ค่า', 'หน่วย'],
    ['เคสทั้งหมด', total, 'เคส'],
    ['รอดำเนินการ', pending, 'เคส'],
    ['กำลังซ่อม', inProgress, 'เคส'],
    ['ซ่อมเสร็จสิ้น', done, 'เคส'],
    ['ยกเลิก', cancelled, 'เคส'],
    ['อัตราการปิดเคส (Closure Rate)', closureRate, '%'],
    ['เวลาตอบสนองเฉลี่ย', avgResponseHrs, 'ชั่วโมง'],
    ['เวลาซ่อมเฉลี่ย', avgRepairHrs, 'ชั่วโมง'],
    [],
    ['⭐ ส่วนที่ 2 — ความพึงพอใจ'],
    ['รายการ', 'ค่า', 'หน่วย'],
    ['จำนวนผู้ประเมิน', evaluated.length, 'คน'],
    ['อัตราการประเมิน (Response Rate)', responseRate, '%'],
    ['คะแนนเฉลี่ยรวม', avgOverall, '/ 5.00'],
    ['ความรวดเร็วเฉลี่ย', avgSpeed, '/ 5.00'],
    ['คุณภาพการแก้ปัญหาเฉลี่ย', avgQuality, '/ 5.00'],
    ['การบริการ/มารยาทเฉลี่ย', avgService, '/ 5.00'],
    [],
    ['การกระจายของคะแนน (Rating Distribution)'],
    ['ระดับดาว', 'จำนวน', 'สัดส่วน'],
    ...dist.map(d => [
      `${d.star} ดาว`,
      d.count,
      evaluated.length > 0 ? `${((d.count / evaluated.length) * 100).toFixed(1)}%` : '0%'
    ]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 38 }, { wch: 14 }, { wch: 14 }];
  // merge title row
  summarySheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    { s: { r: 15, c: 0 }, e: { r: 15, c: 2 } },
    { s: { r: 25, c: 0 }, e: { r: 25, c: 2 } },
  ];

  /* ── 2) ข้อมูลเคสทั้งหมด (ตารางมาตรฐาน — 1 แถว/เคส ครบทุกฟิลด์) ── */
  //  ออกแบบให้เป็น "ข้อมูลดิบ" ที่นำไปทำ Pivot / วิเคราะห์ต่อได้ทันที
  const dataHeader = [
    'ลำดับ', 'รหัสเคส', 'วันที่แจ้ง',
    'ผู้แจ้ง', 'รหัสพนักงาน', 'แผนก',
    'ประเภท/อุปกรณ์', 'รายละเอียดปัญหา', 'สถานะ',
    'วันที่เริ่มซ่อม', 'วันที่ซ่อมเสร็จ',
    'เวลาตอบสนอง (ชม.)', 'เวลาซ่อม (ชม.)', 'เวลารวม (ชม.)',
    'ประเมินแล้ว', 'คะแนนรวม', 'ความรวดเร็ว', 'คุณภาพ', 'การบริการ',
    'ความเห็นเพิ่มเติม', 'วันที่ประเมิน', 'ผู้ประเมิน', 'รหัสผู้ประเมิน',
  ];

  const dataRows = list.map((r, idx) => {
    const resp   = hours((r.startedAt || 0) - (r.timestamp || 0));
    const repair = hours((r.completedAt || 0) - (r.startedAt || 0));
    const totalH = hours((r.completedAt || 0) - (r.timestamp || 0));
    const e = r.evaluation || null;
    return [
      idx + 1,
      r.id || '',
      dt(r.timestamp),
      r.empName || '',
      r.empId || '',
      r.department || '',
      r.assetName || '',
      r.issue || '',
      r.status || '',
      dt(r.startedAt),
      dt(r.completedAt),
      resp !== null && resp >= 0 ? resp : '',
      repair !== null && repair >= 0 ? repair : '',
      totalH !== null && totalH >= 0 ? totalH : '',
      e ? 'ใช่' : 'ไม่',
      e ? round2(e.overallRating) : '',
      e ? num(e.speedRating) : '',
      e ? num(e.qualityRating) : '',
      e ? num(e.serviceRating) : '',
      e?.comment || '',
      e?.evaluatedAt ? dt(e.evaluatedAt) : '',
      e?.evaluatedByName || '',
      e?.evaluatedBy || '',
    ];
  });

  const repairSheet = XLSX.utils.aoa_to_sheet([dataHeader, ...dataRows]);
  repairSheet['!cols'] = [
    { wch: 6 }, { wch: 22 }, { wch: 18 },
    { wch: 24 }, { wch: 12 }, { wch: 18 },
    { wch: 22 }, { wch: 40 }, { wch: 14 },
    { wch: 18 }, { wch: 18 },
    { wch: 16 }, { wch: 14 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 50 }, { wch: 18 }, { wch: 22 }, { wch: 14 },
  ];
  // ตรึงหัวตาราง + เปิด AutoFilter ให้กรอง/เรียงได้ทันที
  repairSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  if (dataRows.length > 0) {
    repairSheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: dataRows.length, c: dataHeader.length - 1 } }) };
  }

  /* ── 3) Evaluation Detail Sheet ───────────────────── */
  const evalHeader = [
    'ลำดับ', 'วันที่ประเมิน', 'ผู้ประเมิน', 'รหัสพนักงาน',
    'อุปกรณ์', 'ความรวดเร็ว', 'คุณภาพ', 'บริการ', 'คะแนนรวม',
    'ความเห็นเพิ่มเติม',
  ];

  const evalRows = evaluated.map((r, idx) => {
    const e = r.evaluation;
    return [
      idx + 1,
      formatDateTime(e.evaluatedAt),
      e.evaluatedByName || r.empName || '-',
      e.evaluatedBy || r.empId || '-',
      r.assetName || '-',
      Number(e.speedRating) || 0,
      Number(e.qualityRating) || 0,
      Number(e.serviceRating) || 0,
      Number(e.overallRating).toFixed(2),
      e.comment || '-',
    ];
  });

  const evalSheet = XLSX.utils.aoa_to_sheet([evalHeader, ...evalRows]);
  evalSheet['!cols'] = [
    { wch: 6 }, { wch: 18 }, { wch: 22 }, { wch: 12 },
    { wch: 24 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
    { wch: 50 },
  ];

  /* ── 4) By Department Sheet (เคสตามแผนก) ──────────── */
  const deptMap = {};
  list.forEach(r => {
    const d = r.department || 'ไม่ระบุ';
    if (!deptMap[d]) deptMap[d] = { total: 0, done: 0, ratingSum: 0, ratingCount: 0 };
    deptMap[d].total += 1;
    if (r.status === 'ซ่อมเสร็จสิ้น') deptMap[d].done += 1;
    if (r.evaluation?.overallRating > 0) {
      deptMap[d].ratingSum += r.evaluation.overallRating;
      deptMap[d].ratingCount += 1;
    }
  });

  const deptHeader = ['แผนก', 'เคสทั้งหมด', 'ปิดเคสแล้ว', 'อัตราปิดเคส (%)', 'คะแนนเฉลี่ย'];
  const deptRows = Object.entries(deptMap)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([d, v]) => [
      d,
      v.total,
      v.done,
      v.total > 0 ? +((v.done / v.total) * 100).toFixed(1) : 0,
      v.ratingCount > 0 ? +(v.ratingSum / v.ratingCount).toFixed(2) : '-',
    ]);
  const deptSheet = XLSX.utils.aoa_to_sheet([deptHeader, ...deptRows]);
  deptSheet['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 14 }];

  /* ── 5) แยกตามผู้แจ้ง (สรุปเคสรายบุคคล) ────────────── */
  const reporterMap = {};
  list.forEach(r => {
    const key = r.empId || r.empName || 'ไม่ระบุ';
    if (!reporterMap[key]) {
      reporterMap[key] = { name: r.empName || '-', empId: r.empId || '-', dept: r.department || '-', total: 0, done: 0, evalCount: 0, ratingSum: 0 };
    }
    const m = reporterMap[key];
    m.total += 1;
    if (r.status === 'ซ่อมเสร็จสิ้น') m.done += 1;
    if (r.evaluation?.overallRating > 0) { m.evalCount += 1; m.ratingSum += r.evaluation.overallRating; }
    // เก็บชื่อ/แผนกล่าสุดเผื่อข้อมูลเปลี่ยน
    if (r.empName) m.name = r.empName;
    if (r.department) m.dept = r.department;
  });
  const reporterHeader = ['ผู้แจ้ง', 'รหัสพนักงาน', 'แผนก', 'จำนวนเคส', 'ปิดเคสแล้ว', 'ประเมินแล้ว', 'คะแนนเฉลี่ย'];
  const reporterRows = Object.values(reporterMap)
    .sort((a, b) => b.total - a.total)
    .map(m => [
      m.name, m.empId, m.dept, m.total, m.done, m.evalCount,
      m.evalCount > 0 ? round2(m.ratingSum / m.evalCount) : '',
    ]);
  const reporterSheet = XLSX.utils.aoa_to_sheet([reporterHeader, ...reporterRows]);
  reporterSheet['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];

  /* ── Assemble Workbook ────────────────────────────── */
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet,  'สรุป KPI');
  XLSX.utils.book_append_sheet(wb, repairSheet,   'ข้อมูลเคสทั้งหมด');
  XLSX.utils.book_append_sheet(wb, evalSheet,     'รายละเอียดแบบประเมิน');
  XLSX.utils.book_append_sheet(wb, reporterSheet, 'แยกตามผู้แจ้ง');
  XLSX.utils.book_append_sheet(wb, deptSheet,     'แยกตามแผนก');

  const safePeriod = periodLabel.replace(/[\\/:*?"<>|]/g, '-');
  const filename = `KPI_Report_${safePeriod}_${formatDate(Date.now()).replace(/\s/g, '')}.xlsx`;
  XLSX.writeFile(wb, filename);

  return { filename, total, done, evaluated: evaluated.length, avgOverall };
}
