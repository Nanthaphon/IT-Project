/* ════════════════════════════════════════════════════════════════════════
   ชั้นเชื่อมฐานข้อมูล — หน้าตาเหมือน 'firebase/firestore' แต่ข้างในคุยกับ Supabase
   วันสลับระบบ: เปลี่ยน import { ... } from 'firebase/firestore' → from '../db/compat.js'
   โค้ดหน้าจอเดิมไม่ต้องแก้

   รองรับเฉพาะที่แอปใช้จริง: collection · doc · addDoc · setDoc (merge) · updateDoc (path แบบ "a.b")
   deleteDoc · getDoc · getDocs · onSnapshot · query/where/orderBy/limit · writeBatch
   serverTimestamp · deleteField · getFirestore

   ที่ทำต่างจาก Firestore (ตั้งใจ):
   - where/orderBy กรองฝั่งเครื่องหลังโหลดทั้งตาราง — ข้อมูลระบบนี้หลักร้อย/พันแถว (ไม่มีโควตาอ่านแบบ Firestore)
   - serverTimestamp ใช้เวลาเครื่องตอนเขียน (ไม่มีสถานะ "รอเวลาจาก server")
   - writeBatch เขียนทีละรายการ ไม่ใช่ทั้งชุดในครั้งเดียว

   backend (ที่เก็บจริง) ฉีดเข้ามาด้วย configureBackend — supabaseBackend.js ตอนใช้งาน · PGlite ตอนเทสต์
   ════════════════════════════════════════════════════════════════════════ */

import { decodeValue, encodeValue, tableForPath, CHUNK_TABLE } from './codec.js';

let backend = null;
export function configureBackend(b) { backend = b; }
const be = () => {
  if (!backend) throw new Error('ยังไม่ได้ตั้งค่าฐานข้อมูล (configureBackend)');
  return backend;
};

/* ── ค่าพิเศษ ───────────────────────────────────────────────────────── */
const SERVER_TS = { __op: 'serverTimestamp' };
const DELETE = { __op: 'deleteField' };
export const serverTimestamp = () => SERVER_TS;
export const deleteField = () => DELETE;

const DB = { type: 'db' };
export const getFirestore = () => DB;

const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype
  && v !== SERVER_TS && v !== DELETE && !(typeof v.toDate === 'function');

/** แทนค่าพิเศษ (serverTimestamp → เวลา · deleteField → ตัดทิ้ง) แล้วแปลงเป็น JSON */
function resolve(v, now) {
  if (v === SERVER_TS) return encodeValue(now);
  if (Array.isArray(v)) return v.map((x) => resolve(x, now));
  if (isPlain(v)) {
    const out = {};
    for (const [k, x] of Object.entries(v)) if (x !== DELETE && x !== undefined) out[k] = resolve(x, now);
    return out;
  }
  return encodeValue(v);
}

/* ── อ้างอิง ────────────────────────────────────────────────────────── */
const AUTO_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export function autoId() {
  const bytes = new Uint8Array(20);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => AUTO_CHARS[b % AUTO_CHARS.length]).join('');
}

const joinPath = (base, segs) => [base, ...segs].filter(Boolean).join('/').split('/').filter(Boolean);

export function collection(parent, ...segs) {
  const base = parent?.type === 'doc' ? parent.path : '';
  const parts = joinPath(base, segs);
  if (parts.length % 2 !== 1) throw new Error(`path ของ collection ไม่ถูกต้อง: ${parts.join('/')}`);
  const path = parts.join('/');
  return { type: 'collection', path, id: parts.at(-1), ...tableForPath(path) };
}

export function doc(parent, ...segs) {
  let parts;
  if (parent?.type === 'collection') parts = [...parent.path.split('/'), ...(segs.length ? joinPath('', segs) : [autoId()])];
  else parts = joinPath(parent?.type === 'doc' ? parent.path : '', segs);
  if (parts.length % 2 !== 0) throw new Error(`path ของเอกสารไม่ถูกต้อง: ${parts.join('/')}`);
  const id = parts.at(-1);
  const colPath = parts.slice(0, -1).join('/');
  return { type: 'doc', id, path: parts.join('/'), parent: collection(DB, colPath) };
}

/* ── query ──────────────────────────────────────────────────────────── */
export const where = (field, op, value) => ({ kind: 'where', field, op, value });
export const orderBy = (field, dir = 'asc') => ({ kind: 'orderBy', field, dir });
export const limit = (n) => ({ kind: 'limit', n });
export function query(ref, ...constraints) {
  const base = ref.type === 'query' ? ref : { ...ref, type: 'query', collection: ref, constraints: [] };
  return { ...base, constraints: [...base.constraints, ...constraints] };
}

const getField = (data, field) => String(field).split('.').reduce((o, k) => (o == null ? undefined : o[k]), data);
const cmpVal = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : v);
function compare(a, b) {
  const x = cmpVal(a); const y = cmpVal(b);
  if (x === y) return 0;
  if (x === undefined || x === null) return -1;
  if (y === undefined || y === null) return 1;
  return x < y ? -1 : 1;
}
function matches(data, { field, op, value }) {
  const v = getField(data, field);
  switch (op) {
    case '==': return compare(v, value) === 0 && v !== undefined;
    case '!=': return v !== undefined && compare(v, value) !== 0;
    case '<': return v !== undefined && compare(v, value) < 0;
    case '<=': return v !== undefined && compare(v, value) <= 0;
    case '>': return v !== undefined && compare(v, value) > 0;
    case '>=': return v !== undefined && compare(v, value) >= 0;
    case 'in': return value.some((x) => compare(v, x) === 0);
    case 'not-in': return v !== undefined && !value.some((x) => compare(v, x) === 0);
    case 'array-contains': return Array.isArray(v) && v.some((x) => compare(x, value) === 0);
    case 'array-contains-any': return Array.isArray(v) && v.some((x) => value.some((y) => compare(x, y) === 0));
    default: throw new Error(`where ไม่รองรับ ${op}`);
  }
}
function applyConstraints(docs, constraints = []) {
  let out = docs.filter((d) => constraints.filter((c) => c.kind === 'where').every((c) => matches(d.data(), c)));
  const orders = constraints.filter((c) => c.kind === 'orderBy');
  if (orders.length) {
    out = out.filter((d) => orders.every((o) => getField(d.data(), o.field) !== undefined));   // เหมือน Firestore: ไม่มีฟิลด์ = ไม่อยู่ในผล
    out.sort((a, b) => {
      for (const o of orders) {
        const c = compare(getField(a.data(), o.field), getField(b.data(), o.field));
        if (c) return o.dir === 'desc' ? -c : c;
      }
      return 0;
    });
  }
  const lim = constraints.findLast?.((c) => c.kind === 'limit') ?? [...constraints].reverse().find((c) => c.kind === 'limit');
  return lim ? out.slice(0, lim.n) : out;
}

/* ── snapshot ───────────────────────────────────────────────────────── */
function docSnap(ref, raw) {
  const data = raw ? decodeValue(raw) : undefined;
  return {
    id: ref.id, ref,
    exists: () => !!raw,
    data: () => (data ? { ...data } : undefined),
    get: (f) => (data ? getField(data, f) : undefined),
  };
}
function querySnap(docs, changes = null) {
  return {
    docs, size: docs.length, empty: docs.length === 0,
    forEach: (cb) => docs.forEach(cb),
    docChanges: () => changes ?? docs.map((d, i) => ({ type: 'added', doc: d, oldIndex: -1, newIndex: i })),
  };
}

const where_ = (ref) => (ref.type === 'query' ? ref.collection : ref);
const target = (colRef) => {
  const { table, parentCollection, parentId, sub } = colRef;
  return table === CHUNK_TABLE ? { table, parent: { parentCollection, parentId, sub } } : { table };
};

/* ── อ่าน ───────────────────────────────────────────────────────────── */
export async function getDoc(ref) {
  const { table, parent } = target(ref.parent);
  const row = await be().get(table, ref.id, parent);
  return docSnap(ref, row?.data ?? null);
}

async function loadCollection(colRef) {
  const { table, parent } = target(colRef);
  const rows = await be().list(table, parent);
  return rows.map((r) => docSnap(doc(colRef, r.id), r.data));
}

export async function getDocs(ref) {
  const colRef = where_(ref);
  const docs = await loadCollection(colRef);
  return querySnap(applyConstraints(docs, ref.constraints));
}

/* ── เขียน ──────────────────────────────────────────────────────────── */
/** ออบเจ็กต์ซ้อน → รายการ path ปลายทาง (ใช้กับ merge: รวมลึกเหมือน Firestore) */
function leafOps(obj, prefix = [], now) {
  const ops = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const path = [...prefix, k];
    if (v === DELETE) ops.push({ path, delete: true });
    else if (isPlain(v) && Object.keys(v).length) ops.push(...leafOps(v, path, now));
    else ops.push({ path, value: resolve(v, now) });
  }
  return ops;
}

async function writeDoc(ref, mode, ops) {
  const { table, parent } = target(ref.parent);
  if (table === CHUNK_TABLE) {
    if (mode === 'update' || mode === 'merge') throw new Error('ชิ้นไฟล์แนบแก้ไขไม่ได้ — เขียนใหม่ทั้งชิ้น');
    const data = {};
    ops.forEach(({ path, value }) => { data[path[0]] = value; });
    return be().putChunk(parent, ref.id, data);
  }
  return be().write(table, ref.id, mode, ops);
}

const topOps = (data, now) => Object.entries(data)
  .filter(([, v]) => v !== undefined && v !== DELETE)
  .map(([k, v]) => ({ path: [k], value: resolve(v, now) }));

export async function addDoc(colRef, data) {
  const ref = doc(colRef);
  await writeDoc(ref, 'create', topOps(data, new Date()));
  return ref;
}

export async function setDoc(ref, data, opts = {}) {
  const now = new Date();
  if (opts.merge) return void await writeDoc(ref, 'merge', leafOps(data, [], now));
  return void await writeDoc(ref, 'set', topOps(data, now));
}

/** updateDoc: คีย์ "a.b" = แก้ลึก · ค่าเป็นออบเจ็กต์ = แทนทั้งก้อน (เหมือน Firestore) */
export async function updateDoc(ref, data) {
  const now = new Date();
  const ops = Object.entries(data).filter(([, v]) => v !== undefined).map(([k, v]) => {
    const path = k.split('.');
    return v === DELETE ? { path, delete: true } : { path, value: resolve(v, now) };
  });
  await writeDoc(ref, 'update', ops);
}

export async function deleteDoc(ref) {
  const { table, parent } = target(ref.parent);
  await be().remove(table, ref.id, parent);
}

export function writeBatch() {
  const jobs = [];
  const batch = {
    set: (ref, data, opts) => { jobs.push(() => setDoc(ref, data, opts)); return batch; },
    update: (ref, data) => { jobs.push(() => updateDoc(ref, data)); return batch; },
    delete: (ref) => { jobs.push(() => deleteDoc(ref)); return batch; },
    commit: async () => { for (const j of jobs) await j(); },
  };
  return batch;
}

/* ── realtime ───────────────────────────────────────────────────────── */
/** onSnapshot(docRef | collectionRef | query, next, error?) → ฟังก์ชันเลิกฟัง
    โหลดครั้งแรกทั้งชุด แล้วปรับตามเหตุการณ์ (เพิ่ม/แก้/ลบ) ที่ backend ส่งมา */
export function onSnapshot(ref, next, error) {
  const onErr = typeof error === 'function' ? error : (e) => console.error('onSnapshot', e);
  let stopped = false;
  let unsub = () => {};

  if (ref.type === 'doc') {
    const { table, parent } = target(ref.parent);
    const emit = (raw) => { if (!stopped) next(docSnap(ref, raw)); };
    unsub = be().subscribe(table, parent, (ev) => {
      if (ev.id !== ref.id) return;
      emit(ev.type === 'delete' ? null : ev.data);
    });
    be().get(table, ref.id, parent).then((row) => emit(row?.data ?? null), onErr);
    return () => { stopped = true; unsub(); };
  }

  const colRef = where_(ref);
  const { table, parent } = target(colRef);
  const rows = new Map();
  let ready = false;
  const pending = [];
  const emit = (changes) => {
    if (stopped) return;
    const docs = [...rows.entries()].map(([id, data]) => docSnap(doc(colRef, id), data));
    next(querySnap(applyConstraints(docs, ref.constraints), changes));
  };
  const apply = (ev) => {
    const existed = rows.has(ev.id);
    if (ev.type === 'delete') rows.delete(ev.id); else rows.set(ev.id, ev.data);
    const d = docSnap(doc(colRef, ev.id), ev.type === 'delete' ? null : ev.data);
    return { type: ev.type === 'delete' ? 'removed' : existed ? 'modified' : 'added', doc: d };
  };
  unsub = be().subscribe(table, parent, (ev) => {
    if (!ready) { pending.push(ev); return; }   // เหตุการณ์ระหว่างโหลดครั้งแรก — รอใส่ทีหลัง
    emit([apply(ev)]);
  });
  be().list(table, parent).then((list) => {
    list.forEach((r) => rows.set(r.id, r.data));
    ready = true;
    pending.splice(0).forEach(apply);
    emit(null);
  }, onErr);
  return () => { stopped = true; unsub(); };
}
