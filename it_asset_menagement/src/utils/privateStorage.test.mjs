import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storageReference, parseStorageReference, uploadPrivateFile, downloadPrivateFile, dataUrlToBlob, resolveHtmlStorageReferences } from './privateStorage.js';

test('stable refs reject traversal/public URLs and round trip without bearer tokens', () => {
  const ref = storageReference('admin/photos/a.jpg');
  assert.equal(ref, 'private-storage:it-private/admin/photos/a.jpg');
  assert.equal(parseStorageReference(ref).path, 'admin/photos/a.jpg');
  assert.equal(parseStorageReference('https://public/file'), null);
  assert.equal(parseStorageReference('private-storage:it-private/admin/../secret'), null);
  assert.throws(() => storageReference('../secret'), /path/);
});

test('failed upload rejects before any metadata/reference is returned', async () => {
  const client = { storage: { from: () => ({ upload: async () => ({ error: { message: 'denied' } }) }) } };
  await assert.rejects(uploadPrivateFile(new Blob(['x'], { type: 'image/jpeg' }), { client, path: 'admin/photos/a.jpg' }), /denied/);
});

test('upload stores stable reference and reads through authenticated download', async () => {
  const bytes = new Blob(['jpeg'], { type: 'image/jpeg' });
  let saved;
  const client = { storage: { from: bucket => ({
    upload: async (path, file, options) => { saved = { bucket, path, file, options }; return { data: { path } }; },
    download: async () => ({ data: bytes }),
  }) } };
  const ref = await uploadPrivateFile(bytes, { client, path: 'catalog/photos/a.jpg' });
  assert.equal(saved.options.upsert, false);
  assert.equal(saved.bucket, 'it-private');
  assert.equal(await (await downloadPrivateFile(ref, { client })).text(), 'jpeg');
  assert.ok(!ref.includes('token='));
});

test('legacy data URLs remain readable; active file types are refused', async () => {
  assert.equal(await dataUrlToBlob('data:image/png;base64,eA==').text(), 'x');
  await assert.rejects(uploadPrivateFile(new Blob(['<svg/>'], { type: 'image/svg+xml' }), { client: {} }), /ชนิดไฟล์/);
});

test('HTML resolves repeated storage references once without mutating persisted HTML', async () => {
  const ref = storageReference('admin/photos/a.jpg');
  const html = `<img src="${ref}"><img src="${ref}">`;
  let calls = 0;
  const out = await resolveHtmlStorageReferences(html, async value => { calls++; assert.equal(value, ref); return 'blob:test'; });
  assert.equal(calls, 1);
  assert.equal(out, '<img src="blob:test"><img src="blob:test">');
  assert.ok(html.includes('private-storage:'));
});
