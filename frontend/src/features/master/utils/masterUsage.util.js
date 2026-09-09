/** Format dependency/usage counts for delete confirmations and grid tooltips. */
export function formatUsageSummary(dependencies = []) {
  if (!dependencies.length) return '';
  return dependencies.map((d) => `${d.count} ${d.label}`).join(', ');
}

export function buildDeleteConfirmText(usage, itemName) {
  if (!usage?.dependencies?.length && usage?.total == null) {
    return 'This record will be soft-deleted if it has no dependencies.';
  }
  if (usage?.total > 0) {
    const summary = formatUsageSummary(usage.dependencies);
    return `"${itemName}" is in use (${summary}). Delete will be blocked — deactivate instead.`;
  }
  return `"${itemName}" has no linked records and can be soft-deleted.`;
}
