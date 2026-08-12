/**
 * Build SummaryStatBar items from API summary + status config.
 *
 * @example
 * buildSummaryStatItems({
 *   summary: { total: 15, new: 4 },
 *   statuses: ENQUIRY_STATUSES,
 *   icons: ENQUIRY_SUMMARY_ICONS,
 *   total: { key: 'total', label: 'Total Enquiries', icon: FiInbox },
 * })
 */
export function buildSummaryStatItems({
  summary = {},
  statuses = [],
  icons = {},
  total = {
    key: 'total',
    label: 'Total',
    icon: null,
    tone: 'neutral',
    filterValue: null,
  },
}) {
  const items = [
    {
      key: total.key,
      label: total.label,
      icon: total.icon,
      tone: total.tone || 'neutral',
      filterValue: total.filterValue ?? null,
      value: summary[total.key] ?? 0,
    },
  ];

  statuses.forEach((status) => {
    const key = status.summaryKey || status.value;
    items.push({
      key,
      label: status.label,
      icon: icons[key] || icons[status.value] || null,
      tone: status.color || 'neutral',
      filterValue: status.value ?? status.filterValue ?? key,
      value: summary[key] ?? 0,
    });
  });

  return items;
}

/** Count statuses from a client-side array (students, leads, etc.) */
export function countByStatus(rows = [], statuses = [], totalKey = 'total') {
  const summary = { [totalKey]: rows.length };
  statuses.forEach((status) => {
    const key = status.summaryKey || status.value;
    summary[key] = rows.filter((row) => row.status === status.value).length;
  });
  return summary;
}
