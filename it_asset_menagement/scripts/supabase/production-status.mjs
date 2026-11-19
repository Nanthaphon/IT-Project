// Read-only inspection. Private snapshots stay under the git-ignored export directory.
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './loadEnv.mjs';
import { TOP_TABLES } from '../../src/db/codec.js';

loadEnv();
const dir = '.supabase-export';
mkdirSync(dir, { recursive: true });
const report = { checkedAt: new Date().toISOString(), hosting: {}, tables: {}, auth: {}, storage: {} };
const safeError = (e) => String(e?.code || e?.cause?.code || e?.name || 'request_failed');
console.log('Environment presence:', JSON.stringify(Object.fromEntries([
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ACCESS_TOKEN', 'DATABASE_URL', 'SUPABASE_DB_URL', 'GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_SERVICE_ACCOUNT',
].map((name) => [name, Boolean(process.env[name])]))));
console.log('Firebase credential file exists:', Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)));
for (const host of ['it-assets-management.gbos.app','it-asset-management-dc883.web.app']) {
  try {
    const res = await fetch(`https://${host}/`, { signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    report.hosting[host] = { status: res.status, finalUrl: res.url, script: html.match(/src="([^\"]+\.js)"/)?.[1], server: res.headers.get('server') };
  } catch (e) { report.hosting[host] = { error: safeError(e) }; }
}
console.log('Hosting:', JSON.stringify(report.hosting));
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const dump = { source: 'supabase', exportedAt: report.checkedAt, tables: {}, chunks: [] };
  for (const table of [...TOP_TABLES, 'doc_chunks']) {
    const rows = [];
    for (let from = 0; ; from += 500) {
      const { data, error } = await sb.from(table).select('*').order('id').range(from, from + 499);
      if (error) { report.tables[table] = { error: error.code || 'query_failed' }; break; }
      rows.push(...data);
      if (data.length < 500) break;
    }
    if (!report.tables[table]) report.tables[table] = { rows: rows.length };
    if (table === 'doc_chunks') dump.chunks = rows;
    else dump.tables[table] = rows.map(({ id, data, updated_at, created_at }) => ({ id, data, updated_at, created_at }));
  }
  const snapshot = `${dir}/supabase-${report.checkedAt.replace(/[:.]/g, '-')}.json`;
  writeFileSync(snapshot, JSON.stringify(dump));
  report.snapshot = snapshot;
  const { data: buckets, error: bucketError } = await sb.storage.listBuckets();
  report.storage = bucketError ? { error: bucketError.statusCode || 'list_failed' } : { buckets: buckets.map(({ id, public: isPublic }) => ({ id, public: isPublic })) };
  const { data: users, error: authError } = await sb.auth.admin.listUsers({ perPage: 1000 });
  report.auth = authError ? { error: authError.code || 'list_failed' } : { total: users.users.length, staff: users.users.filter((u) => u.app_metadata?.app_role === 'staff').length, hr: users.users.filter((u) => u.app_metadata?.app_role === 'hr').length };
  const settings = await fetch(`${process.env.SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY }, signal: AbortSignal.timeout(15000) }).then((r) => r.json());
  report.auth.disableSignup = settings.disable_signup;
  report.staffPasswords = {
    rows: dump.tables.staff_passwords?.length || 0,
    recoverable: dump.tables.staff_passwords?.filter((r) => r.data && 'plaintext' in r.data).length || 0,
    default: dump.tables.staff_passwords?.filter((r) => r.data?.isDefault).length || 0,
  };
  console.log('Supabase:', JSON.stringify({ tables: report.tables, auth: report.auth, storage: report.storage, staffPasswords: report.staffPasswords, snapshot }));
}
console.log('Previous export filenames:', readdirSync(dir).filter((name) => name.startsWith('firestore-')).slice(-5));
writeFileSync(`${dir}/production-status.json`, JSON.stringify(report, null, 2));
if (Object.values(report.hosting).some((r) => r.error) || Object.values(report.tables).some((r) => r.error)) process.exitCode = 1;
