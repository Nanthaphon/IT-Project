/* ════════════════════════════════════════════════════════════════════════
   printLicenseCover — ใบคลุมต่ออายุโปรแกรม (PDF ผ่านกล่องพิมพ์ของเบราว์เซอร์)
   1 ใบ = โปรแกรม 1 ตัว + ผู้ถือครอง 1 คน (A4 แนวตั้ง)
   ดึงจากระบบ: ชื่อโปรแกรม · Supplier · ผู้ถือครอง · แผนก · ราคา
   วันที่เริ่ม / วันหมดอายุ: ผู้ใช้กรอกเองในหน้าต่างก่อนพิมพ์ — เว้นว่าง = พิมพ์เป็นเส้นจุดไว้เขียนมือ
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
const baht = (n) => (n == null ? '-' : `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`);
const BLANK = '<span class="blank"></span>';

/** รายการที่เลือกพิมพ์ได้ — 1 แถวต่อผู้ถือครอง 1 คน
 *  โปรแกรมที่ยังไม่จ่ายให้ใคร = 1 แถว (ไม่มีชื่อผู้ถือครอง)
 *  seat ผูกเครื่อง → ชื่อเครื่องเป็นหลัก ชื่อคนใช้เป็นบรรทัดรอง
 *  ราคา: ราคารายคนก่อน ไม่มีค่อยใช้ราคาโปรแกรม */
export function licenseCoverItems(licenses = [], employees = []) {
  const byId = new Map();
  employees.forEach((x) => {
    if (x?.id) byId.set(String(x.id), x);
    if (x?.empId) byId.set(String(x.empId), x);
  });
  const out = [];
  licenses.forEach((lic) => {
    const seats = lic.assignees || [];
    if (seats.length === 0) {
      out.push({ key: `${lic.id}::-`, licenseId: lic.id, license: lic, holder: '', holderSub: '', department: '', cost: num(lic.cost) });
      return;
    }
    seats.forEach((a, i) => {
      const emp = a.empId ? byId.get(String(a.empId)) : null;
      const person = a.empName || emp?.fullName || '';
      out.push({
        key: `${lic.id}::${a.checkoutId || i}`,
        licenseId: lic.id,
        license: lic,
        holder: a.isAssetBound ? (a.assignedAssetName || 'ทรัพย์สิน') : (person || 'ไม่พบชื่อพนักงาน'),
        holderSub: a.isAssetBound ? (person ? `ผู้ใช้ ${person}` : 'ติดตั้งบนเครื่อง') : '',
        department: a.department || emp?.department || '',
        cost: num(a.seatCost) ?? num(lic.cost),
      });
    });
  });
  return out;
}

function sheet(item, ctx) {
  const lic = item.license || {};
  const d = (v) => (v ? e(formatDateShort(v)) : BLANK);
  const rows = [
    ['ชื่อโปรแกรม', `<b>${e(lic.name) || '-'}</b>`],
    ['Supplier', e(lic.supplier) || '-'],
    ['ผู้ถือครอง', item.holder ? `${e(item.holder)}${item.holderSub ? `<div class="sub">${e(item.holderSub)}</div>` : ''}` : BLANK],
    ['แผนก', e(item.department) || (item.holder ? '-' : BLANK)],
    ['วันที่เริ่มใช้งาน', d(item.start)],
    ['วันหมดอายุ', d(item.expiry)],
    ['ราคา', `<b>${baht(item.cost)}</b>`],
  ];
  return `
  <section class="page">
    <div class="head">
      <img src="${safeUrl(ctx.company.logoUrl)}" alt="" class="logo" />
      <div class="co">
        <div class="co-th">${e(ctx.company.nameTh)}</div>
        <div class="co-en">${ctx.company.nameEn.replace(/<br\/?>/g, ' ')}</div>
      </div>
      <div class="doc">
        <div class="doc-title">ใบคลุมต่ออายุโปรแกรม</div>
        <div class="doc-date">วันที่พิมพ์ ${e(ctx.thDate)}</div>
      </div>
    </div>
    <table class="info">
      ${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
    </table>
    <div class="sign">
      ${['ผู้จัดทำ', 'ผู้ตรวจสอบ', 'ผู้อนุมัติ'].map((r) => `
        <div class="sign-box">
          <div class="sign-line"></div>
          <div>(.............................................)</div>
          <div class="sign-role">${r}</div>
          <div class="sign-date">วันที่ ......../......../............</div>
        </div>`).join('')}
    </div>
  </section>`;
}

/** ประกอบ HTML — items มาจาก licenseCoverItems() + { start, expiry } ที่ผู้ใช้กรอก (ISO หรือว่าง) */
export function buildLicenseCoverHtml({ items = [], company = '', asOf = new Date() }) {
  const ctx = {
    company: getCompanyInfo(company),
    thDate: new Date(asOf).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
  const title = items.length === 1
    ? `ใบคลุมต่ออายุ ${items[0].license?.name || ''}${items[0].holder ? ` - ${items[0].holder}` : ''}`
    : `ใบคลุมต่ออายุโปรแกรม ${items.length} ใบ`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${e(title.trim())}</title>
  <style>
    @page { size: A4 portrait; margin: 16mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; color: ${P.ink}; background: ${P.white};
      font-family: 'Sarabun', 'Leelawadee UI', 'Tahoma', sans-serif; font-size: 14px; line-height: 1.5;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .page { break-after: page; page-break-after: always; }
    .page:last-child { break-after: auto; page-break-after: auto; }
    .head { display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid ${P.brand}; padding-bottom: 10px; margin-bottom: 22px; }
    .logo { height: 44px; width: auto; object-fit: contain; }
    .co { flex: 1; min-width: 0; }
    .co-th { font-size: 14px; font-weight: 500; }
    .co-en { font-size: 11px; color: ${P.muted}; }
    .doc { text-align: right; }
    .doc-title { font-size: 20px; font-weight: 500; color: ${P.brand}; }
    .doc-date { font-size: 11px; color: ${P.muted}; }
    table.info { width: 100%; border-collapse: collapse; table-layout: fixed; }
    table.info th, table.info td { border: 1px solid ${P.line}; padding: 11px 14px; text-align: left; vertical-align: middle; overflow-wrap: anywhere; }
    table.info th { width: 30%; background: ${P.surface}; color: ${P.inkSoft}; font-weight: 500; }
    .sub { font-size: 12px; color: ${P.muted}; }
    .blank { display: inline-block; width: 55%; border-bottom: 1px dotted ${P.muted}; height: 1.1em; vertical-align: bottom; }
    .sign { display: flex; gap: 16px; margin-top: 56px; break-inside: avoid; }
    .sign-box { flex: 1; text-align: center; font-size: 12px; color: ${P.inkSoft}; }
    .sign-line { border-bottom: 1px dotted ${P.muted}; height: 36px; margin: 0 10px 6px; }
    .sign-role { margin-top: 2px; font-weight: 500; color: ${P.ink}; }
    .sign-date { margin-top: 4px; font-size: 11px; color: ${P.muted}; }
  </style>
</head>
<body>${items.map((it) => sheet(it, ctx)).join('') || `<p style="color:${P.muted}">ไม่ได้เลือกรายการ</p>`}</body>
</html>`;
}

export function printLicenseCover(opts) {
  printViaIframe(buildLicenseCoverHtml(opts), { cleanupDelay: 1500 });
}
