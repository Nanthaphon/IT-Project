/* หัวหน้างานของพนักงาน — ในระบบเก็บเป็นชื่อ (employees.manager = fullName ของหัวหน้า) + managerEmpId (ถ้ารู้)
   ไฟล์นำเข้า/ส่งออกใช้ "รหัสหัวหน้า" (รหัสพนักงาน) แทนชื่อ — พิมพ์ชื่อผิดแล้วจับคู่ไม่ได้ รหัสผิดยากกว่า */

export const empKey = (v) => String(v ?? '').trim().toLowerCase();

/** รหัส → ชื่อ จากรายชื่อพนักงาน (ตัวแรกที่เจอชนะ) */
export function managerLookup(people = []) {
  const m = new Map();
  people.forEach((p) => {
    const k = empKey(p?.empId);
    if (k && p.fullName && !m.has(k)) m.set(k, p.fullName);
  });
  return m;
}

/** รหัสหัวหน้าของพนักงานคนหนึ่ง (ใช้ตอนส่งออก)
    managerEmpId ที่ชื่อยังตรงกับ manager ก่อน (ชื่อซ้ำกันได้) ไม่งั้นหาจากชื่อ */
export function managerCodeOf(emp, people = []) {
  if (!emp?.manager) return '';
  const byId = emp.managerEmpId && people.find((p) => empKey(p.empId) === empKey(emp.managerEmpId));
  if (byId && byId.fullName === emp.manager) return byId.empId;
  return people.find((p) => p.fullName === emp.manager)?.empId || emp.managerEmpId || '';
}
