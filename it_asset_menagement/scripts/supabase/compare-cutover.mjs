// Three-way, read-only comparison. No row contents or identifiers printed.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { prepareDump } from './prepareDump.mjs';
import { TOP_TABLES } from '../../src/db/codec.js';

const [baseFile, sourceFile, targetFile] = process.argv.slice(2);
if (!baseFile || !sourceFile || !targetFile) throw new Error('Pass baseline Firebase export, latest Firebase export, Supabase snapshot.');
const [base, source, target] = [baseFile, sourceFile, targetFile].map((f) => JSON.parse(readFileSync(f, 'utf8')));
for (const dump of [base, source, target]) prepareDump(dump);
const stable = (v) => JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x);
const keyOf = (t, row) => t === 'doc_chunks' ? [row.parent_collection, row.parent_id, row.sub, row.id].join('/') : t === 'admin_users' ? String(row.data?.email || row.id).toLowerCase() : row.id;
const rowsOf = (d, t) => new Map((t === 'doc_chunks' ? d.chunks : d.tables[t] || []).map((r) => [keyOf(t, r), r]));
const detail = [];
const summary = [];
for (const table of [...TOP_TABLES, 'doc_chunks']) {
  const [b, s, t] = [base, source, target].map((d) => rowsOf(d, table));
  const counts = { table, baseline: b.size, firebase: s.size, supabase: t.size, equal: 0, sourceOnly: 0, targetOnly: 0, conflict: 0 };
  for (const id of new Set([...b.keys(), ...s.keys(), ...t.keys()])) {
    const bv = b.get(id)?.data; const sv = s.get(id)?.data; const tv = t.get(id)?.data;
    let kind;
    if (stable(sv) === stable(tv)) kind = 'equal';
    else if (stable(bv) === stable(tv)) kind = 'sourceOnly';
    else if (stable(bv) === stable(sv)) kind = 'targetOnly';
    else kind = 'conflict';
    counts[kind]++;
    if (kind !== 'equal') detail.push({ table, id, label: createHash('sha256').update(`${table}/${id}`).digest('hex').slice(0, 10), kind, sourceExists: s.has(id), targetExists: t.has(id), fields: [...new Set([...Object.keys(sv || {}), ...Object.keys(tv || {})])].filter((k) => stable(sv?.[k]) !== stable(tv?.[k])), sourceUpdatedAt: sv?.updatedAt?.__ts || sv?.updatedAt || null, targetUpdatedAt: tv?.updatedAt?.__ts || tv?.updatedAt || null });
  }
  summary.push(counts);
}
const result = { comparedAt: new Date().toISOString(), baseFile, sourceFile, targetFile, summary, differences: detail };
writeFileSync('.supabase-export/cutover-comparison.json', JSON.stringify(result, null, 2));
console.table(summary.filter((r) => r.sourceOnly || r.targetOnly || r.conflict));
console.log('Conflicts (field names only):', JSON.stringify(detail.filter((r) => r.kind === 'conflict').map(({ id, ...safe }) => safe)));
console.log('Report: .supabase-export/cutover-comparison.json (private, git ignored)');
