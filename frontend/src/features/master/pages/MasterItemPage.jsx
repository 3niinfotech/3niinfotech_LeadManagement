import { useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiRefreshCw, FiPlus } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DataGrid from '../../../components/table/DataGrid';
import Modal from '../../../components/ui/Modal';
import { ROUTES } from '../../../config/routes';
import { resolveMasterPage } from '../../../config/master-registry.config';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { useMasterOptions } from '../hooks/useMasterOptions';
import toastService from '../../../services/toast/toast.service';

const MASTER_ITEM_SLUGS = new Set(['tags', 'fee-type']);

export function isMasterItemSlug(slug) {
  return MASTER_ITEM_SLUGS.has(slug);
}

const MASTER_ITEM_META = {
  tags: {
    singular: 'Tag',
    plural: 'Tags',
    hint: 'Enquiry classification labels — multiple tags can be assigned per enquiry.',
  },
  'fee-type': {
    singular: 'Fee Type',
    plural: 'Fee Types',
    hint: 'Service fee type labels used across billing workflows.',
  },
};

function resolveIcon(name) {
  return FiIcons[name] || FiIcons.FiCircle;
}

export default function MasterItemPage() {
  const { slug } = useParams();
  const hubItem = resolveMasterPage(slug);
  const meta = MASTER_ITEM_META[slug];
  const Icon = resolveIcon(hubItem?.icon || 'FiDatabase');
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MASTERS_MANAGE) || can(PERMISSIONS.SETTINGS_UPDATE);

  const { options, loading, reload, ensureOption } = useMasterOptions(slug, { enabled: Boolean(slug) });
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (options || []).map((opt, index) => ({
      id: opt.id || opt.value || `row-${index}`,
      label: opt.label || opt.value,
      value: opt.value || opt.label,
    }));
    if (!q) return list;
    return list.filter((row) => row.label.toLowerCase().includes(q));
  }, [options, search]);

  const columns = useMemo(() => ([
    { field: 'label', headerName: 'Label', flex: 1, minWidth: 200 },
    { field: 'value', headerName: 'Value', flex: 1, minWidth: 160 },
  ]), []);

  const handleAdd = useCallback(async () => {
    const label = newLabel.trim();
    if (!label) return;
    setSaving(true);
    try {
      await ensureOption(label);
      toastService.success(`${meta?.singular || 'Item'} added`);
      setNewLabel('');
      setAddOpen(false);
      await reload();
    } catch {
      toastService.error(`Failed to add ${meta?.singular?.toLowerCase() || 'item'}`);
    } finally {
      setSaving(false);
    }
  }, [newLabel, ensureOption, reload, meta?.singular]);

  if (!hubItem || !meta) {
    return (
      <ModulePageCard title="Master" icon={FiIcons.FiDatabase}>
        <Card className="p-8 text-center text-text-muted">Master not found.</Card>
      </ModulePageCard>
    );
  }

  return (
    <>
      <ModulePageCard
        title={hubItem.label}
        subtitle={hubItem.description}
        icon={Icon}
        breadcrumbs={[
          { label: 'Dashboard', path: ROUTES.DASHBOARD },
          { label: 'Master', path: ROUTES.MASTER },
          { label: hubItem.label },
        ]}
        actions={canManage ? (
          <Button size="sm" icon={FiPlus} onClick={() => setAddOpen(true)}>
            Add {meta.singular}
          </Button>
        ) : null}
      >
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          <Card className="!p-3">
            <p className="text-xs text-text-muted mb-3">{meta.hint}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${meta.plural.toLowerCase()}...`}
                size="sm"
                className="max-w-xs"
              />
              <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={reload} loading={loading}>
                Refresh
              </Button>
              <span className="text-xs text-text-muted ml-auto">
                {rows.length} {rows.length === 1 ? meta.singular.toLowerCase() : meta.plural.toLowerCase()}
              </span>
            </div>
          </Card>

          <ModulePageCard.Table className="min-h-[320px]">
            <DataGrid
              columns={columns}
              rowData={rows}
              loading={loading}
              pagination={rows.length > 25}
              paginationPageSize={25}
              getRowId={(p) => p.data.id}
              emptyTitle={`No ${meta.plural.toLowerCase()} yet`}
              emptyDescription={`Run npm run db:seed-enquiry-tags in backend or click Add ${meta.singular}.`}
            />
          </ModulePageCard.Table>
        </div>
      </ModulePageCard>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Add ${meta.singular}`}
        footer={(
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleAdd}>Save</Button>
          </>
        )}
      >
        <Input
          label={`${meta.singular} label`}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={`Enter ${meta.singular.toLowerCase()} name`}
          autoFocus
        />
      </Modal>
    </>
  );
}
