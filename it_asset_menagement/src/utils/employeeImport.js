/* นำเข้าพนักงาน (CSV / Excel) — แปลงแถว → ข้อมูลพนักงาน แล้วเทียบกับของเดิมด้วย "รหัสพนักงาน"
   รหัสตรงกับคนในระบบ = อัปเดต (ไม่สร้างซ้ำ) · ไม่ตรง = เพิ่มใหม่
   อัปเดตเฉพาะช่องที่ไฟล์มีค่า — ช่องว่างในไฟล์ไม่ลบของเดิม
   ฟังก์ชันนี้แค่วางแผน (ไม่เขียนฐานข้อมูล) — หน้าเว็บโชว์สรุปให้ผู้ใช้ยืนยันก่อนทุกครั้ง */

import { resolveName, joinName } from './nameUtils.js';
import { toBrands, brandsText, brandCsvHeaders, brandCsvField, collectImportedBrands } from './brands.js';
import { empKey, managerLookup } from './managers.js';
import { EMP_LEFT, normalizeDate, todayYmd } from './employeeStatus.js';

export const EMPLOYEE_IMPORT_MAP = {
  'รหัสพนักงาน': 'empId',
  'คำนำหน้า': 'namePrefix',
  'ชื่อจริง': 'firstName', 'นามสกุล': 'lastName',
  'ชื่อจริง (EN)': 'firstNameEng', 'นามสกุล (EN)': 'lastNameEng',
  'ชื่อ-นามสกุล': 'fullName', 'ชื่อภาษาอังกฤษ': 'fullNameEng',
  'ชื่อเล่น': 'nickname', 'แผนก': 'department', 'บริษัท': 'company',
  'ตำแหน่ง': 'position', 'เบอร์โทร': 'phone',
  'รหัสหัวหน้า': 'managerCode',   // แปลงเป็นชื่อหัวหน้า (ระบบเก็บเป็นชื่อ)
  'ชื่อหัวหน้า': 'managerName',   // ใช้เมื่อไม่มีรหัสหัวหน้าเท่านั้น
  'หัวหน้า': 'manager',           // ไฟล์รุ่นก่อน: ชื่อตรง ๆ
  'M365 Email': 'm365Email', 'M365 Password': 'm365Password',
  'วันที่เริ่มงาน': 'startDate', 'วันที่ออก': 'resignDate',
  'สถานะ': 'status',               // ไม่ได้เก็บ — "ออกแล้ว" แต่ไม่มีวันที่ออก = ออกวันนี้
  'แบรนด์ที่ดูแล': 'brands', 'แบรนด์': 'brands',
  ...Object.fromEntries(brandCsvHeaders(20).map((h, i) => [h, brandCsvField(i)])),
};

/* ช่องที่เทียบเพื่อหาว่าอะไรเปลี่ยน (เรียงตามคอลัมน์ในไฟล์) */
export const COMPARE_FIELDS = [
  ['company', 'บริษัท'], ['namePrefix', 'คำนำหน้า'], ['firstName', 'ชื่อจริง'], ['lastName', 'นามสกุล'],
  ['fullName', 'ชื่อ-นามสกุล'], ['nickname', 'ชื่อเล่น'], ['firstNameEng', 'ชื่อจริง (EN)'], ['lastNameEng', 'นามสกุล (EN)'],
  ['fullNameEng', 'ชื่อภาษาอังกฤษ'], ['position', 'ตำแหน่ง'], ['department', 'แผนก'], ['m365Email', 'M365 Email'],
  ['phone', 'เบอร์โทร'], ['startDate', 'วันที่เริ่มงาน'], ['resignDate', 'วันที่ออก'], ['brands', 'แบรนด์ที่ดูแล'],
  ['manager', 'หัวหน้า'],
];

/* ค่าที่ Excel ใส่ไว้แทน "ไม่มีข้อมูล" */
const EMPTY_MARKS = new Set(['#n/a', 'n/a', '#ref!', '#value!', '-', '—']);
export const cleanCell = (v) => {
  const s = String(v ?? '').trim();
  return EMPTY_MARKS.has(s.toLowerCase()) ? '' : s;
};

/** เบอร์มือถือที่ Excel ตัด 0 หน้าทิ้ง (815638752) → 0815638752 · แบบอื่นคงไว้ */
export const normalizePhone = (v) => {
  const s = cleanCell(v);
  return /^[689]\d{8}$/.test(s) ? `0${s}` : s;
};

/** แถว (header + ค่า) → record ดิบตาม MAP (ข้ามคอลัมน์ที่ไม่รู้จัก) */
export function rowToRecord(headers, vals, map = EMPLOYEE_IMPORT_MAP) {
  const rec = {};
  headers.forEach((h, i) => {
    const f = map[String(h || '').trim()];
    if (!f) return;
    const v = cleanCell(vals[i]);
    if (v || !(f in rec)) rec[f] = v;   // หัวคอลัมน์ซ้ำ (แบรนด์ / แบรนด์ที่ดูแล) — ค่าที่มีชนะช่องว่าง
  });
  return collectImportedBrands(rec);
}

/** จัดรูป record ให้พร้อมเขียน: ชื่อ · วันที่ · เบอร์ · สถานะ → วันที่ออก · รหัสหัวหน้า → ชื่อ
    คืน { rec, unknownManager } (unknownManager = รหัสหัวหน้าที่หาไม่เจอ) */
export function finalizeRecord(raw, managerNames = new Map(), today = todayYmd()) {
  const rec = { ...raw };
  const th = resolveName(rec.firstName, rec.lastName, rec.fullName);
  const en = resolveName(rec.firstNameEng, rec.lastNameEng, rec.fullNameEng);
  rec.firstName = th.first; rec.lastName = th.last;
  rec.firstNameEng = en.first; rec.lastNameEng = en.last;
  rec.fullName = joinName(th.first, th.last) || rec.fullName || '';
  rec.fullNameEng = joinName(en.first, en.last) || rec.fullNameEng || '';
  if (rec.startDate) rec.startDate = normalizeDate(rec.startDate);
  if (rec.resignDate) rec.resignDate = normalizeDate(rec.resignDate);
  if (rec.phone) rec.phone = normalizePhone(rec.phone);
  if (rec.status === EMP_LEFT && !rec.resignDate) rec.resignDate = today;
  delete rec.status;

  let unknownManager = '';
  if (rec.managerCode) {
    const name = managerNames.get(empKey(rec.managerCode));
    if (name) { rec.manager = name; rec.managerEmpId = rec.managerCode; }
    else unknownManager = rec.managerCode;
  } else if (rec.managerName) {
    rec.manager = rec.managerName;
  }
  delete rec.managerCode; delete rec.managerName;
  Object.keys(rec).forEach((k) => { if (rec[k] === '' || rec[k] == null) delete rec[k]; });
  return { rec, unknownManager };
}

const same = (field, a, b) => (field === 'brands'
  ? brandsText(a) === brandsText(b)
  : String(a ?? '').trim() === String(b ?? '').trim());

const display = (field, v) => (field === 'brands' ? brandsText(v) : String(v ?? '').trim());

/** เทียบ record ใหม่กับเอกสารเดิม → { patch, changes } (เฉพาะช่องที่ไฟล์มีค่าและต่างจากเดิม) */
export function diffEmployee(prevDoc = {}, rec = {}) {
  // เอกสารรุ่นเก่ามีแค่ fullName — เทียบกับชื่อที่แยกแล้ว (แบบเดียวกับที่ส่งออก) ไม่งั้นนับว่าเปลี่ยนทุกคน
  const th = resolveName(prevDoc.firstName, prevDoc.lastName, prevDoc.fullName);
  const en = resolveName(prevDoc.firstNameEng, prevDoc.lastNameEng, prevDoc.fullNameEng);
  const prev = { ...prevDoc, firstName: th.first, lastName: th.last, firstNameEng: en.first, lastNameEng: en.last };
  const patch = {};
  const changes = [];
  COMPARE_FIELDS.forEach(([f, label]) => {
    if (!(f in rec)) return;
    if (same(f, prev[f], rec[f])) return;
    patch[f] = f === 'brands' ? toBrands(rec[f]) : rec[f];
    changes.push({ field: f, label, from: display(f, prev[f]), to: display(f, rec[f]) });
  });
  // รหัสหัวหน้าไปพร้อมชื่อหัวหน้า (ไม่นับเป็นการเปลี่ยนแยก)
  if (rec.managerEmpId && (patch.manager || rec.managerEmpId !== prev.managerEmpId)) patch.managerEmpId = rec.managerEmpId;
  return { patch, changes };
}

/**
 * วางแผนการนำเข้า
 * @param headers  หัวคอลัมน์
 * @param rows     [{ row: เลขแถวในไฟล์, vals: [...] }]
 * @param existing พนักงานที่ทำงานอยู่ (employees)
 * @param removed  พนักงานที่ลบแล้ว (deleted_employees) — รหัสตรงก็อัปเดตเอกสารนั้น (ยังเป็นออกแล้ว)
 */
export function planEmployeeImport({ headers, rows, existing = [], removed = [], today = todayYmd() }) {
  const raws = rows
    .filter(({ vals }) => vals.some((v) => cleanCell(v)))
    .map(({ row, vals }) => ({ row, raw: rowToRecord(headers, vals) }));

  // รหัส → ชื่อ: คนในไฟล์ก่อน (ไฟล์ล่าสุดคือข้อมูลที่ถูก) แล้วค่อยคนในระบบ
  const managerNames = new Map();
  raws.forEach(({ raw }) => {
    const th = resolveName(raw.firstName, raw.lastName, raw.fullName);
    const name = joinName(th.first, th.last) || raw.fullName;
    const k = empKey(raw.empId);
    if (k && name && !managerNames.has(k)) managerNames.set(k, name);
  });
  managerLookup([...existing, ...removed]).forEach((v, k) => { if (!managerNames.has(k)) managerNames.set(k, v); });

  const byKey = new Map();
  removed.forEach((e) => { const k = empKey(e.empId); if (k) byKey.set(k, { doc: e, removed: true }); });
  existing.forEach((e) => { const k = empKey(e.empId); if (k) byKey.set(k, { doc: e, removed: false }); });   // ทำงานอยู่ชนะ

  const plan = { creates: [], updates: [], unchanged: [], skippedNoName: [], dupInFile: [], unknownManagers: [] };
  const seen = new Set();
  raws.forEach(({ row, raw }) => {
    const { rec, unknownManager } = finalizeRecord(raw, managerNames, today);
    const { m365Password: password, ...pub } = rec;
    const k = empKey(pub.empId);
    const target = k ? byKey.get(k) : null;
    if (!target && !pub.fullName && !pub.firstName) { plan.skippedNoName.push(row); return; }
    if (k && seen.has(k)) { plan.dupInFile.push({ row, empId: pub.empId }); return; }
    if (k) seen.add(k);
    if (unknownManager) plan.unknownManagers.push({ row, code: unknownManager });

    if (!target) { plan.creates.push({ row, rec: pub, password }); return; }
    const { patch, changes } = diffEmployee(target.doc, pub);
    if (password) changes.push({ field: 'm365Password', label: 'M365 Password', from: '', to: '(ตั้งใหม่)' });
    const item = {
      row, id: target.doc.id, removed: target.removed,
      empId: target.doc.empId || pub.empId, name: target.doc.fullName || pub.fullName || '',
      patch, changes, password,
    };
    (changes.length ? plan.updates : plan.unchanged).push(item);
  });
  return plan;
}
