import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import GlobalLoader from '../../components/ui/GlobalLoader';

export default function AgentStudentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.STUDENTS, { limit: 100 })
      .then((res) => {
        if (!cancelled) setRows(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const byStatus = useMemo(() => {
    const counts = {};
    rows.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return counts;
  }, [rows]);

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text">My Students</h2>
        <p className="text-text-secondary mt-1">Students referred by your agency only.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="bg-card-bg border border-card-border rounded-lg px-4 py-3">
          <p className="text-xs text-text-secondary">Total</p>
          <p className="text-xl font-semibold">{rows.length}</p>
        </div>
        {Object.entries(byStatus).map(([status, count]) => (
          <div key={status} className="bg-card-bg border border-card-border rounded-lg px-4 py-3">
            <p className="text-xs text-text-secondary">{status}</p>
            <p className="text-xl font-semibold">{count}</p>
          </div>
        ))}
      </div>
      <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-left">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Course</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-text-secondary" colSpan={4}>No referred students yet.</td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-2 tabular-nums">{s.studentCode}</td>
                <td className="px-4 py-2">{s.firstName} {s.lastName}</td>
                <td className="px-4 py-2">{s.course || '—'}</td>
                <td className="px-4 py-2">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
