// สร้าง firestore.readonly.rules จาก firestore.rules: สิทธิ์อ่านเหมือนเดิมทุกข้อ · เขียนทุกแบบ = false (ใช้ช่วงสลับระบบ)
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('firestore.rules', 'utf8');
let n = 0;
const out = src.replace(/allow\s+([a-z,\s]+?):\s*if\s+([\s\S]*?);/g, (_, methods, expr) => {
  n++;
  const list = methods.split(',').map((m) => m.trim());
  const reads = list.filter((m) => ['read', 'get', 'list'].includes(m));
  const writes = list.filter((m) => !reads.includes(m));
  return [reads.length && `allow ${reads.join(', ')}: if ${expr};`, writes.length && `allow ${writes.join(', ')}: if false;`].filter(Boolean).join(' ');
});
writeFileSync('firestore.readonly.rules', '// สร้างจาก scripts/make-readonly-rules.mjs — ช่วงสลับระบบ: อ่านได้ตามเดิม เขียนไม่ได้\n' + out);
console.log('allow statements:', n);
