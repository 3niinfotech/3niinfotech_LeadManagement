import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiDatabase, FiChevronRight, FiSearch } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS, hasAnyPermission } from '../../../config/permissions';
import { MASTER_SECTIONS, searchMasterItems, getMasterTypeMeta } from '../../../config/master-registry.config';
import { masterApi, getApiErrorMessage } from '../services/masterApi.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { isMastersForcedHidden } from '../../../config/access-policy';

function resolveIcon(name) {
  return FiIcons[name] || FiIcons.FiCircle;
}

function TypeBadge({ type }) {
  const meta = getMasterTypeMeta(type);
  const tone = {
    simple: 'bg-slate-100 text-slate-700',
    relational: 'bg-sky-50 text-sky-700',
    workflow: 'bg-violet-50 text-violet-700',
    module: 'bg-amber-50 text-amber-800',
    config: 'bg-emerald-50 text-emerald-800',
  }[type] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
      {meta.label}
    </span>
  );
}

function CountStrip({ summary, loading, isEngine }) {
  if (!isEngine) {
    return <p className="text-[11px] text-text-muted mt-2">Existing module / configuration</p>;
  }
  if (loading && !summary) {
    return <p className="text-[11px] text-text-muted mt-2">Loading counts…</p>;
  }
  if (!summary) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
      <span className="rounded bg-surface-muted px-1.5 py-0.5 text-text-muted">
        Records <strong className="text-text">{summary.total ?? 0}</strong>
      </span>
      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
        Active <strong>{summary.active ?? 0}</strong>
      </span>
      {(summary.inactive ?? 0) > 0 && (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
          Inactive <strong>{summary.inactive ?? 0}</strong>
        </span>
      )}
    </div>
  );
}

function MasterCard({ item, summary, loading }) {
  const Icon = resolveIcon(item.icon);
  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-start gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-text truncate">{item.label}</p>
            <TypeBadge type={item.type} />
          </div>
          <p className="text-[11px] font-medium text-primary mt-0.5">{item.sectionLabel || item.category}</p>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.description}</p>
          {item.usedIn?.length > 0 && (
            <p className="text-[11px] text-text-muted mt-2">
              Used in: {item.usedIn.join(', ')}
            </p>
          )}
          <CountStrip summary={summary} loading={loading} isEngine={item.engine} />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <Link to={item.route} className="block">
          <Button size="sm" variant="outline" className="w-full" icon={FiChevronRight}>
            Open
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function MasterHubPage() {
  const { permissions, roleSlug, can } = usePermissions();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, permissions, roleSlug],
  );

  useEffect(() => {
    if (query) return undefined;
    const hash = window.location.hash?.replace('#', '');
    if (!hash) return undefined;
    const t = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => window.clearTimeout(t);
  }, [query, loading]);

  const visibleSections = useMemo(
    () => MASTER_SECTIONS.map((s) => ({
      ...s,
      items: s.items
        .filter((i) => !i.hidden && canSeeItem(i))
        .map((i) => ({ ...i, sectionLabel: s.label })),
    })).filter((s) => s.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions, roleSlug],
  );

  return (
    <ModulePageCard
      title="Master Hub"
      subtitle="Every reference master, grouped by how the business uses it"
      icon={FiDatabase}
      breadcrumbs={[
        { label: 'Admin', path: ROUTES.DASHBOARD },
        { label: 'Masters' },
      ]}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-6">
        <div className="max-w-xl">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, or used in… e.g. visa, partner, company"
            icon={FiSearch}
          />
          {query && (
            <p className="text-xs text-text-muted mt-2">
              {matchedItems.length} result{matchedItems.length === 1 ? '' : 's'}
            </p>
          )}
        </div>

        {!query && (
          <div className="flex flex-wrap gap-2">
            {visibleSections.map((section) => (
              <a
                key={section.id}
                href={`#master-${section.id}`}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text hover:bg-row-hover hover:border-primary hover:text-primary"
              >
                {section.label}
              </a>
            ))}
          </div>
        )}

        {error && (
          <Card className="p-3 text-sm text-danger">{error}</Card>
        )}

        {query ? (
          matchedItems.length === 0 ? (
            <Card className="p-8 text-center text-text-muted text-sm">
              No masters match “{search}”
            </Card>
          ) : (
            <div className="space-y-2">
              {matchedItems.map((item) => {
                const Icon = resolveIcon(item.icon);
                const counts = item.engine ? summary?.[item.entity || item.id] : null;
                return (
                  <Link
                    key={item.id}
                    to={item.route}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-row-hover transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text truncate">{item.label}</p>
                          <TypeBadge type={item.type} />
                        </div>
                        <p className="text-xs text-text-muted truncate">
                          Admin / Masters / {item.sectionLabel} / {item.label}
                        </p>
                        {item.usedIn?.length > 0 && (
                          <p className="text-[11px] text-text-muted truncate">Used in: {item.usedIn.join(', ')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {counts != null && (
                        <span className="text-[11px] text-text-muted hidden sm:inline">
                          {counts.total ?? 0} records
                        </span>
                      )}
                      <FiChevronRight className="text-text-muted" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        ) : (
          visibleSections.map((section) => (
            <div key={section.id} id={`master-${section.id}`} className="scroll-mt-24">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-text">{section.label}</h2>
                <p className="text-sm text-text-muted">{section.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {section.items.map((item) => (
                  <MasterCard
                    key={item.id}
                    item={item}
                    summary={item.engine ? summary?.[item.entity || item.id] : null}
                    loading={loading}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </ModulePageCard>
  );
}
