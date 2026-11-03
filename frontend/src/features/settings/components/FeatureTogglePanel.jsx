import { useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiFilter,
  FiRefreshCw,
  FiRotateCcw,
  FiSave,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import ContentLoader from '../../../components/ui/ContentLoader';
import PermissionGate from '../../../components/common/PermissionGate';
import { PERMISSIONS } from '../../../config/permissions';
import {
  useGetAdminFeaturesQuery,
  useUpdateFeaturesMutation,
} from '../../feature/redux/featureApiSlice';
import toastService from '../../../services/toast/toast.service';

const MODULE_META = {
  reception: { label: 'Reception & Visitors' },
  calendar: { label: 'Calendar & Scheduling' },
  automation: { label: 'Workflow Automation' },
  communication: { label: 'Communication Hub' },
  finance: { label: 'Billing & Finance' },
  reporting: { label: 'Analytics & Reporting' },
};

function SwitchToggle({ checked, onChange, disabled = false, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`crm-feature-switch ${checked ? 'crm-feature-switch--checked' : ''} ${
        disabled ? 'crm-feature-switch--disabled' : ''
      }`}
    >
      <span className="crm-feature-switch__thumb" />
    </button>
  );
}

function ToggleCard({ item, checked, onChange, allFlags }) {
  const unmetDeps = (item.dependsOn || []).filter((depKey) => !allFlags[depKey]);

  return (
    <div
      className={`crm-feature-row ${checked ? 'crm-feature-row--active' : ''}`}
      onClick={() => onChange(item.key, !checked)}
    >
      <div className="crm-feature-row__content">
        <div className="crm-feature-row__header">
          <h4 className="crm-feature-row__title">{item.name}</h4>
          {unmetDeps.length > 0 && (
            <span
              className="crm-feature-pill crm-feature-pill--dep-warn"
              title={`Parent prerequisite is disabled: ${unmetDeps.join(', ')}`}
            >
              <FiAlertCircle className="w-3 h-3 mr-1 inline" />
              Requires: {unmetDeps.join(', ')}
            </span>
          )}
        </div>

        {item.description && (
          <p className="crm-feature-row__desc">{item.description}</p>
        )}
      </div>

      <div className="crm-feature-row__action" onClick={(e) => e.stopPropagation()}>
        <SwitchToggle
          id={`toggle-${item.key}`}
          checked={checked}
          onChange={(val) => onChange(item.key, val)}
        />
      </div>
    </div>
  );
}

/** Feature toggles body — used by Settings console and FeatureTogglePage. */
export default function FeatureTogglePanel({ showActions = true }) {
  const { data, isLoading, refetch, isFetching } = useGetAdminFeaturesQuery();
  const [updateFeatures, { isLoading: saving }] = useUpdateFeaturesMutation();
  const [draft, setDraft] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [activeModule, setActiveModule] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'enabled' | 'disabled'

  const effectiveFlags = useMemo(() => {
    if (draft) return draft;
    return data?.flags ?? {};
  }, [draft, data?.flags]);

  const rawFlags = data?.flags ?? {};
  const grouped = data?.grouped ?? {};

  // Count changes pending
  const dirtyCount = useMemo(() => {
    if (!draft) return 0;
    let count = 0;
    Object.keys(draft).forEach((key) => {
      if (draft[key] !== rawFlags[key]) count++;
    });
    return count;
  }, [draft, rawFlags]);

  // Overall counts
  const totalFeatures = useMemo(() => {
    let count = 0;
    Object.values(grouped).forEach((items) => {
      count += items.length;
    });
    return count;
  }, [grouped]);

  const enabledCount = useMemo(() => {
    return Object.values(effectiveFlags).filter(Boolean).length;
  }, [effectiveFlags]);

  const handleToggle = (key, enabled) => {
    setDraft((prev) => ({ ...(prev ?? rawFlags), [key]: enabled }));
  };

  const handleToggleGroup = (moduleKey, enableAll) => {
    const items = grouped[moduleKey] || [];
    setDraft((prev) => {
      const next = { ...(prev ?? rawFlags) };
      items.forEach((item) => {
        next[item.key] = enableAll;
      });
      return next;
    });
  };

  const handleDiscard = () => {
    setDraft(null);
  };

  const handleSave = async () => {
    if (!draft) return;
    const updates = Object.entries(draft).map(([key, enabled]) => ({ key, enabled }));
    try {
      await updateFeatures(updates).unwrap();
      setDraft(null);
      toastService.success('Feature toggles saved successfully');
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to save toggles');
    }
  };

  // Filtered groups
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = {};

    Object.entries(grouped).forEach(([moduleKey, items]) => {
      if (activeModule !== 'all' && activeModule !== moduleKey) return;

      const filteredItems = items.filter((item) => {
        const isEnabled = Boolean(effectiveFlags[item.key]);
        if (statusFilter === 'enabled' && !isEnabled) return false;
        if (statusFilter === 'disabled' && isEnabled) return false;

        if (q) {
          const matchName = item.name?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchKey = item.key?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchKey) return false;
        }

        return true;
      });

      if (filteredItems.length > 0) {
        result[moduleKey] = filteredItems;
      }
    });

    return result;
  }, [grouped, activeModule, statusFilter, search, effectiveFlags]);

  const hasAnyResults = Object.keys(filteredGroups).length > 0;

  if (isLoading) return <ContentLoader variant="module" />;

  return (
    <div className="crm-settings-features">
      {/* Top Header with Actions */}
      {showActions && (
        <div className="crm-settings-features__hero">
          <div className="crm-settings-features__modes">
            <span className="crm-settings-features__stat">
              <strong>{enabledCount}</strong> of {totalFeatures} features active
            </span>
            {dirtyCount > 0 && (
              <div className="crm-dirty-badge">
                <span className="crm-dirty-badge__dot" />
                <span>{dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}</span>
                <button
                  type="button"
                  className="crm-dirty-badge__discard"
                  onClick={handleDiscard}
                  title="Discard changes"
                >
                  <FiRotateCcw className="w-3 h-3 mr-1 inline" />
                  Discard
                </button>
              </div>
            )}
          </div>

          <div className="crm-settings-features__actions">
            <Button
              size="sm"
              variant="outline"
              icon={FiRefreshCw}
              loading={isFetching}
              onClick={() => {
                setDraft(null);
                refetch();
              }}
              title="Reload features from server"
            >
              Refresh
            </Button>

            <PermissionGate permission={PERMISSIONS.SETTINGS_MANAGE}>
              <Button
                size="sm"
                variant="primary"
                icon={FiSave}
                loading={saving}
                disabled={dirtyCount === 0}
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </PermissionGate>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="crm-features-toolbar">
        {/* Module Filter Tabs */}
        <div className="crm-features-tabs">
          <button
            type="button"
            className={`crm-features-tab ${activeModule === 'all' ? 'crm-features-tab--active' : ''}`}
            onClick={() => setActiveModule('all')}
          >
            All Modules
            <span className="crm-features-tab__count">{totalFeatures}</span>
          </button>

          {Object.keys(grouped).map((modKey) => {
            const meta = MODULE_META[modKey] || { label: modKey };
            const count = grouped[modKey]?.length || 0;
            return (
              <button
                key={modKey}
                type="button"
                className={`crm-features-tab ${activeModule === modKey ? 'crm-features-tab--active' : ''}`}
                onClick={() => setActiveModule(modKey)}
              >
                {meta.label}
                <span className="crm-features-tab__count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Quick Toggles */}
        <div className="crm-features-search-row">
          <div className="crm-features-search-wrap">
            <FiSearch className="crm-features-search-icon w-4 h-4" />
            <input
              type="text"
              className="crm-features-search-input"
              placeholder="Search features by name, key or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="crm-features-search-clear"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="crm-features-status-toggle">
            <button
              type="button"
              className={`crm-status-btn ${statusFilter === 'all' ? 'crm-status-btn--active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`crm-status-btn ${statusFilter === 'enabled' ? 'crm-status-btn--active' : ''}`}
              onClick={() => setStatusFilter('enabled')}
            >
              Enabled
            </button>
            <button
              type="button"
              className={`crm-status-btn ${statusFilter === 'disabled' ? 'crm-status-btn--active' : ''}`}
              onClick={() => setStatusFilter('disabled')}
            >
              Disabled
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Feature Blocks */}
      {!hasAnyResults ? (
        <div className="crm-features-empty">
          <div className="crm-features-empty__icon">
            <FiFilter className="w-6 h-6" />
          </div>
          <h4>No feature toggles match your filter</h4>
          <p>Try clearing your search term or selecting another module filter.</p>
          {(search || activeModule !== 'all' || statusFilter !== 'all') && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => {
                setSearch('');
                setActiveModule('all');
                setStatusFilter('all');
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="crm-settings-features__groups">
          {Object.entries(filteredGroups).map(([moduleKey, items]) => {
            const meta = MODULE_META[moduleKey] || { label: moduleKey };
            const groupEnabledCount = items.filter((i) => effectiveFlags[i.key]).length;

            return (
              <section key={moduleKey} className="crm-feature-section-card">
                <div className="crm-feature-section-head">
                  <div className="crm-feature-section-head__left">
                    <div>
                      <h3 className="crm-feature-section-title">{meta.label}</h3>
                      <p className="crm-feature-section-sub">
                        {groupEnabledCount} of {items.length} features active
                      </p>
                    </div>
                  </div>

                  <div className="crm-feature-section-head__actions">
                    <button
                      type="button"
                      className="crm-section-quick-btn"
                      onClick={() => handleToggleGroup(moduleKey, true)}
                      title="Enable all features in this section"
                    >
                      Enable All
                    </button>
                    <span className="crm-section-quick-sep">·</span>
                    <button
                      type="button"
                      className="crm-section-quick-btn"
                      onClick={() => handleToggleGroup(moduleKey, false)}
                      title="Disable all features in this section"
                    >
                      Disable All
                    </button>
                  </div>
                </div>

                <div className="crm-feature-section-body">
                  {items.map((item) => (
                    <ToggleCard
                      key={item.key}
                      item={item}
                      checked={Boolean(effectiveFlags[item.key])}
                      onChange={handleToggle}
                      allFlags={effectiveFlags}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
