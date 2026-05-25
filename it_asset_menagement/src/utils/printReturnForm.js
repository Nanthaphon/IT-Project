/* ════════════════════════════════════════════════════════════════════════
   IT-FORM-002 — ใบรับคืนทรัพย์สิน IT (Asset Return Assessment Form)
   อ้างอิง IT-POL-LAP-001 Rev.01
   ════════════════════════════════════════════════════════════════════════ */

import { renderAppendix } from './printAppendix.js';
import {
  ASSESSMENT_SECTIONS,
  itemMaxScore,
} from './printHandoverForm.js';

/* ── 6-angle return-side photo slots + 4 damage close-ups ── */
export const RETURN_PHOTO_SLOTS = [
  { key: 'topLid',         label: 'ฝาด้านบน' },
  { key: 'base',           label: 'ฐานเครื่อง' },
  { key: 'left',           label: 'ด้านซ้าย' },
  { key: 'right',          label: 'ด้านขวา' },
  { key: 'screenKeyboard', label: 'จอ + คีย์บอร์ด' },
  { key: 'overall',        label: 'สภาพรวม' },
];
export const DAMAGE_PHOTO_SLOTS = [
  { key: 'damage1', label: 'ความเสียหายที่ 1' },
  { key: 'damage2', label: 'ความเสียหายที่ 2' },
  { key: 'damage3', label: 'ความเสียหายที่ 3' },
  { key: 'damage4', label: 'ความเสียหายที่ 4' },
];

function getCompanyLogo(company) {
  if (!company) return '/gb_logo.webp';
  const c = String(company).toLowerCase();
  if (c.includes('best') || c.includes('hrm')) return '/besthrm_logo.webp';
  return '/gb_logo.webp';
}

const fmtTHB = (n) => (n || n === 0) ? `${Number(n).toLocaleString('th-TH')}` : '-';

/* ════════════════════════════════════════════════════════════════════════
   Print IT-FORM-002 — Return Assessment
   ════════════════════════════════════════════════════════════════════════ */
export function printReturnForm({
  employee = {}, mainAsset = {}, formNumber,
  handoverDate = '',         // วันที่รับมอบ (ขา 1)
  returnDate = '',           // วันที่รับคืน (ขา 2)
  // ── assessment ──
  assessmentReturn = {},     // ขา 2 scores per item
  assessmentHandover = null, // ขา 1 (optional) per-item or per-section totals
  // ── photos ──
  photosReturn = {},         // { topLid, base, ... }
  photosDamage = {},         // { damage1..damage4 }
  // ── damages table ──
  damages = [],              // [{ name, fee }]
  // ── notes ──
  notes = '',
  // ── tier (for fee column header) ──
  tier = 'General',
}) {
  const today = new Date();
  const thDate = today.toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' });
  const logoUrl = getCompanyLogo(employee.company);
  const docNo = formNumber
    || `IT-FORM-002-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${(employee.empId||'').slice(-4)}`;

  const fmtTHDate = (raw) => raw ? new Date(raw).toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' }) : '';

  /* ── Marker (filled ✓ or empty ☐) ── */
  const mark = (filled) => filled
    ? `<span style="display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;font-weight:700;color:#fff;background:#1E487A;border:1px solid #1E487A;border-radius:2px;font-size:10px">✓</span>`
    : `<span style="display:inline-block;width:14px;height:14px;border:1.2px solid #94a3b8;border-radius:2px"></span>`;

  /* ── Section assessment table rows (ขา 2 — main) ── */
  let grandTotalReturn = 0;
  const sectionTotalsReturn = [];
  const assessmentRows = ASSESSMENT_SECTIONS.map((sec, si) => {
    const itemMax = itemMaxScore(si);
    let sectionScore = 0;
    const headerRow = `
      <tr style="background:#e2e8f0">
        <td colspan="7" style="border:1px solid #94a3b8;padding:4px 8px;font-size:11px;font-weight:700;color:#1E487A">${sec.title}</td>
        <td style="border:1px solid #94a3b8;padding:4px 8px;font-size:11px;font-weight:700;text-align:center;color:#1E487A">/${sec.max}</td>
      </tr>`;
    const itemRows = sec.items.map(([no, name, criteria]) => {
      const cell = assessmentReturn[no] || {};
      const score = (cell.score != null && !isNaN(cell.score)) ? Number(cell.score) : null;
      if (score != null) sectionScore += score;
      return `
      <tr>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px;text-align:center;width:34px">${no}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">${name}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10px;color:#475569">${criteria}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;width:38px">${mark(cell.status === 'normal')}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;width:38px">${mark(cell.status === 'scratch')}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;width:38px">${mark(cell.status === 'broken')}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;width:42px;font-size:10.5px;color:#475569">${itemMax % 1 === 0 ? itemMax : itemMax.toFixed(2)}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;width:42px;font-size:10.5px;font-weight:600">${score != null ? (score % 1 === 0 ? score : score.toFixed(2)) : ''}</td>
      </tr>`;
    }).join('');
    grandTotalReturn += sectionScore;
    sectionTotalsReturn.push(sectionScore);
    return headerRow + itemRows + `
      <tr style="background:#f8fafc">
        <td colspan="6" style="border:1px solid #cbd5e1;padding:3px 8px;font-size:10px;text-align:right;font-style:italic;color:#475569">รวมหมวด</td>
        <td style="border:1px solid #cbd5e1;padding:3px;text-align:center;font-size:10.5px;color:#475569">${sec.max}</td>
        <td style="border:1px solid #cbd5e1;padding:3px;text-align:center;font-size:10.5px;font-weight:700;color:#1E487A">${sectionScore % 1 === 0 ? sectionScore : sectionScore.toFixed(2)}</td>
      </tr>`;
  }).join('');
  const grandReturnDisplay = grandTotalReturn % 1 === 0 ? grandTotalReturn : grandTotalReturn.toFixed(2);

  // Grade
  const grade = grandTotalReturn >= 90 ? 'A' : grandTotalReturn >= 75 ? 'B' : grandTotalReturn >= 60 ? 'C' : 'D';
  const gradeColor = { A:'#16a34a', B:'#2563eb', C:'#d97706', D:'#dc2626' }[grade];

  /* ── Section 3: ขา 1 vs ขา 2 comparison table ── */
  // assessmentHandover can be either: per-item { '1.1': { score } } OR per-section [sectionScore, ...]
  const handoverSectionTotal = (si) => {
    if (!assessmentHandover) return null;
    if (Array.isArray(assessmentHandover)) return assessmentHandover[si] ?? null;
    if (typeof assessmentHandover === 'object') {
      const sec = ASSESSMENT_SECTIONS[si];
      let sum = 0; let counted = 0;
      sec.items.forEach(([no]) => {
        const c = assessmentHandover[no];
        if (c && c.score != null) { sum += Number(c.score); counted++; }
      });
      return counted > 0 ? sum : null;
    }
    return null;
  };

  let grandTotalHandover = 0;
  let anyHandoverScore = false;
  const compareRows = ASSESSMENT_SECTIONS.map((sec, si) => {
    const r = sectionTotalsReturn[si] ?? 0;
    const h = handoverSectionTotal(si);
    if (h != null) { grandTotalHandover += Number(h); anyHandoverScore = true; }
    const diff = h != null ? (r - Number(h)) : null;
    const diffStr = diff == null ? '–' : (diff > 0 ? `+${diff}` : `${diff}`);
    const diffColor = diff == null ? '#94a3b8' : (diff < 0 ? '#dc2626' : diff > 0 ? '#16a34a' : '#475569');
    return `
      <tr>
        <td style="border:1px solid #cbd5e1;padding:5px 8px;font-size:11px">${si+1}. ${sec.title.replace(/^\d+\.\s*/, '')} (เต็ม ${sec.max})</td>
        <td style="border:1px solid #cbd5e1;padding:5px 8px;font-size:11px;text-align:center;font-weight:600">${h != null ? h : '...'}</td>
        <td style="border:1px solid #cbd5e1;padding:5px 8px;font-size:11px;text-align:center;font-weight:600;color:#1E487A">${r % 1 === 0 ? r : r.toFixed(2)}</td>
        <td style="border:1px solid #cbd5e1;padding:5px 8px;font-size:11px;text-align:center;font-weight:700;color:${diffColor}">${diffStr}</td>
      </tr>`;
  }).join('');
  const grandDiff = anyHandoverScore ? (grandTotalReturn - grandTotalHandover) : null;

  /* ── Section 4: Damages table — รวมค่าปรับอัตโนมัติ ── */
  let totalFee = 0;
  const damageRowsArr = [];
  damages.forEach((d, i) => {
    const fee = Number(d.fee) || 0;
    totalFee += fee;
    damageRowsArr.push(`
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;font-size:11px;width:34px">${i + 1}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px">${(d.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;font-size:11px;font-variant-numeric:tabular-nums">${fee ? fmtTHB(fee) : '-'}</td>
      </tr>`);
  });
  // Show at least a couple of blank rows when there are no/few damages
  const MIN_ROWS = damages.length === 0 ? 3 : 0;
  while (damageRowsArr.length < damages.length + MIN_ROWS) {
    const i = damageRowsArr.length;
    damageRowsArr.push(`
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;font-size:11px;color:#94a3b8;width:34px">${i + 1}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px;height:22px"></td>
        <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px"></td>
      </tr>`);
  }
  const damageRows = damageRowsArr.join('');

  /* ── Photo cells (compact heights so all sections fit one page) ── */
  const photoCell = (src, label, big = false) => `
    <td style="border:1px solid #cbd5e1;padding:5px;vertical-align:top;width:${big ? '50%' : '33.33%'}">
      <div style="font-size:10.5px;font-weight:700;color:#000;margin-bottom:3px;text-align:center">${label}</div>
      ${src
        ? `<div style="border:1px solid #cbd5e1;border-radius:4px;height:${big ? '120px' : '100px'};overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center">
             <img src="${src}" alt="${label}" style="max-width:100%;max-height:100%;object-fit:contain"/>
           </div>`
        : `<div style="border:1.5px dashed #94a3b8;border-radius:4px;height:${big ? '120px' : '100px'};display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:11px">[ แนบรูปภาพ ]</div>`
      }
    </td>`;

  /* ── Section title bar ── */
  const sectionBar = (n, label) => `
    <div style="background:#1E487A;color:#fff;padding:5px 12px;font-size:11.5px;font-weight:700;margin:10px 0 5px;border-radius:3px">
      ${n}. ${label}
    </div>`;

  /* ── Info cell ── */
  const ic = (label, value) => `
    <div style="padding:3px 0">
      <div style="font-size:9.5px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:2px">${label}</div>
      <div style="font-size:11px;font-weight:600;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px;min-height:18px">${value || ''}</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <title>${docNo} - ใบรับคืนทรัพย์สิน - ${employee.fullName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body {
      font-family:'Sarabun','Prompt',sans-serif;
      font-size:12px; color:#000; background:#fff;
      padding:14px 22px;
    }
    .page { page-break-after:always; }
    .page:last-child { page-break-after:auto; }
    table { border-collapse:collapse; width:100%; }
    @media print {
      body { padding:0; }
      .no-print { display:none !important; }
      @page { size:A4 portrait; margin:10mm 12mm 10mm 12mm; }
    }
  </style>
</head>
<body>

  <button class="no-print" onclick="window.print()"
    style="display:block;margin:0 auto 16px;padding:8px 28px;background:#1E487A;color:#fff;
    border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
    🖨️ พิมพ์เอกสาร / บันทึก PDF
  </button>

  <!-- ════════════════════════════════════════════════ -->
  <!--          หน้าที่ 1 — Header + Summary + Assess (1) -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    <div style="text-align:center;margin-bottom:6px">
      <div style="font-size:11px;color:#475569;font-weight:600;letter-spacing:0.08em">${docNo}</div>
      <div style="font-size:18px;font-weight:700;color:#1E487A;line-height:1.2;margin-top:2px">ใบรับคืนทรัพย์สิน IT</div>
      <div style="font-size:10.5px;color:#475569">Asset Return Assessment Form</div>
    </div>

    <!-- Header band -->
    <table style="margin-bottom:8px">
      <tr>
        <td style="border:1px solid #1E487A;padding:8px 10px;width:30%;vertical-align:middle;background:#f8fafc">
          <div style="display:flex;align-items:center;gap:8px">
            <img src="${logoUrl}" alt="logo" style="height:38px;width:auto;object-fit:contain"/>
            <div>
              <div style="font-size:10px;font-weight:700;color:#1E487A;line-height:1.2">Globe Syndicate<br/>(Thailand) Co., Ltd.</div>
            </div>
          </div>
        </td>
        <td style="border:1px solid #1E487A;padding:8px 10px;width:42%;vertical-align:middle;background:#fff">
          <div style="font-size:12px;font-weight:700;color:#000">ใบรับคืนทรัพย์สิน IT</div>
          <div style="font-size:10px;color:#475569;margin-top:1px">IT Asset Management &nbsp;|&nbsp; บริษัท โกลบ ซินดิเคท (ประเทศไทย) จำกัด</div>
        </td>
        <td style="border:1px solid #1E487A;padding:8px 10px;width:28%;vertical-align:middle;background:#fff;font-size:10.5px">
          <div><b>เลขที่:</b> ${docNo}</div>
          <div><b>วันที่:</b> ${thDate}</div>
          <div><b>Rev:</b> 01 &nbsp;|&nbsp; IT-POL-LAP-001</div>
        </td>
      </tr>
    </table>

    <div style="background:#1E487A;color:#fff;padding:5px 12px;font-size:11.5px;font-weight:700;margin-bottom:5px;border-radius:3px;display:flex;justify-content:space-between">
      <span>ขา 2 — รับคืน (Return Assessment)</span>
      <span style="font-weight:500;font-size:10.5px">เกรด ${grade} &nbsp;|&nbsp; รวม ${grandReturnDisplay}/100</span>
    </div>

    <!-- ── 1. ข้อมูลสรุป ── -->
    ${sectionBar(1, 'ข้อมูลสรุป')}
    <table>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;width:50%;vertical-align:top">${ic('พนักงาน', `${employee.fullName||'-'}${employee.empId?` (${employee.empId})`:''} — ${employee.department||'-'}`)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;width:50%;vertical-align:top">${ic('อุปกรณ์', `${mainAsset.name||'-'}  |  ${mainAsset.assetTag||''}`)}</td>
      </tr>
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;vertical-align:top">${ic('วันที่รับมอบ', fmtTHDate(handoverDate))}</td>
        <td style="border:1px solid #cbd5e1;padding:6px 10px;vertical-align:top">${ic('วันที่คืน', fmtTHDate(returnDate))}</td>
      </tr>
    </table>

    <!-- ── 2. แบบประเมินสภาพรับคืน ── -->
    ${sectionBar(2, 'แบบประเมินสภาพอุปกรณ์ตอนรับคืน (100 คะแนน)')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:34px">ลำดับ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">รายการตรวจสอบ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">เกณฑ์การประเมิน</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:38px">ปกติ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:38px">ตำหนิ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:38px">ชำรุด</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:42px">เต็ม</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:42px">ได้</th>
        </tr>
      </thead>
      <tbody>${assessmentRows}
        <tr style="background:#1E487A;color:#fff">
          <td colspan="6" style="border:1px solid #1E487A;padding:7px 12px;font-size:13px;font-weight:700;text-align:right">รวมคะแนนทั้งหมด</td>
          <td style="border:1px solid #1E487A;padding:7px;text-align:center;font-size:13px;font-weight:700">100</td>
          <td style="border:1px solid #1E487A;padding:7px;text-align:center;font-size:13px;font-weight:700">${grandReturnDisplay}</td>
        </tr>
      </tbody>
    </table>

  </div><!-- end page 1 -->

  <!-- ════════════════════════════════════════════════ -->
  <!--          หน้าที่ 2 — เปรียบเทียบ + ค่าปรับ           -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    <!-- ── 3. สรุปคะแนนเปรียบเทียบ ── -->
    ${sectionBar(3, 'สรุปคะแนนเปรียบเทียบ ขา 1 vs ขา 2')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:6px 10px;font-size:11.5px;text-align:left">หมวด</th>
          <th style="border:1px solid #94a3b8;padding:6px 10px;font-size:11.5px;width:120px">คะแนนก่อนส่งมอบ (ขา 1)</th>
          <th style="border:1px solid #94a3b8;padding:6px 10px;font-size:11.5px;width:120px">คะแนนตอนรับคืน (ขา 2)</th>
          <th style="border:1px solid #94a3b8;padding:6px 10px;font-size:11.5px;width:80px">ผลต่าง</th>
        </tr>
      </thead>
      <tbody>
        ${compareRows}
        <tr style="background:#f1f5f9">
          <td style="border:1px solid #94a3b8;padding:7px 10px;font-size:12.5px;font-weight:700">รวม (100 คะแนน)</td>
          <td style="border:1px solid #94a3b8;padding:7px 10px;font-size:12.5px;font-weight:700;text-align:center">${anyHandoverScore ? (grandTotalHandover % 1 === 0 ? grandTotalHandover : grandTotalHandover.toFixed(2)) : '...'}</td>
          <td style="border:1px solid #94a3b8;padding:7px 10px;font-size:12.5px;font-weight:700;text-align:center;color:#1E487A">${grandReturnDisplay}</td>
          <td style="border:1px solid #94a3b8;padding:7px 10px;font-size:12.5px;font-weight:700;text-align:center;color:${gradeColor}">เกรด: ${grade}</td>
        </tr>
      </tbody>
    </table>
    <div style="font-size:10px;color:#475569;margin-top:4px">เกณฑ์เกรด: A = 90-100 | B = 75-89 | C = 60-74 | D = ต่ำกว่า 60 (ต้องพิจารณาค่าปรับ)</div>

    <!-- ── 4. รายการความเสียหายและค่าปรับ ── -->
    ${sectionBar(4, 'รายการความเสียหายและการคำนวณค่าปรับ')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:11px;width:38px">ลำดับ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:11px;text-align:left">รายการความเสียหาย</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:11px;width:170px">ค่าปรับที่คิด (THB)</th>
        </tr>
      </thead>
      <tbody>
        ${damageRows}
        <tr style="background:#fef3c7">
          <td colspan="2" style="border:1px solid #94a3b8;padding:8px 10px;font-size:12.5px;font-weight:700;text-align:right">รวมค่าปรับทั้งหมด</td>
          <td style="border:1px solid #94a3b8;padding:8px 10px;font-size:13px;font-weight:700;text-align:right;color:#dc2626">${fmtTHB(totalFee)} บาท</td>
        </tr>
      </tbody>
    </table>
    <div style="font-size:10px;color:#475569;margin-top:4px">อ้างอิง: IT-POL-LAP-001 Rev.01 &nbsp;|&nbsp; Tier: ${tier} &nbsp;|&nbsp; ใช้ราคาตามใบเสนอราคาซ่อมจริงหากต่างจากตาราง</div>

  </div><!-- end page 2 -->

  <!-- ════════════════════════════════════════════════ -->
  <!--          หน้าที่ 3 — รูปภาพ + เงื่อนไข + ลายเซ็น     -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    <!-- ── 5. รูปภาพรับคืน 6 มุม ── -->
    ${sectionBar(5, 'รูปภาพสภาพอุปกรณ์ตอนรับคืน')}
    <div style="font-size:10.5px;color:#475569;margin-bottom:4px">รูปภาพทั่วไป 6 มุม</div>
    <table>
      <tr>${photoCell(photosReturn.topLid, 'ฝาด้านบน')}${photoCell(photosReturn.base, 'ฐานเครื่อง')}${photoCell(photosReturn.left, 'ด้านซ้าย')}</tr>
      <tr>${photoCell(photosReturn.right, 'ด้านขวา')}${photoCell(photosReturn.screenKeyboard, 'จอ + คีย์บอร์ด')}${photoCell(photosReturn.overall, 'สภาพรวม')}</tr>
    </table>

    <div style="font-size:10.5px;color:#475569;margin:8px 0 4px">รูปภาพความเสียหายที่พบ (ถ้ามี)</div>
    <table>
      <tr>${photoCell(photosDamage.damage1, 'ความเสียหายที่ 1', true)}${photoCell(photosDamage.damage2, 'ความเสียหายที่ 2', true)}</tr>
      <tr>${photoCell(photosDamage.damage3, 'ความเสียหายที่ 3', true)}${photoCell(photosDamage.damage4, 'ความเสียหายที่ 4', true)}</tr>
    </table>

    <!-- ── 6. เงื่อนไขรับคืน ── -->
    ${sectionBar(6, 'เงื่อนไขการรับคืนทรัพย์สิน')}
    <div style="border:1px solid #cbd5e1;padding:7px 12px;border-radius:3px;font-size:11px;line-height:1.6">
      <div style="font-weight:700;margin-bottom:2px">ข้อตกลงและเงื่อนไข</div>
      <div>1. IT เจ้าหน้าที่และพนักงานรับทราบผลการประเมินสภาพตามที่บันทึกไว้ในเอกสารนี้</div>
      <div>2. ค่าปรับ (ถ้ามี) จะถูกหักจากเงินเดือนงวดสุดท้าย หรือตามข้อตกลงกับแผนกบุคคล (HR)</div>
      <div>3. อ้างอิงค่าปรับตามตาราง IT-POL-LAP-001 Rev.01 &nbsp;|&nbsp; Tier: ${tier}</div>
      <div>4. กรณีออกพนักงาน: แผนกบุคคลต้องลงนามรับทราบก่อนดำเนินการด้านเอกสารลาออก/เลิกจ้าง</div>
      <div>5. การโต้แย้งผลการประเมินต้องทำภายใน 3 วันทำการหลังลงนาม</div>
      ${notes ? `<div style="margin-top:4px;padding-top:4px;border-top:1px dashed #cbd5e1"><b>หมายเหตุ:</b> ${notes.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>` : ''}
    </div>

    <!-- ── 7. ลายมือชื่อ 3 ฝ่าย (IT / พนักงาน / HR) ── -->
    ${sectionBar(7, 'ลายมือชื่อ 3 ฝ่าย (IT / พนักงาน / แผนกบุคคล)')}
    <table>
      <tr>
        <td style="border:1px solid #000;padding:10px 14px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">เจ้าหน้าที่ IT ผู้รับคืน</div>
          <div style="border-bottom:1px solid #000;margin:28px 14px 5px"></div>
          <div style="font-size:11.5px;font-weight:700">( ..................................... )</div>
          <div style="font-size:11px;margin-top:5px">วันที่ .....................................</div>
        </td>
        <td style="border:1px solid #000;padding:10px 14px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">พนักงานผู้ส่งคืน</div>
          <div style="border-bottom:1px solid #000;margin:28px 14px 5px"></div>
          <div style="font-size:11.5px;font-weight:700">( ${employee.fullName || '.....................................'} )</div>
          <div style="font-size:11px;margin-top:5px">วันที่ .....................................</div>
        </td>
        <td style="border:1px solid #000;padding:10px 14px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">แผนกบุคคล (HR) รับทราบ / อนุมัติ</div>
          <div style="border-bottom:1px solid #000;margin:28px 14px 5px"></div>
          <div style="font-size:11.5px;font-weight:700">( ..................................... )</div>
          <div style="font-size:11px;margin-top:5px">วันที่ .....................................</div>
        </td>
      </tr>
    </table>

  </div><!-- end page 3 -->

  <!-- ═══════════════ ภาคผนวก (shared with IT-FORM-001) ═══════════════ -->
  ${renderAppendix({ employeeName: employee.fullName, docNo, thDate })}

</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
}
