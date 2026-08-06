/* ════════════════════════════════════════════════════════════════════════
   printAssetReport — รายงานทรัพย์สิน (PDF ผ่าน browser print dialog)
   🆕 รองรับ dynamic columns ตาม visibleColumns + auto-scale font
   ════════════════════════════════════════════════════════════════════════ */

import { printViaIframe } from './printViaIframe.js';
import { e } from './htmlEscape.js';
import { formatDateShort } from './formatDate.js';

const fmtTHB = (n) => (n || n === 0) ? `${Number(n).toLocaleString('th-TH')}` : '-';

/* ── ดึงรูปภาพประกอบ PDF (photoGallery) — เฉพาะ data:image ── */
const getGalleryPhotos = (a) => {
  const gallery = Array.isArray(a?.photoGallery) ? a.photoGallery : [];
  return gallery.filter(src => src && String(src).startsWith('data:image/'));
};

/* ── คำนวณอายุการใช้งาน ── */
const calcAge = (purchaseDate) => {
  if (!purchaseDate) return '-';
  const d = new Date(purchaseDate);
  if (isNaN(d.getTime())) return '-';
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0 && months === 0) return '< 1 ด.';
  if (years === 0) return `${months} ด.`;
  if (months === 0) return `${years} ปี`;
  return `${years} ปี ${months} ด.`;
};

/* ── Label สั้นสำหรับ PDF (ประหยัดความกว้างคอลัมน์ สถานะ) ── */
const STATUS_SHORT_LABEL = {
  'พร้อมใช้งาน':       'พร้อมใช้',
  'ถูกใช้งาน':         'ถูกใช้งาน',
  'ชำรุดเสียหาย':      'ชำรุด',
  'ไม่สามารถใช้งานได้':  'ใช้ไม่ได้',
  'สำรอง':             'สำรอง',
};

/* ── สถานะ → สีของ badge ── */
const statusBadge = (status, fontSize = 9.5) => {
  const s = status || 'พร้อมใช้งาน';
  const label = STATUS_SHORT_LABEL[s] || s;
  const colorMap = {
    'พร้อมใช้งาน':     { bg: '#dcfce7', fg: '#166534', border: '#86efac' },
    'ถูกใช้งาน':       { bg: '#dbeafe', fg: '#1e40af', border: '#93c5fd' },
    'ชำรุดเสียหาย':    { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
    'ไม่สามารถใช้งานได้': { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
    'สำรอง':           { bg: '#ede9fe', fg: '#5b21b6', border: '#c4b5fd' },
  };
  const c = colorMap[s] || { bg: '#f1f5f9', fg: '#475569', border: '#cbd5e1' };
  // ไม่ใช้ nowrap → ถ้าคอลัมน์แคบ ให้ข้อความ wrap ลง 2 บรรทัดได้ (ไม่ถูกตัดทิ้ง)
  return `<span style="display:inline-block;font-size:${fontSize}px;font-weight:600;padding:1px 5px;border-radius:3px;background:${c.bg};color:${c.fg};border:1px solid ${c.border};line-height:1.3;max-width:100%;overflow-wrap:anywhere">${e(label)}</span>`;
};

/* ════════════════════════════════════════════════════════════════════════
   Column metadata — flex = น้ำหนักความกว้าง (relative)
   ════════════════════════════════════════════════════════════════════════ */
const COLUMN_META = {
  name:          { label: 'ชื่อทรัพย์สิน', flex: 16, align: 'left',
                   render: (a) => `<div style="font-weight:700">${e(a.name) || '-'}</div>${a.model ? `<div style="font-size:0.9em;color:#64748b;margin-top:1px">${e(a.model)}</div>` : ''}` },
  type:          { label: 'ประเภท', flex: 8, align: 'left',
                   render: (a) => e(a.type) || '-' },
  forDepartment: { label: 'แผนก', flex: 9, align: 'left',
                   render: (a) => e(a.forDepartment) || e(a.department) || '-' },
  assetTag:      { label: 'รหัสทรัพย์สิน', flex: 9, align: 'left',
                   render: (a) => `<span style="font-family:'Courier New',monospace">${e(a.assetTag) || '-'}</span>` },
  sn:            { label: 'Serial Number', flex: 11, align: 'left',
                   render: (a) => `<span style="font-family:'Courier New',monospace">${e(a.sn) || '-'}</span>` },
  model:         { label: 'รุ่น', flex: 10, align: 'left',
                   render: (a) => e(a.model) || '-' },
  vendor:        { label: 'ผู้จัดจำหน่าย', flex: 10, align: 'left',
                   render: (a) => e(a.vendor) || '-' },
  company:       { label: 'บริษัท', flex: 10, align: 'left',
                   render: (a) => e(a.company) || '-' },
  purchaseDate:  { label: 'วันที่ซื้อ', flex: 9, align: 'center',
                   render: (a) => a.purchaseDate ? `<span style="white-space:nowrap">${e(formatDateShort(a.purchaseDate))}</span>` : '-' },
  warrantyDate:  { label: 'หมด Warranty', flex: 9, align: 'center',
                   render: (a) => a.warrantyDate ? `<span style="white-space:nowrap">${e(formatDateShort(a.warrantyDate))}</span>` : '-' },
  cost:          { label: 'ราคา', flex: 8, align: 'right',
                   render: (a) => a.cost ? `<span style="white-space:nowrap">฿${fmtTHB(a.cost)}</span>` : '-' },
  scrapValue:    { label: 'ราคาปัจจุบัน', flex: 9, align: 'right',
                   render: (a) => a.scrapValue ? `<span style="white-space:nowrap;color:#059669">฿${fmtTHB(a.scrapValue)}</span>` : '-' },
  assignedName:  { label: 'ผู้ครอบครอง', flex: 11, align: 'left',
                   render: (a) => e(a.assignedName) || '<span style="color:#94a3b8">-</span>' },
  note:          { label: 'หมายเหตุ', flex: 22, align: 'left',
                   render: (a) => e(a.note) || '<span style="color:#94a3b8">-</span>' },
  remark:        { label: 'Remark', flex: 22, align: 'left',
                   render: (a) => e(a.remark) || '<span style="color:#94a3b8">-</span>' },
  remark:        { label: 'Remark', flex: 22, align: 'left',
                   render: (a) => e(a.remark) || '<span style="color:#94a3b8">-</span>' },
  age:           { label: 'อายุการใช้งาน', flex: 8, align: 'center',
                   render: (a) => `<span style="white-space:nowrap">${e(calcAge(a.purchaseDate))}</span>` },
  status:        { label: 'สถานะ', flex: 9, align: 'center',
                   render: (a, ctx) => statusBadge(a.status, ctx.statusBadgeSize) },
};

/* ════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════════════════════════ */
export function printAssetReport({
  assets = [],
  visibleColumns = null,    // 🆕 ถ้าไม่ส่ง = ใช้ default (name, type, cost, status)
  filters = {},
  companyName = 'Globe Syndicate (Thailand) Co., Ltd.',
}) {
  const today = new Date();
  const thDate = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  /* ── เลือก columns ที่จะแสดง (สงวนลำดับตาม COLUMN_META) ── */
  const defaultVisible = { name: true, type: true, cost: true, status: true };
  const visibleMap = visibleColumns || defaultVisible;
  const selectedKeys = Object.keys(COLUMN_META).filter(k => visibleMap[k]);
  // ถ้าไม่เลือก column ใดเลย → fallback ขั้นต่ำ
  if (selectedKeys.length === 0) selectedKeys.push('name', 'type', 'status');

  const numCols = selectedKeys.length;

  /* ── Auto-scale font ตามจำนวน column ── */
  // คอลัมน์น้อย = อ่านสบาย (font 11-12px) / คอลัมน์เยอะ = ย่อลง (font 8-9px)
  let bodyFontSize, headerFontSize, padding, statusBadgeSize;
  if (numCols <= 4)       { bodyFontSize = 11.5; headerFontSize = 11.5; padding = '6px 8px'; statusBadgeSize = 10; }
  else if (numCols <= 6)  { bodyFontSize = 10.5; headerFontSize = 11;   padding = '5px 7px'; statusBadgeSize = 9; }
  else if (numCols <= 8)  { bodyFontSize = 9.5;  headerFontSize = 10;   padding = '4px 6px'; statusBadgeSize = 8.5; }
  else if (numCols <= 10) { bodyFontSize = 8.5;  headerFontSize = 9.5;  padding = '3px 5px'; statusBadgeSize = 8; }
  else                    { bodyFontSize = 8;    headerFontSize = 9;    padding = '3px 4px'; statusBadgeSize = 7.5; }

  const ctx = { statusBadgeSize };

  /* ── คำนวณ column width (อัตราส่วน flex) ── */
  // มีคอลัมน์ "#" คงที่ + คอลัมน์ "รูปภาพประกอบ" (เฉพาะเมื่อมีรูปอย่างน้อย 1 รายการ)
  const hasAnyPhoto = assets.some(a => getGalleryPhotos(a).length > 0);
  const noColWidthPct  = 3.5;
  const imgColWidthPct = hasAnyPhoto ? 20 : 0;
  const dataColTotalPct = 100 - noColWidthPct - imgColWidthPct;
  const totalFlex = selectedKeys.reduce((sum, k) => sum + COLUMN_META[k].flex, 0);
  const colWidths = selectedKeys.map(k => (COLUMN_META[k].flex / totalFlex) * dataColTotalPct);
  const thumbSize = numCols <= 6 ? 60 : numCols <= 8 ? 48 : 40;

  /* ── สรุปสถิติด้านบน ── */
  const total       = assets.length;
  const inUse       = assets.filter(a => (a.status || 'พร้อมใช้งาน') === 'ถูกใช้งาน').length;
  const available   = assets.filter(a => (a.status || 'พร้อมใช้งาน') === 'พร้อมใช้งาน').length;
  const broken      = assets.filter(a => (a.status || 'พร้อมใช้งาน') === 'ชำรุดเสียหาย').length;

  /* ── filter chips ── */
  const filterChips = [];
  if (filters.type && filters.type !== 'ทั้งหมด')             filterChips.push(`ประเภท: ${filters.type}`);
  if (filters.status && filters.status !== 'ทั้งหมด')         filterChips.push(`สถานะ: ${filters.status}`);
  if (filters.department && filters.department !== 'ทั้งหมด') filterChips.push(`แผนก: ${filters.department}`);
  const filterText = filterChips.length > 0
    ? `<div style="font-size:10.5px;color:#64748b;margin-top:3px">กรอง: ${filterChips.map(c => `<span style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;padding:1px 6px;border-radius:3px;margin-right:3px">${e(c)}</span>`).join('')}</div>`
    : '';

  /* ── Header columns (HTML) ── */
  const headerCells = `
    <th style="text-align:center;width:${noColWidthPct}%">#</th>
    ${selectedKeys.map((k, i) => `
      <th style="text-align:${COLUMN_META[k].align};width:${colWidths[i].toFixed(2)}%">${e(COLUMN_META[k].label)}</th>
    `).join('')}
    ${hasAnyPhoto ? `<th style="text-align:center;width:${imgColWidthPct}%">รูปภาพประกอบ</th>` : ''}
  `;

  /* ── Body rows ── */
  const rows = assets.map((a, idx) => {
    const cells = selectedKeys.map(k => {
      const col = COLUMN_META[k];
      return `<td style="border:1px solid #cbd5e1;padding:${padding};font-size:${bodyFontSize}px;vertical-align:top;text-align:${col.align};overflow:hidden;overflow-wrap:anywhere;word-break:break-word;line-height:1.35">${col.render(a, ctx)}</td>`;
    }).join('');

    // คอลัมน์รูปภาพประกอบ — thumbnail เรียงในเซลล์เดียวกับข้อมูล
    let imgCell = '';
    if (hasAnyPhoto) {
      const photos = getGalleryPhotos(a);
      const thumbs = photos.length > 0
        ? `<div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center">
             ${photos.map(src => `<img src="${src}" alt="" style="height:${thumbSize}px;width:${thumbSize}px;object-fit:cover;border:1px solid #cbd5e1;border-radius:3px" />`).join('')}
           </div>`
        : `<span style="color:#cbd5e1;font-size:${bodyFontSize}px">–</span>`;
      imgCell = `<td style="border:1px solid #cbd5e1;padding:${padding};text-align:center;vertical-align:middle">${thumbs}</td>`;
    }

    return `
      <tr style="break-inside:avoid">
        <td style="border:1px solid #cbd5e1;padding:${padding};text-align:center;font-size:${bodyFontSize}px;vertical-align:top;overflow:hidden">${idx + 1}</td>
        ${cells}
        ${imgCell}
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>รายงานทรัพย์สิน — ${thDate}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 8mm 12mm 8mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Sarabun', 'Leelawadee UI', 'Tahoma', sans-serif;
      color: #0f172a;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-header {
      border-bottom: 2px solid #1E487A;
      padding-bottom: 7px;
      margin-bottom: 10px;
    }
    .page-header h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #1E487A;
    }
    .page-header .sub {
      font-size: 10.5px;
      color: #475569;
      margin-top: 2px;
    }
    .stats {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    }
    .stats .box {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 5px 8px;
      background: #f8fafc;
    }
    .stats .box .num {
      font-size: 16px;
      font-weight: 700;
      color: #1E487A;
      line-height: 1.1;
    }
    .stats .box .lbl {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 1px;
    }
    table.report {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    table.report thead {
      display: table-header-group;
    }
    table.report th {
      background: #1E487A;
      color: #fff;
      font-size: ${headerFontSize}px;
      font-weight: 600;
      padding: 6px 7px;
      border: 1px solid #163963;
      overflow: hidden;
      overflow-wrap: anywhere;
    }
    table.report td {
      overflow: hidden;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    table.report tr:nth-child(even) td {
      background: #f8fafc;
    }
    table.report img { display: block; }
    .footer-note {
      margin-top: 10px;
      font-size: 9px;
      color: #64748b;
      text-align: center;
    }
    .col-info {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="page-header">
    <h1>${e(companyName)}</h1>
    <div class="sub">รายงานทรัพย์สิน · พิมพ์เมื่อ ${e(thDate)}</div>
    ${filterText}
    <div class="col-info">แสดง ${numCols} คอลัมน์ · ทั้งหมด ${total} รายการ</div>
  </div>

  <div class="stats">
    <div class="box"><div class="num">${total}</div><div class="lbl">ทรัพย์สินทั้งหมด</div></div>
    <div class="box"><div class="num">${available}</div><div class="lbl">พร้อมใช้งาน</div></div>
    <div class="box"><div class="num">${inUse}</div><div class="lbl">ถูกใช้งาน</div></div>
    <div class="box"><div class="num">${broken}</div><div class="lbl">ชำรุด</div></div>
  </div>

  <table class="report">
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${rows || `<tr><td colspan="${numCols + 1 + (hasAnyPhoto ? 1 : 0)}" style="border:1px solid #cbd5e1;padding:20px;text-align:center;color:#94a3b8">ไม่มีข้อมูลทรัพย์สินตรงกับการกรอง</td></tr>`}</tbody>
  </table>

  <div class="footer-note">
    เอกสารนี้สร้างโดยระบบ IT Asset Management — ${e(thDate)}
  </div>
</body>
</html>`;

  printViaIframe(html, { cleanupDelay: 1500 });
}
