import { useMemo } from 'react';
import { FiCheck, FiLock, FiLoader } from 'react-icons/fi';
import { getPermissionPlainHint, getPermissionPlainLabel } from '../config/permissionLabels';

export const DATA_SCOPES = [
  { value: 'OWN', label: 'Only own records', description: 'Only records assigned to the user' },
  { value: 'TEAM', label: 'Team records', description: 'Records for the user\'s team' },
  { value: 'BRANCH', label: 'Whole branch', description: 'All records within the branch' },
  { value: 'COMPANY', label: 'Whole company', description: 'All records within the company' },
  { value: 'GLOBAL', label: 'All companies', description: 'All records across companies' },
];

/**
 * @param {boolean} [props.showKeys=false] — technical keys for IT only; default hidden for non-IT admins
 */
export default function PermissionMatrix({
  groups = {},
  selected = [],
  onChange,
  onToggle,
  readOnly = false,
  lockedKeys,
  pendingKey = null,
  className = '',
  showKeys = false,
  themed = false,
  compact = false,
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const lockedSet = useMemo(
    () => new Set(lockedKeys instanceof Set ? [...lockedKeys] : (lockedKeys || [])),
    [lockedKeys],
  );

  const applyToggle = (key) => {
    if (readOnly || lockedSet.has(key) || pendingKey) return;
    const enabled = !selectedSet.has(key);
    const next = enabled
      ? [...selected, key]
      : selected.filter((k) => k !== key);
    if (onToggle) onToggle(key, enabled, next);
    else onChange?.(next);
  };

  const toggleGroup = (keys, selectAll) => {
    if (readOnly || pendingKey) return;
    const actionable = keys.filter((k) => !lockedSet.has(k));
    if (!actionable.length) return;
    const set = new Set(selected);
    actionable.forEach((k) => (selectAll ? set.add(k) : set.delete(k)));
    const next = [...set];
    onChange?.(next);
  };

  return (
    <div className={`space-y-4 overflow-y-auto pr-1 ${themed ? 'crm-permission-matrix--themed' : ''} ${className || 'max-h-[420px]'}`}>
      {Object.entries(groups).map(([groupName, perms]) => {
        const keys = perms.map((p) => p.key);
        const freeKeys = keys.filter((k) => !lockedSet.has(k));
        const allSelected = freeKeys.length > 0 && freeKeys.every((k) => selectedSet.has(k));

        const enabledCount = freeKeys.filter((k) => selectedSet.has(k)).length;

        return (
          <div key={groupName} className={`crm-perm-group ${themed ? 'crm-perm-group--themed' : ''}`}>
            <div className="crm-perm-group__head">
              <div>
                <span className="crm-perm-group__title">{groupName}</span>
                {themed ? (
                  <span className="crm-perm-group__count">
                    {enabledCount} of {freeKeys.length || keys.length} on
                  </span>
                ) : (
                  <span className="ml-2 text-[11px] text-text-muted">
                    {enabledCount}/{freeKeys.length || keys.length} allowed
                  </span>
                )}
              </div>
              {!readOnly && freeKeys.length > 0 && (
                <button
                  type="button"
                  className="text-xs font-medium text-brand hover:underline disabled:opacity-40"
                  disabled={Boolean(pendingKey)}
                  onClick={() => toggleGroup(keys, !allSelected)}
                >
                  {allSelected ? 'Remove all' : 'Allow all'}
                </button>
              )}
            </div>
            <div className={`crm-perm-group__grid ${themed ? 'crm-perm-group__grid--themed' : 'grid grid-cols-1 sm:grid-cols-2 gap-1 p-2'}`}>
              {perms.map((perm) => {
                const locked = lockedSet.has(perm.key);
                const checked = locked ? false : selectedSet.has(perm.key);
                const saving = pendingKey === perm.key;
                const label = getPermissionPlainLabel(perm);
                const hint = getPermissionPlainHint(perm);

                return (
                  <label
                    key={perm.key}
                    className={`crm-perm-item ${themed ? 'crm-perm-item--themed' : ''} ${
                      checked ? 'crm-perm-item--checked' : ''
                    } ${locked || readOnly ? 'crm-perm-item--locked' : ''} ${
                      saving ? 'crm-perm-item--saving' : ''
                    } flex items-start gap-2.5 p-2.5 rounded-md text-sm transition-colors ${
                      !themed && checked ? 'bg-brand-soft/60' : !themed ? 'hover:bg-row-hover' : ''
                    } ${locked || readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                    title={locked ? 'Not available for this role' : hint}
                  >
                    {saving ? (
                      <FiLoader className="mt-0.5 animate-spin text-brand shrink-0" size={14} />
                    ) : locked ? (
                      <FiLock className="mt-0.5 text-warning shrink-0" size={14} />
                    ) : (
                      <input
                        type="checkbox"
                        className={themed ? 'crm-access-checkbox' : 'mt-1'}
                        checked={checked}
                        disabled={readOnly || locked || Boolean(pendingKey)}
                        onChange={() => applyToggle(perm.key)}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="crm-perm-item__label">{label}</span>
                      {!compact && !themed && (
                        <span className="text-[11px] text-text-muted block mt-0.5 leading-snug">{hint}</span>
                      )}
                      {showKeys && (
                        <span className="text-[10px] text-text-muted/80 font-mono block mt-0.5">{perm.key}</span>
                      )}
                    </span>
                    {checked && !saving && !locked && <FiCheck className="ml-auto text-brand shrink-0 mt-0.5" size={14} />}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
