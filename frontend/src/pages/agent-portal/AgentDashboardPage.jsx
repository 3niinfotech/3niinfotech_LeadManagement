import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import GlobalLoader from '../../components/ui/GlobalLoader';

export default function AgentDashboardPage() {
  const user = useSelector(selectUser);
  const [stats, setStats] = useState({ total: 0, students: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.STUDENTS, { limit: 100 })
      .then((res) => {
        if (!cancelled) {
          const students = res.data || [];
          setStats({ total: students.length, students: students.slice(0, 5) });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold text-text mb-2">Welcome, {user?.firstName}</h2>
      <p className="text-text-secondary mb-8">
        Branch: {user?.branch?.name || '—'} · {user?.company?.name}
      </p>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-card-bg border border-card-border rounded-lg p-5 shadow-card">
          <p className="text-sm text-text-secondary">Referred Students</p>
          <p className="text-3xl font-semibold text-text mt-1">{stats.total}</p>
        </div>
      </div>
      {stats.students.length > 0 && (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 shadow-card">
          <h3 className="font-semibold text-text mb-4">Recent Students</h3>
          <ul className="divide-y divide-card-border">
            {stats.students.map((s) => (
              <li key={s.id} className="py-3 flex justify-between text-sm">
                <span className="font-medium text-text">{s.firstName} {s.lastName}</span>
                <span className="text-text-secondary">{s.studentCode} · {s.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
