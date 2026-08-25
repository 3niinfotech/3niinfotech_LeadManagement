import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import dayjs from 'dayjs';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DataGrid from '../../../components/table/DataGrid';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';
import { createActionsColumn } from '../../../components/table/grid.columns';
import MasterListToolbar from '../components/MasterListToolbar';
import { ROUTES } from '../../../config/routes';
import { resolveMasterPage, buildMasterBreadcrumbs, getMasterTypeMeta } from '../../../config/master-registry.config';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { useMasterOptions } from '../hooks/useMasterOptions';
import { masterApi, getApiErrorMessage } from '../services/masterApi.service';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { apiPost } from '../../../api/apiClient';
import { API } from '../../../config/api';

const MASTER_ITEM_CATEGORY = {
  tags: 'tags',
  'fee-type': 'fee-type',
  'invoice-service-type': 'fee-type',
  applyLevel: 'applyLevel',
  courseFinderLevel: 'applyLevel',
};

export function isMasterItemSlug(slug) {
  return Boolean(MASTER_ITEM_CATEGORY[slug]);
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
  'invoice-service-type': {
    singular: 'Invoice Service Type',
    plural: 'Invoice Service Types',
    hint: 'Same Fee Type master — used as invoice service lines.',
  },
  applyLevel: {
    singular: 'Apply Level',
    plural: 'Apply Levels',
    hint: 'Application/enquiry apply levels used across the journey.',
  },
  courseFinderLevel: {
    singular: 'Course Finder Level',
    plural: 'Course Finder Levels',
    hint: 'Same Apply Level values — used when filtering courses.',
  },
};

function resolveIcon(name) {
  return FiIcons[name] || FiIcons.FiCircle;
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function MasterItemPage() {
  const { slug } = useParams();
  const hubItem = resolveMasterPage(slug)?.hubItem;
  const meta = MASTER_ITEM_META[slug];
  const category = MASTER_ITEM_CATEGORY[slug] || slug;
  const Icon = resolveIcon(hubItem?.icon || 'FiDatabase');
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MASTERS_MANAGE) || can(PERMISSIONS.SETTINGS_UPDATE);

  const { reload: reloadOptions } = useMasterOptions(category, { enabled: Boolean(category) });

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [actionId, setActionId] = useState(null);
  const hasLoaded = useRef(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editSortOrder, setEditSortOrder] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!category) return;
    const isFirst = !hasLoaded.current;
    if (isFirst) setLoading(true);
    else setFetching(true);
    setError(null);
    try {
      const res = await masterApi.listMasterItems(category, {
        page: pagination.page,
        pageSize: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter,
      });
      setRows(Array.isArray(res?.data) ? res.data : []);
      setPagination((prev) => ({
        ...prev,
        ...(res?.pagination || {}),
        page: res?.pagination?.page || prev.page,
        limit: res?.pagination?.limit || prev.limit,
        total: res?.pagination?.total ?? 0,
        totalPages: res?.pagination?.totalPages ?? 0,
      }));
      hasLoaded.current = true;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to load items');
      setError(message);
      toastService.error(message);
      setRows([]);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [category, pagination.page, pagination.limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = useCallback(async () => {
    const label = newLabel.trim();
    if (!label) return;
    setSaving(true);
    try {
      await apiPost(API.MASTER_OPTIONS(category), { label });
      toastService.success(`${meta?.singular || 'Item'} added`);
      setNewLabel('');
      setAddOpen(false);
      await reloadOptions();
      await load();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, `Failed to add ${meta?.singular?.toLowerCase() || 'item'}`));
    } finally {
      setSaving(false);
    }
  }, [newLabel, category, reloadOptions, load, meta?.singular]);

  const openEdit = useCallback((row) => {
    setEditing(row);
    setEditLabel(row.label || '');
    setEditSortOrder(row.sortOrder != null ? String(row.sortOrder) : '');
    setEditOpen(true);
  }, []);

  const handleEdit = useCallback(async () => {
    if (!editing) return;
    const label = editLabel.trim();
    if (!label) return;
    setSaving(true);
    try {
      await masterApi.updateMasterItem(category, editing.id, {
        label,
        ...(editSortOrder !== '' ? { sortOrder: Number(editSortOrder) } : {}),
      });
      toastService.success(`${meta?.singular || 'Item'} updated`);
      setEditOpen(false);
      setEditing(null);
      await reloadOptions();
      await load();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Update failed'));
    } finally {
      setSaving(false);
    }
  }, [editing, editLabel, editSortOrder, category, reloadOptions, load, meta?.singular]);

  const handleStatusToggle = useCallback(async (row) => {
    if (!canManage) return;
    const next = !row.isActive;
    const ok = await alertService.confirm({
      title: next ? 'Activate' : 'Deactivate',
      text: `Mark "${row.label}" as ${next ? 'active' : 'inactive'}?`,
      confirmText: next ? 'Activate' : 'Deactivate',
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await masterApi.updateMasterItemStatus(category, row.id, next);
      toastService.success(`Marked ${next ? 'active' : 'inactive'}`);
      await reloadOptions();
      await load();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Status update failed'));
    } finally {
      setActionId(null);
    }
  }, [canManage, category, reloadOptions, load]);

  const handleDelete = useCallback(async (row) => {
    if (!canManage) return;
    const ok = await alertService.softDeleteConfirm({
      title: `Delete ${meta?.singular || 'Item'}`,
      text: 'This item will be soft-deleted.',
      itemName: row.label,
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await masterApi.removeMasterItem(category, row.id);
      toastService.success(`${meta?.singular || 'Item'} deleted`);
      await reloadOptions();
      await load();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Delete failed'));
    } finally {
      setActionId(null);
    }
  }, [canManage, category, reloadOptions, load, meta?.singular]);

  const columns = useMemo(() => [
    { field: 'label', headerName: 'Label', flex: 1, minWidth: 200 },
    { field: 'sortOrder', headerName: 'Order', width: 90 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 110,
      cellRenderer: (p) => <StatusPill active={Boolean(p.value)} />,
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 140,
      valueFormatter: (p) => (p.value && dayjs(p.value).isValid() ? dayjs(p.value).format('DD MMM YYYY') : '—'),
    },
    createActionsColumn({
      width: canManage ? 148 : 72,
      cellRenderer: (p) => {
        const row = p.data;
        const busy = actionId === row.id;
        return (
          <div className="crm-grid-actions" onClick={(e) => e.stopPropagation()}>
            {canManage && (
              <>
                <button
                  type="button"
                  className="crm-grid-action-btn crm-grid-action-btn--edit"
                  title="Edit"
                  aria-label="Edit"
                  disabled={busy}
                  onClick={() => openEdit(row)}
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="crm-grid-action-btn"
                  title={row.isActive ? 'Deactivate' : 'Activate'}
                  aria-label="Toggle status"
                  disabled={busy}
                  onClick={() => handleStatusToggle(row)}
                >
                  {row.isActive
                    ? <FiToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                    : <FiToggleLeft className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  className="crm-grid-action-btn crm-grid-action-btn--delete"
                  title="Delete"
                  aria-label="Delete"
                  disabled={busy}
                  onClick={() => handleDelete(row)}
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        );
      },
    }),
  ], [canManage, actionId, openEdit, handleStatusToggle, handleDelete]);

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
        subtitle={`${getMasterTypeMeta(hubItem.type).label} · ${hubItem.description}${hubItem.usedIn?.length ? ` · Used in ${hubItem.usedIn.join(', ')}` : ''}`}
        icon={Icon}
        breadcrumbs={buildMasterBreadcrumbs(hubItem)}
        actions={canManage ? (
          <Button size="sm" icon={FiPlus} onClick={() => setAddOpen(true)}>
            Add {meta.singular}
          </Button>
        ) : null}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <MasterListToolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            searchPlaceholder={`Search ${meta.plural.toLowerCase()}…`}
            searchAriaLabel={`Search ${meta.plural}`}
            status={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onRefresh={load}
            refreshing={fetching}
            hint={meta.hint}
            trailing={(
              <span className="hidden sm:inline text-[12px] text-text-muted tabular-nums pr-1">
                {pagination.total} {pagination.total === 1 ? meta.singular.toLowerCase() : meta.plural.toLowerCase()}
              </span>
            )}
          />

          <ModulePageCard.Table className="min-h-[320px]">
            <DataGrid
              columns={columns}
              rowData={rows}
              loading={loading}
              fetching={fetching}
              pagination={false}
              getRowId={(p) => p.data.id}
              emptyTitle={error
                ? `Unable to load ${meta.plural.toLowerCase()}`
                : (debouncedSearch || statusFilter !== 'all')
                  ? `No ${meta.plural.toLowerCase()} match your search`
                  : `No ${meta.plural.toLowerCase()} yet`}
              emptyDescription={error
                ? error
                : canManage && !debouncedSearch && statusFilter === 'all'
                  ? `Click Add ${meta.singular} to create one.`
                  : 'Try adjusting search or status filter.'}
              emptyActionLabel={error ? 'Retry' : undefined}
              onEmptyAction={error ? load : undefined}
            />
          </ModulePageCard.Table>

          <Pagination
            page={pagination.page || 1}
            limit={pagination.limit || 25}
            total={pagination.total || 0}
            totalPages={pagination.totalPages || 0}
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
          />
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

      <Modal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditing(null); }}
        title={`Edit ${meta.singular}`}
        footer={(
          <>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditing(null); }}>Cancel</Button>
            <Button loading={saving} onClick={handleEdit}>Save</Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Input
            label={`${meta.singular} label`}
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            autoFocus
          />
          <Input
            label="Sort order"
            type="number"
            min={0}
            value={editSortOrder}
            onChange={(e) => setEditSortOrder(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
