import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiExternalLink, FiImage, FiUsers, FiVolume2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { announcementApi } from '../../../features/announcement/services/announcementApi.service';
import AnnouncementAttachmentList from '../../../features/announcement/components/AnnouncementAttachmentList';
import {
  countUnreadAnnouncements,
  getAnnouncementHeroImage,
  isAnnouncementUnread,
  resolveUploadSrc,
  trackAnnouncementView,
} from '../../../features/announcement/utils/announcement.utils';
import { selectUser } from '../../../redux/slices/authSlice';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import './announcements.theme.css';
import '../../../features/announcement/styles/announcement-attachments.theme.css';

const MASTER_ROUTE = '/admin/master/announcements';

function formatDate(value) {
  if (!value || !dayjs(value).isValid()) return '';
  return dayjs(value).format('DD MMM YYYY · h:mm A');
}

export default function AnnouncementPanel({ onClose }) {
  const user = useSelector(selectUser);
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.MASTERS_VIEW);

  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementApi.list({ pageSize: 20 });
      const rows = res?.data || [];
      setItems(rows);
      setOpenId(null);
      setRefreshKey((k) => k + 1);
    } catch {
      setItems([]);
      setOpenId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAnnouncement = useCallback(async (item) => {
    if (!item?.id) return;
    const nextOpen = openId === item.id ? null : item.id;
    setOpenId(nextOpen);
    if (nextOpen) {
      await trackAnnouncementView(user?.id, item);
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new Event('crm-announcements-seen'));
    }
  }, [openId, user?.id]);

  const unreadCount = useMemo(
    () => countUnreadAnnouncements(user?.id, items),
    [user?.id, items, refreshKey],
  );

  const roleLabel = user?.role?.name || user?.role?.slug || 'your role';

  return (
    <div>
      <div className="crm-ann-panel__summary">
        <div className="crm-ann-panel__stats">
          <span className="crm-ann-panel__stat">
            <strong>{items.length}</strong>
            {' '}
            for you
          </span>
          {unreadCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="crm-ann-panel__stat crm-ann-panel__stat--new">
                <strong>{unreadCount}</strong>
                {' '}
                new
              </span>
            </>
          )}
        </div>
        {canManage && (
          <Link
            to={MASTER_ROUTE}
            onClick={() => onClose?.()}
            className="crm-ann-panel__manage"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Manage
          </Link>
        )}
      </div>

      <p className="px-4 py-1.5 text-[10px] text-text-muted border-b border-border/60">
        Showing announcements for
        {' '}
        <span className="font-semibold text-text-secondary">{roleLabel}</span>
      </p>

      <div className="crm-ann-panel__list">
        {loading ? (
          <p className="py-10 text-center text-sm text-text-muted">Loading announcements…</p>
        ) : items.length === 0 ? (
          <div className="crm-ann-empty">
            <div className="crm-ann-empty__icon">
              <FiVolume2 className="w-6 h-6" />
            </div>
            <p className="crm-ann-empty__title">No announcements</p>
            <p className="crm-ann-empty__hint">
              {canManage
                ? 'Publish from Master → Communication → Announcements. Upload images or share files with your audience.'
                : 'New notices for your role will appear here and in Notifications.'}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isOpen = openId === item.id;
            const unread = isAnnouncementUnread(user?.id, item);
            const heroUrl = resolveUploadSrc(getAnnouncementHeroImage(item));

            return (
              <article
                key={item.id}
                className={`crm-ann-card ${isOpen ? 'crm-ann-card--open' : ''} ${unread ? 'crm-ann-card--unread' : ''}`}
              >
                <button
                  type="button"
                  className="crm-ann-card__toggle"
                  onClick={() => openAnnouncement(item)}
                >
                  {(isOpen || heroUrl) && (
                    <div className="crm-ann-card__hero">
                      {heroUrl ? (
                        <img src={heroUrl} alt="" loading="lazy" />
                      ) : (
                        <div className="crm-ann-card__hero-fallback">
                          <FiImage className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="crm-ann-card__body">
                    <div className="crm-ann-card__meta">
                      <div className="crm-ann-card__badges">
                        <span className="crm-ann-badge crm-ann-badge--audience">
                          <FiUsers className="w-3 h-3" />
                          {item.audienceLabel || 'All staff'}
                        </span>
                        {unread && (
                          <span className="crm-ann-badge crm-ann-badge--new">New</span>
                        )}
                      </div>
                      <span className="crm-ann-card__date">
                        {formatDate(item.publishedAt || item.updatedAt)}
                      </span>
                    </div>

                    <p className="crm-ann-card__title">{item.title}</p>
                    {item.subtitle && (
                      <p className="crm-ann-card__subtitle">{item.subtitle}</p>
                    )}

                    {isOpen && (
                      <>
                        <p className="crm-ann-card__excerpt">
                          {item.body || 'No details added yet.'}
                        </p>
                        {(item.attachments || []).length > 0 && (
                          <div className="crm-ann-card__attachments">
                            <AnnouncementAttachmentList
                              attachments={item.attachments}
                              compact
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </button>
              </article>
            );
          })
        )}
      </div>

      {items.length > 0 && (
        <div className="crm-ann-panel__footer">
          <button
            type="button"
            className="crm-ann-panel__footer-btn"
            onClick={async () => {
              await Promise.all(items.map((item) => trackAnnouncementView(user?.id, item)));
              setRefreshKey((k) => k + 1);
              onClose?.();
            }}
          >
            Mark all as seen
          </button>
        </div>
      )}
    </div>
  );
}
