/* แปลงบล็อก @theme ใน index.css เป็น config สีของ Tailwind v3
   ใช้ตอนยกธีมไปโปรเจคที่ยังใช้ Tailwind v3 อยู่ (ไม่ต้องอัปเป็น v4)
   คลาสที่ได้ชื่อเหมือนกันทุกตัว — bg-clay-600 / text-stone-400 / ring-clay-600/15

     node scripts/export-palette.mjs            # พิมพ์ออกหน้าจอ
     node scripts/export-palette.mjs > out.js   # เก็บเป็นไฟล์            */
import fs from 'fs';

const css = fs.readFileSync('src/index.css', 'utf8');
const pairs = [...css.matchAll(/--color-([a-z]+)-(\d+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g)];
if (pairs.length === 0) { console.error('ไม่พบ --color-* ใน src/index.css'); process.exit(1); }

const groups = {};
for (const [, name, shade, hex] of pairs) {
  (groups[name] ||= {})[shade] = hex.toUpperCase();
}

const lines = Object.entries(groups).map(([name, shades]) => {
  const inner = Object.entries(shades)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([k, v]) => `          ${k}: '${v}',`)
    .join('\n');
  return `        ${name}: {\n${inner}\n        },`;
}).join('\n');

process.stdout.write(`/* สร้างจาก src/index.css โดย scripts/export-palette.mjs — อย่าแก้มือ */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
${lines}
      },
    },
  },
  plugins: [],
};
`);
console.error(`// แปลงแล้ว ${pairs.length} ค่า ใน ${Object.keys(groups).length} กลุ่ม: ${Object.keys(groups).join(', ')}`);
