import { useMemo, useState } from 'react';
import {
  FiChevronDown, FiChevronRight, FiLoader, FiLock,
} from 'react-icons/fi';
import {
  ACTION_COLUMNS,
  buildPermissionGrid,
  filterPermissionGrid,
  moduleColumnState,
  moduleGrantedCount,
  toggleModuleColumn,
} from '../utils/permissionGrid.util';

function GridCheckbox({ state, locked, saving, onChange, title, tone }) {
  if (locked) {
    return (
      <span className={`crm-pgrid-check crm-pgrid-check--locked crm-pgrid-check--col-${tone}`} title="Not available for this role">
        <FiLock size={11} />
      </span>
    );
  }
  if (saving) {
    return <FiLoader className="crm-pgrid-check crm-pgrid-check--loading animate-spin text-brand" size={14} />;
  }
  const checked = state === 'all';
  const indeterminate = state === 'some';
  return (
    <button
      type="button"
      className={`crm-pgrid-check crm-pgrid-check--themed crm-pgrid-check--col-${tone} ${
        checked ? 'crm-pgrid-check--on' : indeterminate ? 'crm-pgrid-check--some' : ''
      }`}
      onClick={onChange}
      aria-pressed={checked}
      title={title || (checked ? 'Allowed — click to turn off' : 'Click to allow all in this column')}
    >
      {indeterminate && <span className="crm-pgrid-check__dash" />}
      {checked && <span className="crm-pgrid-check__tick" />}
    </button>
  );
}

function CellCheckbox({ checked, locked, saving, onChange, label, tone }) {
  if (locked) {
    return (
      <span className={`crm-pgrid-check crm-pgrid-check--locked crm-pgrid-check--col-${tone}`} title="Restricted for this role">
        <FiLock size={11} />
      </span>
    );
  }
  if (saving) return <FiLoader className="animate-spin text-brand" size={14} />;
  return (
    <button
      type="button"
      className={`crm-pgrid-check crm-pgrid-check--themed crm-pgrid-check--col-${tone} ${checked ? 'crm-pgrid-check--on' : ''}`}
      onClick={onChange}
      aria-pressed={checked}
      title={checked ? `Remove: ${label}` : `Allow: ${label}`}
    >
      {checked && <span className="crm-pgrid-check__tick" />}
    </button>
  );
}

function EmptyCell() {
  return <span className="crm-pgrid-check crm-pgrid-check--na" aria-hidden>—</span>;
}

export default function PermissionGridMatrix({
  groups = {},
  selected = [],
  lockedKeys,
  pendingKey = null,
  readOnly = false,
  onToggle,
  onChange,
  search = '',
  accessFilter = 'all',
}) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [expandAll, setExpandAll] = useState(false);

  const lockedSet = useMemo(
    () => new Set(lockedKeys instanceof Set ? [...lockedKeys] : (lockedKeys || [])),
    [lockedKeys],
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const grid = useMemo(() => {
    const built = buildPermissionGrid(groups);
    return filterPermissionGrid(built, {
      search,
      accessFilter,
      selectedSet,
      lockedSet,
    });
  }, [groups, search, accessFilter, selectedSet, lockedSet]);

  const isExpanded = (name) => expandAll || expanded.has(name);

  const toggleExpand = (name) => {
    setExpandAll(false);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandAll((v) => !v);
    setExpanded(new Set());
  };

  const applyToggle = (key) => {
    if (readOnly || lockedSet.has(key) || pendingKey) return;
    const enabled = !selectedSet.has(key);
    const next = enabled ? [...selected, key] : selected.filter((k) => k !== key);
    if (onToggle) onToggle(key, enabled, next);
    else onChange?.(next);
  };

  const handleColumnToggle = (module, columnId) => {
    if (readOnly || pendingKey) return;
    const state = moduleColumnState(module, columnId, selectedSet, lockedSet);
    const enable = state !== 'all';
    const next = toggleModuleColumn(module, columnId, selectedSet, lockedSet, enable);
    onChange?.(next);
  };

  return (
    <div className="crm-pgrid">
      <div className="crm-pgrid__toolbar">
        <p className="crm-pgrid__title">
          Permissions
          {grid.length > 0 && (
            <span className="crm-pgrid__count">{grid.length} modules</span>
          )}
        </p>
        <button type="button" className="crm-pgrid__expand-all" onClick={handleExpandAll}>
          {expandAll ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="crm-pgrid__table-wrap">
        <table className="crm-pgrid__table">
          <thead>
            <tr>
              <th className="crm-pgrid__th-module">Module / Permission</th>
              {ACTION_COLUMNS.map((col) => (
                <th
                  key={col.id}
                  className={`crm-pgrid__th-action crm-pgrid__th-action--${col.tone}`}
                  title={col.hint}
                >
                  <span className="crm-pgrid__th-label">{col.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!grid.length ? (
              <tr>
                <td colSpan={ACTION_COLUMNS.length + 1} className="crm-pgrid__empty">
                  No permissions match your search or filter.
                </td>
              </tr>
            ) : grid.map((module) => (
              <ModuleBlock
                key={module.groupName}
                module={module}
                open={isExpanded(module.groupName)}
                onToggleExpand={() => toggleExpand(module.groupName)}
                selectedSet={selectedSet}
                lockedSet={lockedSet}
                pendingKey={pendingKey}
                readOnly={readOnly}
                onCellToggle={applyToggle}
                onColumnToggle={handleColumnToggle}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="crm-pgrid__legend">
        {ACTION_COLUMNS.map((col) => (
          <span key={col.id}>
            <span className={`crm-pgrid__legend-swatch crm-pgrid__legend-swatch--${col.tone}`} />
            {col.label}
          </span>
        ))}
        <span className="crm-pgrid__legend-sep" />
        <span><span className="crm-pgrid-check crm-pgrid-check--locked crm-pgrid-check--mini"><FiLock size={9} /></span> Restricted</span>
      </div>
    </div>
  );
}

function ModuleBlock({
  module, open, onToggleExpand, selectedSet, lockedSet, pendingKey, readOnly,
  onCellToggle, onColumnToggle,
}) {
  const mainRow = module.mainRow;
  const extraRows = module.subRows || [];
  const granted = moduleGrantedCount(module, selectedSet, lockedSet);
  const total = module.allKeys?.length || module.permissions?.length || 0;
  const hasExtras = extraRows.length > 0;

  return (
    <>
      <tr className={`crm-pgrid__module-row ${open ? 'crm-pgrid__module-row--open' : ''}`}>
        <td className="crm-pgrid__module-cell">
          <button type="button" className="crm-pgrid__module-toggle" onClick={onToggleExpand}>
            {hasExtras ? (
              open ? <FiChevronDown size={15} className="crm-pgrid__chevron" /> : <FiChevronRight size={15} className="crm-pgrid__chevron" />
            ) : (
              <span className="crm-pgrid__chevron crm-pgrid__chevron--spacer" />
            )}
            <span className="crm-pgrid__module-icon">{module.groupName.charAt(0)}</span>
            <span className="crm-pgrid__module-text">
              <span className="crm-pgrid__module-name">{module.groupName}</span>
              <span className="crm-pgrid__module-meta">
                <span className="crm-pgrid__module-granted">{granted}</span>
                <span className="crm-pgrid__module-total"> / {total}</span>
                {hasExtras && !open && <span className="crm-pgrid__module-more"> · more</span>}
              </span>
            </span>
          </button>
        </td>
        {ACTION_COLUMNS.map((col) => {
          const cell = mainRow.cells[col.id];
          const colState = moduleColumnState(module, col.id, selectedSet, lockedSet);
          const hasColumn = module.colCounts?.[col.id] > 0;

          if (!hasColumn) {
            return (
              <td key={col.id} className="crm-pgrid__action-cell">
                <EmptyCell />
              </td>
            );
          }

          if (cell?.key) {
            const locked = lockedSet.has(cell.key);
            const checked = selectedSet.has(cell.key);
            const saving = pendingKey === cell.key;
            return (
              <td key={col.id} className={`crm-pgrid__action-cell crm-pgrid__action-cell--${col.tone}`}>
                <CellCheckbox
                  checked={checked}
                  locked={locked || readOnly}
                  saving={saving}
                  label={cell.label}
                  tone={col.tone}
                  onChange={() => onCellToggle(cell.key)}
                />
              </td>
            );
          }

          return (
            <td key={col.id} className={`crm-pgrid__action-cell crm-pgrid__action-cell--${col.tone}`}>
              <GridCheckbox
                state={colState}
                locked={colState === 'empty' || readOnly}
                saving={false}
                tone={col.tone}
                onChange={() => onColumnToggle(module, col.id)}
                title={`Toggle all ${col.label} for ${module.groupName}`}
              />
            </td>
          );
        })}
      </tr>

      {open && extraRows.map((row) => {
        const col = ACTION_COLUMNS.find((c) => c.id === row.columnId);
        const tone = col?.tone || 'edit';
        return (
          <tr key={row.id} className="crm-pgrid__sub-row">
            <td className="crm-pgrid__sub-cell">
              <span className="crm-pgrid__sub-tree" aria-hidden />
              <span className="crm-pgrid__sub-label">{row.label}</span>
            </td>
            {ACTION_COLUMNS.map((c) => {
              if (row.columnId !== c.id) {
                return (
                  <td key={c.id} className="crm-pgrid__action-cell crm-pgrid__action-cell--empty">
                    <EmptyCell />
                  </td>
                );
              }
              const locked = lockedSet.has(row.key);
              const checked = selectedSet.has(row.key);
              const saving = pendingKey === row.key;
              return (
                <td key={c.id} className={`crm-pgrid__action-cell crm-pgrid__action-cell--${tone}`}>
                  <CellCheckbox
                    checked={checked}
                    locked={locked || readOnly}
                    saving={saving}
                    label={row.label}
                    tone={tone}
                    onChange={() => onCellToggle(row.key)}
                  />
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
