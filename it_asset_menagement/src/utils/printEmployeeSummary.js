/* ════════════════════════════════════════════════════════════════════════
   printEmployeeSummary — สรุปข้อมูลพนักงาน + รายการครอบครอง (PDF)
   ════════════════════════════════════════════════════════════════════════ */

import { printViaIframe } from './printViaIframe.js';
import { e } from './htmlEscape.js';
import { formatDateShort } from './formatDate.js';

const sanitize = (s) => String(s || '').replace(/[\\/:*?"<>|]/g, '_').trim();

const fmtTHB = (n) => (n || n === 0) ? `${Number(n).toLocaleString('th-TH')}` : '-';

/* ── Field row helper ── */
const field = (label, value) => `
  <div style="flex:1;min-width:160px">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">${e(label)}</div>
    <div style="font-size:13px;color:#0f172a;font-weight:500">${value || '<span style="color:#cbd5e1">—</span>'}</div>
  </div>`;

const sectionTitle = (title) => `
  <div style="font-size:11px;font-weight:700;color:#1E487A;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #1E487A;padding-bottom:4px;margin-bottom:10px">${e(title)}</div>`;

export function printEmployeeSummary({
  employee,
  empAssets = [],
  empLicenses = [],
  empAccessories = [],
  companyName = 'Globe Syndicate (Thailand) Co., Ltd.',
}) {
  if (!employee) return;
  const today = new Date();
  const thDate = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const thTime = today.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  // 🆕 ชื่อไฟล์ = "ชื่อพนักงาน_รหัส"
  const namePart = sanitize(employee.fullName) || 'พนักงาน';
  const empIdPart = sanitize(employee.empId);
  const fileTitle = empIdPart ? `${namePart}_${empIdPart}` : namePart;

  /* ── ข้อมูลพนักงาน ── */
  const profileSection = `
    <div style="display:flex;gap:16px;margin-bottom:16px;align-items:flex-start">
      <div style="width:64px;height:64px;border-radius:8px;background:#1E487A;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:28px;flex-shrink:0">
        ${e((employee.fullName || '?').charAt(0))}
      </div>
      <div style="flex:1">
        <div style="font-size:20px;font-weight:700;color:#0f172a">
          ${e(employee.fullName) || '-'}
          ${employee.nickname ? `<span style="font-weight:400;color:#64748b;font-size:16px"> (${e(employee.nickname)})</span>` : ''}
        </div>
        <div style="font-size:13px;color:#475569;margin-top:2px">${e(employee.position) || '-'}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;font-size:11px;color:#64748b">
          <span style="font-family:'Courier New',monospace;font-weight:600;color:#1E487A">${e(employee.empId) || '-'}</span>
          ${employee.department ? `<span>·</span><span>${e(employee.department)}</span>` : ''}
          ${employee.company ? `<span>·</span><span>${e(employee.company)}</span>` : ''}
        </div>
      </div>
    </div>`;

  const infoSection = `
    <div style="margin-bottom:14px">
      ${sectionTitle('ข้อมูลพนักงาน')}
      <div style="display:flex;flex-wrap:wrap;gap:14px 24px">
        ${field('ชื่อ-นามสกุล (TH)', e(employee.fullName))}
        ${field('ชื่อ-นามสกุล (EN)', e(employee.fullNameEng))}
        ${field('ชื่อเล่น', e(employee.nickname))}
        ${field('รหัสพนักงาน', employee.empId ? `<span style="font-family:'Courier New',monospace">${e(employee.empId)}</span>` : '')}
        ${field('ตำแหน่ง', e(employee.position))}
        ${field('แผนก', e(employee.department))}
        ${field('บริษัท', e(employee.company))}
        ${field('หัวหน้างาน', e(employee.manager))}
        ${field('เบอร์โทรศัพท์', e(employee.phone))}
        ${field('อีเมล Microsoft 365', e(employee.m365Email))}
        ${field('รหัสผ่าน Microsoft 365', employee.m365Password ? `<span style="font-family:'Courier New',monospace">${e(employee.m365Password)}</span>` : '')}
        ${field('วันที่เริ่มงาน', employee.startDate ? e(formatDateShort(employee.startDate)) : '')}
      </div>
    </div>`;

  /* ── ตารางการครอบครอง ── */
  const tableRow = (no, name, type, ref, status) => `
    <tr style="break-inside:avoid">
      <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;font-size:11.5px;vertical-align:top">${no}</td>
      <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11.5px;vertical-align:top;font-weight:600">${name}</td>
      <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;font-size:11px;vertical-align:top">
        <span style="display:inline-block;font-size:10px;font-weight:600;padding:2px 7px;border-radius:3px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0">${type}</span>
      </td>
      <td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:10.5px;font-family:'Courier New',monospace;vertical-align:top">${ref || '<span style="color:#cbd5e1">—</span>'}</td>
      <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;font-size:10.5px;vertical-align:top;color:#64748b">${status || '—'}</td>
    </tr>`;

  const buildAssetRows = (assets) => assets.map((a, i) =>
    tableRow(
      i + 1,
      e(a.name),
      'ทรัพย์สิน',
      [a.assetTag, a.sn].filter(Boolean).map(e).join(' · '),
      e(a.status || 'ถูกใช้งาน'),
    )).join('');

  const buildLicenseRows = (licenses, startIdx) => licenses.map((l, i) =>
    tableRow(
      startIdx + i,
      e(l.name),
      'License',
      '',   // 🆕 ไม่แสดง productKey ในตาราง (กันรหัส/อีเมล admin หลุด)
      'ใช้งาน',
    )).join('');

  const buildAccessoryRows = (accs, startIdx) => accs.map((a, i) =>
    tableRow(
      startIdx + i,
      e(a.name),
      'อุปกรณ์เสริม',
      e(a.sn) || '',
      'ใช้งาน',
    )).join('');

  const total = empAssets.length + empLicenses.length + empAccessories.length;

  const holdingsSection = `
    <div style="margin-bottom:14px">
      ${sectionTitle(`รายการที่ครอบครอง (${total} รายการ)`)}
      ${total === 0
        ? `<div style="text-align:center;padding:20px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:6px;color:#94a3b8;font-size:12px">— ไม่มีรายการครอบครอง —</div>`
        : `<table style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th style="background:#1E487A;color:#fff;font-size:11px;font-weight:600;padding:7px 8px;border:1px solid #163963;text-align:center;width:5%">#</th>
                <th style="background:#1E487A;color:#fff;font-size:11px;font-weight:600;padding:7px 8px;border:1px solid #163963;text-align:left">ชื่อรายการ</th>
                <th style="background:#1E487A;color:#fff;font-size:11px;font-weight:600;padding:7px 8px;border:1px solid #163963;text-align:center;width:14%">ประเภท</th>
                <th style="background:#1E487A;color:#fff;font-size:11px;font-weight:600;padding:7px 8px;border:1px solid #163963;text-align:left;width:32%">รหัสอ้างอิง / SN</th>
                <th style="background:#1E487A;color:#fff;font-size:11px;font-weight:600;padding:7px 8px;border:1px solid #163963;text-align:center;width:14%">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${buildAssetRows(empAssets)}
              ${buildLicenseRows(empLicenses, empAssets.length + 1)}
              ${buildAccessoryRows(empAccessories, empAssets.length + empLicenses.length + 1)}
            </tbody>
          </table>`
      }
    </div>`;

  /* ── สรุปจำนวน ── */
  const summaryBoxes = `
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <div style="flex:1;border:1px solid #cbd5e1;border-radius:5px;padding:8px 12px;background:#f8fafc">
        <div style="font-size:18px;font-weight:700;color:#1E487A;line-height:1.1">${empAssets.length}</div>
        <div style="font-size:10.5px;color:#64748b;margin-top:1px">ทรัพย์สิน</div>
      </div>
      <div style="flex:1;border:1px solid #cbd5e1;border-radius:5px;padding:8px 12px;background:#f8fafc">
        <div style="font-size:18px;font-weight:700;color:#1E487A;line-height:1.1">${empLicenses.length}</div>
        <div style="font-size:10.5px;color:#64748b;margin-top:1px">License</div>
      </div>
      <div style="flex:1;border:1px solid #cbd5e1;border-radius:5px;padding:8px 12px;background:#f8fafc">
        <div style="font-size:18px;font-weight:700;color:#1E487A;line-height:1.1">${empAccessories.length}</div>
        <div style="font-size:10.5px;color:#64748b;margin-top:1px">อุปกรณ์เสริม</div>
      </div>
      <div style="flex:1;border:1px solid #cbd5e1;border-radius:5px;padding:8px 12px;background:#f8fafc">
        <div style="font-size:18px;font-weight:700;color:#1E487A;line-height:1.1">${total}</div>
        <div style="font-size:10.5px;color:#64748b;margin-top:1px">รวมทั้งหมด</div>
      </div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${e(fileTitle)}</title>
  <style>
    @page { size: A4; margin: 15mm 12mm 15mm 12mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: 'Sarabun', 'Leelawadee UI', 'Tahoma', sans-serif;
      color: #0f172a;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 12px;
      line-height: 1.4;
    }
    .page-header {
      border-bottom: 2px solid #1E487A;
      padding-bottom: 8px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .page-header .company {
      font-size: 14px;
      font-weight: 700;
      color: #1E487A;
    }
    .page-header .title {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .page-header .meta {
      font-size: 10px;
      color: #94a3b8;
      text-align: right;
    }
    .footer-note {
      margin-top: 18px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 9.5px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="page-header">
    <div>
      <div class="company">${e(companyName)}</div>
      <div class="title">สรุปข้อมูลพนักงาน &amp; รายการครอบครอง</div>
    </div>
    <div class="meta">พิมพ์: ${e(thDate)} ${e(thTime)}</div>
  </div>

  ${profileSection}
  ${summaryBoxes}
  ${infoSection}
  ${holdingsSection}

  <div class="footer-note">
    เอกสารนี้สร้างจากระบบ IT Asset Management — ${e(thDate)} ${e(thTime)}
  </div>
</body>
</html>`;

  printViaIframe(html, { cleanupDelay: 1500 });
}
