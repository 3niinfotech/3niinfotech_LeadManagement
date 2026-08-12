import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiDatabase, FiChevronRight } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import { ROUTES } from '../../../config/routes';
import { MASTER_SECTIONS } from '../../../config/master-registry.config';
import { masterApi, getApiErrorMessage } from '../services/masterApi.service';

function resolveIcon(name) {
  return FiIcons[name] || FiIcons.FiCircle;
}

function CountStrip({ summary }) {
  if (!summary) {
    return <p className="text-[11px] text-text-muted mt-2">—</p>;
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
      <span className="rounded bg-surface-muted px-1.5 py-0.5 text-text-muted">
        Total <strong className="text-text">{summary.total ?? 0}</strong>
      </span>
      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
        Active <strong>{summary.active ?? 0}</strong>
      </span>
      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
        Inactive <strong>{summary.inactive ?? 0}</strong>
      </span>
    </div>
  );
}

export default function MasterHubPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <ModulePageCard
      title="Master Data"
      subtitle="Manage all reference data — organization, academic, visa, finance, CRM and system config"
      icon={FiDatabase}
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Master' },
      ]}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-6">
        {error && (
          <Card className="p-3 text-sm text-danger">{error}</Card>
        )}
        {MASTER_SECTIONS.map((section) => (
          <div key={section.id}>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-text">{section.label}</h2>
              <p className="text-sm text-text-muted">{section.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {section.items.map((item) => {
                const Icon = resolveIcon(item.icon);
                const entityKey = item.entity || item.id;
                const counts = item.engine ? summary?.[entityKey] : null;
                return (
                  <Link key={item.id} to={item.route} className="block group">
                    <Card className="p-4 h-full transition-shadow hover:shadow-md">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon size={18} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text group-hover:text-primary truncate">
                              {item.label}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.description}</p>
                            {item.engine ? (
                              loading && !summary
                                ? <p className="text-[11px] text-text-muted mt-2">Loading counts…</p>
                                : <CountStrip summary={counts} />
                            ) : (
                              <p className="text-[11px] text-text-muted mt-2">Separate module</p>
                            )}
                          </div>
                        </div>
                        <FiChevronRight className="shrink-0 text-text-muted group-hover:text-primary mt-1" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ModulePageCard>
  );
}
