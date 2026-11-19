// Binary content lives in private Storage. Metadata keeps stable references;
// legacy chunk reads stay available throughout migration and rollback.
import {
  collection, doc, setDoc, getDoc, getDocs, getFirestore,
  query, where, serverTimestamp, deleteDoc,
} from '../db/compat.js';
import { uploadPrivateFile, downloadPrivateFile } from './privateStorage.js';
const db = getFirestore();

export async function savePrintedDocument({ html, metadata, storage = {} }) {
  if (!html || typeof html !== 'string') throw new Error('html ต้องเป็น string');
  const ref = doc(collection(db, 'printed_documents'));
  const file = new Blob([html], { type: 'application/octet-stream' });
  const htmlStorageRef = await uploadPrivateFile(file, {
    ...storage, folder: 'admin/printed-html', internalHtml: true,
  });
  // No incomplete document can appear if upload fails.
  await setDoc(ref, { ...metadata, sizeBytes: file.size, chunks: 0,
    htmlStorageRef, createdAt: serverTimestamp() });
  return ref.id;
}

async function readLegacyChunks(docId, sub, count) {
  let text = '';
  for (let i = 0; i < Number(count || 0); i++) {
    const chunk = await getDoc(doc(db, 'printed_documents', docId, sub, String(i)));
    if (!chunk.exists()) throw new Error('ข้อมูลเอกสารเดิมไม่ครบ — กรุณาติดต่อ IT');
    text += chunk.data().data || '';
  }
  return text;
}

export async function loadPrintedDocument(docId, storage = {}) {
  const snap = await getDoc(doc(db, 'printed_documents', docId));
  if (!snap.exists()) throw new Error('ไม่พบเอกสาร');
  const meta = snap.data();
  const html = meta.htmlStorageRef
    ? await (await downloadPrivateFile(meta.htmlStorageRef, storage)).text()
    : await readLegacyChunks(docId, 'chunks', meta.chunks);
  return { meta, html };
}

export async function listPrintedDocumentsByEmployee(employeeId) {
  if (!employeeId) return [];
  const snap = await getDocs(query(collection(db, 'printed_documents'), where('employeeId', '==', employeeId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function deletePrintedDocument(docId) {
  const snap = await getDoc(doc(db, 'printed_documents', docId));
  if (!snap.exists()) return;
  const meta = snap.data();
  for (const [sub,count] of [['chunks',meta.chunks],['signed_chunks',meta.signedFile?.chunks]]) {
    for (let i=0; i<Number(count || 0); i++) {
      await deleteDoc(doc(db, 'printed_documents', docId, sub, String(i)));
    }
  }
  await deleteDoc(doc(db, 'printed_documents', docId));
  // Storage objects are immutable and may still be referenced by saved forms
  // or migration rollback backups; garbage collection is a separate operation.
}

export async function uploadSignedFile(docId, file, uploadedByUid = null, storage = {}) {
  if (!docId || !file) throw new Error('docId/file required');
  if (file.size > 15 * 1024 * 1024) throw new Error('ไฟล์ใหญ่เกิน 15 MB');
  const ref = doc(db, 'printed_documents', docId);
  if (!(await getDoc(ref)).exists()) throw new Error('ไม่พบเอกสาร');
  const storageRef = await uploadPrivateFile(file, { ...storage, folder: 'admin/signed-files' });
  // Preserve the previous file and legacy chunks if either step fails.
  await setDoc(ref, { signedFile: { storageRef, chunks: 0, fileName: file.name || 'signed-doc',
    mimeType: file.type, sizeBytes: file.size, uploadedAt: serverTimestamp(),
    uploadedBy: uploadedByUid || null } }, { merge: true });
}

export async function loadSignedFile(docId, storage = {}) {
  const snap = await getDoc(doc(db, 'printed_documents', docId));
  if (!snap.exists()) throw new Error('ไม่พบเอกสาร');
  const signed = snap.data().signedFile;
  if (!signed) throw new Error('ไม่มีไฟล์เซ็นแล้ว');
  let dataUrl, release = () => {};
  if (signed.storageRef) {
    const blob = await downloadPrivateFile(signed.storageRef, storage);
    dataUrl = URL.createObjectURL(blob);
    release = () => URL.revokeObjectURL(dataUrl);
  } else dataUrl = await readLegacyChunks(docId, 'signed_chunks', signed.chunks);
  return { dataUrl, release, fileName: signed.fileName || 'signed-doc',
    mimeType: signed.mimeType || 'application/octet-stream' };
}

export async function deleteSignedFile(docId) {
  const ref = doc(db, 'printed_documents', docId);
  if (!(await getDoc(ref)).exists()) return;
  await setDoc(ref, { signedFile: null }, { merge: true });
}
