import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseProblems, REQUIRED_RELEASE_RPCS } from './release-gate.mjs';
const ready = () => ({ rpcNames: [...REQUIRED_RELEASE_RPCS], buckets: [{ id: 'it-private', public: false }], disableSignup: true, recoverablePasswords: 0, unknownPasswordFlags: 0 });
test('release blocks absent schema, public files, signup and leftover recoverable passwords', () => {
  for (const patch of [{ rpcNames: [] }, { buckets: [{ id: 'it-private', public: true }] }, { buckets: [] }, { disableSignup: false }, { recoverablePasswords: 1 }, { unknownPasswordFlags: 1 }]) {
    assert.ok(releaseProblems({ ...ready(), ...patch }).length > 0);
  }
});
test('unknown checks block release; a complete verified state passes', () => {
  assert.ok(releaseProblems({}).length > 0);
  assert.deepEqual(releaseProblems(ready()), []);
});
