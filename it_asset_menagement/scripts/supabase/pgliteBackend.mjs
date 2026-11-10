/* backend ของ compat.js บน PGlite — ใช้เทสต์เท่านั้น
   รันทุกคำสั่งในนามผู้ใช้ (role + JWT claims) เหมือน PostgREST → RLS / trigger / doc_write ทำงานจริง
   realtime จำลอง: แจ้งผู้ฟังหลังเขียนผ่าน backend นี้ */
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { CHUNK_TABLE } from '../../src/db/codec.js';

const MIG_DIR = new URL('../../supabase/migrations/', import.meta.url);

export async function createTestDb() {
  const db = new PGlite();
  for (const r of ['anon', 'authenticated', 'service_role']) await db.exec(`create role ${r} nologin`);
  for (const f of readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(new URL(f, MIG_DIR), 'utf8'));
  }
  return db;
}

const asError = (e) => {
  const err = new Error(e.message);
  err.code = e.code === '42501' || /row-level security/.test(e.message) ? 'permission-denied'
    : e.code === 'P0002' ? 'not-found' : e.code === '23505' ? 'already-exists' : e.code;
  return err;
};

export function createPgliteBackend(db, claims) {
  const listeners = new Map();   // table → Set
  const notify = (table, ev) => listeners.get(table)?.forEach((fn) => fn(ev));

  const run = (sql, params = []) => db.transaction(async (tx) => {
    await tx.query(`set local role ${claims.role === 'anon' ? 'anon' : 'authenticated'}`);
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
    return tx.query(sql, params);
  }).catch((e) => { throw asError(e); });

  const parentWhere = (p, start) => ` and parent_collection = $${start} and parent_id = $${start + 1} and sub = $${start + 2}`;
  const parentArgs = (p) => [p.parentCollection, p.parentId, p.sub];

  return {
    async list(table, parent) {
      if (table === CHUNK_TABLE) {
        return (await run(`select id, data from doc_chunks where true${parentWhere(parent, 1)} order by id`, parentArgs(parent))).rows;
      }
      return (await run(`select id, data from ${table} order by id`)).rows;
    },
    async get(table, id, parent) {
      if (table === CHUNK_TABLE) {
        return (await run(`select id, data from doc_chunks where id = $1${parentWhere(parent, 2)}`, [id, ...parentArgs(parent)])).rows[0] ?? null;
      }
      return (await run(`select id, data from ${table} where id = $1`, [id])).rows[0] ?? null;
    },
    async write(table, id, mode, ops) {
      const r = await run('select public.doc_write($1, $2, $3, $4) as data', [table, id, mode, JSON.stringify(ops)]);
      notify(table, { type: 'upsert', id, data: r.rows[0].data });
      return r.rows[0].data;
    },
    async putChunk(parent, id, data) {
      await run(`insert into doc_chunks (parent_collection, parent_id, sub, id, data) values ($1, $2, $3, $4, $5)
                 on conflict (parent_collection, parent_id, sub, id) do update set data = excluded.data`,
      [...parentArgs(parent), id, JSON.stringify(data)]);
    },
    async remove(table, id, parent) {
      if (table === CHUNK_TABLE) await run(`delete from doc_chunks where id = $1${parentWhere(parent, 2)}`, [id, ...parentArgs(parent)]);
      else await run(`delete from ${table} where id = $1`, [id]);
      notify(table, { type: 'delete', id });
    },
    subscribe(table, parent, fn) {
      if (!listeners.has(table)) listeners.set(table, new Set());
      listeners.get(table).add(fn);
      return () => listeners.get(table).delete(fn);
    },
  };
}
