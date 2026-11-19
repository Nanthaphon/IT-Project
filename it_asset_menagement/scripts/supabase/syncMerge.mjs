/* ซิงก์ข้อมูลใหม่จาก Firebase → Supabase แบบสามทาง (ฐาน = export ที่เคยนำเข้า)

   ระดับฟิลด์ของแต่ละแถว:
   - Firebase แก้ · Supabase ไม่แก้  → เอาค่า Firebase
   - Supabase แก้ · Firebase ไม่แก้  → คงค่า Supabase (ไฟล์ที่ย้ายเข้า Storage · flag รหัสผ่าน · งานที่ทำบน gbos.app)
   - แก้ทั้งสองฝั่งไม่ตรงกัน         → คงค่า Supabase + รายงาน conflict (ไม่ทับ)
   ระดับแถว:
   - Firebase สร้างใหม่ ไม่มีใน Supabase → เพิ่ม
   - Firebase ลบ · Supabase ยังเท่าฐาน   → ลบ (สำรองไว้ก่อน) · Supabase แก้แล้ว = conflict ไม่ลบ
   - Supabase ลบ / สร้างเอง               → ไม่แตะ */

export const stable = (v) => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));
const same = (a, b) => stable(a) === stable(b);

/* ไฟล์ที่ migrate-private-storage ย้ายแล้ว: ฐานเป็น base64 (data:…) · Supabase เป็น private-storage:… ตำแหน่งเดียวกัน
   = ไม่ใช่การแก้ของคน → ถือว่าเท่าฐาน (ค่าที่เก็บยังเป็น reference ของ Supabase) */
const REF = /^private-storage:/;
const DATA = /^data:/;
function sameModuloStorage(sb, base) {
  if (typeof sb === 'string' && typeof base === 'string') return sb === base || (REF.test(sb) && DATA.test(base));
  if (Array.isArray(sb) && Array.isArray(base)) return sb.length === base.length && sb.every((v, i) => sameModuloStorage(v, base[i]));
  if (sb && base && typeof sb === 'object' && typeof base === 'object') {
    const keys = new Set([...Object.keys(sb), ...Object.keys(base)]);
    return [...keys].every((k) => sameModuloStorage(sb[k], base[k]));
  }
  return same(sb, base);
}

// admin_users ใช้ uid คนละชุด (Firebase ↔ Supabase Auth) — จัดการด้วย import-to-supabase เท่านั้น
export const SKIP_TABLES = new Set(['admin_users']);
export const chunkKey = (r) => [r.parent_collection, r.parent_id, r.sub, r.id].join('/');

export function mergeRow(base, fb, sb) {
  if (!fb && !base) return { kind: 'keep' };                                 // สร้างบน Supabase เอง
  if (fb && !base && !sb) return { kind: 'insert', data: fb };
  if (fb && !base && sb) return same(fb, sb) ? { kind: 'keep' } : { kind: 'conflict', fields: diffKeys(fb, sb) };
  if (base && !fb) {
    if (!sb) return { kind: 'keep' };
    return sameModuloStorage(sb, base) ? { kind: 'delete' } : { kind: 'conflict', fields: ['(ลบใน Firebase แต่แก้ใน Supabase)'] };
  }
  if (!sb) return { kind: 'keep' };                                          // ลบใน Supabase แล้ว
  const out = { ...sb };
  const conflicts = [];
  let changed = false;
  for (const k of new Set([...Object.keys(base), ...Object.keys(fb), ...Object.keys(sb)])) {
    if (same(fb[k], base[k]) || same(fb[k], sb[k])) continue;
    if (sameModuloStorage(sb[k], base[k])) {
      if (fb[k] === undefined) delete out[k]; else out[k] = fb[k];
      changed = true;
    } else conflicts.push(k);
  }
  if (!changed) return conflicts.length ? { kind: 'conflict', fields: conflicts } : { kind: 'keep' };
  return { kind: 'update', data: out, conflicts };
}

const diffKeys = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !same(a[k], b[k]));

/* คืนแผน: ต่อตาราง { inserts, updates, deletes, conflicts } — updates/deletes พก updated_at ของ Supabase ไว้ทำ CAS */
export function planSync({ base, firebase, supabase, tables }) {
  const plan = { tables: {}, chunks: { inserts: [], deletes: [], conflicts: [] }, summary: [] };
  for (const table of tables) {
    if (SKIP_TABLES.has(table)) continue;
    const idx = (d) => new Map((d.tables[table] || []).map((r) => [r.id, r]));
    const [b, f, s] = [idx(base), idx(firebase), idx(supabase)];
    const t = { inserts: [], updates: [], deletes: [], conflicts: [] };
    for (const id of new Set([...b.keys(), ...f.keys(), ...s.keys()])) {
      const r = mergeRow(b.get(id)?.data, f.get(id)?.data, s.get(id)?.data);
      if (r.kind === 'insert') t.inserts.push({ id, data: r.data });
      else if (r.kind === 'update') {
        t.updates.push({ id, data: r.data, before: s.get(id).data, updated_at: s.get(id).updated_at });
        if (r.conflicts.length) t.conflicts.push({ id, fields: r.conflicts, partial: true });
      } else if (r.kind === 'delete') t.deletes.push({ id, before: s.get(id).data, updated_at: s.get(id).updated_at });
      else if (r.kind === 'conflict') t.conflicts.push({ id, fields: r.fields });
    }
    plan.tables[table] = t;
    plan.summary.push({ table, insert: t.inserts.length, update: t.updates.length, delete: t.deletes.length, conflict: t.conflicts.length });
  }
  // ชิ้นไฟล์ (doc_chunks): ไม่แก้ในที่ — เพิ่มชิ้นใหม่ / ลบชิ้นที่ Firebase ลบและ Supabase ยังเท่าฐาน
  const cidx = (d) => new Map((d.chunks || []).map((r) => [chunkKey(r), r]));
  const [cb, cf, cs] = [cidx(base), cidx(firebase), cidx(supabase)];
  for (const k of new Set([...cb.keys(), ...cf.keys(), ...cs.keys()])) {
    const r = mergeRow(cb.get(k)?.data, cf.get(k)?.data, cs.get(k)?.data);
    if (r.kind === 'insert') plan.chunks.inserts.push(cf.get(k));
    else if (r.kind === 'delete') plan.chunks.deletes.push(cs.get(k));
    else if (r.kind === 'conflict' || r.kind === 'update') plan.chunks.conflicts.push({ key: k });
  }
  plan.summary.push({ table: 'doc_chunks', insert: plan.chunks.inserts.length, update: 0, delete: plan.chunks.deletes.length, conflict: plan.chunks.conflicts.length });
  return plan;
}
