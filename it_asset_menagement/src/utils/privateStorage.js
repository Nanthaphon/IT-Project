// Persist only these stable references. Authenticated reads return short-lived
// browser Blob URLs; no public or expiring bearer URLs are stored in documents.
export const STORAGE_BUCKET = 'it-private';
const PREFIX = `private-storage:${STORAGE_BUCKET}/`;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
export const MAX_STORAGE_BYTES = 16 * 1024 * 1024;

export function storageReference(path) {
  if (typeof path !== 'string' || !/^(admin|catalog|staff)\/[A-Za-z0-9_./-]+$/.test(path)
    || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid storage path');
  return PREFIX + path;
}

export function parseStorageReference(value) {
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return null;
  const path = value.slice(PREFIX.length);
  try { storageReference(path); } catch { return null; }
  return { bucket: STORAGE_BUCKET, path };
}

async function getClient(client) {
  return client || (await import('../db/supabaseClient.js')).supabase;
}

export function dataUrlToBlob(value) {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(value || '');
  if (!match) throw new Error('รูปแบบไฟล์ไม่ถูกต้อง');
  const bytes = match[2] ? Uint8Array.from(atob(match[3]), ch => ch.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(match[3]));
  return new Blob([bytes], { type: match[1] || 'application/octet-stream' });
}

export function validateStorageFile(file, { internalHtml = false } = {}) {
  const type = String(file?.type || '').toLowerCase();
  if (!MIME_TYPES.has(type) && !(internalHtml && type === 'application/octet-stream')) {
    throw new Error('ชนิดไฟล์ไม่รองรับ — ใช้ PDF, JPG, PNG, WebP หรือ GIF');
  }
  if (!file.size || file.size > MAX_STORAGE_BYTES) throw new Error('ไฟล์ว่างหรือใหญ่เกิน 16 MB');
}

export async function uploadPrivateFile(file, { client, path, folder = 'admin/files', internalHtml = false } = {}) {
  validateStorageFile(file, { internalHtml });
  const target = path || `${folder}/${crypto.randomUUID()}`;
  const ref = storageReference(target);
  const sb = await getClient(client);
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(target, file, {
    contentType: file.type, upsert: false, cacheControl: '0',
  });
  if (error) throw new Error(error.message || 'อัปโหลดไฟล์ไม่สำเร็จ');
  return ref;
}

export async function downloadPrivateFile(reference, { client } = {}) {
  const parsed = parseStorageReference(reference);
  if (!parsed) throw new Error('ไม่ใช่ไฟล์ในพื้นที่จัดเก็บส่วนตัว');
  const sb = await getClient(client);
  const { data, error } = await sb.storage.from(parsed.bucket).download(parsed.path);
  if (error || !data) throw new Error(error?.message || 'โหลดไฟล์ไม่สำเร็จ');
  return data;
}

export async function resolvePrivateUrl(value) {
  if (!parseStorageReference(value)) return { url: value, release() {} };
  const blob = await downloadPrivateFile(value);
  const url = URL.createObjectURL(blob);
  return { url, release: () => URL.revokeObjectURL(url) };
}

export async function downloadPrivateAttachment(reference, fileName = 'document') {
  const { url, release } = await resolvePrivateUrl(reference);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(release, 30_000);
}

export async function resolveHtmlStorageReferences(html, resolve) {
  const refs = [...new Set(String(html).match(/private-storage:it-private\/[A-Za-z0-9_./-]+/g) || [])];
  let out = html;
  for (const ref of refs) out = out.split(ref).join(await resolve(ref));
  return out;
}

export async function uploadPhotoDataUrl(dataUrl, folder = 'admin/photos') {
  return uploadPrivateFile(dataUrlToBlob(dataUrl), { folder });
}
