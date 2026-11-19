export const REQUIRED_RELEASE_RPCS = ['consume_auth_attempt', 'change_staff_password', 'staff_access_status', 'storage_migrate_document'];

// Fail closed: deploy only after database and storage changes have been verified.
export function releaseProblems({ rpcNames = [], buckets = [], disableSignup, recoverablePasswords, unknownPasswordFlags }) {
  const problems = REQUIRED_RELEASE_RPCS.filter(name => !rpcNames.includes(name)).map(name => `Missing RPC: ${name}`);
  const bucket = buckets.find(item => item.id === 'it-private');
  if (!bucket || bucket.public !== false) problems.push('Private Storage bucket is not ready');
  if (disableSignup !== true) problems.push('Public account signup must be disabled');
  if (recoverablePasswords !== 0) problems.push('Recoverable staff passwords remain or were not checked');
  if (unknownPasswordFlags !== 0) problems.push('Staff password flags are incomplete or were not checked');
  return problems;
}
