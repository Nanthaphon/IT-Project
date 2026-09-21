import fs from 'fs';
import { pathToFileURL } from 'node:url';
const { planCollections, MENU_NEEDS, ALWAYS } =
  await import(pathToFileURL(process.cwd() + '/src/hooks/firebaseNeeds.js').href);

const ALL = ['assets','accessories','employees','deleted_employees','licenses','repair_requests',
  'office_supplies','supply_requests','replacement_requests','accessory_requests','fieldOptions',
  'bundled_items','accessories_transactions','assets_transactions','licenses_transactions'];

let bad = 0;
const check = (label, cond) => { if (!cond) { console.log('  FAIL ' + label); bad++; } };

/* 1) ทุก key ใน MENU_NEEDS ต้องเป็นเมนูจริงใน App.jsx และครบทุกเมนู */
const app = fs.readFileSync('src/App.jsx', 'utf8');
const menuBlock = app.slice(app.indexOf('const MENU_PATH'), app.indexOf('const PATH_MENU'));
const realMenus = new Set([...menuBlock.matchAll(/(\w+):\s*'\//g)].map(m => m[1]));
for (const k of Object.keys(MENU_NEEDS)) check('เมนู "' + k + '" ไม่มีใน MENU_PATH', realMenus.has(k));
for (const k of realMenus) check('MENU_NEEDS ขาดเมนู "' + k + '"', k in MENU_NEEDS);

/* 2) ทุก collection ที่อ้างถึงต้องเปิดได้จริงใน hook */
const hook = fs.readFileSync('src/hooks/useFirebaseData.jsx', 'utf8');
const openBlock = hook.slice(hook.indexOf('const OPEN = {'), hook.indexOf('/* เปิดเฉพาะก้อน'));
const known = new Set([...openBlock.matchAll(/^\s{6}([a-zA-Z_]+):/gm)].map(m => m[1]));
const referenced = new Set([...ALWAYS, ...Object.values(MENU_NEEDS).flat(), 'office_supplies']);
for (const c of referenced) check('collection "' + c + '" ไม่มีใน OPEN ของ hook', known.has(c));
for (const c of known) check('OPEN มี "' + c + '" ที่ไม่มีใครขอใช้', ALL.includes(c));

/* 3) พฤติกรรมที่ต้องการ */
const dash = planCollections('dashboard', { role: 'admin' });
check('dashboard ต้องไม่โหลด transactions', ![...dash].some(k => k.endsWith('_transactions')));
check('dashboard ต้องไม่โหลด office_supplies', !dash.has('office_supplies'));
check('dashboard ต้องไม่โหลด deleted_employees', !dash.has('deleted_employees'));
check('dashboard ต้องมี assets', dash.has('assets'));

check('หน้าทรัพย์สินต้องมี transactions (ไทม์ไลน์)',
  planCollections('assets', { role: 'admin' }).has('assets_transactions'));

const hr = planCollections('employees', { role: 'hr' });
check('hr ต้องไม่แตะ transactions', ![...hr].some(k => k.endsWith('_transactions')));
check('hr ต้องไม่แตะ deleted_employees', !hr.has('deleted_employees'));

/* 4) staff — ต้องได้ครบตามที่ StaffView รับเข้าไปจริง ไม่ว่าจะอยู่เมนูไหน */
const staffProps = ['assets','accessories','licenses','officeSupplies','repairRequests',
  'supplyRequests','replacementRequests','accessoryRequests'];
const toKey = { officeSupplies: 'office_supplies', repairRequests: 'repair_requests',
  supplyRequests: 'supply_requests', replacementRequests: 'replacement_requests',
  accessoryRequests: 'accessory_requests' };
for (const menu of ['dashboard', 'assets', 'field_options']) {
  const w = planCollections(menu, { role: 'staff' });
  for (const p of staffProps) check('staff ที่เมนู ' + menu + ' ขาด ' + p, w.has(toKey[p] || p));
  check('staff ต้องไม่แตะ transactions', ![...w].some(k => k.endsWith('_transactions')));
}

/* 5) เมนูที่ไม่รู้จัก */
check('เมนูที่ไม่รู้จักต้องได้แค่ ALWAYS',
  planCollections('ไม่มีจริง', { role: 'admin' }).size === ALWAYS.length);

/* 6) ป้ายบน sidebar ต้องมีข้อมูลทุกหน้า */
for (const menu of Object.keys(MENU_NEEDS)) {
  const w = planCollections(menu, { role: 'admin' });
  for (const need of ['licenses','repair_requests','supply_requests','replacement_requests','accessory_requests']) {
    check('เมนู ' + menu + ' ขาด ' + need + ' (ป้ายบน sidebar จะเป็น 0)', w.has(need));
  }
}

console.log('  เมนู(admin)             โหลด/ทั้งหมด');
for (const menu of Object.keys(MENU_NEEDS)) {
  const w = planCollections(menu, { role: 'admin' });
  console.log('  ' + menu.padEnd(22) + String(w.size).padStart(2) + '/' + ALL.length);
}
console.log('  staff                 ' + String(planCollections('dashboard', { role: 'staff' }).size).padStart(2) + '/' + ALL.length);
console.log(bad === 0 ? '\nผ่านทุกข้อ' : '\nไม่ผ่าน ' + bad + ' ข้อ');
process.exit(bad === 0 ? 0 : 1);
