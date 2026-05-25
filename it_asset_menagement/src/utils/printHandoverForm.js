/* ════════════════════════════════════════════════════════════════════════
   IT-FORM-001 — ใบส่งมอบทรัพย์สิน IT (Pre-Handover Asset Transfer Form)
   อ้างอิง IT-POL-LAP-001 Rev.01
   ════════════════════════════════════════════════════════════════════════ */

function getCompanyLogo(company) {
  if (!company) return '/gb_logo.webp';
  const c = String(company).toLowerCase();
  if (c.includes('best') || c.includes('hrm')) return '/besthrm_logo.webp';
  return '/gb_logo.webp';
}

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
      ['5.1', 'Battery Health',          'ความจุ ≥ 80% ของ Design Capacity'],
      ['5.2', 'ระบบระบายความร้อน',       'พัดลมทำงานปกติ ไม่ร้อนผิดปกติ'],
      ['5.3', 'Boot Time / ประสิทธิภาพ', 'Boot ภายใน 60 วินาที ไม่ค้าง/หน่วง'],
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
const DAMAGE_FEE_TABLE = [
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
  { group: 'แบตเตอรี่' },
  [15, 'Battery Health 60-79% (ก่อนครบอายุ)',  1500, 2000,  3000, 'ตรวจสอบด้วย Battery Report'],
  [16, 'Battery Health ต่ำกว่า 60% (ก่อนครบอายุ)', 2500, 3500, 5000, ''],
  { group: 'กรณีพิเศษ' },
  [17, 'น้ำเข้า — ซ่อมได้',                    3000, 5000,  8000, 'บวกค่าซ่อมจริง'],
  [18, 'น้ำเข้า — ซ่อมไม่ได้ / Motherboard เสีย', 'ราคาตลาด', 'ราคาตลาด', 'ราคาตลาด', 'ณ วันเกิดเหตุ'],
  [19, 'ทำหาย / สูญหาย',                       'ราคาตลาด', 'ราคาตลาด', 'ราคาตลาด', 'แจ้ง IT+ประกัน'],
  [20, 'ถูกโจรกรรม (มีใบแจ้งความ)',            '50% ราคาตลาด', '50% ราคาตลาด', '50% ราคาตลาด', 'ต้องมีใบแจ้งความ'],
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
  const logoUrl = getCompanyLogo(employee.company);
  const docNo = formNumber || `IT-FORM-001-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${(employee.empId || '').slice(-4)}`;

  /* ── Marker helpers (filled ✓ vs empty ☐) ── */
  const mark = (filled) => filled
    ? `<span style="display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;font-weight:700;color:#fff;background:#1E487A;border:1px solid #1E487A;border-radius:2px;font-size:10px">✓</span>`
    : `<span style="display:inline-block;width:14px;height:14px;border:1.2px solid #94a3b8;border-radius:2px"></span>`;

  /* ── Main computer in this handover (first asset, if any) ── */
  const mainAsset = empAssets[0] || {};

  /* ── ส่วน 3: ซอฟต์แวร์ ── */
  const softwareRows = empLicenses.map((l, i) => `
    <tr>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">${i + 1}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-size:11px">${l.name || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-size:11px">${l.supplier || l.vendor || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">${l.expirationDate ? new Date(l.expirationDate).toLocaleDateString('th-TH') : 'ไม่มีวันหมดอายุ'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-size:11px"></td>
    </tr>`).join('');

  /* ── ส่วน 4: อุปกรณ์เสริม ── */
  const accessoryRows = empAccessories.map((a, i) => `
    <tr>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">${i + 1}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;font-size:11px">${a.name || '-'}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 7px;text-align:center;font-size:11px">${a.sn || a.serialNumber || '-'}</td>
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
        <td colspan="7" style="border:1px solid #94a3b8;padding:4px 8px;font-size:11px;font-weight:700;color:#1E487A">${sec.title}</td>
        <td style="border:1px solid #94a3b8;padding:4px 8px;font-size:11px;font-weight:700;text-align:center;color:#1E487A">/${sec.max}</td>
      </tr>`;
    const itemRows = sec.items.map(([no, name, criteria]) => {
      const cell = assessment[no] || {};
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
    grandTotal += sectionScore;
    const subtotalRow = `
      <tr style="background:#f8fafc">
        <td colspan="6" style="border:1px solid #cbd5e1;padding:3px 8px;font-size:10px;text-align:right;font-style:italic;color:#475569">รวมหมวด</td>
        <td style="border:1px solid #cbd5e1;padding:3px;text-align:center;font-size:10.5px;color:#475569">${sec.max}</td>
        <td style="border:1px solid #cbd5e1;padding:3px;text-align:center;font-size:10.5px;font-weight:700;color:#1E487A">${sectionScore % 1 === 0 ? sectionScore : sectionScore.toFixed(2)}</td>
      </tr>`;
    return headerRow + itemRows + subtotalRow;
  }).join('');
  const grandTotalDisplay = grandTotal % 1 === 0 ? grandTotal : grandTotal.toFixed(2);

  /* ── Damage fee table (appendix s.5) ── */
  const feeRows = DAMAGE_FEE_TABLE.map(row => {
    if (row.group) {
      return `<tr style="background:#f1f5f9"><td colspan="6" style="border:1px solid #cbd5e1;padding:4px 8px;font-size:10.5px;font-weight:700;color:#1E487A">${row.group}</td></tr>`;
    }
    const [no, name, gen, data, gx, note] = row;
    const renderCell = (v) => typeof v === 'number' ? fmtTHB(v) : v;
    return `
      <tr>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;text-align:center;font-size:10px">${no}</td>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;font-size:10px">${name}</td>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;text-align:right;font-size:10px;font-variant-numeric:tabular-nums">${renderCell(gen)}</td>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;text-align:right;font-size:10px;font-variant-numeric:tabular-nums">${renderCell(data)}</td>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;text-align:right;font-size:10px;font-variant-numeric:tabular-nums">${renderCell(gx)}</td>
        <td style="border:1px solid #cbd5e1;padding:3px 6px;font-size:9.5px;color:#475569">${note || ''}</td>
      </tr>`;
  }).join('');

  /* ── Photo cell — render uploaded image or placeholder ── */
  const photoCell = (key, label) => {
    const src = photos[key];
    return `
    <td style="border:1px solid #cbd5e1;padding:6px;vertical-align:top;width:33.33%">
      <div style="font-size:10.5px;font-weight:700;color:#000;margin-bottom:4px;text-align:center">${label}</div>
      ${src
        ? `<div style="border:1px solid #cbd5e1;border-radius:4px;height:170px;overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center">
             <img src="${src}" alt="${label}" style="max-width:100%;max-height:100%;object-fit:contain"/>
           </div>`
        : `<div style="border:1.5px dashed #94a3b8;border-radius:4px;height:170px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:11px">[ แนบรูปภาพ ]</div>`
      }
    </td>`;
  };

  /* ── Section title bar ── */
  const sectionBar = (n, label) => `
    <div style="background:#1E487A;color:#fff;padding:5px 12px;font-size:11.5px;font-weight:700;margin:10px 0 5px;border-radius:3px">
      ${n}. ${label}
    </div>`;

  const appendixBar = (n, label) => `
    <div style="background:#475569;color:#fff;padding:5px 12px;font-size:11px;font-weight:700;margin:10px 0 5px;border-radius:3px">
      ส่วนที่ ${n} — ${label}
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
  <title>${docNo} - ใบส่งมอบทรัพย์สิน - ${employee.fullName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    html, body { height:auto; }
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
  <!--               หน้าที่ 1 — ฟอร์มหลัก                -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    <!-- Title strip -->
    <div style="text-align:center;margin-bottom:6px">
      <div style="font-size:11px;color:#475569;font-weight:600;letter-spacing:0.08em">${docNo}</div>
      <div style="font-size:18px;font-weight:700;color:#1E487A;line-height:1.2;margin-top:2px">ใบส่งมอบทรัพย์สิน IT</div>
      <div style="font-size:10.5px;color:#475569">Pre-Handover Asset Transfer Form</div>
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
          <div style="font-size:12px;font-weight:700;color:#000">ใบส่งมอบทรัพย์สิน IT</div>
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

    <!-- ── 2. ข้อมูลอุปกรณ์ ── -->
    ${sectionBar(2, 'ข้อมูลอุปกรณ์')}
    <div style="border:1px solid #cbd5e1;padding:8px 12px;border-radius:3px">
      <div style="display:grid;grid-template-columns:2fr 1.5fr 1fr;gap:4px 18px">
        ${ic('ชื่ออุปกรณ์', mainAsset.name || '')}
        ${ic('รุ่น / Model', mainAsset.model || '')}
        ${ic('Tier', mainAsset.tier || '')}
        ${ic('Asset Tag', mainAsset.assetTag || '')}
        ${ic('Serial Number', mainAsset.sn || '')}
        ${ic('มูลค่า (THB)', fmtTHB(mainAsset.cost))}
      </div>
    </div>

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
        ${softwareRows || `<tr><td colspan="5" style="border:1px solid #cbd5e1;padding:8px;text-align:center;color:#64748b;font-size:10.5px">ไม่มีซอฟต์แวร์ที่ผูกกับพนักงาน</td></tr>`}
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
        ${accessoryRows || `<tr><td colspan="5" style="border:1px solid #cbd5e1;padding:8px;text-align:center;color:#64748b;font-size:10.5px">ไม่มีอุปกรณ์เสริม</td></tr>`}
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
        <tr style="background:#1E487A;color:#fff">
          <td colspan="6" style="border:1px solid #1E487A;padding:7px 12px;font-size:13px;font-weight:700;text-align:right">รวมคะแนนทั้งหมด</td>
          <td style="border:1px solid #1E487A;padding:7px;text-align:center;font-size:13px;font-weight:700">100</td>
          <td style="border:1px solid #1E487A;padding:7px;text-align:center;font-size:13px;font-weight:700">${grandTotalDisplay}</td>
        </tr>
      </tbody>
    </table>

    <!-- ── 6. บันทึกตำหนิที่มีอยู่แล้ว ── -->
    ${sectionBar(6, 'บันทึกตำหนิที่มีอยู่แล้ว')}
    <div style="border:1px solid #cbd5e1;padding:8px 12px;border-radius:3px">
      <div style="font-size:11px;color:#475569;margin-bottom:4px">บันทึกตำหนิ / ความเสียหายที่มีอยู่แล้วก่อนส่งมอบ (ถ้าไม่มีให้ระบุ "ไม่มี")</div>
      <div style="font-size:11px;font-weight:600;margin-bottom:4px">บรรยาย:</div>
      ${defectsNote
        ? `<div style="font-size:11.5px;white-space:pre-wrap;line-height:1.7;padding:4px 0">${defectsNote.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`
        : `<div style="border-bottom:1px dotted #94a3b8;height:18px"></div>
           <div style="border-bottom:1px dotted #94a3b8;height:18px;margin-top:4px"></div>
           <div style="border-bottom:1px dotted #94a3b8;height:18px;margin-top:4px"></div>`
      }
    </div>

    <!-- ── 7. รูปภาพ 6 มุม ── -->
    ${sectionBar(7, 'รูปภาพสภาพอุปกรณ์ก่อนส่งมอบ')}
    <div style="font-size:10.5px;color:#475569;margin-bottom:4px">แนบรูปภาพ 6 มุม: ฝา / ฐาน / ซ้าย / ขวา / จอ+คีย์บอร์ด / ตำหนิเดิม</div>
    <table>
      <tr>${photoCell('topLid', 'ฝาด้านบน')}${photoCell('base', 'ฐานเครื่อง')}${photoCell('left', 'ด้านซ้าย')}</tr>
      <tr>${photoCell('right', 'ด้านขวา')}${photoCell('screenKeyboard', 'จอ + คีย์บอร์ด')}${photoCell('existingDefect', 'ตำหนิเดิม')}</tr>
    </table>

  </div><!-- end page 2 -->

  <!-- ════════════════════════════════════════════════ -->
  <!--          หน้าที่ 3 — เงื่อนไข + ลายเซ็น             -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    ${sectionBar(8, 'เงื่อนไขการรับมอบทรัพย์สิน')}
    <div style="border:1px solid #cbd5e1;padding:10px 14px;border-radius:3px;font-size:11.5px;line-height:1.85">
      <div style="font-weight:700;margin-bottom:4px">ข้อตกลงและเงื่อนไข</div>
      <div>1. พนักงานรับทราบและยืนยันว่าอุปกรณ์ที่รับมอบอยู่ในสภาพตามที่ระบุในเอกสารนี้</div>
      <div>2. พนักงานมีหน้าที่ดูแลรักษาอุปกรณ์ให้อยู่ในสภาพดีตลอดระยะเวลาการใช้งาน</div>
      <div>3. หากเกิดความเสียหายจากการใช้งานที่ผิดประเภทหรือความประมาท จะถูกหักค่าเสียหายตามตาราง IT-POL-LAP-001</div>
      <div>4. การสูญหายหรือเสียหายจากอุบัติเหตุ ต้องรายงาน IT ภายใน 24 ชั่วโมง</div>
      <div>5. อุปกรณ์เป็นทรัพย์สินของบริษัท ห้ามโอน ขาย ให้ยืมแก่บุคคลภายนอกโดยไม่ได้รับอนุญาต</div>
    </div>

    ${sectionBar(9, 'ลายมือชื่อ 3 ฝ่าย (พนักงาน / IT / ผู้บังคับบัญชา)')}
    <table>
      <tr>
        <td style="border:1px solid #000;padding:14px 16px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:6px">พนักงานผู้รับมอบ</div>
          <div style="border-bottom:1px solid #000;margin:40px 14px 8px"></div>
          <div style="font-size:11.5px;font-weight:700">( ${employee.fullName || '.....................................'} )</div>
          <div style="font-size:11px;margin-top:8px">วันที่ .....................................</div>
        </td>
        <td style="border:1px solid #000;padding:14px 16px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:6px">เจ้าหน้าที่ IT</div>
          <div style="border-bottom:1px solid #000;margin:40px 14px 8px"></div>
          <div style="font-size:11.5px;font-weight:700">( ..................................... )</div>
          <div style="font-size:11px;margin-top:8px">วันที่ .....................................</div>
        </td>
        <td style="border:1px solid #000;padding:14px 16px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:6px">ผู้บังคับบัญชา</div>
          <div style="border-bottom:1px solid #000;margin:40px 14px 8px"></div>
          <div style="font-size:11.5px;font-weight:700">( ${employee.manager || '.....................................'} )</div>
          <div style="font-size:11px;margin-top:8px">วันที่ .....................................</div>
        </td>
      </tr>
    </table>

  </div><!-- end page 3 -->

  <!-- ════════════════════════════════════════════════ -->
  <!--          ภาคผนวก — รายละเอียดแนบท้าย               -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">
    <div style="text-align:center;margin-bottom:8px;padding-top:6px">
      <div style="font-size:15px;font-weight:700;color:#1E487A">รายละเอียดแนบท้าย</div>
      <div style="font-size:11px;color:#475569">เอกสารส่งมอบและรับคืนทรัพย์สิน IT &nbsp;|&nbsp; IT-FORM-001 &amp; IT-FORM-002</div>
      <div style="font-size:10.5px;color:#475569">อ้างอิง: IT-POL-LAP-001 Rev.01 &nbsp;|&nbsp; บริษัท โกลบ ซินดิเคท (ประเทศไทย) จำกัด</div>
    </div>

    ${appendixBar(1, 'วัตถุประสงค์และขอบเขต')}
    <div style="border:1px solid #cbd5e1;padding:8px 12px;border-radius:3px;font-size:11px;line-height:1.7">
      เอกสารแนบท้ายฉบับนี้เป็นส่วนหนึ่งของ IT-FORM-001 (ใบส่งมอบทรัพย์สิน) และ IT-FORM-002 (ใบรับคืนทรัพย์สิน) มีผลบังคับใช้เมื่อพนักงานลงนามในเอกสารฉบับใดฉบับหนึ่ง รายละเอียดแนบท้ายนี้อธิบายเกณฑ์การประเมิน วิธีคำนวณค่าปรับ ข้อยกเว้น และขั้นตอนการโต้แย้งอย่างครบถ้วน เพื่อให้พนักงานทราบสิทธิ์และหน้าที่ของตนก่อนลงนาม
    </div>

    ${appendixBar(2, 'ประเภทและมูลค่าทรัพย์สิน (Tier Classification)')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">Tier</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">กลุ่มผู้ใช้</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">สเปคหลัก</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">RAM</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">SSD</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">GPU</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">มูลค่าอ้างอิง (THB)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700">General</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">HR / บัญชี / ทั่วไป / Sale</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Core i5 U-Series / Ryzen 5 U</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">16 GB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">512 GB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">Integrated</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:right;font-size:10.5px">~25,000</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700">Data</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">BD / Data Analytics</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Core i7 H-Series / Ryzen 7 H</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">32 GB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">1 TB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">Integrated</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:right;font-size:10.5px">30,000-40,000</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700">Graphic/DX</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">DX — 3D / Rendering</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Core i7/i9 HX / Ryzen 7/9 H</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">32-64 GB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">1 TB</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">RTX 4060/4070</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:right;font-size:10.5px">45,000-60,000</td></tr>
      </tbody>
    </table>

    ${appendixBar(3, 'เกณฑ์การให้คะแนนรายหมวด')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:38px">หมวด</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">รายการ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">เต็ม (ปกติ)</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">หัก 50%</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">0 คะแนน</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:42px">เต็ม</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">1</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">สภาพตัวเครื่อง</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ไม่มีรอย / ครบ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">รอยเล็กน้อย / บุบเล็กน้อย</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">แตก / บุบมาก / สติ๊กเกอร์หาย</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">20</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">2</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">จอภาพ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ไม่มีรอย Dead Pixel ≤3</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Dead Pixel 4-10 / Backlight</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">จอแตก / Dead Pixel &gt;10</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">20</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">3</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">คีย์บอร์ด/Touchpad</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ครบ / ตอบสนองปกติ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หัก 1-5 ปุ่ม / Touchpad ช้า</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หักหลายปุ่ม / Touchpad เสีย</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">15</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">4</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">OS/ซอฟต์แวร์</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Activated / ครบ / สะอาด</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Software บางตัวหาย / Update ค้าง</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ไม่ Activate / มี Malware</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">20</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">5</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ประสิทธิภาพ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Battery ≥80% Boot &lt;60s</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Battery 60-79% / Boot ช้า</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">Battery &lt;60% / ระบบค้าง</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">15</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">6</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">อุปกรณ์เสริม/พอร์ต</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">พอร์ตครบ / Charger ครบ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">พอร์ต 1 จุดเสีย / Charger หัก</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หลายพอร์ตเสีย / Charger หาย</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">10</td></tr>
      </tbody>
    </table>

    ${appendixBar(4, 'ระดับเกรดและผลที่ตามมา')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:45px">เกรด</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:75px">ช่วงคะแนน</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">สถานะ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">ค่าปรับ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">การดำเนินการ</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700;color:#16a34a">A</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">90 – 100</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ดีเยี่ยม</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ไม่มีค่าปรับ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">คืนอุปกรณ์และปิดเรื่องได้ทันที</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700;color:#2563eb">B</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">75 – 89</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ผ่าน (มีรอยเล็กน้อย)</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ตามความเสียหายจริง</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">IT ระบุรายการเสียหาย พร้อมใบประเมินราคาซ่อม</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700;color:#d97706">C</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">60 – 74</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ต้องซ่อม</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หักตามตารางค่าปรับ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">IT ส่งใบเสนอราคา / HR อนุมัติการหักเงิน</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px;font-weight:700;color:#dc2626">D</td><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">&lt; 60</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">เสียหายหนัก</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หักเต็มตามราคาตลาด</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ประชุม IT + HR + ผู้บังคับบัญชา ก่อนดำเนินการ</td></tr>
      </tbody>
    </table>

  </div><!-- end appendix 1 -->

  <!-- ════════════════════════════════════════════════ -->
  <!--          ภาคผนวก หน้า 2 — ค่าปรับ + ข้อยกเว้น        -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    ${appendixBar(5, 'ตารางค่าปรับความเสียหายฉบับเต็ม')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:38px">ลำดับ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">ประเภทความเสียหาย</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:80px">General<br/>~25K</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:80px">Data<br/>~35K</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:90px">Graphic/DX<br/>~55K</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:120px">หมายเหตุ</th>
        </tr>
      </thead>
      <tbody>${feeRows}</tbody>
    </table>
    <div style="font-size:9.5px;color:#475569;margin-top:4px">* ค่าปรับใช้ราคาในตารางเป็นขั้นต่ำ หากราคาซ่อมจริงสูงกว่าให้ใช้ราคาตามใบเสนอราคา</div>

    ${appendixBar(6, 'ข้อยกเว้นการหักค่าเสียหาย')}
    <div style="border:1px solid #cbd5e1;padding:8px 14px;border-radius:3px;font-size:10.5px;line-height:1.85">
      <div style="font-weight:700;margin-bottom:4px">รายการต่อไปนี้ได้รับการยกเว้นจากการหักค่าเสียหาย:</div>
      <div>1. การเสื่อมสภาพตามอายุการใช้งานปกติ เช่น สีซีดเล็กน้อยจากการใช้งาน รอยถูบนฐานเครื่องที่เกิดจากการวางบนโต๊ะ</div>
      <div>2. รอยแตกร้าวที่เกิดจากข้อบกพร่องของผู้ผลิต (Manufacturing Defect) โดยต้องผ่านการยืนยันจากศูนย์บริการ</div>
      <div>3. Battery Health ที่ลดลงตามอายุการใช้งานปกติ กรณีใช้งานเกิน 2 ปี ถือว่าปกติหากสูงกว่า 60%</div>
      <div>4. Dead Pixel ที่มีอยู่ตั้งแต่ก่อนส่งมอบ และถูกบันทึกไว้ในขา 1 (IT-FORM-001) ก่อนลงนาม</div>
      <div>5. ความเสียหายที่เกิดจากเหตุสุดวิสัย เช่น ภัยธรรมชาติ โดยต้องมีหลักฐานประกอบ</div>
      <div>6. การชำรุดเสียหายที่ผ่านการซ่อมโดย IT แผนกและมีบันทึกการซ่อมอยู่แล้ว</div>
    </div>

  </div><!-- end appendix 2 -->

  <!-- ════════════════════════════════════════════════ -->
  <!--          ภาคผนวก หน้า 3 — ขั้นตอน + ลายเซ็น         -->
  <!-- ════════════════════════════════════════════════ -->
  <div class="page">

    ${appendixBar(7, 'ขั้นตอนการโต้แย้งผลการประเมิน')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:50px">ขั้นตอน</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:170px">ผู้รับผิดชอบ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:120px">ระยะเวลา</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">รายละเอียด</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">1</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">พนักงาน</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ภายใน 3 วันทำการ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ยื่นคำร้องโต้แย้งเป็นลายลักษณ์อักษรต่อ IT Manager พร้อมหลักฐานภาพถ่าย</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">2</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">IT Manager</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ภายใน 5 วันทำการ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">รวบรวมหลักฐาน ภาพถ่ายจากทั้ง 2 ขา และให้ความเห็นเบื้องต้น</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;text-align:center;font-size:10.5px">3</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">HR + IT + ผู้บังคับบัญชา</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ภายใน 7 วันทำการ</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ประชุมตัดสินร่วม 3 ฝ่าย ผลการตัดสินถือเป็นที่สิ้นสุด</td></tr>
      </tbody>
    </table>

    ${appendixBar(8, 'ขั้นตอนกรณีออกพนักงาน / สิ้นสุดสัญญาจ้าง')}
    <table>
      <thead>
        <tr style="background:#e2e8f0">
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px;width:200px">ผู้รับผิดชอบ</th>
          <th style="border:1px solid #94a3b8;padding:5px 6px;font-size:10.5px">การดำเนินการ</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">พนักงาน / ผู้บังคับบัญชา</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">แจ้ง IT ล่วงหน้าอย่างน้อย 3 วันทำการก่อนวันสิ้นสุดสัญญาจ้าง เพื่อนัดหมายการรับคืนอุปกรณ์</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">เจ้าหน้าที่ IT</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">ดำเนินการประเมินสภาพตาม IT-FORM-002 พร้อมถ่ายภาพ และจัดทำสรุปค่าปรับ (ถ้ามี) ภายใน 1 วันทำการ</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">แผนกบุคคล (HR)</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">รับเอกสาร IT-FORM-002 จาก IT และลงนามรับทราบก่อนออกเอกสาร Clearance / คำนวณการหักเงิน</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">การเงิน</td><td style="border:1px solid #cbd5e1;padding:4px 6px;font-size:10.5px">หักค่าเสียหาย (ถ้ามี) จากเงินเดือนงวดสุดท้าย หรือเรียกเก็บตามข้อตกลง ภายใน 30 วัน</td></tr>
      </tbody>
    </table>

    ${appendixBar(9, 'การคำนวณค่าปรับตามอายุการใช้งาน')}
    <div style="border:1px solid #cbd5e1;padding:10px 14px;border-radius:3px;font-size:11px;line-height:1.85">
      <div style="font-weight:700;margin-bottom:4px">การคำนวณค่าปรับตามอายุการใช้งาน (Depreciation Policy)</div>
      <div>บริษัทกำหนดนโยบายค่าปรับตามอายุการใช้งานของอุปกรณ์ IT ดังนี้:</div>
      <div style="margin-top:6px;padding:6px 10px;background:#f8fafc;border-left:3px solid #1E487A">
        <div style="font-weight:600;margin-bottom:3px">General / Data / Graphic-DX : อายุอ้างอิง 3 ปีนับจากวันที่ลงนามรับมอบ</div>
        <div>• อายุ 0 - 1 ปี &nbsp;: คิดค่าปรับ <b>100%</b> ของตารางค่าปรับ</div>
        <div>• อายุ 1 - 2 ปี &nbsp;: คิดค่าปรับ <b>75%</b> ของตารางค่าปรับ</div>
        <div>• อายุ 2 - 3 ปี &nbsp;: คิดค่าปรับ <b>50%</b> ของตารางค่าปรับ</div>
        <div>• อายุเกิน 3 ปี : <b>ไม่คิดค่าปรับ</b>ทุกกรณี</div>
      </div>
      <div style="margin-top:6px">นโยบายนี้ครอบคลุมทุกกรณี ได้แก่ ความเสียหายทางกายภาพ การสูญหาย น้ำเข้า และการถูกโจรกรรม</div>
      <div style="font-size:10px;color:#475569;margin-top:4px">* อายุอุปกรณ์นับจากวันที่ IT-FORM-001 ลงนาม ถึงวันที่ IT-FORM-002 ลงนาม</div>
    </div>

    ${appendixBar(10, 'ลายมือชื่อรับทราบนโยบายและเงื่อนไข')}
    <table>
      <tr>
        <td style="border:1px solid #000;padding:14px 16px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">พนักงาน</div>
          <div style="font-size:10.5px;color:#475569;margin-bottom:6px">รับทราบและยอมรับเงื่อนไขทั้งหมด</div>
          <div style="border-bottom:1px solid #000;margin:34px 14px 6px"></div>
          <div style="font-size:11.5px;font-weight:700">( ${employee.fullName || '.....................................'} )</div>
          <div style="font-size:11px;margin-top:6px">วันที่ .....................................</div>
        </td>
        <td style="border:1px solid #000;padding:14px 16px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">เจ้าหน้าที่ IT (ตัวแทน)</div>
          <div style="font-size:10.5px;color:#475569;margin-bottom:6px">รับทราบและยอมรับเงื่อนไขทั้งหมด</div>
          <div style="border-bottom:1px solid #000;margin:34px 14px 6px"></div>
          <div style="font-size:11.5px;font-weight:700">( ..................................... )</div>
          <div style="font-size:11px;margin-top:6px">วันที่ .....................................</div>
        </td>
        <td style="border:1px solid #000;padding:14px 16px;width:33.33%;text-align:center;vertical-align:top">
          <div style="font-size:12px;font-weight:700;margin-bottom:3px">แผนกบุคคล (HR)</div>
          <div style="font-size:10.5px;color:#475569;margin-bottom:6px">รับทราบนโยบาย</div>
          <div style="border-bottom:1px solid #000;margin:34px 14px 6px"></div>
          <div style="font-size:11.5px;font-weight:700">( ..................................... )</div>
          <div style="font-size:11px;margin-top:6px">วันที่ .....................................</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;font-size:10px;color:#64748b;margin-top:12px">
      ออกโดยระบบ IT Asset Management &nbsp;·&nbsp; ${thDate} &nbsp;·&nbsp; ${docNo}
    </div>

  </div><!-- end appendix 3 -->

</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
}
