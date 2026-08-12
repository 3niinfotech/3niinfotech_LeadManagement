/** Enterprise audit actions shown on the Audit Logs tab */
export const ENQUIRY_AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ASSIGN: 'ASSIGN',
  IMPORTED: 'IMPORTED',
  MERGED: 'MERGED',
  EXPORTED: 'EXPORTED',
};

/** Status and field edits roll up under Updated in the UI */
export const ENQUIRY_AUDIT_UPDATE_ACTIONS = new Set([
  'UPDATE',
  'STATUS_CHANGE',
  'DROP',
]);

export const ENQUIRY_AUDIT_TAB_ACTIONS = new Set([
  'CREATE',
  'UPDATE',
  'STATUS_CHANGE',
  'DELETE',
  'ASSIGN',
  'IMPORTED',
  'MERGED',
  'EXPORTED',
  'DROP',
]);
