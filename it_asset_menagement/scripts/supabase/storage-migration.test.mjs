import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planStorageMigration, applyStorageMigration, parseStorageMigrationArgs, loadStorageMigrationSnapshots } from './storageMigration.mjs';

const fixture = () => ({ tables: {
  employees: [{id:'emp-a',data:{empId:'A'}}],
  assets:[{id:'a',data:{image:'data:image/jpeg;base64,eA==',documents:[{name:'a.pdf',data:'data:application/pdf;base64,eA=='}]}}],
  replacement_requests:[{id:'r',data:{empId:'A',photos:[{data:'data:image/jpeg;base64,eA=='}]}}],
  transaction_attachments:[{id:'t',data:{isChunked:true,chunkCount:2,fileType:'application/pdf'}}],
  printed_documents:[{id:'p',data:{chunks:1,signedFile:{chunks:1,mimeType:'application/pdf'}}}],
},chunks:[
  {parent_collection:'transaction_attachments',parent_id:'t',sub:'chunks',id:'c0',data:{index:0,data:'eA'}},
  {parent_collection:'transaction_attachments',parent_id:'t',sub:'chunks',id:'c1',data:{index:1,data:'=='}},
  {parent_collection:'printed_documents',parent_id:'p',sub:'chunks',id:'0',data:{idx:0,data:'<html>old</html>'}},
  {parent_collection:'printed_documents',parent_id:'p',sub:'signed_chunks',id:'0',data:{idx:0,data:'data:application/pdf;base64,eA=='}},
]});

test('dry-run discovers all photo, nested document, attachment and printed paths without writes', () => {
  const snapshot=fixture(), original=JSON.stringify(snapshot);
  const plan=planStorageMigration(snapshot);
  assert.equal(plan.documents.length,4);
  assert.equal(plan.summary.files,6);
  assert.equal(plan.summary.deferred,0);
  assert.equal(JSON.stringify(snapshot),original);
  assert.ok(plan.documents.find(d=>d.table==='assets').files.some(f=>f.path.startsWith('catalog/')));
  assert.ok(plan.documents.find(d=>d.table==='replacement_requests').files[0].path.startsWith('staff/'));
});

test('apply requires durable backup; upload/download hashes verify before CAS and never delete chunks', async () => {
  const snapshot=fixture(), plan=planStorageMigration(snapshot), order=[], objects=new Map();
  const client={storage:{from:()=>({upload:async(path,bytes)=>{order.push('upload');objects.set(path,bytes);return {};},
    download:async path=>({data:new Blob([objects.get(path)])})})},rpc:async(name,args)=>{order.push('cas');assert.equal(name,'storage_migrate_document');assert.ok(args.p_expected);return {data:true};}};
  await assert.rejects(applyStorageMigration(plan,{client}),/backup/);
  const result=await applyStorageMigration(plan,{client,backup:async()=>order.push('backup')});
  assert.equal(order[0],'backup');
  assert.equal(result.updated,4);
  assert.equal(snapshot.chunks.length,4);
});

test('corrupt download never replaces metadata; CAS conflicts are reported for retry', async () => {
  const plan=planStorageMigration(fixture());let writes=0;
  const client={storage:{from:()=>({upload:async()=>({}),download:async()=>({data:new Blob(['corrupt'])})})},rpc:async()=>{writes++;return {data:false};}};
  await assert.rejects(applyStorageMigration(plan,{client,backup:async()=>{}}),/SHA-256/);
  assert.equal(writes,0);
  const objects=new Map();
  client.storage.from=()=>({upload:async(path,data)=>{objects.set(path,data);return {};},download:async path=>({data:new Blob([objects.get(path)])})});
  const result=await applyStorageMigration(plan,{client,backup:async()=>{}});
  assert.equal(result.conflicts,4);
  assert.equal(result.updated,0);
});

test('missing chunks and ambiguous staff owners stop or defer safely', () => {
  const broken=fixture();broken.chunks.pop();
  assert.throws(()=>planStorageMigration(broken),/chunk/);
  const snapshot=fixture();snapshot.tables.employees.push({id:'duplicate',data:{empId:'A'}});
  const plan=planStorageMigration(snapshot);
  assert.equal(plan.summary.deferred,1);
  assert.equal(plan.documents.some(d=>d.table==='replacement_requests'),false);
});

test('retry reuses verified immutable objects; rollback uses reverse CAS and never changes Storage', async () => {
  const plan=planStorageMigration(fixture()),objects=new Map();let downloads=0,rollbacks=0;
  const client={storage:{from:()=>({
    upload:async(path,bytes)=>objects.has(path)?{error:{message:'The resource already exists'}}:(objects.set(path,bytes),{}),
    download:async path=>{downloads++;return {data:new Blob([objects.get(path)])};},
  })},rpc:async()=>({data:true})};
  await applyStorageMigration(plan,{client,backup:async()=>{}});
  await applyStorageMigration(plan,{client,backup:async()=>{}});
  assert.equal(objects.size,6);assert.equal(downloads,12);
  client.rpc=async(name,args)=>{
    const original=plan.documents.find(d=>d.table===args.p_table && d.id===args.p_id);
    assert.deepEqual(args.p_expected,original.replacement);
    assert.deepEqual(args.p_replacement,original.expected);
    rollbacks++;return {data:true};
  };
  await applyStorageMigration(plan,{client,backup:async()=>{},rollback:true});
  assert.equal(rollbacks,4);assert.equal(downloads,12);
  const already={tables:Object.fromEntries(plan.documents.map(d=>[d.table,[{id:d.id,data:d.replacement}]])),chunks:fixture().chunks};
  assert.equal(planStorageMigration(already).summary.files,0);
});

test('rollback apply plans from the original backup but durably backs up fresh live state', async () => {
  const original=fixture(), live={tables:{assets:[{id:'new-live',data:{name:'latest'}}]},chunks:[]};
  const order=[];
  const snapshots=await loadStorageMigrationSnapshots({file:'old-backup.json',apply:true,rollback:true},{
    readFileSnapshot:async file=>{order.push('read-source');assert.equal(file,'old-backup.json');return original;},
    takeLiveSnapshot:async()=>{order.push('read-live');return live;},
  });
  assert.equal(snapshots.planSource,original);
  assert.equal(snapshots.backupSnapshot,live);
  const plan=planStorageMigration(snapshots.planSource);
  const client={rpc:async()=>{order.push('mutation');return {data:true};}};
  await applyStorageMigration(plan,{client,rollback:true,backup:async()=>{
    assert.equal(snapshots.backupSnapshot,live);order.push('durable-live-backup');
  }});
  assert.deepEqual(order.slice(0,4),['read-source','read-live','durable-live-backup','mutation']);
});

test('offline rollback/snapshot dry-runs do not request live data', async () => {
  const old=fixture();
  const loaded=await loadStorageMigrationSnapshots({file:'offline.json',apply:false,rollback:true},{
    readFileSnapshot:async()=>old,
    takeLiveSnapshot:async()=>assert.fail('offline dry-run must not access live data'),
  });
  assert.equal(loaded.planSource,old);
  assert.equal(loaded.backupSnapshot,null);
});

test('CLI rejects missing file arguments, conflicting modes and unknown options before live access', () => {
  for(const args of [['--snapshot'],['--rollback'],['--snapshot','--apply'],['--rollback','--dry-run'],
    ['--snapshot',''],['--snapshot','old.json','--rollback','other.json'],['--apply','--dry-run'],['--typo']]) {
    assert.throws(()=>parseStorageMigrationArgs(args),/argument|exclusive|unknown|dry-run/i);
  }
  assert.deepEqual(parseStorageMigrationArgs(['--rollback','old.json','--apply']),{apply:true,rollback:true,file:'old.json'});
  assert.deepEqual(parseStorageMigrationArgs(['--snapshot','old.json']),{apply:false,rollback:false,file:'old.json'});
});
