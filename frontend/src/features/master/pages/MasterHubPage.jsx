import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiDatabase, FiChevronRight, FiSearch } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS, hasAnyPermission } from '../../../config/permissions';
import { MASTER_SECTIONS, searchMasterItems } from '../../../config/master-registry.config';
import { masterApi, getApiErrorMessage } from '../services/masterApi.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { isMastersForcedHidden } from '../../../config/access-policy';

function resolveIcon(name) {
  return FiIcons[name] || FiIcons.FiCircle;
}

function MasterCard({ item, summary, loading }) {
  const Icon = resolveIcon(item.icon);

  return (
    <Link
      to={item.route}
      className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:border-brand/40 hover:shadow-sm"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
              <Icon size={16} />
            </span>
            <h3 className="text-sm font-semibold text-text truncate group-hover:text-brand transition-colors">
              {item.label}
            </h3>
          </div>
          <FiChevronRight className="w-4 h-4 text-text-muted shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>

        {item.description && (
          <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11.5px] text-text-muted">
        {loading && !summary ? (
          <span className="text-[11px] text-text-muted">Loading…</span>
        ) : item.engine && summary ? (
          <span>
            <strong className="font-semibold text-text">{summary.total ?? 0}</strong> records
            {summary.active != null && summary.active !== summary.total && (
              <span className="ml-1 text-emerald-600 font-medium">({summary.active} active)</span>
            )}
          </span>
        ) : (
          <span className="text-[11px] text-text-muted">System master</span>
        )}
        <span className="text-[11px] font-medium text-brand opacity-0 group-hover:opacity-100 transition-opacity">
          Manage &rarr;
        </span>
      </div>
    </Link>
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
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-5">
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
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text hover:border-brand/40 hover:bg-page transition-colors"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {matchedItems.map((item) => (
                <MasterCard
                  key={item.id}
                  item={item}
                  summary={item.engine ? summary?.[item.entity || item.id] : null}
                  loading={loading}
                />
              ))}
            </div>
          )
        ) : (
          visibleSections.map((section) => (
            <div key={section.id} id={`master-${section.id}`} className="scroll-mt-24">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-text uppercase tracking-wider">{section.label}</h2>
                <p className="text-xs text-text-muted">{section.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
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
