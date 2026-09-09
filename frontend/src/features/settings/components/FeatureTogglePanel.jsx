import { useMemo, useState } from 'react';
import { FiRefreshCw, FiSave } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import ContentLoader from '../../../components/ui/ContentLoader';
import PermissionGate from '../../../components/common/PermissionGate';
import { PERMISSIONS } from '../../../config/permissions';
import {
  useGetAdminFeaturesQuery,
  useUpdateFeaturesMutation,
} from '../../feature/redux/featureApiSlice';
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
    <label className="crm-settings-toggle-row">
      <div className="min-w-0 flex-1">
        <p className="crm-settings-toggle-row__title">{item.name}</p>
        {item.description ? (
          <p className="crm-settings-toggle-row__desc">{item.description}</p>
        ) : null}
        <p className="crm-settings-toggle-row__key">{item.key}</p>
        {item.dependsOn?.length > 0 && (
          <p className="crm-settings-toggle-row__dep">Requires: {item.dependsOn.join(', ')}</p>
        )}
      </div>
      <input
        type="checkbox"
        className="crm-settings-toggle-row__input"
        checked={checked}
        onChange={(e) => onChange(item.key, e.target.checked)}
      />
    </label>
  );
}

/** Feature toggles body — used by Settings console and FeatureTogglePage. */
export default function FeatureTogglePanel({ showActions = true }) {
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
    <div className="crm-settings-features">
      {showActions && (
        <div className="crm-settings-features__toolbar">
          <div className="crm-settings-features__modes">
            <div>
              <span>Reception</span>
              <strong>{receptionMode}</strong>
            </div>
            <div>
              <span>Assignment</span>
              <strong>{data?.modes?.assignmentMode ?? 'MANUAL'}</strong>
            </div>
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
            >
              Refresh
            </Button>
            <PermissionGate permission={PERMISSIONS.SETTINGS_MANAGE}>
              <Button size="sm" icon={FiSave} loading={saving} disabled={!draft} onClick={handleSave}>
                Save
              </Button>
            </PermissionGate>
          </div>
        </div>
      )}

      <p className="crm-settings-features__hint">
        Toggles apply to your company. Dependencies auto-disable child features.
      </p>

      <div className="crm-settings-features__groups">
        {Object.entries(grouped).map(([module, items]) => (
          <section key={module} className="crm-settings-panel-block">
            <h3 className="crm-settings-panel-block__title">
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
          </section>
        ))}
      </div>
    </div>
  );
}
