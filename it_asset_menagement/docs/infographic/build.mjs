// สร้างไฟล์ภาพสรุประบบจากต้นฉบับ it-asset-overview.html
//   node docs/infographic/build.mjs
// 1) เขียน icons.js (ไอคอน lucide แบบฝังในไฟล์ — เปิด HTML แบบออฟไลน์ได้)
// 2) เรนเดอร์ด้วย Microsoft Edge / Chrome แบบ headless → .png (A4 300dpi) และ .pdf (A4 แนวนอน)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const src = join(here, 'it-asset-overview.html');
const html = readFileSync(src, 'utf8');

// ── 1) ไอคอน: เก็บทุกชื่อที่ใช้ใน data-icon="..." ──
const names = [...new Set([...html.matchAll(/data-icon="([a-z0-9-]+)"/g)].map((m) => m[1]))];
const attr = (o) => Object.entries(o).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ');
const icons = {};
for (const n of names) {
  const file = join(root, 'node_modules/lucide-react/dist/esm/icons', `${n}.mjs`);
  if (!existsSync(file)) throw new Error(`ไม่พบไอคอน lucide: ${n}`);
  const { __iconNode } = await import(pathToFileURL(file).href);
  icons[n] = __iconNode.map(([tag, a]) => `<${tag} ${attr(a)}/>`).join('');
}
writeFileSync(join(here, 'icons.js'), `// สร้างโดย build.mjs — อย่าแก้มือ\n(() => {\nconst I = ${JSON.stringify(icons, null, 0)};\n` +
  `document.querySelectorAll('[data-icon]').forEach((el) => {\n  const b = I[el.dataset.icon]; if (!b) return;\n` +
  `  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');\n  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic'); s.innerHTML = b;\n` +
  `  el.replaceChildren(s);\n});\n})();\n`);
console.log(`icons.js: ${names.length} ไอคอน`);

// ── 2) เรนเดอร์ ──
const browsers = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
];
const exe = browsers.find(existsSync);
if (!exe) throw new Error('ไม่พบ Edge/Chrome สำหรับเรนเดอร์');
const url = pathToFileURL(src).href;
// โปรไฟล์แยก — ถ้า Edge เปิดค้างอยู่ headless จะส่งงานให้หน้าต่างเดิมแล้วไม่เขียนไฟล์
const profile = join(process.env.TEMP || here, 'infographic-render-profile');
const common = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--virtual-time-budget=15000', '--run-all-compositor-stages-before-draw'];
const png = join(here, 'it-asset-overview.png');
const pdf = join(here, 'it-asset-overview.pdf');
execFileSync(exe, [...common, `--user-data-dir=${profile}-png`, '--force-device-scale-factor=2', '--window-size=1754,1240', `--screenshot=${png}`, url], { stdio: 'inherit' });
execFileSync(exe, [...common, `--user-data-dir=${profile}-pdf`, '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, url], { stdio: 'inherit' });
console.log('เขียนแล้ว:', png, pdf);
