/* ════════════════════════════════════════════════════════════════════════
   printLicenseCover — ใบคลุมต่ออายุโปรแกรม (PDF ผ่านกล่องพิมพ์ของเบราว์เซอร์)
   1 รายการ = โปรแกรม 1 ตัว + ผู้ถือครอง 1 คน · เลือกหลายรายการ → อยู่หน้าเดียวกัน 2 คอลัมน์ (ประหยัดกระดาษ)
   ไม่มีช่องลายเซ็น (ผู้ใช้ไม่ต้องการ) · ขึ้นหน้าใหม่เฉพาะระหว่างรายการ ไม่ตัดกลางตาราง
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

function sheet(item) {
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
  <table class="info">
    ${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
  </table>`;
}

function header(ctx) {
  return `
  <div class="head">
    <img src="${safeUrl(ctx.company.logoUrl)}" alt="" class="logo" />
    <div class="co">
      <div class="co-th">${e(ctx.company.nameTh)}</div>
      <div class="co-en">${ctx.company.nameEn.replace(/<br\/?>/g, ' ')}</div>
    </div>
    <div class="doc">
      <div class="doc-title">ใบคลุมต่ออายุโปรแกรม</div>
      <div class="doc-date">วันที่พิมพ์ ${e(ctx.thDate)}${ctx.count > 1 ? ` · ${ctx.count} รายการ` : ''}</div>
    </div>
  </div>`;
}

/** ประกอบ HTML — items มาจาก licenseCoverItems() + { start, expiry } ที่ผู้ใช้กรอก (ISO หรือว่าง) */
export function buildLicenseCoverHtml({ items = [], company = '', asOf = new Date() }) {
  const ctx = {
    company: getCompanyInfo(company),
    count: items.length,
    thDate: new Date(asOf).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
  const title = items.length === 1
    ? `ใบคลุมต่ออายุ ${items[0].license?.name || ''}${items[0].holder ? ` - ${items[0].holder}` : ''}`
    : `ใบคลุมต่ออายุโปรแกรม ${items.length} รายการ`;

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
      font-family: 'Sarabun', 'Leelawadee UI', 'Tahoma', sans-serif; font-size: 13px; line-height: 1.45;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .head { display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid ${P.brand}; padding-bottom: 10px; margin-bottom: 16px; }
    .logo { height: 44px; width: auto; object-fit: contain; }
    .co { flex: 1; min-width: 0; }
    .co-th { font-size: 14px; font-weight: 500; }
    .co-en { font-size: 11px; color: ${P.muted}; }
    .doc { text-align: right; }
    .doc-title { font-size: 20px; font-weight: 500; color: ${P.brand}; }
    .doc-date { font-size: 11px; color: ${P.muted}; }
    .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 14px; align-items: start; }
    table.info { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
    table.info th, table.info td { border: 1px solid ${P.line}; padding: 7px 10px; text-align: left; vertical-align: middle; overflow-wrap: anywhere; }
    table.info th { width: 36%; background: ${P.surface}; color: ${P.inkSoft}; font-weight: 500; }
    table.info tr:first-child th, table.info tr:first-child td { background: ${P.brandPale}; }
    .sub { font-size: 12px; color: ${P.muted}; }
    .blank { display: inline-block; width: 55%; border-bottom: 1px dotted ${P.muted}; height: 1.1em; vertical-align: bottom; }
  </style>
</head>
<body>${items.length
  ? `${header(ctx)}<div class="grid" style="--cols:${items.length > 1 ? 2 : 1}">${items.map(sheet).join('')}</div>`
  : `<p style="color:${P.muted}">ไม่ได้เลือกรายการ</p>`}</body>
</html>`;
}

export function printLicenseCover(opts) {
  printViaIframe(buildLicenseCoverHtml(opts), { cleanupDelay: 1500 });
}
