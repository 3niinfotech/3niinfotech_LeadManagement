import { useMemo } from 'react';
import { FiCheck } from 'react-icons/fi';

export const DATA_SCOPES = [
  { value: 'OWN', label: 'Own Records', description: 'Only records assigned to the user' },
  { value: 'TEAM', label: 'Team Records', description: 'Records for the user\'s team' },
  { value: 'BRANCH', label: 'Branch Records', description: 'All records within the branch' },
  { value: 'COMPANY', label: 'Company Records', description: 'All records within the company' },
  { value: 'GLOBAL', label: 'Global Records', description: 'All records across companies' },
];

export default function PermissionMatrix({ groups = {}, selected = [], onChange, readOnly = false }) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (key) => {
    if (readOnly) return;
    const next = selectedSet.has(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    onChange(next);
  };

  const toggleGroup = (keys, selectAll) => {
    if (readOnly) return;
    const set = new Set(selected);
    keys.forEach((k) => (selectAll ? set.add(k) : set.delete(k)));
    onChange([...set]);
  };

  return (
    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
      {Object.entries(groups).map(([groupName, perms]) => {
        const keys = perms.map((p) => p.key);
        const allSelected = keys.every((k) => selectedSet.has(k));
        const someSelected = keys.some((k) => selectedSet.has(k));

        return (
          <div key={groupName} className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-row-hover">
              <span className="text-sm font-medium text-text-primary">{groupName}</span>
              {!readOnly && (
                <button
                  type="button"
                  className="text-xs text-brand hover:underline"
                  onClick={() => toggleGroup(keys, !allSelected)}
                >
                  {allSelected ? 'Clear all' : someSelected ? 'Select all' : 'Select all'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
              {perms.map((perm) => {
                const checked = selectedSet.has(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2 p-2 rounded-md text-sm cursor-pointer transition-colors ${
                      checked ? 'bg-brand-soft/60' : 'hover:bg-row-hover'
                    } ${readOnly ? 'cursor-default' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked}
                      disabled={readOnly}
                      onChange={() => toggle(perm.key)}
                    />
                    <span>
                      <span className="font-medium text-text-primary block">{perm.name}</span>
                      <span className="text-xs text-text-muted font-mono">{perm.key}</span>
                    </span>
                    {checked && <FiCheck className="ml-auto text-brand shrink-0" size={14} />}
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
