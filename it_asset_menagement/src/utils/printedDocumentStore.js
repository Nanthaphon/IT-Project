/* ════════════════════════════════════════════════════════════════════════
   printedDocumentStore — บันทึก/โหลด เอกสารที่พิมพ์แล้ว เก็บใน Firestore
   ────────────────────────────────────────────────────────────────────────
   เนื่องจาก HTML ของฟอร์ม (พร้อมรูป base64) มักเกิน 1MB → ใช้ chunking
   เก็บที่: printed_documents/{docId} (metadata) + chunks subcollection
   ════════════════════════════════════════════════════════════════════════ */

import { db } from '../firebase.js';
import {
  collection, addDoc, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, serverTimestamp, deleteDoc,
} from 'firebase/firestore';

const CHUNK_SIZE = 700_000;  // 700KB/chunk — เผื่อ headroom จาก Firestore 1MB limit

/**
 * savePrintedDocument
 * บันทึก HTML ของเอกสารที่พิมพ์แล้วเข้า Firestore (chunked)
 *
 * @param {object} args
 * @param {string} args.html      - HTML string ของเอกสาร
 * @param {object} args.metadata  - { employeeId, employeeName, formType, docNumber,
 *                                    assetIds[], formDate, printedByUid, etc. }
 * @returns {Promise<string>}      - docId ของรายการที่บันทึก
 */
export async function savePrintedDocument({ html, metadata }) {
  if (!html || typeof html !== 'string') throw new Error('html ต้องเป็น string');

  // ── สร้าง metadata doc ก่อน (รับ ID จาก Firestore) ──
  const metaRef = await addDoc(collection(db, 'printed_documents'), {
    ...metadata,
    sizeBytes: html.length,
    chunks: 0,
    createdAt: serverTimestamp(),
  });

  // ── chunk HTML ──
  const chunks = [];
  for (let i = 0; i < html.length; i += CHUNK_SIZE) {
    chunks.push(html.slice(i, i + CHUNK_SIZE));
  }

  // ── เขียนแต่ละ chunk ลง subcollection ──
  for (let i = 0; i < chunks.length; i++) {
    await setDoc(
      doc(db, 'printed_documents', metaRef.id, 'chunks', String(i)),
      { idx: i, data: chunks[i] },
    );
  }

  // ── update metadata ด้วย chunk count ──
  await setDoc(
    doc(db, 'printed_documents', metaRef.id),
    { chunks: chunks.length },
    { merge: true },
  );

  return metaRef.id;
}

/**
 * loadPrintedDocument
 * โหลด HTML กลับจาก Firestore (ประกอบ chunks กลับ)
 *
 * @param {string} docId
 * @returns {Promise<{ meta: object, html: string }>}
 */
export async function loadPrintedDocument(docId) {
  const metaSnap = await getDoc(doc(db, 'printed_documents', docId));
  if (!metaSnap.exists()) throw new Error('ไม่พบเอกสาร');
  const meta = metaSnap.data();

  let html = '';
  for (let i = 0; i < (meta.chunks || 0); i++) {
    const chunkSnap = await getDoc(
      doc(db, 'printed_documents', docId, 'chunks', String(i)),
    );
    if (chunkSnap.exists()) html += chunkSnap.data().data || '';
  }

  return { meta, html };
}

/**
 * listPrintedDocumentsByEmployee
 * ดึงรายการเอกสารที่พิมพ์แล้วของพนักงาน (เรียงใหม่ → เก่า)
 *
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
export async function listPrintedDocumentsByEmployee(employeeId) {
  if (!employeeId) return [];
  const q = query(
    collection(db, 'printed_documents'),
    where('employeeId', '==', employeeId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

/**
 * deletePrintedDocument
 * ลบเอกสารที่พิมพ์แล้ว (พร้อม chunks ทั้งหมด)
 *
 * @param {string} docId
 */
export async function deletePrintedDocument(docId) {
  // โหลด metadata เพื่อรู้จำนวน chunks
  const metaSnap = await getDoc(doc(db, 'printed_documents', docId));
  if (!metaSnap.exists()) {
    await deleteDoc(doc(db, 'printed_documents', docId));
    return;
  }
  const meta = metaSnap.data();
  const htmlChunks = Number(meta.chunks || 0);
  const signedChunks = Number(meta.signedFile?.chunks || 0);

  for (let i = 0; i < htmlChunks; i++) {
    try { await deleteDoc(doc(db, 'printed_documents', docId, 'chunks', String(i))); } catch { /* ignore */ }
  }
  for (let i = 0; i < signedChunks; i++) {
    try { await deleteDoc(doc(db, 'printed_documents', docId, 'signed_chunks', String(i))); } catch { /* ignore */ }
  }

  await deleteDoc(doc(db, 'printed_documents', docId));
}

/* ════════════════════════════════════════════════════════════════════════
   Signed File — ไฟล์เซ็นชื่อแล้ว (สแกน/ถ่ายรูป) แนบเข้าระบบ
   ════════════════════════════════════════════════════════════════════════ */

/**
 * uploadSignedFile
 * อัปโหลดไฟล์เซ็นแล้ว (PDF/JPG/PNG) ผูกกับ printed_documents/{docId}
 *
 * @param {string} docId
 * @param {File}   file        - File object จาก input[type=file]
 * @param {string} [uploadedByUid]
 * @returns {Promise<void>}
 */
export async function uploadSignedFile(docId, file, uploadedByUid = null) {
  if (!docId || !file) throw new Error('docId/file required');
  const MAX_BYTES = 15 * 1024 * 1024; // จำกัด 15 MB
  if (file.size > MAX_BYTES) throw new Error('ไฟล์ใหญ่เกิน 15 MB');

  // อ่านเป็น base64 (data URL)
  const base64 = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  // ลบ chunks เก่าก่อน (ถ้ามี — กรณี re-upload)
  const metaSnap = await getDoc(doc(db, 'printed_documents', docId));
  const oldChunks = Number(metaSnap.exists() ? (metaSnap.data().signedFile?.chunks || 0) : 0);
  for (let i = 0; i < oldChunks; i++) {
    try { await deleteDoc(doc(db, 'printed_documents', docId, 'signed_chunks', String(i))); } catch { /* ignore */ }
  }

  // chunk + เขียนใหม่
  const chunks = [];
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }
  for (let i = 0; i < chunks.length; i++) {
    await setDoc(
      doc(db, 'printed_documents', docId, 'signed_chunks', String(i)),
      { idx: i, data: chunks[i] },
    );
  }

  // update metadata
  await setDoc(
    doc(db, 'printed_documents', docId),
    {
      signedFile: {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        chunks: chunks.length,
        uploadedAt: serverTimestamp(),
        uploadedBy: uploadedByUid || null,
      },
    },
    { merge: true },
  );
}

/**
 * loadSignedFile
 * โหลดไฟล์เซ็นกลับ → return { dataUrl, fileName, mimeType }
 *
 * @param {string} docId
 */
export async function loadSignedFile(docId) {
  const metaSnap = await getDoc(doc(db, 'printed_documents', docId));
  if (!metaSnap.exists()) throw new Error('ไม่พบเอกสาร');
  const meta = metaSnap.data();
  if (!meta.signedFile) throw new Error('ไม่มีไฟล์เซ็นแล้ว');

  const chunks = Number(meta.signedFile.chunks || 0);
  let dataUrl = '';
  for (let i = 0; i < chunks; i++) {
    const c = await getDoc(doc(db, 'printed_documents', docId, 'signed_chunks', String(i)));
    if (c.exists()) dataUrl += c.data().data || '';
  }

  return {
    dataUrl,
    fileName: meta.signedFile.fileName || 'signed-doc',
    mimeType: meta.signedFile.mimeType || 'application/octet-stream',
  };
}

/**
 * deleteSignedFile
 * ลบเฉพาะไฟล์เซ็น (เก็บ metadata + HTML auto-save ไว้)
 *
 * @param {string} docId
 */
export async function deleteSignedFile(docId) {
  const metaSnap = await getDoc(doc(db, 'printed_documents', docId));
  if (!metaSnap.exists()) return;
  const chunks = Number(metaSnap.data().signedFile?.chunks || 0);
  for (let i = 0; i < chunks; i++) {
    try { await deleteDoc(doc(db, 'printed_documents', docId, 'signed_chunks', String(i))); } catch { /* ignore */ }
  }
  // clear signedFile field
  await setDoc(doc(db, 'printed_documents', docId), { signedFile: null }, { merge: true });
}
