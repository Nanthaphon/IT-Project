import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readRememberedEmployee, rememberEmployee } from './staffRemember.js';

const storage = () => {
  const values = new Map();
  return { getItem: (k) => values.get(k) || null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) };
};
test('remembered employee never retains legacy encoded passwords', () => {
  const store = storage();
  store.setItem('staffRemember', JSON.stringify({ empId: 'EMP001', password: 'bGVnYWN5', expiry: Date.now() + 10000 }));
  assert.equal(readRememberedEmployee(store), 'EMP001');
  assert.deepEqual(JSON.parse(store.getItem('staffRemember')), { empId: 'EMP001' });
  rememberEmployee(store, 'EMP002');
  assert.deepEqual(JSON.parse(store.getItem('staffRemember')), { empId: 'EMP002' });
});
test('expired/corrupt settings and disabled storage do not break login', () => {
  const store = storage();
  store.setItem('staffRemember', JSON.stringify({ empId: 'EMP001', password: 'old', expiry: 1 }));
  assert.equal(readRememberedEmployee(store), '');
  assert.equal(store.getItem('staffRemember'), null);
  store.setItem('staffRemember', '{');
  assert.equal(readRememberedEmployee(store), '');
  rememberEmployee(store, null);
  assert.equal(store.getItem('staffRemember'), null);
  const denied = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(readRememberedEmployee(denied), '');
  assert.doesNotThrow(() => rememberEmployee(denied, 'EMP001'));
});
