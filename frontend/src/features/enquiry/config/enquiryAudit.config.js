export const AUDIT_LOG_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'CREATE', label: 'Created' },
  { id: 'UPDATE', label: 'Updated' },
  { id: 'DELETE', label: 'Deleted' },
  { id: 'ASSIGN', label: 'Assigned' },
  { id: 'IMPORTED', label: 'Imported' },
  { id: 'MERGED', label: 'Merged' },
  { id: 'EXPORTED', label: 'Exported' },
];

export const AUDIT_ACTION_LABELS = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  STATUS_CHANGE: 'Updated',
  DROP: 'Updated',
  DELETE: 'Deleted',
  ASSIGN: 'Assigned',
  IMPORTED: 'Imported',
  MERGED: 'Merged',
  EXPORTED: 'Exported',
};

export const AUDIT_ACTION_TONES = {
  CREATE: 'success',
  UPDATE: 'info',
  STATUS_CHANGE: 'info',
  DROP: 'info',
  DELETE: 'danger',
  ASSIGN: 'primary',
  IMPORTED: 'warning',
  MERGED: 'brand',
  EXPORTED: 'secondary',
};

/** Map raw audit action → filter bucket id */
export function getAuditFilterBucket(action) {
  if (action === 'STATUS_CHANGE' || action === 'DROP') return 'UPDATE';
  return action;
}

export function isAuditTabAction(action) {
  return action in AUDIT_ACTION_LABELS
    || ['STATUS_CHANGE', 'DROP'].includes(action);
}
