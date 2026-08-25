import { useEffect, useState } from 'react';
import { FiChevronDown, FiExternalLink, FiVolume2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { masterApi } from '../../../features/master/services/masterApi.service';
import dayjs from 'dayjs';

const MASTER_ROUTE = '/admin/master/announcements';

function mapRecord(row) {
  return {
    id: row.id,
    title: row.name || row.subject || 'Announcement',
    date: row.updatedAt && dayjs(row.updatedAt).isValid() ? dayjs(row.updatedAt).format('DD MMM YYYY') : '',
    excerpt: row.body || row.description || '',
  };
}

export default function AnnouncementPanel({ onClose }) {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await masterApi.list('communication-template', {
          channel: 'ANNOUNCEMENT',
          status: 'active',
          pageSize: 20,
          sort: 'updatedAt',
          sortDirection: 'desc',
        });
        const rows = (res?.data || []).map(mapRecord);
        if (!cancelled) {
          setItems(rows);
          setOpenId(rows[0]?.id || null);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setOpenId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <div className="px-4 pt-3 pb-2 border-b border-border bg-page/40 flex items-center justify-between gap-2">
        <p className="text-[12px] text-text-secondary">
          <span className="font-semibold text-text">{items.length}</span>
          {' '}
          published
        </p>
        <Link
          to={MASTER_ROUTE}
          onClick={() => onClose?.()}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-brand"
        >
          <FiExternalLink className="w-3.5 h-3.5" />
          Manage
        </Link>
      </div>

      <div className="px-2 py-2">
        {loading ? (
          <p className="py-10 text-center text-sm text-text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-10 text-center px-4">
            <FiVolume2 className="w-9 h-9 text-text-muted mx-auto mb-2 opacity-45" />
            <p className="text-sm font-medium text-text">No announcements</p>
            <p className="text-[12px] text-text-muted mt-1">
              Publish from Master → Communication → Announcement.
            </p>
          </div>
        ) : (
          <ul className="space-y-1 max-h-[400px] overflow-y-auto no-scrollbar">
            {items.map((item) => {
              const isOpen = openId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                      isOpen
                        ? 'border-info/20 bg-info-soft/40'
                        : 'border-transparent hover:bg-row-hover'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-info-soft text-info shrink-0">
                        <FiVolume2 className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-text line-clamp-1">{item.title}</p>
                          <FiChevronDown
                            className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                        {item.date && (
                          <p className="text-[10px] text-text-muted mt-0.5">{item.date}</p>
                        )}
                        {isOpen && (
                          <p className="mt-2 text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                            {item.excerpt || 'No details added yet.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
