import { useEffect, useState } from 'react';
import { FiClock, FiEye, FiUser, FiUsers } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { announcementApi } from '../services/announcementApi.service';

function formatWhen(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AnnouncementViewersDrawer({ open, announcement, onClose }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !announcement?.id) {
      setData(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    announcementApi.getViewers(announcement.id)
      .then((res) => {
        if (!cancelled) setData(res?.data || null);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, announcement?.id]);

  const stats = data || {};
  const viewers = stats.viewers || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Announcement reach"
      subtitle={announcement?.name || stats.title || 'Who viewed this notice'}
      size="md"
      footer={(
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      )}
    >
      <div className="crm-ann-reach">
        <div className="crm-ann-reach__stats">
          <div className="crm-ann-reach__stat">
            <FiUsers className="w-4 h-4" />
            <div>
              <strong>{stats.audienceSize ?? 0}</strong>
              <span>Notified</span>
            </div>
          </div>
          <div className="crm-ann-reach__stat crm-ann-reach__stat--primary">
            <FiEye className="w-4 h-4" />
            <div>
              <strong>{stats.viewCount ?? 0}</strong>
              <span>Viewed</span>
            </div>
          </div>
          <div className="crm-ann-reach__stat">
            <div>
              <strong>{stats.viewPercent ?? 0}%</strong>
              <span>Reach</span>
            </div>
          </div>
        </div>

        {stats.lastNotifiedAt && (
          <p className="crm-ann-reach__meta">
            <FiClock className="w-3.5 h-3.5" />
            Last notified {formatWhen(stats.lastNotifiedAt)}
          </p>
        )}

        <div className="crm-ann-reach__list-head">
          <h4>Viewers ({viewers.length})</h4>
          {(stats.notViewedCount ?? 0) > 0 && (
            <span className="crm-ann-reach__pending">
              {stats.notViewedCount} not viewed yet
            </span>
          )}
        </div>

        {loading ? (
          <p className="crm-ann-reach__empty">Loading viewers…</p>
        ) : viewers.length === 0 ? (
          <p className="crm-ann-reach__empty">No views recorded yet. Views appear when users open this announcement.</p>
        ) : (
          <ul className="crm-ann-reach__list">
            {viewers.map((viewer) => (
              <li key={viewer.id} className="crm-ann-reach__row">
                <span className="crm-ann-reach__avatar"><FiUser className="w-3.5 h-3.5" /></span>
                <div className="crm-ann-reach__info">
                  <p className="crm-ann-reach__name">{viewer.name}</p>
                  <p className="crm-ann-reach__role">{viewer.role} · {viewer.email}</p>
                </div>
                <time className="crm-ann-reach__time">{formatWhen(viewer.viewedAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
