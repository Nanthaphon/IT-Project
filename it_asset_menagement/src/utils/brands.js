/* แบรนด์ที่ดูแล (employees.brands) — เก็บเป็นอาร์เรย์ · ตัวเลือกอยู่ที่ settings/fieldOptions.brands
   นำเข้าจาก CSV ได้เป็นข้อความคั่นจุลภาค → อ่านผ่าน toBrands() เสมอ */
export const toBrands = (v) => (Array.isArray(v) ? v : String(v || '').split(','))
  .map((s) => String(s).trim()).filter(Boolean);

export const brandsText = (v) => toBrands(v).join(', ');
