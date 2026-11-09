/* แบรนด์ที่ดูแล (employees.brands) — เก็บเป็นอาร์เรย์ · ตัวเลือกอยู่ที่ settings/fieldOptions.brands
   นำเข้าจาก CSV ได้เป็นข้อความคั่นจุลภาค → อ่านผ่าน toBrands() เสมอ */
export const toBrands = (v) => (Array.isArray(v) ? v : String(v || '').split(','))
  .map((s) => String(s).trim()).filter(Boolean);

export const brandsText = (v) => toBrands(v).join(', ');

/* CSV พนักงาน: แบรนด์แยกคอลัมน์ "แบรนด์ 1" … "แบรนด์ 5" (template / ส่งออก)
   นำเข้ารับทั้งแบบแยกคอลัมน์ และคอลัมน์เดียว "แบรนด์ที่ดูแล" คั่นจุลภาค (ไฟล์รุ่นก่อน) */
export const BRAND_CSV_COLS = 5;
export const brandCsvHeaders = (n = BRAND_CSV_COLS) => Array.from({ length: n }, (_, i) => `แบรนด์ ${i + 1}`);
export const brandCsvField = (i) => `brand${i + 1}`;   // ชื่อฟิลด์ชั่วคราวตอนนำเข้า

/** รวมแบรนด์จากแถวที่นำเข้า (rec.brands + rec.brand1..N) → อาร์เรย์ไม่ซ้ำ · ลบฟิลด์ชั่วคราวออก */
export function collectImportedBrands(rec) {
  const parts = [rec.brands];
  Object.keys(rec).filter((k) => /^brand\d+$/.test(k)).sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)))
    .forEach((k) => { parts.push(rec[k]); delete rec[k]; });
  const out = [...new Set(parts.flatMap((p) => toBrands(p)))];
  if (out.length) rec.brands = out; else delete rec.brands;
  return rec;
}
