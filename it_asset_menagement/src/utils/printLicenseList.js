/* ════════════════════════════════════════════════════════════════════════
   printLicenseList — รายการโปรแกรม + ผู้ถือครองทั้งหมด แบบตาราง (PDF ผ่านกล่องพิมพ์)
   ติ๊กโปรแกรมในหน้า License (บางตัว / ทั้งหมด) → 1 แถวต่อผู้ถือครอง 1 คน
   คอลัมน์: โปรแกรม · Vendor · ผู้ถือครอง · แผนก · วันที่เริ่ม · วันหมดอายุ · ราคา · รวมราคาท้ายตาราง
   วันที่/ราคา: ค่าที่กรอกในหน้าต่างใบคลุมก่อน (it_report/license_cover) ไม่มีค่อยใช้ข้อมูลในระบบ
     เริ่ม = วันจ่าย seat → วันซื้อ · หมด = วันหมด seat → วันหมดโปรแกรม · ราคา = ราคา seat → ราคาโปรแกรม
   ════════════════════════════════════════════════════════════════════════ */

import { printViaIframe } from './printViaIframe.js';
import { P } from './printTheme.js';
import { e, safeUrl } from './htmlEscape.js';
import { formatDateShort } from './formatDate.js';
import { getCompanyInfo } from './companyInfo.js';
import { licenseCoverItems, num, baht } from './printLicenseCover.js';

const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th', { numeric: true });

/** แถวที่จะพิมพ์ — entries = ค่าที่กรอกในใบคลุม { [itemKey]: { start, expiry, cost } } */
export function licenseListRows(licenses = [], employees = [], entries = {}) {
  return licenseCoverItems([...licenses].sort(byName), employees).map((it) => {
    const saved = entries[it.key] || {};
    const lic = it.license || {};
    return {
      ...it,
      start: saved.start || it.seat?.checkoutDate || lic.purchaseDate || '',
      expiry: saved.expiry || it.seat?.seatExpirationDate || lic.expirationDate || '',
      cost: saved.cost !== undefined ? num(saved.cost) : it.cost,
    };
  });
}

export function buildLicenseListHtml({ rows = [], company = '', asOf = new Date() }) {
  const co = getCompanyInfo(company);
  const thDate = new Date(asOf).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const programs = new Set(rows.map((r) => r.licenseId)).size;
  const total = rows.reduce((s, r) => s + (r.cost || 0), 0);
  const d = (v) => (v ? e(formatDateShort(v)) : '-');

  const body = rows.map((r, i) => {
    const lic = r.license || {};
    const first = i === 0 || rows[i - 1].licenseId !== r.licenseId;   // แถวแรกของโปรแกรม → เส้นคั่นกลุ่ม
    return `
      <tr class="${first ? 'grp' : ''}">
        <td class="c">${i + 1}</td>
        <td><b>${e(lic.name) || '-'}</b></td>
        <td>${e(lic.supplier) || '-'}</td>
        <td>${r.holder ? `${e(r.holder)}${r.holderSub ? `<div class="sub">${e(r.holderSub)}</div>` : ''}` : '<span class="muted">ยังไม่มีผู้ถือครอง</span>'}</td>
        <td>${e(r.department) || '-'}</td>
        <td class="c">${d(r.start)}</td>
        <td class="c">${d(r.expiry)}</td>
        <td class="r">${baht(r.cost)}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>รายการโปรแกรมและผู้ถือครอง ${programs} โปรแกรม</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; color: ${P.ink}; background: ${P.white};
      font-family: 'Sarabun', 'Leelawadee UI', 'Tahoma', sans-serif; font-size: 12px; line-height: 1.4;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .head { display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid ${P.brand}; padding-bottom: 8px; margin-bottom: 12px; }
    .logo { height: 40px; width: auto; object-fit: contain; }
    .co { flex: 1; min-width: 0; }
    .co-th { font-size: 14px; font-weight: 500; }
    .co-en { font-size: 11px; color: ${P.muted}; }
    .doc { text-align: right; }
    .doc-title { font-size: 18px; font-weight: 500; color: ${P.brand}; }
    .doc-date { font-size: 11px; color: ${P.muted}; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid ${P.line}; padding: 5px 8px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    thead th { background: ${P.brandPale}; color: ${P.inkSoft}; font-weight: 500; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    tr.grp td { border-top: 1.5px solid ${P.inkSoft}; }
    tfoot td { background: ${P.surface}; font-weight: 500; }
    .c { text-align: center; } .r { text-align: right; white-space: nowrap; }
    .sub, .muted { font-size: 11px; color: ${P.muted}; }
  </style>
</head>
<body>
  <div class="head">
    <img src="${safeUrl(co.logoUrl)}" alt="" class="logo" />
    <div class="co">
      <div class="co-th">${e(co.nameTh)}</div>
      <div class="co-en">${co.nameEn.replace(/<br\/?>/g, ' ')}</div>
    </div>
    <div class="doc">
      <div class="doc-title">รายการโปรแกรมและผู้ถือครอง</div>
      <div class="doc-date">วันที่พิมพ์ ${e(thDate)} · ${programs} โปรแกรม · ${rows.length} รายการ</div>
    </div>
  </div>
  ${rows.length ? `
  <table>
    <colgroup>
      <col style="width:4%" /><col style="width:20%" /><col style="width:13%" /><col style="width:19%" />
      <col style="width:12%" /><col style="width:10%" /><col style="width:10%" /><col style="width:12%" />
    </colgroup>
    <thead>
      <tr><th class="c">#</th><th>ชื่อโปรแกรม</th><th>Vendor</th><th>ผู้ถือครอง</th><th>แผนก</th><th class="c">วันที่เริ่ม</th><th class="c">วันหมดอายุ</th><th class="r">ราคา</th></tr>
    </thead>
    <tbody>${body}</tbody>
    <tfoot>
      <tr><td colspan="7" class="r">รวม ${rows.length} รายการ</td><td class="r">${baht(total)}</td></tr>
    </tfoot>
  </table>` : `<p class="muted">ไม่ได้เลือกรายการ</p>`}
</body>
</html>`;
}

/** โหลดค่าที่กรอกในใบคลุม (โหลดไม่ได้ = ใช้ข้อมูลในระบบล้วน) แล้วเปิดกล่องพิมพ์ */
export async function printLicenseList({ licenses, employees, store, company } = {}) {
  const entries = store ? await store.load().catch(() => ({})) : {};
  printViaIframe(buildLicenseListHtml({ rows: licenseListRows(licenses, employees, entries), company }), { cleanupDelay: 1500 });
}
