import { useEffect, useMemo, useState } from 'react';
import { FiClock, FiRefreshCw, FiSearch } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import TableLoader from '../../../components/ui/TableLoader';
import { rbacService } from '../../../services/rbac/rbac.service';
import { formatRoleActivityEntry } from '../config/roleActivityLabels';
import toastService from '../../../services/toast/toast.service';

const LOG_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'success', label: 'Allowed' },
  { id: 'danger', label: 'Removed' },
  { id: 'neutral', label: 'Updates' },
];

export default function RoleActivityTimeline({ roleId, roleName }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    if (!roleId) return;
    setLoading(true);
    try {
      const data = await rbacService.getHistory(roleId);
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Could not load activity history');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [roleId]);

  const entries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs
      .map((entry) => formatRoleActivityEntry(entry, roleName))
      .filter((item) => {
        if (filter !== 'all') {
          if (filter === 'neutral') {
            if (item.tone !== 'neutral' && item.tone !== 'warning') return false;
          } else if (item.tone !== filter) return false;
        }
        if (!q) return true;
        return item.text.toLowerCase().includes(q);
      });
  }, [logs, roleName, search, filter]);

  if (loading && !logs.length) {
    return <TableLoader rows={4} columns={1} showCheckbox={false} showPagination={false} />;
  }

  return (
    <div className="crm-role-activity">
      <div className="crm-role-activity__head">
        <div>
          <h3 className="crm-role-activity__title">Access history</h3>
          <p className="crm-role-activity__subtitle">Who changed what and when — in plain English</p>
        </div>
        <Button size="sm" variant="secondary" icon={FiRefreshCw} onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      <div className="crm-role-activity__toolbar">
        <div className="crm-role-activity__filters" role="group" aria-label="Filter activity">
          {LOG_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`crm-role-activity__filter ${filter === id ? 'crm-role-activity__filter--active' : ''} ${id !== 'all' ? `crm-role-activity__filter--${id}` : ''}`}
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="crm-role-activity__search">
          <FiSearch size={14} className="crm-role-activity__search-icon" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history…"
            className="crm-role-activity__search-input"
          />
        </div>
      </div>

      {!entries.length ? (
        <div className="crm-role-activity__empty">
          <FiClock size={28} />
          <p>{logs.length ? 'No matching activity.' : 'No activity recorded yet for this role.'}</p>
        </div>
      ) : (
        <ol className="crm-role-activity__list">
          {entries.map((item, idx) => (
            <li key={`${item.when}-${idx}`} className={`crm-role-activity__item crm-role-activity__item--${item.tone}`}>
              <span className={`crm-role-activity__dot crm-role-activity__dot--${item.tone}`} aria-hidden />
              <div className="crm-role-activity__body">
                <p className="crm-role-activity__text">{item.text}</p>
                <time className="crm-role-activity__time" dateTime={item.when}>{item.when}</time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
