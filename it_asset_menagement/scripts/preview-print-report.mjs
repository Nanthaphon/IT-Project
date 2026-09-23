/* เปิดดูรายงานทรัพย์สินที่พิมพ์ออก โดยไม่ต้องเข้าระบบและไม่ต้องสั่งพิมพ์จริง
   ใช้ตรวจสไตล์/สีหลังแก้ธีม
     node scripts/preview-print-report.mjs
     แล้วเปิด http://localhost:5175/print-report-preview.html          */
import fs from 'fs';
import { pathToFileURL } from 'node:url';

const { buildAssetReportHtml } = await import(
  pathToFileURL(process.cwd() + '/src/utils/printAssetReport.js').href);

const swatch = (c) => 'data:image/svg+xml;base64,' + Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${c}"/></svg>`
).toString('base64');

/* ครอบให้ครบทุกโทนสถานะ + มีรูป/ไม่มีรูป */
const assets = [
  { id: '1', name: 'ทีวี LED 65" Google TV 64A6500N HISENSE', model: 'H55D6UG',
    assetTag: 'GCO-HQ-2607001', type: 'ทีวี', cost: 6497, status: 'ชำรุดเสียหาย', photoGallery: [swatch('#6E97A9'), swatch('#2B6777')] },
  { id: '2', name: 'ASUS FX504G', model: 'FX504G', assetTag: 'IT-102050',
    type: 'โน้ตบุ๊ค', cost: 10000, status: 'ตัดจำหน่าย', photoGallery: [swatch('#C8D8E4')] },
  { id: '3', name: 'Victus by HP Laptop 16-d0268TX', assetTag: 'CO-033-2',
    type: 'โน้ตบุ๊ค', cost: 14000, status: 'พร้อมใช้งาน', assignedName: 'สมชาย ใจดี' },
  { id: '4', name: 'Dell OptiPlex 7010', assetTag: 'CO-041',
    type: 'คอมพิวเตอร์', cost: 18000, status: 'ถูกใช้งาน', assignedName: 'ปรียา วงศ์ดี' },
  { id: '5', name: 'HP LaserJet M404', assetTag: 'CO-090',
    type: 'เครื่องพิมพ์', cost: 9000, status: 'สำรอง' },
];

const html = buildAssetReportHtml({
  assets,
  companyName: 'Globe Syndicate (Thailand) Co., Ltd.',
  visibleColumns: { assetTag: true, cost: true, status: true, assignedName: true },
  filterChips: ['ประเภท: เลือกไว้ 2 รายการ'],
});

fs.writeFileSync('print-report-preview.html', html);
console.log('เขียน print-report-preview.html — เปิดที่ /print-report-preview.html');
