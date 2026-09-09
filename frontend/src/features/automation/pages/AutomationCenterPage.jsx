import { useMemo, useState } from 'react';
import { FiActivity, FiClock, FiRefreshCw, FiZap } from 'react-icons/fi';
import ModulePageLayout from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import PermissionGate from '../../../components/common/PermissionGate';
import { PERMISSIONS } from '../../../config/permissions';
import toastService from '../../../services/toast/toast.service';
import {
  useGetAutomationCenterQuery,
  useUpdateAutomationRuleMutation,
} from '../redux/automationApiSlice';
import '../styles/automation.theme.css';

const CATEGORY_LABELS = {
  assignment: 'Assignment',
  sla: 'SLA',
  followup: 'Follow-up',
  demo: 'Demo',
  notification: 'Notifications',
  finance: 'Finance',
};

function healthTone(health) {
  if (health === 'healthy') return 'success';
  if (health === 'degraded') return 'warning';
  return 'neutral';
}

export default function AutomationCenterPage() {
  const [category, setCategory] = useState('all');
  const { data, isLoading, isFetching, refetch } = useGetAutomationCenterQuery();
  const [updateRule, { isLoading: toggling }] = useUpdateAutomationRuleMutation();

  const rules = useMemo(() => {
    const list = data?.rules || [];
    if (category === 'all') return list;
    return list.filter((r) => r.category === category);
  }, [data?.rules, category]);

  const handleToggle = async (rule) => {
    if (!rule.configurable) return;
    try {
      await updateRule({ ruleId: rule.id, enabled: !rule.enabled }).unwrap();
      toastService.success(`${rule.name} ${rule.enabled ? 'disabled' : 'enabled'}`);
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to update automation');
    }
  };

  if (isLoading) return <ContentLoader variant="module" />;

  const summary = data?.summary || {};

  return (
    <ModulePageLayout
      title="Automation Center"
      subtitle="Configure and monitor real workflow automations — assignment, SLA, follow-ups, demos, and notifications."
      icon={FiZap}
      actions={(
        <Button variant="outline" icon={FiRefreshCw} loading={isFetching} onClick={() => refetch()}>
          Refresh
        </Button>
      )}
    >
      <div className="automation-page">
        <div className="automation-summary">
          <div className="automation-summary__card">
            <p className="automation-summary__label">Total rules</p>
            <p className="automation-summary__value">{summary.total || 0}</p>
          </div>
          <div className="automation-summary__card">
            <p className="automation-summary__label">Enabled</p>
            <p className="automation-summary__value">{summary.enabled || 0}</p>
          </div>
          <div className="automation-summary__card">
            <p className="automation-summary__label">Disabled</p>
            <p className="automation-summary__value">{summary.disabled || 0}</p>
          </div>
          <div className="automation-summary__card">
            <p className="automation-summary__label">Health</p>
            <p className="automation-summary__value capitalize">{summary.health || '—'}</p>
            <Badge color={healthTone(summary.health)} className="mt-1 text-[10px]">
              Live engines
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`h-8 px-3 rounded-lg text-[12px] font-semibold border ${
              category === 'all' ? 'bg-brand-soft text-brand border-brand/25' : 'border-border text-text-muted'
            }`}
          >
            All
          </button>
          {(data?.categories || []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`h-8 px-3 rounded-lg text-[12px] font-semibold border ${
                category === c.id ? 'bg-brand-soft text-brand border-brand/25' : 'border-border text-text-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div>
          {rules.map((rule) => (
            <div key={rule.id} className="automation-rule-row">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="automation-rule-row__title">{rule.name}</p>
                  <Badge color={rule.enabled ? 'success' : 'neutral'} className="text-[10px]">
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Badge color="info" className="text-[10px]">
                    {CATEGORY_LABELS[rule.category] || rule.category}
                  </Badge>
                </div>
                <p className="automation-rule-row__desc">{rule.description}</p>
                <p className="automation-rule-row__meta">
                  Trigger: {rule.trigger}
                  {' · '}
                  Action: {rule.action}
                </p>
                <p className="automation-rule-row__meta">
                  <FiClock className="inline w-3 h-3 mr-1" />
                  Last run:
                  {' '}
                  {rule.lastExecutedAt
                    ? new Date(rule.lastExecutedAt).toLocaleString()
                    : 'No executions recorded'}
                  {' · '}
                  Count: {rule.executionCount || 0}
                </p>
              </div>
              <PermissionGate permissions={[PERMISSIONS.SETTINGS_UPDATE]}>
                {rule.configurable ? (
                  <Button
                    size="sm"
                    variant={rule.enabled ? 'outline' : 'primary'}
                    loading={toggling}
                    onClick={() => handleToggle(rule)}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </Button>
                ) : (
                  <Badge color="neutral" className="text-[10px]">System cron</Badge>
                )}
              </PermissionGate>
            </div>
          ))}
        </div>

        <div className="border border-border rounded-lg bg-card-bg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiActivity className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-text">Recent executions</h3>
          </div>
          {(data?.recentExecutions || []).length === 0 ? (
            <p className="text-sm text-text-muted">No automation executions logged yet.</p>
          ) : (
            (data.recentExecutions || []).map((row) => (
              <div key={row.id} className="automation-history-row">
                <div>
                  <p className="font-medium text-text">{row.message}</p>
                  <p className="text-text-muted mt-0.5">
                    {row.automationId}
                    {' · '}
                    {row.event}
                    {row.entityId ? ` · ${row.entityType} ${row.entityId}` : ''}
                  </p>
                </div>
                <span className="text-text-muted whitespace-nowrap">
                  {row.executedAt ? new Date(row.executedAt).toLocaleString() : '—'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </ModulePageLayout>
  );
}
