/* ปรับข้อมูลก่อนนำเข้า Supabase (ใช้ทั้ง import และ verify ให้ตัวเลขตรงกัน)

   รหัสผ่าน M365 ค้างใน employees / deleted_employees (ระบบรุ่นก่อน) — ตารางนี้ทุกคนที่ login อ่านได้
   → ย้ายไป employee_secrets (อ่านได้เฉพาะ admin + เจ้าของ) แล้วลบออกจากข้อมูลพนักงาน
   มี employee_secrets อยู่แล้ว = ไม่เขียนทับ (ค่าที่แก้ทีหลังชนะ) — กติกาเดียวกับ scripts/migrate-m365-secrets.mjs */

export function prepareDump(dump, now = new Date(dump.exportedAt || Date.now())) {   // เวลาส่งออก = คงที่ (import กับ verify ได้ค่าเดียวกัน)
  const secrets = (dump.tables.employee_secrets ||= []);
  const have = new Set(secrets.map((r) => r.id));
  let moved = 0;
  let stripped = 0;
  for (const t of ['employees', 'deleted_employees']) {
    for (const r of dump.tables[t] || []) {
      if (!r.data || !('m365Password' in r.data)) continue;
      const pw = String(r.data.m365Password || '');
      if (pw && !have.has(r.id)) {
        secrets.push({ id: r.id, data: { m365Password: pw, updatedAt: { __ts: now.toISOString() } } });
        have.add(r.id);
        moved++;
      }
      delete r.data.m365Password;
      stripped++;
    }
  }
  return { moved, stripped };
}
