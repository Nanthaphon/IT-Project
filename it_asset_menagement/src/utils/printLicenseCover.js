/* ════════════════════════════════════════════════════════════════════════
   printLicenseCover — ใบคลุมต่ออายุโปรแกรม (PDF ผ่านกล่องพิมพ์ของเบราว์เซอร์)
   ใช้ตอนต่ออายุรายปี: 1 โปรแกรม = 1 หน้า A4 แนวตั้ง
     หัว: ชื่อโปรแกรม · Supplier · วันที่เริ่ม – วันหมดอายุ · จำนวน · ราคา
     ตาราง: ผู้ใช้งานแต่ละคน (แผนก · วันที่เริ่ม · วันหมดอายุ · ราคา)
   เลือกหลายโปรแกรม → มีหน้าสรุปรวมไว้ด้านหน้า (ปิดได้)
   ════════════════════════════════════════════════════════════════════════ */

import { printViaIframe } from './printViaIframe.js';
import { P } from './printTheme.js';
import { e, safeUrl } from './htmlEscape.js';
import { formatDateShort } from './formatDate.js';
import { getCompanyInfo } from './companyInfo.js';

const num = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(/[,฿\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const baht = (v) => {
  const n = num(v);
  return n == null ? '-' : `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;
};
const date = (v) => (v ? formatDateShort(v) : '-');

/* วันหมดอายุ → จำนวนวันที่เหลือ (null = ไม่มีวัน/อ่านไม่ได้) */
function daysLeft(value, asOf) {
  const s = formatDateShort(value);
  if (s === '-') return null;
  const [d, m, y] = s.split('/').map(Number);
  const t = new Date(asOf); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d) - t) / 86400000);
}
const daysLabel = (days) => days == null ? ''
  : days < 0 ? `หมดอายุแล้ว ${-days} วัน` : days === 0 ? 'หมดอายุวันนี้' : `อีก ${days} วัน`;

/** แถวผู้ใช้งานของ License 1 ตัว — ใช้ทั้งใบคลุมและหน้าต่างเลือก
 *  seat ผูกเครื่อง → ชื่อเครื่องเป็นหลัก ชื่อคนใช้เป็นบรรทัดรอง
 *  วันที่เริ่ม/หมดของ seat ไม่มี → ใช้วันของ License */
export function licenseSeatRows(lic, employees = []) {
  const byId = new Map();
  employees.forEach((x) => {
    if (x?.id) byId.set(String(x.id), x);
    if (x?.empId) byId.set(String(x.empId), x);
  });
  return (lic?.assignees || []).map((a) => {
    const emp = a.empId ? byId.get(String(a.empId)) : null;
    const person = a.empName || emp?.fullName || '';
    return {
      name: a.isAssetBound ? (a.assignedAssetName || 'ทรัพย์สิน') : (person || 'ไม่พบชื่อพนักงาน'),
      sub: a.isAssetBound ? (person ? `ผู้ใช้ ${person}` : 'ติดตั้งบนเครื่อง') : (a.seatLabel || ''),
      department: a.department || emp?.department || '',
      start: a.seatPurchaseDate || a.checkoutDate || lic.purchaseDate || '',
      expiry: a.seatExpirationDate || lic.expirationDate || '',
      cost: num(a.seatCost),
    };
  });
}

/* ราคาโปรแกรม: ใช้ราคาที่กรอกไว้ ถ้าไม่มีให้รวมราคารายคน */
function licenseTotal(lic, rows) {
  const c = num(lic.cost);
  if (c != null) return c;
  const seatCosts = rows.map((r) => r.cost).filter((x) => x != null);
  return seatCosts.length ? seatCosts.reduce((s, x) => s + x, 0) : null;
}

const CELL = `border:1px solid ${P.line};padding:6px 8px;vertical-align:top`;

function header(company, title, thDate) {
  return `
  <div class="head">
    <img src="${safeUrl(company.logoUrl)}" alt="" class="logo" />
    <div class="co">
      <div class="co-th">${e(company.nameTh)}</div>
      <div class="co-en">${company.nameEn.replace(/<br\/?>/g, ' ')}</div>
    </div>
    <div class="doc">
      <div class="doc-title">${e(title)}</div>
      <div class="doc-date">วันที่พิมพ์ ${e(thDate)}</div>
    </div>
  </div>`;
}

function signatures() {
  return `
  <div class="sign">
    ${['ผู้จัดทำ', 'ผู้ตรวจสอบ', 'ผู้อนุมัติ'].map((r) => `
      <div class="sign-box">
        <div class="sign-line"></div>
        <div>(.............................................)</div>
        <div class="sign-role">${r}</div>
        <div class="sign-date">วันที่ ......../......../............</div>
      </div>`).join('')}
  </div>`;
}

function programPage(lic, employees, ctx) {
  const rows = licenseSeatRows(lic, employees);
  const qty = Number(lic.quantity) || 0;
  const free = Math.max(0, qty - rows.length);
  const total = licenseTotal(lic, rows);
  const left = daysLeft(lic.expirationDate, ctx.asOf);

  const info = [
    ['ชื่อโปรแกรม', `<b>${e(lic.name) || '-'}</b>`],
    ['Supplier', e(lic.supplier) || '-'],
    ['วันที่เริ่มใช้งาน', date(lic.purchaseDate)],
    ['วันหมดอายุ', `${date(lic.expirationDate)}${left != null ? ` <span class="${left <= 30 ? 'warn' : 'muted'}">(${daysLabel(left)})</span>` : ''}`],
    ['จำนวน License', `${qty || rows.length} สิทธิ์ · ใช้งาน ${rows.length}${free ? ` · ว่าง ${free}` : ''}`],
    ['ราคาโปรแกรม', `<b>${baht(total)}</b>`],
  ];

  const body = rows.length ? rows.map((r, i) => `
      <tr>
        <td style="${CELL};text-align:center">${i + 1}</td>
        <td style="${CELL}">${e(r.name)}${r.sub ? `<div class="sub">${e(r.sub)}</div>` : ''}</td>
        <td style="${CELL}">${e(r.department) || '-'}</td>
        <td style="${CELL};text-align:center;white-space:nowrap">${date(r.start)}</td>
        <td style="${CELL};text-align:center;white-space:nowrap">${date(r.expiry)}</td>
        <td style="${CELL};text-align:right;white-space:nowrap">${baht(r.cost)}</td>
      </tr>`).join('')
    : `<tr><td colspan="6" style="${CELL};text-align:center;color:${P.muted};padding:16px">ยังไม่ได้จ่ายสิทธิ์ให้ผู้ใช้งาน</td></tr>`;

  return `
  <section class="page">
    ${header(ctx.company, 'ใบคลุมต่ออายุโปรแกรม', ctx.thDate)}
    <table class="info">
      ${info.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
    </table>
    ${lic.note ? `<div class="note"><b>หมายเหตุ</b> ${e(lic.note)}</div>` : ''}

    <div class="sec">รายชื่อผู้ใช้งาน (${rows.length} คน)</div>
    <table class="list">
      <thead><tr>
        <th style="width:6%">#</th>
        <th style="width:32%;text-align:left">ชื่อผู้ใช้งาน</th>
        <th style="width:22%;text-align:left">แผนก</th>
        <th style="width:13%">วันที่เริ่ม</th>
        <th style="width:13%">วันหมดอายุ</th>
        <th style="width:14%;text-align:right">ราคา</th>
      </tr></thead>
      <tbody>${body}</tbody>
    </table>
    ${free ? `<div class="free">สิทธิ์ที่ยังไม่ได้จ่าย ${free} สิทธิ์</div>` : ''}
    ${signatures()}
  </section>`;
}

function summaryPage(licenses, employees, ctx) {
  let grand = 0, hasGrand = false;
  const body = licenses.map((lic, i) => {
    const rows = licenseSeatRows(lic, employees);
    const total = licenseTotal(lic, rows);
    if (total != null) { grand += total; hasGrand = true; }
    return `
      <tr>
        <td style="${CELL};text-align:center">${i + 1}</td>
        <td style="${CELL}">${e(lic.name) || '-'}${lic.supplier ? `<div class="sub">${e(lic.supplier)}</div>` : ''}</td>
        <td style="${CELL};text-align:center">${rows.length}</td>
        <td style="${CELL};text-align:center;white-space:nowrap">${date(lic.purchaseDate)}</td>
        <td style="${CELL};text-align:center;white-space:nowrap">${date(lic.expirationDate)}</td>
        <td style="${CELL};text-align:right;white-space:nowrap">${baht(total)}</td>
      </tr>`;
  }).join('');
  return `
  <section class="page">
    ${header(ctx.company, 'สรุปรายการต่ออายุโปรแกรม', ctx.thDate)}
    <table class="list">
      <thead><tr>
        <th style="width:6%">#</th>
        <th style="width:38%;text-align:left">โปรแกรม</th>
        <th style="width:12%">ผู้ใช้งาน</th>
        <th style="width:14%">วันที่เริ่ม</th>
        <th style="width:14%">วันหมดอายุ</th>
        <th style="width:16%;text-align:right">ราคา</th>
      </tr></thead>
      <tbody>${body}</tbody>
      ${hasGrand ? `<tfoot><tr>
        <td colspan="5" style="${CELL};text-align:right"><b>รวมทั้งสิ้น ${licenses.length} โปรแกรม</b></td>
        <td style="${CELL};text-align:right;white-space:nowrap"><b>${baht(grand)}</b></td>
      </tr></tfoot>` : ''}
    </table>
    ${signatures()}
  </section>`;
}

/** ประกอบ HTML — แยกจากการสั่งพิมพ์ เพื่อเปิดดู/ทดสอบได้โดยไม่เปิดกล่องพิมพ์ */
export function buildLicenseCoverHtml({ licenses = [], employees = [], withSummary = licenses.length > 1, company = '', asOf = new Date() }) {
  const ctx = {
    asOf,
    company: getCompanyInfo(company),
    thDate: new Date(asOf).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
  const pages = [
    withSummary && licenses.length > 0 ? summaryPage(licenses, employees, ctx) : '',
    ...licenses.map((l) => programPage(l, employees, ctx)),
  ].join('');
  const title = licenses.length === 1 ? `ใบคลุมต่ออายุ ${licenses[0].name || ''}` : `ใบคลุมต่ออายุโปรแกรม ${licenses.length} รายการ`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${e(title.trim())}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 14mm 14mm 14mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; color: ${P.ink}; background: ${P.white};
      font-family: 'Sarabun', 'Leelawadee UI', 'Tahoma', sans-serif; font-size: 12px; line-height: 1.45;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .page { break-after: page; page-break-after: always; }
    .page:last-child { break-after: auto; page-break-after: auto; }
    .head { display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid ${P.brand}; padding-bottom: 10px; margin-bottom: 14px; }
    .logo { height: 42px; width: auto; object-fit: contain; }
    .co { flex: 1; min-width: 0; }
    .co-th { font-size: 13px; font-weight: 500; }
    .co-en { font-size: 10.5px; color: ${P.muted}; }
    .doc { text-align: right; }
    .doc-title { font-size: 17px; font-weight: 500; color: ${P.brand}; }
    .doc-date { font-size: 10.5px; color: ${P.muted}; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    table.info th, table.info td { border: 1px solid ${P.line}; padding: 7px 10px; text-align: left; vertical-align: top; }
    table.info th { width: 28%; background: ${P.surface}; color: ${P.inkSoft}; font-weight: 500; }
    .note { margin-top: 8px; font-size: 11.5px; color: ${P.inkSoft}; overflow-wrap: anywhere; }
    .sec { margin: 18px 0 6px; font-size: 13px; font-weight: 500; color: ${P.brand}; }
    table.list thead { display: table-header-group; }
    table.list th { background: ${P.brand}; color: ${P.white}; font-weight: 500; padding: 7px 8px; border: 1px solid ${P.brandDark}; text-align: center; }
    table.list td { overflow-wrap: anywhere; }
    table.list tbody tr { break-inside: avoid; }
    table.list tbody tr:nth-child(even) td { background: ${P.surface}; }
    .sub { font-size: 10.5px; color: ${P.muted}; }
    .muted { color: ${P.muted}; }
    .warn { color: #8F372F; }
    .free { margin-top: 6px; font-size: 11px; color: ${P.muted}; }
    .sign { display: flex; gap: 16px; margin-top: 36px; break-inside: avoid; }
    .sign-box { flex: 1; text-align: center; font-size: 11.5px; color: ${P.inkSoft}; }
    .sign-line { border-bottom: 1px dotted ${P.muted}; height: 34px; margin: 0 10px 6px; }
    .sign-role { margin-top: 2px; font-weight: 500; color: ${P.ink}; }
    .sign-date { margin-top: 4px; font-size: 10.5px; color: ${P.muted}; }
  </style>
</head>
<body>${pages || `<p style="color:${P.muted}">ไม่ได้เลือกโปรแกรม</p>`}</body>
</html>`;
}

export function printLicenseCover(opts) {
  printViaIframe(buildLicenseCoverHtml(opts), { cleanupDelay: 1500 });
}
