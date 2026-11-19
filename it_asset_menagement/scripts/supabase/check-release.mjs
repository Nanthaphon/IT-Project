// Read-only production gate; never runs migrations or writes application data.
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './loadEnv.mjs';
import { releaseProblems } from './release-gate.mjs';
loadEnv();
const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
if (!url || !key) throw new Error('Supabase connection is not configured');
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const response = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/openapi+json' }, signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Schema inspection failed (${response.status})`);
const schema = await response.json();
const { data: buckets, error: bucketError } = await sb.storage.listBuckets();
if (bucketError) throw new Error('Storage inspection failed');
const { data: passwords, error: passwordError } = await sb.from('staff_passwords').select('data').limit(1000);
if (passwordError || passwords.length >= 1000) throw new Error('Staff credential inspection failed or requires pagination');
const authResponse = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY }, signal: AbortSignal.timeout(20000) });
if (!authResponse.ok) throw new Error(`Auth inspection failed (${authResponse.status})`);
const auth = await authResponse.json();
const problems = releaseProblems({
  rpcNames: Object.keys(schema.paths || {}).filter(path => path.startsWith('/rpc/')).map(path => path.slice(5)),
  buckets, disableSignup: auth.disable_signup,
  recoverablePasswords: passwords.filter(row => Object.hasOwn(row.data || {}, 'plaintext')).length,
  unknownPasswordFlags: passwords.filter(row => typeof row.data?.isDefault !== 'boolean' || typeof row.data?.mustChangePassword !== 'boolean').length,
});
if (problems.length) { console.log('RELEASE BLOCKED\n' + problems.join('\n')); process.exitCode = 1; }
else console.log('Database, Storage privacy and staff credential migration checks passed. Data parity and user acceptance remain separate release requirements.');
