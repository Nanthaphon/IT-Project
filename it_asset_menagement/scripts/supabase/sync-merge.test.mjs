import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeRow, planSync } from './syncMerge.mjs';

test('Firebase-only field change is taken; Supabase-only change is kept', () => {
  const base = { name: 'A', photo: 'data:base64', qty: 1 };
  const fb = { name: 'A', photo: 'data:base64', qty: 2 };
  const sb = { name: 'A', photo: { bucket: 'it-private', path: 'x' }, qty: 1 };
  assert.deepEqual(mergeRow(base, fb, sb), { kind: 'update', data: { name: 'A', photo: { bucket: 'it-private', path: 'x' }, qty: 2 }, conflicts: [] });
});

test('field changed on both sides differently keeps Supabase and reports conflict', () => {
  const r = mergeRow({ a: 1, b: 1 }, { a: 2, b: 2 }, { a: 3, b: 1 });
  assert.equal(r.kind, 'update');
  assert.equal(r.data.a, 3);
  assert.equal(r.data.b, 2);
  assert.deepEqual(r.conflicts, ['a']);
  assert.deepEqual(mergeRow({ a: 1 }, { a: 2 }, { a: 3 }), { kind: 'conflict', fields: ['a'] });
});

test('field removed in Firebase is removed when Supabase did not touch it', () => {
  assert.deepEqual(mergeRow({ a: 1, b: 1 }, { a: 1 }, { a: 1, b: 1 }).data, { a: 1 });
});

test('row level: insert new, keep Supabase-only, delete only untouched rows', () => {
  assert.equal(mergeRow(undefined, { a: 1 }, undefined).kind, 'insert');
  assert.equal(mergeRow(undefined, undefined, { a: 1 }).kind, 'keep');
  assert.equal(mergeRow({ a: 1 }, undefined, { a: 1 }).kind, 'delete');
  assert.equal(mergeRow({ a: 1 }, undefined, { a: 2 }).kind, 'conflict');
  assert.equal(mergeRow({ a: 1 }, { a: 2 }, undefined).kind, 'keep');
  assert.equal(mergeRow({ a: 1 }, { a: 1 }, { a: 1 }).kind, 'keep');
});

test('plan skips admin_users and handles chunks insert/delete', () => {
  const dump = (rows, chunks = []) => ({ tables: { assets: rows, admin_users: [{ id: 'x', data: { email: 'a' } }] }, chunks });
  const c = (id, d) => ({ parent_collection: 'assets', parent_id: 'p', sub: 's', id, data: d });
  const plan = planSync({
    base: dump([{ id: '1', data: { a: 1 } }], [c('old', { v: 1 })]),
    firebase: dump([{ id: '1', data: { a: 2 } }, { id: '2', data: { a: 1 } }], [c('new', { v: 2 })]),
    supabase: dump([{ id: '1', data: { a: 1 }, updated_at: 't' }], [c('old', { v: 1 })]),
    tables: ['assets', 'admin_users'],
  });
  assert.equal(plan.tables.admin_users, undefined);
  assert.equal(plan.tables.assets.inserts.length, 1);
  assert.equal(plan.tables.assets.updates[0].updated_at, 't');
  assert.equal(plan.chunks.inserts.length, 1);
  assert.equal(plan.chunks.deletes.length, 1);
});
