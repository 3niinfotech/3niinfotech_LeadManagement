import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiDatabase, FiSearch } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { PERMISSIONS, hasAnyPermission } from '../../../config/permissions';
import { MASTER_SECTIONS, searchMasterItems, getMasterTypeMeta } from '../../../config/master-registry.config';
import { masterApi, getApiErrorMessage } from '../../master/services/masterApi.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { isMastersForcedHidden } from '../../../config/access-policy';

function resolveIcon(name) {
  return FiIcons[name] || FiIcons.FiCircle;
}

function TypeBadge({ type }) {
  const meta = getMasterTypeMeta(type);
  const tone = {
    simple: 'crm-settings-master-badge--simple',
    relational: 'crm-settings-master-badge--relational',
    workflow: 'crm-settings-master-badge--workflow',
    module: 'crm-settings-master-badge--module',
    config: 'crm-settings-master-badge--config',
  }[type] || 'crm-settings-master-badge--simple';
  return <span className={`crm-settings-master-badge ${tone}`}>{meta.label}</span>;
}

function MasterRow({ item, counts }) {
  const Icon = resolveIcon(item.icon);
  return (
    <Link to={item.route} className="crm-settings-master-row">
      <span className="crm-settings-master-row__icon">
        <Icon size={16} />
      </span>
      <span className="crm-settings-master-row__body min-w-0">
        <span className="crm-settings-master-row__title">
          {item.label}
          <TypeBadge type={item.type} />
        </span>
        <span className="crm-settings-master-row__desc">{item.description}</span>
        {item.usedIn?.length > 0 && (
          <span className="crm-settings-master-row__meta">Used in: {item.usedIn.join(', ')}</span>
        )}
      </span>
      <span className="crm-settings-master-row__tail">
        {counts != null && (
          <span className="crm-settings-master-row__count">{counts.total ?? 0} records</span>
        )}
        <FiChevronRight size={14} />
      </span>
    </Link>
  );
}

export default function MasterHubWorkspace() {
  const { permissions, roleSlug, can } = usePermissions();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('all');

  const canSeeItem = (entry) => {
    if (isMastersForcedHidden(roleSlug)) return false;
    if (!entry.permissionKey) {
      return can(PERMISSIONS.MASTERS_VIEW) || can(PERMISSIONS.MASTERS_MANAGE);
    }
    return hasAnyPermission(permissions, [
      entry.permissionKey,
      PERMISSIONS.MASTERS_VIEW,
      PERMISSIONS.MASTERS_MANAGE,
    ]);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await masterApi.summary();
        if (!cancelled) setSummary(res?.data || res || {});
      } catch (err) {
        if (!cancelled) {
          setSummary(null);
          setError(getApiErrorMessage(err, 'Unable to load master summary'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const query = search.trim();
  const matchedItems = useMemo(
    () => searchMasterItems(query).filter(canSeeItem),
    [query, permissions, roleSlug],
  );

  const visibleSections = useMemo(
    () => MASTER_SECTIONS.map((s) => ({
      ...s,
      items: s.items
        .filter((i) => !i.hidden && canSeeItem(i))
        .map((i) => ({ ...i, sectionLabel: s.label })),
    })).filter((s) => s.items.length > 0),
    [permissions, roleSlug],
  );

  const filteredSections = activeSection === 'all'
    ? visibleSections
    : visibleSections.filter((s) => s.id === activeSection);

  return (
    <div className="crm-settings-master">
      <div className="crm-settings-master__toolbar">
        <div className="crm-settings-master__search">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search masters…"
            icon={FiSearch}
          />
        </div>
        {!query && (
          <div className="crm-settings-master__filters">
            <button
              type="button"
              className={`crm-settings-master__filter ${activeSection === 'all' ? 'crm-settings-master__filter--active' : ''}`}
              onClick={() => setActiveSection('all')}
            >
              All
            </button>
            {visibleSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`crm-settings-master__filter ${activeSection === section.id ? 'crm-settings-master__filter--active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <Card className="p-3 text-sm text-danger mb-3">{error}</Card>}

      {loading && !summary ? (
        <p className="text-sm text-text-muted">Loading master data…</p>
      ) : query ? (
        matchedItems.length === 0 ? (
          <Card className="p-8 text-center text-text-muted text-sm">
            No masters match “{search}”
          </Card>
        ) : (
          <div className="crm-settings-master__list">
            {matchedItems.map((item) => (
              <MasterRow
                key={item.id}
                item={item}
                counts={item.engine ? summary?.[item.entity || item.id] : null}
              />
            ))}
          </div>
        )
      ) : (
        <div className="crm-settings-master__sections">
          {filteredSections.map((section) => (
            <section key={section.id} className="crm-settings-master__section">
              <header className="crm-settings-master__section-head">
                <FiDatabase size={14} />
                <div>
                  <h3>{section.label}</h3>
                  <p>{section.description}</p>
                </div>
              </header>
              <div className="crm-settings-master__list">
                {section.items.map((item) => (
                  <MasterRow
                    key={item.id}
                    item={item}
                    counts={item.engine ? summary?.[item.entity || item.id] : null}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
