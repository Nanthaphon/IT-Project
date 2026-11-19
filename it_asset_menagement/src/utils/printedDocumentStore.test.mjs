import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configureBackend, getFirestore, doc, setDoc } from '../db/compat.js';
import { savePrintedDocument, loadPrintedDocument, uploadSignedFile, loadSignedFile } from './printedDocumentStore.js';
import { savePrivateAttachment } from './attachmentStore.js';

const memory = () => {
  const rows = new Map();
  const key = (table,id,parent) => `${table}/${parent ? `${parent.parentCollection}/${parent.parentId}/${parent.sub}/` : ''}${id}`;
  configureBackend({
    get: async (table,id,parent) => rows.get(key(table,id,parent)) || null,
    putChunk: async (parent,id,data) => rows.set(key('doc_chunks',id,parent), {id,data}),
    write: async (table,id,mode,ops) => {
      const data = mode === 'set' || mode === 'create' ? {} : structuredClone(rows.get(key(table,id))?.data || {});
      for(const op of ops) {
        let target=data;
        for(const part of op.path.slice(0,-1)) target=target[part] ||= {};
        target[op.path.at(-1)] = op.value;
      }
      rows.set(key(table,id),{id,data}); return data;
    },
  });
  return rows;
};
const storage = (fail = false) => {
  const files = new Map();
  return { client: { storage: { from: () => ({
    upload: async (path,file) => fail ? {error:{message:'upload failed'}} : (files.set(path,file), {data:{path}}),
    download: async path => ({data:files.get(path)}),
  }) } } };
};

test('legacy printed HTML and signed chunks remain readable', async () => {
  memory(); const db=getFirestore();
  await setDoc(doc(db,'printed_documents','legacy'),{chunks:2,signedFile:{chunks:1,fileName:'a.pdf',mimeType:'application/pdf'}});
  await setDoc(doc(db,'printed_documents','legacy','chunks','0'),{idx:0,data:'<h1>'});
  await setDoc(doc(db,'printed_documents','legacy','chunks','1'),{idx:1,data:'old</h1>'});
  await setDoc(doc(db,'printed_documents','legacy','signed_chunks','0'),{idx:0,data:'data:application/pdf;base64,eA=='});
  assert.equal((await loadPrintedDocument('legacy')).html,'<h1>old</h1>');
  assert.equal((await loadSignedFile('legacy')).dataUrl,'data:application/pdf;base64,eA==');
});

test('new printed HTML and signed files store stable refs and authenticate reads', async () => {
  const rows=memory(), io=storage();
  const id=await savePrintedDocument({html:'<p>new</p>',metadata:{employeeId:'e'},storage:io});
  const meta=rows.get(`printed_documents/${id}`).data;
  assert.match(meta.htmlStorageRef,/^private-storage:/);
  assert.equal(meta.chunks,0);
  assert.equal((await loadPrintedDocument(id,io)).html,'<p>new</p>');
  const file=new Blob(['pdf'],{type:'application/pdf'}); file.name='a.pdf';
  await uploadSignedFile(id,file,null,io);
  assert.match(rows.get(`printed_documents/${id}`).data.signedFile.storageRef,/^private-storage:/);
  const loaded=await loadSignedFile(id,io);
  assert.match(loaded.dataUrl,/^blob:/); loaded.release();
});

test('failed file uploads never create empty printed metadata or destroy old signed chunks', async () => {
  const rows=memory();
  await assert.rejects(savePrintedDocument({html:'old',metadata:{},storage:storage(true)}),/upload failed/);
  assert.equal(rows.size,0);
  const db=getFirestore();
  await setDoc(doc(db,'printed_documents','old'),{signedFile:{chunks:1,fileName:'old.pdf'}});
  await setDoc(doc(db,'printed_documents','old','signed_chunks','0'),{idx:0,data:'original'});
  await assert.rejects(uploadSignedFile('old',new Blob(['pdf'],{type:'application/pdf'}),null,storage(true)),/upload failed/);
  assert.equal(rows.get('printed_documents/old').data.signedFile.chunks,1);
  assert.equal(rows.get('doc_chunks/printed_documents/old/signed_chunks/0').data.data,'original');
});

test('transaction and purchase attachments only publish metadata after upload succeeds', async () => {
  const rows=memory(), file=new Blob(['pdf'],{type:'application/pdf'});
  file.name='test.pdf';
  for(const table of ['transaction_attachments','asset_purchase_docs']) {
    await assert.rejects(savePrivateAttachment(table,file,{assetId:'a'},storage(true)),/upload failed/);
    assert.equal(rows.size,0);
  }
  for(const table of ['transaction_attachments','asset_purchase_docs']) {
    const attachment=await savePrivateAttachment(table,file,{assetId:'a'},storage());
    assert.match(attachment.storageRef,/^private-storage:it-private\/admin\//);
    assert.equal(rows.get(`${table}/${attachment.id}`).data.fileSize,3);
    assert.equal(attachment.isChunked,false);
    assert.equal(attachment.fileData,undefined);
  }
});
