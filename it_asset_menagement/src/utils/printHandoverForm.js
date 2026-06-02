/* ════════════════════════════════════════════════════════════════════════
   IT-FORM-001 — ใบส่งมอบทรัพย์สิน IT (Pre-Handover Asset Transfer Form)
   อ้างอิง IT-POL-LAP-001 Rev.01
   ════════════════════════════════════════════════════════════════════════ */

import { renderAppendix } from './printAppendix.js';
import { printViaIframe } from './printViaIframe.js';
import { getCompanyInfo } from './companyInfo.js';
import { e, safeUrl } from './htmlEscape.js';

const fmtTHB = (n) => (n || n === 0) ? `${Number(n).toLocaleString('th-TH')}` : '-';

/* ── 100-point checklist definition (sections 5 / 2) ── */
export const ASSESSMENT_SECTIONS = [
  {
    title: '1. สภาพตัวเครื่องและบรรจุภัณฑ์', max: 20,
    items: [
      ['1.1', 'ฝาบน / ฐานเครื่อง',         'ไม่มีรอยแตก บุบ หรือขีดข่วนลึก'],
      ['1.2', 'บานพับ (Hinge)',           'เปิด-ปิดสนิท ไม่หลวม ไม่มีเสียงผิดปกติ'],
      ['1.3', 'มุมและขอบเครื่อง',          'ไม่บิ่น ไม่แตก ไม่มีรอยกระแทก'],
      ['1.4', 'ป้ายทรัพย์สิน / Sticker',   'ครบถ้วน ไม่ลอก ไม่ถูกแก้ไข'],
    ],
  },
  {
    title: '2. จอภาพ (Display)', max: 20,
    items: [
      ['2.1', 'กระจกจอ / Panel',                'ไม่แตกร้าว ไม่มีรอยขีดข่วน'],
      ['2.2', 'Dead Pixel / Bright Spot',       'จำนวน Dead Pixel ไม่เกิน 3 จุด'],
      ['2.3', 'ขอบจอ (Bezel)',                  'ไม่แตก ไม่หัก ไม่บิ่น'],
      ['2.4', 'ความสม่ำเสมอของแสง (Backlight)', 'ไม่มี Backlight bleed หรือแสงหน้า'],
    ],
  },
  {
    title: '3. คีย์บอร์ดและ Touchpad', max: 15,
    items: [
      ['3.1', 'ปุ่มคีย์บอร์ด',           'ครบทุกปุ่ม ไม่หลวม ไม่หัก พิมพ์ได้ปกติ'],
      ['3.2', 'Touchpad',                'ตอบสนองปกติ ทั้ง Click และ Gesture'],
      ['3.3', 'ไฟ Backlit (ถ้ามี)',      'ติดสม่ำเสมอ ไม่ดับบางส่วน'],
    ],
  },
  {
    title: '4. ระบบปฏิบัติการและซอฟต์แวร์', max: 20,
    items: [
      ['4.1', 'Windows Activation',     'Activated ถูกต้อง ไม่มี Watermark'],
      ['4.2', 'ซอฟต์แวร์ตามรายการ',     'ครบตามที่ระบุในส่วนซอฟต์แวร์'],
      ['4.3', 'ความสะอาดของระบบ',       'ไม่มี Malware / Adware / Bloatware'],
      ['4.4', 'ไดรเวอร์และ Update',     'Driver ครบ Windows Update เป็นปัจจุบัน'],
    ],
  },
  {
    title: '5. ประสิทธิภาพการทำงาน', max: 15,
    items: [
      ['5.1', 'ระบบระบายความร้อน',                 'พัดลมทำงานปกติ ไม่มีเสียงผิดปกติ อุณหภูมิ CPU Idle ไม่เกิน 55°C'],
      ['5.2', 'Boot Time และการตอบสนองระบบ',       'บูตสำเร็จภายใน 60 วินาที ไม่มี crash/freeze ระบบตอบสนองได้ปกติ'],
      ['5.3', 'สุขภาพ Storage / พื้นที่ว่าง',       'SSD ทำงานปกติ ไม่มี Bad Sector พื้นที่ว่างไม่ต่ำกว่า 50 GB'],
    ],
  },
  {
    title: '6. อุปกรณ์เสริมและพอร์ตเชื่อมต่อ', max: 10,
    items: [
      ['6.1', 'พอร์ต USB / HDMI / USB-C', 'ทุกพอร์ตทำงานได้ปกติ'],
      ['6.2', 'Charger / Adapter',         'ครบ ไม่ชำรุด สายไม่ฉีก'],
      ['6.3', 'อุปกรณ์เสริมตามรายการ',     'ครบตามที่ระบุในส่วนอุปกรณ์เสริม'],
    ],
  },
];

/* ── 6-angle photo slots (section 7) ── */
export const PHOTO_SLOTS = [
  { key: 'topLid',         label: 'ฝาด้านบน' },
  { key: 'base',           label: 'ฐานเครื่อง' },
  { key: 'left',           label: 'ด้านซ้าย' },
  { key: 'right',          label: 'ด้านขวา' },
  { key: 'screenKeyboard', label: 'จอ + คีย์บอร์ด' },
  { key: 'existingDefect', label: 'ตำหนิเดิม' },
];

/* ── Calculate per-item max score (section max ÷ item count) ── */
export function itemMaxScore(sectionIdx) {
  const sec = ASSESSMENT_SECTIONS[sectionIdx];
  return sec.max / sec.items.length;
}

/* ── Helper: default score per status ── */
export function scoreFromStatus(status, max) {
  if (status === 'normal') return max;
  if (status === 'scratch') return max / 2;
  if (status === 'broken') return 0;
  return null; // not assessed
}

/* ── Build empty assessment state (all 'normal' by default) ── */
export function buildEmptyAssessment() {
  const a = {};
  ASSESSMENT_SECTIONS.forEach((sec, si) => {
    const max = itemMaxScore(si);
    sec.items.forEach(([no]) => {
      a[no] = { status: 'normal', score: max };
    });
  });
  return a;
}

/* ── ตารางค่าปรับฉบับเต็ม (ภาคผนวก ส่วนที่ 5) ── */
export const DAMAGE_FEE_TABLE = [
  { group: 'ตัวเครื่อง / เคส' },
  [1,  'เคสบุบ / รอยขีดข่วนลึก (ฝาบน/ฐาน)',     1500, 2500,  4000, 'ต่อจุด'],
  [2,  'เคสแตก / ร้าว (ฝา หรือฐาน)',           3000, 4500,  7000, 'ต่อชิ้น'],
  [3,  'บานพับชำรุด / เปิด-ปิดไม่ได้',           2000, 3000,  5000, ''],
  [4,  'มุม/ขอบแตกบิ่น',                       1000, 1500,  2500, 'ต่อจุด'],
  { group: 'จอภาพ' },
  [5,  'หน้าจอแตก / ร้าว',                     5000, 7500, 12000, ''],
  [6,  'Dead Pixel เกิน 3 จุด (4-10 จุด)',     2000, 3500,  6000, ''],
  [7,  'Dead Pixel เกิน 10 จุด',               3500, 5500,  9000, ''],
  [8,  'ขอบจอ (Bezel) แตก / หัก',              1500, 2500,  4000, ''],
  { group: 'คีย์บอร์ดและ Touchpad' },
  [9,  'ปุ่มคีย์บอร์ดหัก / หลุด (1-5 ปุ่ม)',   1500, 2500,  4000, 'ต่อครั้ง'],
  [10, 'เปลี่ยนคีย์บอร์ดทั้งแผง',                3500, 5000,  8000, ''],
  [11, 'Touchpad ชำรุด / ใช้งานไม่ได้',          2000, 3000,  5000, ''],
  { group: 'พอร์ตเชื่อมต่อและอุปกรณ์เสริม' },
  [12, 'พอร์ต USB / HDMI / USB-C ชำรุด',        1000, 1500,  2500, 'ต่อพอร์ต'],
  [13, 'Charger / Adapter หาย',                  800, 1200,  2000, ''],
  [14, 'Charger สายฉีก / ชำรุด',                 400,  600,  1000, ''],
  { group: 'กรณีพิเศษ' },
  [15, 'น้ำเข้า — ซ่อมได้',                    3000, 5000,  8000, 'บวกค่าซ่อมจริง'],
  [16, 'น้ำเข้า — ซ่อมไม่ได้ / Motherboard เสีย', 'ราคาตลาด', 'ราคาตลาด', 'ราคาตลาด', 'ณ วันเกิดเหตุ'],
  [17, 'ทำหาย / สูญหาย',                       'ราคาตลาด', 'ราคาตลาด', 'ราคาตลาด', 'แจ้ง IT+ประกัน'],
  [18, 'ถูกโจรกรรม (มีใบแจ้งความ)',            '50% ราคาตลาด', '50% ราคาตลาด', '50% ราคาตลาด', 'ต้องมีใบแจ้งความ'],
];

/* ════════════════════════════════════════════════════════════════════════
   ฟังก์ชันสร้าง HTML ของฟอร์มทั้งฉบับ
   ════════════════════════════════════════════════════════════════════════ */
export function printHandoverForm({
  employee, empAssets, empLicenses, empAccessories, formNumber,
  assessment = {},   // { '1.1': { status, score }, ... }
  photos = {},       // { topLid, base, left, right, screenKeyboard, existingDefect }
  defectsNote = '',  // pre-existing defects text
  handoverDate = '', // user-entered handover date
}) {
  const today = new Date();
  const thDate = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const companyInfo = getCompanyInfo(employee.company);
  const docNo = formNumber || `IT-FORM-001-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${(employee.empId || '').slice(-4)}`;

  /* ── Marker helpers (filled ✓ vs empty ☐) ── */
  const mark = (filled) => filled
    ? `<span style="display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;font-weight:700;color:#fff;background:#000;border:1px solid #000;border-radius:2px;font-size:10px">✓</span>`
    : `<span style="display:inline-block;width:14px;height:14px;border:1.2px solid #94a3b8;border-radius:2px"></span>`;

  /* ── ส่วน 2: ข้อมูลอุปกรณ์ — แสดงทุกตัวที่พนักงานถือครอง ── */
  const assetRows = empAssets.map((a, i) => `
    <tr>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">${i + 1}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-size:11px;font-weight:600">${e(a.name) || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-size:11px">${e(a.model) || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">${e(a.tier) || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-family:'Courier New',monospace;font-size:10.5px">${e(a.assetTag) || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-family:'Courier New',monospace;font-size:10.5px">${e(a.sn) || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:right;font-size:11px;font-variant-numeric:tabular-nums">${a.cost ? fmtTHB(a.cost) : '-'}</td>
    </tr>`).join('');

  /* ── ส่วน 3: ซอฟต์แวร์ ── */
  const softwareRows = empLicenses.map((l, i) => `
    <tr>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">${i + 1}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-size:11px">${e(l.name) || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-size:11px">${e(l.supplier || l.vendor) || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">${l.expirationDate ? new Date(l.expirationDate).toLocaleDateString('th-TH') : 'ไม่มีวันหมดอายุ'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-size:11px"></td>
    </tr>`).join('');

  /* ── ส่วน 4: อุปกรณ์เสริม ── */
  const accessoryRows = empAccessories.map((a, i) => `
    <tr>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">${i + 1}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-size:11px">${e(a.name) || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">${e(a.sn || a.serialNumber) || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">พร้อมใช้งาน</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">1</td>
    </tr>`).join('');

  /* ── Sections 5: assessment checklist (filled from assessment prop) ── */
  let grandTotal = 0;
  const assessmentRows = ASSESSMENT_SECTIONS.map((sec, si) => {
    const itemMax = itemMaxScore(si);
    let sectionScore = 0;
    const headerRow = `
      <tr style="background:#e2e8f0">
        <td colspan="7" style="border:1px solid #94a3b8;padding:4px 8px;font-size:11px;font-weight:700;color:#000">${sec.title}</td>
        <td style="border:1px solid #94a3b8;padding:4px 8px;font-size:11px;font-weight:700;text-align:center;color:#000">/${sec.max}</td>
      </tr>`;
    const itemRows = sec.items.map(([no, name, criteria]) => {
      const cell = assessment[no] || {};
      const score = (cell.score != null && !isNaN(cell.score)) ? Number(cell.score) : null;
      if (score != null) sectionScore += score;
      return `
      <tr>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px;text-align:center;width:34px">${no}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">${name}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10px;color:#000">${criteria}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;width:38px">${mark(cell.status === 'normal')}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;width:38px">${mark(cell.status === 'scratch')}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;width:38px">${mark(cell.status === 'broken')}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;width:42px;font-size:10.5px;color:#000">${itemMax % 1 === 0 ? itemMax : itemMax.toFixed(2)}</td>
        <td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;width:42px;font-size:10.5px;font-weight:600">${score != null ? (score % 1 === 0 ? score : score.toFixed(2)) : ''}</td>
      </tr>`;
    }).join('');
    grandTotal += sectionScore;
    const subtotalRow = `
      <tr style="background:#f8fafc">
        <td colspan="6" style="border:1px solid #cbd5e1;padding:3px 8px;font-size:10px;text-align:right;font-style:italic;color:#000">รวมหมวด</td>
        <td style="border:1px solid #cbd5e1;padding:3px;text-align:center;font-size:10.5px;color:#000">${sec.max}</td>
        <td style="border:1px solid #cbd5e1;padding:3px;text-align:center;font-size:10.5px;font-weight:700;color:#000">${sectionScore % 1 === 0 ? sectionScore : sectionScore.toFixed(2)}</td>
      </tr>`;
    return headerRow + itemRows + subtotalRow;
  }).join('');
  const grandTotalDisplay = grandTotal % 1 === 0 ? grandTotal : grandTotal.toFixed(2);

  /* ── Photo cell — render uploaded image or placeholder (compact to fit page 3) ── */
  const photoCell = (key, label) => {
    const src = photos[key];
    return `
    <td style="border:1px solid #cbd5e1;padding:5px;vertical-align:top;width:33.33%">
      <div style="font-size:10.5px;font-weight:700;color:#000;margin-bottom:3px;text-align:center">${e(label)}</div>
      ${src
        ? `<div style="border:1px solid #cbd5e1;border-radius:4px;height:130px;overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center">
             <img src="${safeUrl(src)}" alt="${e(label)}" style="max-width:100%;max-height:100%;object-fit:contain"/>
           </div>`
        : `<div style="border:1.5px dashed #94a3b8;border-radius:4px;height:130px;display:flex;align-items:center;justify-content:center;color:#000;font-size:11px">[ แนบรูปภาพ ]</div>`
      }
    </td>`;
  };

  /* ── Section title bar ── */
  const sectionBar = (n, label) => `
    <div style="background:#000;color:#fff;padding:5px 12px;font-size:11.5px;font-weight:700;margin:10px 0 5px;border-radius:3px">
      ${n}. ${label}
    </div>`;

  /* ── Info cell ── */
  const ic = (label, value) => `
    <div style="padding:3px 0">
      <div style="font-size:9.5px;color:#000;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:2px">${label}</div>
      <div style="font-size:11px;font-weight:600;color:#000;border-bottom:1px dotted #94a3b8;padding-bottom:3px;min-height:18px">${e(value) || ''}</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <title>${e(docNo)} - ใบส่งมอบทรัพย์สิน - ${e(employee.fullName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    html, body { height:auto; }
    body {
      font-family:'Sarabun','Prompt',sans-serif;
      font-size:12px; color:#000; background:#fff;
      padding:14px 22px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* บังคับให้ทุก element พิมพ์สี background ออกมาด้วย (ไม่ต้องเปิด "Background graphics") */
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
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

  <!-- ════════════════════════════════════════════════ -->
  <!--               หน้าที่ 1 — ฟอร์มหลัก                -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    <!-- Title strip -->
    <div style="text-align:center;margin-bottom:6px">
      <div style="font-size:11px;color:#000;font-weight:600;letter-spacing:0.08em">${e(docNo)}</div>
      <div style="font-size:18px;font-weight:700;color:#000;line-height:1.2;margin-top:2px">ใบส่งมอบทรัพย์สิน IT</div>
      <div style="font-size:10.5px;color:#000">Pre-Handover Asset Transfer Form</div>
    </div>

    <!-- Header band -->
    <table style="margin-bottom:8px">
      <tr>
        <td style="border:1px solid #000;padding:8px 10px;width:30%;vertical-align:middle;background:#f8fafc">
          <div style="display:flex;align-items:center;gap:8px">
            <img src="${safeUrl(companyInfo.logoUrl)}" alt="logo" style="height:38px;width:auto;object-fit:contain"/>
            <div>
              <div style="font-size:10px;font-weight:700;color:#000;line-height:1.2">${e(companyInfo.nameEn)}</div>
            </div>
          </div>
        </td>
        <td style="border:1px solid #000;padding:8px 10px;width:42%;vertical-align:middle;background:#fff">
          <div style="font-size:12px;font-weight:700;color:#000">ใบส่งมอบทรัพย์สิน IT</div>
          <div style="font-size:10px;color:#000;margin-top:1px">IT Asset Management &nbsp;|&nbsp; ${e(companyInfo.nameTh)}</div>
        </td>
        <td style="border:1px solid #000;padding:8px 10px;width:28%;vertical-align:middle;background:#fff;font-size:10.5px">
          <div><b>เลขที่:</b> ${e(docNo)}</div>
          <div><b>วันที่:</b> ${thDate}</div>
          <div><b>Rev:</b> 01 &nbsp;|&nbsp; IT-POL-LAP-001</div>
        </td>
      </tr>
    </table>

    <div style="background:#000;color:#fff;padding:5px 12px;font-size:11.5px;font-weight:700;margin-bottom:5px;border-radius:3px;display:flex;justify-content:space-between">
      <span>ขา 1 — ก่อนส่งมอบ (Pre-Handover)</span>
      <span style="font-weight:500;font-size:10.5px">เอกสารอ้างอิง: IT-POL-LAP-001 Rev.01</span>
    </div>

    <!-- ── 1. ข้อมูลพนักงาน ── -->
    ${sectionBar(1, 'ข้อมูลพนักงาน')}
    <div style="border:1px solid #cbd5e1;padding:8px 12px;border-radius:3px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 18px">
        ${ic('ชื่อ-นามสกุล', employee.fullName)}
        ${ic('รหัสพนักงาน', employee.empId)}
        ${ic('ตำแหน่ง', employee.position)}
        ${ic('แผนก / ฝ่าย', employee.department)}
        ${ic('ผู้บังคับบัญชา', employee.manager)}
        ${ic('วันที่รับมอบ', handoverDate
          ? new Date(handoverDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
          : '')}
      </div>
    </div>

    <!-- ── 2. ข้อมูลอุปกรณ์ (รวมทุกชิ้นที่พนักงานถือครอง) ── -->
    ${sectionBar(2, `ข้อมูลอุปกรณ์${empAssets.length > 1 ? ` (${empAssets.length} รายการ)` : ''}`)}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:34px">ลำดับ</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px">ชื่ออุปกรณ์</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px">รุ่น / Model</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:80px">Tier</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:130px">Asset Tag</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:110px">Serial Number</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:90px">มูลค่า (THB)</th>
        </tr>
      </thead>
      <tbody>
        ${assetRows || `<tr><td colspan="7" style="border:1px solid #cbd5e1;padding:8px;text-align:center;color:#000;font-size:10.5px">ไม่มีทรัพย์สินหลักที่ผูกกับพนักงาน</td></tr>`}
      </tbody>
    </table>

    <!-- ── 3. ซอฟต์แวร์ ── -->
    ${sectionBar(3, 'ซอฟต์แวร์ที่ติดตั้ง')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:34px">ลำดับ</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px">ชื่อซอฟต์แวร์</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px">รายละเอียด / License</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:110px">วันหมดอายุ</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:120px">หมายเหตุ</th>
        </tr>
      </thead>
      <tbody>
        ${softwareRows || `<tr><td colspan="5" style="border:1px solid #cbd5e1;padding:8px;text-align:center;color:#000;font-size:10.5px">ไม่มีซอฟต์แวร์ที่ผูกกับพนักงาน</td></tr>`}
      </tbody>
    </table>

    <!-- ── 4. อุปกรณ์เสริม ── -->
    ${sectionBar(4, 'อุปกรณ์เสริม')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:34px">ลำดับ</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px">รายการอุปกรณ์เสริม</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:140px">Serial / รหัส</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:90px">สภาพ</th>
          <th style="border:1px solid #94a3b8;padding:5px 7px;font-size:10.5px;width:60px">จำนวน</th>
        </tr>
      </thead>
      <tbody>
        ${accessoryRows || `<tr><td colspan="5" style="border:1px solid #cbd5e1;padding:8px;text-align:center;color:#000;font-size:10.5px">ไม่มีอุปกรณ์เสริม</td></tr>`}
      </tbody>
    </table>

  </div><!-- end page 1 -->

  <!-- ════════════════════════════════════════════════ -->
  <!--          หน้าที่ 2 — แบบประเมินสภาพอุปกรณ์          -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    ${sectionBar(5, 'แบบประเมินสภาพอุปกรณ์ (100 คะแนน)')}
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
        <tr style="background:#000;color:#fff">
          <td colspan="6" style="border:1px solid #000;padding:7px 12px;font-size:13px;font-weight:700;text-align:right">รวมคะแนนทั้งหมด</td>
          <td style="border:1px solid #000;padding:7px;text-align:center;font-size:13px;font-weight:700">100</td>
          <td style="border:1px solid #000;padding:7px;text-align:center;font-size:13px;font-weight:700">${grandTotalDisplay}</td>
        </tr>
      </tbody>
    </table>

  </div><!-- end page 2 (assessment alone) -->

  <!-- ════════════════════════════════════════════════ -->
  <!--      หน้าที่ 3 — ตำหนิ + รูปภาพ + เงื่อนไข + ลายเซ็น  -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    <!-- ── 6. บันทึกตำหนิที่มีอยู่แล้ว ── -->
    ${sectionBar(6, 'บันทึกตำหนิที่มีอยู่แล้ว')}
    <div style="border:1px solid #cbd5e1;padding:6px 12px;border-radius:3px">
      <div style="font-size:11px;color:#000;margin-bottom:3px">บันทึกตำหนิ / ความเสียหายที่มีอยู่แล้วก่อนส่งมอบ (ถ้าไม่มีให้ระบุ "ไม่มี")</div>
      ${defectsNote
        ? `<div style="font-size:11.5px;white-space:pre-wrap;line-height:1.6;padding:2px 0">${e(defectsNote)}</div>`
        : `<div style="border-bottom:1px dotted #94a3b8;height:16px"></div>
           <div style="border-bottom:1px dotted #94a3b8;height:16px;margin-top:3px"></div>`
      }
    </div>

    <!-- ── 7. รูปภาพ 6 มุม ── -->
    ${sectionBar(7, 'รูปภาพสภาพอุปกรณ์ก่อนส่งมอบ')}
    <div style="font-size:10.5px;color:#000;margin-bottom:3px">แนบรูปภาพ 6 มุม: ฝา / ฐาน / ซ้าย / ขวา / จอ+คีย์บอร์ด / ตำหนิเดิม</div>
    <table>
      <tr>${photoCell('topLid', 'ฝาด้านบน')}${photoCell('base', 'ฐานเครื่อง')}${photoCell('left', 'ด้านซ้าย')}</tr>
      <tr>${photoCell('right', 'ด้านขวา')}${photoCell('screenKeyboard', 'จอ + คีย์บอร์ด')}${photoCell('existingDefect', 'ตำหนิเดิม')}</tr>
    </table>

    <!-- ── 8. เงื่อนไขรับมอบ ── -->
    ${sectionBar(8, 'เงื่อนไขการรับมอบทรัพย์สิน')}
    <div style="border:1px solid #cbd5e1;padding:7px 12px;border-radius:3px;font-size:11px;line-height:1.6">
      <div style="font-weight:700;margin-bottom:2px">ข้อตกลงและเงื่อนไข</div>
      <div>1. พนักงานรับทราบและยืนยันว่าอุปกรณ์ที่รับมอบอยู่ในสภาพตามที่ระบุในเอกสารนี้</div>
      <div>2. พนักงานมีหน้าที่ดูแลรักษาอุปกรณ์ให้อยู่ในสภาพดีตลอดระยะเวลาการใช้งาน</div>
      <div>3. หากเกิดความเสียหายจากการใช้งานที่ผิดประเภทหรือความประมาท <b>Notebook / Computer</b> จะถูกหักค่าเสียหายตามตาราง IT-POL-LAP-001 (ภาคผนวกส่วนที่ 5)</div>
      <div>4. <b>อุปกรณ์เสริม</b> (Mouse, Keyboard, Headset ฯลฯ) จะคิดค่าปรับตามอายุการใช้งานในภาคผนวกส่วนที่ 10 — ภายในอายุคิด 100% ของราคาซื้อ เกินอายุไม่คิด</div>
      <div>5. <b>ซอฟต์แวร์ / License</b> ที่ได้รับ พนักงานต้องปฏิบัติตามข้อตกลงในภาคผนวกส่วนที่ 11 — ห้าม share, ห้ามติดตั้งบนเครื่องส่วนตัว, ต้องคืนเมื่อพ้นสภาพพนักงาน</div>
      <div>6. การสูญหายหรือเสียหายจากอุบัติเหตุ ต้องรายงาน IT ภายใน 24 ชั่วโมง</div>
      <div>7. อุปกรณ์เป็นทรัพย์สินของบริษัท ห้ามโอน ขาย ให้ยืมแก่บุคคลภายนอกโดยไม่ได้รับอนุญาต</div>
    </div>

    <!-- ── 9. ลายเซ็น 3 ฝ่าย ── -->
    ${sectionBar(9, 'ลายมือชื่อ 3 ฝ่าย (พนักงาน / IT / ผู้บังคับบัญชา)')}
    <table>
      <tr>
        <td style="border:1px solid #000;padding:10px 14px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">พนักงานผู้รับมอบ</div>
          <div style="border-bottom:1px solid #000;margin:28px 14px 5px"></div>
          <div style="font-size:11.5px;font-weight:700">( ${e(employee.fullName) || '.....................................'} )</div>
          <div style="font-size:11px;margin-top:5px">วันที่ .....................................</div>
        </td>
        <td style="border:1px solid #000;padding:10px 14px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">เจ้าหน้าที่ IT</div>
          <div style="border-bottom:1px solid #000;margin:28px 14px 5px"></div>
          <div style="font-size:11.5px;font-weight:700">( ..................................... )</div>
          <div style="font-size:11px;margin-top:5px">วันที่ .....................................</div>
        </td>
        <td style="border:1px solid #000;padding:10px 14px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">ผู้บังคับบัญชา</div>
          <div style="border-bottom:1px solid #000;margin:28px 14px 5px"></div>
          <div style="font-size:11.5px;font-weight:700">( ${e(employee.manager) || '.....................................'} )</div>
          <div style="font-size:11px;margin-top:5px">วันที่ .....................................</div>
        </td>
      </tr>
    </table>

  </div><!-- end page 3 (defects + photos + terms + signatures) -->

  ${renderAppendix({ employeeName: employee.fullName, docNo, thDate, companyInfo, formType: 'handover' })}

</body>
</html>`;

  printViaIframe(html);
}
