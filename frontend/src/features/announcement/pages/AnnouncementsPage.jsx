import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  FiEdit2, FiEye, FiImage, FiPaperclip, FiPlus, FiRefreshCw, FiToggleLeft, FiToggleRight, FiTrash2, FiUsers, FiVolume2,
} from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import ContentLoader from '../../../components/ui/ContentLoader';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { useMasterList } from '../../master/hooks/useMasterList';
import { masterApi, getApiErrorMessage } from '../../master/services/masterApi.service';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { fetchNotifications } from '../../../modules/notification/redux/notificationSlice';
import AnnouncementFormDrawer from '../components/AnnouncementFormDrawer';
import AnnouncementAttachmentList from '../components/AnnouncementAttachmentList';
import AnnouncementViewersDrawer from '../components/AnnouncementViewersDrawer';
import { announcementApi } from '../services/announcementApi.service';
import {
  buildAnnouncementPayload,
  getAnnouncementHeroImage,
  mapAnnouncementFormRecord,
  normalizeAttachmentsFromVars,
  parseAnnouncementVariables,
  resolveUploadSrc,
} from '../utils/announcement.utils';
import '../../../components/layout/header-panels/announcements.theme.css';
import '../styles/announcements-page.theme.css';
import '../styles/announcement-attachments.theme.css';

const ENGINE_ENTITY = 'communication-template';

function audienceLabel(key) {
  const options = [
    { value: 'student_portal', label: 'Students only' },
    { value: 'counsellor', label: 'Counsellors' },
    { value: 'reception', label: 'Reception' },
    { value: 'all_staff', label: 'All staff' },
    { value: 'everyone', label: 'Everyone' },
  ];
  return options.find((o) => o.value === key)?.label || key || 'All staff';
}

function mapRow(row) {
  const vars = parseAnnouncementVariables(row.variables);
  const audienceKey = row.eventType || vars.audience || 'all_staff';
  const attachments = normalizeAttachmentsFromVars(vars);
  return {
    ...row,
    audienceKey,
    audienceLabel: audienceLabel(audienceKey),
    attachments,
    imageUrl: getAnnouncementHeroImage({ attachments, imageUrl: vars.imageUrl }),
  };
}

export default function AnnouncementsPage() {
  const dispatch = useDispatch();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MASTERS_MANAGE);

  const list = useMasterList(ENGINE_ENTITY, {
    initialFilters: { channel: 'ANNOUNCEMENT' },
    defaultSort: 'updatedAt',
    defaultSortDirection: 'desc',
  });

  const [drawer, setDrawer] = useState({ open: false, mode: 'add', record: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [reachStats, setReachStats] = useState({ items: [], summary: {} });
  const [viewersDrawer, setViewersDrawer] = useState({ open: false, item: null });

  const loadReachStats = useCallback(async () => {
    if (!canManage) return;
    try {
      const res = await announcementApi.getManageStats();
      setReachStats(res?.data || { items: [], summary: {} });
    } catch {
      setReachStats({ items: [], summary: {} });
    }
  }, [canManage]);

  useEffect(() => {
    loadReachStats();
    const onViewed = () => loadReachStats();
    window.addEventListener('crm-announcement-viewed', onViewed);
    return () => window.removeEventListener('crm-announcement-viewed', onViewed);
  }, [loadReachStats, list.rows]);

  const reachById = useMemo(() => {
    const map = {};
    (reachStats.items || []).forEach((row) => {
      map[row.announcementId] = row;
    });
    return map;
  }, [reachStats.items]);

  const items = useMemo(() => (list.rows || []).map(mapRow), [list.rows]);

  const stats = useMemo(() => ({
    total: items.length,
    published: items.filter((i) => i.isActive).length,
    students: items.filter((i) => i.audienceKey === 'student_portal').length,
    withFiles: items.filter((i) => (i.attachments || []).length > 0).length,
    totalViews: reachStats.summary?.totalViews || 0,
    reachPercent: reachStats.summary?.overallReachPercent || 0,
  }), [items, reachStats.summary]);

  const openDrawer = useCallback((mode, record = null) => {
    setDrawer({
      open: true,
      mode,
      record: record ? mapAnnouncementFormRecord(record) : null,
    });
    setSubmitError(null);
  }, []);

  const closeDrawer = () => {
    setDrawer({ open: false, mode: 'add', record: null });
    setSubmitError(null);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = buildAnnouncementPayload({ ...payload, channel: 'ANNOUNCEMENT' }, drawer.record);
      let res;
      if (drawer.mode === 'add') {
        res = await masterApi.create(ENGINE_ENTITY, body);
        await notifyPublishResult(res?.data, 'Announcement published');
      } else {
        res = await masterApi.update(ENGINE_ENTITY, drawer.record.id, body);
        await notifyPublishResult(res?.data, 'Announcement updated');
      }
      closeDrawer();
      list.reload();
      loadReachStats();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Save failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const notifyPublishResult = async (record, baseMessage) => {
    if (!record?.isActive) {
      toastService.success(`${baseMessage} (saved as draft — publish to send notifications)`);
      return;
    }

    let count = record?.notificationRecipients ?? 0;
    let dispatched = record?.notificationDispatched;

    if (!dispatched && record?.id) {
      try {
        const resent = await announcementApi.resendNotifications(record.id);
        count = resent?.data?.recipientCount ?? 0;
        dispatched = Boolean(resent?.data?.dispatched);
      } catch {
        /* fall through to warning below */
      }
    }

    if (dispatched && count > 0) {
      toastService.success(`${baseMessage} — ${count} notification${count === 1 ? '' : 's'} sent to audience`);
      dispatch(fetchNotifications());
      window.dispatchEvent(new Event('crm-announcements-new'));
      return;
    }
    if (record?.notificationWarning) {
      toastService.warning(`${baseMessage}. ${record.notificationWarning}`);
      return;
    }
    if (!dispatched) {
      toastService.warning(`${baseMessage}. Notifications could not be sent — use "Send notifications" on the card.`);
      return;
    }
    toastService.success(baseMessage);
  };

  const toggleStatus = async (row) => {
    if (!canManage) return;
    const next = !row.isActive;
    const ok = await alertService.confirm({
      title: next ? 'Publish announcement' : 'Unpublish announcement',
      text: `"${row.name}" will be ${next ? 'visible to the target audience' : 'hidden'}.`,
      confirmText: next ? 'Publish' : 'Unpublish',
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      const res = await masterApi.updateStatus(ENGINE_ENTITY, row.id, next);
      if (next) {
        await notifyPublishResult(res?.data, 'Published');
      } else {
        toastService.success('Unpublished');
      }
      list.reload();
      loadReachStats();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Status update failed'));
    } finally {
      setActionId(null);
    }
  };

  const resendNotifications = async (row) => {
    if (!canManage || !row?.isActive) return;
    setActionId(row.id);
    try {
      const res = await announcementApi.resendNotifications(row.id);
      const count = res?.data?.recipientCount || 0;
      if (res?.data?.dispatched && count > 0) {
        toastService.success(`Notifications sent to ${count} user${count === 1 ? '' : 's'}`);
        dispatch(fetchNotifications());
      } else {
        toastService.warning(res?.data?.reason === 'no_recipients'
          ? 'No active users found for this audience'
          : 'Notifications could not be sent');
      }
      loadReachStats();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Failed to send notifications'));
    } finally {
      setActionId(null);
    }
  };

  const remove = async (row) => {
    if (!canManage) return;
    const ok = await alertService.softDeleteConfirm({
      title: 'Delete announcement',
      text: `Remove "${row.name}"? This cannot be undone.`,
      itemName: row.name,
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await masterApi.remove(ENGINE_ENTITY, row.id);
      toastService.success('Announcement deleted');
      list.reload();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Delete failed'));
    } finally {
      setActionId(null);
    }
  };

  if (list.loading && !items.length) return <ContentLoader variant="module" />;

  return (
    <ModulePageCard
      title="Announcements"
      subtitle="Publish with files & role targeting — force notifications + track who viewed"
      icon={FiVolume2}
      breadcrumbs={[
        { label: 'Admin', path: ROUTES.DASHBOARD },
        { label: 'Masters', path: ROUTES.MASTER },
        { label: 'Communication', path: `${ROUTES.MASTER}#master-communication` },
        { label: 'Announcements' },
      ]}
      actions={canManage ? (
        <Button size="sm" onClick={() => openDrawer('add')}>
          <FiPlus className="w-4 h-4 mr-1" />
          New announcement
        </Button>
      ) : null}
    >
      <div className="crm-ann-page">
        <div className="crm-ann-page__hero">
          <div>
            <p className="crm-ann-page__hero-title">Communication center</p>
            <p className="crm-ann-page__hero-text">
              Every publish sends notifications to the target audience. Track views, reach %, and who opened each notice.
            </p>
          </div>
          <div className="crm-ann-page__stats">
            <div className="crm-ann-page__stat">
              <strong>{stats.published}</strong>
              <span>Published</span>
            </div>
            <div className="crm-ann-page__stat">
              <strong>{stats.totalViews}</strong>
              <span>Total views</span>
            </div>
            <div className="crm-ann-page__stat">
              <strong>{stats.reachPercent}%</strong>
              <span>Overall reach</span>
            </div>
            <div className="crm-ann-page__stat">
              <strong>{stats.total}</strong>
              <span>Total</span>
            </div>
          </div>
        </div>

        <div className="crm-ann-page__toolbar">
          <input
            type="search"
            className="crm-ann-page__search"
            placeholder="Search title or code…"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
          />
          <button type="button" className="crm-ann-page__refresh" onClick={() => { list.reload(); loadReachStats(); }} disabled={list.fetching}>
            <FiRefreshCw className={`w-4 h-4 ${list.fetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {list.error && (
          <p className="crm-ann-page__error">{list.error}</p>
        )}

        {items.length === 0 ? (
          <div className="crm-ann-empty">
            <div className="crm-ann-empty__icon">
              <FiVolume2 className="w-7 h-7" />
            </div>
            <p className="crm-ann-empty__title">No announcements yet</p>
            <p className="crm-ann-empty__hint">
              Create your first announcement — add a message, upload images or files, and choose your audience.
            </p>
            {canManage && (
              <Button size="sm" className="mt-4" onClick={() => openDrawer('add')}>
                <FiPlus className="w-4 h-4 mr-1" />
                Create announcement
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="crm-ann-page__grid">
              {items.map((item) => {
                const imageSrc = resolveUploadSrc(item.imageUrl);
                const fileCount = (item.attachments || []).filter((a) => a.kind !== 'image').length;
                const busy = actionId === item.id;
                const reach = reachById[item.id] || {};
                return (
                  <article key={item.id} className={`crm-ann-page__card ${item.isActive ? '' : 'crm-ann-page__card--draft'}`}>
                    <div className="crm-ann-page__card-media">
                      {imageSrc ? (
                        <img src={imageSrc} alt="" loading="lazy" />
                      ) : (
                        <div className="crm-ann-page__card-media-fallback">
                          <FiImage className="w-8 h-8" />
                        </div>
                      )}
                      <span className={`crm-ann-page__status ${item.isActive ? 'crm-ann-page__status--live' : ''}`}>
                        {item.isActive ? 'Published' : 'Draft'}
                      </span>
                      {(item.attachments || []).length > 0 && (
                        <span className="crm-ann-page__files-badge">
                          <FiPaperclip className="w-3 h-3" />
                          {(item.attachments || []).length}
                        </span>
                      )}
                    </div>
                    <div className="crm-ann-page__card-body">
                      <div className="crm-ann-card__badges">
                        <span className="crm-ann-badge crm-ann-badge--audience">
                          <FiUsers className="w-3 h-3" />
                          {item.audienceLabel}
                        </span>
                        {fileCount > 0 && (
                          <span className="crm-ann-badge crm-ann-badge--files">
                            {fileCount} file{fileCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                      <h3 className="crm-ann-page__card-title">{item.name}</h3>
                      {item.subject && (
                        <p className="crm-ann-page__card-sub">{item.subject}</p>
                      )}
                      <p className="crm-ann-page__card-excerpt">{item.body}</p>
                      {(item.attachments || []).length > 0 && (
                        <AnnouncementAttachmentList attachments={item.attachments} compact />
                      )}

                      {item.isActive && canManage && (
                        <div className="crm-ann-page__reach">
                          <div className="crm-ann-page__reach-bar" aria-hidden>
                            <span
                              className="crm-ann-page__reach-fill"
                              style={{ width: `${reach.viewPercent || 0}%` }}
                            />
                          </div>
                          <div className="crm-ann-page__reach-meta">
                            <span>
                              <FiEye className="w-3.5 h-3.5" />
                              <strong>{reach.viewCount ?? 0}</strong>
                              {' '}
                              viewed
                              {reach.audienceSize ? ` / ${reach.audienceSize} notified` : ''}
                            </span>
                            <span className="crm-ann-page__reach-pct">{reach.viewPercent ?? 0}% reach</span>
                          </div>
                          <button
                            type="button"
                            className="crm-ann-page__reach-btn"
                            onClick={() => setViewersDrawer({ open: true, item })}
                          >
                            View who opened
                          </button>
                          {(!reach.notifyRecipientCount || !reach.lastNotifiedAt) && (
                            <button
                              type="button"
                              className="crm-ann-page__reach-btn crm-ann-page__reach-btn--notify"
                              disabled={busy}
                              onClick={() => resendNotifications(item)}
                            >
                              Send notifications
                            </button>
                          )}
                        </div>
                      )}

                      <p className="crm-ann-page__card-date">
                        Updated {new Date(item.updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                      {canManage && (
                        <div className="crm-ann-page__card-actions">
                          <button type="button" disabled={busy} onClick={() => openDrawer('edit', item)}>
                            <FiEdit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button type="button" disabled={busy} onClick={() => toggleStatus(item)}>
                            {item.isActive ? <FiToggleRight className="w-3.5 h-3.5" /> : <FiToggleLeft className="w-3.5 h-3.5" />}
                            {item.isActive ? 'Unpublish' : 'Publish'}
                          </button>
                          <button type="button" disabled={busy} onClick={() => remove(item)} className="crm-ann-page__danger">
                            <FiTrash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <Pagination
              page={list.pagination.page || 1}
              limit={list.pagination.limit || 25}
              total={list.pagination.total || 0}
              totalPages={list.pagination.totalPages || 0}
              onPageChange={list.setPage}
              onPageSizeChange={list.setPageSize}
            />
          </>
        )}
      </div>

      <AnnouncementViewersDrawer
        open={viewersDrawer.open}
        announcement={viewersDrawer.item}
        onClose={() => setViewersDrawer({ open: false, item: null })}
      />

      <AnnouncementFormDrawer
        open={drawer.open}
        mode={drawer.mode}
        record={drawer.record}
        submitting={submitting}
        submitError={submitError}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
      />
    </ModulePageCard>
  );
}
