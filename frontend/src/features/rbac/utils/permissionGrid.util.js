import { getPermissionPlainLabel } from '../config/permissionLabels';

export const ACTION_COLUMNS = [
  { id: 'view', label: 'View', tone: 'view', hint: 'See records', actions: ['view', 'report', 'analytics'] },
  { id: 'add', label: 'Add', tone: 'add', hint: 'Create new', actions: ['create', 'import', 'clone', 'upload'] },
  { id: 'edit', label: 'Edit', tone: 'edit', hint: 'Change or assign', actions: ['update', 'edit', 'assign', 'manage', 'approve', 'reject', 'mark', 'collect', 'bulk', 'submit', 'finalize', 'correct'] },
  { id: 'delete', label: 'Delete', tone: 'danger', hint: 'Remove records', actions: ['delete'] },
  { id: 'export', label: 'Export', tone: 'export', hint: 'Download data', actions: ['export'] },
];

function actionFromKey(key = '') {
  const parts = String(key).split('.');
  return parts[parts.length - 1] || '';
}

function columnForAction(action) {
  const col = ACTION_COLUMNS.find((c) => c.actions.includes(action));
  return col?.id || null;
}

function keysInColumn(module, columnId) {
  const main = module.mainRow?.cells?.[columnId]?.key;
  const subs = (module.subRows || [])
    .filter((r) => r.columnId === columnId)
    .map((r) => r.key);
  return [main, ...subs].filter(Boolean);
}

/** Build accordion grid — every permission sits under the right action column */
export function buildPermissionGrid(groups = {}) {
  return Object.entries(groups).map(([groupName, perms]) => {
    const buckets = Object.fromEntries(ACTION_COLUMNS.map((c) => [c.id, []]));

    perms.forEach((perm) => {
      const action = actionFromKey(perm.key);
      const colId = columnForAction(action);
      const item = {
        key: perm.key,
        label: getPermissionPlainLabel(perm),
        perm,
        action,
      };
      if (colId) buckets[colId].push(item);
      else buckets.edit.push(item);
    });

    const cells = Object.fromEntries(
      ACTION_COLUMNS.map((c) => [c.id, buckets[c.id][0] || null]),
    );

    const subRows = [];
    ACTION_COLUMNS.forEach((col) => {
      buckets[col.id].slice(1).forEach((item) => {
        subRows.push({
          id: item.key,
          key: item.key,
          label: item.label,
          columnId: col.id,
          perm: item.perm,
        });
      });
    });

    const mainRow = { id: `${groupName}-main`, cells };
    const module = { groupName, mainRow, subRows, permissions: perms };

    const allKeys = perms.map((p) => p.key);
    const colCounts = Object.fromEntries(
      ACTION_COLUMNS.map((c) => [c.id, keysInColumn(module, c.id).length]),
    );

    return { ...module, allKeys, colCounts };
  });
}

export function computePermissionStats(allPermissions = [], selected = [], lockedKeys = new Set()) {
  const locked = lockedKeys instanceof Set ? lockedKeys : new Set(lockedKeys || []);
  const selectedSet = new Set(selected);
  const allKeys = allPermissions.map((p) => p.key);
  const actionable = allKeys.filter((k) => !locked.has(k));
  const granted = actionable.filter((k) => selectedSet.has(k)).length;
  const restricted = allKeys.filter((k) => locked.has(k)).length;
  const notSet = actionable.length - granted;

  return {
    total: allKeys.length,
    granted,
    restricted,
    notSet: Math.max(0, notSet),
  };
}

export function toggleModuleColumn(module, columnId, selectedSet, lockedSet, enable) {
  const next = new Set(selectedSet);
  keysInColumn(module, columnId).forEach((key) => {
    if (lockedSet.has(key)) return;
    if (enable) next.add(key);
    else next.delete(key);
  });
  return [...next];
}

export function moduleColumnState(module, columnId, selectedSet, lockedSet) {
  const keys = keysInColumn(module, columnId).filter((k) => !lockedSet.has(k));
  if (!keys.length) return 'empty';
  const selected = keys.filter((k) => selectedSet.has(k));
  if (selected.length === keys.length) return 'all';
  if (selected.length === 0) return 'none';
  return 'some';
}

export function moduleGrantedCount(module, selectedSet, lockedSet) {
  return module.allKeys.filter((k) => selectedSet.has(k) && !lockedSet.has(k)).length;
}

/** Filter modules by access state + search (real-time) */
export function filterPermissionGrid(grid, { search = '', accessFilter = 'all', selectedSet, lockedSet }) {
  const q = search.trim().toLowerCase();
  return grid.filter((module) => {
    const nameMatch = !q || module.groupName.toLowerCase().includes(q)
      || module.permissions.some((p) =>
        String(p.name || '').toLowerCase().includes(q)
        || String(p.key || '').toLowerCase().includes(q),
      );

    if (!nameMatch) return false;
    if (accessFilter === 'all') return true;

    const keys = module.allKeys || [];
    if (accessFilter === 'restricted') {
      return keys.some((k) => lockedSet.has(k));
    }
    if (accessFilter === 'granted') {
      return keys.some((k) => selectedSet.has(k) && !lockedSet.has(k));
    }
    if (accessFilter === 'off') {
      return keys.some((k) => !lockedSet.has(k) && !selectedSet.has(k));
    }
    return true;
  });
}
