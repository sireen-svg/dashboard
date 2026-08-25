// Role helpers shared between the auth context and the pages that route on
// role. Kept out of AuthContext.jsx so that file only exports components and
// fast refresh keeps working.

export const ROLE_HYPER_CORE = 'hyper_core';

export function roleNames(account) {
  return (account?.roles || []).map((r) => r.name);
}

export function isHyperCoreAccount(account) {
  return roleNames(account).includes(ROLE_HYPER_CORE);
}

/**
 * Where an account belongs after signing in. The platform operator lands on
 * the platform-wide dashboard; everyone else on their own project list.
 */
export function homePathFor(account) {
  return isHyperCoreAccount(account) ? '/platform' : '/dashboard';
}
