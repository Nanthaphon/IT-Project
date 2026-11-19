# Supabase production completion

Approved scope: user requested all remaining work except Teams and GitHub on 19 November 2026. No GitHub push, repository transfer, or Teams configuration. Work on the existing supabase-migration branch; preserve unrelated local files.

Architecture: keep the existing Supabase compatibility layer and Auth. Add database-backed atomic login throttling, enforce password changes for default/reset credentials, remove recoverable login passwords, and use a private Storage bucket with role/ownership policies and expiring signed URLs. Upload before replacing document references; preserve legacy read paths and backups. Determine the authoritative dataset by comparing Firebase and Supabase before any cutover; never truncate or blindly overwrite newer rows.

- [ ] Read-only preflight: current hosting, auth settings, migrations, storage, credentials available, export Firebase and snapshot Supabase into ignored .supabase-export; compare content without printing personal data.
- [ ] Security: failing regression tests first; default/reset login requires password change enforced at RLS and APIs; no plaintext staff passwords; remember employee ID only; shared durable throttling; inspect migration under PGlite and API tests.
- [ ] Storage: private bucket policies, backward-compatible photo/file helpers for all current attachment stores, retry-safe migration with dry-run, upload/download verification and compare-and-swap replacement; tests for access denial, legacy reads and failed uploads.
- [ ] Performance: inspect actual build graph, defer heavy pages/export libraries and remove redundant static imports; compare production bundle sizes.
- [ ] Review spec and security of each implementation, run npm.cmd test, npm.cmd run test:supabase, npm.cmd run build and relevant lint/checks. No production schema until local verification succeeds.
- [ ] Apply tested additive migrations using authenticated project access; snapshot first. Set auth redirects/signup settings when access permits, verify anonymous denial and intended roles. Deploy Vercel CLI to the company project, keeping the old site until parity is confirmed.
- [ ] Reconcile latest source data and complete cutover only with a consistent snapshot/write freeze; preserve existing QR links and rollback. If source conflicts or account access prevent a safe action, document exact blocker and finish all independent work.
- [ ] Update STATUS.md and migration documentation with observed evidence, precise pending items, deferred Teams/GitHub and rollback instructions.

Verification must distinguish automated local checks, live read-only checks, synthetic live account tests, and actual employee user acceptance. Do not claim an unperformed employee action succeeded. Do not send notifications while testing.
