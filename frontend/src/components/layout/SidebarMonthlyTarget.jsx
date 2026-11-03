import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { FiTarget } from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';

function fmtMoney(value) {
  const n = Number(value) || 0;
  return `₹ ${n.toLocaleString('en-IN')}`;
}

function readCssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Theme-aware monthly target card for counsellor / team_leader sidebar. */
export default function SidebarMonthlyTarget({ collapsed = false }) {
  const [target, setTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiGet(API.DASHBOARD_MY_TARGET);
      setTarget(res?.data || null);
    } catch {
      setTarget(null);
    }
  }, []);

  useEffect(() => {
    load();

    const handleUpdate = () => {
      load();
    };

    window.addEventListener('crm-dashboard-update', handleUpdate);
    window.addEventListener('crm-target-update', handleUpdate);
    window.addEventListener('visibilitychange', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load();
      }
    }, 25000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('crm-dashboard-update', handleUpdate);
      window.removeEventListener('crm-target-update', handleUpdate);
      window.removeEventListener('visibilitychange', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [load]);

  const brand = useMemo(() => readCssVar('--brand', '#2563eb'), [target]);
  const track = useMemo(
    () => readCssVar('--border', 'rgba(148, 163, 184, 0.45)'),
    [target],
  );

  if (!target) return null;

  const percent = Math.min(100, Math.max(0, Number(target.percent) || 0));
  const remaining = Math.max(0, 100 - percent);
  const pie = [
    { name: 'done', value: percent || 0.01 },
    { name: 'left', value: remaining || 0.01 },
  ];

  if (collapsed) {
    return (
      <Link
        to={ROUTES.DASHBOARD}
        className="sidebar-monthly-target sidebar-monthly-target--compact"
        title={`Monthly Target ${percent}%`}
        aria-label={`Monthly target ${percent} percent`}
      >
        <FiTarget aria-hidden />
        <span>{percent}%</span>
      </Link>
    );
  }

  return (
    <div className="sidebar-monthly-target">
      <div className="sidebar-monthly-target__head">
        <span className="sidebar-monthly-target__icon" aria-hidden>
          <FiTarget />
        </span>
        <div>
          <p className="sidebar-monthly-target__title">{target.label || 'Monthly Target'}</p>
          <Link to={ROUTES.DASHBOARD} className="sidebar-monthly-target__link">
            View Details
          </Link>
        </div>
      </div>

      <div className="sidebar-monthly-target__chart" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pie}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={38}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              cornerRadius={3}
            >
              <Cell fill={brand} />
              <Cell fill={track} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <strong className="sidebar-monthly-target__pct">{percent}%</strong>
      </div>

      <p className="sidebar-monthly-target__amounts">
        {fmtMoney(target.achieved)}
        <span> / {fmtMoney(target.goal)}</span>
      </p>
      <p className="sidebar-monthly-target__caption">Target Progress</p>
    </div>
  );
}
