import { DATA_SCOPE_PLAIN } from './permissionLabels';
import { getModuleFriendlyName } from '../../team-access/config/teamAccessHelp.config';

const ACTION_VERBS = {
  view: 'View',
  create: 'Create',
  update: 'Edit',
  edit: 'Edit',
  delete: 'Delete',
  assign: 'Assign',
  export: 'Export',
  import: 'Import',
  manage: 'Manage',
  approve: 'Approve',
  reject: 'Reject',
  mark: 'Mark',
  collect: 'Collect',
  bulk: 'Bulk actions on',
  submit: 'Submit',
  finalize: 'Finalize',
  correct: 'Correct',
  clone: 'Clone',
  upload: 'Upload',
  report: 'Reports for',
  analytics: 'Analytics for',
};

function actorName(user) {
  if (!user) return 'Someone';
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email || 'Someone';
}

function formatWhen(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function diffPermissionLabels(oldKeys = [], newKeys = []) {
  const oldSet = new Set(oldKeys);
  const newSet = new Set(newKeys);
  const added = newKeys.filter((k) => !oldSet.has(k));
  const removed = oldKeys.filter((k) => !newSet.has(k));
  return { added, removed };
}

/** Plain English label from permission key — no raw keys shown */
export function labelFromPermissionKey(key = '') {
  const parts = String(key).split('.');
  const action = parts[parts.length - 1] || '';
  const module = getModuleFriendlyName(key);
  const verb = ACTION_VERBS[action] || action.charAt(0).toUpperCase() + action.slice(1);
  if (action === 'view') return `View ${module}`;
  if (action === 'delete') return `Delete ${module}`;
  return `${verb} ${module}`;
}

function labelForKeys(keys = [], limit = 3) {
  if (!keys.length) return '';
  const labels = keys.slice(0, limit).map(labelFromPermissionKey);
  const more = keys.length > limit ? ` and ${keys.length - limit} more` : '';
  return `${labels.join(', ')}${more}`;
}

function toneForAction(action, { added = [], removed = [] } = {}) {
  if (action === 'DELETE') return 'danger';
  if (action === 'CREATE' || action === 'CLONE') return 'success';
  if (action === 'PERMISSION_CHANGE') {
    if (removed.length && !added.length) return 'danger';
    if (added.length && !removed.length) return 'success';
    return 'warning';
  }
  if (action === 'STATUS_CHANGE') return 'warning';
  return 'neutral';
}

/** Plain English sentence for one activity log entry — no IDs or keys shown to user */
export function formatRoleActivityEntry(entry, roleName = 'this role') {
  const who = actorName(entry?.user);
  const when = formatWhen(entry?.createdAt);
  const oldVal = entry?.oldValue || {};
  const newVal = entry?.newValue || {};

  let text = '';
  let tone = 'neutral';

  switch (entry?.action) {
    case 'CREATE':
      text = `${who} created the role "${newVal.name || roleName}".`;
      tone = 'success';
      break;
    case 'UPDATE':
      if (newVal.name && oldVal.name && newVal.name !== oldVal.name) {
        text = `${who} renamed the role from "${oldVal.name}" to "${newVal.name}".`;
      } else if (newVal.description !== oldVal.description) {
        text = `${who} updated the role description.`;
      } else if (newVal.dataScope !== oldVal.dataScope) {
        const scope = DATA_SCOPE_PLAIN[newVal.dataScope]?.label || 'updated data access';
        text = `${who} changed data access to "${scope}".`;
      } else {
        text = `${who} updated role details.`;
      }
      tone = 'neutral';
      break;
    case 'PERMISSION_CHANGE': {
      const { added, removed } = diffPermissionLabels(oldVal.permissions, newVal.permissions);
      tone = toneForAction('PERMISSION_CHANGE', { added, removed });
      if (added.length && removed.length) {
        text = `${who} updated permissions — allowed ${labelForKeys(added)} and removed ${labelForKeys(removed)}.`;
      } else if (added.length) {
        text = `${who} allowed ${labelForKeys(added)}.`;
      } else if (removed.length) {
        text = `${who} removed ${labelForKeys(removed)}.`;
      } else {
        text = `${who} updated permissions for this role.`;
      }
      break;
    }
    case 'DELETE':
      text = `${who} removed this role from active use.`;
      tone = 'danger';
      break;
    case 'STATUS_CHANGE':
      text = newVal.isActive === false
        ? `${who} deactivated this role.`
        : `${who} activated this role.`;
      tone = newVal.isActive === false ? 'danger' : 'success';
      break;
    case 'CLONE':
      text = `${who} created a copy of this role${newVal.name ? ` as "${newVal.name}"` : ''}.`;
      tone = 'success';
      break;
    case 'ASSIGN_USER': {
      const count = Array.isArray(newVal.userIds) ? newVal.userIds.length : 0;
      text = count
        ? `${who} assigned ${count} team member${count === 1 ? '' : 's'} to this role.`
        : `${who} updated team assignments for this role.`;
      tone = 'neutral';
      break;
    }
    default:
      text = `${who} made a change to this role.`;
  }

  return { text, when, action: entry?.action, tone };
}
