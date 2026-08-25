import { useEffect, useState } from 'react';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import GlobalLoader from '../../components/ui/GlobalLoader';

export default function StudentApplicationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.APPLICATIONS, { limit: 50 })
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

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text">My Applications</h2>
        <p className="text-text-secondary mt-1">Applications linked to your student record only.</p>
      </div>
      <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-left">
            <tr>
              <th className="px-4 py-2">University / Course</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="px-4 py-6 text-text-secondary" colSpan={2}>No applications yet.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-2">{row.university || row.course || row.applicationCode || 'Application'}</td>
                <td className="px-4 py-2">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
