/* ════════════════════════════════════════════════════════════════════════
   printAssetDetail — รายละเอียดทรัพย์สิน 1 ตัว (PDF ผ่าน browser print)
   ════════════════════════════════════════════════════════════════════════ */

import { printViaIframe } from './printViaIframe.js';
import { e } from './htmlEscape.js';
import { formatDateShort } from './formatDate.js';

const fmtTHB = (n) => (n || n === 0) ? `${Number(n).toLocaleString('th-TH')}` : '-';

// 🆕 ใช้ photoGallery (คลังรูปเฉพาะสำหรับ PDF) แทนเอกสารแนบทั่วไป
function getGalleryPhotos(item) {
  const gallery = Array.isArray(item.photoGallery) ? item.photoGallery : [];
  return gallery.filter(src => src && String(src).startsWith('data:image/'));
}

const calcAge = (purchaseDate) => {
  if (!purchaseDate) return '-';
  const d = new Date(purchaseDate);
  if (isNaN(d.getTime())) return '-';
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0 && months === 0) return '< 1 เดือน';
  if (years === 0) return `${months} เดือน`;
  if (months === 0) return `${years} ปี`;
  return `${years} ปี ${months} เดือน`;
};

const statusBadge = (status) => {
  const s = status || 'พร้อมใช้งาน';
  const colorMap = {
    'พร้อมใช้งาน':       { bg: '#dcfce7', fg: '#166534', border: '#86efac' },
    'ถูกใช้งาน':         { bg: '#dbeafe', fg: '#1e40af', border: '#93c5fd' },
    'ชำรุดเสียหาย':      { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
    'ไม่สามารถใช้งานได้':  { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
    'สำรอง':             { bg: '#ede9fe', fg: '#5b21b6', border: '#c4b5fd' },
    'ตัดจำหน่าย':        { bg: '#f1f5f9', fg: '#475569', border: '#cbd5e1' },
  };
  const c = colorMap[s] || { bg: '#f1f5f9', fg: '#475569', border: '#cbd5e1' };
  return `<span style="display:inline-block;font-size:12px;font-weight:600;padding:3px 10px;border-radius:4px;background:${c.bg};color:${c.fg};border:1px solid ${c.border}">${e(s)}</span>`;
};

/* ── Field row helper ── */
const field = (label, value, opts = {}) => `
  <div style="${opts.col ? '' : 'flex:1;min-width:160px;'}">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px">${e(label)}</div>
    <div style="font-size:${opts.large ? '13.5' : '12.5'}px;color:#0f172a;font-weight:${opts.bold ? 600 : 500};${opts.mono ? "font-family:'Courier New',monospace;" : ''}${opts.color ? `color:${opts.color};` : ''}">${value || '<span style="color:#cbd5e1">—</span>'}</div>
  </div>`;

export function printAssetDetail({
  asset,
  companyName = 'Globe Syndicate (Thailand) Co., Ltd.',
}) {
  if (!asset) return;
  const today = new Date();
  const thDate = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const thTime = today.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  // 🆕 ชื่อไฟล์ PDF = "ชื่ออุปกรณ์ รหัสทรัพย์สิน"
  //    (browser ใช้ <title> เป็น default filename ตอน Save as PDF)
  //    sanitize อักขระต้องห้ามใน filename (\ / : * ? " < > |)
  const sanitize = (s) => String(s || '').replace(/[\\/:*?"<>|]/g, '_').trim();
  const namePart = sanitize(asset.name) || 'ทรัพย์สิน';
  const tagPart  = sanitize(asset.assetTag);
  const fileTitle = tagPart ? `${namePart}_${tagPart}` : namePart;

  const galleryPhotos = getGalleryPhotos(asset);

  /* ── Section: ข้อมูลหลัก ── */
  const headerSection = `
    <div style="display:flex;gap:16px;margin-bottom:9px;align-items:flex-start">
      ${asset.image ? `
        <div style="width:100px;height:100px;border:1px solid #cbd5e1;border-radius:6px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <img src="${asset.image}" alt="${e(asset.name)}" style="max-width:100%;max-height:100%;object-fit:contain" />
        </div>` : ''}
      <div style="flex:1">
        <div style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:4px">${e(asset.name) || '-'}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <span style="display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:3px;background:#dbeafe;color:#1e40af;border:1px solid #93c5fd">${e(asset.type) || 'ทรัพย์สิน'}</span>
          ${statusBadge(asset.status)}
        </div>
      </div>
    </div>`;

  /* ── Section: ข้อมูลจำเพาะ ── */
  const specSection = `
    <div style="margin-bottom:9px">
      <div style="font-size:11px;font-weight:700;color:#1E487A;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #1E487A;padding-bottom:4px;margin-bottom:10px">ข้อมูลจำเพาะ</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px 24px">
        ${field('Asset Tag', asset.assetTag ? `<span style="font-family:'Courier New',monospace;background:#f1f5f9;padding:1px 6px;border-radius:3px">${e(asset.assetTag)}</span>` : '', { bold: true })}
        ${field('Serial Number', asset.sn ? `<span style="font-family:'Courier New',monospace;background:#f1f5f9;padding:1px 6px;border-radius:3px">${e(asset.sn)}</span>` : '')}
        ${field('ยี่ห้อ / รุ่น', e(asset.model))}
        ${field('ผู้จัดจำหน่าย', e(asset.vendor))}
        ${field('บริษัท', e(asset.company))}
        ${field('สำหรับแผนก', e(asset.forDepartment || asset.department))}
      </div>
    </div>`;

  /* ── Section: การจัดซื้อ + ราคา + อายุการใช้งาน ── */
  const purchaseSection = `
    <div style="margin-bottom:9px">
      <div style="font-size:11px;font-weight:700;color:#1E487A;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #1E487A;padding-bottom:4px;margin-bottom:10px">การจัดซื้อ &amp; การรับประกัน</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px 24px">
        ${field('วันที่ซื้อ', asset.purchaseDate ? e(formatDateShort(asset.purchaseDate)) : '')}
        ${field('วันหมด Warranty', asset.warrantyDate ? e(formatDateShort(asset.warrantyDate)) : '')}
        ${field('อายุการใช้งาน', e(calcAge(asset.purchaseDate)))}
        ${field('ราคาจัดซื้อ', asset.cost ? `<span style="color:#1E487A">฿${fmtTHB(asset.cost)}</span>` : '', { bold: true, large: true })}
        ${field('ราคาปัจจุบัน', asset.scrapValue ? `<span style="color:#059669">฿${fmtTHB(asset.scrapValue)}</span>` : '', { bold: true, large: true })}
      </div>
    </div>`;

  /* ── Section: ผู้ครอบครอง ── */
  const ownerSection = `
    <div style="margin-bottom:9px">
      <div style="font-size:11px;font-weight:700;color:#1E487A;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #1E487A;padding-bottom:4px;margin-bottom:10px">ผู้ครอบครอง</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px 24px">
        ${field('ชื่อผู้ครอบครอง', e(asset.assignedName), { large: true, bold: true })}
      </div>
    </div>`;

  /* ── Section: หมายเหตุ ── */
  const noteSection = asset.note ? `
    <div style="margin-bottom:9px">
      <div style="font-size:11px;font-weight:700;color:#1E487A;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #1E487A;padding-bottom:4px;margin-bottom:10px">หมายเหตุ / รายละเอียดเพิ่มเติม</div>
      <div style="background:#fefce8;border-left:3px solid #facc15;padding:8px 12px;border-radius:3px;font-size:12.5px;color:#422006;white-space:pre-wrap">${e(asset.note)}</div>
    </div>` : '';

  /* ── Section: Remark ── */
  const remarkSection = asset.remark ? `
    <div style="margin-bottom:9px">
      <div style="font-size:11px;font-weight:700;color:#1E487A;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #1E487A;padding-bottom:4px;margin-bottom:10px">Remark</div>
      <div style="background:#eff6ff;border-left:3px solid #3b82f6;padding:8px 12px;border-radius:3px;font-size:12.5px;color:#1e3a5f;white-space:pre-wrap">${e(asset.remark)}</div>
    </div>` : '';

  /* ── Section: รูปภาพประกอบ (จากคลังรูปที่ตั้งไว้ในแท็บข้อมูลทั่วไป) ── */
  const attachSection = galleryPhotos.length > 0 ? `
    <div style="margin-bottom:9px;break-inside:avoid">
      <div style="font-size:11px;font-weight:700;color:#1E487A;text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid #1E487A;padding-bottom:4px;margin-bottom:10px">รูปภาพประกอบ (${galleryPhotos.length} รูป)</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px">
        ${galleryPhotos.map((src, i) => `
          <div style="break-inside:avoid">
            <div style="width:100%;aspect-ratio:1;border:1px solid #cbd5e1;border-radius:4px;overflow:hidden;background:#fff">
              <img src="${src}" alt="รูปที่ ${i + 1}" style="width:100%;height:100%;object-fit:cover;display:block" />
            </div>
          </div>
        `).join('')}
      </div>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${e(fileTitle)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    html { margin: 0; padding: 0; }
    body {
      margin: 0;
      padding: 0;
      /* ตรึงความกว้างเท่าพื้นที่พิมพ์จริง (A4 กว้าง 210mm - ขอบ 10mm x2 = 190mm)
         เพื่อให้การวัดความสูงบนหน้าจอตรงกับตอนพิมพ์ → auto-fit หน้าเดียวได้แม่นยำ */
      width: 190mm;
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
      padding-bottom: 6px;
      margin-bottom: 10px;
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
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
      font-size: 9.5px;
      color: #94a3b8;
      text-align: center;
    }
    img { display: block; }
  </style>
</head>
<body>
  <div class="page-header">
    <div>
      <div class="company">${e(companyName)}</div>
      <div class="title">รายละเอียดทรัพย์สิน (Asset Detail Report)</div>
    </div>
    <div class="meta">
      พิมพ์: ${e(thDate)} ${e(thTime)}
    </div>
  </div>

  ${headerSection}
  ${specSection}
  ${purchaseSection}
  ${ownerSection}
  ${noteSection}
  ${remarkSection}
  ${attachSection}

  <div class="footer-note">
    เอกสารนี้สร้างจากระบบ IT Asset Management — ${e(thDate)} ${e(thTime)}
  </div>

  <script>
    /* Auto-fit: ย่อเนื้อหาทั้งหมดให้พอดี 1 หน้า A4 เสมอ
       - พื้นที่พิมพ์แนวตั้ง = สูง 297mm - ขอบบน/ล่าง 10mm x2 = 277mm
       - body ถูกตรึงกว้าง 190mm แล้ว → วัดความสูงบนหน้าจอตรงกับตอนพิมพ์
       - ถ้าเนื้อหาสูงเกิน ให้ zoom ลง (ไม่ขยายเกิน 1) */
    (function () {
      var AVAIL_H = 277 * (96 / 25.4); // 277mm → px (~1047)
      function fitToOnePage() {
        var b = document.body;
        b.style.zoom = '1';
        var h = b.scrollHeight;
        if (h > AVAIL_H) {
          b.style.zoom = String(Math.max(0.4, (AVAIL_H - 2) / h));
        }
      }
      window.addEventListener('load', fitToOnePage);
      window.addEventListener('beforeprint', fitToOnePage);
      // เผื่อรูปโหลดช้ากว่า load event
      window.addEventListener('DOMContentLoaded', fitToOnePage);
    })();
  </script>
</body>
</html>`;

  printViaIframe(html, { cleanupDelay: 1500 });
}
