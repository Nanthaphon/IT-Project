// Default is read-only. --snapshot <file> also works completely offline.
// Apply: node scripts/supabase/migrate-private-storage.mjs --apply
// Rollback: node ... --rollback <private-backup.json> [--apply]
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './loadEnv.mjs';
import { planStorageMigration,applyStorageMigration,takeStorageSnapshot,
  parseStorageMigrationArgs,loadStorageMigrationSnapshots } from './storageMigration.mjs';

const {apply,rollback,file}=parseStorageMigrationArgs(process.argv.slice(2));
loadEnv();
let client;
if(!file || apply) {
  if(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase service environment is required');
  client=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
const {planSource,backupSnapshot}=await loadStorageMigrationSnapshots({file,apply,rollback},{
  readFileSnapshot:path=>JSON.parse(readFileSync(path,'utf8')),
  takeLiveSnapshot:()=>takeStorageSnapshot(client),
});
const plan=planStorageMigration(planSource);
// Aggregate counts only: no filenames, employee IDs, document content or keys.
console.log(JSON.stringify({mode:apply?(rollback?'rollback':'apply'):'dry-run',...plan.summary},null,2));
if(!apply) process.exit(0);
const {data:bucket,error}=await client.storage.getBucket('it-private');
if(error || !bucket || bucket.public) throw new Error('A verified private it-private bucket is required; apply SQL first');
const backupPath=`.supabase-export/storage-${rollback?'rollback':'backup'}-${new Date().toISOString().replaceAll(':','-')}.json`;
const result=await applyStorageMigration(plan,{client,rollback:!!rollback,backup:async()=>{
  mkdirSync('.supabase-export',{recursive:true});
  // Exclusive write and immediate readback before any remote mutation.
  writeFileSync(backupPath,JSON.stringify(backupSnapshot),{flag:'wx',mode:0o600});
  JSON.parse(readFileSync(backupPath,'utf8'));
}});
console.log(JSON.stringify({backup:backupPath,...result},null,2));
if(result.conflicts || plan.summary.deferred) process.exitCode=2;
