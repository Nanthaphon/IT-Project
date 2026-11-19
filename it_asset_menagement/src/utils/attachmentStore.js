import { getFirestore, collection, addDoc } from '../db/compat.js';
import { uploadPrivateFile } from './privateStorage.js';

export async function savePrivateAttachment(table, file, metadata, storage = {}) {
  if (!['transaction_attachments', 'asset_purchase_docs'].includes(table)) throw new Error('Unsupported attachment table');
  const storageRef = await uploadPrivateFile(file, { ...storage, folder: `admin/${table}` });
  const meta = { ...metadata, storageRef, isChunked: false, chunkCount: 0,
    fileName: file.name || metadata.fileName || 'document', fileSize: file.size, fileType: file.type };
  const ref = await addDoc(collection(getFirestore(), table), meta);
  return { id: ref.id, ...meta };
}
