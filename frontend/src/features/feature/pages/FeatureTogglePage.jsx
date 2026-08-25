import { useMemo, useState } from 'react';
import { FiRefreshCw, FiSave, FiToggleLeft } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import ContentLoader from '../../../components/ui/ContentLoader';
import PermissionGate from '../../../components/common/PermissionGate';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import {
  useGetAdminFeaturesQuery,
  useUpdateFeaturesMutation,
} from '../redux/featureApiSlice';
import toastService from '../../../services/toast/toast.service';

const MODULE_LABELS = {
  reception: 'Reception',
  calendar: 'Calendar',
  automation: 'Automation',
  communication: 'Communication',
  finance: 'Finance',
  reporting: 'Reporting',
};

function ToggleRow({ item, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0 cursor-pointer">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{item.name}</p>
        {item.description ? (
          <p className="text-xs text-text-muted mt-0.5">{item.description}</p>
        ) : null}
        <p className="text-[11px] text-text-muted mt-1 font-mono">{item.key}</p>
        {(item.dependsOn?.length > 0) && (
          <p className="text-[11px] text-warning mt-1">
            Requires: {item.dependsOn.join(', ')}
          </p>
        )}
      </div>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-primary shrink-0"
        checked={checked}
        onChange={(e) => onChange(item.key, e.target.checked)}
      />
    </label>
  );
}

export default function FeatureTogglePage() {
  const { data, isLoading, refetch, isFetching } = useGetAdminFeaturesQuery();
  const [updateFeatures, { isLoading: saving }] = useUpdateFeaturesMutation();
  const [draft, setDraft] = useState(null);

  const effectiveFlags = useMemo(() => {
    if (draft) return draft;
    return data?.flags ?? {};
  }, [draft, data?.flags]);

  const grouped = data?.grouped ?? {};
  const receptionMode = data?.modes?.receptionMode ?? 'SIMPLE';

  const handleToggle = (key, enabled) => {
    setDraft((prev) => ({ ...(prev ?? data?.flags ?? {}), [key]: enabled }));
  };

  const handleSave = async () => {
    if (!draft) return;
    const updates = Object.entries(draft).map(([key, enabled]) => ({ key, enabled }));
    try {
      await updateFeatures(updates).unwrap();
      setDraft(null);
      toastService.success('Feature toggles saved');
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to save toggles');
    }
  };

  if (isLoading) return <ContentLoader variant="module" />;

  return (
    <ModulePageCard
      title="Feature Toggle"
      subtitle="Simple Mode vs Enterprise Mode — enable modules per company without code changes"
      icon={FiToggleLeft}
      breadcrumbs={[
        { label: 'Admin', path: ROUTES.DASHBOARD },
        { label: 'Masters', path: ROUTES.MASTER },
        { label: 'System', path: `${ROUTES.MASTER}#master-system` },
        { label: 'Feature Toggle' },
      ]}
      actions={(
        <div className="flex gap-2">
          <Button variant="outline" icon={FiRefreshCw} loading={isFetching} onClick={() => { setDraft(null); refetch(); }}>
            Refresh
          </Button>
          <PermissionGate permission={PERMISSIONS.SETTINGS_UPDATE}>
            <Button icon={FiSave} loading={saving} disabled={!draft} onClick={handleSave}>
              Save Changes
            </Button>
          </PermissionGate>
        </div>
      )}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-text-muted uppercase tracking-wide">Reception Mode</p>
            <p className="text-lg font-semibold text-text mt-1">{receptionMode}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-text-muted uppercase tracking-wide">Assignment</p>
            <p className="text-lg font-semibold text-text mt-1">{data?.modes?.assignmentMode ?? 'MANUAL'}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-text-muted uppercase tracking-wide">Company</p>
            <p className="text-sm text-text mt-1">
              Toggles apply to your company. Dependencies auto-disable child features.
            </p>
          </Card>
        </div>

        {Object.entries(grouped).map(([module, items]) => (
          <Card key={module} className="p-4">
            <h3 className="text-sm font-semibold text-text mb-2">
              {MODULE_LABELS[module] || module}
            </h3>
            <div>
              {items.map((item) => (
                <ToggleRow
                  key={item.key}
                  item={item}
                  checked={Boolean(effectiveFlags[item.key])}
                  onChange={handleToggle}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </ModulePageCard>
  );
}
