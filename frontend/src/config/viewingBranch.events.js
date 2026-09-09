/** Fired after navbar Active Branch changes (server prefs updated). */
export const VIEWING_BRANCH_CHANGED_EVENT = 'crm:viewing-branch-changed';

export function emitViewingBranchChanged(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(VIEWING_BRANCH_CHANGED_EVENT, { detail }));
}

export function onViewingBranchChanged(handler) {
  if (typeof window === 'undefined') return () => {};
  const listener = (e) => handler(e.detail || {});
  window.addEventListener(VIEWING_BRANCH_CHANGED_EVENT, listener);
  return () => window.removeEventListener(VIEWING_BRANCH_CHANGED_EVENT, listener);
}
