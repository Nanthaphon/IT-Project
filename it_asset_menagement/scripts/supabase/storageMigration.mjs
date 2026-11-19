import { createHash } from 'node:crypto';
import { staffUid } from '../../api/_lib/supabaseAdmin.js';
import { storageReference, STORAGE_BUCKET, MAX_STORAGE_BYTES } from '../../src/utils/privateStorage.js';

export const STORAGE_TABLES = ['assets','accessories','licenses','office_supplies','bundled_items',
  'employees','deleted_employees','repair_requests','replacement_requests','accessory_requests',
  'supply_requests','assets_transactions','accessories_transactions','licenses_transactions',
  'transaction_attachments','asset_purchase_docs','printed_documents','asset_handovers','it_report','settings'];
const requestTables = new Set(['repair_requests','replacement_requests','accessory_requests','supply_requests']);
const catalogTables = new Set(['assets','accessories','licenses','office_supplies','bundled_items']);
const safeTypes = new Set(['image/jpeg','image/png','image/webp','image/gif','application/pdf']);
const sha = value => createHash('sha256').update(value).digest('hex');

export function parseStorageMigrationArgs(args) {
  let apply=false,rollback=false,file=null,dryRun=false;
  const seen=new Set();
  for(let i=0;i<args.length;i++) {
    const arg=args[i];
    if(seen.has(arg)) throw new Error('Duplicate argument');
    seen.add(arg);
    if(arg==='--apply') apply=true;
    else if(arg==='--dry-run') dryRun=true;
    else if(arg==='--snapshot' || arg==='--rollback') {
      if(file!==null) throw new Error('--snapshot and --rollback are mutually exclusive');
      const value=args[++i];
      if(!value || value.startsWith('--')) throw new Error(`${arg} requires a filename argument`);
      file=value;rollback=arg==='--rollback';
    } else throw new Error('Unknown argument');
  }
  if(apply && dryRun) throw new Error('--apply and --dry-run are mutually exclusive');
  if(apply && seen.has('--snapshot')) throw new Error('--snapshot is offline dry-run only; apply reads a fresh snapshot');
  return {apply,rollback,file};
}

export async function loadStorageMigrationSnapshots({file,apply,rollback},{readFileSnapshot,takeLiveSnapshot}) {
  const planSource=file?await readFileSnapshot(file):await takeLiveSnapshot();
  // Rollback uses the historical document values for reverse CAS, but its
  // recovery backup must capture the current database before changing it.
  const backupSnapshot=apply?(rollback?await takeLiveSnapshot():planSource):null;
  return {planSource,backupSnapshot};
}

function decodeDataUrl(value) {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(value);
  if (!match) throw new Error('Invalid data URL in migration source');
  let bytes;
  if (match[2]) {
    const encoded=match[3].replace(/\s/g,'');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) throw new Error('Invalid base64 migration source');
    bytes=Buffer.from(encoded,'base64');
    if (bytes.toString('base64').replace(/=+$/,'') !== encoded.replace(/=+$/,'')) throw new Error('Invalid base64 migration source');
  } else bytes=Buffer.from(decodeURIComponent(match[3]));
  if (!bytes.length || bytes.length > MAX_STORAGE_BYTES) throw new Error('Migration file empty or exceeds Storage size limit');
  const mime=match[1].toLowerCase();
  // Unknown legacy/HTML/SVG content is download-only; never serve as active HTML.
  return {bytes,mime:safeTypes.has(mime)?mime:'application/octet-stream'};
}

function ownerUid(snapshot, data) {
  const all=[...(snapshot.tables.employees || []),...(snapshot.tables.deleted_employees || [])];
  const docId=data.empDocId || data.employeeDocId;
  const found=all.filter(row => docId ? row.id===docId : String(row.data?.empId)===String(data.empId ?? data.employeeId));
  return found.length===1 ? staffUid(found[0].id) : null;
}

function chunkText(snapshot, table, id, sub, count) {
  const rows=(snapshot.chunks || []).filter(row => row.parent_collection===table && row.parent_id===id && row.sub===sub);
  const indexed=new Map(rows.map(row => [Number(row.data?.index ?? row.data?.idx ?? row.id),row.data?.data]));
  if (indexed.size!==Number(count)) throw new Error('Legacy chunk count mismatch; no data changed');
  let text='';
  for(let i=0;i<Number(count);i++) {
    if (!indexed.has(i) || typeof indexed.get(i)!=='string') throw new Error('Legacy chunk missing; no data changed');
    text+=indexed.get(i);
  }
  return text;
}

export function planStorageMigration(snapshot) {
  if (!snapshot?.tables) throw new Error('Expected a snapshot with tables and chunks');
  const documents=[],summary={documents:0,files:0,bytes:0,deferred:0,embeddedImages:0,byTable:{}};
  for(const table of STORAGE_TABLES) for(const row of snapshot.tables[table] || []) {
    const replacement=structuredClone(row.data),files=[];
    const own=requestTables.has(table)?ownerUid(snapshot,row.data):null;
    const add=(content,field,{html=false,catalog=false}={})=>{
      if (requestTables.has(table) && !own) {summary.deferred++; return null;}
      const payload=html?{bytes:Buffer.from(content),mime:'application/octet-stream'}:decodeDataUrl(content);
      if (!payload.bytes.length || payload.bytes.length>MAX_STORAGE_BYTES) throw new Error('Migration file exceeds Storage size limit');
      const scope=own?`staff/${own}`:catalog?'catalog':'admin';
      const path=`${scope}/${table}/${sha(row.id).slice(0,24)}/${sha(field).slice(0,16)}-${sha(payload.bytes)}`;
      files.push({...payload,path,sha256:sha(payload.bytes)});
      return storageReference(path);
    };
    // Attachment metadata has an explicit storageRef loader; keep legacy chunks
    // untouched and use the reference first after a verified upload.
    if (['transaction_attachments','asset_purchase_docs'].includes(table) && !replacement.storageRef) {
      let source=replacement.fileData;
      if (replacement.isChunked) source=`data:${replacement.fileType || 'application/octet-stream'};base64,${chunkText(snapshot,table,row.id,'chunks',replacement.chunkCount)}`;
      if (typeof source==='string' && source.startsWith('data:')) {
        const ref=add(source,'fileData');
        if(ref){replacement.storageRef=ref;replacement.fileData=null;}
      }
    }
    if (table==='printed_documents') {
      if (!replacement.htmlStorageRef && Number(replacement.chunks)>0) {
        const html=chunkText(snapshot,table,row.id,'chunks',replacement.chunks);
        summary.embeddedImages+=(html.match(/data:image\//g) || []).length;
        replacement.htmlStorageRef=add(html,'html',{html:true});
      }
      if (replacement.signedFile && !replacement.signedFile.storageRef && Number(replacement.signedFile.chunks)>0) {
        const value=chunkText(snapshot,table,row.id,'signed_chunks',replacement.signedFile.chunks);
        replacement.signedFile.storageRef=add(value,'signedFile');
      }
    }
    const visit=(value,path=[])=>{
      if(typeof value==='string' && value.startsWith('data:')) {
        const catalog=(catalogTables.has(table) && path.length===1 && path[0]==='image')
          || (table==='settings' && /logo|icon/i.test(path.at(-1)));
        return add(value,path.join('.'),{catalog}) || value;
      }
      if(Array.isArray(value)) return value.map((v,i)=>visit(v,[...path,String(i)]));
      if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,visit(v,[...path,key])]));
      return value;
    };
    const data=visit(replacement);
    if(files.length) {
      documents.push({table,id:row.id,expected:structuredClone(row.data),replacement:data,files});
      summary.documents++;summary.files+=files.length;
      summary.bytes+=files.reduce((total,f)=>total+f.bytes.length,0);
      summary.byTable[table]=(summary.byTable[table] || 0)+files.length;
    }
  }
  return {documents,summary};
}

export async function applyStorageMigration(plan,{client,backup,rollback=false}={}) {
  if(typeof backup!=='function') throw new Error('A durable backup callback is required before applying');
  await backup();
  const result={updated:0,conflicts:0,verifiedFiles:0};
  for(const document of plan.documents) {
    if(!rollback) for(const file of document.files) {
      const bucket=client.storage.from(STORAGE_BUCKET);
      const uploaded=await bucket.upload(file.path,file.bytes,{contentType:file.mime,upsert:false,cacheControl:'0'});
      // An interrupted previous run may have uploaded the deterministic object.
      // A collision is safe only after the authenticated bytes match exactly.
      if(uploaded.error && !/already exists|duplicate/i.test(uploaded.error.message || '')) throw new Error('Storage upload failed; metadata unchanged');
      const downloaded=await bucket.download(file.path);
      if(downloaded.error || !downloaded.data) throw new Error('Storage verification download failed; metadata unchanged');
      const bytes=Buffer.from(await downloaded.data.arrayBuffer());
      if(sha(bytes)!==file.sha256) throw new Error('SHA-256 verification failed; metadata unchanged');
      result.verifiedFiles++;
    }
    const {data,error}=await client.rpc('storage_migrate_document',{
      p_table:document.table,p_id:document.id,
      p_expected:rollback?document.replacement:document.expected,
      p_replacement:rollback?document.expected:document.replacement,
    });
    if(error) throw new Error('Storage metadata compare-and-swap failed; inspect the private backup and retry');
    if(data===true) result.updated++; else result.conflicts++;
  }
  return result;
}

export async function takeStorageSnapshot(client) {
  const snapshot={source:'supabase-storage-backup',exportedAt:new Date().toISOString(),tables:{},chunks:[]};
  for(const table of [...STORAGE_TABLES,'doc_chunks']) {
    const rows=[];
    for(let from=0;;from+=500) {
      let q=client.from(table).select(table==='doc_chunks'?'*':'id,data').order('id').range(from,from+499);
      if(table==='doc_chunks') q=q.order('parent_collection').order('parent_id').order('sub');
      const {data,error}=await q;
      if(error) throw new Error(`Cannot read migration table ${table}`);
      rows.push(...data);if(data.length<500) break;
    }
    if(table==='doc_chunks') snapshot.chunks=rows;else snapshot.tables[table]=rows;
  }
  return snapshot;
}
